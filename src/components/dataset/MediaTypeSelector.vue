<template>
  <div class="media-type-selector">
    <div
      v-for="option in mediaOptions"
      :key="option.value"
      class="media-type-card"
      :class="{ active: modelValue === option.value }"
      :style="{ '--theme-color': option.color }"
      @click="handleSelect(option.value)"
    >
      <div class="media-icon" :style="{ background: modelValue === option.value ? option.color : '#f0f2f5' }">
        <el-icon :size="28" :color="modelValue === option.value ? '#fff' : '#606266'">
          <component :is="getIconComponent(option.icon)" />
        </el-icon>
      </div>
      <div class="media-info">
        <div class="media-label">{{ option.label }}</div>
        <div class="media-desc">{{ option.desc }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Document, Headset, Picture, VideoCamera } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'audio', 'image', 'video'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

// 媒体类型选项配置
const mediaOptions = [
  { value: 'text', label: '文本', icon: 'Document', color: '#67C23A', desc: '文本类测评数据' },
  { value: 'audio', label: '语音', icon: 'Headset', color: '#E6A23C', desc: '语音文件测评数据' },
  { value: 'image', label: '图片', icon: 'Picture', color: '#409EFF', desc: '图片文件测评数据' },
  { value: 'video', label: '视频', icon: 'VideoCamera', color: '#F56C6C', desc: '视频文件测评数据' },
]

// 获取图标组件
const getIconComponent = (iconName) => {
  const iconMap = {
    Document,
    Headset,
    Picture,
    VideoCamera,
  }
  return iconMap[iconName] || Document
}

// 处理选择
const handleSelect = (value) => {
  if (props.disabled) return
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.media-type-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  width: 100%;
}

.media-type-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafafa;
}

.media-type-card:hover:not(.active) {
  border-color: var(--theme-color, #409eff);
  background: #fff;
}

.media-type-card.active {
  border-color: var(--theme-color, #409eff);
  background: linear-gradient(to bottom, rgba(64, 158, 255, 0.05), rgba(64, 158, 255, 0.1));
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.media-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.media-info {
  text-align: center;
}

.media-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.media-desc {
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* 禁用状态 */
.media-type-card[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
