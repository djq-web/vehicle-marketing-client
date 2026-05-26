<template>
  <view v-if="title || contentText" class="report-detail-card">
    <view class="report-detail-header">
      <view class="report-detail-title-wrap">
        <text class="report-detail-title">{{ title || "战略报告" }}</text>
        <text v-if="metaText" class="report-detail-meta">{{ metaText }}</text>
      </view>
      <text v-if="needsSync" class="sync-badge">需要同步</text>
    </view>

    <view v-if="contentBlocks.length" class="report-content">
      <view
        v-for="(block, index) in contentBlocks"
        :key="index"
        class="report-block"
        :class="`type-${block.type}`"
      >
        <text>{{ block.text }}</text>
      </view>
    </view>

    <text v-else-if="structuredText" class="structured-content">
      {{ structuredText }}
    </text>

    <view v-if="actionItems.length" class="report-actions">
      <button
        v-for="action in actionItems"
        :key="action"
        class="report-action"
        :disabled="actionsDisabled"
        @click="emit('action', action)"
      >
        {{ actionLabel(action) }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  report?: Record<string, unknown> | null;
  nextActions?: string[];
  actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
  action: [action: string];
}>();

type ContentBlock = {
  type: "h1" | "h2" | "h3" | "quote" | "list" | "paragraph";
  text: string;
};

const report = computed(() => props.report ?? {});
const title = computed(() => stringValue(report.value.title));
const status = computed(() => stringValue(report.value.status));
const contentText = computed(() => stringValue(report.value.content));
const needsSync = computed(() => report.value.needsSync === true);
const generatedAtText = computed(() => {
  const generatedAt = stringValue(report.value.generatedAt);

  if (!generatedAt) {
    return "";
  }

  return formatDateTime(generatedAt);
});
const metaText = computed(() =>
  [
    statusLabel(status.value),
    generatedAtText.value ? `生成于 ${generatedAtText.value}` : "",
  ]
    .filter(Boolean)
    .join(" · "),
);
const structuredText = computed(() => {
  if (
    report.value.structuredContent === undefined ||
    report.value.structuredContent === null
  ) {
    return "";
  }

  return JSON.stringify(report.value.structuredContent, null, 2);
});
const contentBlocks = computed<ContentBlock[]>(() =>
  contentText.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(toContentBlock),
);
const actionItems = computed(() =>
  (props.nextActions ?? []).filter((action) => action !== "generate_reports"),
);

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${month}/${day} ${hours}:${minutes}`;
}

function cleanInlineMarkdown(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function toContentBlock(line: string): ContentBlock {
  if (line.startsWith("# ")) {
    return { type: "h1", text: cleanInlineMarkdown(line.slice(2)) };
  }

  if (line.startsWith("## ")) {
    return { type: "h2", text: cleanInlineMarkdown(line.slice(3)) };
  }

  if (line.startsWith("### ")) {
    return { type: "h3", text: cleanInlineMarkdown(line.slice(4)) };
  }

  if (line.startsWith(">")) {
    return {
      type: "quote",
      text: cleanInlineMarkdown(line.replace(/^>\s*/, "")),
    };
  }

  if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
    return {
      type: "list",
      text: cleanInlineMarkdown(
        line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""),
      ),
    };
  }

  return { type: "paragraph", text: cleanInlineMarkdown(line) };
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    generated: "已生成",
    stale: "需要同步",
    need_regenerate: "需要重新生成",
    failed: "生成失败",
    draft: "草稿",
  };

  return labels[value] || "";
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    open_dashboard: "打开看板",
    rediagnose: "重新诊断",
    sync_reports: "同步报告",
  };

  return labels[action] || action;
}
</script>

<style scoped>
.report-detail-card {
  box-sizing: border-box;
  margin-top: 12px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.report-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.report-detail-title-wrap {
  min-width: 0;
}

.report-detail-title {
  display: block;
  color: #111827;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
}

.report-detail-meta {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 11px;
  line-height: 1.4;
}

.sync-badge {
  flex: 0 0 auto;
  padding: 3px 7px;
  color: #9a3412;
  font-size: 11px;
  line-height: 16px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 999px;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 520px;
  margin-top: 12px;
  overflow-y: auto;
}

.report-block {
  color: #263142;
  word-break: break-word;
}

.report-block text {
  display: block;
}

.report-block.type-h1 {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.5;
}

.report-block.type-h2 {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.55;
}

.report-block.type-h3 {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.55;
}

.report-block.type-quote {
  padding: 8px 10px;
  color: #475569;
  font-size: 12px;
  line-height: 1.8;
  background: #ffffff;
  border-left: 3px solid #1267ff;
  border-radius: 4px;
}

.report-block.type-list {
  position: relative;
  padding-left: 14px;
  font-size: 12px;
  line-height: 1.8;
}

.report-block.type-list::before {
  position: absolute;
  top: 0;
  left: 0;
  content: "·";
}

.report-block.type-paragraph {
  font-size: 12px;
  line-height: 1.8;
}

.structured-content {
  display: block;
  max-height: 420px;
  margin-top: 12px;
  overflow: auto;
  color: #334155;
  font-size: 11px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.report-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.report-action {
  display: inline-flex;
  width: auto;
  min-width: 0;
  min-height: 24px;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 8px;
  color: #1267ff;
  font-size: 11px;
  font-weight: 700;
  line-height: 22px;
  background: #edf5ff;
  border: 1px solid #cfe0f7;
  border-radius: 6px;
  box-shadow: none;
}

.report-action::after {
  border: 0;
}

.report-action[disabled] {
  opacity: 0.55;
}
</style>
