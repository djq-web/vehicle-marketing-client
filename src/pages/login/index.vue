<template>
  <view class="login-page" :class="{ mobileLoginPage: isMobileLayout }">
    <view class="left-desc" v-if="!isMobileLayout">
      <view>
        <text class="mainText">车肆营销智能系统</text>
      </view>
      <view>
        <text class="subText">车肆是一个不领工资的AI首席营销官。战略、策略、内容、执行和监控，全部闭环搞定。不用懂技术，不用养团队，实打实把丢掉的市场抢回来。</text>
      </view>
    </view>
    <view class="top-banner" v-else>
      <image src="/static/mobile-bg.png" mode="widthFix" class="imgBox" />
    </view>
    <view class="login-area">
      <view class="login-card">
        <image class="login-logo" src="/static/logon-icon.png" mode="aspectFit" />
        <text class="card-title">{{
          isMobileLayout ? "车肆营销智能系统" : "欢迎登录"
        }}</text>
        <view class="tab-list" v-if="!isMobileLayout">
          <text v-for="item in TabList" class="tab-item" :class="{ active: activeTab === item.value }"
            @click="activeTab = item.value">{{
              item.label }}</text>
        </view>
        <view class="field">
          <view class="field-icon user-icon">
            <view class="user-head"></view>
            <view class="user-body"></view>
          </view>
          <input v-model="form.username" class="field-input" type="text" placeholder="请输入账号"
            placeholder-class="input-placeholder" confirm-type="next" />
        </view>
        <view class="field">
          <view class="field-icon lock-icon">
            <view class="lock-shackle"></view>
            <view class="lock-body"></view>
          </view>
          <input v-model="form.password" class="field-input" :type="passwordVisible ? 'text' : 'password'"
            placeholder="请输入密码" placeholder-class="input-placeholder" confirm-type="done" @confirm="handleLogin" />
          <view class="toggle-icon" @click="passwordVisible = !passwordVisible" aria-label="切换密码可见性">
            <image v-if="passwordVisible" src="/static/svg/show-password.svg" style="width: 16px; height: 16px;" />
            <image v-else src="/static/svg/hide-password.svg" style="width: 16px; height: 16px;" />
          </view>
        </view>
        <view class="login-options">
          <label class="remember">
            <checkbox :checked="form.remember" color="#1d6df2" />
            <text>记住密码</text>
          </label>
        </view>
        <text v-if="error" class="login-error">{{ error }}</text>
        <button class="login-button" :disabled="loading" @click="handleLogin">
          {{ loginButtonText }}
        </button>
        <!-- <button class="admin-login-button" @click="openAdminLogin">
          管理后台登录
        </button> -->
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, reactive, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useStrategyChatStore } from "@/stores/strategyChat";

const authStore = useAuthStore();
const chatStore = useStrategyChatStore();
const loading = ref(false);
const error = ref("");
const form = reactive({
  username: "admin",
  password: "123456",
  remember: true,
});

const TabList = [
  { label: "客户端", value: "client" },
  { label: "管理端", value: "admin" },
];
const activeTab = ref("client");
const isMobileLayout = ref(false);
const passwordVisible = ref(false);
const configuredAdminLoginUrl = (
  import.meta.env.VITE_ADMIN_LOGIN_URL || "http://localhost:3001"
).trim();
const loginButtonText = computed(() => {
  if (loading.value) {
    return "登录中...";
  }

  return activeTab.value === "admin" ? "进入管理端" : "登 录";
});

function updateMobileLayout(width = uni.getSystemInfoSync().windowWidth) {
  isMobileLayout.value = width <= 760;
}

onLoad(() => {
  authStore.restore();
  updateMobileLayout();

  if (authStore.isAuthenticated) {
    uni.reLaunch({
      url: "/pages/home/index",
    });
  }
});

async function handleLogin() {
  if (loading.value) {
    return;
  }

  if (activeTab.value === "admin") {
    openAdminLogin();
    return;
  }

  const loginName = form.username.trim();
  if (!loginName || !form.password) {
    error.value = "请填写账号和密码";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    chatStore.resetForAccountSwitch();
    await authStore.login(loginName, form.password);
    uni.reLaunch({
      url: "/pages/home/index",
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "登录失败";
  } finally {
    loading.value = false;
  }
}

function resolveDefaultAdminLoginUrl() {
  if (typeof window === "undefined") {
    return "/login";
  }

  const url = new URL(window.location.href);
  const adminPortByClientPort: Record<string, string> = {
    "3001": "3002",
    "4173": "3002",
    "5173": "3002",
    "51080": "51081",
  };
  const mappedPort = adminPortByClientPort[url.port];

  if (mappedPort) {
    url.port = mappedPort;
  }

  url.pathname = "/login";
  url.search = "";
  url.hash = "";

  return url.toString();
}

function resolveAdminLoginUrl() {
  if (!configuredAdminLoginUrl) {
    return resolveDefaultAdminLoginUrl();
  }

  if (/^https?:\/\//i.test(configuredAdminLoginUrl)) {
    return configuredAdminLoginUrl;
  }

  if (typeof window !== "undefined") {
    return new URL(configuredAdminLoginUrl, window.location.origin).toString();
  }

  return configuredAdminLoginUrl;
}

function openAdminLogin() {
  const url = resolveAdminLoginUrl();

  if (typeof window !== "undefined") {
    window.location.href = url;
    return;
  }

  uni.showToast({
    title: "请在浏览器打开管理后台",
    icon: "none",
  });
}
</script>

<style>
.login-page {
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 0 96px 0 123px;
  background: #dbeeff url("/static/login-bg.png") center / cover no-repeat;
}

.mobileLoginPage {
  flex-direction: column;
  background-color: #ffffff;
  background-image: none;
  padding: 0;
  position: relative;
}

.left-desc {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 344px;
  padding-top: 96px;
}

.mainText {
  font-size: 24px;
  line-height: 35px;
  color: rgba(51, 51, 51, 1);
  font-weight: 700;
  letter-spacing: 2px;
}

.subText {
  font-size: 10px;
  line-height: 14px;
  color: rgba(51, 51, 51, 1);
  font-weight: 400;
  font-family: "Noto Sans SC";
}

.top-banner {
  width: 100%;
}

.imgBox {
  width: 100%;
}

.login-area {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobileLoginPage .login-area {
  flex: 1;
  min-height: 0;
  background: #ffffff;
  display: block;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  margin-top: -20px;
  position: relative;
  z-index: 100;
}

.login-card {
  box-sizing: border-box;
  width: 300px;
  min-height: 361px;
  padding: 54px 41px 55px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 18px 46px rgb(41 91 139 / 8%);
}

.mobileLoginPage .login-area .login-card {
  width: 100%;
  box-shadow: none;
  border-radius: 0;
}

.login-logo {
  display: block;
  width: 48px;
  height: 48px;
  margin: 0 auto 4px;
}

.card-title {
  display: block;
  margin: 0 0 16px;
  color: #0f0f0f;
  font-size: 15px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  letter-spacing: 8px;
  text-indent: 8px;
}

.mobileLoginPage .card-title {
  letter-spacing: 1px;
}

.field {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: 29px;
  margin-bottom: 14px;
  padding: 0 12px;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 999px;
}

.field-icon {
  position: relative;
  display: block;
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  margin-right: 8px;
  color: #bcbcbc;
}

.user-head {
  position: absolute;
  top: 1px;
  left: 4px;
  width: 6px;
  height: 6px;
  border: 1px solid #bcbcbc;
  border-radius: 50%;
}

.user-body {
  position: absolute;
  right: 1px;
  bottom: 0;
  left: 1px;
  height: 7px;
  border: 1px solid #bcbcbc;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom: 0;
}

.lock-shackle {
  position: absolute;
  top: 0;
  left: 4px;
  width: 6px;
  height: 7px;
  border: 1px solid #bcbcbc;
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
}

.lock-body {
  position: absolute;
  right: 1px;
  bottom: 1px;
  left: 1px;
  height: 8px;
  border: 1px solid #bcbcbc;
  border-radius: 2px;
}

.field-input {
  flex: 1;
  min-width: 0;
  height: 27px;
  color: #303030;
  font-size: 12px;
  line-height: 27px;
}

.input-placeholder {
  color: #c8c8c8;
  font-size: 10px;
}

.login-options {
  display: flex;
  align-items: center;
  min-height: 14px;
  margin: -4px 0 35px 8px;
  color: #b8b8b8;
  font-size: 9px;
  line-height: 14px;
}

.remember {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
}

.remember checkbox {
  transform: scale(0.58);
  transform-origin: left center;
}

.login-button {
  width: 100%;
  height: 28px;
  margin: 0;
  padding: 0;
  color: #ffffff;
  font-size: 11px;
  font-weight: 400;
  line-height: 28px;
  background: rgba(16, 98, 236, 1);
  border-radius: 999px;
}

.login-button[disabled] {
  opacity: 0.72;
}

.admin-login-button {
  width: 100%;
  height: 40px;
  margin-top: 10px;
  color: rgba(16, 98, 236, 1);
  font-size: 14px;
  font-weight: 600;
  line-height: 40px;
  background: #f3f7ff;
  border: 1px solid #c9ddff;
  border-radius: 4px;
}

.login-button::after,
.admin-login-button::after {
  border: 0;
}

.login-error {
  display: block;
  margin: -26px 0 12px;
  color: #d93025;
  font-size: 10px;
  line-height: 14px;
}

.toggle-icon {
  margin-left: 8px;
  color: #9b9b9b;
  font-size: 14px;
  line-height: 27px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-list {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.tab-list::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 3px;
  background: rgba(221, 221, 221, 1);
  border-radius: 6px;
  z-index: 1;
}

.tab-item {
  flex: 1;
  font-size: 14px;
  color: rgba(153, 153, 153, 1);
  text-align: center;
  line-height: 20px;
  padding-bottom: 4px;
  position: relative;
  cursor: pointer;
}

.tab-item.active {
  color: rgba(51, 51, 51, 1)
}

.tab-item.active::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 3px;
  background: rgba(16, 98, 236, 1);
  border-radius: 6px;
  z-index: 10;
}
</style>
