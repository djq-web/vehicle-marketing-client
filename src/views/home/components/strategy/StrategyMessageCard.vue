<template>
  <article v-if="card" class="message-card">
    <header class="card-header">
      <span class="card-type">{{ cardTitle }}</span>
      <span v-if="statusText" class="card-status">{{ statusText }}</span>
    </header>

    <section v-if="file.originalName" class="file-row">
      <el-icon><Document /></el-icon>
      <div>
        <strong>{{ file.originalName }}</strong>
        <p>{{ formatFileSize(file.size) }} · {{ fileStatusText }}</p>
      </div>
    </section>

    <section v-if="files.length || isFilesCard" class="section-block">
      <div class="section-heading">
        <h4>当前资料</h4>
        <span>{{ filesOverviewText }}</span>
      </div>
      <div v-if="files.length" class="material-list">
        <div v-for="item in files" :key="item.id" class="material-item">
          <el-icon><Document /></el-icon>
          <div>
            <strong>{{ item.originalName }}</strong>
            <p>{{ formatFileSize(item.size) }} · {{ item.statusText }}</p>
            <small v-if="item.extractedTextLength">
              已解析文本 {{ item.extractedTextLength }} 字
            </small>
          </div>
        </div>
      </div>
      <p v-else class="empty-tip">当前还没有上传资料。</p>
    </section>

    <section v-if="extractedFields.length" class="section-block">
      <h4>识别字段</h4>
      <dl class="field-grid">
        <template v-for="field in extractedFields" :key="field.key">
          <dt>{{ field.key }}</dt>
          <dd>{{ stringify(field.value) }}</dd>
        </template>
      </dl>
    </section>

    <section v-if="formFields.length" class="section-block">
      <div class="section-heading">
        <h4>当前已补充信息全览</h4>
        <span>{{ formProgressText }}</span>
      </div>
      <dl class="field-list overview-list">
        <template v-for="field in formFields" :key="field.key">
          <dt :class="{ missing: isFieldMissing(field) }">
            {{ field.label || field.key }}
          </dt>
          <dd :class="{ missing: isFieldMissing(field) }">
            {{ stringify(field.value) || "待补充" }}
          </dd>
        </template>
      </dl>
    </section>

    <section v-if="missingFields.length" class="section-block">
      <h4>待补充字段</h4>
      <div class="missing-list">
        <span v-for="field in missingFields" :key="field.key">
          {{ field.label || field.key }}
        </span>
      </div>
    </section>

    <section v-if="pointDetail" class="section-block point-detail">
      <div class="section-heading">
        <h4>{{ pointDetail.code }} {{ pointDetail.title }}</h4>
        <span v-if="pointDetail.category">{{ pointDetail.category }}</span>
      </div>
      <dl class="field-list overview-list">
        <template v-if="pointDetail.summary">
          <dt>当前判断</dt>
          <dd>{{ pointDetail.summary }}</dd>
        </template>
        <template v-if="pointDetail.recommendation">
          <dt>建议动作</dt>
          <dd>{{ pointDetail.recommendation }}</dd>
        </template>
        <template v-if="pointDetail.deductionReason">
          <dt>缺口原因</dt>
          <dd>{{ pointDetail.deductionReason }}</dd>
        </template>
        <template v-if="pointDetail.confidenceText">
          <dt>置信度</dt>
          <dd>{{ pointDetail.confidenceText }}</dd>
        </template>
      </dl>
      <div v-if="pointEvidence.length" class="evidence-list">
        <strong>证据</strong>
        <p v-for="item in pointEvidence" :key="item">{{ item }}</p>
      </div>
      <div v-if="reportSection" class="report-section-detail">
        <strong>{{ reportSection.title || "报告章节" }}</strong>
        <p v-if="reportSection.content">{{ reportSection.content }}</p>
      </div>
    </section>

    <section v-if="frameworkPoints.length" class="section-block">
      <h4>19 点战略框架</h4>
      <div class="point-grid">
        <div
          v-for="point in frameworkPoints"
          :key="point.code"
          class="point-item"
        >
          <span>{{ point.code }}</span>
          <strong>{{ point.title }}</strong>
          <p>{{ point.summary || point.recommendation || "待完善" }}</p>
        </div>
      </div>
    </section>

    <section v-if="reports.length" class="section-block">
      <h4>报告</h4>
      <div class="report-list">
        <button
          v-for="report in reports"
          :key="report.id || report.type"
          class="report-chip"
          type="button"
          :disabled="actionsDisabled"
          @click="
            emit('action', 'view_report', {
              type: report.type,
              diagnosisId: report.diagnosisId,
            })
          "
        >
          {{ report.title || report.type }}
          <small v-if="report.needsSync">需同步</small>
        </button>
      </div>
    </section>

    <StrategyReportDetailCard
      v-if="reportDetail"
      :report="reportDetail"
      :next-actions="nextActions"
      :actions-disabled="actionsDisabled"
      @action="emit('action', $event)"
    />

    <section v-if="nextActions.length && !reportDetail" class="section-block">
      <h4>下一步</h4>
      <div class="action-list">
        <button
          v-for="action in nextActions"
          :key="action"
          class="action-chip"
          type="button"
          :disabled="actionsDisabled"
          @click="emit('action', action)"
        >
          {{ actionLabel(action) }}
        </button>
      </div>
    </section>

    <section v-if="changedPoints.length" class="section-block">
      <h4>{{ changedPointsTitle }}</h4>
      <div class="change-list">
        <div
          v-for="point in changedPoints"
          :key="`${point.code}-${point.field}`"
          class="change-item"
        >
          <strong>{{ point.code }} {{ point.title }}</strong>
          <p>{{ formatChangedPoint(point) }}</p>
        </div>
      </div>
    </section>

    <section v-if="questions.length" class="section-block">
      <h4>追问问题</h4>
      <ol class="question-list">
        <li v-for="question in questions" :key="question.id">
          <strong>{{ question.code }} {{ question.title }}</strong>
          <p>{{ question.question }}</p>
        </li>
      </ol>
    </section>
  </article>
</template>

<script setup lang="ts">
import { Document } from "@element-plus/icons-vue";
import type { AgentMessageMetadata } from "@/types/strategy";
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

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.map(asRecord).filter((item) => Object.keys(item).length > 0)
    : [];

const stringify = (value: unknown) => {
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
};

const formatFileSize = (size: unknown) => {
  const bytes = typeof size === "number" ? size : 0;

  if (!bytes) {
    return "未知大小";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

const card = computed(() => asRecord(props.metadata?.card));
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
const statusText = computed(() =>
  toVisibleStatusText(card.value.status || card.value.reason),
);
const file = computed(() => asRecord(card.value.file));
const fileStatusText = computed(() => toFileStatusText(file.value.status));
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
    .map(([key, value]) => ({ key, value })),
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
const toVisibleStatusText = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text || /[_./]/.test(text) || /^[a-z0-9-]+$/i.test(text)) {
    return "";
  }

  return text;
};
const toFileStatusText = (value: unknown) => {
  const status = typeof value === "string" ? value.trim() : "";
  const labels: Record<string, string> = {
    parsed: "已解析",
    uploaded: "已上传",
    parsing: "解析中",
    failed: "解析失败",
  };

  return labels[status] || toVisibleStatusText(status) || "已上传";
};
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
const actionLabel = (action: string) => {
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
};
const isFieldMissing = (field: DisplayField) => !stringify(field.value).trim();

const frameworkFieldLabel = (field: string) => {
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
};

const extractEvidenceValues = (value: unknown) => {
  const source = Array.isArray(value) ? value : value ? [value] : [];

  return source
    .map((item) => {
      const record = asRecord(item);
      const raw = record.value ?? record.content ?? record.text ?? item;

      return stringify(raw).trim();
    })
    .filter(Boolean);
};

const formatFrameworkValue = (field: string, value: unknown) => {
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
};

const formatChangedPoint = (point: DisplayChangedPoint) => {
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
};
</script>

<style scoped lang="scss">
.message-card {
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
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  background: #f6f8fb;
  border-radius: 6px;

  .el-icon {
    flex: 0 0 auto;
    color: #1267ff;
    font-size: 20px;
  }

  strong {
    display: block;
    max-width: 360px;
    overflow: hidden;
    color: #172033;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    margin: 3px 0 0;
    color: #718096;
    font-size: 11px;
  }
}

.material-list {
  display: grid;
  gap: 8px;
}

.material-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  padding: 9px;
  background: #f7f9fc;
  border-radius: 6px;

  .el-icon {
    flex: 0 0 auto;
    margin-top: 1px;
    color: #1267ff;
    font-size: 18px;
  }

  div {
    min-width: 0;
  }

  strong {
    display: block;
    overflow: hidden;
    color: #172033;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p,
  small {
    display: block;
    margin: 3px 0 0;
    color: #718096;
    font-size: 11px;
  }
}

.empty-tip {
  margin: 0;
  color: #718096;
  font-size: 12px;
}

.section-block {
  margin-top: 12px;

  h4 {
    margin: 0 0 8px;
    color: #384559;
    font-size: 12px;
  }
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;

  h4 {
    margin: 0;
  }

  span {
    flex: 0 0 auto;
    color: #64748b;
    font-size: 11px;
  }
}

.field-grid,
.field-list {
  display: grid;
  grid-template-columns: minmax(92px, 0.35fr) minmax(160px, 1fr);
  gap: 8px 12px;
  margin: 0;
  font-size: 12px;

  dt {
    color: #718096;
  }

  dd {
    min-width: 0;
    margin: 0;
    color: #263142;
    word-break: break-word;
  }

  .missing {
    color: #9a3412;
  }

  dd.missing {
    font-weight: 700;
  }
}

.point-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.point-item {
  min-width: 0;
  padding: 9px;
  background: #f7f9fc;
  border-radius: 6px;

  span {
    color: #1267ff;
    font-size: 11px;
    font-weight: 700;
  }

  strong {
    display: block;
    margin-top: 2px;
    color: #172033;
    font-size: 12px;
  }

  p {
    display: -webkit-box;
    margin: 4px 0 0;
    overflow: hidden;
    color: #667085;
    font-size: 11px;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

.point-detail {
  padding: 10px;
  background: #f7f9fc;
  border: 1px solid #e5ebf4;
  border-radius: 6px;
}

.evidence-list,
.report-section-detail {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e5ebf4;

  strong {
    display: block;
    margin-bottom: 6px;
    color: #384559;
    font-size: 12px;
  }

  p {
    margin: 4px 0 0;
    color: #667085;
    font-size: 11px;
    line-height: 1.5;
    word-break: break-word;
  }
}

.report-list,
.action-list,
.missing-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.action-chip {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  color: #334155;
  font-size: 11px;
  background: #eef4ff;
  border-radius: 6px;
}

.report-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
  padding: 0 8px;
  color: #334155;
  font-size: 11px;
  background: #eef4ff;
  border: 0;
  border-radius: 6px;

  small {
    color: #9a3412;
    font-size: 10px;
  }

  &:hover {
    background: #dcecff;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.action-chip {
  color: #1267ff;
  font-weight: 700;
  background: #edf5ff;
  border: 1px solid #cfe0f7;

  &:hover {
    background: #dcecff;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.missing-list span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  color: #9a3412;
  font-size: 11px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 6px;
}

.change-list,
.question-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.change-item,
.question-list li {
  padding: 9px;
  list-style: none;
  background: #fff8ec;
  border: 1px solid #ffe0ad;
  border-radius: 6px;

  strong {
    color: #172033;
    font-size: 12px;
  }

  p {
    margin: 4px 0 0;
    color: #66533d;
    font-size: 11px;
    line-height: 1.5;
    word-break: break-word;
  }
}

@media (max-width: 1280px) {
  .point-grid {
    grid-template-columns: 1fr;
  }
}
</style>
