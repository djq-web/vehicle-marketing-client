<template>
  <view class="calendar-mobile" :style="pageStyle">
    <view class="mobile-board-nav">
      <view class="mobile-board-nav-content">
        <button class="mobile-back" aria-label="返回首页" @click="emit('back')">
          ×
        </button>
        <text class="mobile-title">营销日历</text>
      </view>
    </view>

    <view class="mobile-date-bar">
      <button class="date-pill">{{ displayDate }}</button>
      <button class="next-day" @click="shiftDay(1)"></button>
    </view>

    <scroll-view class="calendar-scroll" scroll-y>
      <view class="calendar-content">
        <view
          v-for="item in items"
          :key="`${item.account}-${item.title}-${item.time}-${item.index}`"
          class="schedule-mobile-card"
        >
          <text class="schedule-dot" :style="`background:${item.color}`"></text>
          <view class="schedule-rows">
            <view
              v-for="row in scheduleRows(item)"
              :key="row.label"
              class="schedule-row"
            >
              <text class="schedule-label">{{ row.label }}</text>
              <text class="schedule-value">{{ row.value }}</text>
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

type ScheduleItem = {
  method: string;
  platform: string;
  account: string;
  title: string;
  time: string;
  color: string;
  index: number;
};

const props = defineProps({
  items: {
    type: Array as PropType<ScheduleItem[]>,
    required: true,
  },
});

const emit = defineEmits<{
  back: [];
}>();

const mobileStatusBarHeight = ref(0);
const mobileNavHeight = ref(56);
const mobileNavContentHeight = ref(44);
const mobileRightSafeWidth = ref(14);
const selectedDate = ref(new Date(2026, 4, 20));

const pageStyle = computed(
  () =>
    ({
      "--mobile-status-height": `${mobileStatusBarHeight.value}px`,
      "--mobile-nav-height": `${mobileNavHeight.value}px`,
      "--mobile-nav-content-height": `${mobileNavContentHeight.value}px`,
      "--mobile-right-safe-width": `${mobileRightSafeWidth.value}px`,
    }) as Record<string, string>,
);
const displayDate = computed(() => {
  const year = selectedDate.value.getFullYear();
  const month = selectedDate.value.getMonth() + 1;
  const day = selectedDate.value.getDate();

  return `${year}年${month}月${day}日`;
});

onMounted(() => {
  initMobileChrome();
});

function shiftDay(delta: number) {
  selectedDate.value = new Date(
    selectedDate.value.getFullYear(),
    selectedDate.value.getMonth(),
    selectedDate.value.getDate() + delta,
  );
}

function scheduleRows(item: ScheduleItem) {
  return [
    { label: "营销方式：", value: item.method },
    { label: "平　　台：", value: item.platform },
    { label: "账　　号：", value: item.account },
    { label: "主　　题：", value: item.title },
    { label: "启动时间：", value: item.time },
  ];
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
.calendar-mobile {
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

.mobile-date-bar {
  position: fixed;
  top: var(--mobile-nav-height);
  right: 0;
  left: 0;
  z-index: 28;
  display: flex;
  height: 86px;
  align-items: center;
  gap: 14px;
  box-sizing: border-box;
  padding: 18px 40px 20px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgb(70 70 70 / 10%);
}

.date-pill {
  width: 168px;
  height: 36px;
  margin: 0;
  padding: 0;
  color: #303236;
  font-size: 16px;
  line-height: 34px;
  letter-spacing: 3px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 999px;
  box-shadow: none;
}

.date-pill::after,
.next-day::after {
  border: 0;
}

.next-day {
  position: relative;
  width: 42px;
  height: 42px;
  margin: 0;
  padding: 0;
  background: #f4f4f4;
  border: 1px solid #dedede;
  border-radius: 50%;
  box-shadow: none;
}

.next-day::before {
  position: absolute;
  top: 13px;
  left: 12px;
  width: 12px;
  height: 12px;
  content: "";
  border-top: 2px solid #303236;
  border-right: 2px solid #303236;
  transform: rotate(45deg);
}

.calendar-scroll {
  box-sizing: border-box;
  height: 100vh;
  height: 100dvh;
  padding-top: calc(var(--mobile-nav-height) + 86px);
}

.calendar-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
  min-height: 100%;
  padding: 24px 28px 30px;
}

.schedule-mobile-card {
  position: relative;
  box-sizing: border-box;
  min-height: 172px;
  padding: 30px 30px 26px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 8px 22px rgb(80 80 80 / 16%);
}

.schedule-dot {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.schedule-rows {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.schedule-row {
  display: flex;
  min-width: 0;
  align-items: baseline;
}

.schedule-label {
  width: 92px;
  flex: 0 0 92px;
  color: #9b9b9b;
  font-size: 14px;
  line-height: 1.35;
}

.schedule-value {
  min-width: 0;
  flex: 1;
  color: #303236;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
  word-break: break-word;
}
</style>
