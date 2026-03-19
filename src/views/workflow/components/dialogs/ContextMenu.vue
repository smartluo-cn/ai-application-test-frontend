<template>
  <div
    v-if="visible"
    class="context-menu"
    :style="{ left: `${x}px`, top: `${y}px` }"
  >
    <!-- 节点右键菜单 -->
    <template v-if="node">
      <div class="context-menu-item" @click="$emit('rename')">
        <el-icon><Edit /></el-icon>
        <span>重命名</span>
      </div>
      <div class="context-menu-item" @click="$emit('duplicate')">
        <el-icon><CopyDocument /></el-icon>
        <span>创建副本</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="$emit('autoLayout')">
        <el-icon><Grid /></el-icon>
        <span>调整布局</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item danger" @click="$emit('delete')">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </div>
    </template>

    <!-- 连线右键菜单 -->
    <template v-else-if="connection">
      <div class="context-menu-item" @click="$emit('addNode')">
        <el-icon><Plus /></el-icon>
        <span>添加节点</span>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item danger" @click="$emit('deleteConnection')">
        <el-icon><Delete /></el-icon>
        <span>删除连线</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { Edit, CopyDocument, Delete, Grid, Plus } from '@element-plus/icons-vue'

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  x: {
    type: Number,
    default: 0,
  },
  y: {
    type: Number,
    default: 0,
  },
  node: {
    type: Object,
    default: null,
  },
  connection: {
    type: Object,
    default: null,
  },
})

defineEmits(['rename', 'duplicate', 'autoLayout', 'delete', 'addNode', 'deleteConnection', 'close'])
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 2000;
  min-width: 160px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
  color: #374151;
}

.context-menu-item:hover {
  background: #f3f4f6;
}

.context-menu-item.danger {
  color: #ef4444;
}

.context-menu-item.danger:hover {
  background: #fef2f2;
}

.context-menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}
</style>
