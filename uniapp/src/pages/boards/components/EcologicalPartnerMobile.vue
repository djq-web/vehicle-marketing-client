<template>
  <view class="partner-mobile" :style="pageStyle">
    <view class="mobile-board-nav">
      <view class="mobile-board-nav-content">
        <button class="mobile-back" @click="emit('back')"></button>
        <text class="mobile-title">生态伙伴</text>
      </view>
    </view>

    <scroll-view class="partner-scroll" scroll-y>
      <view class="partner-content">
        <button
          v-for="card in cards"
          :key="card.title"
          class="mobile-partner-card"
          :class="{ active: card.title === selectedTitle }"
          @click="openPartner(card)"
        >
          <image class="mobile-partner-image" :src="card.image" mode="aspectFill" />
          <text class="mobile-partner-title">{{ card.title }}</text>
        </button>
      </view>
    </scroll-view>

    <view v-if="showContact" class="partner-modal-mask" @click="closeContact">
      <view class="partner-contact-modal" @click.stop>
        <button class="partner-modal-close" @click="closeContact"></button>
        <text class="partner-modal-title">{{ selectedCard?.title }}</text>
        <view class="partner-qrcode-placeholder"></view>
        <text class="partner-contact-title">联 系 方 式</text>
        <text class="partner-contact-line">电话：{{ selectedCard?.phone || defaultPhone }}</text>
        <text class="partner-contact-line">微信号：{{ selectedCard?.wechat || defaultWechat }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { PropType } from "vue";

type PartnerCard = {
  title: string;
  image: string;
  active?: boolean;
  phone?: string;
  wechat?: string;
};

const props = defineProps({
  cards: {
    type: Array as PropType<PartnerCard[]>,
    required: true,
  },
});

const emit = defineEmits<{
  back: [];
}>();

const defaultPhone = "18025607895";
const defaultWechat = "HAOLIU0506";
const selectedTitle = ref("");
const showContact = ref(false);
const mobileStatusBarHeight = ref(0);
const mobileNavHeight = ref(56);
const mobileNavContentHeight = ref(44);
const mobileRightSafeWidth = ref(58);

const selectedCard = computed(() =>
  props.cards.find((card) => card.title === selectedTitle.value),
);

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
  selectedTitle.value =
    props.cards.find((card) => card.active)?.title || props.cards[0]?.title || "";
});

function openPartner(card: PartnerCard) {
  selectedTitle.value = card.title;
  showContact.value = true;
}

function closeContact() {
  showContact.value = false;
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
.partner-mobile {
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
  box-shadow: 0 8px 18px rgb(70 70 70 / 8%);
}

.mobile-board-nav-content {
  position: relative;
  display: flex;
  height: var(--mobile-nav-content-height);
  align-items: center;
  padding: 0 var(--mobile-right-safe-width) 0 22px;
}

.mobile-back {
  position: relative;
  z-index: 2;
  width: 34px;
  height: 34px;
  margin: 0;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.mobile-back::before {
  position: absolute;
  top: 9px;
  left: 6px;
  width: 14px;
  height: 14px;
  content: "";
  border-bottom: 2px solid #2f333a;
  border-left: 2px solid #2f333a;
  transform: rotate(45deg);
}

.mobile-back::after,
.mobile-partner-card::after,
.partner-modal-close::after {
  border: 0;
}

.mobile-title {
  position: absolute;
  right: var(--mobile-right-safe-width);
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

.partner-scroll {
  box-sizing: border-box;
  height: 100vh;
  height: 100dvh;
  padding-top: var(--mobile-nav-height);
}

.partner-content {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 14px;
  box-sizing: border-box;
  min-height: 100%;
  padding: 24px 26px 36px;
}

.mobile-partner-card {
  box-sizing: border-box;
  min-width: 0;
  min-height: 198px;
  margin: 0;
  padding: 14px 14px 18px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid transparent;
  border-radius: 22px;
  box-shadow: 0 8px 24px rgb(70 70 70 / 14%);
}

.mobile-partner-card.active {
  border-color: #1267ff;
  box-shadow: 0 0 0 1px #1267ff, 0 10px 26px rgb(18 103 255 / 22%);
}

.mobile-partner-image {
  display: block;
  width: 100%;
  height: 116px;
  overflow: hidden;
  background: #f5f6f8;
  border-radius: 12px;
}

.mobile-partner-title {
  display: block;
  margin-top: 18px;
  overflow: hidden;
  color: #303236;
  font-size: 17px;
  font-weight: 900;
  line-height: 1.25;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.partner-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.partner-contact-modal {
  position: fixed;
  top: calc(var(--mobile-nav-height) + 200px);
  left: 50%;
  box-sizing: border-box;
  width: min(286px, calc(100vw - 88px));
  padding: 26px 24px 30px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgb(40 45 55 / 18%);
  transform: translateX(-50%);
}

.partner-modal-title {
  display: block;
  padding: 0 34px;
  overflow: hidden;
  color: #303236;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.35;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.partner-modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 28px;
  height: 28px;
  margin: 0;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.partner-modal-close::before,
.partner-modal-close::after {
  position: absolute;
  top: 13px;
  left: 4px;
  width: 20px;
  height: 2px;
  content: "";
  background: #8d8d8d;
  border-radius: 999px;
}

.partner-modal-close::before {
  transform: rotate(45deg);
}

.partner-modal-close::after {
  transform: rotate(-45deg);
}

.partner-qrcode-placeholder {
  width: 190px;
  height: 190px;
  margin: 24px auto 24px;
  background: #c9c9c9;
}

.partner-contact-title {
  display: block;
  margin-bottom: 14px;
  color: #303236;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.2;
  text-align: center;
}

.partner-contact-line {
  display: block;
  color: #303236;
  font-size: 15px;
  line-height: 1.7;
  text-align: center;
}
</style>
