/**
 * 工作流状态管理 Composable
 * 管理工作流信息、画布状态、节点列表、连线列表、选中状态等
 */
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'

export function useWorkflowState() {
  const route = useRoute()

  // 工作流信息
  const workflow = reactive({
    id: route.params.id || 'new',
    name: route.query.projectName || (route.params.id === 'new' ? '未命名工作流' : '智能问答工作流'),
    description: '',
    published: false,
    hasRun: false, // 是否已成功运行过
  })

  // 画布状态
  const canvas = reactive({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    width: 3000,
    height: 2000,
  })

  // 画布引用
  const canvasRef = ref(null)
  const canvasContainerRef = ref(null)

  // 节点列表
  const nodes = ref([
    {
      id: 'start-1',
      type: 'start',
      name: '开始',
      x: 100,
      y: 300,
      inputs: [],
      outputs: [{ id: 'out-1', name: '输出' }],
      outputParams: [{ name: 'input', type: 'String', elementType: 'string' }],
      inputParams: [],
      config: {},
    },
    {
      id: 'textClean-1',
      type: 'textClean',
      name: '文本清洗',
      x: 380,
      y: 300,
      inputs: [{ id: 'in-tc-1', name: '输入' }],
      outputs: [{ id: 'out-tc-1', name: '输出' }],
      config: {},
    },
    {
      id: 'loop-1',
      type: 'loop',
      name: '循环',
      x: 660,
      y: 300,
      inputs: [{ id: 'in-loop-1', name: '输入' }],
      outputs: [
        { id: 'out-loop-bottom', name: '连接循环体' },
        { id: 'out-loop-right', name: '连接下一节点' },
      ],
      inputParams: [],
      config: {
        arrayElementType: 'string',
      },
    },
    {
      id: 'loopBody-1',
      type: 'loopBody',
      name: '循环体',
      x: 660,
      y: 500,
      inputs: [{ id: 'in-lb-top', name: '输入' }],
      outputs: [{ id: 'out-lb-1', name: '输出' }],
      config: {},
      parentId: 'loop-1',
      innerCanvas: {
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        width: 1500,
        height: 1000,
      },
      canvasDragState: {
        isDragging: false,
        startX: 0,
        startY: 0,
        startOffsetX: 0,
        startOffsetY: 0,
      },
      innerNodes: [],
      innerConnections: [],
      selectedInnerNode: null,
      selectedInnerConnection: null,
      tempConnectionPath: null,
      innerOffsetX: 0,
      innerOffsetY: 0,
    },
    {
      id: 'judgeModel-1',
      type: 'judgeModel',
      name: '裁判模型',
      x: 1220,
      y: 300,
      inputs: [{ id: 'in-jm-1', name: '输入' }],
      outputs: [{ id: 'out-jm-1', name: '输出' }],
      config: {},
    },
    {
      id: 'end-1',
      type: 'end',
      name: '结束',
      x: 1500,
      y: 300,
      inputs: [{ id: 'in-1', name: '输入' }],
      outputs: [],
      config: {},
    },
  ])

  // 连线列表
  const connections = ref([
    { id: 'conn-1', sourceId: 'start-1', sourcePort: 'out-1', targetId: 'textClean-1', targetPort: 'in-tc-1', sourceParamIndex: 0, targetParamIndex: 0 },
    { id: 'conn-2', sourceId: 'textClean-1', sourcePort: 'out-tc-1', targetId: 'loop-1', targetPort: 'in-loop-1', sourceParamIndex: 0, targetParamIndex: 0 },
    { id: 'conn-3', sourceId: 'loop-1', sourcePort: 'out-loop-bottom', targetId: 'loopBody-1', targetPort: 'in-lb-top', sourceParamIndex: 0, targetParamIndex: 0 },
    { id: 'conn-4', sourceId: 'loop-1', sourcePort: 'out-loop-right', targetId: 'judgeModel-1', targetPort: 'in-jm-1', sourceParamIndex: 1, targetParamIndex: 0 },
    { id: 'conn-5', sourceId: 'judgeModel-1', sourcePort: 'out-jm-1', targetId: 'end-1', targetPort: 'in-1', sourceParamIndex: 0, targetParamIndex: 0 },
  ])

  // 选中的节点
  const selectedNode = ref(null)

  // 选中的连线
  const selectedConnection = ref(null)

  // 悬浮的连线
  const hoveredConnection = ref(null)
  let hoveredConnectionTimer = null

  // 延迟清除悬停状态，避免鼠标移到添加按钮时闪烁
  const handleConnectionMouseLeave = () => {
    hoveredConnectionTimer = setTimeout(() => {
      hoveredConnection.value = null
    }, 100)
  }

  const handleConnectionMouseEnter = (conn) => {
    if (hoveredConnectionTimer) {
      clearTimeout(hoveredConnectionTimer)
      hoveredConnectionTimer = null
    }
    hoveredConnection.value = conn
  }

  // 连线绘制状态
  const drawingConnection = ref(null)

  // 添加节点弹窗状态
  const showAddNodePopover = ref(null)
  const insertConnection = ref(null)
  const popoverPosition = ref({ x: 0, y: 0 })

  // 嵌套画布状态（用于循环体等容器节点）
  const nestedCanvasState = ref(null)
  const nestedCanvasData = ref({})

  // 检查是否在嵌套画布中
  const isInNestedCanvas = computed(() => nestedCanvasState.value !== null)

  // 取消选择
  const deselectAll = () => {
    selectedNode.value = null
    selectedConnection.value = null
    hoveredConnection.value = null
    showAddNodePopover.value = null
  }

  // 关闭添加节点弹窗
  const closeAddPopover = () => {
    showAddNodePopover.value = null
    insertConnection.value = null
  }

  return {
    // 状态
    workflow,
    canvas,
    canvasRef,
    canvasContainerRef,
    nodes,
    connections,
    selectedNode,
    selectedConnection,
    hoveredConnection,
    drawingConnection,
    showAddNodePopover,
    insertConnection,
    popoverPosition,
    nestedCanvasState,
    nestedCanvasData,
    isInNestedCanvas,
    // 方法
    handleConnectionMouseLeave,
    handleConnectionMouseEnter,
    deselectAll,
    closeAddPopover,
  }
}
