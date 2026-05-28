export type AgentMessageRole = "USER" | "ASSISTANT" | "SYSTEM";

export type AgentMessageMetadata = {
  source?: string;
  markdown?: string;
  ui?: StrategyUiDescriptor | Record<string, unknown> | null;
  card?: Record<string, unknown> | null;
  [key: string]: unknown;
};

export type AgentMessage = {
  id: string;
  sessionId: string;
  role: AgentMessageRole;
  content: string;
  metadata?: AgentMessageMetadata | null;
  createdAt: string;
};

export type StrategyUiDescriptor = {
  type: string;
  mode?: string;
};

export type StrategyFileAsset = {
  id: string;
  originalName: string;
  mimeType?: string | null;
  size: number;
  status: string;
  extractedTextLength?: number;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

export type StrategyFormField = {
  key: string;
  label: string;
  value: unknown;
  status: string;
  confidence?: number | null;
  source?: string | null;
  required?: boolean;
};

export type StrategyFrameworkPoint = {
  code: string;
  title: string;
  category?: string | null;
  summary?: string | null;
  recommendation?: string | null;
  confidence?: number | null;
  source?: string | null;
};

export type PendingFrameworkUpdate = {
  id: string;
  status: "pending";
  messageId: string;
  diagnosisId: string;
  frameworkId: string;
  createdAt: string;
  sourceContent: string;
  changedPoints: Array<{
    code: string;
    title: string;
    field: string;
    operation: string;
    previousValue: unknown;
    nextValue: unknown;
  }>;
  nextActions: string[];
};

export type StrategyChatSessionSummary = {
  id: string;
  title?: string | null;
  tenantId?: string;
  ownerAccountId?: string | null;
  agentCode?: string;
  metadata?: Record<string, unknown> | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  lastMessageAt?: string | null;
  isActive?: boolean;
  messageCount: number;
  lastMessage: AgentMessage | null;
};

export type AgentChatSessionsResponse = {
  tenantId: string;
  sessions: StrategyChatSessionSummary[];
  ui: StrategyUiDescriptor;
};

export type AgentChatSessionResponse = {
  tenantId: string;
  sessionId: string | null;
  session?: StrategyChatSessionSummary | null;
  messages: AgentMessage[];
  ui: StrategyUiDescriptor;
};

export type StrategyChatSessionResponse = {
  tenantId: string;
  diagnosisId: string | null;
  status: string;
  sessionId: string | null;
  messages: AgentMessage[];
  pendingFrameworkUpdate: PendingFrameworkUpdate | null;
  message: string;
  ui: StrategyUiDescriptor;
};

export type StrategyChatResponse = {
  tenantId: string;
  diagnosisId: string;
  sessionId: string;
  intent: string;
  action: string;
  succeeded: boolean;
  processing?: boolean;
  userMessage: AgentMessage;
  assistantMessage: AgentMessage;
  result: Record<string, unknown>;
  nextActions: string[];
  ui: StrategyUiDescriptor;
};

export type AgentChatMessageResponse = {
  tenantId: string;
  sessionId: string;
  agentCode: string;
  userMessage: AgentMessage;
  assistantMessage: AgentMessage;
  ui: StrategyUiDescriptor;
};

export type AgentMessageResponse = {
  tenantId: string;
  sessionId: string;
  message: AgentMessage;
  ui: StrategyUiDescriptor;
};

export type StrategyReportSummary = {
  id: string;
  diagnosisId?: string | null;
  type: string;
  title?: string | null;
  status: string;
  generatedAt?: string | null;
  isGenerated: boolean;
  needsSync: boolean;
};

export type StrategyReportDetail = StrategyReportSummary & {
  content?: string | null;
  structuredContent?: unknown;
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type StrategyReportResponse = {
  tenantId: string;
  diagnosisId: string;
  report: StrategyReportDetail;
  nextActions: string[];
  ui: StrategyUiDescriptor;
};

export type StrategyFileUploadResponse = {
  tenantId: string;
  diagnosisId: string;
  sessionId: string;
  status: string;
  reason: string;
  file: StrategyFileAsset;
  extractedFields: Record<string, unknown>;
  sourceSummary: Record<string, unknown>;
  message: string;
  nextActions: string[];
  ui: StrategyUiDescriptor;
  userMessage: AgentMessage;
  assistantMessage: AgentMessage;
};

export type LoginResponse = {
  token: string;
  user: {
    sub: string;
    email?: string;
    phone?: string;
    name?: string;
    nickname?: string;
    avatarUrl?: string;
    loginName?: string;
    departmentName?: string;
    organizationName?: string;
    roleNames?: string[];
    accountType?: "tenant_user" | "dispatch_staff";
    tenantId?: string;
    isTenantSuperAdmin?: boolean;
    roleIds?: string[];
    permissions?: string[];
    role?: "ADMIN";
    isBootstrap?: boolean;
  };
};
