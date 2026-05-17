<template>
  <section class="composer">
    <div class="placeholder">发消息......输入“@”选择看板、输入“/”选择技能</div>
    <div class="composer-footer">
      <div class="quick-actions">
        <button class="plus">+</button>
        <span>@看板</span>
        <span>/ 任务管理</span>
        <span>/ 战略诊断</span>
        <span>/ 战略拆解</span>
        <span>/ 上传素材</span>
        <span>/ 图文营销</span>
        <span><el-icon><Grid /></el-icon> 更多</span>
      </div>
      <button class="send-button" aria-label="发送">
        <el-icon><Top /></el-icon>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Grid, Top } from '@element-plus/icons-vue'
</script>
