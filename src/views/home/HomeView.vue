<template>
  <div class="home-page">
    <div class="top-strip"></div>
    <div class="workspace">
      <AppSidebar :chats="homeStore.recentChats" :collapsed="isSidebarCollapsed" />
      <main class="main-panel">
        <button
          class="collapse-button"
          type="button"
          :class="{ collapsed: isSidebarCollapsed }"
          :aria-label="isSidebarCollapsed ? '展开左侧菜单' : '折叠左侧菜单'"
          @click="toggleSidebar"
        >
          <img :src="ExpandIcon" alt="" />
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
import ExpandIcon from '@/assets/svg/expandIcon.svg'
import AppSidebar from './components/AppSidebar.vue'
import ChatComposer from './components/ChatComposer.vue'
import FeatureCard from './components/FeatureCard.vue'
import { useHomeStore } from './stores/home'

const homeStore = useHomeStore()
const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
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
  z-index: 10;
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background: #eef4ff;
  }

  img {
    width: 16px;
    height: 16px;
    transition: transform 0.22s ease;
  }

  &.collapsed img {
    transform: rotate(180deg);
  }
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
