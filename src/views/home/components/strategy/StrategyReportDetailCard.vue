<template>
  <section v-if="title || contentText" class="report-detail-card">
    <header class="report-detail-header">
      <div>
        <strong>{{ title || "战略报告" }}</strong>
        <p v-if="metaText">{{ metaText }}</p>
      </div>
      <span v-if="needsSync" class="sync-badge">需要同步</span>
    </header>

    <div v-if="contentBlocks.length" class="report-content">
      <template v-for="(block, index) in contentBlocks" :key="index">
        <h2 v-if="block.type === 'h1'">{{ block.text }}</h2>
        <h3 v-else-if="block.type === 'h2'">{{ block.text }}</h3>
        <h4 v-else-if="block.type === 'h3'">{{ block.text }}</h4>
        <p v-else-if="block.type === 'quote'" class="quote">{{ block.text }}</p>
        <p v-else-if="block.type === 'list'" class="list-line">
          {{ block.text }}
        </p>
        <p v-else>{{ block.text }}</p>
      </template>
    </div>

    <pre v-else-if="structuredText" class="structured-content">{{
      structuredText
    }}</pre>

    <div v-if="actionItems.length" class="report-actions">
      <button
        v-for="action in actionItems"
        :key="action"
        class="report-action"
        type="button"
        :disabled="actionsDisabled"
        @click="emit('action', action)"
      >
        {{ actionLabel(action) }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
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

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(generatedAt));
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

<style scoped lang="scss">
.report-detail-card {
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

  strong {
    color: #111827;
    font-size: 14px;
  }

  p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 11px;
  }
}

.sync-badge {
  flex: 0 0 auto;
  padding: 3px 7px;
  color: #9a3412;
  font-size: 11px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 999px;
}

.report-content {
  display: grid;
  gap: 8px;
  max-height: 520px;
  margin-top: 12px;
  overflow-y: auto;

  h2,
  h3,
  h4,
  p {
    margin: 0;
    color: #263142;
    word-break: break-word;
  }

  h2 {
    font-size: 16px;
    line-height: 1.5;
  }

  h3 {
    margin-top: 4px;
    font-size: 14px;
    line-height: 1.55;
  }

  h4 {
    font-size: 13px;
    line-height: 1.55;
  }

  p {
    font-size: 12px;
    line-height: 1.8;
  }
}

.quote {
  padding: 8px 10px;
  color: #475569;
  background: #ffffff;
  border-left: 3px solid #1267ff;
  border-radius: 4px;
}

.list-line {
  position: relative;
  padding-left: 14px;

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    content: "·";
  }
}

.structured-content {
  max-height: 420px;
  margin: 12px 0 0;
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
  min-height: 24px;
  padding: 0 8px;
  color: #1267ff;
  font-size: 11px;
  font-weight: 700;
  background: #edf5ff;
  border: 1px solid #cfe0f7;
  border-radius: 6px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}
</style>
