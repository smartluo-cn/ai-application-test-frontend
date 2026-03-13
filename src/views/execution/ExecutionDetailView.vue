<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  VideoPlay,
  VideoPause,
  Refresh,
  Setting,
  Document,
  Timer,
  CircleCheck,
  CircleClose,
  DataAnalysis,
  Plus,
  Delete,
  Edit,
  Cpu,
  DataLine,
  TrendCharts,
  Monitor,
  Collection,
  Rank,
  ZoomIn,
  ZoomOut,
  FullScreen,
  Search,
  Close,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 当前任务ID
const taskId = computed(() => route.params.id)

// 插件类型定义
const PLUGIN_TYPES = {
  DATA_PROCESSING: 'data-processing',
  TEST_EXECUTION: 'test-execution',
  RESULT_EVALUATION: 'result-evaluation',
  METRIC_COLLECTION: 'metric-collection',
}

// 简化的插件类型配置 - 统一配色方案
const pluginTypeConfig = {
  [PLUGIN_TYPES.DATA_PROCESSING]: {
    label: '数据处理',
    icon: DataLine,
    color: '#6366f1', // Indigo
    gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    allowedNextTypes: [PLUGIN_TYPES.DATA_PROCESSING, PLUGIN_TYPES.TEST_EXECUTION, PLUGIN_TYPES.RESULT_EVALUATION, PLUGIN_TYPES.METRIC_COLLECTION],
  },
  [PLUGIN_TYPES.TEST_EXECUTION]: {
    label: '测试执行',
    icon: Cpu,
    color: '#10b981', // Emerald
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    allowedNextTypes: [PLUGIN_TYPES.DATA_PROCESSING, PLUGIN_TYPES.RESULT_EVALUATION, PLUGIN_TYPES.METRIC_COLLECTION],
  },
  [PLUGIN_TYPES.RESULT_EVALUATION]: {
    label: '结果评估',
    icon: TrendCharts,
    color: '#f59e0b', // Amber
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    allowedNextTypes: [PLUGIN_TYPES.DATA_PROCESSING],
  },
  [PLUGIN_TYPES.METRIC_COLLECTION]: {
    label: '指标采集',
    icon: Monitor,
    color: '#8b5cf6', // Violet
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    allowedNextTypes: [PLUGIN_TYPES.DATA_PROCESSING, PLUGIN_TYPES.TEST_EXECUTION, PLUGIN_TYPES.RESULT_EVALUATION, PLUGIN_TYPES.METRIC_COLLECTION],
    requiredPrevType: PLUGIN_TYPES.TEST_EXECUTION,
  },
}

// 可用插件列表
const availablePlugins = ref([
  { id: 'dp-1', name: '数据预处理', type: PLUGIN_TYPES.DATA_PROCESSING, description: '清洗和标准化处理输入数据', tags: ['数据处理', '清洗'], source: 'system', params: [{ name: 'remove_html', type: 'boolean', default: 'true', description: '移除HTML标签' }] },
  { id: 'dp-2', name: 'JSON提取', type: PLUGIN_TYPES.DATA_PROCESSING, description: '从JSON中提取指定路径数据', tags: ['数据处理', 'JSON'], source: 'custom', params: [{ name: 'path', type: 'string', default: '', description: '数据路径' }] },
  { id: 'dp-3', name: '敏感词过滤', type: PLUGIN_TYPES.DATA_PROCESSING, description: '检测并过滤敏感词汇', tags: ['数据处理', '安全'], source: 'system', params: [{ name: 'words', type: 'string', default: '', description: '敏感词列表' }] },
  { id: 'te-1', name: 'HTTP请求', type: PLUGIN_TYPES.TEST_EXECUTION, description: '执行HTTP API调用测试', tags: ['测试执行', 'API'], source: 'custom', params: [{ name: 'method', type: 'string', default: 'GET', description: '请求方法' }, { name: 'timeout', type: 'number', default: '30', description: '超时时间' }] },
  { id: 'te-2', name: '对话测试', type: PLUGIN_TYPES.TEST_EXECUTION, description: '执行多轮对话测试', tags: ['测试执行', '对话'], source: 'system', params: [{ name: 'max_turns', type: 'number', default: '10', description: '最大轮数' }] },
  { id: 'te-3', name: '文本生成', type: PLUGIN_TYPES.TEST_EXECUTION, description: '文本生成能力测试', tags: ['测试执行', '生成'], source: 'system', params: [{ name: 'max_tokens', type: 'number', default: '512', description: '最大Token数' }] },
  { id: 're-1', name: '准确率评估', type: PLUGIN_TYPES.RESULT_EVALUATION, description: '评估测试结果准确率', tags: ['结果评估', '准确率'], source: 'system', params: [{ name: 'mode', type: 'string', default: 'exact', description: '匹配模式' }] },
  { id: 're-2', name: '相似度评估', type: PLUGIN_TYPES.RESULT_EVALUATION, description: '评估内容相似度', tags: ['结果评估', '相似度'], source: 'custom', params: [{ name: 'threshold', type: 'number', default: '0.8', description: '相似度阈值' }] },
  { id: 'mc-1', name: '性能采集', type: PLUGIN_TYPES.METRIC_COLLECTION, description: '采集响应时间等性能指标', tags: ['指标采集', '性能'], source: 'system', params: [{ name: 'interval', type: 'number', default: '1000', description: '采样间隔' }] },
  { id: 'mc-2', name: '资源监控', type: PLUGIN_TYPES.METRIC_COLLECTION, description: '监控CPU内存等资源', tags: ['指标采集', '资源'], source: 'system', params: [{ name: 'duration', type: 'number', default: '60', description: '监控时长' }] },
])

// 画布相关状态
const canvasRef = ref(null)
const canvasScale = ref(1)
const canvasOffset = reactive({ x: 0, y: 0 })
const isDraggingCanvas = ref(false)
const dragStartPos = reactive({ x: 0, y: 0 })

// 流程节点 - 每个节点有位置信息
const flowNodes = ref({})
const headNodeId = ref(null)
const nodePositions = reactive({}) // 存储节点位置

// 画布尺寸
const canvasWidth = ref(2000)
const canvasHeight = ref(1200)

// 任务数据
const task = ref({
  id: 'task-6',
  name: '智能翻译系统 - 文学翻译质量测试',
  environment: '智能翻译系统',
  dataset: '文学翻译测试集',
  status: 'pending',
  progress: 0,
  totalCases: 50,
  completedCases: 0,
  passedCases: 0,
  failedCases: 0,
  startTime: null,
  endTime: null,
  duration: '-',
  executor: '李四',
  description: '测试智能翻译系统的文学翻译质量',
})

const taskData = {
  'task-1': { id: 'task-1', name: '智能客服系统 - 意图识别测试', environment: '智能客服系统', dataset: '客服对话数据集 v2.0', status: 'running', progress: 65, totalCases: 500, completedCases: 325, passedCases: 310, failedCases: 15, startTime: '2024-03-01 14:30:00', endTime: null, duration: '00:32:15', executor: '张三', description: '测试智能客服系统的意图识别能力' },
  'task-2': { id: 'task-2', name: '文档问答系统 - RAG检索测试', environment: '文档问答系统', dataset: '文档问答测试集', status: 'completed', progress: 100, totalCases: 200, completedCases: 200, passedCases: 185, failedCases: 15, startTime: '2024-03-01 10:00:00', endTime: '2024-03-01 10:45:30', duration: '00:45:30', executor: '李四', description: '测试文档问答系统的RAG检索效果' },
  'task-6': { id: 'task-6', name: '智能翻译系统 - 文学翻译质量测试', environment: '智能翻译系统', dataset: '文学翻译测试集', status: 'pending', progress: 0, totalCases: 50, completedCases: 0, passedCases: 0, failedCases: 0, startTime: null, endTime: null, duration: '-', executor: '李四', description: '测试智能翻译系统的文学翻译质量' },
}

// 当前标签页
const activeTab = ref('flow')

// 获取有序节点列表
const orderedNodes = computed(() => {
  const result = []
  let currentId = headNodeId.value
  while (currentId) {
    const node = flowNodes.value[currentId]
    if (node) {
      result.push(node)
      currentId = node.nextId
    } else {
      break
    }
  }
  return result
})

// 计算连接线路径（贝塞尔曲线）
const connectionPaths = computed(() => {
  const paths = []
  const nodes = orderedNodes.value

  // 开始节点位置（固定）
  const startNodeX = 70 // 开始节点右侧
  const startNodeY = 320 // 开始节点中心

  // 结束节点位置（动态计算）- 卡片宽度260px + 间距40px
  const endNodeX = Math.max(...Object.values(nodePositions).map(p => p.x + 300), 200) + 20
  const endNodeY = 320 // 结束节点中心

  // 如果有节点，添加开始节点到第一个插件的连接线
  if (nodes.length > 0) {
    const firstNode = nodes[0]
    const firstPos = nodePositions[firstNode.id]
    if (firstPos) {
      const endX = firstPos.x
      const endY = firstPos.y + 55
      const controlX1 = startNodeX + Math.abs(endX - startNodeX) * 0.5
      const controlX2 = startNodeX + Math.abs(endX - startNodeX) * 0.5
      const path = `M ${startNodeX} ${startNodeY} C ${controlX1} ${startNodeY}, ${controlX2} ${endY}, ${endX} ${endY}`
      paths.push({ path, color: '#64748b' }) // 灰色，表示开始
    }
  }

  // 插件之间的连接线
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const pos = nodePositions[node.id]
    if (!pos) continue

    const startX = pos.x + 260 // 节点宽度260px
    const startY = pos.y + 55  // 节点中心高度

    if (i < nodes.length - 1) {
      const nextNode = nodes[i + 1]
      const nextPos = nodePositions[nextNode.id]
      if (nextPos) {
        const endX = nextPos.x
        const endY = nextPos.y + 55
        const controlX1 = startX + Math.abs(endX - startX) * 0.5
        const controlX2 = startX + Math.abs(endX - startX) * 0.5
        const path = `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`
        paths.push({ path, color: pluginTypeConfig[node.pluginType].color })
      }
    }
  }

  // 如果有节点，添加最后一个插件到结束节点的连接线
  if (nodes.length > 0) {
    const lastNode = nodes[nodes.length - 1]
    const lastPos = nodePositions[lastNode.id]
    if (lastPos) {
      const startX = lastPos.x + 260
      const startY = lastPos.y + 55
      const controlX1 = startX + Math.abs(endNodeX - startX) * 0.5
      const controlX2 = startX + Math.abs(endNodeX - startX) * 0.5
      const path = `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endNodeY}, ${endNodeX} ${endNodeY}`
      paths.push({ path, color: pluginTypeConfig[lastNode.pluginType].color })
    }
  }

  return paths
})

// 拖拽节点相关
const draggedNodeId = ref(null)
const dragOffset = reactive({ x: 0, y: 0 })

// 开始拖拽节点
const startDragNode = (e, nodeId) => {
  e.preventDefault()
  draggedNodeId.value = nodeId
  const pos = nodePositions[nodeId]
  const rect = canvasRef.value.getBoundingClientRect()
  dragOffset.x = e.clientX - rect.left - pos.x + canvasOffset.x
  dragOffset.y = e.clientY - rect.top - pos.y + canvasOffset.y

  document.addEventListener('mousemove', onDragNode)
  document.addEventListener('mouseup', stopDragNode)
}

// 拖拽节点
const onDragNode = (e) => {
  if (!draggedNodeId.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const x = (e.clientX - rect.left - dragOffset.x + canvasOffset.x) / canvasScale.value
  const y = (e.clientY - rect.top - dragOffset.y + canvasOffset.y) / canvasScale.value

  // 限制在画布范围内
  nodePositions[draggedNodeId.value] = {
    x: Math.max(0, Math.min(canvasWidth.value - 160, x)),
    y: Math.max(0, Math.min(canvasHeight.value - 100, y))
  }
}

// 停止拖拽节点
const stopDragNode = () => {
  draggedNodeId.value = null
  document.removeEventListener('mousemove', onDragNode)
  document.removeEventListener('mouseup', stopDragNode)
}

// 画布拖拽
const startDragCanvas = (e) => {
  if (e.target !== canvasRef.value) return
  isDraggingCanvas.value = true
  dragStartPos.x = e.clientX - canvasOffset.x
  dragStartPos.y = e.clientY - canvasOffset.y
}

const onDragCanvas = (e) => {
  if (!isDraggingCanvas.value) return
  canvasOffset.x = e.clientX - dragStartPos.x
  canvasOffset.y = e.clientY - dragStartPos.y
}

const stopDragCanvas = () => {
  isDraggingCanvas.value = false
}

// 缩放控制
const zoomIn = () => {
  canvasScale.value = Math.min(1.5, canvasScale.value + 0.1)
}

const zoomOut = () => {
  canvasScale.value = Math.max(0.5, canvasScale.value - 0.1)
}

const resetZoom = () => {
  canvasScale.value = 1
  canvasOffset.x = 0
  canvasOffset.y = 0
}

// 添加节点对话框
const addNodeDialogVisible = ref(false)
const currentAddingAfterNodeId = ref(null)
const selectedPluginType = ref(null)
const selectedPluginId = ref(null)
const searchKeyword = ref('')

// 过滤插件
const filteredPluginsForAdd = computed(() => {
  let plugins = availablePlugins.value
  if (selectedPluginType.value) {
    plugins = plugins.filter(p => p.type === selectedPluginType.value)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    plugins = plugins.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.description.toLowerCase().includes(keyword) ||
      p.tags.some(t => t.toLowerCase().includes(keyword))
    )
  }
  return plugins
})

// 获取允许的插件类型
const allowedTypesForAdd = computed(() => {
  if (currentAddingAfterNodeId.value === null) {
    return Object.keys(pluginTypeConfig)
  }
  const prevNode = flowNodes.value[currentAddingAfterNodeId.value]
  if (!prevNode) return []
  const config = pluginTypeConfig[prevNode.pluginType]
  return (config?.allowedNextTypes || []).filter(type => {
    const typeConfig = pluginTypeConfig[type]
    if (typeConfig.requiredPrevType) {
      return prevNode.pluginType === typeConfig.requiredPrevType
    }
    return true
  })
})

// 打开添加对话框
const openAddNodeDialog = (afterNodeId) => {
  currentAddingAfterNodeId.value = afterNodeId
  selectedPluginType.value = null
  selectedPluginId.value = null
  searchKeyword.value = ''
  addNodeDialogVisible.value = true
}

// 获取插件信息
const getPluginById = (pluginId) => availablePlugins.value.find(p => p.id === pluginId)

// 计算新节点位置 - 卡片宽度260px + 按钮间距40px
const calculateNewNodePosition = (afterNodeId) => {
  if (afterNodeId === null) {
    return { x: 100, y: 285 }
  }
  const prevPos = nodePositions[afterNodeId]
  if (!prevPos) return { x: 100, y: 285 }
  return { x: prevPos.x + 300, y: prevPos.y }
}

// 确认添加节点
const confirmAddNode = () => {
  if (!selectedPluginId.value) {
    ElMessage.warning('请选择插件')
    return
  }

  const plugin = getPluginById(selectedPluginId.value)
  if (!plugin) return

  const defaultParams = {}
  if (plugin.params) {
    plugin.params.forEach(p => { defaultParams[p.name] = p.default })
  }

  const newNodeId = `node-${Date.now()}`
  const newNode = {
    id: newNodeId,
    pluginId: plugin.id,
    pluginName: plugin.name,
    pluginType: plugin.type,
    pluginDescription: plugin.description,
    pluginTags: plugin.tags,
    pluginSource: plugin.source,
    params: defaultParams,
    nextId: null,
  }

  // 设置节点位置
  const pos = calculateNewNodePosition(currentAddingAfterNodeId.value)
  nodePositions[newNodeId] = pos

  flowNodes.value[newNodeId] = newNode

  if (currentAddingAfterNodeId.value === null) {
    headNodeId.value = newNodeId
  } else {
    const prevNode = flowNodes.value[currentAddingAfterNodeId.value]
    if (prevNode) {
      newNode.nextId = prevNode.nextId
      prevNode.nextId = newNodeId
    }
  }

  addNodeDialogVisible.value = false
  ElMessage.success('插件添加成功')
}

// 删除节点
const deleteNode = (nodeId) => {
  ElMessageBox.confirm('确定要删除此插件吗？', '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const node = flowNodes.value[nodeId]
    if (!node) return

    if (headNodeId.value === nodeId) {
      headNodeId.value = node.nextId
    } else {
      for (const id in flowNodes.value) {
        if (flowNodes.value[id].nextId === nodeId) {
          flowNodes.value[id].nextId = node.nextId
          break
        }
      }
    }

    delete flowNodes.value[nodeId]
    delete nodePositions[nodeId]
    ElMessage.success('插件已删除')
  }).catch(() => {})
}

// 编辑参数对话框
const editNodeDialogVisible = ref(false)
const currentEditingNode = ref(null)
const currentEditingPluginDef = ref(null)
const editFormData = reactive({})

const openEditNodeDialog = (nodeId) => {
  const node = flowNodes.value[nodeId]
  if (!node) return
  currentEditingNode.value = node
  currentEditingPluginDef.value = getPluginById(node.pluginId)
  Object.keys(editFormData).forEach(key => delete editFormData[key])
  Object.assign(editFormData, JSON.parse(JSON.stringify(node.params)))
  editNodeDialogVisible.value = true
}

const confirmEditNode = () => {
  if (currentEditingNode.value) {
    Object.assign(currentEditingNode.value.params, JSON.parse(JSON.stringify(editFormData)))
  }
  editNodeDialogVisible.value = false
  ElMessage.success('参数已保存')
}

// 工具函数
const getPluginTypeConfig = (type) => pluginTypeConfig[type] || {}
const getStatusType = (status) => ({ pending: 'info', running: 'primary', paused: 'warning', completed: 'success', failed: 'danger' }[status] || 'info')
const getStatusText = (status) => ({ pending: '等待执行', running: '执行中', paused: '已暂停', completed: '已完成', failed: '执行失败' }[status] || status)
const goBack = () => router.push({ name: 'execution' })

// 初始化
onMounted(() => {
  const id = taskId.value
  if (id && taskData[id]) {
    task.value = taskData[id]
  }

  // 添加画布事件监听
  document.addEventListener('mousemove', onDragCanvas)
  document.addEventListener('mouseup', stopDragCanvas)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDragCanvas)
  document.removeEventListener('mouseup', stopDragCanvas)
  document.removeEventListener('mousemove', onDragNode)
  document.removeEventListener('mouseup', stopDragNode)
})
</script>

<template>
  <div class="execution-detail-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="goBack" text class="back-btn">返回</el-button>
        <div class="header-divider"></div>
        <h1 class="header-title">{{ task.name }}</h1>
        <span class="status-badge" :class="task.status">{{ getStatusText(task.status) }}</span>
      </div>
      <div class="header-actions">
        <template v-if="task.status === 'running'">
          <el-button class="action-btn" :icon="VideoPause">暂停</el-button>
          <el-button class="action-btn danger">停止</el-button>
        </template>
        <template v-if="task.status === 'completed' || task.status === 'failed'">
          <el-button class="action-btn primary" :icon="Refresh">重新执行</el-button>
          <el-button class="action-btn" :icon="DataAnalysis">查看报告</el-button>
        </template>
      </div>
    </header>

    <!-- 基本信息栏 -->
    <div class="info-bar">
      <div class="info-item">
        <span class="info-label">环境</span>
        <span class="info-value">{{ task.environment }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">数据集</span>
        <span class="info-value">{{ task.dataset }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">执行人</span>
        <span class="info-value">{{ task.executor }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">描述</span>
        <span class="info-value">{{ task.description || '-' }}</span>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 标签页导航 -->
      <div class="tab-nav">
        <button
          v-for="tab in [{ key: 'flow', label: '任务流程' }, { key: 'logs', label: '执行日志' }]"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 任务流程画布 -->
      <div v-show="activeTab === 'flow'" class="flow-workspace">
        <!-- 工具栏 -->
        <div class="canvas-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-title">流程画布</span>
            <div class="toolbar-hint">拖拽卡片调整位置</div>
          </div>
          <div class="toolbar-right">
            <button class="tool-btn" @click="zoomOut" title="缩小">
              <el-icon><ZoomOut /></el-icon>
            </button>
            <span class="zoom-level">{{ Math.round(canvasScale * 100) }}%</span>
            <button class="tool-btn" @click="zoomIn" title="放大">
              <el-icon><ZoomIn /></el-icon>
            </button>
            <button class="tool-btn" @click="resetZoom" title="重置">
              <el-icon><FullScreen /></el-icon>
            </button>
            <div class="toolbar-divider"></div>
            <button class="add-node-btn" @click="openAddNodeDialog(null)">
              <el-icon><Plus /></el-icon>
              添加插件
            </button>
          </div>
        </div>

        <!-- 画布区域 -->
        <div class="canvas-wrapper">
          <div
            ref="canvasRef"
            class="canvas"
            :style="{
              width: canvasWidth + 'px',
              height: canvasHeight + 'px',
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
            }"
            @mousedown="startDragCanvas"
          >
            <!-- 网格背景 -->
            <svg class="canvas-grid" width="100%" height="100%">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" stroke-width="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            <!-- 连接线 SVG 层 -->
            <svg class="connections-layer" width="100%" height="100%">
              <defs>
                <linearGradient v-for="(config, type) in pluginTypeConfig" :key="type" :id="`gradient-${type}`" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" :stop-color="config.color" stop-opacity="0.8"/>
                  <stop offset="100%" :stop-color="config.color" stop-opacity="0.4"/>
                </linearGradient>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#94a3b8"/>
                </marker>
              </defs>
              <!-- 绘制贝塞尔曲线连接 -->
              <path
                v-for="(conn, index) in connectionPaths"
                :key="index"
                :d="conn.path"
                fill="none"
                :stroke="conn.color"
                stroke-width="2"
                stroke-linecap="round"
                class="connection-path"
                marker-end="url(#arrow)"
              />
            </svg>

            <!-- 开始节点 -->
            <div
              class="terminal-node start"
              :style="{ left: '30px', top: '300px' }"
            >
              <div class="terminal-icon">
                <el-icon><VideoPlay /></el-icon>
              </div>
              <span>开始</span>
            </div>

            <!-- 插件节点 -->
            <div
              v-for="(node, index) in orderedNodes"
              :key="node.id"
              class="flow-card"
              :class="{ dragging: draggedNodeId === node.id }"
              :style="{
                left: (nodePositions[node.id]?.x || 0) + 'px',
                top: (nodePositions[node.id]?.y || 0) + 'px',
              }"
              @mousedown.stop="startDragNode($event, node.id)"
            >
              <!-- 节点类型指示器 -->
              <div class="card-type-indicator" :style="{ background: getPluginTypeConfig(node.pluginType).gradient }"></div>

              <!-- 节点内容 -->
              <div class="card-content">
                <!-- 头部 -->
                <div class="card-header">
                  <div class="card-icon" :style="{ background: getPluginTypeConfig(node.pluginType).gradient }">
                    <component :is="getPluginTypeConfig(node.pluginType).icon" />
                  </div>
                  <div class="card-title-area">
                    <h3 class="card-title">{{ node.pluginName }}</h3>
                    <span class="card-type">{{ getPluginTypeConfig(node.pluginType).label }}</span>
                  </div>
                  <div class="card-actions">
                    <button class="card-action-btn" @click.stop="openEditNodeDialog(node.id)" title="配置参数">
                      <el-icon><Setting /></el-icon>
                    </button>
                    <button class="card-action-btn delete" @click.stop="deleteNode(node.id)" title="删除">
                      <el-icon><Delete /></el-icon>
                    </button>
                  </div>
                </div>

                <!-- 描述 -->
                <p class="card-desc">{{ node.pluginDescription }}</p>

                <!-- 标签 -->
                <div class="card-tags">
                  <span v-for="tag in node.pluginTags" :key="tag" class="card-tag">{{ tag }}</span>
                </div>

                <!-- 序号标识 -->
                <div class="card-index" :style="{ background: getPluginTypeConfig(node.pluginType).color }">
                  {{ index + 1 }}
                </div>
              </div>

              <!-- 添加下一个节点按钮 -->
              <button
                v-if="!node.nextId"
                class="add-next-btn"
                @click.stop="openAddNodeDialog(node.id)"
              >
                <el-icon><Plus /></el-icon>
              </button>
            </div>

            <!-- 结束节点 -->
            <div
              v-if="orderedNodes.length > 0"
              class="terminal-node end"
              :style="{ left: Math.max(...Object.values(nodePositions).map(p => p.x + 240), 200) + 'px', top: '300px' }"
            >
              <div class="terminal-icon">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <span>结束</span>
            </div>

            <!-- 空状态提示 -->
            <div v-if="orderedNodes.length === 0" class="empty-canvas">
              <div class="empty-icon-wrapper">
                <el-icon class="empty-icon"><Rank /></el-icon>
              </div>
              <h3 class="empty-title">开始构建任务流程</h3>
              <p class="empty-desc">点击右上角"添加插件"按钮，或双击画布空白处</p>
            </div>
          </div>
        </div>

        <!-- 规则提示 -->
        <div class="rules-hint">
          <div class="rule" v-for="(config, type) in pluginTypeConfig" :key="type">
            <span class="rule-dot" :style="{ background: config.color }"></span>
            <span class="rule-label">{{ config.label }}</span>
          </div>
        </div>
      </div>

      <!-- 执行日志 -->
      <div v-show="activeTab === 'logs'" class="logs-panel">
        <div class="log-item" v-for="(log, i) in [{ time: '14:30:00', level: 'info', msg: '任务开始执行' }, { time: '14:30:01', level: 'success', msg: '环境连接成功' }]" :key="i">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-level" :class="log.level">{{ log.level.toUpperCase() }}</span>
          <span class="log-msg">{{ log.msg }}</span>
        </div>
      </div>
    </div>

    <!-- 添加插件对话框 -->
    <el-dialog v-model="addNodeDialogVisible" title="选择插件" width="720px" :modal="true" class="plugin-dialog">
      <div class="plugin-selector">
        <!-- 类型筛选 -->
        <div class="type-filter">
          <button
            v-for="type in allowedTypesForAdd"
            :key="type"
            class="filter-btn"
            :class="{ active: selectedPluginType === type }"
            @click="selectedPluginType = type; selectedPluginId = null"
          >
            <component :is="pluginTypeConfig[type].icon" :style="{ color: pluginTypeConfig[type].color }" />
            <span>{{ pluginTypeConfig[type].label }}</span>
          </button>
        </div>

        <!-- 搜索框 -->
        <div class="search-box">
          <el-input v-model="searchKeyword" placeholder="搜索插件..." :prefix-icon="Search" clearable />
        </div>

        <!-- 插件列表 -->
        <div class="plugin-list">
          <div
            v-for="plugin in filteredPluginsForAdd"
            :key="plugin.id"
            class="plugin-item"
            :class="{ selected: selectedPluginId === plugin.id }"
            @click="selectedPluginId = plugin.id"
          >
            <div class="plugin-item-icon" :style="{ background: getPluginTypeConfig(plugin.type).gradient }">
              <component :is="getPluginTypeConfig(plugin.type).icon" />
            </div>
            <div class="plugin-item-info">
              <div class="plugin-item-header">
                <span class="plugin-item-name">{{ plugin.name }}</span>
                <el-tag size="small" effect="plain">{{ plugin.source === 'system' ? '系统' : '自定义' }}</el-tag>
              </div>
              <p class="plugin-item-desc">{{ plugin.description }}</p>
              <div class="plugin-item-tags">
                <span v-for="tag in plugin.tags" :key="tag" class="plugin-item-tag">{{ tag }}</span>
              </div>
            </div>
            <div v-if="selectedPluginId === plugin.id" class="plugin-item-check">
              <el-icon><CircleCheck /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="addNodeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddNode" :disabled="!selectedPluginId">添加</el-button>
      </template>
    </el-dialog>

    <!-- 参数配置对话框 -->
    <el-dialog v-model="editNodeDialogVisible" title="参数配置" width="480px" class="param-dialog">
      <div v-if="currentEditingNode" class="param-editor">
        <div class="param-header">
          <div class="param-icon" :style="{ background: getPluginTypeConfig(currentEditingNode.pluginType).gradient }">
            <component :is="getPluginTypeConfig(currentEditingNode.pluginType).icon" />
          </div>
          <div class="param-info">
            <h3>{{ currentEditingNode.pluginName }}</h3>
            <p>{{ currentEditingNode.pluginDescription }}</p>
          </div>
        </div>

        <div v-if="currentEditingPluginDef?.params?.length" class="param-form">
          <div v-for="param in currentEditingPluginDef.params" :key="param.name" class="param-field">
            <label class="param-label">
              {{ param.name }}
              <span class="param-type">{{ param.type }}</span>
            </label>
            <p class="param-hint">{{ param.description }}</p>
            <el-input v-if="param.type === 'string'" v-model="editFormData[param.name]" :placeholder="`默认: ${param.default}`" />
            <el-input-number v-else-if="param.type === 'number'" v-model="editFormData[param.name]" style="width: 100%" />
            <el-switch v-else-if="param.type === 'boolean'" v-model="editFormData[param.name]" />
          </div>
        </div>
        <el-empty v-else description="暂无可配置参数" :image-size="60" />
      </div>

      <template #footer>
        <el-button @click="editNodeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEditNode">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 全局变量 */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 页面基础 */
.execution-detail-page {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* 头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.back-btn {
  color: var(--text-secondary) !important;
}

.header-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 12px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  margin-left: 12px;
}

.status-badge.running { background: #dbeafe; color: #2563eb; }
.status-badge.completed { background: #dcfce7; color: #16a34a; }
.status-badge.failed { background: #fee2e2; color: #dc2626; }
.status-badge.pending { background: #fef3c7; color: #d97706; }

.header-left {
  display: flex;
  align-items: center;
}

.action-btn {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-weight: 500;
}

.action-btn:hover {
  background: var(--bg-tertiary);
}

.action-btn.primary {
  background: #0f172a;
  border-color: #0f172a;
  color: white;
}

.action-btn.danger {
  background: #fee2e2;
  border-color: #fecaca;
  color: #dc2626;
}

/* 信息栏 */
.info-bar {
  display: flex;
  gap: 32px;
  padding: 12px 24px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 12px;
  color: var(--text-muted);
}

.info-value {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 主内容 */
.main-content {
  padding: 0;
}

/* 标签页导航 */
.tab-nav {
  display: flex;
  gap: 4px;
  padding: 16px 24px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.tab-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.tab-btn.active {
  background: var(--text-primary);
  color: white;
}

/* 画布工作区 */
.flow-workspace {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180px);
}

.canvas-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.toolbar-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.tool-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--text-muted);
}

.zoom-level {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 40px;
  text-align: center;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--border-color);
  margin: 0 8px;
}

.add-node-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--text-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.add-node-btn:hover {
  background: #1e293b;
  transform: translateY(-1px);
}

/* 画布区域 */
.canvas-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: var(--bg-secondary);
}

.canvas {
  position: relative;
  transform-origin: 0 0;
  cursor: grab;
  transition: transform 0.1s ease-out;
}

.canvas:active {
  cursor: grabbing;
}

.canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.connection-path {
  fill: none;
  stroke-dasharray: 0;
  animation: none;
}

/* 终端节点 */
.terminal-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 1;
}

.terminal-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  box-shadow: var(--shadow-md);
}

.terminal-node.start .terminal-icon {
  background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%);
}

.terminal-node.end .terminal-icon {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.terminal-node span {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
}

/* 流程卡片 */
.flow-card {
  position: absolute;
  width: 260px;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  cursor: grab;
  transition: box-shadow 0.2s, transform 0.1s;
  z-index: 10;
}

.flow-card:hover {
  box-shadow: var(--shadow-lg);
}

.flow-card.dragging {
  cursor: grabbing;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  transform: scale(1.02);
  z-index: 100;
}

.card-type-indicator {
  height: 3px;
}

.card-content {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  flex-shrink: 0;
}

.card-title-area {
  flex: 1;
  min-width: 0;
}

.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-type {
  font-size: 11px;
  color: var(--text-muted);
}

.card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: var(--transition);
}

.flow-card:hover .card-actions {
  opacity: 1;
}

.card-action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition);
}

.card-action-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.card-action-btn.delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.card-desc {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-tag {
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 10px;
  color: var(--text-muted);
}

.card-index {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: white;
}

.add-next-btn {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  background: #ffffff;
  color: #6b7280;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.add-next-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #f0f0ff;
  transform: translateY(-50%) scale(1.15);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* 空状态 */
.empty-canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.empty-icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 32px;
  color: var(--text-muted);
}

.empty-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-desc {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

/* 规则提示 */
.rules-hint {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 12px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

.rule {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rule-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.rule-label {
  font-size: 12px;
  color: var(--text-muted);
}

/* 日志面板 */
.logs-panel {
  padding: 24px;
  background: var(--bg-primary);
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.log-time {
  font-size: 12px;
  color: var(--text-muted);
  font-family: monospace;
}

.log-level {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.log-level.info { background: #dbeafe; color: #2563eb; }
.log-level.success { background: #dcfce7; color: #16a34a; }
.log-level.error { background: #fee2e2; color: #dc2626; }

.log-msg {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 对话框样式 */
.plugin-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.type-filter {
  display: flex;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.filter-btn:hover {
  background: var(--bg-tertiary);
}

.filter-btn.active {
  background: var(--text-primary);
  border-color: var(--text-primary);
  color: white;
}

.plugin-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.plugin-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
}

.plugin-item:hover {
  border-color: var(--text-muted);
  background: var(--bg-secondary);
}

.plugin-item.selected {
  border-color: var(--text-primary);
  background: #f8fafc;
}

.plugin-item-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.plugin-item-info {
  flex: 1;
  min-width: 0;
}

.plugin-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.plugin-item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.plugin-item-desc {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.plugin-item-tags {
  display: flex;
  gap: 4px;
}

.plugin-item-tag {
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 10px;
  color: var(--text-muted);
}

.plugin-item-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--text-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 参数编辑 */
.param-editor {
  padding: 0;
}

.param-header {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.param-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.param-info h3 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
}

.param-info p {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}

.param-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.param-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-type {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  color: var(--text-muted);
}

.param-hint {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
