<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'
</script>

<template>
  <div class="page-container">
    <el-empty :image-size="200">
      <template #image>
        <el-icon :size="100" color="#909399">
          <Document />
        </el-icon>
      </template>
      <template #description>
        <h2>Prompt 管理</h2>
        <p class="description">创建和管理 Prompt 模板，支持版本控制和分类管理</p>
      </template>
      <el-button type="primary">创建 Prompt</el-button>
    </el-empty>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
}

.description {
  color: #909399;
  margin-top: 8px;
}
</style>
