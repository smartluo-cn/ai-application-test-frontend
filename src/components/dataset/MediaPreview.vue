<template>
  <div class="media-preview">
    <!-- 图片预览 -->
    <div v-if="mediaType === 'image'" class="preview-image-wrapper">
      <img
        :src="src"
        :alt="alt"
        class="preview-image"
        @click="showImagePreview = true"
      />
      <el-dialog
        v-model="showImagePreview"
        title="图片预览"
        width="80%"
        top="5vh"
        destroy-on-close
      >
        <img :src="src" :alt="alt" style="width: 100%; height: auto;" />
      </el-dialog>
    </div>

    <!-- 音频播放器 -->
    <div v-else-if="mediaType === 'audio'" class="preview-audio-wrapper">
      <div class="audio-player">
        <div class="audio-icon">
          <el-icon :size="32"><Headset /></el-icon>
        </div>
        <div class="audio-info">
          <div class="audio-name">{{ audioName }}</div>
          <div class="audio-duration" v-if="duration">{{ formatDuration(duration) }}</div>
        </div>
        <div class="audio-controls">
          <el-button
            :icon="isPlaying ? VideoPause : VideoPlay"
            circle
            size="small"
            @click="togglePlay"
          />
          <audio
            ref="audioRef"
            :src="src"
            @timeupdate="handleTimeUpdate"
            @ended="handleEnded"
            @loadedmetadata="handleLoaded"
          />
        </div>
        <div class="audio-progress">
          <el-slider
            v-model="currentTime"
            :max="duration || 100"
            :format-tooltip="formatTooltip"
            @change="handleSeek"
          />
        </div>
      </div>
    </div>

    <!-- 视频播放器 -->
    <div v-else-if="mediaType === 'video'" class="preview-video-wrapper">
      <video
        ref="videoRef"
        :src="src"
        class="preview-video"
        controls
        @loadedmetadata="handleVideoLoaded"
      />
    </div>

    <!-- 文本/其他 -->
    <div v-else class="preview-text-wrapper">
      <el-icon :size="32"><Document /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Headset, VideoPlay, VideoPause, Document } from '@element-plus/icons-vue'

// 图标引用
const Play = VideoPlay
const Pause = VideoPause

const props = defineProps({
  mediaType: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'audio', 'image', 'video'].includes(value),
  },
  src: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '媒体文件',
  },
  audioName: {
    type: String,
    default: '音频文件',
  },
})

// 图片预览
const showImagePreview = ref(false)

// 音频播放器
const audioRef = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

// 视频播放器
const videoRef = ref(null)

// 切换播放状态
const togglePlay = () => {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
  isPlaying.value = !isPlaying.value
}

// 处理时间更新
const handleTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime
  }
}

// 处理播放结束
const handleEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
}

// 处理加载完成
const handleLoaded = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration
  }
}

// 处理视频加载完成
const handleVideoLoaded = () => {
  // 可以在这里获取视频时长等信息
}

// 处理进度跳转
const handleSeek = (value) => {
  if (audioRef.value) {
    audioRef.value.currentTime = value
  }
}

// 格式化时长
const formatDuration = (seconds) => {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

// 格式化进度条提示
const formatTooltip = (value) => {
  return formatDuration(value)
}

// 监听 src 变化，重置播放状态
watch(() => props.src, () => {
  isPlaying.value = false
  currentTime.value = 0
})
</script>

<style scoped>
.media-preview {
  width: 100%;
}

/* 图片预览样式 */
.preview-image-wrapper {
  width: 100%;
}

.preview-image {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.preview-image:hover {
  transform: scale(1.02);
}

/* 音频播放器样式 */
.preview-audio-wrapper {
  padding: 12px;
}

.audio-player {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.audio-player .audio-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #E6A23C 0%, #F56C6C 100%);
  border-radius: 50%;
  color: #fff;
}

.audio-player .audio-info {
  flex: 1;
}

.audio-player .audio-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.audio-player .audio-duration {
  font-size: 12px;
  color: #909399;
}

.audio-player .audio-controls {
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-player .audio-progress {
  width: 100%;
}

/* 视频播放器样式 */
.preview-video-wrapper {
  width: 100%;
}

.preview-video {
  width: 100%;
  max-height: 300px;
  border-radius: 8px;
  background: #000;
}

/* 文本预览样式 */
.preview-text-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #909399;
}
</style>
