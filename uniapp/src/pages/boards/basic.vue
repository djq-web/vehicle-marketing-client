<template>
  <view class="board-page" :class="`board-page--${activeType}`">
    <button
      class="back-button"
      :class="{ 'back-button--right': isFlowBoard }"
      @click="goHome"
    >
      返回首页
    </button>

    <template v-if="activeType === 'brand-strategy'">
      <BrandStrategyMobile
        v-if="isMobileLayout"
        :cards="brandStrategyCards"
        :loading="brandDashboardLoading"
        :error="brandDashboardError"
        :message="brandDashboardMessage"
        @back="goHome"
        @refresh="loadBrandDashboard"
        @report="openBoardReport"
      />
      <template v-else>
        <section class="basic-hero brand-dashboard-hero">
          <image
            class="basic-hero-icon"
            :src="brandDashboardView.icon"
            mode="aspectFit"
          />
          <text class="board-title">{{ brandDashboardView.title }}</text>
          <text class="title-underline"></text>
          <text class="board-subtitle">{{ brandDashboardView.subtitle }}</text>
          <button class="brand-refresh-button" @click="loadBrandDashboard">
            刷新看板
          </button>
        </section>

        <section
          v-if="brandDashboardLoading"
          class="brand-dashboard-state brand-dashboard-state--loading"
        >
          <view class="brand-dashboard-spinner"></view>
          <text>正在读取品牌战略看板</text>
        </section>

        <section v-else-if="brandDashboardError" class="brand-dashboard-state">
          <text class="brand-dashboard-state-title">看板暂时无法打开</text>
          <text class="brand-dashboard-state-message">{{
            brandDashboardError
          }}</text>
          <button class="brand-dashboard-state-button" @click="loadBrandDashboard">
            重新加载
          </button>
        </section>

        <section
          v-else-if="!brandStrategyCards.length"
          class="brand-dashboard-state"
        >
          <text class="brand-dashboard-state-title">暂无品牌战略看板</text>
          <text class="brand-dashboard-state-message">{{
            brandDashboardMessage || "完成战略诊断后，这里会展示品牌战略看板。"
          }}</text>
          <button class="brand-dashboard-state-button" @click="goHome">
            返回会话
          </button>
        </section>

        <section v-else class="brand-dashboard-grid">
          <view
            v-for="card in brandStrategyCards"
            :key="card.key"
            class="brand-dashboard-card"
            :class="{
              'brand-dashboard-card--document': card.type === 'document',
              'brand-dashboard-card--disabled':
                card.type === 'document' && card.disabled,
            }"
            @click="handleBrandCardClick(card)"
          >
            <template v-if="card.type === 'document'">
              <view class="brand-document-icon" aria-hidden="true">
                <text></text>
                <text></text>
                <text></text>
              </view>
              <text class="brand-document-title">{{ card.title }}</text>
              <text v-if="card.statusText" class="brand-document-status">{{
                card.statusText
              }}</text>
            </template>
            <template v-else>
              <text class="brand-point-code">{{ card.key }}</text>
              <text class="brand-card-title">{{ card.title }}</text>
              <view class="brand-star-row">
                <text
                  v-for="index in starIndexes"
                  :key="`${card.key}-${index}`"
                  class="brand-star"
                  :style="`color:${card.color}`"
                >
                  ★
                </text>
              </view>
              <view class="brand-card-copy">
                <text v-for="line in card.lines" :key="line">{{ line }}</text>
              </view>
            </template>
          </view>
        </section>
      </template>
    </template>

    <template v-else-if="activeType === 'key-metrics'">
      <KeyMetricsMobile
        v-if="isMobileLayout"
        v-model:active-time="activeTime"
        :nodes="metricNodes"
        :time-options="timeOptions"
        @back="goHome"
      />
      <KeyMetricsDesktop
        v-else
        v-model:active-time="activeTime"
        :edges="metricEdges"
        :nodes="metricNodes"
        :time-options="timeOptions"
      />
    </template>

    <template v-else-if="activeType === 'marketing-operations'">
      <MarketingOperationsMobile
        v-if="isMobileLayout"
        :nodes="operationNodes"
        :status-legend="statusLegend"
        @back="goHome"
      />
      <MarketingOperationsDesktop
        v-else
        :edges="operationEdges"
        :nodes="operationNodes"
        :status-legend="statusLegend"
      />
    </template>

    <template v-else-if="activeType === 'marketing-calendar'">
      <MarketingCalendarMobile
        v-if="isMobileLayout"
        :items="scheduleItems"
        @back="goHome"
      />
      <template v-else>
        <section class="page-hero">
          <text class="board-title">营销日历看板</text>
          <text class="title-underline calendar-underline"></text>
        </section>

        <section class="calendar-layout">
          <aside class="calendar-panel">
            <text class="calendar-panel-title">时 间 选 择</text>
            <view class="calendar-picker">
              <view class="calendar-header">
                <view class="calendar-nav-group">
                  <button class="month-button" @click="shiftYear(-1)">«</button>
                  <button class="month-button" @click="shiftMonth(-1)">
                    ‹
                  </button>
                </view>
                <text class="calendar-title">{{ calendarTitle }}</text>
                <view class="calendar-nav-group">
                  <button class="month-button" @click="shiftMonth(1)">›</button>
                  <button class="month-button" @click="shiftYear(1)">»</button>
                </view>
              </view>
              <view class="weekday-row">
                <text v-for="day in weekdays" :key="day">{{ day }}</text>
              </view>
              <view class="date-grid">
                <view
                  v-for="day in calendarDays"
                  :key="day.key"
                  class="date-cell"
                  :class="{
                    muted: day.muted,
                    current: day.current,
                    selected: day.selected,
                  }"
                  @click="selectCalendarDay(day)"
                >
                  <text>{{ day.date }}</text>
                </view>
              </view>
            </view>
          </aside>

          <section class="schedule-panel">
            <view class="schedule-head">
              <text>营销方式</text>
              <text>平台</text>
              <text>账号</text>
              <text>主题</text>
              <text>启动时间</text>
            </view>
            <scroll-view class="schedule-list" scroll-y>
              <button
                v-for="item in scheduleItems"
                :key="`${item.account}-${item.title}-${item.time}-${item.index}`"
                class="schedule-card"
                :class="{ active: item.active }"
              >
                <view class="method-cell">
                  <text
                    class="method-dot"
                    :style="`background:${item.color}`"
                  ></text>
                  <text>{{ item.method }}</text>
                </view>
                <text>{{ item.platform }}</text>
                <text>{{ item.account }}</text>
                <text>{{ item.title }}</text>
                <text class="time">{{ item.time }}</text>
              </button>
            </scroll-view>
          </section>
        </section>
      </template>
    </template>

    <template v-else-if="activeType === 'market-feedback'">
      <MarketFeedbackMobile
        v-if="isMobileLayout"
        v-model:active-filter="activeFeedbackFilter"
        :competitor-panel="competitorPanel"
        :filters="feedbackFilters"
        :stream-panel="streamPanel"
        :top-panels="topPanels"
        @back="goHome"
      />
      <template v-else>
        <section class="feedback-toolbar">
          <text class="toolbar-label">时间：</text>
          <view
            v-for="item in feedbackFilters"
            :key="item"
            class="filter-pill"
            :class="{ active: item === activeFeedbackFilter }"
            @click="activeFeedbackFilter = item"
          >
            {{ item }}
          </view>
        </section>

        <section class="page-hero feedback-hero">
          <text class="board-title">市场反馈看板</text>
          <text class="title-underline calendar-underline"></text>
          <text class="hero-note"
            >数据来源于微信聊天、外呼系统、录音工牌、友商直播间</text
          >
        </section>

        <section class="feedback-grid top-grid">
          <article
            v-for="panel in topPanels"
            :key="panel.title"
            class="feedback-card"
          >
            <view class="card-head">
              <text class="card-title">{{ panel.title }}</text>
            </view>
            <view class="panel-content">
              <section
                v-for="group in panel.groups"
                :key="group.title || group.summaryTitle"
                class="content-group"
              >
                <text v-if="group.title" class="group-title">{{
                  group.title
                }}</text>
                <view v-if="group.items?.length" class="ordered-list">
                  <view
                    v-for="(item, index) in group.items"
                    :key="item"
                    class="list-item"
                  >
                    <text>{{ index + 1 }}.</text>
                    <text>{{ item }}</text>
                  </view>
                </view>
                <view v-if="group.summaryRows" class="summary">
                  <view
                    v-for="row in group.summaryRows"
                    :key="row.label"
                    class="summary-row"
                  >
                    <text class="summary-label">{{ row.label }}</text>
                    <text>{{ row.value }}</text>
                  </view>
                </view>
              </section>
            </view>
          </article>
        </section>

        <section class="feedback-grid bottom-grid">
          <article class="feedback-card feedback-card--narrow">
            <view class="card-head">
              <text class="card-title">{{ competitorPanel.title }}</text>
            </view>
            <view class="panel-content">
              <section
                v-for="group in competitorPanel.groups"
                :key="group.title"
                class="content-group"
              >
                <text class="group-title">{{ group.title }}</text>
                <view class="ordered-list">
                  <view
                    v-for="(item, index) in group.items"
                    :key="item"
                    class="list-item"
                  >
                    <text>{{ index + 1 }}.</text>
                    <text>{{ item }}</text>
                  </view>
                </view>
              </section>
            </view>
          </article>

          <article class="feedback-card feedback-card--wide">
            <view class="card-head">
              <text class="card-title">{{ streamPanel.title }}</text>
            </view>
            <view class="wide-content">
              <view class="wide-column">
                <section
                  v-for="group in streamPanel.leftGroups"
                  :key="group.title"
                  class="content-group"
                >
                  <text class="group-title">{{ group.title }}</text>
                  <view v-if="group.mode === 'plain'" class="plain-list">
                    <view
                      v-for="item in group.items"
                      :key="item"
                      class="plain-item"
                      >{{ item }}</view
                    >
                  </view>
                  <text v-else class="tag-line">{{
                    group.items.join("、")
                  }}</text>
                </section>
              </view>
              <view class="wide-column">
                <section class="content-group">
                  <text class="group-title">{{
                    streamPanel.alertGroup.title
                  }}</text>
                  <view class="plain-list">
                    <view
                      v-for="item in streamPanel.alertGroup.items"
                      :key="item"
                      class="plain-item"
                      >{{ item }}</view
                    >
                  </view>
                </section>
              </view>
            </view>
          </article>
        </section>
      </template>
    </template>

    <template v-else-if="activeType === 'ecological-partner'">
      <EcologicalPartnerMobile
        v-if="isMobileLayout"
        :cards="partnerCards"
        @back="goHome"
      />
      <template v-else>
        <section class="page-hero partner-hero">
          <text class="board-title">生态伙伴看板</text>
          <text class="title-underline"></text>
        </section>

        <section class="partner-grid">
          <button
            v-for="card in partnerCards"
            :key="card.title"
            class="partner-card"
            :class="{ active: card.active }"
          >
            <view class="partner-image-wrap">
              <image
                class="partner-image"
                :src="card.image"
                :alt="card.title"
                mode="aspectFill"
              />
            </view>
            <text>{{ card.title }}</text>
          </button>
        </section>
      </template>
    </template>

    <StrategyReportModal
      :visible="isReportModalVisible"
      :loading="reportModalLoading"
      :report="activeReportResponse?.report ?? null"
      :next-actions="activeReportResponse?.nextActions ?? []"
      :actions-disabled="reportModalLoading"
      @close="closeReportModal"
      @action="handleReportModalAction"
    />
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { request } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useStrategyChatStore } from "@/stores/strategyChat";
import type {
  BrandStrategyCard,
  BrandStrategyDashboard,
  StrategyDashboardPoint,
  StrategyDashboardReport,
  StrategyDashboardResponse,
  StrategyReportResponse,
} from "@/types/strategy";
import BrandStrategyMobile from "./components/BrandStrategyMobile.vue";
import EcologicalPartnerMobile from "./components/EcologicalPartnerMobile.vue";
import KeyMetricsDesktop from "./components/KeyMetricsDesktop.vue";
import KeyMetricsMobile from "./components/KeyMetricsMobile.vue";
import MarketFeedbackMobile from "./components/MarketFeedbackMobile.vue";
import MarketingCalendarMobile from "./components/MarketingCalendarMobile.vue";
import MarketingOperationsDesktop from "./components/MarketingOperationsDesktop.vue";
import MarketingOperationsMobile from "./components/MarketingOperationsMobile.vue";
import StrategyReportModal from "../home/components/StrategyReportModal.vue";

type BoardType =
  | "brand-strategy"
  | "key-metrics"
  | "marketing-operations"
  | "marketing-calendar"
  | "market-feedback"
  | "ecological-partner";

type Trend = "up" | "down";
type Status = "done" | "doing" | "pending" | "disabled";

type MetricRow = {
  label: string;
  value: string;
  trend: Trend;
};

type FlowNode = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active?: boolean;
  empty?: boolean;
  large?: boolean;
  tone?: string;
  status?: Status;
  icon?: string;
  titleMode?: "vertical";
  rows?: MetricRow[];
  groups?: MetricRow[];
};

type FlowEdge = {
  id: string;
  source: string;
  target: string;
  color?: string;
  muted?: boolean;
};

type CalendarDay = {
  key: string;
  date: number;
  month: "prev" | "current" | "next";
  monthOffset: -1 | 0 | 1;
  muted?: boolean;
  current?: boolean;
  selected?: boolean;
};

const activeType = ref<BoardType>("brand-strategy");
const activeTime = ref("当月");
const activeFeedbackFilter = ref("当 月");
const isMobileLayout = ref(false);
const timeOptions = ["当天", "当月", "当季", "当年"];
const authStore = useAuthStore();
const strategyChatStore = useStrategyChatStore();
const brandDashboardLoading = ref(false);
const brandDashboardError = ref("");
const brandDashboardResponse = ref<StrategyDashboardResponse | null>(null);
const activeReportResponse = ref<StrategyReportResponse | null>(null);
const isReportModalVisible = ref(false);
const reportModalLoading = ref(false);

const isFlowBoard = computed(
  () =>
    activeType.value === "key-metrics" ||
    activeType.value === "marketing-operations"
);

const boardTitles: Record<BoardType, string> = {
  "brand-strategy": "品牌战略看板",
  "key-metrics": "核心指标看板",
  "marketing-operations": "营销运营看板",
  "marketing-calendar": "营销日历看板",
  "market-feedback": "市场反馈看板",
  "ecological-partner": "生态伙伴看板",
};

const brandDashboardView = computed(() => ({
  title: "品牌战略看板",
  subtitle: brandDashboardSubtitle.value,
  icon: "/static/svg/brand-strategy.svg",
}));

const brandDashboardMessage = computed(
  () => brandDashboardResponse.value?.message ?? "",
);

const brandDashboardSubtitle = computed(() => {
  const dashboard = brandDashboardResponse.value?.dashboard;
  const summary = cleanText(dashboard?.summary);

  if (summary) {
    return summary;
  }

  if (brandDashboardResponse.value?.completed === false) {
    return brandDashboardResponse.value.message;
  }

  return "锚定方向，塑造品牌心智";
});

const starIndexes = [0, 1, 2, 3, 4, 5, 6];

const pointDisplayPlan: Array<{ code: string; color: string }> = [
  { code: "M01", color: "#ff4343" },
  { code: "M02", color: "#ff4343" },
  { code: "M03", color: "#ff4343" },
  { code: "M04", color: "#54d830" },
  { code: "M05", color: "#54d830" },
  { code: "M06", color: "#54d830" },
  { code: "M07", color: "#ff8f1f" },
  { code: "M08", color: "#ff8f1f" },
  { code: "M09", color: "#ff8f1f" },
  { code: "M10", color: "#d948ff" },
  { code: "M11", color: "#d948ff" },
  { code: "M15", color: "#1267ff" },
  { code: "M16", color: "#1267ff" },
  { code: "M17", color: "#1267ff" },
];

const reportDisplayPlan = [
  {
    after: "M03",
    reportType: "beidou_declaration",
    title: "北斗宣言",
    titleLines: ["北斗宣言"],
  },
  {
    after: "M06",
    reportType: "strategy_positioning",
    title: "战略定位与品牌承诺图",
    titleLines: ["战略定位", "与品牌承诺图"],
  },
  {
    after: "M09",
    reportType: "advantages_barriers",
    title: "优势、壁垒与信任状体系",
    titleLines: ["优势、壁垒", "与信任状体系"],
  },
  {
    after: "M11",
    reportType: "business_model_panorama",
    title: "商业模式与体验交付全景图",
    titleLines: ["商业模式与", "体验交付全景图"],
  },
  {
    after: "M17",
    reportType: "brand_experience_blueprint",
    title: "品牌引力场与体验蓝图",
    titleLines: ["品牌引力场", "与体验蓝图"],
  },
];

const brandStrategyCards = computed<BrandStrategyCard[]>(() => {
  const dashboard = brandDashboardResponse.value?.dashboard;

  if (!dashboard) {
    return [];
  }

  return buildBrandStrategyCards(dashboard);
});

const statusLegend: Array<{ label: string; type: Status }> = [
  { label: "已完成", type: "done" },
  { label: "进行中", type: "doing" },
  { label: "待开始", type: "pending" },
  { label: "未启用", type: "disabled" },
];

const icon = (name: string) => `/static/marketing-dashboard/${name}.svg`;

const metricNodes: FlowNode[] = [
  {
    id: "company",
    title: "公司战略",
    x: 370,
    y: 36,
    width: 520,
    height: 124,
    large: true,
    titleMode: "vertical",
    groups: [
      { label: "营收", value: "10,000,000", trend: "up" },
      { label: "总客户数", value: "3228", trend: "up" },
      { label: "活跃客户数", value: "880", trend: "up" },
      { label: "已流失客户数", value: "180", trend: "down" },
      { label: "利润", value: "5,000,000", trend: "up" },
      { label: "一次购买客户数", value: "1240", trend: "down" },
      { label: "多次购买客户数", value: "580", trend: "up" },
    ],
  },
  {
    id: "image",
    title: "图文营销",
    x: 50,
    y: 230,
    width: 150,
    height: 150,
    rows: [
      { label: "发布量", value: "12", trend: "down" },
      { label: "阅读量", value: "120000", trend: "up" },
      { label: "互动量", value: "3201", trend: "up" },
      { label: "私域引流数", value: "12", trend: "up" },
    ],
  },
  {
    id: "video",
    title: "短视频营销",
    x: 230,
    y: 230,
    width: 150,
    height: 150,
    rows: [
      { label: "发布量", value: "12", trend: "down" },
      { label: "播放量", value: "1000", trend: "up" },
      { label: "互动量", value: "201", trend: "up" },
      { label: "私域引流数", value: "12", trend: "up" },
    ],
  },
  {
    id: "live",
    title: "直播营销",
    x: 410,
    y: 230,
    width: 150,
    height: 150,
    rows: [
      { label: "直播场次", value: "4", trend: "up" },
      { label: "观看人数", value: "1210", trend: "up" },
      { label: "互动次数", value: "3201", trend: "up" },
      { label: "留资数", value: "240", trend: "down" },
    ],
  },
  {
    id: "phone",
    title: "电话营销",
    x: 590,
    y: 230,
    width: 160,
    height: 150,
    active: true,
    rows: [
      { label: "外呼总量", value: "180", trend: "up" },
      { label: "接通率", value: "60%", trend: "down" },
      { label: "有效沟通数", value: "3201", trend: "up" },
      { label: "加微成功数", value: "12", trend: "down" },
    ],
  },
  {
    id: "store",
    title: "实体店铺",
    x: 770,
    y: 230,
    width: 150,
    height: 150,
    empty: true,
  },
  {
    id: "ecommerce",
    title: "电商销售",
    x: 950,
    y: 230,
    width: 150,
    height: 150,
    empty: true,
  },
  {
    id: "overseas",
    title: "海外独立站",
    x: 1190,
    y: 230,
    width: 150,
    height: 150,
    rows: [
      { label: "访问量", value: "40", trend: "down" },
      { label: "留资数", value: "1210", trend: "up" },
      { label: "私域添加数", value: "321", trend: "up" },
    ],
  },
  {
    id: "private",
    title: "私域营销",
    x: 360,
    y: 430,
    width: 150,
    height: 150,
    rows: [
      { label: "好友总数", value: "45", trend: "up" },
      { label: "新增数", value: "1210", trend: "up" },
      { label: "互动率", value: "31%", trend: "down" },
      { label: "转化率", value: "9.6%", trend: "down" },
    ],
  },
  {
    id: "customer",
    title: "大客户销售",
    x: 900,
    y: 430,
    width: 150,
    height: 150,
    rows: [
      { label: "大客户总数", value: "40", trend: "down" },
      { label: "新增数", value: "1210", trend: "up" },
      { label: "平均变动次数", value: "32", trend: "up" },
      { label: "流失数", value: "22", trend: "down" },
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    x: 1190,
    y: 430,
    width: 150,
    height: 150,
    rows: [
      { label: "联系人总数", value: "40", trend: "down" },
      { label: "新增数", value: "1210", trend: "up" },
      { label: "打开率", value: "32%", trend: "down" },
      { label: "回复率", value: "12%", trend: "up" },
    ],
  },
  {
    id: "analysis",
    title: "营销分析",
    x: 540,
    y: 630,
    width: 280,
    height: 78,
    empty: true,
    tone: "horizontal",
  },
];

const metricEdges: FlowEdge[] = [
  { id: "analysis-company", source: "analysis", target: "company" },
  { id: "company-image", source: "company", target: "image" },
  { id: "company-video", source: "company", target: "video" },
  { id: "company-live", source: "company", target: "live" },
  { id: "company-phone", source: "company", target: "phone" },
  { id: "company-store", source: "company", target: "store" },
  { id: "company-ecommerce", source: "company", target: "ecommerce" },
  { id: "company-overseas", source: "company", target: "overseas" },
  { id: "image-private", source: "image", target: "private" },
  { id: "video-private", source: "video", target: "private" },
  { id: "live-private", source: "live", target: "private" },
  { id: "phone-private", source: "phone", target: "private" },
  { id: "store-customer", source: "store", target: "customer", color: "#d9d9d9", muted: true },
  { id: "ecommerce-customer", source: "ecommerce", target: "customer", color: "#d9d9d9", muted: true },
  { id: "company-customer", source: "company", target: "customer", color: "#d9d9d9", muted: true },
  { id: "phone-analysis", source: "phone", target: "analysis" },
  { id: "private-analysis", source: "private", target: "analysis" },
  { id: "customer-analysis", source: "customer", target: "analysis", color: "#d9d9d9", muted: true },
  { id: "overseas-whatsapp", source: "overseas", target: "whatsapp" },
  { id: "whatsapp-analysis", source: "whatsapp", target: "analysis" },
];

const operationNodes: FlowNode[] = [
  {
    id: "strategy",
    title: "公司战略",
    icon: icon("corporate-strategy"),
    status: "done",
    x: 520,
    y: 52,
    width: 192,
    height: 88,
    large: true,
  },
  {
    id: "visual",
    title: "图文营销",
    icon: icon("visual-marketing"),
    status: "done",
    x: 60,
    y: 198,
    width: 124,
    height: 122,
  },
  {
    id: "shortVideo",
    title: "短视频营销",
    icon: icon("short-video-marketing"),
    status: "done",
    x: 220,
    y: 198,
    width: 124,
    height: 122,
  },
  {
    id: "live",
    title: "直播营销",
    icon: icon("live-streaming-marketing"),
    status: "doing",
    x: 380,
    y: 198,
    width: 124,
    height: 122,
  },
  {
    id: "phone",
    title: "电话营销",
    icon: icon("telemarketing"),
    status: "pending",
    active: true,
    x: 540,
    y: 198,
    width: 124,
    height: 122,
  },
  {
    id: "store",
    title: "实体店铺",
    icon: icon("brick-and-mortar-store"),
    status: "disabled",
    x: 700,
    y: 198,
    width: 124,
    height: 122,
  },
  {
    id: "ecommerce",
    title: "电商销售",
    icon: icon("e-commerce-sales"),
    status: "disabled",
    x: 860,
    y: 198,
    width: 124,
    height: 122,
  },
  {
    id: "overseas",
    title: "海外独立站",
    icon: icon("overseas-independent-station"),
    status: "doing",
    x: 1080,
    y: 198,
    width: 124,
    height: 122,
  },
  {
    id: "private",
    title: "私域营销",
    icon: icon("private-domain-marketing"),
    status: "disabled",
    x: 340,
    y: 360,
    width: 124,
    height: 122,
  },
  {
    id: "keyAccount",
    title: "大客户销售",
    icon: icon("key-account-sales"),
    status: "disabled",
    x: 825,
    y: 360,
    width: 124,
    height: 122,
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    icon: icon("whatsApp"),
    status: "doing",
    x: 1080,
    y: 360,
    width: 124,
    height: 122,
  },
  {
    id: "analysis",
    title: "营销分析",
    icon: icon("marketing-analysis"),
    status: "disabled",
    x: 520,
    y: 528,
    width: 192,
    height: 88,
    large: true,
  },
];

const operationEdges: FlowEdge[] = [
  { id: "analysis-strategy", source: "analysis", target: "strategy" },
  { id: "strategy-visual", source: "strategy", target: "visual" },
  { id: "strategy-shortVideo", source: "strategy", target: "shortVideo" },
  { id: "strategy-live", source: "strategy", target: "live" },
  { id: "strategy-phone", source: "strategy", target: "phone" },
  {
    id: "strategy-store",
    source: "strategy",
    target: "store",
    color: "#d7d7d7",
    muted: true,
  },
  {
    id: "strategy-ecommerce",
    source: "strategy",
    target: "ecommerce",
    color: "#d7d7d7",
    muted: true,
  },
  { id: "strategy-overseas", source: "strategy", target: "overseas" },
  { id: "visual-private", source: "visual", target: "private" },
  { id: "shortVideo-private", source: "shortVideo", target: "private" },
  { id: "live-private", source: "live", target: "private" },
  { id: "phone-private", source: "phone", target: "private" },
  { id: "private-analysis", source: "private", target: "analysis" },
  {
    id: "store-keyAccount",
    source: "store",
    target: "keyAccount",
    color: "#d7d7d7",
    muted: true,
  },
  {
    id: "ecommerce-keyAccount",
    source: "ecommerce",
    target: "keyAccount",
    color: "#d7d7d7",
    muted: true,
  },
  {
    id: "strategy-keyAccount",
    source: "strategy",
    target: "keyAccount",
    color: "#d7d7d7",
    muted: true,
  },
  {
    id: "keyAccount-analysis",
    source: "keyAccount",
    target: "analysis",
    color: "#d7d7d7",
    muted: true,
  },
  { id: "overseas-whatsapp", source: "overseas", target: "whatsapp" },
  { id: "whatsapp-analysis", source: "whatsapp", target: "analysis" },
];

const metricNodeMap = computed(() => toNodeMap(metricNodes));
const operationNodeMap = computed(() => toNodeMap(operationNodes));

type WindowResizeResult = {
  size: {
    windowWidth: number;
    windowHeight: number;
  };
};

function updateMobileLayout(width = uni.getSystemInfoSync().windowWidth) {
  isMobileLayout.value = width <= 760;
}

function handleWindowResize(result: WindowResizeResult) {
  updateMobileLayout(result.size.windowWidth);
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const selectedDate = ref(new Date(2026, 2, 21));
const calendarYear = ref(selectedDate.value.getFullYear());
const calendarMonth = ref(selectedDate.value.getMonth());
const calendarTitle = computed(
  () => `${calendarYear.value} ${monthNames[calendarMonth.value]}`
);
const calendarDays = computed<CalendarDay[]>(() => {
  const firstWeekday = new Date(
    calendarYear.value,
    calendarMonth.value,
    1
  ).getDay();
  const previousMonthLastDate = new Date(
    calendarYear.value,
    calendarMonth.value,
    0
  ).getDate();
  const currentMonthLastDate = new Date(
    calendarYear.value,
    calendarMonth.value + 1,
    0
  ).getDate();
  const days: CalendarDay[] = [];

  for (let index = firstWeekday - 1; index >= 0; index -= 1) {
    const date = previousMonthLastDate - index;
    days.push({
      key: `prev-${date}`,
      date,
      month: "prev",
      monthOffset: -1,
      muted: true,
    });
  }

  for (let date = 1; date <= currentMonthLastDate; date += 1) {
    const isSelected =
      selectedDate.value.getFullYear() === calendarYear.value &&
      selectedDate.value.getMonth() === calendarMonth.value &&
      selectedDate.value.getDate() === date;

    days.push({
      key: `current-${date}`,
      date,
      month: "current",
      monthOffset: 0,
      current: isSelected,
      selected: isSelected,
    });
  }

  const trailingCount = Math.max(42 - days.length, 0);
  for (let date = 1; date <= trailingCount; date += 1) {
    days.push({
      key: `next-${date}`,
      date,
      month: "next",
      monthOffset: 1,
      muted: true,
    });
  }

  return days;
});

const scheduleItems = [
  {
    method: "图文营销",
    platform: "公众号",
    account: "吉星高照",
    title: "相约玉龙雪山看流星雨",
    time: "08 : 25",
    color: "#76da21",
  },
  {
    method: "直播营销",
    platform: "抖音",
    account: "吉星高照官方店",
    title: "来直播间寻找你的吉星",
    time: "16 : 00",
    color: "#39b8f3",
  },
  {
    method: "短视频营销",
    platform: "抖音",
    account: "吉星高照-玄元十四",
    title: "你来自哪颗星星",
    time: "12 : 28",
    color: "#39b8f3",
  },
  {
    method: "独立站营销",
    platform: "网站",
    account: "JIXINGGAOZHAO",
    title: "JIXINGGAOZHAO",
    time: "12 : 28",
    color: "#ffb52f",
    active: true,
  },
  {
    method: "图文营销",
    platform: "公众号",
    account: "吉星高照",
    title: "相约玉龙雪山看流星雨",
    time: "08 : 25",
    color: "#76da21",
  },
  {
    method: "直播营销",
    platform: "抖音",
    account: "吉星高照官方店",
    title: "来直播间寻找你的吉星",
    time: "16 : 00",
    color: "#39b8f3",
  },
  {
    method: "短视频营销",
    platform: "抖音",
    account: "吉星高照-玄元十四",
    title: "你来自哪颗星星",
    time: "12 : 28",
    color: "#39b8f3",
  },
  {
    method: "独立站营销",
    platform: "网站",
    account: "JIXINGGAOZHAO",
    title: "JIXINGGAOZHAO",
    time: "12 : 28",
    color: "#ffb52f",
  },
  {
    method: "直播营销",
    platform: "抖音",
    account: "吉星高照官方店",
    title: "来直播间寻找你的吉星",
    time: "16 : 00",
    color: "#39b8f3",
  },
  {
    method: "短视频营销",
    platform: "抖音",
    account: "吉星高照-玄元十四",
    title: "你来自哪颗星星",
    time: "12 : 28",
    color: "#39b8f3",
  },
  {
    method: "独立站营销",
    platform: "网站",
    account: "JIXINGGAOZHAO",
    title: "JIXINGGAOZHAO",
    time: "12 : 28",
    color: "#ffb52f",
  },
].map((item, index) => ({ ...item, index }));

const feedbackFilters = ["当 周", "当 月"];

const topPanels = [
  {
    title: "品牌战略反馈",
    groups: [
      {
        title: "正面评价",
        items: ["手串很有文化感", "吉星匹配很准，体验神奇", "包装很有档次"],
      },
      {
        title: "负面评价",
        items: ["客服回复太慢", "物流太慢，等了五天", "价格有点贵"],
      },
      {
        summaryTitle: "品牌满意度",
        summaryRows: [
          { label: "品牌满意度：", value: "65%（较上月 ↑ 5%）" },
          { label: "净推荐值NPS：", value: "42（较上周月 ↑ 2）" },
        ],
      },
    ],
  },
  {
    title: "产品反馈",
    groups: [
      {
        title: "产品抱怨",
        items: [
          "手串价格比别家贵不少",
          "琉璃珠容易刮花",
          "包装盒子太简陋，送礼拿不出手",
          "五行珠缺土行，没法配全套",
        ],
      },
      {
        title: "产品需求",
        items: ["希望出木制款手串", "企业定制服务", "增加更多五行珠颜色选择"],
      },
      {
        summaryTitle: "产品满意度",
        summaryRows: [{ label: "产品满意度：", value: "72%（较上月 ↓ 3%）" }],
      },
    ],
  },
  {
    title: "服务反馈",
    groups: [
      {
        title: "服务抱怨",
        items: [
          "客服半天不回消息",
          "售后处理拖了一周",
          "客服对吉星文化不熟悉，问啥都不懂",
          "换货流程太麻烦",
        ],
      },
      {
        title: "服务改进建议",
        items: ["希望有24小时自助查询", "增加售后进度跟踪功能"],
      },
      {
        summaryTitle: "客服满意度",
        summaryRows: [{ label: "客服满意度：", value: "78%（较上月 ↓ 2%）" }],
      },
    ],
  },
];

const competitorPanel = {
  title: "客户反馈竞品",
  groups: [
    {
      title: "客户反馈中的竞品对比",
      items: [
        "甲家便宜多了，但质量不如你们",
        "乙家的包装更好看",
        "丙家的客服响应快，但产品没文化",
      ],
    },
  ],
};

const streamPanel = {
  title: "竞争对手直播间动态",
  leftGroups: [
    {
      title: "开播动态",
      mode: "plain",
      items: ["甲：3场（峰值2000人）", "乙：2场（峰值800人）"],
    },
    {
      title: "弹幕热词",
      mode: "tag",
      items: ["便宜", "质量好", "发货慢", "售后", "包装"],
    },
    {
      title: "用户对竞品评价摘要",
      mode: "plain",
      items: ["正面：性价比高", "负面：容易坏"],
    },
  ],
  alertGroup: {
    title: "预警信息",
    items: [
      "新品预警：甲推出新品“XXX”（黄色预警）",
      "营销预警：乙正在进行5折大促（红色预警）；甲开启“买一送一”活动（黄色预警）",
      "其他威胁：丙直播间观看量一周暴涨300%（待关注）",
    ],
  },
};

const partnerCards = [
  { title: "平台投流", image: "/static/svg/platform-traffic-distribution.svg" },
  { title: "产品拍摄", image: "/static/svg/product-photography.svg" },
  {
    title: "短视频制作",
    image: "/static/svg/short-video-production.svg",
    active: true,
  },
  {
    title: "独立站建设",
    image: "/static/svg/independent-website-construction.svg",
  },
];

async function loadBrandDashboard() {
  brandDashboardLoading.value = true;
  brandDashboardError.value = "";

  try {
    const result = await request<StrategyDashboardResponse>(
      "/strategy/dashboard",
      {
        query: {
          tenantId: authStore.tenantId,
        },
      },
    );

    brandDashboardResponse.value = result;
  } catch (err) {
    brandDashboardError.value = resolveErrorMessage(
      err,
      "读取品牌战略看板失败",
    );
  } finally {
    brandDashboardLoading.value = false;
  }
}

function buildBrandStrategyCards(
  dashboard: BrandStrategyDashboard,
): BrandStrategyCard[] {
  const points = dashboard.sections?.strategicPoints ?? [];
  const pointByCode = new Map(
    points.map((point) => [point.code.toUpperCase(), point]),
  );
  const reportByType = new Map(
    (dashboard.reports ?? []).map((report) => [report.type, report]),
  );
  const cards: BrandStrategyCard[] = [];

  for (const pointPlan of pointDisplayPlan) {
    const point = pointByCode.get(pointPlan.code);
    if (point) {
      cards.push(toPointCard(point, pointPlan.color));
    }

    if (pointPlan.code === "M11") {
      const supportCard = toSupportSystemCard(dashboard);
      if (supportCard) {
        cards.push(supportCard);
      }
    }

    const reportPlan = reportDisplayPlan.find(
      (item) => item.after === pointPlan.code,
    );
    if (reportPlan) {
      cards.push(
        toReportCard(reportPlan, reportByType.get(reportPlan.reportType)),
      );
    }
  }

  return cards;
}

function toPointCard(
  point: StrategyDashboardPoint,
  color: string,
): BrandStrategyCard {
  return {
    type: "text",
    key: point.code,
    title: normalizePointTitle(point.title),
    color,
    lines: toDisplayLines(
      cleanText(point.summary) ||
        cleanText(point.recommendation) ||
        "该战略点已生成，等待进一步完善。",
    ),
  };
}

function toSupportSystemCard(
  dashboard: BrandStrategyDashboard,
): BrandStrategyCard | null {
  const supportSystem = dashboard.sections?.supportSystem;
  if (!supportSystem) {
    return null;
  }

  const summary =
    cleanText(supportSystem.summary) ||
    (supportSystem.points ?? [])
      .map((point) => cleanText(point.summary) || cleanText(point.recommendation))
      .filter(Boolean)
      .join("；");

  return {
    type: "text",
    key: "M12-M14",
    title: cleanText(supportSystem.title) || "支撑体系",
    color: "#d948ff",
    lines: toDisplayLines(summary || "支撑体系已生成，等待进一步完善。"),
  };
}

function toReportCard(
  plan: (typeof reportDisplayPlan)[number],
  report?: StrategyDashboardReport,
): BrandStrategyCard {
  const isGenerated = report?.isGenerated === true;

  return {
    type: "document",
    key: plan.reportType,
    title: cleanText(report?.title) || plan.title,
    titleLines: plan.titleLines,
    reportType: plan.reportType,
    statusText: reportStatusText(report),
    disabled: !isGenerated,
    needsSync: report?.needsSync === true,
  };
}

function reportStatusText(report?: StrategyDashboardReport) {
  if (!report) {
    return "待生成";
  }

  if (report.needsSync) {
    return "需同步";
  }

  if (report.isGenerated) {
    return "查看报告";
  }

  const labels: Record<string, string> = {
    draft: "草稿",
    failed: "生成失败",
    generating: "生成中",
    pending: "待生成",
  };

  return labels[report.status] || "待生成";
}

function normalizePointTitle(value: unknown) {
  return cleanText(value).replace(/^M\d{2}\s*[、.：:\-]?\s*/i, "");
}

function toDisplayLines(value: string) {
  const normalized = value
    .replace(/\s+/g, " ")
    .split(/[。；;]\s*/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sourceLines = normalized.length ? normalized : [value.trim()];

  return sourceLines.slice(0, 4).map((line) => {
    if (line.length <= 22) {
      return line;
    }

    return `${line.slice(0, 21)}...`;
  });
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

function handleBrandCardClick(card: BrandStrategyCard) {
  if (card.type !== "document" || card.disabled || !card.reportType) {
    return;
  }

  void openBoardReport(card.reportType);
}

async function openBoardReport(reportType: string) {
  activeReportResponse.value = null;
  isReportModalVisible.value = true;
  reportModalLoading.value = true;

  try {
    const result = await strategyChatStore.openReport(reportType);
    if (!result) {
      isReportModalVisible.value = false;
      return;
    }

    activeReportResponse.value = result;
    await loadBrandDashboard();
  } catch (err) {
    isReportModalVisible.value = false;
    uni.showToast({
      title: resolveErrorMessage(err, "打开报告失败"),
      icon: "none",
    });
  } finally {
    reportModalLoading.value = false;
  }
}

function closeReportModal() {
  if (!reportModalLoading.value) {
    isReportModalVisible.value = false;
  }
}

async function handleReportModalAction(action: string) {
  if (action === "open_dashboard") {
    closeReportModal();
    return;
  }

  if (action === "sync_reports") {
    const reportType = activeReportResponse.value?.report.type;
    if (reportType) {
      await openBoardReport(reportType);
    }
    return;
  }

  if (action === "rediagnose") {
    closeReportModal();
    goHome();
  }
}

onLoad((query) => {
  authStore.restore();
  updateMobileLayout();

  const type = query?.type;
  if (typeof type === "string" && type in boardTitles) {
    activeType.value = type as BoardType;
  }

  uni.setNavigationBarTitle({
    title: boardTitles[activeType.value],
  });

  if (activeType.value === "brand-strategy") {
    void loadBrandDashboard();
  }
});

onMounted(() => {
  updateMobileLayout();
  uni.onWindowResize(handleWindowResize);
});

onBeforeUnmount(() => {
  uni.offWindowResize(handleWindowResize);
});

function toNodeMap(nodes: FlowNode[]) {
  return nodes.reduce<Record<string, FlowNode>>((result, node) => {
    result[node.id] = node;
    return result;
  }, {});
}

function nodeStyle(node: FlowNode) {
  return `left:${node.x}px;top:${node.y}px;width:${node.width}px;height:${node.height}px;`;
}

function edgeStyle(edge: FlowEdge, nodes: Record<string, FlowNode>) {
  const source = nodes[edge.source];
  const target = nodes[edge.target];

  if (!source || !target) {
    return "";
  }

  const x1 = source.x + source.width / 2;
  const y1 = source.y + source.height;
  const x2 = target.x + target.width / 2;
  const y2 = target.y;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const color = edge.color || "#36c5ff";

  return `left:${x1}px;top:${y1}px;width:${length}px;transform:rotate(${angle}rad);--edge-color:${color};background:${color};`;
}

function metricNodeClass(node: FlowNode) {
  return {
    active: node.active,
    large: node.large,
    empty: node.empty,
    horizontal: node.tone === "horizontal",
  };
}

function operationNodeClass(node: FlowNode) {
  return {
    active: node.active,
    wide: node.large,
    done: node.status === "done",
    doing: node.status === "doing",
    pending: node.status === "pending",
    disabled: node.status === "disabled",
  };
}

function setCalendarCursor(year: number, month: number) {
  const cursor = new Date(year, month, 1);
  calendarYear.value = cursor.getFullYear();
  calendarMonth.value = cursor.getMonth();
}

function shiftMonth(delta: number) {
  setCalendarCursor(calendarYear.value, calendarMonth.value + delta);
}

function shiftYear(delta: number) {
  setCalendarCursor(calendarYear.value + delta, calendarMonth.value);
}

function selectCalendarDay(day: CalendarDay) {
  const target = new Date(
    calendarYear.value,
    calendarMonth.value + day.monthOffset,
    day.date
  );
  selectedDate.value = target;
  setCalendarCursor(target.getFullYear(), target.getMonth());
}

function goHome() {
  uni.reLaunch({
    url: "/pages/home/index",
  });
}
</script>

<style>
.board-page {
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 22px 32px 32px;
  overflow-x: hidden;
  color: #2f333a;
  background: #ffffff;
}

.back-button {
  position: absolute;
  top: 22px;
  left: 32px;
  z-index: 5;
  height: 32px;
  padding: 0 16px;
  color: #1267ff;
  font-size: 14px;
  line-height: 32px;
  background: #eef5ff;
  border: 1px solid #c8ddff;
  border-radius: 999px;
}

.back-button--right {
  top: 34px;
  right: 28px;
  left: auto;
}

.basic-hero,
.page-hero,
.flow-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.basic-hero {
  margin-top: 16px;
}

.page-hero {
  margin-top: 20px;
}

.flow-hero {
  margin-top: 0;
}

.basic-hero-icon {
  width: 92px;
  height: 72px;
  display: block;
}

.board-title,
.flow-title {
  display: block;
  color: #2f333a;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 2px;
  line-height: 1.25;
}

.basic-hero .board-title {
  margin-top: 10px;
}

.flow-title {
  color: #333333;
  letter-spacing: 7px;
}

.title-underline {
  display: block;
  width: 230px;
  height: 4px;
  margin-top: 8px;
  background: #1267ff;
  border-radius: 999px;
}

.calendar-underline {
  width: 240px;
}

.board-subtitle {
  margin-top: 12px;
  color: #657084;
  font-size: 14px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 24px;
  max-width: 920px;
  margin: 56px auto 0;
}

.metric-card {
  min-height: 132px;
  padding: 22px 24px;
  background: #f7faff;
  border: 1px solid #e1ecff;
  border-radius: 18px;
  box-shadow: 0 6px 18px rgb(35 88 164 / 8%);
}

.metric-label,
.metric-caption {
  display: block;
  color: #657084;
  font-size: 13px;
}

.metric-value {
  display: block;
  margin: 12px 0 8px;
  color: #162b4f;
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
}

.brand-dashboard-hero {
  max-width: 920px;
  margin-right: auto;
  margin-left: auto;
}

.brand-dashboard-hero .board-subtitle {
  max-width: 760px;
  line-height: 1.7;
  text-align: center;
}

.brand-refresh-button {
  height: 32px;
  margin-top: 14px;
  padding: 0 16px;
  color: #1267ff;
  font-size: 13px;
  font-weight: 700;
  line-height: 32px;
  background: #eef5ff;
  border: 1px solid #c8ddff;
  border-radius: 999px;
}

.brand-refresh-button::after,
.brand-dashboard-state-button::after {
  border: 0;
}

.brand-dashboard-state {
  display: flex;
  max-width: 760px;
  min-height: 240px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin: 48px auto 0;
  padding: 32px;
  text-align: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
}

.brand-dashboard-state--loading {
  gap: 14px;
  color: #64748b;
  font-size: 15px;
  font-weight: 700;
}

.brand-dashboard-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #d7e6ff;
  border-top-color: #1267ff;
  border-radius: 999px;
  animation: brand-dashboard-spin 0.86s linear infinite;
}

.brand-dashboard-state-title {
  display: block;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.4;
}

.brand-dashboard-state-message {
  display: block;
  max-width: 560px;
  margin-top: 10px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

.brand-dashboard-state-button {
  height: 34px;
  margin-top: 18px;
  padding: 0 18px;
  color: #1267ff;
  font-size: 14px;
  font-weight: 800;
  line-height: 34px;
  background: #eef5ff;
  border: 1px solid #c8ddff;
  border-radius: 999px;
}

.brand-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 22px;
  max-width: 1120px;
  margin: 40px auto 0;
}

.brand-dashboard-card {
  display: flex;
  box-sizing: border-box;
  min-width: 0;
  min-height: 210px;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 24px 16px 18px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #edf2f7;
  border-radius: 18px;
  box-shadow: 0 10px 28px rgb(80 80 80 / 12%);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.brand-dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgb(80 80 80 / 16%);
}

.brand-dashboard-card--document {
  justify-content: center;
  gap: 14px;
  cursor: pointer;
  background: #f8fbff;
  border-color: #dbeafe;
}

.brand-dashboard-card--disabled {
  cursor: default;
  opacity: 0.62;
}

.brand-dashboard-card--disabled:hover {
  transform: none;
  box-shadow: 0 10px 28px rgb(80 80 80 / 12%);
}

.brand-point-code {
  display: block;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
}

.brand-card-title {
  display: block;
  max-width: 100%;
  margin-top: 8px;
  overflow: hidden;
  color: #303236;
  font-size: 22px;
  font-style: italic;
  font-weight: 900;
  line-height: 1.25;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-star-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 28px;
  margin-top: 10px;
}

.brand-star {
  font-size: 14px;
  line-height: 1;
}

.brand-star:nth-child(2),
.brand-star:nth-child(6) {
  font-size: 16px;
}

.brand-star:nth-child(3),
.brand-star:nth-child(5) {
  font-size: 19px;
}

.brand-star:nth-child(4) {
  font-size: 24px;
}

.brand-card-copy {
  display: flex;
  min-height: 82px;
  flex-direction: column;
  justify-content: center;
  margin-top: 12px;
}

.brand-card-copy text {
  display: block;
  overflow: hidden;
  color: #60636a;
  font-size: 14px;
  line-height: 1.7;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-document-icon {
  position: relative;
  display: flex;
  width: 54px;
  height: 54px;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  gap: 6px;
  padding: 12px 10px;
  background: #eef5ff;
  border: 3px solid #1267ff;
  border-radius: 12px;
}

.brand-document-icon text {
  display: block;
  width: 100%;
  height: 3px;
  background: #1267ff;
  border-radius: 999px;
}

.brand-document-icon text:first-child {
  width: 62%;
}

.brand-document-title {
  display: block;
  color: #303236;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.45;
  text-align: center;
}

.brand-document-status {
  display: block;
  padding: 4px 10px;
  color: #1267ff;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.4;
  background: #eef5ff;
  border-radius: 999px;
}

.time-filter,
.status-legend {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
}

.time-filter {
  top: 36px;
  left: 27px;
  gap: 8px;
  color: #8b93a1;
  font-size: 12px;
}

.time-filter button {
  height: 28px;
  padding: 0 16px;
  color: #1f4da8;
  font-size: 12px;
  line-height: 28px;
  background: #ffffff;
  border: 1px solid #1267ff;
  border-radius: 999px;
}

.time-filter button.active {
  color: #ffffff;
  background: #1267ff;
  box-shadow: 0 6px 16px rgb(18 103 255 / 18%);
}

.status-legend {
  top: 34px;
  left: 37px;
  gap: 28px;
  color: #383f4a;
  font-size: 12px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.legend-dot,
.status-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.legend-dot.done,
.status-dot.done {
  background: #52d61d;
}

.legend-dot.doing,
.status-dot.doing {
  background: #38bdf8;
}

.legend-dot.pending,
.status-dot.pending {
  background: #ffb42a;
}

.legend-dot.disabled,
.status-dot.disabled {
  background: #c9c9c9;
}

.flow-board {
  height: calc(100vh - 86px);
  min-height: 620px;
  margin-top: 18px;
  overflow: hidden;
}

.flow-canvas {
  position: relative;
  width: 1260px;
  min-height: 650px;
  margin: 0 auto;
}

.metrics-canvas {
  min-height: 660px;
}

.flow-edge {
  position: absolute;
  z-index: 0;
  height: 2px;
  transform-origin: 0 50%;
  filter: drop-shadow(0 0 2px rgb(54 197 255 / 30%));
}

.flow-edge::after {
  position: absolute;
  top: -4px;
  right: -1px;
  width: 0;
  height: 0;
  content: "";
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 8px solid var(--edge-color);
}

.flow-edge.muted {
  filter: none;
}

.flow-node {
  position: absolute;
  z-index: 1;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #edf0f4;
  border-radius: 13px;
  box-shadow: 0 3px 15px rgb(34 46 68 / 12%);
}

.metric-node {
  display: flex;
  padding: 14px 16px;
}

.metric-node.active,
.operation-node.active {
  border: 2px solid #1267ff;
  box-shadow: 0 4px 16px rgb(18 103 255 / 24%);
}

.metric-node.large {
  align-items: center;
  gap: 18px;
  padding: 16px 22px;
}

.metric-node.horizontal {
  align-items: center;
}

.metric-node.horizontal .metric-node-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 58px;
}

.vertical-title {
  width: 18px;
  color: #20242b;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  writing-mode: vertical-rl;
}

.metric-node-content {
  flex: 1;
  min-width: 0;
}

.node-title {
  display: block;
  margin-bottom: 14px;
  color: #20242b;
  font-size: 14px;
  font-weight: 800;
}

.metric-groups {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 34px;
}

.metric-group,
.metric-row {
  color: #7d8490;
  font-size: 10px;
  white-space: nowrap;
}

.metric-group > text {
  display: block;
  margin-bottom: 5px;
  color: #8b93a1;
}

.metric-row {
  margin-bottom: 6px;
}

.metric-strong {
  color: #252a33;
  font-weight: 800;
}

.trend {
  margin-left: 4px;
  font-weight: 800;
}

.trend.up {
  color: #ff1d2d;
}

.trend.down {
  color: #42c631;
}

.empty-text {
  display: flex;
  height: calc(100% - 25px);
  align-items: center;
  justify-content: center;
  color: #9da5b2;
  font-size: 12px;
}

.operation-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.operation-node.wide {
  flex-direction: row;
  gap: 28px;
}

.operation-node .status-dot {
  position: absolute;
  top: 10px;
  right: 10px;
}

.operation-icon {
  width: 64px;
  height: 64px;
  display: block;
}

.calendar-layout {
  display: grid;
  grid-template-columns: 372px minmax(0, 1fr);
  gap: 34px;
  width: 100%;
  max-width: 1560px;
  margin: 32px auto 0;
}

.calendar-panel {
  align-self: start;
  padding: 34px 40px 42px;
  background: #ffffff;
  border: 1px solid #e9edf4;
  border-radius: 26px;
  box-shadow: 0 3px 12px rgb(29 42 66 / 10%);
}

.calendar-panel-title {
  display: block;
  margin-bottom: 30px;
  color: #2f333a;
  font-size: 18px;
  font-weight: 800;
  text-align: center;
  letter-spacing: 6px;
}

.calendar-picker {
  width: 100%;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 0 32px;
  color: #2f333a;
  font-size: 18px;
  font-weight: 700;
}

.calendar-nav-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calendar-title {
  flex: 1;
  min-width: 0;
  color: #2f333a;
  font-size: 18px;
  font-weight: 800;
  line-height: 38px;
  text-align: center;
  white-space: nowrap;
}

.month-button {
  width: 38px;
  height: 38px;
  color: #363c46;
  font-size: 20px;
  font-weight: 700;
  line-height: 38px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e8ecf3;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgb(36 49 78 / 10%);
}

.weekday-row,
.date-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.weekday-row {
  padding-bottom: 12px;
  border-bottom: 1px solid #edf1f7;
  color: #9eb8ff;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.weekday-row text {
  line-height: 20px;
}

.date-grid {
  padding-top: 16px;
  row-gap: 17px;
}

.date-cell {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  justify-self: center;
  color: #2f333a;
  font-size: 14px;
  line-height: 1;
  text-align: center;
  background: transparent;
  border-radius: 50%;
}

.date-cell text {
  display: block;
  line-height: 40px;
}

.date-cell.muted {
  color: #c5cbd6;
}

.date-cell.current,
.date-cell.selected {
  color: #ffffff;
  background: #2e72ff;
}

.schedule-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.schedule-head,
.schedule-card {
  display: grid;
  grid-template-columns: 1.1fr 0.8fr 1.5fr 2.2fr 0.7fr;
  align-items: center;
}

.schedule-head {
  padding: 0 28px 14px;
  color: #2f333a;
  font-size: 16px;
  font-weight: 800;
}

.schedule-list {
  max-height: 690px;
  padding: 12px;
  overflow: auto;
}

.schedule-card {
  min-height: 56px;
  margin-bottom: 14px;
  padding: 0 28px;
  color: #2f333a;
  font-size: 14px;
  line-height: 1.3;
  text-align: left;
  background: #ffffff;
  border: 1px solid #edf0f4;
  border-radius: 22px;
  box-shadow: 0 3px 12px rgb(29 42 66 / 10%);
}

.schedule-card.active {
  border-color: #2e72ff;
  box-shadow: 0 0 0 1px #2e72ff, 0 8px 24px rgb(46 114 255 / 16%);
}

.method-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.method-dot {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  border-radius: 50%;
}

.time {
  letter-spacing: 1px;
}

.feedback-toolbar {
  position: absolute;
  top: 82px;
  left: 32px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 0;
  color: #858b97;
}

.toolbar-label {
  font-size: 15px;
}

.filter-pill {
  display: inline-flex;
  min-width: 64px;
  height: 32px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  color: #2f333a;
  font-size: 14px;
  line-height: 32px;
  background: #ffffff;
  border: 1px solid #2e72ff;
  border-radius: 999px;
}

.filter-pill.active {
  color: #ffffff;
  background: #2e72ff;
  box-shadow: 0 8px 20px rgb(46 114 255 / 20%);
}

.hero-note {
  margin-top: 10px;
  color: #8f96a3;
  font-size: 14px;
}

.feedback-grid {
  display: grid;
  gap: 26px;
  max-width: 1400px;
  margin-right: auto;
  margin-left: auto;
}

.top-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 32px;
}

.bottom-grid {
  grid-template-columns: 1fr 2fr;
  margin-top: 26px;
}

.feedback-card {
  min-height: 350px;
  padding: 16px 26px 20px;
  background: #ffffff;
  border: 1px solid #e9edf4;
  border-radius: 22px;
  box-shadow: 0 3px 12px rgb(29 42 66 / 10%);
}

.feedback-card--narrow,
.feedback-card--wide {
  min-height: 308px;
}

.card-head {
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid #e4e8ef;
}

.card-title {
  color: #2f333a;
  font-size: 18px;
  font-weight: 800;
}

.panel-content {
  color: #2f333a;
  font-size: 14px;
  line-height: 1.7;
}

.content-group + .content-group {
  margin-top: 14px;
}

.group-title {
  display: block;
  margin-bottom: 6px;
  color: #2f333a;
  font-size: 15px;
  font-weight: 700;
}

.ordered-list,
.plain-list {
  margin: 0;
}

.list-item {
  display: flex;
  gap: 7px;
  margin-bottom: 2px;
  color: #3b404a;
}

.summary {
  margin-top: 4px;
  color: #3b404a;
  line-height: 1.8;
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
}

.summary-label {
  font-weight: 800;
}

.wide-content {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 26px;
}

.wide-column {
  min-width: 0;
}

.plain-item {
  margin-bottom: 4px;
  color: #3b404a;
}

.tag-line {
  color: #3b404a;
  line-height: 1.7;
}

.partner-hero {
  margin-top: 6px;
}

.partner-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 32px;
  max-width: 1180px;
  margin: 60px auto 0;
}

.partner-card {
  box-sizing: border-box;
  display: block;
  width: 100%;
  padding: 12px 12px 18px;
  background: #ffffff;
  border: 1px solid #edf0f4;
  border-radius: 22px;
  box-shadow: 0 2px 10px rgb(32 45 66 / 8%);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.partner-card:hover,
.partner-card.active,
.partner-card:active {
  border-color: #2e72ff;
  box-shadow: 0 0 0 1px #2e72ff, 0 12px 30px rgb(18 103 255 / 14%);
}

.partner-image-wrap {
  width: 100%;
  height: 215px;
  overflow: hidden;
  background: #f6f7f9;
  border-radius: 18px;
}

.partner-image {
  width: 100%;
  height: 100%;
  display: block;
}

.partner-card > text {
  display: block;
  margin-top: 18px;
  color: #333333;
  font-size: 18px;
  font-weight: 800;
  text-align: center;
}

@keyframes brand-dashboard-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .board-page {
    padding: 18px 14px 28px;
  }

  .back-button,
  .back-button--right {
    position: relative;
    top: auto;
    right: auto;
    left: auto;
    margin-bottom: 12px;
  }

  .board-title,
  .flow-title {
    font-size: 22px;
    letter-spacing: 2px;
  }

  .metric-grid,
  .brand-dashboard-grid,
  .top-grid,
  .bottom-grid,
  .calendar-layout,
  .partner-grid,
  .wide-content {
    grid-template-columns: 1fr;
  }

  .brand-dashboard-grid {
    margin-top: 24px;
  }

  .time-filter,
  .status-legend {
    position: static;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .feedback-toolbar {
    position: static;
    flex-wrap: wrap;
    margin: 0 0 12px;
  }

  .status-legend {
    gap: 12px;
  }

  .flow-board {
    height: 70vh;
    min-height: 500px;
  }

  .flow-canvas {
    margin: 0;
  }

  .schedule-head {
    display: none;
  }

  .schedule-card {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 14px 18px;
  }

  .feedback-hero {
    margin-top: 8px;
  }
}
</style>
