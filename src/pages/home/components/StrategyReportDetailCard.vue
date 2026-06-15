<template>
  <view v-if="title || contentText" class="report-detail-card">
    <view class="report-detail-header">
      <view class="report-detail-title-wrap">
        <text class="report-detail-title">{{ title || "战略报告" }}</text>
        <text v-if="metaText" class="report-detail-meta">{{ metaText }}</text>
      </view>
      <text v-if="needsSync" class="sync-badge">需要同步</text>
    </view>

    <view v-if="contentText" class="report-content">
      <ReportMarkdown :content="contentText" />
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
import ReportMarkdown from "./ReportMarkdown.vue";

const props = defineProps<{
  report?: Record<string, unknown> | null;
  nextActions?: string[];
  actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
  action: [action: string];
}>();

const reportTypeLabels: Record<string, string> = {
  enterprise_diagnosis: "企业战略诊断报告",
  enterprise_solution: "企业战略方案报告",
  beidou_declaration: "北斗宣言",
  strategy_positioning: "战略定位报告",
  advantages_barriers: "优势与壁垒报告",
  business_model_panorama: "商业模式全景图",
  brand_experience_blueprint: "品牌与体验蓝图",
};

const report = computed(() => props.report ?? {});
const title = computed(() => resolveReportTitle(report.value));
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
const reportActionTypes = new Set(["sync_reports"]);
const actionItems = computed(() => {
  return (props.nextActions ?? []).filter((action) =>
    reportActionTypes.has(action),
  );
});

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
    sync_reports: "同步报告",
    open_dashboard: "查看看板",
    rediagnose: "重新诊断",
    confirm_diagnosis_report: "确认诊断报告",
    confirm_solution_report: "确认方案报告",
  };

  return labels[action] || "继续处理";
}

function resolveReportTitle(reportValue: Record<string, unknown>) {
  const rawTitle = stringValue(reportValue.title);

  if (rawTitle && !isInternalCode(rawTitle)) {
    return rawTitle;
  }

  const type = stringValue(reportValue.type);
  return reportTypeLabels[type] || "";
}

function isInternalCode(value: string) {
  return /^[a-z][a-z0-9_./-]*$/i.test(value) && !/[\u3400-\u9fff]/.test(value);
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
  max-height: 520px;
  margin-top: 12px;
  overflow-y: auto;
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
