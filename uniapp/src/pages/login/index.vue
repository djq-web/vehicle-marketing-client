<template>
  <view class="login-page">
    <view class="login-area">
      <view class="login-card">
        <image class="login-logo" src="/static/svg/logoIcon.svg" mode="aspectFit" />
        <text class="card-title">欢迎登录</text>
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
          <input v-model="form.password" class="field-input" password placeholder="请输入密码"
            placeholder-class="input-placeholder" confirm-type="done" @confirm="handleLogin" />
        </view>
        <view class="login-options">
          <label class="remember">
            <checkbox :checked="form.remember" color="#1d6df2" />
            <text>记住密码</text>
          </label>
        </view>
        <text v-if="error" class="login-error">{{ error }}</text>
        <button class="login-button" :disabled="loading" @click="handleLogin">
          {{ loading ? "登录中..." : "登 录" }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { reactive, ref } from "vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const loading = ref(false);
const error = ref("");
const form = reactive({
  username: "admin",
  password: "123456",
  remember: true,
});

onLoad(() => {
  authStore.restore();

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

  const loginName = form.username.trim();
  if (!loginName || !form.password) {
    error.value = "请填写账号和密码";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
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
</script>

<style>
.login-page {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 0 10.2vw 0 32px;
  background: #dbeeff url("/static/login-bg.png") center / cover no-repeat;
}

.login-area {
  display: flex;
  align-items: center;
  justify-content: center;
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

.login-logo {
  display: block;
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  border: 1px solid #666;
  border-radius: 50%;
}

.card-title {
  display: block;
  margin: 0 0 26px;
  color: #0f0f0f;
  font-size: 15px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  letter-spacing: 8px;
  text-indent: 8px;
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
  font-size: 10px;
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
  background: #1d6df2;
  border-radius: 999px;
}

.login-button[disabled] {
  opacity: 0.72;
}

.login-button::after {
  border: 0;
}

.login-error {
  display: block;
  margin: -26px 0 12px;
  color: #d93025;
  font-size: 10px;
  line-height: 14px;
}

@media (max-width: 760px) {
  .login-page {
    justify-content: center;
    padding: 0 32rpx;
    background-position: center;
  }

  .login-area {
    width: 100%;
  }

  .login-card {
    width: min(600rpx, 100%);
  }
}
</style>
