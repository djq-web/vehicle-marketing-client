<template>
  <view class="brand-strategy-mobile" :style="pageStyle">
    <view class="mobile-board-nav">
      <view class="mobile-board-nav-content">
        <button class="mobile-back" @click="emit('back')"></button>
        <text class="mobile-title">品牌战略</text>
      </view>
    </view>

    <scroll-view class="strategy-scroll" scroll-y>
      <view class="strategy-content">
        <view
          v-for="card in strategyCards"
          :key="card.title"
          class="strategy-card"
          :class="{ 'strategy-card--document': card.type === 'document' }"
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

type TextCard = {
  type: "text";
  title: string;
  color: string;
  lines: string[];
};

type DocumentCard = {
  type: "document";
  title: string;
  titleLines: string[];
};

type StrategyCard = TextCard | DocumentCard;

const emit = defineEmits<{
  back: [];
}>();

const starIndexes = [0, 1, 2, 3, 4, 5, 6];
const mobileStatusBarHeight = ref(0);
const mobileNavHeight = ref(56);
const mobileNavContentHeight = ref(44);
const mobileRightSafeWidth = ref(58);

const strategyCards: StrategyCard[] = [
  {
    type: "text",
    title: "愿 景",
    color: "#ff4343",
    lines: ["每个身负使命的人", "都应在浩瀚星河中找到", "属于自己的坐标与家园"],
  },
  {
    type: "text",
    title: "使 命",
    color: "#ff4343",
    lines: ["每个人皆星辰下凡", "生而带使命"],
  },
  {
    type: "text",
    title: "核心价值观",
    color: "#ff4343",
    lines: ["守护者", "引路人", "共同体构建者"],
  },
  {
    type: "document",
    title: "北斗宣言",
    titleLines: ["北斗宣言"],
  },
  {
    type: "text",
    title: "客户选择",
    color: "#54d830",
    lines: ["那些在使命路上", "孤独前行、身负压力", "却仰望星空的人"],
  },
  {
    type: "text",
    title: "价值主张",
    color: "#54d830",
    lines: ["有星可以", "有伴可依", "有礼可循"],
  },
  {
    type: "text",
    title: "竞争差异",
    color: "#54d830",
    lines: ["一整套从星宿理论", "到佩戴仪式", "再到职阶共治的星空生态"],
  },
  {
    type: "document",
    title: "战略定位与品牌承诺图",
    titleLines: ["战略定位", "与品牌承诺图"],
  },
  {
    type: "text",
    title: "品牌定位",
    color: "#ff8f1f",
    lines: ["以东方星宿智慧", "连接个体使命与", "长期陪伴关系"],
  },
  {
    type: "text",
    title: "用户洞察",
    color: "#ff8f1f",
    lines: ["用户寻找的不只是饰品", "而是被理解、被指引", "和被陪伴的确定感"],
  },
  {
    type: "text",
    title: "核心优势",
    color: "#ff8f1f",
    lines: ["我们手握复原的古天文体系", "著书立说的理论深度", "以及“天文手串”开创..."],
  },
  {
    type: "text",
    title: "护城河",
    color: "#ff8f1f",
    lines: ["吉星理论是墙", "社群归属是河", "六步仪式是桥--外人", "难仿，内者深依"],
  },
  {
    type: "text",
    title: "品牌信任状",
    color: "#ff8f1f",
    lines: ["古天文专家的背书、媒体的", "见证、用户的康复故事，", "以及每一位志工的信用"],
  },
  {
    type: "document",
    title: "优势、壁垒与信任状体系",
    titleLines: ["优势、壁垒", "与信任状体系"],
  },
  {
    type: "text",
    title: "产品组合",
    color: "#d948ff",
    lines: ["手串是入门的星钥，课程与", "白酒是交心的酒食，观星与", "中医是沉浸的道场..."],
  },
  {
    type: "text",
    title: "增长策略",
    color: "#d948ff",
    lines: ["以公域内容点燃星火", "以私域社群淬炼星链", "以海外弟子织就星网"],
  },
  {
    type: "text",
    title: "支撑体系",
    color: "#d948ff",
    lines: ["AI为经，职阶为纬，", "资本为梭。织出自我强化的", "共生星空"],
  },
  {
    type: "document",
    title: "商业模式与体验交付全景图",
    titleLines: ["商业模式与", "体验交付全景图"],
  },
  {
    type: "text",
    title: "品牌承诺",
    color: "#1267ff",
    lines: ["“穿越光年，皆为守护”", "你负责使命，", "我们负责星河。"],
  },
  {
    type: "text",
    title: "体验设计",
    color: "#1267ff",
    lines: ["从初次佩戴的仪式震颤，到", "社群认同中的心跳共振，再", "到职阶晋升的泪光闪..."],
  },
  {
    type: "text",
    title: "品牌表达",
    color: "#1267ff",
    lines: ["“让星河守护每一个有使命", "的人”：深蓝、金、白，象体", "与星徽是我们与宇宙对话..."],
  },
  {
    type: "document",
    title: "品牌引力场与体验蓝图",
    titleLines: ["品牌引力场", "与体验蓝图"],
  },
];

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
</style>
