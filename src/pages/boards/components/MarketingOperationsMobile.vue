<template>
  <view class="operations-mobile" :style="pageStyle">
    <view class="mobile-board-nav">
      <view class="mobile-board-nav-content">
        <button class="mobile-back" aria-label="返回首页" @click="emit('back')">
          ×
        </button>
        <text class="mobile-title">营销运营</text>
      </view>
    </view>

    <view class="mobile-status-legend">
      <view
        v-for="item in statusLegend"
        :key="item.label"
        class="mobile-legend-item"
      >
        <text class="mobile-legend-dot" :class="item.type"></text>
        <text>{{ item.label }}</text>
      </view>
    </view>

    <scroll-view class="operations-scroll" scroll-y>
      <view class="operations-content">
        <view
          v-for="node in orderedNodes"
          :key="node.id"
          class="operation-card"
        >
          <text class="operation-status-dot" :class="node.status"></text>
          <text class="operation-title">{{ node.title }}</text>
          <image
            v-if="node.icon"
            class="operation-card-icon"
            :src="node.icon"
            mode="aspectFit"
          />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { PropType } from "vue";

type Status = "done" | "doing" | "pending" | "disabled";

type FlowNode = {
  id: string;
  title: string;
  status?: Status;
  icon?: string;
};

const props = defineProps({
  nodes: {
    type: Array as PropType<FlowNode[]>,
    required: true,
  },
  statusLegend: {
    type: Array as PropType<Array<{ label: string; type: Status }>>,
    required: true,
  },
});

const emit = defineEmits<{
  back: [];
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

const orderedNodes = computed(() => {
  const order = [
    "strategy",
    "visual",
    "shortVideo",
    "live",
    "phone",
    "store",
    "ecommerce",
    "private",
    "keyAccount",
    "overseas",
    "whatsapp",
    "analysis",
  ];
  const map = props.nodes.reduce<Record<string, FlowNode>>((result, node) => {
    result[node.id] = node;
    return result;
  }, {});

  return order.map((id) => map[id]).filter((node): node is FlowNode => Boolean(node));
});

onMounted(() => {
  initMobileChrome();
});

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
.operations-mobile {
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

.mobile-status-legend {
  position: fixed;
  top: var(--mobile-nav-height);
  right: 0;
  left: 0;
  z-index: 28;
  display: grid;
  grid-template-columns: repeat(4, max-content);
  justify-content: center;
  gap: 24px;
  box-sizing: border-box;
  height: 74px;
  padding: 20px 20px;
  background: #ffffff;
}

.mobile-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #303236;
  font-size: 15px;
  line-height: 28px;
  white-space: nowrap;
}

.mobile-legend-dot,
.operation-status-dot {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  border-radius: 50%;
}

.mobile-legend-dot.done,
.operation-status-dot.done {
  background: #5ee01d;
}

.mobile-legend-dot.doing,
.operation-status-dot.doing {
  background: #36bef2;
}

.mobile-legend-dot.pending,
.operation-status-dot.pending {
  background: #ffbb2f;
}

.mobile-legend-dot.disabled,
.operation-status-dot.disabled {
  background: #cfcfcf;
}

.operations-scroll {
  box-sizing: border-box;
  height: 100vh;
  height: 100dvh;
  padding-top: calc(var(--mobile-nav-height) + 74px);
}

.operations-content {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 18px;
  box-sizing: border-box;
  min-height: 100%;
  padding: 24px 28px 30px;
}

.operation-card {
  position: relative;
  box-sizing: border-box;
  min-height: 184px;
  padding: 36px 18px 22px;
  overflow: hidden;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 8px 22px rgb(80 80 80 / 16%);
}

.operation-status-dot {
  position: absolute;
  top: 18px;
  right: 18px;
}

.operation-title {
  display: block;
  color: #303236;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.3;
  text-align: center;
}

.operation-card-icon {
  display: block;
  width: 98px;
  height: 98px;
  margin: 34px auto 0;
}
</style>
