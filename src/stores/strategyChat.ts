import { defineStore } from "pinia";
import {
  API_LONG_REQUEST_TIMEOUT_MS,
  ApiError,
  download,
  getUserErrorMessage,
  request,
  streamRequest,
  upload,
  uploadBrowserFile,
  uploadBrowserFiles,
  uploadFiles,
} from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import type {
  MaterialAssetsResponse,
  MaterialAsset,
  MaterialChatResponse,
  MaterialChatAttachment,
  MaterialConfirmState,
  MaterialDraft,
  MaterialDraftsResponse,
  MaterialMessageCardPayload,
  MaterialUploadFileItem,
  MaterialUploadFilesResponse,
} from "@/types/material";
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

const STRATEGY_AGENT_CODE = "strategy_agent";
const BASE_CHAT_AGENT_CODE = "base_chat_agent";
const MATERIAL_AGENT_CODE = "material_agent";
const PROCESSING_POLL_INTERVAL_MS = 2500;
const PROCESSING_POLL_MAX_ATTEMPTS = 160;
const TITLE_REFRESH_POLL_INTERVAL_MS = 2500;
const TITLE_REFRESH_POLL_MAX_ATTEMPTS = 8;

const activeProcessingPolls = new Set<string>();
const activeTitleRefreshPolls = new Set<string>();
const activeAsyncResponsePolls = new Set<string>();

type AgentStreamChunk = {
  id: string;
  sessionId: string;
  agentCode: string;
  type: string;
  payload?: Record<string, unknown>;
  createdAt: string;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveAgentCode(agentCode?: string | null) {
  return agentCode || BASE_CHAT_AGENT_CODE;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return {};
    }
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isMaterialUiType(type?: string | null) {
  return Boolean(type && type.startsWith("material_"));
}

function hasRecordData(value: Record<string, unknown>) {
  return Object.keys(value).length > 0;
}

function resolveMaterialCardTitle(type: string) {
  const titleMap: Record<string, string> = {
    material_drafts: "待确认素材",
    material_draft: "素材草稿",
    material_draft_removed: "素材草稿已移除",
    material_assets: "素材检索结果",
    material_assets_confirmed: "入库完成",
    material_asset: "素材详情",
    material_asset_recycled: "已移入回收站",
    material_assets_recycled: "已批量移入回收站",
    material_asset_restored: "素材已恢复",
    material_stats: "素材库统计",
    material_chat: "素材智能体",
  };

  return titleMap[type] || "素材智能体";
}

function resolveMaterialCardItems<T>(
  source: Record<string, unknown>,
  pluralKey: string,
  singleKey: string,
) {
  const data = asRecord(source.data);
  const payload = asRecord(source.payload);
  const direct = source[pluralKey];
  const fromData = data[pluralKey];
  const fromPayload = payload[pluralKey];
  const single = source[singleKey] ?? data[singleKey] ?? payload[singleKey];

  if (Array.isArray(direct)) {
    return direct as T[];
  }

  if (Array.isArray(fromData)) {
    return fromData as T[];
  }

  if (Array.isArray(fromPayload)) {
    return fromPayload as T[];
  }

  return single ? ([single] as T[]) : [];
}

function resolveMaterialCardRecord(
  source: Record<string, unknown>,
  key: string,
) {
  const direct = asRecord(source[key]);
  if (hasRecordData(direct)) {
    return direct;
  }

  const fromData = asRecord(asRecord(source.data)[key]);
  if (hasRecordData(fromData)) {
    return fromData;
  }

  return asRecord(asRecord(source.payload)[key]);
}

function inferMaterialCardType(input: {
  type?: string | null;
  drafts: MaterialDraft[];
  assets: MaterialAsset[];
  materialTable: Record<string, unknown>;
  stats: Record<string, unknown>;
}) {
  const type = getString(input.type);

  if (isMaterialUiType(type)) {
    return type;
  }

  if (input.drafts.length > 0) {
    return "material_drafts";
  }

  if (input.assets.length > 0 || hasRecordData(input.materialTable)) {
    return "material_assets";
  }

  if (hasRecordData(input.stats)) {
    return "material_stats";
  }

  return "";
}

function normalizeMaterialCard(
  response: Record<string, unknown>,
): MaterialMessageCardPayload | null {
  const ui = asRecord(response.ui);
  const drafts = resolveMaterialCardItems<MaterialDraft>(
    response,
    "drafts",
    "draft",
  );
  const assets = resolveMaterialCardItems<MaterialAsset>(
    response,
    "assets",
    "asset",
  );
  const materialTable = resolveMaterialCardRecord(response, "materialTable");
  const stats = resolveMaterialCardRecord(response, "stats");
  const resolvedType = inferMaterialCardType({
    type: getString(response.type) || getString(ui.type),
    drafts,
    assets,
    materialTable,
    stats,
  });

  if (!resolvedType) {
    return null;
  }

  const data = {
    ...(asRecord(response.data) ?? {}),
    drafts,
    assets,
    materialTable,
    stats,
  };
  const title =
    getString(response.title) || resolveMaterialCardTitle(resolvedType);
  const actions = Array.isArray(response.actions)
    ? (response.actions as MaterialMessageCardPayload["actions"])
    : undefined;

  return {
    ...response,
    type: resolvedType,
    title,
    message: getString(response.message),
    drafts,
    assets: assets as MaterialMessageCardPayload["assets"],
    materialTable: hasRecordData(materialTable) ? materialTable : null,
    stats: hasRecordData(stats) ? stats : null,
    data,
    ...(actions ? { actions } : {}),
  };
}

function withMaterialCard<T extends AgentMessage>(
  message: T,
  response: Record<string, unknown>,
): T {
  const responseMetadata = asRecord(response.metadata);
  const persistedCard = normalizeMaterialCard(asRecord(message.metadata?.card));
  const metadataCard = normalizeMaterialCard(asRecord(responseMetadata.card));
  const card = persistedCard ?? metadataCard ?? normalizeMaterialCard(response);

  if (!card) {
    return message;
  }

  return {
    ...message,
    metadata: {
      ...(message.metadata ?? {}),
      agentCode: MATERIAL_AGENT_CODE,
      ui: {
        ...(asRecord(message.metadata?.ui) ?? {}),
        type: card.type,
        agentCode: MATERIAL_AGENT_CODE,
      },
      card,
    },
  };
}

function hydrateMaterialMessage(message: AgentMessage) {
  const card = normalizeMaterialCard(asRecord(message.metadata?.card));

  if (!card) {
    return message;
  }

  return {
    ...message,
    metadata: {
      ...(message.metadata ?? {}),
      agentCode:
        getString(message.metadata?.agentCode) ||
        getString(card.data?.agentCode) ||
        MATERIAL_AGENT_CODE,
      card,
    },
  };
}

function hydrateMaterialMessages(messages?: AgentMessage[] | null) {
  return (messages ?? []).map((message) => hydrateMaterialMessage(message));
}

function applyPreviousMaterialCards(
  messages: AgentMessage[],
  previousMessages: AgentMessage[],
) {
  const previousCardById = new Map<string, MaterialMessageCardPayload>();

  previousMessages.forEach((message) => {
    const card = getMaterialCard(message);

    if (card) {
      previousCardById.set(message.id, card);
    }
  });

  if (previousCardById.size === 0) {
    return messages;
  }

  return messages.map((message) => {
    if (getMaterialCard(message)) {
      return message;
    }

    const previousCard = previousCardById.get(message.id);

    if (!previousCard) {
      return message;
    }

    return hydrateMaterialMessage({
      ...message,
      metadata: {
        ...(message.metadata ?? {}),
        agentCode: MATERIAL_AGENT_CODE,
        card: previousCard,
      },
    });
  });
}

function getMaterialCard(message: AgentMessage) {
  return normalizeMaterialCard(asRecord(message.metadata?.card));
}

function getMaterialDraftId(draft: MaterialDraft) {
  return draft.id || draft.draftId || "";
}

function isMaterialDraftState(
  draft: MaterialDraft,
  state: MaterialConfirmState,
) {
  return draft.status === state || draft.confirmState === state;
}

function resolveMaterialDraftCardConfirmState(
  drafts: MaterialDraft[],
): MaterialConfirmState {
  const activeDrafts = drafts.filter(
    (draft) => getMaterialDraftId(draft) && draft.status !== "removed",
  );

  if (activeDrafts.length === 0) {
    return "pending";
  }

  if (activeDrafts.every((draft) => isMaterialDraftState(draft, "confirmed"))) {
    return "confirmed";
  }

  if (activeDrafts.every((draft) => isMaterialDraftState(draft, "expired"))) {
    return "expired";
  }

  return "pending";
}

function getMaterialAssetId(asset: MaterialAsset) {
  return asset.id || asset.materialId || "";
}

type UploadCandidate = {
  filePath?: string;
  fileName?: string;
  browserFile?: Blob;
};

type MaterialUploadInput = {
  files: MaterialUploadFileItem[];
  description?: string;
};

type MaterialDraftConfirmChange = {
  draftId: string;
  description?: string;
  directoryName?: string;
  materialName?: string;
  tags?: string[];
};

type OptimisticExchange = {
  requestId: string;
  userMessageId: string;
};

export const useStrategyChatStore = defineStore("strategy-chat", {
  state: () => ({
    diagnosisId: null as string | null,
    diagnosisStatus: null as string | null,
    sessionId: null as string | null,
    activeAgentCode: BASE_CHAT_AGENT_CODE,
    sessions: [] as StrategyChatSessionSummary[],
    messages: [] as AgentMessage[],
    animatedAssistantMessageIds: {} as Record<string, true>,
    pendingFrameworkUpdate: null as PendingFrameworkUpdate | null,
    loading: false,
    uploading: false,
    initialized: false,
    authScopeKey: "",
    error: "",
    unavailableReason: "",
    forceNextStrategySession: false,
  }),
  getters: {
    currentSession: (state) =>
      state.sessions.find((session) => session.id === state.sessionId) ?? null,
  },
  actions: {
    getTenantId() {
      return useAuthStore().tenantId;
    },
    getAuthScopeKey() {
      const authStore = useAuthStore();
      const user = authStore.user;

      if (!user?.sub) {
        return "";
      }

      return [user.sub, user.tenantId ?? "", user.accountType ?? ""].join(":");
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
      this.animatedAssistantMessageIds = {};
      this.pendingFrameworkUpdate = null;
      this.diagnosisId = null;
      this.diagnosisStatus = null;
      this.sessionId = null;
      this.activeAgentCode = BASE_CHAT_AGENT_CODE;
    },
    resetForAccountSwitch() {
      this.diagnosisId = null;
      this.diagnosisStatus = null;
      this.sessionId = null;
      this.activeAgentCode = BASE_CHAT_AGENT_CODE;
      this.sessions = [];
      this.messages = [];
      this.animatedAssistantMessageIds = {};
      this.pendingFrameworkUpdate = null;
      this.loading = false;
      this.uploading = false;
      this.initialized = false;
      this.authScopeKey = "";
      this.error = "";
      this.unavailableReason = "";
      this.forceNextStrategySession = false;
    },
    startNewConversation() {
      this.error = "";
      this.diagnosisId = null;
      this.diagnosisStatus = null;
      this.sessionId = null;
      this.activeAgentCode = BASE_CHAT_AGENT_CODE;
      this.messages = [];
      this.animatedAssistantMessageIds = {};
      this.pendingFrameworkUpdate = null;
      this.forceNextStrategySession = true;
      this.sessions = this.sessions.map((session) => ({
        ...session,
        isActive: false,
      }));
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
      const authScopeKey = this.getAuthScopeKey();

      if (this.initialized && this.authScopeKey === authScopeKey) {
        return;
      }

      if (this.authScopeKey !== authScopeKey) {
        this.resetForAccountSwitch();
      }

      this.initialized = true;
      this.authScopeKey = authScopeKey;

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

      this.sessions = result.sessions;

      const currentSessionExists = this.sessions.some(
        (session) => session.id === this.sessionId,
      );

      if (!currentSessionExists) {
        this.sessionId = null;
        this.messages = [];
        this.pendingFrameworkUpdate = null;
        this.activeAgentCode = BASE_CHAT_AGENT_CODE;
      }

      this.sessions = this.sessions.map((session) => ({
        ...session,
        isActive: session.id === this.sessionId,
      }));
    },
    async loadSession(
      targetSessionId?: string | null,
      options: { preserveAnimations?: boolean } = {},
    ) {
      if (!options.preserveAnimations) {
        this.clearMessageAnimations();
      }

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
      const previousMessages = this.messages;

      this.forceNextStrategySession = false;
      this.sessionId = result.sessionId;
      this.messages = applyPreviousMaterialCards(
        hydrateMaterialMessages(result.messages),
        previousMessages,
      );
      this.activeAgentCode = resolveAgentCode(result.session?.agentCode);
      this.sessions = this.sessions.map((session) => ({
        ...session,
        ...(session.id === result.sessionId && result.session
          ? result.session
          : {}),
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
              agentCode: STRATEGY_AGENT_CODE,
            },
          },
        );

        this.sessionId = result.sessionId;
        this.diagnosisId = result.diagnosisId ?? this.diagnosisId;
        this.messages = hydrateMaterialMessages(result.messages);
        this.markAssistantMessagesForAnimation(this.messages);
        this.pendingFrameworkUpdate = result.pendingFrameworkUpdate ?? null;
        this.activeAgentCode = resolveAgentCode(result.agentCode);
        await this.loadSessions();
      } catch (err) {
        this.error = getUserErrorMessage(err, "创建会话失败");
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async selectSession(sessionId: string) {
      this.ensureClientStrategyAvailable();
      this.forceNextStrategySession = false;
      this.sessionId = sessionId;
      await this.loadSession(sessionId);
    },
    async ensureMaterialSession() {
      this.ensureClientStrategyAvailable();

      if (this.sessionId && this.activeAgentCode === MATERIAL_AGENT_CODE) {
        return this.sessionId;
      }

      const result = await request<AgentChatSessionResponse>(
        "/agent/sessions",
        {
          method: "POST",
          data: {
            tenantId: this.getTenantId(),
            agentCode: MATERIAL_AGENT_CODE,
          },
        },
      );

      if (!result.sessionId) {
        throw new Error("创建素材会话失败");
      }

      this.sessionId = result.sessionId;
      this.messages = hydrateMaterialMessages(result.messages);
      this.activeAgentCode = MATERIAL_AGENT_CODE;
      this.diagnosisId = null;
      this.diagnosisStatus = null;
      this.pendingFrameworkUpdate = null;
      this.forceNextStrategySession = false;
      await this.loadSessions();

      return result.sessionId;
    },
    buildMaterialOptimisticContent(
      content: string,
      attachments: MaterialChatAttachment[] = [],
    ) {
      if (!attachments.length) {
        return content;
      }

      const fileNames = attachments
        .map((attachment) => attachment.originalName)
        .filter(Boolean)
        .join("、");

      return content
        ? `上传素材：${fileNames}\n素材描述：${content}`
        : `上传素材：${fileNames}`;
    },
    createOptimisticExchange(content: string): OptimisticExchange {
      const requestId = `local-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const pendingSessionId = this.sessionId || `local-session-${requestId}`;
      const createdAt = new Date().toISOString();
      const userMessage: AgentMessage = {
        id: `${requestId}-user`,
        sessionId: pendingSessionId,
        role: "USER",
        content,
        metadata: {
          source: "local_optimistic",
          localRequestId: requestId,
          localStatus: "pending",
        },
        createdAt,
      };

      this.messages = [...this.messages, userMessage];

      return {
        requestId,
        userMessageId: userMessage.id,
      };
    },
    replaceOptimisticExchange(
      exchange: OptimisticExchange,
      userMessage: AgentMessage,
      assistantMessage: AgentMessage,
    ) {
      const nextAssistantMessage = hydrateMaterialMessage(assistantMessage);
      const startIndex = this.messages.findIndex(
        (message) => message.id === exchange.userMessageId,
      );

      if (startIndex === -1) {
        this.messages = [...this.messages, userMessage, nextAssistantMessage];
        return;
      }

      const nextMessages = [...this.messages];
      nextMessages.splice(startIndex, 1, userMessage, nextAssistantMessage);
      this.messages = nextMessages;
    },
    replaceOptimisticExchangeWithMessages(
      exchange: OptimisticExchange,
      messages: AgentMessage[],
    ) {
      const hydratedMessages = hydrateMaterialMessages(messages);
      const startIndex = this.messages.findIndex(
        (message) => message.id === exchange.userMessageId,
      );

      if (startIndex === -1) {
        this.messages = [...this.messages, ...hydratedMessages];
        return;
      }

      const nextMessages = [...this.messages];
      nextMessages.splice(startIndex, 1, ...hydratedMessages);
      this.messages = nextMessages;
    },
    replaceOptimisticExchangeWithUserMessage(
      exchange: OptimisticExchange,
      userMessage: AgentMessage,
    ) {
      this.replaceOptimisticExchangeWithMessages(exchange, [userMessage]);
    },
    failOptimisticExchange(exchange: OptimisticExchange) {
      const userIndex = this.messages.findIndex(
        (message) => message.id === exchange.userMessageId,
      );

      if (userIndex === -1) {
        return;
      }

      const failedUserMessage: AgentMessage = {
        ...this.messages[userIndex],
        metadata: {
          ...(this.messages[userIndex].metadata ?? {}),
          localStatus: "failed",
        },
      };

      this.messages.splice(userIndex, 1, failedUserMessage);
    },
    async sendAgentStreamMessage(
      content: string,
      agentCode?: string,
      attachments?: MaterialChatAttachment[],
    ) {
      if (!this.sessionId) {
        throw new Error("创建会话失败");
      }

      let finalResponse: Record<string, unknown> = {};

      await streamRequest<AgentStreamChunk>(
        `/agent/sessions/${encodeURIComponent(this.sessionId)}/messages/stream`,
        {
          method: "POST",
          data: {
            content,
            ...(agentCode ? { agentCode } : {}),
            ...(attachments?.length ? { attachments } : {}),
          },
          timeout: API_LONG_REQUEST_TIMEOUT_MS,
          onChunk: (chunk) => {
            const payload = asRecord(chunk.payload);

            if (chunk.type === "error") {
              throw new Error(getString(payload.message) || "发送失败");
            }

            const response = asRecord(payload.response);
            if (hasRecordData(response)) {
              finalResponse = response;
            }
          },
        },
      );

      if (!hasRecordData(finalResponse)) {
        throw new Error("智能体响应为空");
      }

      return finalResponse;
    },
    async sendBase(content: string) {
      this.ensureClientStrategyAvailable();
      const normalized = content.trim();

      if (!normalized || this.loading || this.uploading) {
        return;
      }

      this.error = "";
      this.loading = true;
      const optimisticExchange = this.createOptimisticExchange(normalized);

      try {
        if (!this.sessionId) {
          const session = await request<AgentChatSessionResponse>(
            "/agent/sessions",
            {
              method: "POST",
              data: {
                tenantId: this.getTenantId(),
                agentCode: BASE_CHAT_AGENT_CODE,
              },
            },
          );

          if (!session.sessionId) {
            throw new Error("创建会话失败");
          }

          this.sessionId = session.sessionId;
          this.diagnosisId = session.diagnosisId ?? this.diagnosisId;
          this.pendingFrameworkUpdate = session.pendingFrameworkUpdate ?? null;
          this.activeAgentCode = resolveAgentCode(session.agentCode);
          this.forceNextStrategySession = false;
        }

        const result = (await this.sendAgentStreamMessage(
          normalized,
        )) as unknown as AgentChatMessageResponse;

        this.sessionId = result.sessionId;
        this.diagnosisId = result.diagnosisId ?? this.diagnosisId;
        const assistantMessage =
          resolveAgentCode(result.agentCode) === MATERIAL_AGENT_CODE
            ? withMaterialCard(
                result.assistantMessage,
                result as unknown as Record<string, unknown>,
              )
            : hydrateMaterialMessage(result.assistantMessage);
        const responseMessages = result.messages?.length
          ? result.messages.map((message) =>
              message.id === assistantMessage.id ? assistantMessage : message,
            )
          : null;

        this.activeAgentCode = resolveAgentCode(result.agentCode);
        this.markAssistantMessageForAnimation(assistantMessage);
        if (result.messages?.length) {
          this.replaceOptimisticExchangeWithMessages(
            optimisticExchange,
            responseMessages ?? result.messages,
          );
        } else {
          this.replaceOptimisticExchange(
            optimisticExchange,
            result.userMessage,
            assistantMessage,
          );
        }
        await this.loadSessions();
        if (this.activeAgentCode === STRATEGY_AGENT_CODE) {
          await this.loadStrategySessionState(result.sessionId);
        }
      } catch (err) {
        this.error = getUserErrorMessage(err, "发送失败");
        this.failOptimisticExchange(optimisticExchange);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async sendMaterial(
      content: string,
      attachments: MaterialChatAttachment[] = [],
    ) {
      this.ensureClientStrategyAvailable();
      const normalized = content.trim();
      const hasAttachments = attachments.length > 0;

      if ((!normalized && !hasAttachments) || this.loading || this.uploading) {
        return;
      }

      this.error = "";
      this.loading = true;

      try {
        await this.ensureMaterialSession();
      } catch (err) {
        this.error = getUserErrorMessage(err, "创建素材会话失败");
        this.loading = false;
        throw err;
      }

      const optimisticExchange = this.createOptimisticExchange(
        this.buildMaterialOptimisticContent(normalized, attachments),
      );

      try {
        const result = (await this.sendAgentStreamMessage(
          normalized,
          MATERIAL_AGENT_CODE,
          attachments,
        )) as unknown as MaterialChatResponse;
        const assistantMessage = withMaterialCard(
          result.assistantMessage,
          result,
        );

        this.sessionId = result.sessionId;
        this.activeAgentCode = MATERIAL_AGENT_CODE;
        this.diagnosisId = null;
        this.diagnosisStatus = null;
        this.pendingFrameworkUpdate = null;
        this.markAssistantMessageForAnimation(assistantMessage);
        this.replaceOptimisticExchange(
          optimisticExchange,
          result.userMessage,
          assistantMessage,
        );
        await this.loadSessions();
      } catch (err) {
        this.error = getUserErrorMessage(err, "发送失败");
        this.failOptimisticExchange(optimisticExchange);
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
      const shouldCreateStrategySession =
        this.forceNextStrategySession ||
        !this.sessionId ||
        this.activeAgentCode !== STRATEGY_AGENT_CODE;
      let optimisticExchange: OptimisticExchange | null = null;

      try {
        if (shouldCreateStrategySession) {
          const session = await request<AgentChatSessionResponse>(
            "/agent/sessions",
            {
              method: "POST",
              data: {
                tenantId: this.getTenantId(),
                agentCode: STRATEGY_AGENT_CODE,
              },
            },
          );

          if (!session.sessionId) {
            throw new Error("创建会话失败");
          }

          this.sessionId = session.sessionId;
          this.messages = hydrateMaterialMessages(session.messages);
          this.pendingFrameworkUpdate = session.pendingFrameworkUpdate ?? null;
        }

        this.activeAgentCode = STRATEGY_AGENT_CODE;
        optimisticExchange = this.createOptimisticExchange(normalized);

        const result = (await this.sendAgentStreamMessage(
          normalized,
          STRATEGY_AGENT_CODE,
        )) as unknown as StrategyChatResponse;

        this.diagnosisId = result.diagnosisId;
        this.diagnosisStatus = result.status;
        this.sessionId = result.sessionId;
        this.forceNextStrategySession = false;
        this.markAssistantMessageForAnimation(result.assistantMessage);
        if (result.messages?.length) {
          this.replaceOptimisticExchangeWithMessages(
            optimisticExchange,
            result.messages,
          );
        } else if (result.assistantMessage) {
          this.replaceOptimisticExchange(
            optimisticExchange,
            result.userMessage,
            result.assistantMessage,
          );
        } else {
          this.replaceOptimisticExchangeWithUserMessage(
            optimisticExchange,
            result.userMessage,
          );
        }
        await this.loadSessions();
        await this.loadStrategySessionState(result.sessionId);
      } catch (err) {
        this.error = this.isStrategyEntitlementDenied(err)
          ? "当前企业未开通战略智能体权益"
          : getUserErrorMessage(err, "发送失败");
        if (optimisticExchange) {
          this.failOptimisticExchange(optimisticExchange);
        }
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
      const hydratedMessage = hydrateMaterialMessage(message);
      const index = this.messages.findIndex((item) => item.id === message.id);

      if (index === -1) {
        return false;
      }

      this.messages.splice(index, 1, hydratedMessage);
      return true;
    },
    clearMessageAnimations() {
      this.animatedAssistantMessageIds = {};
    },
    markAssistantMessageForAnimation(message?: AgentMessage | null) {
      if (message?.role !== "ASSISTANT" || !message.content?.trim()) {
        return;
      }

      this.animatedAssistantMessageIds = {
        ...this.animatedAssistantMessageIds,
        [message.id]: true,
      };
    },
    markAssistantMessagesForAnimation(messages?: AgentMessage[] | null) {
      messages?.forEach((message) => {
        this.markAssistantMessageForAnimation(message);
      });
    },
    shouldAnimateAssistantMessage(message?: AgentMessage | null) {
      return (
        message?.role === "ASSISTANT" &&
        Boolean(message.id && this.animatedAssistantMessageIds[message.id])
      );
    },
    finishAssistantMessageAnimation(messageId: string) {
      if (!this.animatedAssistantMessageIds[messageId]) {
        return;
      }

      const next = { ...this.animatedAssistantMessageIds };
      delete next[messageId];
      this.animatedAssistantMessageIds = next;
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

          const currentMessage = this.messages.find(
            (message) => message.id === messageId,
          );
          const wasProcessing = this.isProcessingMessage(currentMessage);
          this.replaceMessage(result.message);
          if (
            wasProcessing &&
            result.message.role === "ASSISTANT" &&
            !this.isProcessingMessage(result.message)
          ) {
            this.markAssistantMessageForAnimation(result.message);
          }
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
    async pollAsyncStrategyResponse(sessionId: string, userMessageId: string) {
      const pollKey = `${sessionId}:${userMessageId}`;

      if (activeAsyncResponsePolls.has(pollKey)) {
        return;
      }

      activeAsyncResponsePolls.add(pollKey);

      try {
        for (
          let attempt = 0;
          attempt < PROCESSING_POLL_MAX_ATTEMPTS;
          attempt += 1
        ) {
          await delay(PROCESSING_POLL_INTERVAL_MS);

          if (this.sessionId !== sessionId) {
            return;
          }

          const previousMessageIds = new Set(
            this.messages.map((message) => message.id),
          );

          try {
            await this.loadSession(sessionId, { preserveAnimations: true });
          } catch {
            continue;
          }

          const userIndex = this.messages.findIndex(
            (message) => message.id === userMessageId,
          );
          const assistantMessage =
            userIndex >= 0
              ? this.messages
                  .slice(userIndex + 1)
                  .find(
                    (message) =>
                      message.role === "ASSISTANT" &&
                      !this.isProcessingMessage(message),
                  )
              : null;

          if (assistantMessage) {
            if (!previousMessageIds.has(assistantMessage.id)) {
              this.markAssistantMessageForAnimation(assistantMessage);
            }

            await this.loadStrategySessionState(sessionId);
            this.startSessionTitleRefreshPoll(sessionId);
            return;
          }
        }
      } finally {
        activeAsyncResponsePolls.delete(pollKey);
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
        this.diagnosisStatus = result.status;
        this.pendingFrameworkUpdate = result.pendingFrameworkUpdate;
      } catch (err) {
        if (this.isStrategyEntitlementDenied(err)) {
          this.pendingFrameworkUpdate = null;
          return;
        }

        throw err;
      }
    },
    replaceMaterialDraftsInCards(drafts: MaterialDraft[]) {
      const draftById = new Map(
        drafts.map((draft) => [getMaterialDraftId(draft), draft]),
      );

      if (draftById.size === 0) {
        return;
      }

      this.messages = this.messages.map((message) => {
        const card = getMaterialCard(message);
        if (!card) {
          return message;
        }

        const cardDrafts = Array.isArray(card.drafts) ? card.drafts : [];

        if (cardDrafts.length === 0) {
          return message;
        }

        const nextDrafts = cardDrafts.map((draft) => {
          const replacement = draftById.get(getMaterialDraftId(draft));
          return replacement ?? draft;
        });

        return {
          ...message,
          metadata: {
            ...(message.metadata ?? {}),
            card: {
              ...card,
              drafts: nextDrafts,
              data: {
                ...(card.data ?? {}),
                drafts: nextDrafts,
              },
            },
          },
        };
      });
    },
    removeMaterialDraftFromCards(draftId: string) {
      if (!draftId) {
        return;
      }

      this.messages = this.messages.map((message) => {
        const card = getMaterialCard(message);
        if (!card) {
          return message;
        }

        const cardDrafts = Array.isArray(card.drafts) ? card.drafts : [];

        if (cardDrafts.length === 0) {
          return message;
        }

        const nextDrafts = cardDrafts.filter(
          (draft) => getMaterialDraftId(draft) !== draftId,
        );

        if (nextDrafts.length === cardDrafts.length) {
          return message;
        }

        return {
          ...message,
          metadata: {
            ...(message.metadata ?? {}),
            card: {
              ...card,
              drafts: nextDrafts,
              data: {
                ...(card.data ?? {}),
                drafts: nextDrafts,
              },
            },
          },
        };
      });
    },
    setMaterialDraftCardsConfirmState(
      draftIds: string[],
      confirmState: MaterialConfirmState,
    ) {
      const ids = new Set(draftIds.filter(Boolean));

      if (ids.size === 0) {
        return;
      }

      this.messages = this.messages.map((message) => {
        const card = getMaterialCard(message);
        if (!card) {
          return message;
        }

        const cardDrafts = Array.isArray(card.drafts) ? card.drafts : [];
        if (cardDrafts.length === 0) {
          return message;
        }

        let touched = false;
        const nextDrafts = cardDrafts.map((draft) => {
          const draftId = getMaterialDraftId(draft);
          if (!ids.has(draftId)) {
            return draft;
          }

          touched = true;
          return {
            ...draft,
            status: confirmState,
            confirmState,
          };
        });

        if (!touched) {
          return message;
        }

        const nextConfirmState = resolveMaterialDraftCardConfirmState(nextDrafts);
        const nextActionsDisabled = nextConfirmState !== "pending";
        const nextTitle =
          nextConfirmState === "confirmed"
            ? "素材已入库"
            : nextConfirmState === "expired"
              ? "素材确认已失效"
              : card.title;
        const nextMessage =
          nextConfirmState === "confirmed"
            ? "这些素材已确认入库，当前卡片仅支持查看。"
            : nextConfirmState === "expired"
              ? "该素材确认卡片已失效，请基于当前临时区或重新上传素材继续处理。"
              : card.message;

        return {
          ...message,
          metadata: {
            ...(message.metadata ?? {}),
            card: {
              ...card,
              title: nextTitle,
              message: nextMessage,
              confirmState: nextConfirmState,
              actionsDisabled: nextActionsDisabled,
              drafts: nextDrafts,
              data: {
                ...(card.data ?? {}),
                confirmState: nextConfirmState,
                drafts: nextDrafts,
              },
            },
          },
        };
      });
    },
    replaceMaterialAssetsInCards(assets: MaterialAsset[]) {
      const assetById = new Map(
        assets.map((asset) => [getMaterialAssetId(asset), asset]),
      );

      if (assetById.size === 0) {
        return;
      }

      this.messages = this.messages.map((message) => {
        const card = getMaterialCard(message);
        if (!card) {
          return message;
        }

        const cardAssets = Array.isArray(card.assets) ? card.assets : [];
        const table = asRecord(card.materialTable);
        const tableRows = Array.isArray(table.rows)
          ? (table.rows as MaterialAsset[])
          : [];
        const data = asRecord(card.data);
        const dataAssets = Array.isArray(data.assets)
          ? (data.assets as MaterialAsset[])
          : [];
        const dataTable = asRecord(data.materialTable);
        const dataTableRows = Array.isArray(dataTable.rows)
          ? (dataTable.rows as MaterialAsset[])
          : [];

        if (
          cardAssets.length === 0 &&
          tableRows.length === 0 &&
          dataAssets.length === 0 &&
          dataTableRows.length === 0
        ) {
          return message;
        }

        const replaceAsset = (asset: MaterialAsset) => {
          const replacement = assetById.get(getMaterialAssetId(asset));
          return replacement ?? asset;
        };
        const nextAssets = cardAssets.map(replaceAsset);
        const nextRows = tableRows.map(replaceAsset);
        const nextDataAssets = dataAssets.map(replaceAsset);
        const nextDataRows = dataTableRows.map(replaceAsset);

        return {
          ...message,
          metadata: {
            ...(message.metadata ?? {}),
            card: {
              ...card,
              assets: nextAssets,
              materialTable: {
                ...table,
                rows: nextRows,
              },
              data: {
                ...data,
                assets:
                  dataAssets.length > 0 || nextAssets.length === 0
                    ? nextDataAssets
                    : nextAssets,
                materialTable: {
                  ...(hasRecordData(dataTable) ? dataTable : table),
                  rows:
                    dataTableRows.length > 0 || nextRows.length === 0
                      ? nextDataRows
                      : nextRows,
                },
              },
            },
          },
        };
      });
    },
    removeMaterialAssetsFromCards(assetIds: string[]) {
      const ids = new Set(assetIds.filter(Boolean));

      if (ids.size === 0) {
        return;
      }

      this.messages = this.messages.map((message) => {
        const card = getMaterialCard(message);
        if (!card) {
          return message;
        }

        const cardAssets = Array.isArray(card.assets) ? card.assets : [];
        const table = asRecord(card.materialTable);
        const tableRows = Array.isArray(table.rows)
          ? (table.rows as MaterialAsset[])
          : [];
        const data = asRecord(card.data);
        const dataAssets = Array.isArray(data.assets)
          ? (data.assets as MaterialAsset[])
          : [];
        const dataTable = asRecord(data.materialTable);
        const dataTableRows = Array.isArray(dataTable.rows)
          ? (dataTable.rows as MaterialAsset[])
          : [];

        if (
          cardAssets.length === 0 &&
          tableRows.length === 0 &&
          dataAssets.length === 0 &&
          dataTableRows.length === 0
        ) {
          return message;
        }

        const nextAssets = cardAssets.filter(
          (asset) => !ids.has(getMaterialAssetId(asset)),
        );
        const nextRows = tableRows.filter(
          (asset) => !ids.has(getMaterialAssetId(asset)),
        );
        const nextDataAssets = dataAssets.filter(
          (asset) => !ids.has(getMaterialAssetId(asset)),
        );
        const nextDataRows = dataTableRows.filter(
          (asset) => !ids.has(getMaterialAssetId(asset)),
        );

        return {
          ...message,
          metadata: {
            ...(message.metadata ?? {}),
            card: {
              ...card,
              assets: nextAssets,
              materialTable: {
                ...table,
                rows: nextRows,
              },
              data: {
                ...data,
                assets:
                  dataAssets.length > 0 || nextAssets.length === 0
                    ? nextDataAssets
                    : nextAssets,
                materialTable: {
                  ...(hasRecordData(dataTable) ? dataTable : table),
                  rows:
                    dataTableRows.length > 0 || nextRows.length === 0
                      ? nextDataRows
                      : nextRows,
                },
              },
            },
          },
        };
      });
    },
    appendMaterialAssistantCard(
      content: string,
      response: Record<string, unknown>,
    ) {
      const createdAt = new Date().toISOString();
      const message: AgentMessage = withMaterialCard(
        {
          id: `local-material-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          sessionId: this.sessionId || "",
          role: "ASSISTANT",
          content,
          metadata: {
            source: "local_material_action",
            agentCode: MATERIAL_AGENT_CODE,
          },
          createdAt,
        },
        response,
      );

      this.messages = [...this.messages, message];
      this.markAssistantMessageForAnimation(message);
    },
    async uploadMaterialFilesToLibrary(input: MaterialUploadInput) {
      this.ensureClientStrategyAvailable();
      if (this.loading || this.uploading) {
        return;
      }

      const files = input.files.filter(
        (file) => file.browserFile || file.filePath,
      );

      if (files.length === 0) {
        throw new Error("未选择有效文件");
      }

      this.error = "";
      this.uploading = true;

      try {
        const sessionId = await this.ensureMaterialSession();
        const tenantId = this.getTenantId();
        const formData: Record<string, string> = {
          sessionId,
          autoGenerate: "true",
        };

        if (tenantId) {
          formData.tenantId = tenantId;
        }

        if (input.description?.trim()) {
          formData.description = input.description.trim();
        }

        const browserFiles = files.filter((file) => file.browserFile);
        const pathFiles = files.filter((file) => file.filePath);
        let result: MaterialUploadFilesResponse;

        if (browserFiles.length === files.length) {
          result = await uploadBrowserFiles<MaterialUploadFilesResponse>(
            "/material/files/upload",
            {
              files: browserFiles.map((file) => ({
                file: file.browserFile as Blob,
                fileName: file.fileName,
                name: "files",
              })),
              formData,
              timeout: API_LONG_REQUEST_TIMEOUT_MS,
            },
          );
        } else if (pathFiles.length === files.length) {
          result = await uploadFiles<MaterialUploadFilesResponse>(
            "/material/files/upload",
            {
              files: pathFiles.map((file) => ({
                filePath: file.filePath ?? "",
                fileName: file.fileName,
                name: "files",
              })),
              formData,
              timeout: API_LONG_REQUEST_TIMEOUT_MS,
            },
          );
        } else {
          throw new Error("暂不支持混合上传本地路径和浏览器文件");
        }

        const assistantMessage = withMaterialCard(
          result.assistantMessage,
          result as unknown as Record<string, unknown>,
        );

        this.sessionId = result.sessionId;
        this.activeAgentCode = MATERIAL_AGENT_CODE;
        this.diagnosisId = null;
        this.diagnosisStatus = null;
        this.pendingFrameworkUpdate = null;
        this.messages = [
          ...this.messages,
          result.userMessage,
          assistantMessage,
        ];
        this.markAssistantMessageForAnimation(assistantMessage);
        await this.loadSessions();
      } catch (err) {
        this.error = getUserErrorMessage(err, "上传素材失败");
        throw err;
      } finally {
        this.uploading = false;
      }
    },
    async updateMaterialDraft(
      draftId: string,
      changes: {
        description?: string;
        directoryName?: string;
        materialName?: string;
        tags?: string[];
        regenerate?: boolean;
      },
    ) {
      const result = await request<MaterialDraftsResponse>(
        `/material/drafts/${encodeURIComponent(draftId)}`,
        {
          method: "PATCH",
          data: {
            tenantId: this.getTenantId(),
            sessionId: this.sessionId ?? undefined,
            ...changes,
          },
          timeout: API_LONG_REQUEST_TIMEOUT_MS,
        },
      );
      const drafts = result.drafts ?? (result.draft ? [result.draft] : []);
      this.replaceMaterialDraftsInCards(drafts);
      return result;
    },
    async generateMaterialMetadata(draftIds: string[]) {
      const result = await request<MaterialDraftsResponse>(
        "/material/drafts/generate",
        {
          method: "POST",
          data: {
            tenantId: this.getTenantId(),
            sessionId: this.sessionId ?? undefined,
            draftIds,
          },
          timeout: API_LONG_REQUEST_TIMEOUT_MS,
        },
      );
      this.replaceMaterialDraftsInCards(result.drafts ?? []);
      return result;
    },
    async removeMaterialDraft(draftId: string) {
      const result = await request<MaterialDraftsResponse>(
        `/material/drafts/${encodeURIComponent(draftId)}`,
        {
          method: "DELETE",
          query: {
            tenantId: this.getTenantId(),
          },
        },
      );
      this.removeMaterialDraftFromCards(draftId);
      return result;
    },
    async confirmMaterialDrafts(
      draftIds: string[],
      changes: MaterialDraftConfirmChange[] = [],
    ) {
      const changedDrafts = changes.filter((change) => change.draftId);

      if (changedDrafts.length > 0) {
        const updatedDrafts: MaterialDraft[] = [];

        for (const change of changedDrafts) {
          const result = await request<MaterialDraftsResponse>(
            `/material/drafts/${encodeURIComponent(change.draftId)}`,
            {
              method: "PATCH",
              data: {
                tenantId: this.getTenantId(),
                description: change.description,
                directoryName: change.directoryName,
                materialName: change.materialName,
                tags: change.tags,
              },
              timeout: API_LONG_REQUEST_TIMEOUT_MS,
            },
          );
          updatedDrafts.push(
            ...(result.drafts ?? (result.draft ? [result.draft] : [])),
          );
        }

        this.replaceMaterialDraftsInCards(updatedDrafts);
      }

      const result = await request<MaterialAssetsResponse>(
        "/material/drafts/confirm",
        {
          method: "POST",
          data: {
            tenantId: this.getTenantId(),
            sessionId: this.sessionId ?? undefined,
            draftIds,
          },
          timeout: API_LONG_REQUEST_TIMEOUT_MS,
        },
      );
      this.setMaterialDraftCardsConfirmState(draftIds, "confirmed");
      await this.loadSessions();
      return result;
    },
    async updateMaterialAsset(
      assetId: string,
      changes: {
        materialName?: string;
        description?: string;
        directoryName?: string;
        tags?: string[];
      },
    ) {
      const result = await request<MaterialAssetsResponse>(
        `/material/assets/${encodeURIComponent(assetId)}`,
        {
          method: "PATCH",
          data: {
            tenantId: this.getTenantId(),
            sessionId: this.sessionId ?? undefined,
            ...changes,
          },
          timeout: API_LONG_REQUEST_TIMEOUT_MS,
        },
      );
      this.replaceMaterialAssetsInCards(
        result.assets ?? (result.asset ? [result.asset] : []),
      );
      return result;
    },
    async recycleMaterialAsset(assetId: string) {
      const result = await request<MaterialAssetsResponse>(
        `/material/assets/${encodeURIComponent(assetId)}/recycle`,
        {
          method: "POST",
          query: {
            tenantId: this.getTenantId(),
            sessionId: this.sessionId ?? undefined,
          },
        },
      );
      this.appendMaterialAssistantCard(
        result.message || "已将素材移入回收站。",
        result as unknown as Record<string, unknown>,
      );
      this.removeMaterialAssetsFromCards([assetId]);
      return result;
    },
    async batchRecycleMaterialAssets(assetIds: string[]) {
      const result = await request<MaterialAssetsResponse>(
        "/material/assets/batch-recycle",
        {
          method: "POST",
          data: {
            tenantId: this.getTenantId(),
            sessionId: this.sessionId ?? undefined,
            assetIds,
          },
        },
      );
      this.appendMaterialAssistantCard(
        result.message || `已将 ${assetIds.length} 个素材移入回收站。`,
        result as unknown as Record<string, unknown>,
      );
      this.removeMaterialAssetsFromCards(assetIds);
      return result;
    },
    async restoreMaterialAsset(assetId: string) {
      const result = await request<MaterialAssetsResponse>(
        `/material/assets/${encodeURIComponent(assetId)}/restore`,
        {
          method: "POST",
          query: {
            tenantId: this.getTenantId(),
            sessionId: this.sessionId ?? undefined,
          },
        },
      );
      this.appendMaterialAssistantCard(
        result.message || "已将素材恢复到正式区。",
        result as unknown as Record<string, unknown>,
      );
      this.removeMaterialAssetsFromCards([assetId]);
      return result;
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

        if (file.fileName) {
          formData.originalName = encodeURIComponent(file.fileName);
        }

        const uploadOptions = {
          fileName: file.fileName,
          formData,
          timeout: API_LONG_REQUEST_TIMEOUT_MS,
        };
        if (!file.browserFile && !file.filePath) {
          throw new Error("未选择有效文件");
        }
        const result = file.browserFile
          ? await uploadBrowserFile<StrategyFileUploadResponse>(
              "/strategy/files/upload",
              {
                ...uploadOptions,
                file: file.browserFile,
              },
            )
          : await upload<StrategyFileUploadResponse>("/strategy/files/upload", {
              ...uploadOptions,
              filePath: file.filePath ?? "",
            });

        this.diagnosisId = result.diagnosisId;
        this.sessionId = result.sessionId;
        this.messages = [
          ...this.messages,
          result.userMessage,
          result.assistantMessage,
        ];
        this.markAssistantMessageForAnimation(result.assistantMessage);
        await this.loadSessions();
        await this.loadStrategySessionState(result.sessionId);
      } catch (err) {
        this.error = this.isStrategyEntitlementDenied(err)
          ? "当前企业未开通战略智能体权益"
          : getUserErrorMessage(err, "上传失败");
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
        this.error = getUserErrorMessage(err, "读取报告失败");
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async exportReportPdf(
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
        await download(
          `/strategy/reports/${encodeURIComponent(type)}/export/pdf`,
          {
            query: {
              tenantId: this.getTenantId(),
              diagnosisId: options.diagnosisId || undefined,
            },
            timeout: API_LONG_REQUEST_TIMEOUT_MS,
          },
        );
      } catch (err) {
        this.error = getUserErrorMessage(err, "导出报告失败");
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
