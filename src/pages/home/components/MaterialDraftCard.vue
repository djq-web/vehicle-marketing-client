<template>
  <view class="draft-card-wrap" :class="{ readonly: interactionDisabled }">
    <view v-if="visibleDrafts.length" class="draft-toolbar">
      <text class="result-count">共 {{ visibleDrafts.length }} 个临时区素材</text>
      <view class="toolbar-right">
        <text v-if="missingDescriptionCount && !selectedIds.length" class="warning-count">
          {{ missingDescriptionCount }} 个待补描述
        </text>
        <template v-if="selectedIds.length">
          <text class="selected-count">已选 {{ selectedIds.length }} 个</text>
          <button class="toolbar-button" :disabled="interactionDisabled" @click="openBatchEditor">
            批量补充描述
          </button>
          <button
            class="toolbar-button danger"
            :disabled="interactionDisabled"
            @click="emitBatchRemoveDrafts"
          >
            批量删除
          </button>
        </template>
      </view>
    </view>

    <view v-if="visibleDrafts.length" class="draft-card-list">
      <view
        v-for="draft in visibleDrafts"
        :key="getDraftId(draft)"
        class="draft-item"
        :class="{
          incomplete: !isDraftFormComplete(draft),
          selected: selectedMap[getDraftId(draft)] === true,
        }"
      >
        <view class="draft-card-head">
          <checkbox
            v-if="canSelectDraft(draft)"
            :checked="selectedMap[getDraftId(draft)] === true"
            :disabled="interactionDisabled"
            color="#0f766e"
            @click.stop="toggleSelected(getDraftId(draft))"
          />
          <view v-else class="selection-spacer"></view>
          <view class="draft-icon-actions">
            <button
              class="icon-button"
              data-tooltip="查看详情"
              aria-label="查看详情"
              @click="openDetail(draft)"
            >
              <uni-icons type="info" size="15" color="#475569" />
            </button>
            <button
              v-if="canModifyDraft(draft)"
              class="icon-button"
              data-tooltip="编辑素材"
              aria-label="编辑素材"
              @click="openEditor(draft)"
            >
              <uni-icons type="compose" size="15" color="#475569" />
            </button>
            <button
              v-if="canModifyDraft(draft)"
              class="icon-button"
              data-tooltip="重新生成"
              aria-label="重新生成素材信息"
              :disabled="!canRegenerateDraft(draft)"
              @click="emitRegenerateDraft(draft)"
            >
              <uni-icons type="refresh" size="15" color="#475569" />
            </button>
            <button
              v-if="canConfirmDraft(draft)"
              class="icon-button confirm-icon"
              data-tooltip="确认入库"
              aria-label="确认入库"
              @click="emitConfirmDraft(draft)"
            >
              <text class="confirm-symbol">✓</text>
            </button>
            <button
              v-if="canModifyDraft(draft)"
              class="icon-button danger-icon"
              data-tooltip="删除草稿"
              aria-label="删除草稿"
              @click="emitRemoveDraft(draft)"
            >
              <uni-icons type="trash" size="15" color="#b91c1c" />
            </button>
          </view>
        </view>

        <view class="draft-card-main">
          <view class="draft-preview">
            <MaterialPreview
              :id="getDraftId(draft)"
              kind="draft"
              :name="draft.originalName"
              :material-type="draft.materialType"
              :file-extension="draft.fileExtension"
              :mime-type="draft.mimeType"
              :size-readable="draft.sizeReadable"
              :preview="draft.preview"
              :preview-url="draft.previewUrl || draft.storageUrl || draft.preview?.url"
              compact
            />
          </view>

          <view class="draft-summary">
            <view class="draft-name-row">
              <text class="draft-name">{{ getDisplayName(draft) }}</text>
              <text class="status-chip" :class="getStatusClass(draft)">
                {{ getStatusLabel(draft.status) }}
              </text>
            </view>
            <text class="draft-directory">{{ getDraftDirectoryName(draft) || "-" }}</text>
            <text
              class="draft-description"
              :class="{ empty: !normalizeText(draft.description) }"
            >
              {{ normalizeText(draft.description) || "待补充素材描述" }}
            </text>
          </view>
        </view>

        <view class="draft-tags">
          <text
            v-for="tag in getVisibleTags(draft)"
            :key="`${getDraftId(draft)}-${tag}`"
            class="tag"
          >
            {{ tag }}
          </text>
          <text v-if="hasHiddenTags(draft)" class="tag muted-tag">
            +{{ getHiddenTagCount(draft) }}
          </text>
          <text v-if="!getDraftTags(draft).length" class="muted">暂无标签</text>
        </view>

        <text v-if="draft.error" class="draft-error">{{ draft.error }}</text>
      </view>
    </view>

    <view v-else class="empty-state">
      <text>暂无临时区素材</text>
    </view>

    <view v-if="showStateNotice" class="state-notice" :class="`state-${normalizedConfirmState}`">
      <text>{{ stateNoticeText }}</text>
    </view>

    <view v-if="editingDraft" class="modal-mask" @click="closeEditor">
      <view class="edit-dialog" @click.stop>
        <view class="modal-header">
          <view class="modal-heading">
            <text class="modal-title">编辑临时区素材</text>
            <text class="modal-subtitle">
              修改描述后可重新生成目录、名称和标签；手动修改会作为确认入库的最终信息。
            </text>
          </view>
          <button class="modal-close" @click="closeEditor">×</button>
        </view>

        <view class="edit-form-grid">
          <view class="edit-field wide">
            <text class="edit-label">素材描述</text>
            <textarea
              v-model="editingForm.description"
              class="edit-textarea"
              auto-height
              maxlength="1000"
              placeholder="补充素材用途、内容或适用场景"
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
          <view class="edit-field">
            <text class="edit-label">素材名称</text>
            <input
              v-model.trim="editingForm.materialName"
              class="edit-input"
              maxlength="120"
              placeholder="请输入素材名称"
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
          <button class="secondary dialog-button" @click="closeEditor">取消</button>
          <button
            class="secondary dialog-button"
            :disabled="!canRegenerateEditingDraft"
            @click="emitRegenerateEditingDraft"
          >
            重新生成
          </button>
          <button
            class="primary dialog-button"
            :disabled="!canSubmitDraftEdit"
            @click="emitUpdateEditingDraft"
          >
            保存
          </button>
          <button
            class="primary dialog-button confirm-dialog-button"
            :disabled="!canConfirmEditingDraft"
            @click="emitConfirmEditingDraft"
          >
            确认入库
          </button>
        </view>
      </view>
    </view>

    <view v-if="batchEditorVisible" class="modal-mask" @click="requestCloseBatchEditor">
      <view class="edit-dialog" @click.stop>
        <view class="modal-header">
          <view class="modal-heading">
            <text class="modal-title">{{ batchModalTitle }}</text>
            <text class="modal-subtitle">
              {{ batchModalSubtitle }}
            </text>
          </view>
          <button
            class="modal-close"
            :disabled="batchStage === 'generating'"
            @click="requestCloseBatchEditor"
          >
            ×
          </button>
        </view>

        <view v-if="batchStage === 'description'" class="batch-form">
          <view class="batch-description-field">
            <text class="edit-label">统一素材描述</text>
            <textarea
              v-model="batchDescription"
              class="edit-textarea"
              auto-height
              maxlength="1000"
              placeholder="例如：端午节活动素材，用于门店海报、社群宣传和产品展示"
            />
          </view>
          <view class="batch-selected-list">
            <text class="batch-selected-title">本次处理的素材</text>
            <view
              v-for="draft in selectedDrafts"
              :key="`batch-desc-${getDraftId(draft)}`"
              class="batch-selected-row"
            >
              <text class="batch-selected-name">{{ draft.originalName }}</text>
              <text class="batch-selected-meta">{{ getDraftTypeText(draft) || "文件" }}</text>
            </view>
          </view>
        </view>

        <view v-else-if="batchStage === 'generating'" class="batch-generating">
          <view class="loading-ring"></view>
          <text class="loading-title">正在生成素材信息</text>
          <text class="loading-copy">
            会根据这段描述生成每个素材的名称、目录和标签，请稍等。
          </text>
          <text class="loading-count">共 {{ selectedIds.length }} 个素材</text>
        </view>

        <view v-else class="batch-review">
          <text v-if="batchError" class="batch-error">{{ batchError }}</text>
          <view
            v-for="draft in selectedDrafts"
            :key="`batch-review-${getDraftId(draft)}`"
            class="batch-result-card"
            :class="{ incomplete: !isDraftFormComplete(draft) }"
          >
            <view class="batch-result-head">
              <text class="batch-result-name">{{ draft.originalName }}</text>
              <text class="status-chip" :class="getStatusClass(draft)">
                {{ getStatusLabel(draft.status) }}
              </text>
            </view>

            <text class="batch-result-description">
              {{ normalizeText(draft.description) || batchDescription }}
            </text>

            <view v-if="forms[getDraftId(draft)]" class="batch-result-fields">
              <view class="edit-field">
                <text class="edit-label">素材名称</text>
                <input
                  v-model.trim="forms[getDraftId(draft)].materialName"
                  class="edit-input"
                  maxlength="120"
                  placeholder="请输入素材名称"
                />
              </view>
              <view class="edit-field">
                <text class="edit-label">素材目录</text>
                <input
                  v-model.trim="forms[getDraftId(draft)].directoryName"
                  class="edit-input"
                  maxlength="120"
                  placeholder="请输入素材目录"
                />
              </view>
              <view class="edit-field wide">
                <text class="edit-label">素材标签</text>
                <input
                  v-model="forms[getDraftId(draft)].tagsText"
                  class="edit-input"
                  placeholder="用逗号分隔多个标签"
                />
              </view>
            </view>

            <text v-if="draft.error" class="draft-error">{{ draft.error }}</text>
          </view>
        </view>

        <view v-if="batchError && batchStage !== 'review'" class="batch-error">
          <text>{{ batchError }}</text>
        </view>

        <view v-if="batchStage === 'description'" class="edit-actions">
          <button class="secondary dialog-button" @click="closeBatchEditor">取消</button>
          <button
            class="primary dialog-button"
            :disabled="!canSubmitBatchDescription"
            @click="emitBatchGenerateDrafts"
          >
            生成素材信息
          </button>
        </view>

        <view v-else-if="batchStage === 'generating'" class="edit-actions">
          <button class="secondary dialog-button" disabled>生成中</button>
        </view>

        <view v-else class="edit-actions">
          <button class="secondary dialog-button" @click="resetBatchToDescription">
            重新生成
          </button>
          <button
            class="secondary dialog-button"
            :disabled="!canSubmitReviewSave"
            @click="emitBatchUpdateDrafts"
          >
            保存修改
          </button>
          <button
            class="primary dialog-button"
            :disabled="!canConfirmBatchDrafts"
            @click="emitBatchConfirmDrafts"
          >
            确认入库
          </button>
        </view>
      </view>
    </view>

    <view v-if="detailDraft" class="modal-mask" @click="closeDetail">
      <view class="detail-dialog" @click.stop>
        <view class="modal-header">
          <view class="modal-heading">
            <text class="modal-title">临时区素材详情</text>
            <text class="modal-subtitle">{{ detailDraft.originalName }}</text>
          </view>
          <view class="detail-header-actions">
            <button
              v-if="!interactionDisabled"
              class="detail-edit-button"
              @click="openEditor(detailDraft)"
            >
              编辑
            </button>
            <button class="modal-close" @click="closeDetail">×</button>
          </view>
        </view>

        <view class="detail-preview">
          <MaterialPreview
            :id="getDraftId(detailDraft)"
            kind="draft"
            :name="detailDraft.originalName"
            :material-type="detailDraft.materialType"
            :file-extension="detailDraft.fileExtension"
            :mime-type="detailDraft.mimeType"
            :size-readable="detailDraft.sizeReadable"
            :preview="detailDraft.preview"
            :preview-url="
              detailDraft.previewUrl || detailDraft.storageUrl || detailDraft.preview?.url
            "
          />
        </view>

        <view class="detail-list">
          <view v-for="item in detailItems" :key="item.label" class="detail-row">
            <text class="detail-label">{{ item.label }}</text>
            <text class="detail-value">{{ item.value }}</text>
          </view>
        </view>

        <view v-if="detailTags.length" class="detail-tags">
          <text
            v-for="tag in detailTags"
            :key="`detail-${getDraftId(detailDraft)}-${tag}`"
            class="tag"
          >
            {{ tag }}
          </text>
        </view>

        <text v-if="detailDraft.error" class="detail-error">{{ detailDraft.error }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { MaterialConfirmState, MaterialDraft } from "@/types/material";
import MaterialPreview from "./MaterialPreview.vue";

type DraftForm = {
  description: string;
  directoryName: string;
  materialName: string;
  tagsText: string;
};

type BatchStage = "description" | "generating" | "review";

type DraftConfirmChange = {
  draftId: string;
  description: string;
  directoryName: string;
  materialName: string;
  tags: string[];
};

const props = defineProps<{
  drafts: MaterialDraft[];
  confirmState?: MaterialConfirmState;
  actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
  confirm: [payload: { draftIds: string[]; changes: DraftConfirmChange[] }];
  updateDraft: [
    payload: {
      draftId: string;
      description?: string;
      directoryName?: string;
      materialName?: string;
      tags?: string[];
      regenerate?: boolean;
    },
  ];
  generateMetadata: [payload: { draftIds: string[] }];
  removeDraft: [payload: { draftId: string }];
  batchGenerateDrafts: [payload: { draftIds: string[]; description: string }];
  batchUpdateDrafts: [
    payload: {
      changes: DraftConfirmChange[];
    },
  ];
  batchRemoveDrafts: [payload: { draftIds: string[] }];
  uploadMore: [];
}>();

const forms = reactive<Record<string, DraftForm>>({});
const selectedMap = reactive<Record<string, boolean>>({});
const editingDraft = ref<MaterialDraft | null>(null);
const detailDraft = ref<MaterialDraft | null>(null);
const batchEditorVisible = ref(false);
const batchStage = ref<BatchStage>("description");
const batchDescription = ref("");
const batchError = ref("");
const editingForm = reactive<DraftForm>({
  description: "",
  directoryName: "",
  materialName: "",
  tagsText: "",
});

const visibleDrafts = computed(() =>
  props.drafts.filter((draft) => draft.status !== "removed" && getDraftId(draft)),
);
const normalizedConfirmState = computed<MaterialConfirmState>(() => {
  if (
    props.confirmState === "confirmed" ||
    props.confirmState === "expired" ||
    props.confirmState === "pending"
  ) {
    return props.confirmState;
  }
  if (
    visibleDrafts.value.length > 0 &&
    visibleDrafts.value.every((draft) => draft.status === "confirmed")
  ) {
    return "confirmed";
  }
  if (
    visibleDrafts.value.length > 0 &&
    visibleDrafts.value.every((draft) => isDraftInState(draft, "expired"))
  ) {
    return "expired";
  }

  return "pending";
});
const interactionDisabled = computed(
  () => props.actionsDisabled || normalizedConfirmState.value !== "pending",
);
const missingDescriptionCount = computed(
  () => visibleDrafts.value.filter((draft) => !normalizeText(draft.description)).length,
);
const selectedIds = computed(() =>
  Object.entries(selectedMap)
    .filter(([id, selected]) => {
      if (!selected) {
        return false;
      }

      return visibleDrafts.value.some(
        (draft) => getDraftId(draft) === id && canSelectDraft(draft),
      );
    })
    .map(([id]) => id),
);
const selectedDrafts = computed(() =>
  selectedIds.value
    .map((id) => visibleDrafts.value.find((draft) => getDraftId(draft) === id))
    .filter((draft): draft is MaterialDraft => Boolean(draft)),
);
const showStateNotice = computed(
  () => visibleDrafts.value.length > 0 && normalizedConfirmState.value !== "pending",
);
const stateNoticeText = computed(() =>
  normalizedConfirmState.value === "confirmed"
    ? "这些素材已确认入库，当前卡片仅支持查看。"
    : "该素材确认卡片已失效，请基于当前临时区或重新上传素材继续处理。",
);
const canSubmitDraftEdit = computed(() =>
  Boolean(editingDraft.value && isEditingFormChanged(editingDraft.value)),
);
const canRegenerateEditingDraft = computed(() =>
  Boolean(editingDraft.value && normalizeText(editingForm.description)),
);
const canConfirmEditingDraft = computed(() =>
  Boolean(editingDraft.value && isEditingFormComplete()),
);
const batchModalTitle = computed(() => {
  if (batchStage.value === "generating") {
    return "生成素材信息";
  }
  if (batchStage.value === "review") {
    return "确认生成结果";
  }

  return "批量补充素材描述";
});
const batchModalSubtitle = computed(() => {
  if (batchStage.value === "generating") {
    return "正在基于描述生成素材名称、目录和标签。";
  }
  if (batchStage.value === "review") {
    return `已生成 ${selectedDrafts.value.length} 个素材的信息，可手动微调后确认入库。`;
  }

  return `已选择 ${selectedIds.value.length} 个素材，生成后会在弹窗内展示名称、目录和标签。`;
});
const canSubmitBatchDescription = computed(
  () =>
    batchStage.value === "description" &&
    selectedIds.value.length > 0 &&
    Boolean(normalizeText(batchDescription.value)),
);
const canSubmitReviewSave = computed(
  () =>
    batchStage.value === "review" &&
    selectedDrafts.value.some((draft) => isDraftFormChanged(draft)),
);
const canConfirmBatchDrafts = computed(
  () =>
    batchStage.value === "review" &&
    selectedDrafts.value.length > 0 &&
    selectedDrafts.value.every((draft) => isDraftFormComplete(draft)),
);
const detailTags = computed(() => (detailDraft.value ? getDraftTags(detailDraft.value) : []));
const detailItems = computed(() => {
  const draft = detailDraft.value;
  if (!draft) {
    return [];
  }

  return [
    { label: "素材名称", value: getDisplayName(draft) },
    { label: "素材目录", value: getDraftDirectoryName(draft) || "-" },
    { label: "素材描述", value: normalizeText(draft.description) || "-" },
    { label: "原始文件名", value: draft.originalName || "-" },
    { label: "素材类型", value: getDraftTypeText(draft) || "-" },
    { label: "文件大小", value: draft.sizeReadable || formatBytes(draft.size) || "-" },
    { label: "MIME 类型", value: draft.mimeType || "-" },
    { label: "草稿状态", value: getStatusLabel(draft.status) },
    { label: "创建时间", value: formatDateTime(draft.createdAt) },
    { label: "更新时间", value: formatDateTime(draft.updatedAt) },
  ];
});

function getDraftId(draft: MaterialDraft) {
  return draft.id || draft.draftId || "";
}

function getDraftDirectoryName(draft: MaterialDraft) {
  return (
    draft.userEditedDirectoryName ||
    draft.directoryName ||
    draft.generatedDirectoryName ||
    ""
  );
}

function getDraftMaterialName(draft: MaterialDraft) {
  return draft.userEditedName || draft.materialName || draft.generatedName || "";
}

function getDisplayName(draft: MaterialDraft) {
  return getDraftMaterialName(draft) || draft.originalName || "未命名素材";
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

function getVisibleTags(draft: MaterialDraft) {
  return getDraftTags(draft).slice(0, 3);
}

function getHiddenTagCount(draft: MaterialDraft) {
  return Math.max(0, getDraftTags(draft).length - getVisibleTags(draft).length);
}

function hasHiddenTags(draft: MaterialDraft) {
  return getHiddenTagCount(draft) > 0;
}

function tagsToText(tags?: string[]) {
  return (tags || []).join("，");
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

function normalizeText(value?: string | null) {
  return (value || "").trim();
}

function syncForms() {
  const activeIds = new Set<string>();

  visibleDrafts.value.forEach((draft) => {
    const draftId = getDraftId(draft);
    activeIds.add(draftId);
    forms[draftId] = {
      description: draft.description || "",
      directoryName: getDraftDirectoryName(draft),
      materialName: getDraftMaterialName(draft),
      tagsText: tagsToText(getDraftTags(draft)),
    };
  });

  Object.keys(forms).forEach((draftId) => {
    if (!activeIds.has(draftId)) {
      delete forms[draftId];
    }
  });

  Object.keys(selectedMap).forEach((draftId) => {
    const draft = visibleDrafts.value.find((item) => getDraftId(item) === draftId);
    if (!activeIds.has(draftId) || (draft && !canSelectDraft(draft))) {
      delete selectedMap[draftId];
    }
  });
}

function isDraftFormChanged(draft: MaterialDraft) {
  const draftId = getDraftId(draft);
  const form = forms[draftId];

  if (!form) {
    return false;
  }

  const nextTags = normalizeTags(form.tagsText);
  const currentTags = getDraftTags(draft);

  return (
    normalizeText(form.description) !== normalizeText(draft.description) ||
    normalizeText(form.directoryName) !== normalizeText(getDraftDirectoryName(draft)) ||
    normalizeText(form.materialName) !== normalizeText(getDraftMaterialName(draft)) ||
    nextTags.join("\n") !== currentTags.join("\n")
  );
}

function isEditingFormChanged(draft: MaterialDraft) {
  const nextTags = normalizeTags(editingForm.tagsText);
  const currentTags = getDraftTags(draft);

  return (
    normalizeText(editingForm.description) !== normalizeText(draft.description) ||
    normalizeText(editingForm.directoryName) !== normalizeText(getDraftDirectoryName(draft)) ||
    normalizeText(editingForm.materialName) !== normalizeText(getDraftMaterialName(draft)) ||
    nextTags.join("\n") !== currentTags.join("\n")
  );
}

function isEditingFormComplete() {
  return Boolean(
    normalizeText(editingForm.description) &&
      normalizeText(editingForm.directoryName) &&
      normalizeText(editingForm.materialName) &&
      normalizeTags(editingForm.tagsText).length > 0,
  );
}

function canRegenerateDraft(draft: MaterialDraft) {
  if (!canModifyDraft(draft)) {
    return false;
  }

  const draftId = getDraftId(draft);
  const form = forms[draftId];

  return Boolean(form && normalizeText(form.description));
}

function isDraftFormComplete(draft: MaterialDraft) {
  const draftId = getDraftId(draft);
  const form = forms[draftId];

  if (!form) {
    return false;
  }

  return Boolean(
    normalizeText(form.description) &&
      normalizeText(form.directoryName) &&
      normalizeText(form.materialName) &&
      normalizeTags(form.tagsText).length > 0,
  );
}

function canConfirmDraft(draft: MaterialDraft) {
  return canModifyDraft(draft) && isDraftFormComplete(draft);
}

function isDraftInState(draft: MaterialDraft, state: MaterialConfirmState) {
  return draft.status === state || draft.confirmState === state;
}

function isDraftFinalized(draft: MaterialDraft) {
  return isDraftInState(draft, "confirmed") || isDraftInState(draft, "expired");
}

function getStatusLabel(status?: string) {
  const statusMap: Record<string, string> = {
    uploaded: "已上传",
    need_description: "待补描述",
    description_collected: "待生成",
    metadata_generating: "生成中",
    ready_for_confirmation: "待确认",
    metadata_failed: "生成失败",
    confirmed: "已入库",
    removed: "已删除",
    expired: "已失效",
  };

  return statusMap[status || ""] || "待确认";
}

function getStatusClass(draft: MaterialDraft) {
  if (!normalizeText(draft.description)) {
    return "status-warning";
  }
  if (draft.status === "metadata_failed") {
    return "status-danger";
  }
  if (isDraftFormComplete(draft)) {
    return "status-ready";
  }

  return "status-neutral";
}

function getDraftTypeText(draft: MaterialDraft) {
  return [
    draft.materialType || "文件",
    draft.fileExtension ? `.${draft.fileExtension}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getDraftFormPayload(draft: MaterialDraft) {
  const draftId = getDraftId(draft);
  const form = forms[draftId];

  if (!draftId || !form) {
    return null;
  }

  return {
    draftId,
    description: normalizeText(form.description),
    directoryName: normalizeText(form.directoryName),
    materialName: normalizeText(form.materialName),
    tags: normalizeTags(form.tagsText),
  };
}

function toDraftChange(draft: MaterialDraft): DraftConfirmChange | null {
  const payload = getDraftFormPayload(draft);

  return payload
    ? {
        draftId: payload.draftId,
        description: payload.description,
        directoryName: payload.directoryName,
        materialName: payload.materialName,
        tags: payload.tags,
      }
    : null;
}

function openEditor(draft: MaterialDraft) {
  if (!canModifyDraft(draft)) {
    return;
  }

  const draftId = getDraftId(draft);
  const form = forms[draftId];
  detailDraft.value = null;
  editingDraft.value = draft;
  editingForm.description = form?.description || draft.description || "";
  editingForm.directoryName = form?.directoryName || getDraftDirectoryName(draft);
  editingForm.materialName = form?.materialName || getDraftMaterialName(draft);
  editingForm.tagsText = form?.tagsText || tagsToText(getDraftTags(draft));
}

function closeEditor() {
  editingDraft.value = null;
  editingForm.description = "";
  editingForm.directoryName = "";
  editingForm.materialName = "";
  editingForm.tagsText = "";
}

function openDetail(draft: MaterialDraft) {
  detailDraft.value = draft;
}

function closeDetail() {
  detailDraft.value = null;
}

function canSelectDraft(draft: MaterialDraft) {
  return !interactionDisabled.value && !isDraftFinalized(draft) && Boolean(getDraftId(draft));
}

function canModifyDraft(draft: MaterialDraft) {
  return !interactionDisabled.value && !isDraftFinalized(draft) && Boolean(getDraftId(draft));
}

function toggleSelected(draftId: string) {
  if (!draftId || interactionDisabled.value) {
    return;
  }

  selectedMap[draftId] = !selectedMap[draftId];
}

function clearSelection() {
  Object.keys(selectedMap).forEach((draftId) => {
    delete selectedMap[draftId];
  });
}

function resetBatchState() {
  batchStage.value = "description";
  batchDescription.value = "";
  batchError.value = "";
}

function openBatchEditor() {
  if (interactionDisabled.value || !selectedIds.value.length) {
    return;
  }

  resetBatchState();
  detailDraft.value = null;
  editingDraft.value = null;
  batchEditorVisible.value = true;
}

function requestCloseBatchEditor() {
  if (batchStage.value === "generating") {
    return;
  }

  closeBatchEditor();
}

function closeBatchEditor() {
  batchEditorVisible.value = false;
  resetBatchState();
}

function resetBatchToDescription() {
  batchStage.value = "description";
  batchError.value = "";
}

function getSelectedReviewChanges(onlyChanged: boolean) {
  return selectedDrafts.value
    .filter((draft) => !onlyChanged || isDraftFormChanged(draft))
    .map((draft) => toDraftChange(draft))
    .filter((change): change is DraftConfirmChange => Boolean(change));
}

function isBatchGenerationSettled() {
  const description = normalizeText(batchDescription.value);
  if (!description || selectedDrafts.value.length !== selectedIds.value.length) {
    return false;
  }

  return selectedDrafts.value.every((draft) => {
    const status = draft.status || "";
    return (
      normalizeText(draft.description) === description &&
      status !== "metadata_generating" &&
      status !== "description_collected"
    );
  });
}

function resolveBatchGenerationIfReady() {
  if (!batchEditorVisible.value || batchStage.value !== "generating") {
    return false;
  }

  if (!isBatchGenerationSettled()) {
    return false;
  }

  batchStage.value = "review";
  batchError.value = selectedDrafts.value.some(
    (draft) => draft.status === "metadata_failed" || normalizeText(draft.error),
  )
    ? "部分素材生成失败，请检查失败项后重试或手动编辑。"
    : "";

  return true;
}

function saveEditingFormToDraft(draft: MaterialDraft) {
  const draftId = getDraftId(draft);
  if (!draftId) {
    return null;
  }

  const nextForm = {
    description: normalizeText(editingForm.description),
    directoryName: normalizeText(editingForm.directoryName),
    materialName: normalizeText(editingForm.materialName),
    tagsText: editingForm.tagsText,
  };
  forms[draftId] = nextForm;

  return {
    draftId,
    description: nextForm.description,
    directoryName: nextForm.directoryName,
    materialName: nextForm.materialName,
    tags: normalizeTags(nextForm.tagsText),
  };
}

function emitUpdateEditingDraft() {
  const draft = editingDraft.value;
  if (!draft || interactionDisabled.value || !canSubmitDraftEdit.value) {
    return;
  }

  const payload = saveEditingFormToDraft(draft);
  if (!payload) {
    return;
  }

  emit("updateDraft", payload);
  closeEditor();
}

function emitConfirmEditingDraft() {
  const draft = editingDraft.value;
  if (!draft || interactionDisabled.value || !canConfirmEditingDraft.value) {
    return;
  }

  const payload = saveEditingFormToDraft(draft);
  if (!payload) {
    return;
  }

  emit("confirm", {
    draftIds: [payload.draftId],
    changes: [payload],
  });
  closeEditor();
}

function emitRegenerateEditingDraft() {
  const draft = editingDraft.value;
  if (!draft || interactionDisabled.value || !canRegenerateEditingDraft.value) {
    return;
  }

  const draftId = getDraftId(draft);
  if (!draftId) {
    return;
  }

  forms[draftId] = {
    description: normalizeText(editingForm.description),
    directoryName: normalizeText(editingForm.directoryName),
    materialName: normalizeText(editingForm.materialName),
    tagsText: editingForm.tagsText,
  };
  emit("updateDraft", {
    draftId,
    description: normalizeText(editingForm.description),
    regenerate: true,
  });
  closeEditor();
}

function emitRegenerateDraft(draft: MaterialDraft) {
  if (interactionDisabled.value || !canRegenerateDraft(draft)) {
    return;
  }

  const draftId = getDraftId(draft);
  const form = forms[draftId];
  if (!draftId || !form) {
    return;
  }

  emit("updateDraft", {
    draftId,
    description: normalizeText(form.description),
    regenerate: true,
  });
}

function emitRemoveDraft(draft: MaterialDraft) {
  const draftId = getDraftId(draft);
  if (!draftId || interactionDisabled.value) {
    return;
  }

  emit("removeDraft", { draftId });
}

function emitConfirmDraft(draft: MaterialDraft) {
  if (!canConfirmDraft(draft)) {
    return;
  }

  const change = toDraftChange(draft);
  const draftId = getDraftId(draft);
  if (!draftId) {
    return;
  }

  emit("confirm", {
    draftIds: [draftId],
    changes: change ? [change] : [],
  });
}

function emitBatchGenerateDrafts() {
  if (!canSubmitBatchDescription.value) {
    return;
  }

  batchError.value = "";
  batchStage.value = "generating";
  emit("batchGenerateDrafts", {
    draftIds: selectedIds.value,
    description: normalizeText(batchDescription.value),
  });
}

function emitBatchUpdateDrafts() {
  if (!canSubmitReviewSave.value) {
    return;
  }

  const changes = getSelectedReviewChanges(true);
  if (!changes.length) {
    return;
  }

  batchError.value = "";
  emit("batchUpdateDrafts", { changes });
}

function emitBatchRemoveDrafts() {
  if (interactionDisabled.value || !selectedIds.value.length) {
    return;
  }

  emit("batchRemoveDrafts", { draftIds: selectedIds.value });
  clearSelection();
}

function emitBatchConfirmDrafts() {
  if (!canConfirmBatchDrafts.value) {
    return;
  }

  emit("confirm", {
    draftIds: selectedIds.value,
    changes: getSelectedReviewChanges(false),
  });
  closeBatchEditor();
  clearSelection();
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

watch(
  () => props.drafts,
  () => {
    syncForms();
    resolveBatchGenerationIfReady();
  },
  { deep: true, immediate: true },
);

watch(
  () => props.actionsDisabled,
  (disabled) => {
    if (disabled || batchStage.value !== "generating") {
      return;
    }

    if (!resolveBatchGenerationIfReady()) {
      batchStage.value = "description";
      batchError.value = "生成没有完成，请检查网络后重试。";
    }
  },
);
</script>

<style scoped>
.draft-card-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.draft-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.result-count {
  color: #64748b;
  font-size: 12px;
}

.selected-count {
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
}

.warning-count {
  color: #b45309;
  font-size: 12px;
  font-weight: 700;
}

.toolbar-button {
  height: 28px;
  min-width: 70px;
  margin: 0;
  padding: 0 10px;
  color: #0f766e;
  font-size: 11px;
  font-weight: 700;
  line-height: 28px;
  background: #ccfbf1;
  border: 0;
  border-radius: 8px;
}

.toolbar-button.danger {
  color: #b91c1c;
  background: #fee2e2;
}

.draft-card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(172px, 196px));
  gap: 10px;
  justify-content: start;
}

.draft-item {
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

.draft-item:hover,
.draft-item:focus-within {
  border-color: #bfdbfe;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.1);
}

.draft-item.incomplete {
  border-color: #fed7aa;
}

.draft-item.selected {
  border-color: #0f766e;
  box-shadow: 0 0 0 1px rgba(15, 118, 110, 0.12);
}

.draft-card-head {
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

.draft-item:hover .draft-card-head,
.draft-item:focus-within .draft-card-head,
.draft-item.selected .draft-card-head {
  opacity: 1;
  pointer-events: auto;
}

.draft-icon-actions {
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

.icon-button.confirm-icon {
  color: #0f766e;
  background: rgba(240, 253, 250, 0.96);
  border-color: #99f6e4;
}

.confirm-symbol {
  color: #0f766e;
  font-size: 15px;
  font-weight: 900;
  line-height: 1;
}

.draft-card-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.draft-preview {
  width: 100%;
  min-width: 0;
}

.draft-preview :deep(.image-button),
.draft-preview :deep(.media-button),
.draft-preview :deep(.preview-video) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 108px;
  border-radius: 7px;
}

.draft-preview :deep(.file-info),
.draft-preview :deep(.audio-preview) {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 108px;
  justify-content: center;
  padding: 9px;
  border-radius: 7px;
}

.draft-preview :deep(.file-mark) {
  width: 42px;
  height: 42px;
  font-size: 9px;
  border-radius: 6px;
}

.draft-preview :deep(.file-copy) {
  display: none;
}

.draft-preview :deep(.audio-title) {
  max-width: 100%;
  font-size: 11px;
  text-align: center;
}

.draft-preview :deep(.preview-audio) {
  display: none;
}

.draft-summary {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.draft-name-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}

.draft-name {
  display: -webkit-box;
  flex: 1;
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

.draft-directory,
.draft-description {
  overflow: hidden;
  color: #64748b;
  font-size: 11px;
  line-height: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.draft-description.empty {
  color: #b45309;
}

.status-chip {
  flex: 0 0 auto;
  max-width: 64px;
  padding: 2px 6px;
  overflow: hidden;
  font-size: 10px;
  font-weight: 700;
  line-height: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 999px;
}

.status-ready {
  color: #0f766e;
  background: #ccfbf1;
}

.status-warning {
  color: #b45309;
  background: #ffedd5;
}

.status-danger {
  color: #b91c1c;
  background: #fee2e2;
}

.status-neutral {
  color: #475569;
  background: #e2e8f0;
}

.draft-tags,
.detail-tags {
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

.draft-error {
  color: #b91c1c;
  font-size: 11px;
  line-height: 16px;
}

.empty-state {
  display: flex;
  min-height: 86px;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.state-notice {
  padding: 9px 10px;
  color: #475569;
  font-size: 12px;
  line-height: 1.5;
  background: #f8fafc;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
}

.state-confirmed {
  color: #166534;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.state-expired {
  color: #92400e;
  background: #fffbeb;
  border-color: #fde68a;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
}

.modal-mask {
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

.edit-dialog,
.detail-dialog {
  position: relative;
  box-sizing: border-box;
  display: flex;
  width: min(720px, 100%);
  max-height: min(760px, 90vh);
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.24);
}

.detail-dialog {
  width: min(820px, 100%);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-right: 34px;
}

.modal-heading {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.modal-title {
  color: #0f172a;
  font-size: 16px;
  font-weight: 800;
  line-height: 22px;
}

.modal-subtitle {
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

.modal-close {
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

.edit-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.batch-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.batch-description-field,
.batch-selected-list,
.batch-result-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.batch-selected-title {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.batch-selected-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 7px 8px;
  background: #ffffff;
  border: 1px solid #edf2f7;
  border-radius: 7px;
}

.batch-selected-name,
.batch-result-name {
  min-width: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-selected-meta {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 11px;
}

.batch-generating {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  color: #475569;
  text-align: center;
}

.loading-ring {
  width: 34px;
  height: 34px;
  border: 3px solid #ccfbf1;
  border-top-color: #0f766e;
  border-radius: 50%;
  animation: material-spin 0.9s linear infinite;
}

.loading-title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
}

.loading-copy,
.loading-count {
  max-width: 360px;
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

.batch-review {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.batch-result-card.incomplete {
  border-color: #fed7aa;
}

.batch-result-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.batch-result-description {
  color: #334155;
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}

.batch-result-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.batch-error {
  padding: 9px 10px;
  color: #b91c1c;
  font-size: 12px;
  line-height: 18px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

@keyframes material-spin {
  to {
    transform: rotate(360deg);
  }
}

.edit-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.edit-field.wide {
  grid-column: 1 / -1;
}

.edit-label {
  color: #475569;
  font-size: 11px;
  font-weight: 700;
}

.edit-input,
.edit-textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 36px;
  padding: 8px 10px;
  color: #0f172a;
  font-size: 13px;
  line-height: 18px;
  background: #f8fafc;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
}

.edit-textarea {
  min-height: 92px;
}

.edit-input[disabled],
.edit-textarea[disabled] {
  color: #94a3b8;
  background: #f1f5f9;
}

.edit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.detail-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-edit-button {
  height: 28px;
  min-width: 48px;
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

.detail-preview {
  width: 100%;
  min-width: 0;
}

.detail-preview :deep(.image-button),
.detail-preview :deep(.preview-video),
.detail-preview :deep(.media-button) {
  width: 100%;
  max-width: 100%;
  min-height: 260px;
}

.detail-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.detail-row {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.detail-label {
  color: #94a3b8;
  font-size: 11px;
}

.detail-value {
  overflow-wrap: anywhere;
  color: #0f172a;
  font-size: 12px;
  line-height: 18px;
}

.detail-error {
  padding: 8px 10px;
  color: #b91c1c;
  font-size: 12px;
  line-height: 18px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

button {
  box-sizing: border-box;
  height: 34px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
}

.primary {
  min-width: 96px;
  color: #ffffff;
  background: #0f766e;
  border: 0;
}

.secondary {
  color: #334155;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
}

.dialog-button {
  min-width: 78px;
}

.confirm-dialog-button {
  background: #0f766e;
}

button::after,
.icon-button::after,
.toolbar-button::after,
.modal-close::after,
.dialog-button::after,
.detail-edit-button::after {
  border: 0;
}

button[disabled] {
  opacity: 0.5;
}

@media (max-width: 720px) {
  .draft-card-list {
    grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  }

  .edit-form-grid,
  .batch-result-fields,
  .detail-list {
    grid-template-columns: minmax(0, 1fr);
  }

  .draft-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-right {
    justify-content: flex-start;
  }
}
</style>
