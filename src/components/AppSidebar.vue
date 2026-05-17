<template>
  <aside class="sidebar">
    <div class="brand-mark">
      <div class="brand-circle">肆</div>
    </div>

    <el-button class="new-chat" round>
      <el-icon><EditPen /></el-icon>
      创建新对话
    </el-button>

    <div class="chat-list">
      <template v-for="(chat, index) in chats" :key="`${chat.title}-${index}`">
        <p v-if="chat.date" class="date-label">{{ chat.date }}</p>
        <div class="chat-item" :class="{ active: chat.active, muted: chat.muted }">
          <span>{{ chat.title }}</span>
          <el-icon v-if="chat.muted"><MoreFilled /></el-icon>
        </div>
      </template>
    </div>

    <div class="settings-card">
      <button v-for="item in settingItems" :key="item.label" class="setting-item" :class="{ active: item.active }">
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </button>
    </div>

    <div class="company">
      <span class="avatar"></span>
      <span>十二言星公司</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { Cpu, EditPen, MoreFilled, Operation, QuestionFilled, Setting, SwitchButton } from '@element-plus/icons-vue'
import type { ChatRecord } from '@/stores/home'

defineProps<{
  chats: ChatRecord[]
}>()

const settingItems = [
  { label: '设置', icon: Setting, active: true },
  { label: '管理后台', icon: Operation },
  { label: '车肆官网', icon: Cpu },
  { label: '问题反馈', icon: QuestionFilled },
  { label: '退出登录', icon: SwitchButton },
]
</script>
