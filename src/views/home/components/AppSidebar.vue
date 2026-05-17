<template>
  <aside class="sidebar" :class="{ collapsed }">
    <Transition name="sidebar-content">
      <div v-if="!collapsed" class="sidebar-content">
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
      </div>
    </Transition>

    <Transition name="sidebar-content">
      <div v-if="!collapsed" ref="companyMenuRef" class="company-menu-wrap">
        <Transition name="menu-fade">
          <div v-if="isCompanyMenuVisible" class="settings-card">
            <button v-for="item in settingItems" :key="item.label" class="setting-item" :class="{ active: item.active }" @click="handleSettingClick(item)">
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </button>
          </div>
        </Transition>

        <button class="company" type="button" @click.stop="toggleCompanyMenu">
          <span class="avatar"></span>
          <span>十二言星公司</span>
        </button>
      </div>
    </Transition>
  </aside>
</template>

<script setup lang="ts">
import { Cpu, EditPen, MoreFilled, Operation, QuestionFilled, Setting, SwitchButton } from '@element-plus/icons-vue'
import type { ChatRecord } from '../stores/home'

defineProps<{
  chats: ChatRecord[]
  collapsed?: boolean
}>()

const router = useRouter()
const isCompanyMenuVisible = ref(false)
const companyMenuRef = ref<HTMLElement>()

const settingItems = [
  { label: '设置', icon: Setting, active: true },
  { label: '管理后台', icon: Operation },
  { label: '车肆官网', icon: Cpu },
  { label: '问题反馈', icon: QuestionFilled },
  { label: '退出登录', icon: SwitchButton, routeName: 'login' },
]

const handleSettingClick = (item: (typeof settingItems)[number]) => {
  if (item.routeName) {
    router.push({ name: item.routeName })
  }

  isCompanyMenuVisible.value = false
}

const toggleCompanyMenu = () => {
  isCompanyMenuVisible.value = !isCompanyMenuVisible.value
}

const closeCompanyMenu = (event: MouseEvent) => {
  const target = event.target as Node

  if (!companyMenuRef.value?.contains(target)) {
    isCompanyMenuVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeCompanyMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeCompanyMenu)
})
</script>

<style scoped lang="scss">
.sidebar {
  position: relative;
  width: 188px;
  flex: 0 0 188px;
  padding: 12px 11px 88px;
  overflow: hidden;
  background: linear-gradient(180deg, #f6f7f9 0%, #f2f4f7 100%);
  border-right: 1px solid #edf0f4;
  transition: width 0.22s ease, flex-basis 0.22s ease, padding 0.22s ease;

  &.collapsed {
    width: 0;
    flex-basis: 0;
    padding-right: 0;
    padding-left: 0;
    border-right-color: transparent;
  }
}

.sidebar-content {
  width: 166px;
}

.brand-mark {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.brand-circle {
  position: relative;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1.5px solid #121212;
  border-radius: 50%;
  color: #111;
  font-weight: 800;
  transform: rotate(-18deg);

  &::before,
  &::after {
    position: absolute;
    width: 48px;
    height: 1px;
    content: '';
    background: #111;
  }

  &::before {
    transform: rotate(35deg);
  }

  &::after {
    transform: rotate(-52deg);
  }
}

.new-chat.el-button {
  width: 162px;
  height: 26px;
  margin: 0 auto 13px;
  color: var(--blue);
  font-size: 12px;
  font-weight: 700;
  background: #ffffff;
  border: 1px solid #e2e7ef;
  box-shadow: 0 2px 7px rgb(25 40 78 / 10%);
}

.chat-list {
  height: calc(100vh - 258px);
  overflow: hidden;
  font-size: 11px;
}

.date-label {
  margin: 12px 5px 6px;
  color: #a1a8b2;
  font-size: 9px;
}

.chat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 25px;
  padding: 0 7px;
  color: #252a33;
  border-radius: 7px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.active {
    font-weight: 700;
    background: #ffffff;
    box-shadow: inset 0 0 0 1px #e8ecf2;
  }

  &.muted {
    background: #eceeef;
  }
}

.company-menu-wrap {
  position: absolute;
  bottom: 16px;
  left: 16px;
}

.settings-card {
  position: absolute;
  bottom: 41px;
  left: 0;
  width: 91px;
  padding: 6px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 8px 22px rgb(28 43 74 / 13%);
}

.setting-item {
  display: flex;
  align-items: center;
  width: 100%;
  height: 27px;
  gap: 8px;
  padding: 0 9px;
  color: #2f3540;
  font-size: 10px;
  border-radius: 5px;

  &.active {
    background: #f0f1f3;
  }

  .el-icon {
    font-size: 13px;
  }
}

.company {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 150px;
  height: 28px;
  color: #303640;
  font-size: 11px;
}

.avatar {
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  background: #cfcfcf;
  border-radius: 50%;
}

.sidebar-content-enter-active,
.sidebar-content-leave-active,
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.sidebar-content-enter-from,
.sidebar-content-leave-to,
.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

