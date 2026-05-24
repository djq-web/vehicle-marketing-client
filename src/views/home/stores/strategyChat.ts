import { defineStore } from "pinia";
import { ApiError, request } from "@/services/api";
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
  StrategyReportResponse,
} from "@/types/strategy";

const BASE_CHAT_AGENT_CODE = "base_chat_agent";
const STRATEGY_AGENT_CODE = "strategy_agent";

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
    isClientStrategyAccount() {
      return this.isClientAccount();
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
            body: {
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
    async send(content: string) {
      await this.sendBase(content);
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
          const created = await request<AgentChatSessionResponse>(
            "/agent/sessions",
            {
              method: "POST",
              body: {
                tenantId: this.getTenantId(),
                title: "新的聊天",
                agentCode: BASE_CHAT_AGENT_CODE,
              },
            },
          );
          this.sessionId = created.sessionId;
          this.activeAgentCode = BASE_CHAT_AGENT_CODE;
        }

        const result = await request<AgentChatMessageResponse>(
          `/agent/sessions/${encodeURIComponent(this.sessionId ?? "")}/messages`,
          {
            method: "POST",
            body: {
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
          body: {
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
        if (this.isStrategyEntitlementDenied(err)) {
          this.error = "当前企业未开通战略智能体权益";
        } else {
          this.error = err instanceof Error ? err.message : "发送失败";
        }
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
    async uploadFile(file: File) {
      this.ensureClientStrategyAvailable();
      if (this.loading || this.uploading) {
        return;
      }

      this.error = "";
      this.uploading = true;
      this.activeAgentCode = STRATEGY_AGENT_CODE;

      try {
        const formData = new FormData();
        const tenantId = this.getTenantId();

        if (tenantId) {
          formData.append("tenantId", tenantId);
        }

        if (this.sessionId) {
          formData.append("sessionId", this.sessionId);
        }

        formData.append("file", file);

        const result = await request<StrategyFileUploadResponse>(
          "/strategy/files/upload",
          {
            method: "POST",
            body: formData,
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
        if (this.isStrategyEntitlementDenied(err)) {
          this.error = "当前企业未开通战略智能体权益";
        } else {
          this.error = err instanceof Error ? err.message : "上传失败";
        }
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
        return;
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
            body: {
              tenantId: this.getTenantId(),
              types: [type],
            },
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

        const title = result.report.title || "战略报告";
        const message: AgentMessage = {
          id: `local-report-${result.report.type}-${Date.now()}`,
          sessionId: this.sessionId ?? "local",
          role: "ASSISTANT",
          content: `已为您打开《${title}》。`,
          metadata: {
            source: "strategy_report_detail",
            tenantId: result.tenantId,
            diagnosisId: result.diagnosisId,
            ui: result.ui,
            card: {
              reason: "strategy_report",
              tenantId: result.tenantId,
              diagnosisId: result.diagnosisId,
              ui: result.ui,
              report: result.report,
              nextActions: result.nextActions,
            },
          },
          createdAt: new Date().toISOString(),
        };

        this.messages = [...this.messages, message];
      } catch (err) {
        this.error = err instanceof Error ? err.message : "读取报告失败";
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
