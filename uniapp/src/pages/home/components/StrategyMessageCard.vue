<template>
  <view v-if="cardReady" class="message-card">
    <view class="card-header">
      <text class="card-type">{{ cardTitle }}</text>
      <text v-if="statusText" class="card-status">{{ statusText }}</text>
    </view>

    <StrategyProgressCard
      v-if="isProgressCard"
      :card="card"
      :next-actions="nextActions"
      :actions-disabled="actionsDisabled"
      @action="(action) => emit('action', action)"
    />

    <view v-if="file" class="file-row">
      <view class="doc-icon"></view>
      <view class="file-copy">
        <text class="file-name">{{ file.originalName }}</text>
        <text class="file-meta">{{ formatFileSize(file.size) }} · {{ file.statusText }}</text>
      </view>
    </view>

    <view v-if="files.length || isFilesCard" class="section-block">
      <view class="section-heading">
        <text class="section-title">当前资料</text>
        <text>{{ filesOverviewText }}</text>
      </view>
      <view v-if="files.length" class="material-list">
        <view v-for="item in files" :key="item.id" class="material-item">
          <view class="doc-icon small"></view>
          <view class="material-copy">
            <text class="material-name">{{ item.originalName }}</text>
            <text class="material-meta">{{ formatFileSize(item.size) }} · {{ item.statusText }}</text>
            <text v-if="item.extractedTextLength" class="material-small">
              已解析文本 {{ item.extractedTextLength }} 字
            </text>
          </view>
        </view>
      </view>
      <text v-else class="empty-tip">当前还没有上传资料。</text>
    </view>

    <view v-if="extractedFields.length" class="section-block">
      <text class="section-title standalone">识别字段</text>
      <view class="field-grid">
        <view
          v-for="field in extractedFields"
          :key="field.key"
          class="field-pair"
        >
          <text class="field-key">{{ field.key }}</text>
          <text class="field-value">{{ stringify(field.value) }}</text>
        </view>
      </view>
    </view>

    <view v-if="formFields.length" class="section-block">
      <view class="section-heading">
        <text class="section-title">当前已补充信息全览</text>
        <text>{{ formProgressText }}</text>
      </view>
      <view class="field-grid overview-list">
        <view v-for="field in formFields" :key="field.key" class="field-pair">
          <text class="field-key" :class="{ missing: isFieldMissing(field) }">
            {{ field.label || field.key }}
          </text>
          <text class="field-value" :class="{ missing: isFieldMissing(field) }">
            {{ stringify(field.value) || "待补充" }}
          </text>
        </view>
      </view>
    </view>

    <view v-if="missingFields.length" class="section-block">
      <text class="section-title standalone">待补充字段</text>
      <view class="missing-list">
        <text v-for="field in missingFields" :key="field.key">
          {{ field.label || field.key }}
        </text>
      </view>
    </view>

    <view v-if="pointDetail" class="section-block point-detail">
      <view class="section-heading">
        <text class="section-title">
          {{ pointDetail.code }} {{ pointDetail.title }}
        </text>
        <text v-if="pointDetail.category">{{ pointDetail.category }}</text>
      </view>
      <view class="field-grid overview-list">
        <view v-if="pointDetail.summary" class="field-pair">
          <text class="field-key">当前判断</text>
          <text class="field-value">{{ pointDetail.summary }}</text>
        </view>
        <view v-if="pointDetail.recommendation" class="field-pair">
          <text class="field-key">建议动作</text>
          <text class="field-value">{{ pointDetail.recommendation }}</text>
        </view>
        <view v-if="pointDetail.deductionReason" class="field-pair">
          <text class="field-key">缺口原因</text>
          <text class="field-value">{{ pointDetail.deductionReason }}</text>
        </view>
        <view v-if="pointDetail.confidenceText" class="field-pair">
          <text class="field-key">置信度</text>
          <text class="field-value">{{ pointDetail.confidenceText }}</text>
        </view>
      </view>
      <view v-if="pointEvidence.length" class="evidence-list">
        <text class="detail-label">证据</text>
        <text v-for="item in pointEvidence" :key="item">{{ item }}</text>
      </view>
      <view v-if="reportSection" class="report-section-detail">
        <text class="detail-label">{{ reportSection.title || "报告章节" }}</text>
        <text v-if="reportSection.content">{{ reportSection.content }}</text>
      </view>
    </view>

    <view v-if="frameworkPoints.length" class="section-block">
      <text class="section-title standalone">19 点战略框架</text>
      <view class="point-grid">
        <view
          v-for="point in frameworkPoints"
          :key="point.code"
          class="point-item"
        >
          <text class="point-code">{{ point.code }}</text>
          <text class="point-title">{{ point.title }}</text>
          <text class="point-summary">
            {{ point.summary || point.recommendation || "待完善" }}
          </text>
        </view>
      </view>
    </view>

    <view v-if="reports.length" class="section-block">
      <text class="section-title standalone">报告</text>
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
      :next-actions="nextActions"
      :actions-disabled="actionsDisabled"
      @action="(action) => emit('action', action)"
    />

    <view v-if="nextActions.length && !reportDetail && !isProgressCard" class="section-block">
      <text class="section-title standalone">下一步</text>
      <view class="action-list">
        <button
          v-for="action in nextActions"
          :key="action"
          class="action-chip"
          :disabled="actionsDisabled"
          @click="emit('action', action)"
        >
          {{ actionLabel(action) }}
        </button>
      </view>
    </view>

    <view v-if="changedPoints.length" class="section-block">
      <text class="section-title standalone">{{ changedPointsTitle }}</text>
      <view class="change-list">
        <view
          v-for="point in changedPoints"
          :key="`${point.code}-${point.field}`"
          class="change-item"
        >
          <text class="change-title">{{ point.code }} {{ point.title }}</text>
          <text class="change-copy">{{ formatChangedPoint(point) }}</text>
        </view>
      </view>
    </view>

    <view v-if="questions.length" class="section-block">
      <text class="section-title standalone">追问问题</text>
      <view class="question-list">
        <view v-for="question in questions" :key="question.id" class="question-item">
          <text class="question-title">
            {{ question.code }} {{ question.title }}
          </text>
          <text class="question-copy">{{ question.question }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AgentMessageMetadata } from "@/types/strategy";
import StrategyProgressCard from "./StrategyProgressCard.vue";
import StrategyReportDetailCard from "./StrategyReportDetailCard.vue";

const props = defineProps<{
  metadata?: AgentMessageMetadata | null;
  actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
  action: [action: string, payload?: Record<string, unknown>];
}>();

type DisplayField = {
  key: string;
  label: string;
  value: unknown;
};

type DisplayPoint = {
  code: string;
  title: string;
  category?: string;
  summary: string;
  recommendation: string;
  deductionReason?: string;
  confidenceText?: string;
};

type DisplayReport = {
  id: string;
  diagnosisId: string;
  type: string;
  title: string;
  needsSync: boolean;
};

type DisplayFile = {
  id: string;
  originalName: string;
  size: number;
  status: string;
  statusText: string;
  extractedTextLength: number;
};

type DisplayChangedPoint = {
  code: string;
  title: string;
  field: string;
  operation: string;
  previousValue: unknown;
  nextValue: unknown;
};

type DisplayQuestion = {
  id: string;
  code: string;
  title: string;
  question: string;
};

type DisplayReportSection = {
  title: string;
  content: string;
};

type DisplaySingleFile = {
  originalName: string;
  size: number;
  statusText: string;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.map(asRecord).filter((item) => Object.keys(item).length > 0)
    : [];

const card = computed(() => asRecord(props.metadata?.card));
const cardReady = computed(() => Object.keys(card.value).length > 0);
const cardDiagnosisId = computed(() =>
  String(card.value.diagnosisId || props.metadata?.diagnosisId || ""),
);
const messageAction = computed(() => String(props.metadata?.action || ""));
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
const cardTitle = computed(() => {
  const titleMap: Record<string, string> = {
    strategy_file_upload_user: "上传资料",
    strategy_file_uploaded: "资料解析结果",
    strategy_files: "当前资料",
    strategy_chat_error: "执行受阻",
    strategy_not_started: "诊断进展",
    strategy_diagnosis_status: "诊断进展",
    strategy_diagnosis_flow: "诊断进展",
    strategy_completed_entry: "诊断进展",
    strategy_dashboard_empty: "诊断进展",
    strategy_dashboard_pending: "诊断进展",
    strategy_form: "战略分析表单",
    strategy_form_generated: "战略分析表单",
    strategy_analysis_form: "战略分析表单",
    strategy_framework: "战略框架",
    strategy_framework_generated: "战略框架",
    strategy_point_detail: "战略点详情",
    strategy_reports_generated: "战略报告",
    strategy_reports_synced: "战略报告",
    strategy_report: "战略报告",
    brand_strategy_dashboard: "品牌战略看板",
  };

  return titleMap[uiType.value] || "执行结果";
});
const isProgressCard = computed(() => {
  const progressTypes = new Set([
    "strategy_not_started",
    "strategy_diagnosis_status",
    "strategy_diagnosis_flow",
    "strategy_completed_entry",
    "strategy_dashboard_empty",
    "strategy_dashboard_pending",
  ]);

  return (
    progressTypes.has(uiType.value) ||
    messageAction.value === "check_status" ||
    messageAction.value === "rediagnose"
  );
});
const statusText = computed(() =>
  toVisibleStatusText(card.value.status || card.value.reason),
);
const file = computed<DisplaySingleFile | null>(() => {
  const rawFile = asRecord(card.value.file);
  const originalName = String(rawFile.originalName || "");

  if (!originalName) {
    return null;
  }

  return {
    originalName,
    size: typeof rawFile.size === "number" ? rawFile.size : 0,
    statusText: toFileStatusText(rawFile.status),
  };
});
const files = computed<DisplayFile[]>(() =>
  asArray(card.value.files).map((item, index) => {
    const status = String(item.status || "");

    return {
      id: String(item.id || `file-${index}`),
      originalName: String(item.originalName || `资料 ${index + 1}`),
      size: typeof item.size === "number" ? item.size : 0,
      status,
      statusText: toFileStatusText(status),
      extractedTextLength:
        typeof item.extractedTextLength === "number"
          ? item.extractedTextLength
          : 0,
    };
  }),
);
const isFilesCard = computed(() => uiType.value === "strategy_files");
const filesOverviewText = computed(() => {
  if (!files.value.length) {
    return "0 份";
  }

  const parsedCount = files.value.filter(
    (item) => item.status === "parsed",
  ).length;

  return `共 ${files.value.length} 份，${parsedCount} 份已解析`;
});
const extractedFields = computed(() =>
  Object.entries(asRecord(card.value.extractedFields))
    .slice(0, 8)
    .map(([key, value]) => ({ key, label: key, value })),
);
const formFields = computed<DisplayField[]>(() =>
  asArray(asRecord(card.value.form).fields).map((field, index) => ({
    key: String(field.key || `field-${index}`),
    label: String(field.label || field.key || `字段 ${index + 1}`),
    value: field.value,
  })),
);
const filledFormFields = computed(() =>
  formFields.value.filter((field) => !isFieldMissing(field)),
);
const formProgressText = computed(() =>
  formFields.value.length
    ? `已补充 ${filledFormFields.value.length}/${formFields.value.length}`
    : "",
);
const missingFields = computed<DisplayField[]>(() =>
  asArray(asRecord(card.value.form).missingFields).map((field, index) => ({
    key: String(field.key || `missing-${index}`),
    label: String(field.label || field.key || `字段 ${index + 1}`),
    value: "",
  })),
);
const pointDetail = computed<DisplayPoint | null>(() => {
  const point = asRecord(card.value.point);
  const code = String(point.code || "");

  if (!code) {
    return null;
  }

  const confidence =
    typeof point.confidence === "number"
      ? `${Math.round(point.confidence * 100)}%`
      : "";

  return {
    code,
    title: String(point.title || "战略点"),
    category: String(point.category || ""),
    summary: String(point.summary || ""),
    recommendation: String(point.recommendation || ""),
    deductionReason: String(point.deductionReason || ""),
    confidenceText: confidence,
  };
});
const pointEvidence = computed(() => {
  const point = asRecord(card.value.point);
  const evidence = Array.isArray(point.evidence) ? point.evidence : [];

  return evidence
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      const record = asRecord(item);
      const field = String(record.field || "");
      const value = stringify(record.value);
      const source = String(record.source || "");

      return [field, value, source ? `来源：${source}` : ""]
        .filter(Boolean)
        .join("，");
    })
    .filter(Boolean)
    .slice(0, 6);
});
const reportSection = computed<DisplayReportSection | null>(() => {
  const section = asRecord(card.value.reportSection);
  const title = String(section.title || "");
  const content = String(section.content || "");

  return title || content ? { title, content } : null;
});
const frameworkPoints = computed(() => {
  const framework = asRecord(card.value.framework);
  const content = asRecord(framework.content);
  return asArray(content.points || framework.points)
    .slice(0, 19)
    .map<DisplayPoint>((point, index) => ({
      code: String(point.code || `M${String(index + 1).padStart(2, "0")}`),
      title: String(point.title || "未命名战略点"),
      summary: String(point.summary || ""),
      recommendation: String(point.recommendation || ""),
    }));
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
const nextActions = computed(() =>
  Array.isArray(card.value.nextActions)
    ? card.value.nextActions.map(String)
    : [],
);
const changedPoints = computed<DisplayChangedPoint[]>(() =>
  asArray(card.value.changedPoints).map((point, index) => ({
    code: String(point.code || `M${String(index + 1).padStart(2, "0")}`),
    title: String(point.title || "战略点"),
    field: String(point.field || "字段"),
    operation: String(point.operation || "set"),
    previousValue: point.previousValue,
    nextValue: point.nextValue,
  })),
);
const changedPointsTitle = computed(() => {
  const reason = String(card.value.reason || "");

  if (
    reason === "framework_update_confirmed" ||
    messageAction.value === "confirm_framework_update"
  ) {
    return "已确认修改";
  }

  if (
    reason === "framework_update_cancelled" ||
    messageAction.value === "cancel_framework_update"
  ) {
    return "已取消修改";
  }

  return "待确认修改";
});
const questions = computed<DisplayQuestion[]>(() =>
  asArray(card.value.questions).map((question, index) => ({
    id: String(question.id || question.code || `question-${index}`),
    code: String(question.code || ""),
    title: String(question.title || ""),
    question: String(question.question || question.content || ""),
  })),
);

function stringify(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function formatFileSize(size: unknown) {
  const bytes = typeof size === "number" ? size : 0;

  if (!bytes) {
    return "未知大小";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function toVisibleStatusText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text || /[_./]/.test(text) || /^[a-z0-9-]+$/i.test(text)) {
    return "";
  }

  return text;
}

function toFileStatusText(value: unknown) {
  const status = typeof value === "string" ? value.trim() : "";
  const labels: Record<string, string> = {
    parsed: "已解析",
    uploaded: "已上传",
    parsing: "解析中",
    failed: "解析失败",
  };

  return labels[status] || toVisibleStatusText(status) || "已上传";
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    start_diagnosis: "开始诊断",
    provide_info: "补充企业信息",
    upload_files: "上传资料",
    upload_more_files: "继续上传资料",
    view_files: "查看当前资料",
    generate_form: "生成表单",
    supplement_form: "补充字段",
    confirm_form: "确认表单",
    generate_framework: "生成19点框架",
    refine_framework: "继续完善框架",
    confirm_framework: "确认框架",
    generate_reports: "生成报告",
    wait_reports: "等待报告生成",
    sync_reports: "同步报告",
    open_dashboard: "打开看板",
    view_enterprise_diagnosis_report: "查看诊断报告",
    view_enterprise_solution_report: "查看方案报告",
    view_beidou_declaration: "查看北斗宣言",
    view_strategy_positioning_report: "查看战略定位报告",
    view_advantages_barriers_report: "查看优势与壁垒报告",
    view_business_model_panorama: "查看商业模式全景图",
    view_brand_experience_blueprint: "查看品牌与体验蓝图",
    rediagnose: "重新诊断",
    confirm_framework_update: "确认修改",
    cancel_framework_update: "取消修改",
    continue_refine_framework: "继续完善框架",
    answer_refinement_questions: "回答追问",
    update_framework: "提交框架修改",
    check_status: "查看进度",
  };

  return labels[action] || action;
}

function isFieldMissing(field: DisplayField) {
  return !stringify(field.value).trim();
}

function frameworkFieldLabel(field: string) {
  const labels: Record<string, string> = {
    summary: "框架表述",
    recommendation: "行动建议",
    deductionReason: "风险与缺口",
    evidence: "支撑证据",
    dashboardVisible: "看板展示",
    dashboardGroup: "看板分组",
    confidence: "置信度",
  };

  return labels[field] || "修改内容";
}

function extractEvidenceValues(value: unknown) {
  const source = Array.isArray(value) ? value : value ? [value] : [];

  return source
    .map((item) => {
      const record = asRecord(item);
      const raw = record.value ?? record.content ?? record.text ?? item;

      return stringify(raw).trim();
    })
    .filter(Boolean);
}

function formatFrameworkValue(field: string, value: unknown) {
  if (field === "evidence") {
    return extractEvidenceValues(value).join("；");
  }

  if (field === "dashboardVisible") {
    return value === false ? "不在看板展示" : "在看板展示";
  }

  if (field === "dashboardGroup") {
    const group = stringify(value);
    const labels: Record<string, string> = {
      standard: "常规展示",
      support_system: "支撑体系",
    };

    return labels[group] || group;
  }

  if (field === "confidence") {
    const numeric = typeof value === "number" ? value : Number(value);

    return Number.isFinite(numeric)
      ? `${Math.round(numeric * 100)}%`
      : stringify(value);
  }

  return stringify(value).trim();
}

function formatChangedPoint(point: DisplayChangedPoint) {
  const label = frameworkFieldLabel(point.field);

  if (point.field === "evidence") {
    const previousValues = new Set(extractEvidenceValues(point.previousValue));
    const nextValues = extractEvidenceValues(point.nextValue);
    const addedValues = nextValues.filter((item) => !previousValues.has(item));
    const displayValues =
      addedValues.length > 0 ? addedValues : nextValues.slice(-1);

    return displayValues.length > 0
      ? `新增${label}：${displayValues.join("；")}`
      : `新增${label}。`;
  }

  const previousText = formatFrameworkValue(point.field, point.previousValue);
  const nextText = formatFrameworkValue(point.field, point.nextValue);

  if (point.operation === "append") {
    return `补充${label}：${nextText || "待补充"}`;
  }

  return previousText
    ? `将${label}由“${previousText}”调整为“${nextText || "待补充"}”`
    : `设置${label}为“${nextText || "待补充"}”`;
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

.file-row {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  background: #f6f8fb;
  border-radius: 6px;
}

.doc-icon {
  position: relative;
  width: 18px;
  height: 20px;
  flex: 0 0 18px;
  border: 1.5px solid #1267ff;
  border-radius: 3px;
}

.doc-icon::after {
  position: absolute;
  right: -1.5px;
  top: -1.5px;
  width: 6px;
  height: 6px;
  content: "";
  background: #f6f8fb;
  border-left: 1.5px solid #1267ff;
  border-bottom: 1.5px solid #1267ff;
  border-radius: 0 3px 0 2px;
}

.doc-icon.small {
  width: 16px;
  height: 18px;
  flex-basis: 16px;
  margin-top: 1px;
}

.file-copy,
.material-copy {
  min-width: 0;
}

.file-name,
.material-name {
  display: block;
  overflow: hidden;
  color: #172033;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta,
.material-meta,
.material-small {
  display: block;
  margin-top: 3px;
  color: #718096;
  font-size: 11px;
  line-height: 1.45;
}

.section-block {
  margin-top: 12px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 11px;
}

.section-title {
  color: #384559;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}

.section-title.standalone {
  display: block;
  margin-bottom: 8px;
}

.material-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.material-item {
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  padding: 9px;
  background: #f7f9fc;
  border-radius: 6px;
}

.empty-tip {
  display: block;
  color: #718096;
  font-size: 12px;
  line-height: 1.5;
}

.field-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.field-pair {
  display: grid;
  grid-template-columns: minmax(92px, 0.35fr) minmax(160px, 1fr);
  gap: 12px;
}

.field-key {
  color: #718096;
  line-height: 1.55;
}

.field-value {
  min-width: 0;
  color: #263142;
  line-height: 1.55;
  word-break: break-word;
}

.field-key.missing {
  color: #9a3412;
}

.field-value.missing {
  color: #9a3412;
  font-weight: 700;
}

.missing-list,
.report-list,
.action-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.missing-list text {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  color: #9a3412;
  font-size: 11px;
  line-height: 22px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 6px;
}

.point-detail {
  box-sizing: border-box;
  padding: 10px;
  background: #f7f9fc;
  border: 1px solid #e5ebf4;
  border-radius: 6px;
}

.evidence-list,
.report-section-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
  padding-top: 10px;
  color: #667085;
  font-size: 11px;
  line-height: 1.5;
  border-top: 1px solid #e5ebf4;
}

.detail-label {
  margin-bottom: 2px;
  color: #384559;
  font-size: 12px;
  font-weight: 700;
}

.point-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.point-item {
  box-sizing: border-box;
  min-width: 0;
  padding: 9px;
  background: #f7f9fc;
  border-radius: 6px;
}

.point-code {
  display: block;
  color: #1267ff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
}

.point-title {
  display: block;
  margin-top: 2px;
  color: #172033;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}

.point-summary {
  display: -webkit-box;
  margin-top: 4px;
  overflow: hidden;
  color: #667085;
  font-size: 11px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.report-chip,
.action-chip {
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

.report-chip::after,
.action-chip::after {
  border: 0;
}

.report-chip[disabled],
.action-chip[disabled] {
  opacity: 0.55;
}

.chip-small {
  color: #9a3412;
  font-size: 10px;
}

.change-list,
.question-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.change-item,
.question-item {
  box-sizing: border-box;
  padding: 9px;
  background: #fff8ec;
  border: 1px solid #ffe0ad;
  border-radius: 6px;
}

.change-title,
.question-title {
  display: block;
  color: #172033;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}

.change-copy,
.question-copy {
  display: block;
  margin-top: 4px;
  color: #66533d;
  font-size: 11px;
  line-height: 1.5;
  word-break: break-word;
}

@media (max-width: 1280px) {
  .point-grid {
    grid-template-columns: 1fr;
  }

  .field-pair {
    grid-template-columns: minmax(76px, 0.34fr) minmax(0, 1fr);
  }
}
</style>
