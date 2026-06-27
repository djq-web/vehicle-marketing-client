import type { AgentMessage, StrategyUiDescriptor } from "@/types/strategy";

export type MaterialType = "image" | "document" | "video" | "audio" | string;

export type MaterialDraftStatus =
  | "uploaded"
  | "need_description"
  | "description_collected"
  | "metadata_generating"
  | "ready_for_confirmation"
  | "metadata_failed"
  | "confirmed"
  | "removed"
  | string;

export type MaterialConfirmState = "pending" | "confirmed" | "expired" | string;

export type MaterialPreviewRenderMode =
  | "image_zoom"
  | "native_video"
  | "native_audio"
  | "document_viewer"
  | "file_info"
  | string;

export type MaterialPreviewMode = "proxy" | "signed_url" | string;

export type MaterialPreview = {
  type?: MaterialType;
  mode?: MaterialPreviewMode;
  renderMode?: MaterialPreviewRenderMode;
  method?: "GET" | string;
  endpoint?: string | null;
  signedUrlEndpoint?: string | null;
  url?: string | null;
  urlExpiresAt?: string | null;
  expiresInSeconds?: number | null;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
  mimeType?: string | null;
  originalName?: string | null;
  fallbackReason?: string | null;
};

export type MaterialDraft = {
  id: string;
  draftId?: string;
  tenantId?: string;
  sessionId?: string;
  originalName: string;
  fileExtension?: string | null;
  materialType?: MaterialType | null;
  description?: string | null;
  directoryName?: string | null;
  generatedDirectoryName?: string | null;
  userEditedDirectoryName?: string | null;
  materialName?: string | null;
  generatedName?: string | null;
  userEditedName?: string | null;
  tags?: string[];
  generatedTags?: string[];
  userEditedTags?: string[];
  mimeType?: string | null;
  size?: number | null;
  sizeReadable?: string | null;
  storageUrl?: string | null;
  previewUrl?: string | null;
  preview?: MaterialPreview | null;
  status?: MaterialDraftStatus;
  confirmState?: MaterialConfirmState;
  actualStatus?: MaterialDraftStatus;
  statusReason?: string | null;
  metadata?: Record<string, unknown> | null;
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type MaterialAssetArea = "official" | "recycle_bin" | string;

export type MaterialAsset = {
  id: string;
  materialId?: string;
  tenantId?: string;
  ownerAccountId?: string | null;
  ownerName?: string | null;
  area?: MaterialAssetArea;
  originalName: string;
  fileExtension?: string | null;
  materialType?: MaterialType | null;
  directoryName?: string | null;
  materialName: string;
  description?: string | null;
  tags?: string[];
  mimeType?: string | null;
  size?: number | null;
  sizeReadable?: string | null;
  storageUrl?: string | null;
  previewUrl?: string | null;
  preview?: MaterialPreview | null;
  status?: string;
  recycledAt?: string | null;
  purgeAfter?: string | null;
  recoverable?: boolean;
  remainingRecoverableSeconds?: number | null;
  score?: number | null;
  matchSource?: string | null;
  matchReason?: string | null;
  indexStatus?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type MaterialStats = {
  totalCount?: number;
  usedBytes?: number;
  usedReadable?: string;
  dataPermissionScope?: string;
  visibleCounts?: Record<string, number>;
  storage?: Record<string, unknown>;
  [key: string]: unknown;
};

export type MaterialCardType =
  | "material_drafts"
  | "material_draft"
  | "material_draft_removed"
  | "material_assets"
  | "material_assets_confirmed"
  | "material_asset"
  | "material_asset_recycled"
  | "material_assets_recycled"
  | "material_asset_restored"
  | "material_stats"
  | "material_chat"
  | string;

export type MaterialMessageCardPayload = {
  type: MaterialCardType;
  title?: string;
  message?: string;
  data?: Record<string, unknown>;
  drafts?: MaterialDraft[];
  assets?: MaterialAsset[];
  stats?: MaterialStats | null;
  materialTable?: Record<string, unknown> | null;
  confirmState?: MaterialConfirmState;
  actionsDisabled?: boolean;
  actions?: Array<{
    label: string;
    action: string;
    params?: Record<string, unknown>;
  }>;
};

export type MaterialUploadFileItem = {
  filePath?: string;
  browserFile?: Blob;
  fileName?: string;
};

export type CommonUploadedFile = {
  id?: string;
  url: string;
  storageUrl?: string | null;
  originalName: string;
  mimeType?: string | null;
  size: number;
  storageKey?: string | null;
  storageProvider?: string | null;
  sha256?: string | null;
};

export type CommonUploadFilesResponse = {
  files: CommonUploadedFile[];
};

export type MaterialChatAttachment = {
  id?: string;
  url: string;
  originalName: string;
  mimeType?: string | null;
  size: number;
  storageKey?: string | null;
  storageProvider?: string | null;
  sha256?: string | null;
};

export type MaterialUploadFilesResponse = {
  tenantId: string;
  sessionId: string;
  userMessage: AgentMessage;
  assistantMessage: AgentMessage;
  drafts: MaterialDraft[];
  stats?: MaterialStats;
  message?: string;
  nextActions?: string[];
  ui?: StrategyUiDescriptor | Record<string, unknown>;
};

export type MaterialChatResponse = {
  tenantId: string;
  sessionId: string;
  agentCode?: string;
  userMessage: AgentMessage;
  assistantMessage: AgentMessage;
  drafts?: MaterialDraft[];
  assets?: MaterialAsset[];
  stats?: MaterialStats;
  materialTable?: Record<string, unknown>;
  ui?: StrategyUiDescriptor | Record<string, unknown>;
  [key: string]: unknown;
};

export type MaterialDraftsResponse = {
  tenantId: string;
  sessionId?: string;
  draft?: MaterialDraft;
  drafts?: MaterialDraft[];
  message?: string;
  ui?: StrategyUiDescriptor | Record<string, unknown>;
};

export type MaterialAssetsResponse = {
  tenantId: string;
  asset?: MaterialAsset;
  assets?: MaterialAsset[];
  stats?: MaterialStats;
  message?: string;
  pagination?: Record<string, unknown>;
  ui?: StrategyUiDescriptor | Record<string, unknown>;
};
