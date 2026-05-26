<template>
  <view class="login-page">
    <view class="hero-banner">
      <view class="hero-copy">
        <text class="eyebrow">车肆营销中台</text>
        <text class="hero-title">把品牌增长线索，沉淀为可执行的营销策略</text>
        <text class="subtitle">
          连接洞察、策略、内容与运营，让每一次营销动作都有清晰方向。
        </text>
      </view>

      <view class="hero-illustration" aria-hidden="true">
        <view class="diamond diamond-left"></view>
        <view class="diamond diamond-right"></view>
        <view class="sun"><view class="sun-core"></view></view>
        <view class="person-head"><view class="person-hair"></view></view>
        <view class="person-body"><view class="person-arm"></view></view>
        <view class="board">
          <view class="board-line first"></view>
          <view class="board-line second"></view>
          <view class="board-line third"></view>
        </view>
      </view>
    </view>

    <view class="login-area">
      <view class="login-card">
        <text class="card-title">欢迎登录</text>
        <view class="field">
          <view class="field-icon user-icon">
            <view class="user-head"></view>
            <view class="user-body"></view>
          </view>
          <input
            v-model="form.username"
            class="field-input"
            type="text"
            placeholder="请输入账号"
            confirm-type="next"
          />
        </view>
        <view class="field">
          <view class="field-icon lock-icon">
            <view class="lock-shackle"></view>
            <view class="lock-body"></view>
          </view>
          <input
            v-model="form.password"
            class="field-input"
            password
            placeholder="请输入密码"
            confirm-type="done"
            @confirm="handleLogin"
          />
        </view>
        <view class="login-options">
          <label class="remember">
            <checkbox :checked="form.remember" color="#1267ff" />
            <text>记住登录状态</text>
          </label>
          <button class="forgot-button">忘记密码？</button>
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
  min-height: 100vh;
  background: #eef2f7;
}

.hero-banner {
  position: relative;
  height: 304px;
  overflow: hidden;
  background: linear-gradient(118deg, #ffffff 0 30%, #dcefff 30% 53%, #fffdf5 53% 100%);
}

.hero-copy {
  position: relative;
  z-index: 1;
  width: 760px;
  padding: 76px 0 0 136px;
  color: #091a35;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  height: 24px;
  margin: 0 0 12px;
  padding: 0 10px;
  color: #1267ff;
  font-size: 14px;
  font-weight: 700;
  line-height: 24px;
  background: #eaf3ff;
  border: 1px solid #9fc7ff;
  border-radius: 5px;
}

.hero-title {
  display: block;
  width: 650px;
  color: #091a35;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: 1px;
}

.subtitle {
  display: block;
  margin: 18px 0 0;
  color: #526172;
  font-size: 16px;
}

.hero-illustration {
  position: absolute;
  top: 40px;
  right: 130px;
  width: 430px;
  height: 230px;
}

.diamond {
  position: absolute;
  border-radius: 18px;
  background: linear-gradient(145deg, #c8e8ff, #9dcbf4);
  transform: rotate(45deg);
}

.diamond-left {
  right: 210px;
  bottom: 20px;
  width: 138px;
  height: 138px;
}

.diamond-right {
  right: 0;
  bottom: 10px;
  width: 178px;
  height: 178px;
}

.sun {
  position: absolute;
  top: 10px;
  right: 126px;
  width: 74px;
  height: 74px;
  background: #ffdc89;
  border-radius: 50%;
}

.sun-core {
  position: absolute;
  inset: 18px;
  background: #ffc75d;
  border-radius: 50%;
}

.person-head {
  position: absolute;
  top: 74px;
  right: 110px;
  width: 58px;
  height: 58px;
  background: #efb07f;
  border-radius: 50%;
}

.person-hair {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 64px;
  height: 32px;
  background: #1d2b43;
  border-radius: 20px 20px 10px 10px;
}

.person-body {
  position: absolute;
  right: 103px;
  bottom: 22px;
  width: 58px;
  height: 88px;
  background: #2f6dec;
  border-radius: 0 0 18px 18px;
}

.person-arm {
  position: absolute;
  top: -28px;
  right: -16px;
  width: 48px;
  height: 18px;
  background: #ffc296;
  border-radius: 18px;
  transform: rotate(-28deg);
}

.board {
  position: absolute;
  top: 76px;
  right: 178px;
  width: 120px;
  height: 88px;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 14px 30px rgb(36 106 194 / 12%);
}

.board-line {
  display: block;
  height: 8px;
  margin-bottom: 14px;
  background: #d6e5f8;
  border-radius: 999px;
}

.board-line.first {
  width: 52px;
  background: #2f6dec;
}

.board-line.second {
  width: 84px;
}

.board-line.third {
  width: 58px;
}

.login-area {
  display: flex;
  justify-content: center;
  padding-top: 72px;
}

.login-card {
  width: 400px;
  padding: 28px 25px 24px;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 16px 42px rgb(38 56 86 / 8%);
}

.card-title {
  display: block;
  margin: 0 0 28px;
  color: #4a5565;
  font-size: 20px;
  font-weight: 500;
  text-align: center;
}

.field {
  display: flex;
  align-items: center;
  height: 42px;
  margin-bottom: 18px;
  padding: 0 14px;
  border: 1px solid #d8dee9;
  border-radius: 4px;
}

.field-icon {
  position: relative;
  display: block;
  width: 16px;
  height: 16px;
  margin-right: 10px;
  color: #aab2bf;
}

.user-head {
  position: absolute;
  top: 1px;
  left: 5px;
  width: 6px;
  height: 6px;
  background: #aab2bf;
  border-radius: 50%;
}

.user-body {
  position: absolute;
  right: 2px;
  bottom: 1px;
  left: 2px;
  height: 7px;
  border: 2px solid #aab2bf;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom: 0;
}

.lock-shackle {
  position: absolute;
  top: 0;
  left: 4px;
  width: 8px;
  height: 8px;
  border: 2px solid #aab2bf;
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
}

.lock-body {
  position: absolute;
  right: 2px;
  bottom: 1px;
  left: 2px;
  height: 9px;
  background: #aab2bf;
  border-radius: 2px;
}

.field-input {
  flex: 1;
  min-width: 0;
  height: 40px;
  color: #303640;
  font-size: 14px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  margin: 4px 0 28px;
  color: #596579;
  font-size: 13px;
}

.remember {
  display: flex;
  align-items: center;
  gap: 6px;
}

.forgot-button {
  color: #1267ff;
  font-size: 13px;
  line-height: 20px;
}

.login-button {
  width: 100%;
  height: 42px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  line-height: 42px;
  background: #409eff;
  border-radius: 4px;
}

.login-button[disabled] {
  opacity: 0.72;
}

.login-error {
  display: block;
  margin: -14px 0 14px;
  color: #d93025;
  font-size: 12px;
}

@media (max-width: 760px) {
  .hero-banner {
    height: 420rpx;
  }

  .hero-copy {
    width: auto;
    padding: 70rpx 40rpx 0;
  }

  .hero-title {
    width: auto;
    font-size: 42rpx;
  }

  .subtitle {
    font-size: 26rpx;
  }

  .hero-illustration {
    top: 120rpx;
    right: -120rpx;
    transform: scale(0.62);
  }

  .login-area {
    padding: 48rpx 32rpx 0;
  }

  .login-card {
    width: 100%;
  }
}
</style>
