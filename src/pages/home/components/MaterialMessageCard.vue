<template>
  <view
    v-if="cardReady"
    class="material-card"
  >
    <view v-if="showCardHeader" class="card-header">
      <view class="card-heading">
        <text class="card-title">{{ cardTitle }}</text>
        <text v-if="cardMessage" class="card-message">{{ cardMessage }}</text>
      </view>
      <text v-if="statsText" class="card-stat">{{ statsText }}</text>
    </view>

    <MaterialDraftCard
      v-if="drafts.length"
      :drafts="drafts"
      :confirm-state="draftConfirmState"
      :actions-disabled="draftActionsDisabled"
      @confirm="(payload) => emit('action', 'material_confirm_drafts', payload)"
      @update-draft="
        (payload) => emit('action', 'material_update_draft', payload)
      "
      @generate-metadata="
        (payload) => emit('action', 'material_generate_metadata', payload)
      "
      @remove-draft="
        (payload) => emit('action', 'material_remove_draft', payload)
      "
      @batch-generate-drafts="
        (payload) => emit('action', 'material_batch_generate_drafts', payload)
      "
      @batch-update-drafts="
        (payload) => emit('action', 'material_batch_update_drafts', payload)
      "
      @batch-remove-drafts="
        (payload) => emit('action', 'material_batch_remove_drafts', payload)
      "
      @upload-more="() => emit('action', 'material_upload_more')"
    />

    <MaterialAssetTable
      v-else-if="assets.length"
      :assets="assets"
      :actions-disabled="actionsDisabled"
      @update-asset="
        (payload) => emit('action', 'material_update_asset', payload)
      "
      @recycle="(payload) => emit('action', 'material_recycle_asset', payload)"
      @batch-recycle="
        (payload) => emit('action', 'material_batch_recycle_assets', payload)
      "
      @restore="(payload) => emit('action', 'material_restore_asset', payload)"
    />

    <view v-else-if="statsText" class="stats-only">
      <text>{{ statsText }}</text>
    </view>

    <view v-if="showAssetTools" class="asset-card-actions">
      <button
        v-if="showMoreButton"
        class="asset-action-button primary-action"
        :disabled="modalLoading"
        @click="openMoreModal"
      >
        查看更多
      </button>
    </view>

    <view v-if="assetModalVisible" class="asset-modal-mask" @click="closeAssetModal">
      <view class="asset-modal-panel" @click.stop>
        <view class="asset-modal-header">
          <view class="asset-modal-heading">
            <text class="asset-modal-title">{{ assetModalTitle }}</text>
            <text v-if="assetModalSubtitle" class="asset-modal-subtitle">
              {{ assetModalSubtitle }}
            </text>
          </view>
          <button class="asset-modal-close" @click="closeAssetModal">×</button>
        </view>

        <view class="asset-modal-toolbar">
          <text class="asset-modal-count">{{ modalPaginationText }}</text>
          <button
            class="asset-modal-refresh"
            :disabled="modalLoading"
            @click="reloadAssetModal"
          >
            刷新
          </button>
        </view>

        <view v-if="modalError" class="asset-modal-error">
          <text>{{ modalError }}</text>
        </view>

        <view v-if="modalLoading && !modalAssets.length" class="asset-modal-loading">
          <text>正在加载素材</text>
        </view>

        <MaterialAssetTable
          v-else
          :assets="modalAssets"
          :actions-disabled="actionsDisabled || modalLoading"
          @update-asset="handleModalUpdateAsset"
          @recycle="handleModalRecycle"
          @batch-recycle="handleModalBatchRecycle"
          @restore="handleModalRestore"
        />

        <view class="asset-modal-pagination">
          <button
            class="page-button"
            :disabled="modalLoading || modalPage <= 1"
            @click="loadAssetModalPage(modalPage - 1)"
          >
            上一页
          </button>
          <text class="page-text">{{ modalPageText }}</text>
          <button
            class="page-button"
            :disabled="modalLoading || !modalHasMore"
            @click="loadAssetModalPage(modalPage + 1)"
          >
            下一页
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { getUserErrorMessage, request } from "@/services/api";
import type {
  MaterialAsset,
  MaterialAssetsResponse,
  MaterialConfirmState,
  MaterialDraft,
  MaterialMessageCardPayload,
} from "@/types/material";
import type { AgentMessageMetadata } from "@/types/strategy";
import MaterialAssetTable from "./MaterialAssetTable.vue";
import MaterialDraftCard from "./MaterialDraftCard.vue";

const props = defineProps<{
  metadata?: AgentMessageMetadata | null;
  actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
  action: [action: string, payload?: Record<string, unknown>];
}>();

type ModalQueryValue = string | number | boolean | null | undefined;
type ModalQuery = Record<string, ModalQueryValue>;

const assetModalVisible = ref(false);
const modalAssets = ref<MaterialAsset[]>([]);
const modalLoading = ref(false);
const modalError = ref("");
const modalEndpoint = ref("/material/assets");
const modalBaseQuery = ref<ModalQuery>({});
const modalPage = ref(1);
const modalPageSize = ref(20);
const modalTotal = ref<number | null>(null);
const modalHasMore = ref(false);
let modalRefreshTimer: ReturnType<typeof setTimeout> | null = null;

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

function hasRecordData(value: Record<string, unknown>) {
  return Object.keys(value).length > 0;
}

function isMaterialType(type: string) {
  return type.startsWith("material_");
}

const card = computed(
  () => asRecord(props.metadata?.card) as MaterialMessageCardPayload,
);
const cardData = computed(() => asRecord(card.value.data));
const drafts = computed<MaterialDraft[]>(() => {
  const direct = Array.isArray(card.value.drafts) ? card.value.drafts : [];
  const fromData = Array.isArray(cardData.value.drafts)
    ? (cardData.value.drafts as MaterialDraft[])
    : [];

  return direct.length ? direct : fromData;
});
const materialTable = computed(() =>
  asRecord(card.value.materialTable || cardData.value.materialTable),
);
const materialTablePagination = computed(() =>
  asRecord(materialTable.value.pagination),
);
const materialTableMore = computed(() => asRecord(materialTable.value.more));
const assets = computed<MaterialAsset[]>(() => {
  const direct = Array.isArray(card.value.assets) ? card.value.assets : [];
  const fromData = Array.isArray(cardData.value.assets)
    ? (cardData.value.assets as MaterialAsset[])
    : [];
  const tableRows = Array.isArray(materialTable.value.rows)
    ? (materialTable.value.rows as MaterialAsset[])
    : [];

  return direct.length ? direct : fromData.length ? fromData : tableRows;
});
const stats = computed(() =>
  asRecord(card.value.stats || cardData.value.stats),
);
const cardType = computed(() => {
  const type = String(card.value.type || "").trim();

  if (isMaterialType(type)) {
    return type;
  }

  if (drafts.value.length > 0) {
    return "material_drafts";
  }

  if (assets.value.length > 0 || hasRecordData(materialTable.value)) {
    return "material_assets";
  }

  if (hasRecordData(stats.value)) {
    return "material_stats";
  }

  return "";
});
const isMaterialCard = computed(() => Boolean(cardType.value));
const cardTitle = computed(() => {
  if (drafts.value.length) {
    if (draftConfirmState.value === "confirmed") {
      return "素材已入库";
    }
    if (draftConfirmState.value === "expired") {
      return "素材确认已失效";
    }

    return "临时区素材";
  }

  return card.value.title || resolveTitle(cardType.value);
});
const cardMessage = computed(() =>
  drafts.value.length && draftConfirmState.value === "pending"
    ? ""
    : String(card.value.message || "").trim(),
);
const draftConfirmState = computed<MaterialConfirmState>(() => {
  const explicitState = normalizeConfirmState(
    card.value.confirmState || cardData.value.confirmState,
  );
  if (explicitState) {
    return explicitState;
  }
  if (
    drafts.value.length > 0 &&
    drafts.value.every((draft) => draft.status === "confirmed")
  ) {
    return "confirmed";
  }
  if (
    drafts.value.length > 0 &&
    drafts.value.every(
      (draft) => draft.status === "expired" || draft.confirmState === "expired",
    )
  ) {
    return "expired";
  }

  return "pending";
});
const draftActionsDisabled = computed(
  () =>
    props.actionsDisabled ||
    card.value.actionsDisabled === true ||
    draftConfirmState.value !== "pending",
);
const hasDraftConfirmationDetails = computed(() => drafts.value.length > 0);
const statsText = computed(() => {
  if (drafts.value.length) {
    const size = drafts.value.reduce(
      (total, draft) => total + (draft.size || 0),
      0,
    );

    return [`${drafts.value.length} 个素材`, size > 0 ? formatBytes(size) : ""]
      .filter(Boolean)
      .join(" · ");
  }

  const usedReadable = String(stats.value.usedReadable || "").trim();
  const totalCount =
    typeof stats.value.totalCount === "number" ? stats.value.totalCount : null;

  if (totalCount === null && !usedReadable) {
    return "";
  }

  return [
    totalCount !== null ? `${totalCount} 个素材` : "",
    usedReadable ? `占用 ${usedReadable}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
});
const cardReady = computed(
  () =>
    isMaterialCard.value &&
    (drafts.value.length > 0 ||
      assets.value.length > 0 ||
      Boolean(statsText.value)),
);
const showCardHeader = computed(
  () =>
    draftConfirmState.value !== "pending" ||
    !(drafts.value.length > 0 && !hasDraftConfirmationDetails.value),
);
const showMoreButton = computed(
  () =>
    Boolean(getBoolean(materialTablePagination.value.hasMore)) ||
    hasRecordData(materialTableMore.value),
);
const showAssetTools = computed(
  () =>
    showMoreButton.value &&
    drafts.value.length === 0 &&
    (assets.value.length > 0 ||
      hasRecordData(materialTable.value) ||
      hasRecordData(stats.value)),
);
const currentTenantId = computed(() =>
  getString(
    asRecord(props.metadata).tenantId ||
      asRecord(card.value).tenantId ||
      cardData.value.tenantId,
  ),
);
const isRecycleModal = computed(
  () => getString(modalBaseQuery.value.area) === "recycle_bin",
);
const assetModalTitle = computed(() =>
  isRecycleModal.value ? "更多回收站素材" : "更多素材",
);
const assetModalSubtitle = computed(() => {
  if (isRecycleModal.value) {
    return "回收站素材保留 7 天，超过保留期后将自动彻底删除。";
  }

  const query = getString(
    materialTable.value.query || materialTable.value.rawQuery,
  );
  return query ? `当前检索：${query}` : "";
});
const modalPaginationText = computed(() => {
  if (modalTotal.value !== null) {
    return `共 ${modalTotal.value} 个素材`;
  }

  return modalAssets.value.length
    ? `当前页 ${modalAssets.value.length} 个素材`
    : "暂无素材";
});
const modalPageText = computed(() => {
  const totalPages =
    modalTotal.value !== null
      ? Math.max(1, Math.ceil(modalTotal.value / modalPageSize.value))
      : null;

  return totalPages ? `${modalPage.value} / ${totalPages}` : `第 ${modalPage.value} 页`;
});

function resolveTitle(type: string) {
  const titleMap: Record<string, string> = {
    material_drafts: "待确认素材",
    material_assets: "素材检索结果",
    material_assets_confirmed: "入库完成",
    material_asset_recycled: "已移入回收站",
    material_assets_recycled: "已批量移入回收站",
    material_asset_restored: "素材已恢复",
    material_stats: "素材库统计",
  };

  return titleMap[type] || "素材智能体";
}

function normalizeConfirmState(value: unknown): MaterialConfirmState | "" {
  const state = String(value || "").trim();
  if (state === "confirmed" || state === "expired" || state === "pending") {
    return state;
  }

  return "";
}

function getDraftDirectoryName(draft: MaterialDraft) {
  return (
    draft.userEditedDirectoryName ||
    draft.directoryName ||
    draft.generatedDirectoryName ||
    ""
  ).trim();
}

function getDraftMaterialName(draft: MaterialDraft) {
  return (
    draft.userEditedName ||
    draft.materialName ||
    draft.generatedName ||
    ""
  ).trim();
}

function getDraftTags(draft: MaterialDraft) {
  if (draft.userEditedTags?.length) {
    return draft.userEditedTags;
  }

  if (draft.tags?.length) {
    return draft.tags;
  }

  return draft.generatedTags || [];
}

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown) {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  return Number.isFinite(numeric) ? numeric : null;
}

function getBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes"].includes(value.trim().toLowerCase());
  }

  return false;
}

function normalizeEndpoint(value: unknown) {
  const endpoint = getString(value);
  if (!endpoint) {
    return "/material/assets";
  }

  if (/^https?:\/\//i.test(endpoint)) {
    try {
      const parsed = new URL(endpoint);
      return `${parsed.pathname}${parsed.search}`.replace(/^\/api(?=\/)/, "");
    } catch {
      return "/material/assets";
    }
  }

  return endpoint.replace(/^\/api(?=\/)/, "");
}

function toModalQuery(value: unknown): ModalQuery {
  const record = asRecord(value);

  return Object.entries(record).reduce<ModalQuery>((query, [key, item]) => {
    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean" ||
      item === null ||
      item === undefined
    ) {
      query[key] = item;
    }

    return query;
  }, {});
}

function withTenantQuery(query: ModalQuery) {
  const tenantId = currentTenantId.value;
  return tenantId ? { tenantId, ...query } : query;
}

function openMoreModal() {
  resetAssetModalState();
  modalEndpoint.value = normalizeEndpoint(
    materialTableMore.value.endpoint || "/material/assets",
  );

  const moreQuery = toModalQuery(materialTableMore.value.query);
  const fallbackQuery = toModalQuery({
    query: materialTable.value.query || materialTable.value.rawQuery,
    area: "official",
    pageSize: 20,
  });
  modalBaseQuery.value = withTenantQuery({
    ...(hasRecordData(moreQuery) ? moreQuery : fallbackQuery),
    pageSize:
      getNumber(moreQuery.pageSize) ||
      getNumber(fallbackQuery.pageSize) ||
      20,
  });
  assetModalVisible.value = true;
  void loadAssetModalPage(1);
}

function resetAssetModalState() {
  modalAssets.value = [];
  modalError.value = "";
  modalPage.value = 1;
  modalTotal.value = null;
  modalHasMore.value = false;
}

function closeAssetModal() {
  assetModalVisible.value = false;
  modalError.value = "";
}

async function loadAssetModalPage(page: number) {
  const nextPage = Math.max(1, Math.floor(page));
  const pageSize = Math.max(
    1,
    Math.floor(getNumber(modalBaseQuery.value.pageSize) || modalPageSize.value),
  );
  modalLoading.value = true;
  modalError.value = "";

  try {
    const result = await request<MaterialAssetsResponse>(modalEndpoint.value, {
      method: "GET",
      query: {
        ...modalBaseQuery.value,
        page: nextPage,
        pageSize,
      },
    });
    const pagination = asRecord(result.pagination);
    modalAssets.value = result.assets ?? [];
    modalPage.value = getNumber(pagination.page) || nextPage;
    modalPageSize.value = getNumber(pagination.pageSize) || pageSize;
    modalTotal.value = getNumber(pagination.total);
    modalHasMore.value = getBoolean(pagination.hasMore);
  } catch (err) {
    modalError.value = getUserErrorMessage(err, "加载素材列表失败");
  } finally {
    modalLoading.value = false;
  }
}

function reloadAssetModal() {
  void loadAssetModalPage(modalPage.value);
}

function scheduleAssetModalRefresh() {
  if (!assetModalVisible.value) {
    return;
  }

  if (modalRefreshTimer) {
    clearTimeout(modalRefreshTimer);
  }
  modalRefreshTimer = setTimeout(() => {
    modalRefreshTimer = null;
    void loadAssetModalPage(modalPage.value);
  }, 1200);
}

function handleModalUpdateAsset(payload: {
  assetId: string;
  materialName?: string;
  description?: string;
  directoryName?: string;
  tags?: string[];
}) {
  emit("action", "material_update_asset", payload);
  scheduleAssetModalRefresh();
}

function handleModalRecycle(payload: { assetId: string; materialName: string }) {
  emit("action", "material_recycle_asset", payload);
  scheduleAssetModalRefresh();
}

function handleModalBatchRecycle(payload: { assetIds: string[] }) {
  emit("action", "material_batch_recycle_assets", payload);
  scheduleAssetModalRefresh();
}

function handleModalRestore(payload: { assetId: string; materialName: string }) {
  emit("action", "material_restore_asset", payload);
  scheduleAssetModalRefresh();
}

onBeforeUnmount(() => {
  if (modalRefreshTimer) {
    clearTimeout(modalRefreshTimer);
    modalRefreshTimer = null;
  }
});
</script>

<style scoped>
.material-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  color: #263142;
  background: #ffffff;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
}

.material-card.compact {
  width: min(100%, 620px);
  padding: 0;
  background: transparent;
  border: 0;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-heading {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.card-title {
  color: #111827;
  font-size: 13px;
  font-weight: 800;
}

.card-message {
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.card-stat {
  flex: 0 0 auto;
  max-width: 220px;
  overflow: hidden;
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stats-only {
  padding: 12px;
  color: #334155;
  font-size: 13px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.asset-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.asset-action-button {
  height: 32px;
  min-width: 74px;
  margin: 0;
  padding: 0 12px;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  line-height: 32px;
  background: #f1f5f9;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
}

.asset-action-button.primary-action {
  color: #ffffff;
  background: #1267ff;
  border-color: #1267ff;
}

.asset-action-button::after,
.asset-modal-close::after,
.asset-modal-refresh::after,
.page-button::after {
  border: 0;
}

.asset-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 980;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 22px;
  background: rgba(15, 23, 42, 0.48);
}

.asset-modal-panel {
  position: relative;
  box-sizing: border-box;
  display: flex;
  width: min(980px, 100%);
  max-height: min(760px, 90vh);
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.24);
}

.asset-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-right: 34px;
}

.asset-modal-heading {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.asset-modal-title {
  color: #0f172a;
  font-size: 16px;
  font-weight: 800;
  line-height: 22px;
}

.asset-modal-subtitle {
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

.asset-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  color: #334155;
  font-size: 18px;
  font-weight: 700;
  line-height: 28px;
  background: #f1f5f9;
  border: 0;
  border-radius: 50%;
}

.asset-modal-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.asset-modal-count {
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.asset-modal-refresh {
  height: 30px;
  min-width: 58px;
  margin: 0;
  padding: 0 12px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  line-height: 30px;
  background: #ccfbf1;
  border: 0;
  border-radius: 8px;
}

.asset-modal-error {
  padding: 10px 12px;
  color: #b91c1c;
  font-size: 12px;
  line-height: 18px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.asset-modal-loading {
  display: flex;
  min-height: 160px;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 13px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}

.asset-modal-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding-top: 2px;
}

.page-button {
  height: 30px;
  min-width: 70px;
  margin: 0;
  padding: 0 12px;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  line-height: 30px;
  background: #f1f5f9;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
}

.page-text {
  min-width: 72px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 30px;
  text-align: center;
}

button[disabled] {
  opacity: 0.5;
}

@media (max-width: 720px) {
  .material-card {
    width: 100%;
  }

  .card-header {
    flex-direction: column;
  }

  .card-stat {
    max-width: 100%;
  }

  .asset-card-actions {
    justify-content: flex-start;
  }

  .asset-modal-mask {
    align-items: flex-end;
    padding: 10px;
  }

  .asset-modal-panel {
    width: 100%;
    max-height: 92vh;
  }
}
</style>
