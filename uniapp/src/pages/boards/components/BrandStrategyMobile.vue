<template>
  <view class="brand-strategy-mobile" :style="pageStyle">
    <view class="mobile-board-nav">
      <view class="mobile-board-nav-content">
        <button class="mobile-back" @click="emit('back')"></button>
        <text class="mobile-title">品牌战略</text>
      </view>
    </view>

    <scroll-view class="strategy-scroll" scroll-y>
      <view v-if="loading" class="strategy-state">
        <view class="state-spinner"></view>
        <text class="state-title">正在读取品牌战略看板</text>
        <text class="state-description">请稍候，系统正在同步最新诊断结果。</text>
      </view>

      <view v-else-if="error" class="strategy-state">
        <text class="state-title">看板暂时无法打开</text>
        <text class="state-description">{{ error }}</text>
        <button class="state-button" @click="emit('refresh')">重新加载</button>
      </view>

      <view v-else-if="!cards.length" class="strategy-state">
        <text class="state-title">暂无品牌战略看板</text>
        <text class="state-description">{{
          message || "完成战略诊断后，这里会展示品牌战略看板。"
        }}</text>
        <button class="state-button" @click="emit('refresh')">刷新看板</button>
      </view>

      <view v-else class="strategy-content">
        <view
          v-for="card in cards"
          :key="card.key"
          class="strategy-card"
          :class="{
            'strategy-card--document': card.type === 'document',
            'strategy-card--disabled': card.type === 'document' && card.disabled,
          }"
          @click="handleCardClick(card)"
        >
          <template v-if="card.type === 'document'">
            <view class="document-icon" aria-hidden="true">
              <view class="document-sheet"></view>
              <view class="document-line document-line--short"></view>
              <view class="document-line"></view>
              <view class="document-line document-line--long"></view>
            </view>
            <view class="document-title">
              <text v-for="line in card.titleLines" :key="line">{{ line }}</text>
            </view>
            <text v-if="card.statusText" class="document-status">{{
              card.statusText
            }}</text>
          </template>

          <template v-else>
            <text class="strategy-card-title">{{ card.title }}</text>
            <view class="star-row">
              <text
                v-for="index in starIndexes"
                :key="`${card.title}-${index}`"
                class="star"
                :class="`star-${index}`"
                :style="`color:${card.color}`"
              >
                ★
              </text>
            </view>
            <view class="strategy-copy">
              <text v-for="line in card.lines" :key="line">{{ line }}</text>
            </view>
          </template>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { BrandStrategyCard } from "@/types/strategy";

const props = withDefaults(
  defineProps<{
    cards?: BrandStrategyCard[];
    loading?: boolean;
    error?: string;
    message?: string;
  }>(),
  {
    cards: () => [],
    loading: false,
    error: "",
    message: "",
  },
);

const emit = defineEmits<{
  back: [];
  refresh: [];
  report: [reportType: string];
}>();

const starIndexes = [0, 1, 2, 3, 4, 5, 6];
const mobileStatusBarHeight = ref(0);
const mobileNavHeight = ref(56);
const mobileNavContentHeight = ref(44);
const mobileRightSafeWidth = ref(58);

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

function handleCardClick(card: BrandStrategyCard) {
  if (card.type !== "document" || card.disabled || !card.reportType) {
    return;
  }

  emit("report", card.reportType);
}

function initMobileChrome() {
  const systemInfo = uni.getSystemInfoSync();
  const statusBarHeight = systemInfo.statusBarHeight || 0;

  mobileStatusBarHeight.value = statusBarHeight;
  mobileNavContentHeight.value = 44;
  mobileNavHeight.value = statusBarHeight + 56;
  mobileRightSafeWidth.value = 58;

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
.brand-strategy-mobile {
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
  box-shadow: 0 8rpx 24rpx rgb(70 70 70 / 8%);
}

.mobile-board-nav-content {
  position: relative;
  display: flex;
  height: var(--mobile-nav-content-height);
  align-items: center;
  padding: 0 var(--mobile-right-safe-width) 0 44rpx;
}

.mobile-back {
  position: relative;
  z-index: 2;
  width: 68rpx;
  height: 68rpx;
  margin: 0;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.mobile-back::before {
  position: absolute;
  top: 18rpx;
  left: 12rpx;
  width: 28rpx;
  height: 28rpx;
  content: "";
  border-bottom: 4rpx solid #2f333a;
  border-left: 4rpx solid #2f333a;
  transform: rotate(45deg);
}

.mobile-back::after {
  border: 0;
}

.mobile-title {
  position: absolute;
  right: var(--mobile-right-safe-width);
  left: 116rpx;
  overflow: hidden;
  color: #000000;
  font-size: 36rpx;
  font-weight: 800;
  line-height: var(--mobile-nav-content-height);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.strategy-scroll {
  box-sizing: border-box;
  height: 100vh;
  height: 100dvh;
  padding-top: var(--mobile-nav-height);
}

.strategy-state {
  display: flex;
  box-sizing: border-box;
  min-height: calc(100vh - var(--mobile-nav-height));
  min-height: calc(100dvh - var(--mobile-nav-height));
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56rpx;
  text-align: center;
}

.state-spinner {
  width: 44rpx;
  height: 44rpx;
  margin-bottom: 28rpx;
  border: 5rpx solid #d7e6ff;
  border-top-color: #1267ff;
  border-radius: 999rpx;
  animation: state-spin 0.86s linear infinite;
}

.state-title {
  color: #111827;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1.35;
}

.state-description {
  max-width: 560rpx;
  margin-top: 16rpx;
  color: #64748b;
  font-size: 27rpx;
  line-height: 1.7;
}

.state-button {
  height: 76rpx;
  margin-top: 28rpx;
  padding: 0 34rpx;
  color: #1267ff;
  font-size: 27rpx;
  font-weight: 800;
  line-height: 76rpx;
  background: #eef5ff;
  border: 1px solid #c8ddff;
  border-radius: 999rpx;
}

.state-button::after {
  border: 0;
}

.strategy-content {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28rpx 28rpx;
  box-sizing: border-box;
  min-height: 100%;
  padding: 36rpx 52rpx 42rpx;
}

.strategy-card {
  box-sizing: border-box;
  display: flex;
  min-width: 0;
  min-height: 300rpx;
  flex-direction: column;
  align-items: center;
  padding: 36rpx 18rpx 24rpx;
  overflow: hidden;
  background: #ffffff;
  border-radius: 28rpx;
  box-shadow: 0 10rpx 28rpx rgb(80 80 80 / 14%);
}

.strategy-card-title {
  display: block;
  width: 100%;
  overflow: hidden;
  color: #303236;
  font-size: 34rpx;
  font-style: italic;
  font-weight: 900;
  line-height: 1.2;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.star-row {
  display: flex;
  width: 100%;
  height: 34rpx;
  align-items: center;
  justify-content: center;
  gap: 7rpx;
  margin-top: 14rpx;
  line-height: 1;
}

.star {
  display: block;
  font-size: 20rpx;
  line-height: 1;
}

.star-1,
.star-5 {
  font-size: 24rpx;
}

.star-2,
.star-4 {
  font-size: 29rpx;
}

.star-3 {
  font-size: 38rpx;
}

.star-0,
.star-6 {
  align-self: flex-start;
  margin-top: 1rpx;
}

.star-1,
.star-5 {
  align-self: flex-start;
  margin-top: 9rpx;
}

.star-2,
.star-4 {
  align-self: center;
  margin-top: 14rpx;
}

.star-3 {
  align-self: flex-end;
}

.strategy-copy {
  display: flex;
  min-height: 118rpx;
  flex-direction: column;
  justify-content: center;
  margin-top: 18rpx;
}

.strategy-copy text {
  display: block;
  overflow: hidden;
  color: #60636a;
  font-size: 25rpx;
  line-height: 1.85;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.strategy-card--document {
  justify-content: center;
  gap: 28rpx;
  padding-top: 30rpx;
}

.strategy-card--disabled {
  opacity: 0.58;
}

.document-icon {
  position: relative;
  width: 94rpx;
  height: 94rpx;
}

.document-sheet {
  position: absolute;
  right: 7rpx;
  bottom: 4rpx;
  box-sizing: border-box;
  width: 68rpx;
  height: 76rpx;
  background: #eef5ff;
  border: 6rpx solid #1267ff;
  border-radius: 13rpx;
}

.document-sheet::before {
  position: absolute;
  top: 10rpx;
  left: 18rpx;
  width: 24rpx;
  height: 16rpx;
  content: "";
  border: 5rpx solid #1267ff;
  border-radius: 7rpx;
}

.document-sheet::after {
  position: absolute;
  top: 31rpx;
  left: 18rpx;
  width: 26rpx;
  height: 5rpx;
  content: "";
  background: #1267ff;
  border-radius: 999rpx;
}

.document-line {
  position: absolute;
  right: 18rpx;
  bottom: 23rpx;
  width: 34rpx;
  height: 5rpx;
  background: #1267ff;
  border-radius: 999rpx;
}

.document-line--short {
  bottom: 35rpx;
  width: 23rpx;
}

.document-line--long {
  bottom: 11rpx;
  width: 42rpx;
}

.document-icon::before {
  position: absolute;
  top: 42rpx;
  left: 4rpx;
  box-sizing: border-box;
  width: 42rpx;
  height: 38rpx;
  content: "";
  border: 6rpx solid #1267ff;
  border-right: 0;
  border-radius: 14rpx 0 0 14rpx;
}

.document-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #303236;
  font-size: 30rpx;
  font-weight: 900;
  line-height: 1.5;
  text-align: center;
}

.document-status {
  display: block;
  max-width: 100%;
  padding: 5rpx 14rpx;
  overflow: hidden;
  color: #1267ff;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #eef5ff;
  border-radius: 999rpx;
}

@keyframes state-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
