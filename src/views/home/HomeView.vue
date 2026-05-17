<template>
  <div class="home-page">
    <div class="top-strip"></div>
    <div class="workspace">
      <AppSidebar :chats="homeStore.recentChats" />
      <main class="main-panel">
        <button class="collapse-button" aria-label="折叠菜单">
          <el-icon>
            <Fold />
          </el-icon>
        </button>

        <section class="hero">
          <h1>别再问我怎么搞钱了！用好车肆，先赚一个小目标！</h1>
          <div class="feature-grid">
            <FeatureCard v-for="feature in homeStore.features" :key="feature.title" :feature="feature" />
          </div>
        </section>

        <ChatComposer />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Fold } from '@element-plus/icons-vue'
import AppSidebar from './components/AppSidebar.vue'
import ChatComposer from './components/ChatComposer.vue'
import FeatureCard from './components/FeatureCard.vue'
import { useHomeStore } from './stores/home'

const homeStore = useHomeStore()
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  overflow: hidden;
  background: #ffffff;
}

.top-strip {
  height: 36px;
  background: #bfbfbf;
}

.workspace {
  display: flex;
  min-height: calc(100vh - 36px);
}

.main-panel {
  position: relative;
  flex: 1;
  min-width: 0;
  background: #ffffff;
}

.collapse-button {
  position: absolute;
  top: 13px;
  left: 15px;
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  color: #20242b;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 67px;

  h1 {
    margin: 0 0 45px;
    color: #2f333a;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 136px);
  gap: 55px 38px;
}
</style>
