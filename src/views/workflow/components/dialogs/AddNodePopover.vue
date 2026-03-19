<template>
  <div
    v-if="visible"
    class="add-node-popover"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
  >
    <div class="popover-header">
      <span>选择节点类型</span>
      <el-icon class="close-icon" @click="$emit('close')"><Close /></el-icon>
    </div>
    <div class="popover-content">
      <template v-for="category in categories" :key="category.key">
        <div
          v-if="getCategoryNodes(category.key).length > 0"
          class="category-section"
        >
          <div class="category-title">{{ category.name }}</div>
          <div class="category-items">
            <div
              v-for="nodeType in getCategoryNodes(category.key)"
              :key="nodeType.type"
              class="popover-node-item"
              @click="$emit('select', nodeType.type)"
            >
              <div
                class="popover-node-icon"
                :style="{
                  background: `${nodeType.color}15`,
                  color: nodeType.color,
                }"
              >
                <el-icon :size="16">
                  <component :is="getIconComponent(nodeType.icon)" />
                </el-icon>
              </div>
              <span class="popover-node-name">{{ nodeType.name }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Close, VideoPlay, CircleCheck, Brush, Timer, Document, Files, EditPen, ChatDotRound, Picture, Crop, DataLine, Film, Microphone, DocumentAdd, Monitor, Connection, Cpu, DataAnalysis, Stopwatch, TrendCharts, Grid } from '@element-plus/icons-vue'
import { nodeCategories, nodeTypes } from '../config/workflowConfig'

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
})

defineEmits(['close', 'select'])

// 图标组件映射
const iconComponents = {
  VideoPlay,
  CircleCheck,
  Brush,
  Timer,
  Document,
  Files,
  EditPen,
  ChatDotRound,
  Picture,
  Crop,
  DataLine,
  Film,
  Microphone,
  DocumentAdd,
  Monitor,
  Connection,
  Cpu,
  DataAnalysis,
  Stopwatch,
  TrendCharts,
  Grid,
}

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconComponents[iconName]
}

// 分类列表
const categories = nodeCategories

// 获取分类下的节点
const getCategoryNodes = (categoryKey) => {
  return nodeTypes.filter((n) => n.category === categoryKey && n.type !== 'start' && n.type !== 'loopBody')
}
</script>

<style scoped>
.add-node-popover {
  position: fixed;
  z-index: 1000;
  width: 400px;
  max-height: 500px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 500;
}

.close-icon {
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
}

.close-icon:hover {
  color: #374151;
}

.popover-content {
  padding: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.category-section {
  margin-bottom: 12px;
}

.category-title {
  font-size: 12px;
  color: #6b7280;
  padding: 4px 8px;
  font-weight: 500;
}

.category-items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 4px;
}

.popover-node-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.popover-node-item:hover {
  background: #f3f4f6;
}

.popover-node-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.popover-node-name {
  font-size: 12px;
  color: #374151;
  text-align: center;
  line-height: 1.3;
}
</style>
