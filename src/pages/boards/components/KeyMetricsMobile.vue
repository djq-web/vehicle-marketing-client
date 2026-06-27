<template>
  <view class="key-metrics-mobile" :style="pageStyle">
    <view class="mobile-board-nav">
      <view class="mobile-board-nav-content">
        <button class="mobile-back" aria-label="返回首页" @click="emit('back')">
          ×
        </button>
        <text class="mobile-title">核心指标</text>
      </view>
    </view>

    <view class="mobile-time-tabs">
      <button
        v-for="item in timeOptions"
        :key="item"
        class="mobile-time-tab"
        :class="{ active: item === activeTime }"
        @click="emit('update:activeTime', item)"
      >
        {{ item }}
      </button>
    </view>

    <scroll-view class="mobile-metrics-scroll" scroll-y>
      <view class="mobile-metrics-content">
        <view v-if="companyCard" class="mobile-company-card">
          <text class="mobile-card-title">{{ companyCard.title }}</text>
          <view class="company-metric-grid">
            <view
              v-for="row in companyRows"
              :key="row.label"
              class="mobile-metric-row"
            >
              <text class="metric-label">{{ row.label }}</text>
              <view class="metric-value-row">
                <text class="metric-value">{{ row.value }}</text>
                <text class="trend" :class="row.trend">
                  {{ row.trend === "up" ? "↑" : "↓" }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <view class="mobile-card-grid">
          <view
            v-for="card in metricCards"
            :key="card.id"
            class="mobile-metric-card"
            :class="{ empty: card.empty, wide: card.id === 'analysis' }"
          >
            <text class="mobile-card-title">{{ card.title }}</text>
            <text v-if="card.empty" class="mobile-empty-text">暂无数据</text>
            <view v-else class="mobile-card-rows">
              <view
                v-for="row in card.rows"
                :key="`${card.id}-${row.label}`"
                class="mobile-card-row"
              >
                <text class="metric-label">{{ row.label }}：</text>
                <text class="metric-value">{{ row.value }}</text>
                <text class="trend" :class="row.trend">
                  {{ row.trend === "up" ? "↑" : "↓" }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { PropType } from "vue";

type Trend = "up" | "down";

type MetricRow = {
  label: string;
  value: string;
  trend: Trend;
};

type FlowNode = {
  id: string;
  title: string;
  groups?: MetricRow[];
  rows?: MetricRow[];
  empty?: boolean;
};

type MobileMetricCard = {
  id: string;
  title: string;
  rows: MetricRow[];
  empty?: boolean;
};

const props = defineProps({
  nodes: {
    type: Array as PropType<FlowNode[]>,
    required: true,
  },
  timeOptions: {
    type: Array as PropType<string[]>,
    required: true,
  },
  activeTime: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  back: [];
  "update:activeTime": [value: string];
}>();

const mobileStatusBarHeight = ref(0);
const mobileNavHeight = ref(56);
const mobileNavContentHeight = ref(44);
const mobileNavTopOffset = ref(0);
const mobileRightSafeWidth = ref(14);

const pageStyle = computed(
  () =>
    ({
      "--mobile-status-height": `${mobileStatusBarHeight.value}px`,
      "--mobile-nav-height": `${mobileNavHeight.value}px`,
      "--mobile-nav-content-height": `${mobileNavContentHeight.value}px`,
      "--mobile-nav-top-offset": `${mobileNavTopOffset.value}px`,
      "--mobile-right-safe-width": `${mobileRightSafeWidth.value}px`,
    }) as Record<string, string>,
);

const nodeMap = computed(() =>
  props.nodes.reduce<Record<string, FlowNode>>((result, node) => {
    result[node.id] = node;
    return result;
  }, {}),
);

const companyCard = computed(() => nodeMap.value.company ?? null);
const companyRows = computed(() => {
  const rows = companyCard.value?.groups ?? [];
  const order = [
    "营收",
    "利润",
    "总客户数",
    "活跃客户数",
    "一次购买客户数",
    "多次购买客户数",
    "已流失客户数",
  ];

  return [...rows].sort(
    (left, right) => order.indexOf(left.label) - order.indexOf(right.label),
  );
});

const metricCards = computed<MobileMetricCard[]>(() => {
  const order = [
    "image",
    "video",
    "live",
    "phone",
    "store",
    "ecommerce",
    "private",
    "customer",
    "overseas",
    "whatsapp",
    "analysis",
  ];

  return order
    .map((id) => nodeMap.value[id])
    .filter((node): node is FlowNode => Boolean(node))
    .map((node) => ({
      id: node.id,
      title: node.title,
      rows: mobileRows(node),
      empty: node.empty || mobileRows(node).length === 0,
    }));
});

onMounted(() => {
  initMobileChrome();
});

function mobileRows(node: FlowNode): MetricRow[] {
  const overrides: Record<string, MetricRow[]> = {
    customer: [
      { label: "大客户总数", value: "40", trend: "down" },
      { label: "新增数", value: "1210", trend: "up" },
      { label: "平均更进次数", value: "32", trend: "up" },
      { label: "流失数", value: "22", trend: "down" },
    ],
    overseas: [
      { label: "访问量", value: "45", trend: "up" },
      { label: "新增数", value: "1210", trend: "up" },
      { label: "互动率", value: "31%", trend: "down" },
      { label: "转化率", value: "9.6%", trend: "down" },
    ],
    whatsapp: [
      { label: "联系人总数", value: "40", trend: "down" },
      { label: "新增数", value: "1210", trend: "up" },
      { label: "平均更进次数", value: "32", trend: "up" },
      { label: "流失数", value: "22", trend: "down" },
    ],
  };

  return overrides[node.id] ?? node.rows ?? [];
}

function initMobileChrome() {
  const systemInfo = uni.getSystemInfoSync();
  const statusBarHeight = systemInfo.statusBarHeight || 0;

  mobileStatusBarHeight.value = statusBarHeight;
  mobileNavContentHeight.value = 44;
  mobileNavTopOffset.value = 0;
  mobileNavHeight.value = statusBarHeight + 56;
  mobileRightSafeWidth.value = 14;

  // #ifdef MP-WEIXIN
  const menuButton = uni.getMenuButtonBoundingClientRect();
  const topGap = Math.max(0, menuButton.top - statusBarHeight);
  const bottomGap = topGap || 6;

  mobileNavContentHeight.value = menuButton.height;
  mobileNavTopOffset.value = topGap;
  mobileNavHeight.value = menuButton.bottom + bottomGap;
  mobileRightSafeWidth.value =
    Math.max(88, systemInfo.windowWidth - menuButton.left) + 12;
  // #endif
}
</script>

<style scoped>
.key-metrics-mobile {
  position: fixed;
  inset: 0;
  z-index: 20;
  overflow: hidden;
  color: #303236;
  background: #ffffff;
}

.mobile-board-nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 30;
  box-sizing: border-box;
  height: var(--mobile-nav-height);
  padding-top: calc(var(--mobile-status-height) + var(--mobile-nav-top-offset));
  background: #ffffff;
}

.mobile-board-nav-content {
  position: relative;
  display: flex;
  height: var(--mobile-nav-content-height);
  align-items: center;
  padding: 0 var(--mobile-right-safe-width) 0 22px;
}

.mobile-back {
  position: absolute;
  top: 50%;
  right: var(--mobile-right-safe-width);
  z-index: 2;
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  color: #2f333a;
  font-size: 28px;
  font-weight: 300;
  line-height: 1;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  transform: translateY(-50%);
}

.mobile-back::before {
  display: none;
  content: none;
}

.mobile-back::after {
  border: 0;
}

.mobile-title {
  position: absolute;
  right: calc(var(--mobile-right-safe-width) + 44px);
  left: 58px;
  overflow: hidden;
  color: #000000;
  font-size: 18px;
  font-weight: 800;
  line-height: var(--mobile-nav-content-height);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-time-tabs {
  position: fixed;
  top: var(--mobile-nav-height);
  right: 0;
  left: 0;
  z-index: 28;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  box-sizing: border-box;
  height: 74px;
  padding: 18px 26px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgb(70 70 70 / 10%);
}

.mobile-time-tab {
  height: 38px;
  margin: 0;
  padding: 0;
  color: #303236;
  font-size: 15px;
  line-height: 36px;
  text-align: center;
  background: #ffffff;
  border: 1.5px solid #1267ff;
  border-radius: 999px;
  box-shadow: none;
}

.mobile-time-tab::after {
  border: 0;
}

.mobile-time-tab.active {
  color: #ffffff;
  font-weight: 800;
  background: #1267ff;
  box-shadow: 0 8px 18px rgb(18 103 255 / 20%);
}

.mobile-metrics-scroll {
  box-sizing: border-box;
  height: 100vh;
  height: 100dvh;
  padding-top: calc(var(--mobile-nav-height) + 74px);
}

.mobile-metrics-content {
  box-sizing: border-box;
  min-height: 100%;
  padding: 24px 18px 28px;
}

.mobile-company-card,
.mobile-metric-card {
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 8px 22px rgb(80 80 80 / 16%);
}

.mobile-company-card {
  min-height: 352px;
  padding: 26px 32px 24px;
}

.mobile-card-title {
  display: block;
  color: #303236;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.3;
  text-align: center;
}

.company-metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 30px 48px;
  margin-top: 34px;
}

.mobile-metric-row {
  min-width: 0;
}

.metric-label {
  display: block;
  color: #989898;
  font-size: 14px;
  line-height: 1.35;
}

.metric-value-row,
.mobile-card-row {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 3px;
  margin-top: 6px;
}

.metric-value {
  color: #303236;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.1;
}

.trend {
  font-size: 16px;
  font-weight: 900;
  line-height: 1;
}

.trend.up {
  color: #ff2424;
}

.trend.down {
  color: #43e129;
}

.mobile-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 14px;
  margin-top: 18px;
}

.mobile-metric-card {
  min-height: 172px;
  padding: 24px 18px 18px;
}

.mobile-metric-card.wide {
  grid-column: span 1;
}

.mobile-card-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 22px;
}

.mobile-card-row {
  margin-top: 0;
}

.mobile-card-row .metric-label {
  flex: 0 0 auto;
  font-size: 13px;
}

.mobile-card-row .metric-value {
  font-size: 14px;
}

.mobile-card-row .trend {
  font-size: 14px;
}

.mobile-empty-text {
  display: block;
  margin-top: 48px;
  color: #a0a0a0;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
}
</style>
