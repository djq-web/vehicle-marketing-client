<template>
  <view v-if="cardReady" class="message-card">
    <view class="card-header">
      <text class="card-type">{{ cardTitle }}</text>
      <text v-if="statusText" class="card-status">{{ statusText }}</text>
    </view>

    <view v-if="reports.length" class="report-section">
      <view class="report-list">
        <button
          v-for="report in reports"
          :key="report.id || report.type"
          class="report-chip"
          :disabled="actionsDisabled"
          @click="
            emit('action', 'view_report', {
              type: report.type,
              diagnosisId: report.diagnosisId,
            })
          "
        >
          <text>{{ report.title || report.type }}</text>
          <text v-if="report.needsSync" class="chip-small">需同步</text>
        </button>
      </view>
    </view>

    <StrategyReportDetailCard
      v-if="reportDetail"
      :report="reportDetail"
      :next-actions="visibleReportActions"
      :actions-disabled="actionsDisabled"
      @action="(action) => emit('action', action)"
    />
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AgentMessageMetadata } from "@/types/strategy";
import StrategyReportDetailCard from "./StrategyReportDetailCard.vue";

const props = defineProps<{
  metadata?: AgentMessageMetadata | null;
  actionsDisabled?: boolean;
  showNextActions?: boolean;
}>();

const emit = defineEmits<{
  action: [action: string, payload?: Record<string, unknown>];
}>();

type DisplayReport = {
  id: string;
  diagnosisId: string;
  type: string;
  title: string;
  needsSync: boolean;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.map(asRecord).filter((item) => Object.keys(item).length > 0)
    : [];

const reportCardTypes = new Set<string>([]);

const reportActionTypes = new Set(["sync_reports"]);

const card = computed(() => asRecord(props.metadata?.card));
const cardDiagnosisId = computed(() =>
  String(card.value.diagnosisId || props.metadata?.diagnosisId || ""),
);
const uiType = computed(() => {
  const metadataUi = asRecord(props.metadata?.ui);
  const cardUi = asRecord(card.value.ui);

  return String(
    metadataUi.type ||
      cardUi.type ||
      card.value.type ||
      card.value.reason ||
      "",
  );
});
const reports = computed<DisplayReport[]>(() =>
  asArray(card.value.reports).map((report, index) => ({
    id: String(report.id || report.type || `report-${index}`),
    diagnosisId: String(report.diagnosisId || cardDiagnosisId.value),
    type: String(report.type || "report"),
    title: String(report.title || report.type || "战略报告"),
    needsSync: report.needsSync === true,
  })),
);
const reportDetail = computed(() => {
  const report = asRecord(card.value.report);

  return Object.keys(report).length > 0 ? report : null;
});
const hasReportContent = computed(
  () => reports.value.length > 0 || Boolean(reportDetail.value),
);
const cardReady = computed(
  () =>
    Object.keys(card.value).length > 0 &&
    reportCardTypes.has(uiType.value) &&
    hasReportContent.value,
);
const cardTitle = computed(() => {
  const titleMap: Record<string, string> = {
    strategy_reports_generated: "战略报告",
    strategy_reports_synced: "战略报告",
    strategy_reports_pending: "战略报告",
    strategy_report: "战略报告",
  };

  return titleMap[uiType.value] || "战略报告";
});
const statusText = computed(() =>
  toVisibleStatusText(card.value.status || card.value.reason),
);
const nextActions = computed(() =>
  Array.isArray(card.value.nextActions)
    ? card.value.nextActions.map(String)
    : [],
);
const visibleReportActions = computed(() =>
  props.showNextActions === false
    ? []
    : nextActions.value.filter((action) => reportActionTypes.has(action)),
);

function toVisibleStatusText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text || /[_./]/.test(text) || /^[a-z0-9-]+$/i.test(text)) {
    return "";
  }

  return text;
}
</script>

<style scoped>
.message-card {
  box-sizing: border-box;
  margin-top: 10px;
  padding: 12px;
  color: #263142;
  background: #ffffff;
  border: 1px solid #e1e7f0;
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.card-type {
  color: #111827;
  font-size: 13px;
  font-weight: 700;
}

.card-status {
  max-width: 180px;
  overflow: hidden;
  color: #6b7280;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-section {
  margin-top: 12px;
}

.report-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.report-chip {
  display: inline-flex;
  width: auto;
  min-width: 0;
  min-height: 24px;
  align-items: center;
  justify-content: center;
  gap: 4px;
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

.report-chip::after {
  border: 0;
}

.report-chip[disabled] {
  opacity: 0.55;
}

.chip-small {
  color: #9a3412;
  font-size: 10px;
}
</style>
