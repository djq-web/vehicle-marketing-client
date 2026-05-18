<template>
  <main class="calendar-page">
    <button class="back-button" type="button" @click="router.push('/')">
      返回首页
    </button>

    <section class="hero">
      <h1>营销日历看板</h1>
      <div class="underline"></div>
    </section>

    <section class="calendar-layout">
      <aside class="calendar-panel">
        <h2>时 间 选 择</h2>
        <el-date-picker-panel
          v-model="selectedDate"
          class="date-panel"
          type="date"
          :border="false"
        />
      </aside>

      <section class="schedule-panel">
        <header class="schedule-head">
          <span>营销方式</span>
          <span>平台</span>
          <span>账号</span>
          <span>主题</span>
          <span>启动时间</span>
        </header>

        <div class="schedule-list">
          <button
            v-for="item in scheduleItems"
            :key="`${item.account}-${item.title}-${item.time}`"
            class="schedule-card"
            :class="{ active: item.active }"
            type="button"
          >
            <div class="method-cell">
              <span
                class="method-dot"
                :style="{ background: item.color }"
              ></span>
              <span>{{ item.method }}</span>
            </div>
            <span>{{ item.platform }}</span>
            <span>{{ item.account }}</span>
            <span>{{ item.title }}</span>
            <span class="time">{{ item.time }}</span>
          </button>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ElDatePickerPanel } from "element-plus";
import "element-plus/es/components/date-picker-panel/style/css";

const router = useRouter();
const selectedDate = ref(new Date("2026-03-21"));

const scheduleItems = [
  {
    method: "图文营销",
    platform: "公众号",
    account: "吉星高照",
    title: "相约玉龙雪山看流星雨",
    time: "08 : 25",
    color: "#76da21",
  },
  {
    method: "直播营销",
    platform: "抖音",
    account: "吉星高照官方店",
    title: "来直播间寻找你的吉星",
    time: "16 : 00",
    color: "#39b8f3",
  },
  {
    method: "短视频营销",
    platform: "抖音",
    account: "吉星高照-玄元十四",
    title: "你来自哪颗星星",
    time: "12 : 28",
    color: "#39b8f3",
  },
  {
    method: "独立站营销",
    platform: "网站",
    account: "JIXINGGAOZHAO",
    title: "JIXINGGAOZHAO",
    time: "12 : 28",
    color: "#ffb52f",
    active: true,
  },
  {
    method: "图文营销",
    platform: "公众号",
    account: "吉星高照",
    title: "相约玉龙雪山看流星雨",
    time: "08 : 25",
    color: "#76da21",
  },
  {
    method: "直播营销",
    platform: "抖音",
    account: "吉星高照官方店",
    title: "来直播间寻找你的吉星",
    time: "16 : 00",
    color: "#39b8f3",
  },
  {
    method: "短视频营销",
    platform: "抖音",
    account: "吉星高照-玄元十四",
    title: "你来自哪颗星星",
    time: "12 : 28",
    color: "#39b8f3",
  },
  {
    method: "独立站营销",
    platform: "网站",
    account: "JIXINGGAOZHAO",
    title: "JIXINGGAOZHAO",
    time: "12 : 28",
    color: "#ffb52f",
  },
  {
    method: "直播营销",
    platform: "抖音",
    account: "吉星高照官方店",
    title: "来直播间寻找你的吉星",
    time: "16 : 00",
    color: "#39b8f3",
  },
  {
    method: "短视频营销",
    platform: "抖音",
    account: "吉星高照-玄元十四",
    title: "你来自哪颗星星",
    time: "12 : 28",
    color: "#39b8f3",
  },
  {
    method: "独立站营销",
    platform: "网站",
    account: "JIXINGGAOZHAO",
    title: "JIXINGGAOZHAO",
    time: "12 : 28",
    color: "#ffb52f",
  },
];
</script>

<style scoped lang="scss">
.calendar-page {
  position: relative;
  height: 100vh;
  overflow-y: hidden;
  padding: 22px 32px 32px;
  background: #fff;
}

.back-button {
  position: absolute;
  top: 22px;
  left: 32px;
  height: 32px;
  padding: 0 16px;
  color: #1267ff;
  background: #eef5ff;
  border: 1px solid #c8ddff;
  border-radius: 999px;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;

  h1 {
    margin: 0;
    color: #2f333a;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 2px;
  }
}

.underline {
  width: 240px;
  height: 4px;
  margin-top: 8px;
  background: #1267ff;
  border-radius: 999px;
}

.calendar-layout {
  display: grid;
  grid-template-columns: 372px minmax(0, 1fr);
  gap: 34px;
  max-width: 1560px;
  margin: 32px auto 0;
}

.calendar-panel {
  align-self: start;
  padding: 26px 24px 22px;
  background: #fff;
  border: 1px solid #e9edf4;
  border-radius: 26px;
  box-shadow: 0 3px 12px rgb(29 42 66 / 10%);

  h2 {
    margin: 0 0 18px;
    color: #2f333a;
    font-size: 18px;
    font-weight: 800;
    text-align: center;
    letter-spacing: 6px;
  }
}

.date-panel {
  width: 100%;
}

:deep(.el-date-picker-panel) {
  width: 100%;
  background: transparent;
  box-shadow: none;
}

:deep(.el-date-picker-panel__content),
:deep(.el-date-table),
:deep(.el-month-table) {
  width: 100%;
}

:deep(.el-date-picker__header) {
  padding: 6px 4px 16px;
  margin-bottom: 10px;
}

:deep(.el-date-picker__header-label) {
  color: #2f333a;
  font-size: 18px;
  font-weight: 700;
}

:deep(.el-picker-panel__icon-btn) {
  width: 38px;
  height: 38px;
  margin-top: -2px;
  color: #363c46;
  background: #fff;
  border: 1px solid #e8ecf3;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgb(36 49 78 / 10%);
}

:deep(.el-date-table th) {
  color: #9eb8ff;
  font-weight: 500;
}

:deep(.el-date-table td) {
  height: 44px;
}

:deep(.el-date-table td.current:not(.disabled) .el-date-table-cell__text) {
  color: #fff;
  background: #2e72ff;
}

:deep(.el-date-table-cell__text) {
  width: 40px;
  height: 40px;
  line-height: 40px;
  border-radius: 50%;
}

.schedule-panel {
  min-width: 0;
}

.schedule-head {
  display: grid;
  grid-template-columns: 1.1fr 0.8fr 1.5fr 2.2fr 0.7fr;
  align-items: center;
  padding: 0 28px 14px;
  color: #2f333a;
  font-size: 16px;
  font-weight: 800;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 690px;
  padding-right: 8px;
  overflow: auto;
}

.schedule-list::-webkit-scrollbar {
  width: 8px;
}

.schedule-list::-webkit-scrollbar-thumb {
  background: #d5dce8;
  border-radius: 999px;
}

.schedule-card {
  display: grid;
  grid-template-columns: 1.1fr 0.8fr 1.5fr 2.2fr 0.7fr;
  align-items: center;
  min-height: 56px;
  padding: 0 28px;
  color: #2f333a;
  font-size: 14px;
  text-align: left;
  background: #fff;
  border: 1px solid #edf0f4;
  border-radius: 22px;
  box-shadow: 0 3px 12px rgb(29 42 66 / 10%);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 22px rgb(29 42 66 / 13%);
  }

  &.active {
    border-color: #2e72ff;
    box-shadow: 0 0 0 1px #2e72ff, 0 8px 24px rgb(46 114 255 / 16%);
  }
}

.method-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.method-dot {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  border-radius: 50%;
}

.time {
  letter-spacing: 1px;
}
</style>
