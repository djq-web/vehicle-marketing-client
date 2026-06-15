<template>
  <view class="feedback-mobile" :style="pageStyle">
    <view class="mobile-board-nav">
      <view class="mobile-board-nav-content">
        <button class="mobile-back" aria-label="返回首页" @click="emit('back')">
          ×
        </button>
        <text class="mobile-title">市场反馈</text>
      </view>
    </view>

    <view class="mobile-feedback-tabs">
      <button
        v-for="item in filters"
        :key="item"
        class="mobile-feedback-tab"
        :class="{ active: item === activeFilter }"
        @click="emit('update:activeFilter', item)"
      >
        {{ displayFilter(item) }}
      </button>
    </view>

    <scroll-view class="feedback-scroll" scroll-y>
      <view class="feedback-content">
        <view v-for="panel in topPanels" :key="panel.title" class="feedback-mobile-card">
          <text class="feedback-card-title">{{ panel.title }}</text>
          <view class="feedback-card-line"></view>
          <view class="feedback-groups">
            <view
              v-for="group in panel.groups"
              :key="group.title || group.summaryTitle"
              class="feedback-group"
            >
              <text v-if="group.title" class="feedback-group-title">
                {{ group.title }}
              </text>
              <view v-if="group.items?.length" class="ordered-list">
                <view v-for="(item, index) in group.items" :key="item" class="ordered-item">
                  <text>{{ index + 1 }}.</text>
                  <text>{{ item }}</text>
                </view>
              </view>
              <view v-if="group.summaryRows" class="summary-list">
                <view
                  v-for="row in group.summaryRows"
                  :key="row.label"
                  class="summary-row"
                >
                  <text>{{ row.label }}</text>
                  <text>{{ row.value }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="feedback-mobile-card">
          <text class="feedback-card-title">{{ competitorPanel.title }}</text>
          <view class="feedback-card-line"></view>
          <view
            v-for="group in competitorPanel.groups"
            :key="group.title"
            class="feedback-group"
          >
            <text class="feedback-group-title">{{ group.title }}</text>
            <view class="ordered-list">
              <view v-for="(item, index) in group.items" :key="item" class="ordered-item">
                <text>{{ index + 1 }}.</text>
                <text>{{ item }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="feedback-mobile-card stream-card">
          <text class="feedback-card-title">{{ streamPanel.title }}</text>
          <view class="feedback-card-line"></view>
          <view
            v-for="group in streamPanel.leftGroups"
            :key="group.title"
            class="feedback-group"
          >
            <text class="feedback-group-title">{{ group.title }}</text>
            <view v-if="group.mode === 'plain'" class="plain-list">
              <text v-for="item in group.items" :key="item">{{ item }}</text>
            </view>
            <text v-else class="tag-line">{{ group.items.join("、") }}</text>
          </view>
          <view class="feedback-group">
            <text class="feedback-group-title">{{ streamPanel.alertGroup.title }}</text>
            <view class="plain-list">
              <text v-for="item in streamPanel.alertGroup.items" :key="item">
                {{ item }}
              </text>
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

type SummaryRow = {
  label: string;
  value: string;
};

type FeedbackGroup = {
  title?: string;
  summaryTitle?: string;
  items?: string[];
  summaryRows?: SummaryRow[];
};

type FeedbackPanel = {
  title: string;
  groups: FeedbackGroup[];
};

type CompetitorPanel = {
  title: string;
  groups: Array<{
    title: string;
    items: string[];
  }>;
};

type StreamGroup = {
  title: string;
  mode: string;
  items: string[];
};

type StreamPanel = {
  title: string;
  leftGroups: StreamGroup[];
  alertGroup: {
    title: string;
    items: string[];
  };
};

defineProps({
  filters: {
    type: Array as PropType<string[]>,
    required: true,
  },
  activeFilter: {
    type: String,
    required: true,
  },
  topPanels: {
    type: Array as PropType<FeedbackPanel[]>,
    required: true,
  },
  competitorPanel: {
    type: Object as PropType<CompetitorPanel>,
    required: true,
  },
  streamPanel: {
    type: Object as PropType<StreamPanel>,
    required: true,
  },
});

const emit = defineEmits<{
  back: [];
  "update:activeFilter": [value: string];
}>();

const mobileStatusBarHeight = ref(0);
const mobileNavHeight = ref(56);
const mobileNavContentHeight = ref(44);
const mobileRightSafeWidth = ref(14);

const pageStyle = computed(
  () =>
    ({
      "--mobile-status-height": `${mobileStatusBarHeight.value}px`,
      "--mobile-nav-height": `${mobileNavHeight.value}px`,
      "--mobile-nav-content-height": `${mobileNavContentHeight.value}px`,
      "--mobile-right-safe-width": `${mobileRightSafeWidth.value}px`,
    }) as Record<string, string>,
);

onMounted(() => {
  initMobileChrome();
});

function displayFilter(value: string) {
  return value.replace(/\s+/g, "");
}

function initMobileChrome() {
  const systemInfo = uni.getSystemInfoSync();
  const statusBarHeight = systemInfo.statusBarHeight || 0;

  mobileStatusBarHeight.value = statusBarHeight;
  mobileNavContentHeight.value = 44;
  mobileNavHeight.value = statusBarHeight + 56;
  mobileRightSafeWidth.value = 14;

  // #ifdef MP-WEIXIN
  const menuButton = uni.getMenuButtonBoundingClientRect();
  const topGap = Math.max(0, menuButton.top - statusBarHeight);
  const bottomGap = topGap || 6;

  mobileNavContentHeight.value = menuButton.height;
  mobileNavHeight.value = menuButton.bottom + bottomGap;
  mobileRightSafeWidth.value =
    Math.max(88, systemInfo.windowWidth - menuButton.left) + 12;
  // #endif
}
</script>

<style scoped>
.feedback-mobile {
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
  padding-top: var(--mobile-status-height);
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

.mobile-feedback-tabs {
  position: fixed;
  top: var(--mobile-nav-height);
  right: 0;
  left: 0;
  z-index: 28;
  display: flex;
  height: 78px;
  align-items: center;
  gap: 20px;
  box-sizing: border-box;
  padding: 18px 28px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgb(70 70 70 / 10%);
}

.mobile-feedback-tab {
  width: 74px;
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

.mobile-feedback-tab::after {
  border: 0;
}

.mobile-feedback-tab.active {
  color: #ffffff;
  font-weight: 800;
  background: #1267ff;
  box-shadow: 0 8px 18px rgb(18 103 255 / 20%);
}

.feedback-scroll {
  box-sizing: border-box;
  height: 100vh;
  height: 100dvh;
  padding-top: calc(var(--mobile-nav-height) + 78px);
}

.feedback-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
  min-height: 100%;
  padding: 24px 24px 30px;
}

.feedback-mobile-card {
  box-sizing: border-box;
  padding: 24px 26px 26px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 8px 22px rgb(80 80 80 / 16%);
}

.feedback-card-title {
  display: block;
  color: #303236;
  font-size: 17px;
  font-weight: 900;
  line-height: 1.3;
}

.feedback-card-line {
  height: 1px;
  margin: 12px 0 16px;
  background: #e8e8e8;
}

.feedback-groups,
.feedback-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feedback-group + .feedback-group {
  margin-top: 12px;
}

.feedback-group-title {
  color: #303236;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.35;
}

.ordered-list,
.plain-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ordered-item {
  display: flex;
  gap: 7px;
  color: #303236;
  font-size: 14px;
  line-height: 1.45;
}

.ordered-item text:first-child {
  width: 18px;
  flex: 0 0 18px;
  text-align: right;
}

.ordered-item text:last-child {
  min-width: 0;
  flex: 1;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 6px;
}

.summary-row {
  display: flex;
  gap: 6px;
  color: #303236;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.45;
}

.summary-row text:first-child {
  font-weight: 900;
}

.plain-list text,
.tag-line {
  color: #303236;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.stream-card {
  padding-bottom: 28px;
}
</style>
