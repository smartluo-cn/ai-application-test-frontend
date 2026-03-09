<script setup>
import { ref, nextTick, computed } from 'vue'
import { ChatDotRound, Close, Position } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:visible', 'close'])

const isOpen = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const inputMessage = ref('')
const messagesContainer = ref(null)
const isTyping = ref(false)

// 消息列表
const messages = ref([
  {
    id: 1,
    type: 'ai',
    content: '你好！我是AI助手，有什么可以帮助你的吗？',
    time: new Date(),
  },
])

// 预设的AI回复
const aiReplies = [
  '这是一个很好的问题！让我来帮你分析一下。',
  '我理解你的需求。根据你的描述，我建议...',
  '好的，我已经收到你的消息了。请问还有什么需要补充的吗？',
  '这个问题很有趣！从技术角度来看...',
  '感谢你的提问。我可以为你提供以下建议...',
  '明白了，让我帮你处理这个需求。',
]

// 获取随机AI回复
const getRandomReply = () => {
  const index = Math.floor(Math.random() * aiReplies.length)
  return aiReplies[index]
}

// 格式化时间
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  // 添加用户消息
  const userMessage = {
    id: Date.now(),
    type: 'user',
    content: inputMessage.value.trim(),
    time: new Date(),
  }
  messages.value.push(userMessage)
  inputMessage.value = ''
  await scrollToBottom()

  // 模拟AI正在输入
  isTyping.value = true

  // 模拟AI延迟回复
  setTimeout(async () => {
    isTyping.value = false
    const aiMessage = {
      id: Date.now() + 1,
      type: 'ai',
      content: getRandomReply(),
      time: new Date(),
    }
    messages.value.push(aiMessage)
    await scrollToBottom()
  }, 1000 + Math.random() * 1000)
}

// 关闭聊天框
const handleClose = () => {
  emit('close')
  isOpen.value = false
}

// 处理回车发送
const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="chat-fade">
      <div v-if="isOpen" class="ai-chat-container">
        <div class="chat-header">
          <div class="header-left">
            <div class="ai-avatar">
              <el-icon :size="20"><ChatDotRound /></el-icon>
            </div>
            <div class="header-info">
              <span class="header-title">AI助手</span>
              <span class="header-status">在线</span>
            </div>
          </div>
          <el-button class="close-btn" text @click="handleClose">
            <el-icon :size="20"><Close /></el-icon>
          </el-button>
        </div>

        <div ref="messagesContainer" class="chat-messages">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message-item"
            :class="message.type"
          >
            <div v-if="message.type === 'ai'" class="message-avatar ai">
              <el-icon :size="16"><ChatDotRound /></el-icon>
            </div>
            <div class="message-content">
              <div class="message-bubble">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.time) }}</div>
            </div>
            <div v-if="message.type === 'user'" class="message-avatar user">
              <span>我</span>
            </div>
          </div>

          <!-- 正在输入提示 -->
          <div v-if="isTyping" class="message-item ai">
            <div class="message-avatar ai">
              <el-icon :size="16"><ChatDotRound /></el-icon>
            </div>
            <div class="message-content">
              <div class="message-bubble typing">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="1"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="输入消息..."
            resize="none"
            @keydown="handleKeydown"
          />
          <el-button
            type="primary"
            :icon="Position"
            circle
            :disabled="!inputMessage.trim()"
            @click="sendMessage"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ai-chat-container {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 380px;
  height: 520px;
  background: #fff;
  border-radius: 16px;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2000;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.header-status {
  font-size: 12px;
  opacity: 0.85;
}

.close-btn {
  color: #fff !important;
  opacity: 0.8;
}

.close-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1) !important;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f8fafc;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
}

.message-avatar.ai {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
}

.message-avatar.user {
  background: #10b981;
  color: #fff;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 70%;
}

.message-item.user .message-content {
  align-items: flex-end;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.message-item.ai .message-bubble {
  background: #fff;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-top-left-radius: 4px;
}

.message-item.user .message-bubble {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  border-top-right-radius: 4px;
}

.message-time {
  font-size: 11px;
  color: #9ca3af;
  padding: 0 4px;
}

/* 正在输入动画 */
.message-bubble.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.chat-input {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
}

.chat-input :deep(.el-textarea__inner) {
  border-radius: 12px;
  border-color: #e5e7eb;
  padding: 10px 14px;
  font-size: 14px;
}

.chat-input :deep(.el-textarea__inner:focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.chat-input :deep(.el-button.is-circle) {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
}

/* 过渡动画 */
.chat-fade-enter-active,
.chat-fade-leave-active {
  transition: all 0.3s ease;
}

.chat-fade-enter-from,
.chat-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
