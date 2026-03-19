/**
 * 拖拽逻辑 Composable
 * 包含节点拖拽、长按检测等功能
 */
import { reactive } from 'vue'
import { LONG_PRESS_THRESHOLD, MOVE_THRESHOLD, DEFAULT_NODE_WIDTH } from '../config/workflowConfig'

export function useDragDrop(canvas, nodes, connections, drawingConnection, getNodeOutputParams) {
  // 拖拽状态
  const dragState = reactive({
    isDragging: false,
    node: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  })

  // 长按检测状态
  const longPressState = reactive({
    isLongPress: false,
    timer: null,
    startTime: 0,
    startX: 0,
    startY: 0,
    node: null,
    port: null,
  })

  // 输出端口点击/拖拽状态
  const outputPortState = reactive({
    isDragging: false,
    node: null,
    paramIndex: 0,
    startX: 0,
    startY: 0,
    startTime: 0,
    hasMoved: false,
  })

  // 开始拖拽节点
  const startDragNode = (node, event, selectNode) => {
    event.stopPropagation()
    if (selectNode) {
      selectNode(node)
    }

    dragState.isDragging = true
    dragState.node = node
    dragState.startX = event.clientX
    dragState.startY = event.clientY
    dragState.offsetX = node.x
    dragState.offsetY = node.y

    document.addEventListener('mousemove', onDragNode)
    document.addEventListener('mouseup', stopDragNode)
  }

  // 拖拽节点
  const onDragNode = (event) => {
    if (!dragState.isDragging || !dragState.node) return

    const dx = (event.clientX - dragState.startX) / canvas.scale
    const dy = (event.clientY - dragState.startY) / canvas.scale

    dragState.node.x = Math.max(0, dragState.offsetX + dx)
    dragState.node.y = Math.max(0, dragState.offsetY + dy)
  }

  // 停止拖拽节点
  const stopDragNode = () => {
    dragState.isDragging = false
    dragState.node = null
    document.removeEventListener('mousemove', onDragNode)
    document.removeEventListener('mouseup', stopDragNode)
  }

  // 处理按钮按下
  const handleActionBtnDown = (node, event) => {
    event.stopPropagation()

    // 检查节点是否可以添加连线
    const outputParams = node.type === 'start' ? (node.outputParams || []) : node.outputs
    if (outputParams.length === 0) return

    const port = outputParams[0]
    const params = getNodeOutputParams(node)
    const paramsHeight = params.length > 0 ? 32 : 0
    const nodeHeight = 40 + paramsHeight

    const x = node.x + DEFAULT_NODE_WIDTH - 5
    const y = node.y + nodeHeight / 2

    longPressState.isLongPress = false
    longPressState.startTime = Date.now()
    longPressState.startX = event.clientX
    longPressState.startY = event.clientY
    longPressState.node = node
    longPressState.port = port

    // 设置长按计时器
    longPressState.timer = setTimeout(() => {
      longPressState.isLongPress = true

      // 开始绘制连线
      drawingConnection.value = {
        sourceNode: node,
        sourcePort: port,
        sourcePortType: 'output',
        startX: x,
        startY: y,
        endX: x,
        endY: y,
      }

      document.addEventListener('mousemove', onDrawingConnection)
      document.addEventListener('mouseup', stopConnection)
    }, LONG_PRESS_THRESHOLD)
  }

  // 处理按钮释放
  const handleActionBtnUp = (node, event, showAddPopover) => {
    event.stopPropagation()

    // 清除长按计时器
    if (longPressState.timer) {
      clearTimeout(longPressState.timer)
      longPressState.timer = null
    }

    // 如果不是长按，则显示添加节点弹窗
    if (!longPressState.isLongPress && showAddPopover) {
      showAddPopover(node, event)
    }

    longPressState.isLongPress = false
  }

  // 绘制连线中
  const onDrawingConnection = (event, canvasRef) => {
    if (!drawingConnection.value) return

    const rect = canvasRef?.getBoundingClientRect()
    if (rect) {
      drawingConnection.value.endX = (event.clientX - rect.left) / canvas.scale
      drawingConnection.value.endY = (event.clientY - rect.top) / canvas.scale
    }
  }

  // 结束连线
  const stopConnection = () => {
    document.removeEventListener('mousemove', onDrawingConnection)
    document.removeEventListener('mouseup', stopConnection)
    drawingConnection.value = null
  }

  return {
    dragState,
    longPressState,
    outputPortState,
    startDragNode,
    onDragNode,
    stopDragNode,
    handleActionBtnDown,
    handleActionBtnUp,
    onDrawingConnection,
    stopConnection,
  }
}
