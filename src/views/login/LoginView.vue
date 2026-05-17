<template>
  <main class="login-page">
    <section class="hero-banner">
      <div class="hero-copy">
        <p class="eyebrow">车肆营销中台</p>
        <h1>把品牌增长线索，沉淀为可执行的营销策略</h1>
        <p class="subtitle">连接洞察、策略、内容与运营，让每一次营销动作都有清晰方向。</p>
      </div>
      <div class="hero-illustration" aria-hidden="true">
        <span class="diamond diamond-left"></span>
        <span class="diamond diamond-right"></span>
        <span class="sun"></span>
        <span class="person-head"></span>
        <span class="person-body"></span>
        <span class="board">
          <i></i>
          <i></i>
          <i></i>
        </span>
      </div>
    </section>

    <section class="login-area">
      <form class="login-card" @submit.prevent="handleLogin">
        <h2>欢迎登录</h2>
        <label class="field">
          <el-icon><User /></el-icon>
          <input v-model="form.username" type="text" autocomplete="username" placeholder="请输入账号" />
        </label>
        <label class="field">
          <el-icon><Lock /></el-icon>
          <input v-model="form.password" type="password" autocomplete="current-password" placeholder="请输入密码" />
        </label>
        <div class="login-options">
          <label>
            <input v-model="form.remember" type="checkbox" />
            记住登录状态
          </label>
          <button type="button">忘记密码？</button>
        </div>
        <button class="login-button" type="submit">登 录</button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { Lock, User } from '@element-plus/icons-vue'

const router = useRouter()
const form = reactive({
  username: 'admin',
  password: '123456',
  remember: true,
})

const handleLogin = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
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
  height: 24px;
  margin: 0 0 12px;
  padding: 0 10px;
  color: #1267ff;
  font-size: 14px;
  font-weight: 700;
  background: #eaf3ff;
  border: 1px solid #9fc7ff;
  border-radius: 5px;
}

h1 {
  width: 650px;
  margin: 0;
  font-size: 34px;
  line-height: 1.3;
  letter-spacing: 1px;
}

.subtitle {
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

  &::after {
    position: absolute;
    inset: 18px;
    content: '';
    background: #ffc75d;
    border-radius: 50%;
  }
}

.person-head {
  position: absolute;
  top: 74px;
  right: 110px;
  width: 58px;
  height: 58px;
  background: #efb07f;
  border-radius: 50%;

  &::before {
    position: absolute;
    top: -8px;
    left: -8px;
    width: 64px;
    height: 32px;
    content: '';
    background: #1d2b43;
    border-radius: 20px 20px 10px 10px;
  }
}

.person-body {
  position: absolute;
  right: 103px;
  bottom: 22px;
  width: 58px;
  height: 88px;
  background: #2f6dec;
  border-radius: 0 0 18px 18px;

  &::after {
    position: absolute;
    top: -28px;
    right: -16px;
    width: 48px;
    height: 18px;
    content: '';
    background: #ffc296;
    border-radius: 18px;
    transform: rotate(-28deg);
  }
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

  i {
    display: block;
    height: 8px;
    margin-bottom: 14px;
    background: #d6e5f8;
    border-radius: 999px;

    &:first-child {
      width: 52px;
      background: #2f6dec;
    }

    &:nth-child(2) {
      width: 84px;
    }

    &:last-child {
      width: 58px;
    }
  }
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

  h2 {
    margin: 0 0 28px;
    color: #4a5565;
    font-size: 20px;
    font-weight: 500;
    text-align: center;
  }
}

.field {
  display: flex;
  align-items: center;
  height: 42px;
  margin-bottom: 18px;
  padding: 0 14px;
  border: 1px solid #d8dee9;
  border-radius: 4px;

  .el-icon {
    margin-right: 10px;
    color: #aab2bf;
  }

  input {
    width: 100%;
    border: 0;
    outline: none;
    color: #303640;
    font-size: 14px;
  }
}

.login-options {
  display: flex;
  justify-content: space-between;
  margin: 4px 0 28px;
  color: #596579;
  font-size: 13px;

  label {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  button {
    color: #1267ff;
  }
}

.login-button {
  width: 100%;
  height: 42px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  background: #409eff;
  border-radius: 4px;
}
</style>
