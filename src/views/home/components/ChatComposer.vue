<template>
  <section class="composer">
    <textarea v-model="message" class="message-input" rows="1" placeholder="发消息......输入“@”选择看板、输入“/”选择技能"
      @keydown.enter.exact.prevent="handleSend"></textarea>

    <div class="composer-footer">
      <div class="quick-actions">
        <button class="plus" type="button">+</button>
        <button v-for="action in quickActions" :key="action" class="quick-action" type="button">{{ action }}</button>
        <button class="quick-action more" type="button">
          <el-icon>
            <Grid />
          </el-icon>
          更多
        </button>
      </div>
      <button class="send-button" type="button" aria-label="发送" :disabled="!message.trim()" @click="handleSend">
        <el-icon>
          <Top />
        </el-icon>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Grid, Top } from '@element-plus/icons-vue'

const message = ref('')
const quickActions = ['@看板', '/ 任务管理', '/ 战略诊断', '/ 战略拆解', '/ 上传素材', '/ 图文营销']

const handleSend = () => {
  const content = message.value.trim()

  if (!content) {
    return
  }

  console.log('发送消息：', content)
  message.value = ''
}
</script>

<style scoped lang="scss">
.composer {
  position: absolute;
  right: 28.5%;
  bottom: 27px;
  min-height: 74px;
  padding: 12px 7px 7px 15px;
  background: #ffffff;
  border: 1px solid #98c5ff;
  border-radius: 11px;
  box-shadow: 0 0 0 1px rgb(31 126 255 / 5%), 0 4px 16px rgb(33 118 255 / 25%);
}

.message-input {
  display: block;
  width: 100%;
  height: 34px;
  padding: 0 8px 0 0;
  color: #1f2733;
  font-size: 12px;
  line-height: 20px;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;

  &::placeholder {
    color: #9aa3af;
  }
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-actions {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 2px;
  color: #2f3743;
  font-size: 10px;
  white-space: nowrap;
}

.quick-action {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: inherit;
  font-size: inherit;

  &:hover {
    color: var(--blue);
  }
}

.plus {
  width: 20px;
  height: 20px;
  color: #111827;
  font-size: 18px;
  line-height: 18px;
}

.send-button {
  margin-left: 24px;
  display: grid;
  justify-content: center;
  width: 23px;
  height: 23px;
  place-items: center;
  color: #ffffff;
  background: #1267ff;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgb(18 103 255 / 28%);

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

@media (max-width: 1180px) {
  .composer {
    right: 95px;
  }
}
</style>
