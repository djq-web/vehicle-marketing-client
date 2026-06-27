<template>
  <view class="asset-card-wrap">
    <view v-if="rows.length" class="asset-toolbar">
      <text class="result-count">共 {{ rows.length }} 个素材</text>
      <button
        v-if="selectedIds.length"
        class="danger small"
        :disabled="actionsDisabled"
        @click="emitBatchRecycle"
      >
        批量删除 {{ selectedIds.length }}
      </button>
    </view>

    <view v-if="rows.length" class="asset-card-list">
      <view
        v-for="asset in rows"
        :key="asset.id"
        class="asset-item"
        :class="{ selected: selectedMap[asset.id] === true }"
      >
        <view class="asset-card-head">
          <checkbox
            v-if="canSelectAsset(asset)"
            :checked="selectedMap[asset.id] === true"
            :disabled="actionsDisabled"
            color="#0f766e"
            @click.stop="toggleSelected(asset.id)"
          />
          <view v-else class="selection-spacer"></view>
          <view class="asset-icon-actions">
            <button
              class="icon-button"
              data-tooltip="查看详情"
              aria-label="查看详情"
              @click="openDetail(asset)"
            >
              <uni-icons type="info" size="15" color="#475569" />
            </button>
            <button
              v-if="asset.area !== 'recycle_bin'"
              class="icon-button"
              data-tooltip="编辑素材"
              aria-label="编辑素材"
              :disabled="actionsDisabled"
              @click="openNameEditor(asset)"
            >
              <uni-icons type="compose" size="15" color="#475569" />
            </button>
            <button
              v-if="asset.area !== 'recycle_bin'"
              class="icon-button danger-icon"
              data-tooltip="删除素材"
              aria-label="删除素材"
              :disabled="actionsDisabled"
              @click="emitRecycle(asset)"
            >
              <uni-icons type="trash" size="15" color="#b91c1c" />
            </button>
            <button
              v-else
              class="icon-button restore-icon"
              data-tooltip="恢复素材"
              aria-label="恢复素材"
              :disabled="actionsDisabled || asset.recoverable === false"
              @click="emitRestore(asset)"
            >
              <text class="restore-symbol">↩</text>
            </button>
          </view>
        </view>

        <view class="asset-card-main">
          <view class="asset-preview">
            <MaterialPreview
              :id="asset.id"
              kind="asset"
              :name="asset.originalName || asset.materialName"
              :material-type="asset.materialType"
              :file-extension="asset.fileExtension"
              :mime-type="asset.mimeType"
              :size-readable="asset.sizeReadable"
              :preview="asset.preview"
              :preview-url="
                asset.previewUrl || asset.storageUrl || asset.preview?.url
              "
              compact
            />
          </view>

          <view class="asset-summary">
            <text class="asset-name">{{ getDisplayName(asset) }}</text>
            <text class="asset-directory">{{
              asset.directoryName || "-"
            }}</text>
          </view>
        </view>

        <view class="asset-tags">
          <text
            v-for="tag in getVisibleTags(asset)"
            :key="`${asset.id}-${tag}`"
            class="tag"
          >
            {{ tag }}
          </text>
          <text v-if="hasHiddenTags(asset)" class="tag muted-tag"
            >+{{ getHiddenTagCount(asset) }}</text
          >
          <text v-if="!(asset.tags || []).length" class="muted">暂无标签</text>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <text>暂无素材</text>
    </view>

    <view v-if="editingAsset" class="edit-mask" @click="closeNameEditor">
      <view class="edit-dialog" @click.stop>
        <view class="edit-header">
          <text class="edit-title">编辑素材信息</text>
          <button class="edit-close" @click="closeNameEditor">×</button>
        </view>
        <text class="edit-tip">
          当前会话消息是快照，保存后历史卡片可能不会自动刷新；请重新搜索查看最新素材信息。
        </text>
        <view class="edit-form-grid">
          <view class="edit-field">
            <text class="edit-label">素材名称</text>
            <input
              v-model.trim="editingForm.materialName"
              class="edit-input"
              maxlength="80"
              placeholder="请输入素材名称"
            />
          </view>
          <view class="edit-field">
            <text class="edit-label">素材目录</text>
            <input
              v-model.trim="editingForm.directoryName"
              class="edit-input"
              maxlength="120"
              placeholder="请输入素材目录"
            />
          </view>
          <view class="edit-field wide">
            <text class="edit-label">素材描述</text>
            <textarea
              v-model="editingForm.description"
              class="edit-textarea"
              auto-height
              maxlength="1000"
              placeholder="请输入素材描述"
            />
          </view>
          <view class="edit-field wide">
            <text class="edit-label">素材标签</text>
            <input
              v-model="editingForm.tagsText"
              class="edit-input"
              placeholder="用逗号分隔多个标签"
            />
          </view>
        </view>
        <view class="edit-actions">
          <button class="secondary dialog-button" @click="closeNameEditor">
            取消
          </button>
          <button
            class="primary dialog-button"
            :disabled="!canSubmitAssetEdit"
            @click="emitUpdateAsset"
          >
            保存
          </button>
        </view>
      </view>
    </view>

    <view v-if="detailAsset" class="edit-mask" @click="closeDetail">
      <view class="detail-dialog" @click.stop>
        <view class="edit-header">
          <text class="edit-title">素材详情</text>
          <view class="detail-header-actions">
            <button
              v-if="canEditAsset(detailAsset)"
              class="detail-edit-button"
              :disabled="actionsDisabled"
              @click="openNameEditor(detailAsset)"
            >
              编辑
            </button>
            <button class="edit-close" @click="closeDetail">×</button>
          </view>
        </view>

        <view class="detail-preview">
          <MaterialPreview
            :id="detailAsset.id"
            kind="asset"
            :name="detailAsset.originalName || detailAsset.materialName"
            :material-type="detailAsset.materialType"
            :file-extension="detailAsset.fileExtension"
            :mime-type="detailAsset.mimeType"
            :size-readable="detailAsset.sizeReadable"
            :preview="detailAsset.preview"
            :preview-url="
              detailAsset.previewUrl ||
              detailAsset.storageUrl ||
              detailAsset.preview?.url
            "
          />
        </view>

        <view class="detail-list">
          <view
            v-for="item in detailItems"
            :key="item.label"
            class="detail-row"
          >
            <text class="detail-label">{{ item.label }}</text>
            <text class="detail-value">{{ item.value }}</text>
          </view>
        </view>

        <view v-if="detailTags.length" class="detail-tags">
          <text
            v-for="tag in detailTags"
            :key="`detail-${detailAsset.id}-${tag}`"
            class="tag"
          >
            {{ tag }}
          </text>
        </view>

        <text v-if="detailAsset.matchReason" class="detail-reason">
          {{ detailAsset.matchReason }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { MaterialAsset } from "@/types/material";
import MaterialPreview from "./MaterialPreview.vue";

const props = defineProps<{
  assets: MaterialAsset[];
  actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
  updateAsset: [
    payload: {
      assetId: string;
      materialName?: string;
      description?: string;
      directoryName?: string;
      tags?: string[];
    },
  ];
  recycle: [payload: { assetId: string; materialName: string }];
  batchRecycle: [payload: { assetIds: string[] }];
  restore: [payload: { assetId: string; materialName: string }];
}>();

type AssetEditForm = {
  materialName: string;
  directoryName: string;
  description: string;
  tagsText: string;
};

const selectedMap = reactive<Record<string, boolean>>({});
const editingAsset = ref<MaterialAsset | null>(null);
const editingForm = reactive<AssetEditForm>({
  materialName: "",
  directoryName: "",
  description: "",
  tagsText: "",
});
const detailAsset = ref<MaterialAsset | null>(null);

const rows = computed(() => props.assets.filter((asset) => asset.id));
const selectedIds = computed(() =>
  Object.entries(selectedMap)
    .filter(([id, selected]) => {
      if (!selected) {
        return false;
      }

      const asset = rows.value.find((item) => item.id === id);
      return Boolean(asset && canSelectAsset(asset));
    })
    .map(([id]) => id),
);
const canSubmitAssetEdit = computed(() => {
  const asset = editingAsset.value;

  return Boolean(
    asset &&
      canEditAsset(asset) &&
      normalizeText(editingForm.materialName) &&
      normalizeText(editingForm.directoryName) &&
      normalizeText(editingForm.description) &&
      normalizeTags(editingForm.tagsText).length > 0 &&
      isAssetEditChanged(asset),
  );
});
const detailTags = computed(() => detailAsset.value?.tags || []);
const detailItems = computed(() => {
  const asset = detailAsset.value;
  if (!asset) {
    return [];
  }

  const items = [
    { label: "素材名称", value: getDisplayName(asset) },
    { label: "素材目录", value: asset.directoryName || "-" },
    { label: "素材描述", value: asset.description || "-" },
    { label: "原始文件名", value: asset.originalName || "-" },
    { label: "素材类型", value: getTypeText(asset) || "-" },
    {
      label: "文件大小",
      value: asset.sizeReadable || formatBytes(asset.size) || "-",
    },
    { label: "MIME 类型", value: asset.mimeType || "-" },
    { label: "上传人", value: asset.ownerName || asset.ownerAccountId || "-" },
    { label: "创建时间", value: formatDateTime(asset.createdAt) },
    { label: "更新时间", value: formatDateTime(asset.updatedAt) },
    { label: "命中来源", value: asset.matchSource || "-" },
    {
      label: "索引状态",
      value: asset.indexStatus || asset.status || "-",
    },
  ];

  if (asset.area === "recycle_bin") {
    items.push(
      { label: "回收时间", value: formatDateTime(asset.recycledAt) },
      { label: "保留至", value: formatDateTime(asset.purgeAfter) },
      {
        label: "恢复状态",
        value:
          asset.recoverable === false
            ? "已超过保留期"
            : formatRemainingRecoverable(asset),
      },
    );
  }

  return items;
});

function syncSelection() {
  const activeIds = new Set(rows.value.map((asset) => asset.id));

  Object.keys(selectedMap).forEach((id) => {
    if (!activeIds.has(id)) {
      delete selectedMap[id];
    }
  });
}

function toggleSelected(id: string) {
  const asset = rows.value.find((item) => item.id === id);
  if (!asset || !canSelectAsset(asset)) {
    return;
  }

  selectedMap[id] = !selectedMap[id];
}

function openNameEditor(asset: MaterialAsset | null) {
  if (props.actionsDisabled || !canEditAsset(asset)) {
    return;
  }

  detailAsset.value = null;
  editingAsset.value = asset;
  editingForm.materialName = asset.materialName || "";
  editingForm.directoryName = asset.directoryName || "";
  editingForm.description = asset.description || "";
  editingForm.tagsText = tagsToText(asset.tags);
}

function closeNameEditor() {
  editingAsset.value = null;
  editingForm.materialName = "";
  editingForm.directoryName = "";
  editingForm.description = "";
  editingForm.tagsText = "";
}

function openDetail(asset: MaterialAsset) {
  detailAsset.value = asset;
}

function closeDetail() {
  detailAsset.value = null;
}

function emitUpdateAsset() {
  const asset = editingAsset.value;
  if (!asset || !canSubmitAssetEdit.value) {
    return;
  }

  emit("updateAsset", {
    assetId: asset.id,
    materialName: normalizeText(editingForm.materialName),
    directoryName: normalizeText(editingForm.directoryName),
    description: normalizeText(editingForm.description),
    tags: normalizeTags(editingForm.tagsText),
  });
  closeNameEditor();
}

function emitRecycle(asset: MaterialAsset) {
  emit("recycle", {
    assetId: asset.id,
    materialName: asset.materialName,
  });
}

function emitRestore(asset: MaterialAsset) {
  emit("restore", {
    assetId: asset.id,
    materialName: asset.materialName,
  });
}

function emitBatchRecycle() {
  emit("batchRecycle", { assetIds: selectedIds.value });
}

function canSelectAsset(asset: MaterialAsset) {
  return !props.actionsDisabled && asset.area !== "recycle_bin";
}

function canEditAsset(asset: MaterialAsset | null): asset is MaterialAsset {
  return Boolean(asset && asset.area !== "recycle_bin");
}

function getDisplayName(asset: MaterialAsset) {
  return asset.materialName || asset.originalName || "未命名素材";
}

function getVisibleTags(asset: MaterialAsset) {
  return (asset.tags || []).slice(0, 3);
}

function getHiddenTagCount(asset: MaterialAsset) {
  return Math.max(0, (asset.tags || []).length - getVisibleTags(asset).length);
}

function hasHiddenTags(asset: MaterialAsset) {
  return getHiddenTagCount(asset) > 0;
}

function tagsToText(tags?: string[] | null) {
  return (tags || []).join("，");
}

function normalizeText(value?: string | null) {
  return (value || "").trim();
}

function normalizeTags(value: string) {
  const seen = new Set<string>();

  return value
    .split(/[,，、\n]/)
    .map((tag) => tag.trim())
    .filter((tag) => {
      if (!tag || seen.has(tag)) {
        return false;
      }

      seen.add(tag);
      return true;
    });
}

function isAssetEditChanged(asset: MaterialAsset) {
  const nextTags = normalizeTags(editingForm.tagsText);
  const currentTags = asset.tags || [];

  return (
    normalizeText(editingForm.materialName) !==
      normalizeText(asset.materialName) ||
    normalizeText(editingForm.directoryName) !==
      normalizeText(asset.directoryName) ||
    normalizeText(editingForm.description) !== normalizeText(asset.description) ||
    nextTags.join("\n") !== currentTags.join("\n")
  );
}

function getTypeText(asset: MaterialAsset) {
  return [
    asset.materialType || "文件",
    asset.fileExtension ? `.${asset.fileExtension}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${formatDate(value)} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function formatBytes(value?: number | null) {
  if (!value || value <= 0) {
    return "";
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatRemainingRecoverable(asset: MaterialAsset) {
  const seconds = asset.remainingRecoverableSeconds;
  if (typeof seconds === "number" && Number.isFinite(seconds)) {
    if (seconds <= 0) {
      return "已超过保留期";
    }

    const days = Math.ceil(seconds / 86400);
    return `剩余 ${days} 天`;
  }

  if (!asset.purgeAfter) {
    return "可恢复";
  }

  const diff = new Date(asset.purgeAfter).getTime() - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) {
    return "已超过保留期";
  }

  return `剩余 ${Math.ceil(diff / 86400000)} 天`;
}

watch(() => props.assets, syncSelection, { immediate: true, deep: true });
</script>

<style scoped>
.asset-card-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.asset-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.result-count {
  color: #64748b;
  font-size: 12px;
}

.asset-card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(172px, 196px));
  gap: 10px;
  justify-content: start;
}

.asset-item {
  position: relative;
  box-sizing: border-box;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.asset-item:hover,
.asset-item:focus-within {
  border-color: #bfdbfe;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.1);
}

.asset-item.selected {
  border-color: #0f766e;
  box-shadow: 0 0 0 1px rgba(15, 118, 110, 0.12);
}

.asset-card-head {
  position: absolute;
  top: 8px;
  right: 8px;
  left: 8px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 24px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease;
}

.asset-item:hover .asset-card-head,
.asset-item:focus-within .asset-card-head,
.asset-item.selected .asset-card-head {
  opacity: 1;
  pointer-events: auto;
}

.asset-icon-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
}

.selection-spacer {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
}

.icon-button {
  position: relative;
  display: flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(203, 213, 225, 0.9);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}

.icon-button::before {
  position: absolute;
  right: 50%;
  bottom: calc(100% + 7px);
  z-index: 5;
  box-sizing: border-box;
  max-width: 120px;
  padding: 4px 7px;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  line-height: 14px;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
  content: attr(data-tooltip);
  background: rgba(15, 23, 42, 0.92);
  border-radius: 6px;
  opacity: 0;
  transform: translateX(50%) translateY(3px);
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.icon-button:hover::before,
.icon-button:focus-visible::before {
  opacity: 1;
  transform: translateX(50%) translateY(0);
}

.icon-button.danger-icon {
  background: rgba(255, 247, 247, 0.96);
  border-color: #fee2e2;
}

.icon-button.restore-icon {
  color: #0f766e;
  background: rgba(240, 253, 250, 0.96);
  border-color: #99f6e4;
}

.restore-symbol {
  color: #0f766e;
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
}

.icon-button::after,
.edit-close::after,
.dialog-button::after,
button.small::after {
  border: 0;
}

.asset-card-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.asset-preview {
  width: 100%;
  min-width: 0;
}

.asset-preview :deep(.image-button),
.asset-preview :deep(.media-button),
.asset-preview :deep(.preview-video) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 108px;
  border-radius: 7px;
}

.asset-preview :deep(.file-info),
.asset-preview :deep(.audio-preview) {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 108px;
  justify-content: center;
  padding: 9px;
  border-radius: 7px;
}

.asset-preview :deep(.file-mark) {
  width: 42px;
  height: 42px;
  font-size: 9px;
  border-radius: 6px;
}

.asset-preview :deep(.file-copy) {
  display: none;
}

.asset-preview :deep(.audio-title) {
  max-width: 100%;
  font-size: 11px;
  text-align: center;
}

.asset-preview :deep(.preview-audio) {
  display: none;
}

.asset-summary {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.asset-name {
  display: -webkit-box;
  min-width: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  line-height: 17px;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.asset-directory {
  overflow: hidden;
  color: #64748b;
  font-size: 11px;
  line-height: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 20px;
}

.tag {
  max-width: 78px;
  padding: 2px 6px;
  overflow: hidden;
  color: #0f766e;
  font-size: 10px;
  line-height: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #ccfbf1;
  border-radius: 999px;
}

.muted-tag {
  color: #64748b;
  background: #e2e8f0;
}

.muted {
  color: #94a3b8;
  font-size: 11px;
  line-height: 18px;
}

button.small {
  min-width: 58px;
  height: 28px;
  margin: 0;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 700;
  border: 0;
  border-radius: 8px;
}

.secondary {
  color: #334155;
  background: #e2e8f0;
}

.primary {
  color: #ffffff;
  background: #1267ff;
}

.danger {
  color: #b91c1c;
  background: #fee2e2;
}

button[disabled] {
  opacity: 0.5;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 84px;
  color: #64748b;
  font-size: 12px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}

.edit-mask {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.42);
}

.edit-dialog {
  box-sizing: border-box;
  width: min(420px, 100%);
  padding: 16px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
}

.detail-dialog {
  box-sizing: border-box;
  width: min(520px, 100%);
  max-height: min(680px, 88vh);
  padding: 16px;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.edit-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-close {
  display: flex;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  color: #475569;
  font-size: 18px;
  line-height: 28px;
  background: #f1f5f9;
  border: 0;
  border-radius: 50%;
}

.edit-tip {
  display: block;
  margin-top: 10px;
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

.edit-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.edit-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.edit-field.wide {
  grid-column: 1 / -1;
}

.edit-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.edit-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 38px;
  padding: 8px 10px;
  color: #0f172a;
  font-size: 14px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}

.edit-textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 74px;
  padding: 8px 10px;
  color: #0f172a;
  font-size: 14px;
  line-height: 20px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.dialog-button {
  min-width: 72px;
  height: 34px;
  margin: 0;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 700;
  border: 0;
  border-radius: 8px;
}

.detail-preview {
  margin-top: 12px;
}

.detail-header-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.detail-edit-button {
  height: 28px;
  min-width: 52px;
  margin: 0;
  padding: 0 10px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  line-height: 28px;
  background: #ccfbf1;
  border: 0;
  border-radius: 8px;
}

.detail-edit-button::after {
  border: 0;
}

.detail-preview :deep(.image-button) {
  width: 160px;
  height: 112px;
}

.detail-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 14px;
}

.detail-row {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.detail-label {
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

.detail-value {
  overflow-wrap: anywhere;
  color: #0f172a;
  font-size: 12px;
  line-height: 18px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.detail-reason {
  display: block;
  margin-top: 12px;
  padding: 10px;
  color: #475569;
  font-size: 12px;
  line-height: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

@media (hover: none) {
  .asset-card-head {
    opacity: 1;
    pointer-events: auto;
  }
}

@media (max-width: 640px) {
  .asset-card-list {
    grid-template-columns: repeat(auto-fill, minmax(154px, 1fr));
  }

  .asset-item {
    padding: 8px;
  }

  .asset-preview :deep(.image-button),
  .asset-preview :deep(.media-button),
  .asset-preview :deep(.preview-video) {
    width: 100%;
    max-width: 100%;
    height: 96px;
  }

  .asset-preview :deep(.file-info),
  .asset-preview :deep(.audio-preview) {
    width: 100%;
    max-width: 100%;
    min-height: 96px;
  }

  .detail-row {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .edit-form-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
