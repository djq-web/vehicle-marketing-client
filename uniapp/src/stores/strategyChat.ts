import { defineStore } from "pinia";
import {
  API_LONG_REQUEST_TIMEOUT_MS,
  ApiError,
  request,
  upload,
} from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import type {
  AgentChatMessageResponse,
  AgentChatSessionResponse,
  AgentChatSessionsResponse,
  AgentMessage,
  AgentMessageResponse,
  PendingFrameworkUpdate,
  StrategyChatResponse,
  StrategyChatSessionResponse,
  StrategyChatSessionSummary,
  StrategyFileUploadResponse,
  StrategyReportResponse,
} from "@/types/strategy";

const BASE_CHAT_AGENT_CODE = "base_chat_agent";
const STRATEGY_AGENT_CODE = "strategy_agent";
const PROCESSING_POLL_INTERVAL_MS = 2500;
const PROCESSING_POLL_MAX_ATTEMPTS = 160;
const TITLE_REFRESH_POLL_INTERVAL_MS = 2500;
const TITLE_REFRESH_POLL_MAX_ATTEMPTS = 8;

const activeProcessingPolls = new Set<string>();
const activeTitleRefreshPolls = new Set<string>();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type UploadCandidate = {
  filePath: string;
  fileName?: string;
};

export const useStrategyChatStore = defineStore("strategy-chat", {
  state: () => ({
    diagnosisId: null as string | null,
    sessionId: null as string | null,
    activeAgentCode: BASE_CHAT_AGENT_CODE,
    sessions: [] as StrategyChatSessionSummary[],
    messages: [] as AgentMessage[],
    pendingFrameworkUpdate: null as PendingFrameworkUpdate | null,
    loading: false,
    uploading: false,
    initialized: false,
    error: "",
    unavailableReason: "",
  }),
  getters: {
    currentSession: (state) =>
      state.sessions.find((session) => session.id === state.sessionId) ?? null,
  },
  actions: {
    getTenantId() {
      return useAuthStore().tenantId;
    },
    isClientAccount() {
      const authStore = useAuthStore();
      if (authStore.isTenantUser) {
        return Boolean(authStore.tenantId);
      }

      return Boolean(
        authStore.user?.isBootstrap || authStore.user?.role === "ADMIN",
      );
    },
    resetUnavailableState(reason = "") {
      this.unavailableReason = reason;
      this.error = "";
      this.sessions = [];
      this.messages = [];
      this.pendingFrameworkUpdate = null;
      this.diagnosisId = null;
      this.sessionId = null;
      this.activeAgentCode = BASE_CHAT_AGENT_CODE;
    },
    isStrategyEntitlementDenied(err: unknown) {
      return (
        err instanceof ApiError &&
        err.status === 403 &&
        typeof err.detail === "object" &&
        err.detail !== null &&
        "missingProductCodes" in err.detail
      );
    },
    ensureClientStrategyAvailable() {
      if (!this.isClientAccount()) {
        throw new Error("当前账号不是企业租户账号，无法使用会话功能");
      }

      if (this.unavailableReason) {
        throw new Error(this.unavailableReason);
      }
    },
    async initialize() {
      if (this.initialized) {
        return;
      }

      this.initialized = true;

      if (!this.isClientAccount()) {
        this.resetUnavailableState(
          "当前账号不是企业租户账号，无法使用会话功能",
        );
        return;
      }

      await this.loadSessions();

      if (this.sessionId) {
        await this.loadSession(this.sessionId);
      }
    },
    async loadSessions() {
      const result = await request<AgentChatSessionsResponse>(
        "/agent/sessions",
        {
          query: {
            tenantId: this.getTenantId(),
          },
        },
      );

      this.sessions = result.sessions.map((session) => ({
        ...session,
        isActive: session.id === this.sessionId,
      }));

      if (!this.sessionId && result.sessions.length) {
        this.sessionId = result.sessions[0].id;
      }
    },
    async loadSession(targetSessionId?: string | null) {
      const resolvedSessionId = targetSessionId ?? this.sessionId;
      if (!resolvedSessionId) {
        this.sessionId = null;
        this.messages = [];
        this.pendingFrameworkUpdate = null;
        this.activeAgentCode = BASE_CHAT_AGENT_CODE;
        return;
      }

      const result = await request<AgentChatSessionResponse>(
        `/agent/sessions/${encodeURIComponent(resolvedSessionId)}`,
      );

      this.sessionId = result.sessionId;
      this.messages = result.messages;
      this.activeAgentCode = result.session?.agentCode || BASE_CHAT_AGENT_CODE;
      this.sessions = this.sessions.map((session) => ({
        ...session,
        ...(session.id === result.sessionId && result.session
          ? result.session
          : {}),
        isActive: session.id === result.sessionId,
      }));
      if (result.sessionId) {
        this.startProcessingMessagePolls(result.sessionId);
      }

      if (this.activeAgentCode === STRATEGY_AGENT_CODE) {
        await this.loadStrategySessionState(result.sessionId);
      } else {
        this.pendingFrameworkUpdate = null;
      }
    },
    async createSession() {
      this.ensureClientStrategyAvailable();
      this.error = "";
      this.loading = true;

      try {
        const result = await request<AgentChatSessionResponse>(
          "/agent/sessions",
          {
            method: "POST",
            data: {
              tenantId: this.getTenantId(),
              agentCode: BASE_CHAT_AGENT_CODE,
            },
          },
        );

        this.sessionId = result.sessionId;
        this.messages = result.messages;
        this.pendingFrameworkUpdate = null;
        this.activeAgentCode = BASE_CHAT_AGENT_CODE;
        await this.loadSessions();
      } catch (err) {
        this.error = err instanceof Error ? err.message : "创建会话失败";
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async selectSession(sessionId: string) {
      this.ensureClientStrategyAvailable();
      this.sessionId = sessionId;
      await this.loadSession(sessionId);
    },
    async sendBase(content: string) {
      this.ensureClientStrategyAvailable();
      const normalized = content.trim();

      if (!normalized || this.loading || this.uploading) {
        return;
      }

      this.error = "";
      this.loading = true;

      try {
        if (!this.sessionId) {
          await this.createSession();
        }

        const result = await request<AgentChatMessageResponse>(
          `/agent/sessions/${encodeURIComponent(this.sessionId ?? "")}/messages`,
          {
            method: "POST",
            data: {
              content: normalized,
            },
          },
        );

        this.sessionId = result.sessionId;
        this.activeAgentCode = result.agentCode || BASE_CHAT_AGENT_CODE;
        this.messages = [
          ...this.messages,
          result.userMessage,
          result.assistantMessage,
        ];
        await this.loadSessions();
        await this.loadSession(result.sessionId);
        this.startSessionTitleRefreshPoll(result.sessionId);
      } catch (err) {
        this.error = err instanceof Error ? err.message : "发送失败";
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async sendStrategy(content: string) {
      this.ensureClientStrategyAvailable();
      const normalized = content.trim();

      if (!normalized || this.loading || this.uploading) {
        return;
      }

      this.error = "";
      this.loading = true;
      this.activeAgentCode = STRATEGY_AGENT_CODE;

      try {
        const result = await request<StrategyChatResponse>("/strategy/chat", {
          method: "POST",
          data: {
            tenantId: this.getTenantId(),
            sessionId: this.sessionId ?? undefined,
            content: normalized,
          },
          timeout: API_LONG_REQUEST_TIMEOUT_MS,
        });

        this.diagnosisId = result.diagnosisId;
        this.sessionId = result.sessionId;
        this.messages = [
          ...this.messages,
          result.userMessage,
          result.assistantMessage,
        ];
        await this.loadSessions();
        await this.loadSession(result.sessionId);
        await this.loadStrategySessionState(result.sessionId);
        this.startProcessingMessagePoll(
          result.sessionId,
          result.assistantMessage,
        );
        this.startSessionTitleRefreshPoll(result.sessionId);
      } catch (err) {
        this.error = this.isStrategyEntitlementDenied(err)
          ? "当前企业未开通战略智能体权益"
          : err instanceof Error
            ? err.message
            : "发送失败";
        throw err;
      } finally {
        this.loading = false;
      }
    },
    isProcessingMessage(message?: AgentMessage | null) {
      if (!message?.metadata) {
        return false;
      }

      const card = message.metadata.card;

      return (
        message.metadata.processing === true ||
        (typeof card === "object" &&
          card !== null &&
          "processing" in card &&
          card.processing === true)
      );
    },
    replaceMessage(message: AgentMessage) {
      const index = this.messages.findIndex((item) => item.id === message.id);

      if (index === -1) {
        return false;
      }

      this.messages.splice(index, 1, message);
      return true;
    },
    getSessionTitleSource(session?: StrategyChatSessionSummary | null) {
      const titleSource = session?.metadata?.titleSource;

      return typeof titleSource === "string" ? titleSource : "";
    },
    isSessionTitleFinal(session?: StrategyChatSessionSummary | null) {
      const titleSource = this.getSessionTitleSource(session);

      return titleSource === "llm" || titleSource === "manual";
    },
    startSessionTitleRefreshPoll(sessionId?: string | null) {
      if (!sessionId || activeTitleRefreshPolls.has(sessionId)) {
        return;
      }

      activeTitleRefreshPolls.add(sessionId);
      void this.pollSessionTitleRefresh(sessionId).finally(() =>
        activeTitleRefreshPolls.delete(sessionId),
      );
    },
    async pollSessionTitleRefresh(sessionId: string) {
      for (
        let attempt = 0;
        attempt < TITLE_REFRESH_POLL_MAX_ATTEMPTS;
        attempt += 1
      ) {
        await delay(TITLE_REFRESH_POLL_INTERVAL_MS);

        try {
          await this.loadSessions();
        } catch {
          continue;
        }

        const session = this.sessions.find((item) => item.id === sessionId);

        if (!session || this.isSessionTitleFinal(session)) {
          return;
        }
      }
    },
    startProcessingMessagePoll(
      sessionId: string,
      assistantMessage?: AgentMessage | null,
    ) {
      if (!assistantMessage || !this.isProcessingMessage(assistantMessage)) {
        return;
      }

      if (activeProcessingPolls.has(assistantMessage.id)) {
        return;
      }

      activeProcessingPolls.add(assistantMessage.id);
      void this.pollProcessingMessage(sessionId, assistantMessage.id).finally(
        () => activeProcessingPolls.delete(assistantMessage.id),
      );
    },
    startProcessingMessagePolls(sessionId: string) {
      this.messages
        .filter((message) => this.isProcessingMessage(message))
        .forEach((message) =>
          this.startProcessingMessagePoll(sessionId, message),
        );
    },
    async pollProcessingMessage(sessionId: string, messageId: string) {
      for (
        let attempt = 0;
        attempt < PROCESSING_POLL_MAX_ATTEMPTS;
        attempt += 1
      ) {
        await delay(PROCESSING_POLL_INTERVAL_MS);

        if (this.sessionId !== sessionId) {
          return;
        }

        try {
          const result = await request<AgentMessageResponse>(
            `/agent/sessions/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}`,
          );

          this.replaceMessage(result.message);
        } catch {
          continue;
        }

        const latestMessage = this.messages.find(
          (message) => message.id === messageId,
        );

        if (!this.isProcessingMessage(latestMessage)) {
          await this.loadStrategySessionState(sessionId);
          this.startSessionTitleRefreshPoll(sessionId);
          return;
        }
      }
    },
    async enterStrategy() {
      if (!this.sessionId) {
        await this.createSession();
      }

      this.activeAgentCode = STRATEGY_AGENT_CODE;
      await this.sendStrategy("开始战略诊断");
    },
    async loadStrategySessionState(sessionId?: string | null) {
      const resolvedSessionId = sessionId ?? this.sessionId;

      if (!resolvedSessionId) {
        return;
      }

      try {
        const result = await request<StrategyChatSessionResponse>(
          "/strategy/chat/session",
          {
            query: {
              tenantId: this.getTenantId(),
              sessionId: resolvedSessionId,
            },
          },
        );

        this.diagnosisId = result.diagnosisId;
        this.pendingFrameworkUpdate = result.pendingFrameworkUpdate;
      } catch (err) {
        if (this.isStrategyEntitlementDenied(err)) {
          this.pendingFrameworkUpdate = null;
          return;
        }

        throw err;
      }
    },
    async uploadMaterial(file: UploadCandidate) {
      this.ensureClientStrategyAvailable();
      if (this.loading || this.uploading) {
        return;
      }

      this.error = "";
      this.uploading = true;
      this.activeAgentCode = STRATEGY_AGENT_CODE;

      try {
        const formData: Record<string, string> = {};
        const tenantId = this.getTenantId();

        if (tenantId) {
          formData.tenantId = tenantId;
        }

        if (this.sessionId) {
          formData.sessionId = this.sessionId;
        }

        const result = await upload<StrategyFileUploadResponse>(
          "/strategy/files/upload",
          {
            filePath: file.filePath,
            fileName: file.fileName,
            formData,
            timeout: API_LONG_REQUEST_TIMEOUT_MS,
          },
        );

        this.diagnosisId = result.diagnosisId;
        this.sessionId = result.sessionId;
        this.messages = [
          ...this.messages,
          result.userMessage,
          result.assistantMessage,
        ];
        await this.loadSessions();
        await this.loadSession(result.sessionId);
        await this.loadStrategySessionState(result.sessionId);
        this.startSessionTitleRefreshPoll(result.sessionId);
      } catch (err) {
        this.error = this.isStrategyEntitlementDenied(err)
          ? "当前企业未开通战略智能体权益"
          : err instanceof Error
            ? err.message
            : "上传失败";
        throw err;
      } finally {
        this.uploading = false;
      }
    },
    async openReport(
      type: string,
      options: { diagnosisId?: string | null } = {},
    ) {
      this.ensureClientStrategyAvailable();

      if (!type || this.loading || this.uploading) {
        return null;
      }

      this.error = "";
      this.loading = true;

      try {
        const targetDiagnosisId = options.diagnosisId || undefined;
        const isCurrentDiagnosisReport =
          !targetDiagnosisId || targetDiagnosisId === this.diagnosisId;
        let result = await request<StrategyReportResponse>(
          `/strategy/reports/${encodeURIComponent(type)}`,
          {
            query: {
              tenantId: this.getTenantId(),
              diagnosisId: targetDiagnosisId,
            },
          },
        );

        if (result.report.needsSync && isCurrentDiagnosisReport) {
          await request("/strategy/reports/sync", {
            method: "POST",
            data: {
              tenantId: this.getTenantId(),
              types: [type],
            },
            timeout: API_LONG_REQUEST_TIMEOUT_MS,
          });
          result = await request<StrategyReportResponse>(
            `/strategy/reports/${encodeURIComponent(type)}`,
            {
              query: {
                tenantId: this.getTenantId(),
                diagnosisId: targetDiagnosisId,
              },
            },
          );
        }

        if (isCurrentDiagnosisReport) {
          this.diagnosisId = result.diagnosisId;
        }

        return result;
      } catch (err) {
        this.error = err instanceof Error ? err.message : "读取报告失败";
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
