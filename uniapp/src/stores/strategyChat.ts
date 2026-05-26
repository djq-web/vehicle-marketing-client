import { defineStore } from "pinia";
import { ApiError, request, upload } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import type {
  AgentChatMessageResponse,
  AgentChatSessionResponse,
  AgentChatSessionsResponse,
  AgentMessage,
  PendingFrameworkUpdate,
  StrategyChatResponse,
  StrategyChatSessionResponse,
  StrategyChatSessionSummary,
  StrategyFileUploadResponse,
} from "@/types/strategy";

const BASE_CHAT_AGENT_CODE = "base_chat_agent";
const STRATEGY_AGENT_CODE = "strategy_agent";

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
        this.resetUnavailableState("当前账号不是企业租户账号，无法使用会话功能");
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
        isActive: session.id === result.sessionId,
      }));

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
              title: "新的聊天",
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
  },
});
