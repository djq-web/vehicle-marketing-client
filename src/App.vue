<template>
  <div class="app-shell">
    <div class="top-strip"></div>
    <div class="workspace">
      <AppSidebar :chats="homeStore.recentChats" />
      <main class="main-panel">
        <button class="collapse-button" aria-label="折叠菜单">
          <el-icon><Fold /></el-icon>
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
import AppSidebar from '@/components/AppSidebar.vue'
import ChatComposer from '@/components/ChatComposer.vue'
import FeatureCard from '@/components/FeatureCard.vue'
import { useHomeStore } from '@/stores/home'

const homeStore = useHomeStore()
</script>
