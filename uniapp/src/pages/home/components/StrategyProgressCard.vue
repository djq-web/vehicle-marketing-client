<template>
  <view class="progress-card">
    <view class="progress-summary">
      <view class="summary-copy">
        <text class="summary-label">当前阶段</text>
        <text class="summary-title">{{ currentStageLabel }}</text>
        <text class="summary-desc">{{ currentStageDescription }}</text>
      </view>
      <view class="summary-meter">
        <text>{{ completedStepCount }}/{{ steps.length }}</text>
        <text>已完成</text>
      </view>
    </view>

    <view class="progress-track">
      <view class="progress-fill" :style="{ width: progressPercent }"></view>
    </view>

    <view class="step-list">
      <view
        v-for="step in steps"
        :key="step.key"
        class="step-item"
        :class="step.state"
      >
        <view class="step-marker">
          <text>{{ step.index }}</text>
        </view>
        <view class="step-copy">
          <view class="step-heading">
            <text class="step-title">{{ step.title }}</text>
            <text class="step-status">{{ step.statusText }}</text>
          </view>
          <text class="step-desc">{{ step.description }}</text>
        </view>
      </view>
    </view>

    <view class="fact-grid">
      <view class="fact-item">
        <text class="fact-label">诊断</text>
        <text class="fact-value">{{ diagnosisTitle }}</text>
      </view>
      <view class="fact-item">
        <text class="fact-label">表单</text>
        <text class="fact-value">{{ formStatusText }}</text>
      </view>
      <view class="fact-item">
        <text class="fact-label">框架</text>
        <text class="fact-value">{{ frameworkStatusText }}</text>
      </view>
      <view class="fact-item">
        <text class="fact-label">报告</text>
        <text class="fact-value">{{ reportsStatusText }}</text>
      </view>
    </view>

    <view v-if="pendingUpdateText" class="pending-update">
      <text>{{ pendingUpdateText }}</text>
    </view>

    <view v-if="nextActions.length" class="progress-actions">
      <button
        v-for="action in nextActions"
        :key="action"
        class="progress-action"
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
  card: Record<string, unknown>;
  nextActions?: string[];
  actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
  action: [action: string];
}>();

type StepState = "done" | "current" | "pending";

type ProgressStep = {
  key: string;
  index: number;
  title: string;
  description: string;
  state: StepState;
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

const diagnosis = computed(() => asRecord(props.card.diagnosis));
const pendingFrameworkUpdate = computed(() =>
  asRecord(props.card.pendingFrameworkUpdate),
);
const status = computed(() =>
  String(props.card.status || diagnosis.value.status || "not_started"),
);
const reports = computed(() =>
  asArray(props.card.reports).length
    ? asArray(props.card.reports)
    : asArray(diagnosis.value.reports),
);
const nextActions = computed(() =>
  (props.nextActions ?? []).filter(Boolean),
);

const statusRank = computed(() => {
  const ranks: Record<string, number> = {
    not_started: 0,
    collecting_info: 1,
    rediagnosing: 1,
    form_draft_generated: 2,
    form_confirmed: 3,
    framework_draft_generated: 4,
    framework_refining: 4,
    framework_confirmed: 5,
    reports_generating: 6,
    completed: 7,
  };

  return ranks[status.value] ?? 0;
});

const generatedReportCount = computed(
  () =>
    reports.value.filter((report) => {
      const reportStatus = String(report.status || "");
      return report.isGenerated === true || reportStatus === "generated";
    }).length,
);
const staleReportCount = computed(
  () => reports.value.filter((report) => report.needsSync === true).length,
);

const steps = computed<ProgressStep[]>(() => {
  const rank = statusRank.value;
  const reportCount = reports.value.length;

  return [
    {
      key: "collect",
      index: 1,
      title: "收集信息与资料",
      description:
        status.value === "not_started"
          ? "尚未开始战略诊断。"
          : rank <= 1
            ? "正在补充企业信息、上传并解析资料。"
            : "企业信息收集已进入下一阶段。",
      state: rank > 1 ? "done" : rank === 1 ? "current" : "pending",
      statusText: rank > 1 ? "已推进" : rank === 1 ? "进行中" : "待开始",
    },
    {
      key: "form",
      index: 2,
      title: "战略分析表单",
      description:
        rank >= 3
          ? "战略分析表单已确认。"
          : rank === 2
            ? "表单草稿已生成，等待确认或补充资料。"
            : "等待资料充足后生成表单。",
      state: rank >= 3 ? "done" : rank === 2 ? "current" : "pending",
      statusText: rank >= 3 ? "已确认" : rank === 2 ? "待确认" : "待生成",
    },
    {
      key: "framework",
      index: 3,
      title: "19点战略框架",
      description:
        rank >= 5
          ? "19点战略框架已确认。"
          : rank === 4
            ? "框架草稿已生成，正在确认或继续完善。"
            : "等待表单确认后生成框架。",
      state: rank >= 5 ? "done" : rank === 4 ? "current" : "pending",
      statusText: rank >= 5 ? "已确认" : rank === 4 ? "完善中" : "待生成",
    },
    {
      key: "reports",
      index: 4,
      title: "战略报告",
      description:
        rank >= 7
          ? `已生成 ${generatedReportCount.value || reportCount} 份报告。`
          : rank === 6
            ? "报告正在生成中。"
            : rank === 5
              ? "框架已确认，可开始生成报告。"
              : "等待框架确认后生成报告。",
      state: rank >= 7 ? "done" : rank >= 5 ? "current" : "pending",
      statusText:
        rank >= 7 ? "已生成" : rank === 6 ? "生成中" : rank === 5 ? "可生成" : "待生成",
    },
    {
      key: "dashboard",
      index: 5,
      title: "看板与结果查看",
      description:
        rank >= 7
          ? "可以查看品牌战略看板和报告详情。"
          : "诊断完成后开放看板和完整结果查看。",
      state: rank >= 7 ? "done" : "pending",
      statusText: rank >= 7 ? "可查看" : "待完成",
    },
  ];
});

const completedStepCount = computed(
  () => steps.value.filter((step) => step.state === "done").length,
);
const progressPercent = computed(() => {
  if (steps.value.length <= 1) {
    return "0%";
  }

  const currentIndex = steps.value.findIndex((step) => step.state === "current");
  const activeIndex =
    currentIndex >= 0 ? currentIndex : Math.max(0, completedStepCount.value - 1);
  const percent = Math.round((activeIndex / (steps.value.length - 1)) * 100);

  return `${Math.min(100, Math.max(0, percent))}%`;
});

const currentStageLabel = computed(() => {
  const labels: Record<string, string> = {
    not_started: "尚未开始诊断",
    collecting_info: "正在收集企业信息和资料",
    rediagnosing: "重新诊断已启动",
    form_draft_generated: "表单草稿待确认",
    form_confirmed: "表单已确认",
    framework_draft_generated: "19点框架草稿待确认",
    framework_refining: "19点框架完善中",
    framework_confirmed: "19点框架已确认",
    reports_generating: "报告生成中",
    completed: "战略诊断已完成",
  };

  return labels[status.value] || "诊断进展";
});

const currentStageDescription = computed(() => {
  const descriptions: Record<string, string> = {
    not_started: "当前企业还没有开始战略诊断。",
    collecting_info: "请继续补充企业信息或上传资料，资料充足后可生成战略分析表单。",
    rediagnosing: "本轮诊断已重新开始，后续结果会以新诊断数据为准。",
    form_draft_generated: "请核对当前战略分析表单，确认无误后进入19点战略框架生成。",
    form_confirmed: "下一步可以生成19点战略框架。",
    framework_draft_generated: "请确认框架，或继续补充证据和关键判断。",
    framework_refining: "当前正在根据补充信息完善框架。",
    framework_confirmed: "下一步可以生成7份战略报告。",
    reports_generating: "报告正在生成，请稍后查看结果。",
    completed: "可以查看品牌战略看板和已生成报告。",
  };

  return descriptions[status.value] || "已读取当前诊断状态。";
});

const diagnosisTitle = computed(
  () => String(diagnosis.value.title || props.card.title || "当前企业诊断"),
);
const formStatusText = computed(() => {
  const formStatus = String(
    diagnosis.value.analysisFormStatus || asRecord(props.card.form).status || "",
  );

  if (formStatus === "confirmed") {
    return "已确认";
  }

  if (formStatus === "draft" || diagnosis.value.hasAnalysisForm === true) {
    return "草稿待确认";
  }

  return "未生成";
});
const frameworkStatusText = computed(() => {
  const frameworkStatus = String(
    diagnosis.value.frameworkStatus ||
      asRecord(props.card.framework).status ||
      "",
  );

  if (frameworkStatus === "confirmed") {
    return "已确认";
  }

  if (frameworkStatus === "draft" || diagnosis.value.hasFramework === true) {
    return "草稿待确认";
  }

  return "未生成";
});
const reportsStatusText = computed(() => {
  if (!reports.value.length) {
    return "未生成";
  }

  if (staleReportCount.value > 0) {
    return `${reports.value.length} 份，${staleReportCount.value} 份需同步`;
  }

  return `${generatedReportCount.value || reports.value.length} 份已生成`;
});
const pendingUpdateText = computed(() => {
  const changedPoints = asArray(pendingFrameworkUpdate.value.changedPoints);

  if (!changedPoints.length) {
    return "";
  }

  const pointTexts = changedPoints
    .map((point) => [point.code, point.title].filter(Boolean).join(" "))
    .filter(Boolean)
    .slice(0, 3);

  return pointTexts.length
    ? `当前有待确认框架修改：${pointTexts.join("、")}。`
    : "当前有待确认框架修改。";
});

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
    wait_reports: "查看进度",
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
</script>

<style scoped>
.progress-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e5ebf4;
  border-radius: 8px;
}

.summary-copy {
  min-width: 0;
}

.summary-label {
  display: block;
  color: #64748b;
  font-size: 11px;
  line-height: 1.4;
}

.summary-title {
  display: block;
  margin-top: 3px;
  color: #172033;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.45;
}

.summary-desc {
  display: block;
  margin-top: 5px;
  color: #536174;
  font-size: 12px;
  line-height: 1.55;
}

.summary-meter {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  min-height: 54px;
  color: #1267ff;
  background: #eef5ff;
  border-radius: 8px;
}

.summary-meter text:first-child {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.2;
}

.summary-meter text:last-child {
  margin-top: 3px;
  font-size: 10px;
  line-height: 1.2;
}

.progress-track {
  position: relative;
  height: 4px;
  overflow: hidden;
  background: #e8eef7;
  border-radius: 999px;
}

.progress-fill {
  height: 100%;
  background: #1267ff;
  border-radius: inherit;
}

.step-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-item {
  display: flex;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  background: #ffffff;
  border: 1px solid #e5ebf4;
  border-radius: 8px;
}

.step-item.done {
  background: #f7fbf8;
  border-color: #cfead7;
}

.step-item.current {
  background: #f5f9ff;
  border-color: #bdd7ff;
}

.step-marker {
  display: flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #7b8798;
  font-size: 11px;
  font-weight: 800;
  background: #eef2f7;
  border-radius: 50%;
}

.step-item.done .step-marker {
  color: #ffffff;
  background: #22a06b;
}

.step-item.current .step-marker {
  color: #ffffff;
  background: #1267ff;
}

.step-copy {
  min-width: 0;
  flex: 1;
}

.step-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.step-title {
  min-width: 0;
  color: #263142;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
}

.step-status {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 11px;
  line-height: 1.35;
}

.step-item.done .step-status {
  color: #1f7a4d;
}

.step-item.current .step-status {
  color: #1267ff;
}

.step-desc {
  display: block;
  margin-top: 4px;
  color: #667085;
  font-size: 11px;
  line-height: 1.5;
}

.fact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.fact-item {
  min-width: 0;
  padding: 9px;
  background: #f8fafc;
  border-radius: 7px;
}

.fact-label {
  display: block;
  color: #718096;
  font-size: 10px;
  line-height: 1.35;
}

.fact-value {
  display: block;
  margin-top: 4px;
  overflow: hidden;
  color: #263142;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pending-update {
  padding: 9px 10px;
  color: #8a4b00;
  font-size: 12px;
  line-height: 1.5;
  background: #fff8eb;
  border: 1px solid #fed7aa;
  border-radius: 8px;
}

.progress-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.progress-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  margin: 0;
  padding: 0 11px;
  color: #1267ff;
  font-size: 12px;
  font-weight: 700;
  line-height: 28px;
  background: #edf5ff;
  border: 1px solid #c9ddff;
  border-radius: 7px;
}

.progress-action[disabled] {
  color: #9aa7b8;
  background: #f4f6f8;
  border-color: #e5e7eb;
}

@media (max-width: 720px) {
  .progress-summary {
    flex-direction: column;
  }

  .summary-meter {
    align-items: flex-start;
    width: 100%;
    min-height: auto;
    padding: 9px 10px;
  }

  .fact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
