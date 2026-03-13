<template>
  <div class="media-upload-area">
    <div class="upload-header">
      <span class="upload-title">上传文件</span>
      <span class="upload-tip">支持拖拽上传，批量上传</span>
    </div>
    <div
      class="upload-dropzone"
      :class="{ 'is-dragging': isDragging }"
      @dragenter.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        :accept="acceptTypes"
        style="display: none"
        @change="handleFileSelect"
      />
      <div class="dropzone-content">
        <el-icon class="upload-icon" :size="48">
          <Upload />
        </el-icon>
        <div class="dropzone-text">
          <p class="dropzone-title">将文件拖到此处，或<em>点击上传</em></p>
          <p class="dropzone-hint">
            {{ uploadHint }}
          </p>
        </div>
      </div>
    </div>

    <!-- 上传文件列表 -->
    <div v-if="uploadFiles.length > 0" class="upload-files-list">
      <div
        v-for="(file, index) in uploadFiles"
        :key="index"
        class="upload-file-item"
      >
        <div class="file-preview">
          <!-- 根据媒体类型显示预览 -->
          <img
            v-if="mediaType === 'image' && file.preview"
            :src="file.preview"
            class="preview-image"
          />
          <div v-else-if="mediaType === 'audio'" class="preview-audio">
            <el-icon :size="32"><Headset /></el-icon>
            <span class="audio-name">{{ file.name }}</span>
          </div>
          <div v-else-if="mediaType === 'video'" class="preview-video">
            <el-icon :size="32"><VideoCamera /></el-icon>
            <span class="video-name">{{ file.name }}</span>
          </div>
          <div v-else class="preview-text">
            <el-icon :size="32"><Document /></el-icon>
          </div>
        </div>
        <div class="file-info">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-meta">
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
            <span v-if="file.duration" class="file-duration">{{ formatDuration(file.duration) }}</span>
          </div>
        </div>
        <div class="file-progress" v-if="file.uploading">
          <el-progress :percentage="file.progress" :stroke-width="4" />
        </div>
        <div class="file-actions">
          <el-button
            type="danger"
            size="small"
            :icon="Delete"
            circle
            @click="removeFile(index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Upload, Headset, VideoCamera, Document, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  mediaType: {
    type: String,
    default: 'image',
    validator: (value) => ['text', 'audio', 'image', 'video'].includes(value),
  },
  maxFiles: {
    type: Number,
    default: 100,
  },
  maxSize: {
    type: Number,
    default: 100, // MB
  },
})

const emit = defineEmits(['upload', 'remove'])

// 拖拽状态
const isDragging = ref(false)

// 上传文件列表
const uploadFiles = ref([])

// 计算接受的文件类型
const acceptTypes = computed(() => {
  const typeMap = {
    image: 'image/jpeg,image/png,image/gif,image/webp',
    audio: 'audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/ogg',
    video: 'video/mp4,video/webm,video/ogg,video/quicktime',
    text: 'text/plain,application/json,application/xml',
  }
  return typeMap[props.mediaType] || '*/*'
})

// 上传提示
const uploadHint = computed(() => {
  const hintMap = {
    image: '支持 JPG、PNG、GIF、WebP 格式，单文件最大 5MB',
    audio: '支持 MP3、WAV、M4A、OGG 格式，单文件最大 20MB',
    video: '支持 MP4、WebM、MOV 格式，单文件最大 100MB',
    text: '支持 TXT、JSON、XML 格式',
  }
  return hintMap[props.mediaType] || ''
})

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 格式化时长
const formatDuration = (seconds) => {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

// 触发文件选择
const triggerFileInput = () => {
  const input = document.querySelector('input[type="file"]')
  if (input) input.click()
}

// 处理文件选择
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files || [])
  processFiles(files)
  event.target.value = '' // 重置 input
}

// 处理拖拽文件
const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  processFiles(files)
}

// 处理文件
const processFiles = (files) => {
  if (uploadFiles.value.length + files.length > props.maxFiles) {
    ElMessage.warning(`最多只能上传 ${props.maxFiles} 个文件`)
    return
  }

  files.forEach((file) => {
    // 检查文件大小
    const maxSizeBytes = props.maxSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      ElMessage.error(`文件 ${file.name} 超过最大限制 ${props.maxSize}MB`)
      return
    }

    // 创建文件对象
    const fileObj = {
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      progress: 0,
      uploading: false,
      preview: null,
      duration: null,
    }

    // 生成预览
    if (props.mediaType === 'image') {
      const reader = new FileReader()
      reader.onload = (e) => {
        fileObj.preview = e.target?.result
      }
      reader.readAsDataURL(file)
    } else if (props.mediaType === 'audio' || props.mediaType === 'video') {
      // 获取时长
      const url = URL.createObjectURL(file)
      const media = document.createElement(props.mediaType === 'audio' ? 'audio' : 'video')
      media.src = url
      media.onloadedmetadata = () => {
        fileObj.duration = media.duration
        URL.revokeObjectURL(url)
      }
    }

    uploadFiles.value.push(fileObj)
  })

  // 模拟上传进度
  simulateUpload()
}

// 模拟上传进度（实际项目中应调用真实API）
const simulateUpload = () => {
  uploadFiles.value.forEach((file) => {
    if (!file.uploading) {
      file.uploading = true
      const interval = setInterval(() => {
        file.progress += Math.random() * 20
        if (file.progress >= 100) {
          file.progress = 100
          file.uploading = false
          clearInterval(interval)
          emit('upload', file)
        }
      }, 200)
    }
  })
}

// 移除文件
const removeFile = (index) => {
  const file = uploadFiles.value[index]
  uploadFiles.value.splice(index, 1)
  emit('remove', file)
}

// 暴露方法
defineExpose({
  getFiles: () => uploadFiles.value,
  clearFiles: () => {
    uploadFiles.value = []
  },
})
</script>

<style scoped>
.media-upload-area {
  margin-bottom: 24px;
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.upload-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.upload-tip {
  font-size: 13px;
  color: #909399;
}

.upload-dropzone {
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.upload-dropzone:hover,
.upload-dropzone.is-dragging {
  border-color: #409eff;
  background: #f0f7ff;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  color: #c0c4cc;
  margin-bottom: 12px;
}

.dropzone-title {
  font-size: 14px;
  color: #606266;
  margin: 0 0 8px 0;
}

.dropzone-title em {
  color: #409eff;
  font-style: normal;
}

.dropzone-hint {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.upload-files-list {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.upload-file-item {
  position: relative;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.file-preview {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-audio,
.preview-video,
.preview-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #909399;
}

.audio-name,
.video-name {
  font-size: 11px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-info {
  padding: 8px;
}

.file-name {
  font-size: 12px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.file-progress {
  padding: 0 8px 8px;
}

.file-actions {
  position: absolute;
  top: 4px;
  right: 4px;
}
</style>
