/**
 * 循环体相关逻辑 Composable
 * 包含循环体内部画布管理、节点拖拽、连线管理等功能
 */
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getNodeTypeConfig } from '../config/workflowConfig'

export function useLoopBody(nodes, getNodeInputParams, getNodeOutputParams) {
  // 循环体编辑器状态
  const loopBodyEditorVisible = ref(false)
  const editingLoopBodyNode = ref(null)
  const loopBodyInnerNodes = ref([])
  const loopBodyInnerConnections = ref([])
  const loopBodySelectedNode = ref(null)
  const loopBodySelectedConnection = ref(null)

  // 循环体内联菜单状态
  const showLoopBodyInlineMenu = ref(null)

  // 循环体画布端口状态
  const loopBodyCanvasPortState = reactive({
    isDown: false,
    loopBodyNode: null,
    startX: 0,
    startY: 0,
    hasMoved: false,
  })

  // 切换循环体内联添加菜单
  const toggleLoopBodyAddMenu = (node, event) => {
    event?.stopPropagation()
    if (showLoopBodyInlineMenu.value === node.id) {
      showLoopBodyInlineMenu.value = null
    } else {
      showLoopBodyInlineMenu.value = node.id
    }
  }

  // 在循环体内部直接添加节点
  const addNodeToLoopBodyInline = (loopBodyNode, type) => {
    const nodeConfig = getNodeTypeConfig(type)
    if (!nodeConfig) return

    if (!loopBodyNode.innerNodes) loopBodyNode.innerNodes = []
    if (!loopBodyNode.innerConnections) loopBodyNode.innerConnections = []

    const baseX = 40
    const baseY = 30
    const nodeWidth = 220
    const nodeGap = 30

    const lastNode = loopBodyNode.innerNodes[loopBodyNode.innerNodes.length - 1]
    const newX = lastNode ? lastNode.x + nodeWidth + nodeGap : baseX
    const newY = baseY

    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      name: nodeConfig.name,
      x: newX,
      y: newY,
      inputs: [{ id: `in-${Date.now()}`, name: '输入' }],
      outputs: [{ id: `out-${Date.now()}`, name: '输出' }],
      config: {},
    }

    loopBodyNode.innerNodes.push(newNode)

    if (loopBodyNode.innerNodes.length === 1) {
      loopBodyNode.innerConnections.push({
        id: `conn-start-${newNode.id}`,
        sourceId: '__start__',
        targetId: newNode.id,
        sourcePort: 'start-out',
        targetPort: newNode.inputs[0].id,
      })
    } else if (lastNode) {
      loopBodyNode.innerConnections.push({
        id: `conn-${lastNode.id}-${newNode.id}`,
        sourceId: lastNode.id,
        targetId: newNode.id,
        sourcePort: lastNode.outputs[0].id,
        targetPort: newNode.inputs[0].id,
      })
    }

    showLoopBodyInlineMenu.value = null
  }

  // 打开循环体编辑器
  const openLoopBodyEditor = (node) => {
    editingLoopBodyNode.value = node
    loopBodyInnerNodes.value = JSON.parse(JSON.stringify(node.innerNodes || []))
    loopBodyInnerConnections.value = JSON.parse(JSON.stringify(node.innerConnections || []))
    loopBodySelectedNode.value = null
    loopBodySelectedConnection.value = null
    loopBodyEditorVisible.value = true
  }

  // 保存循环体编辑
  const saveLoopBodyEditor = () => {
    if (editingLoopBodyNode.value) {
      if (loopBodyInnerNodes.value.length > 0) {
        let minX = Infinity
        let minY = Infinity
        loopBodyInnerNodes.value.forEach((node) => {
          if (node.x < minX) minX = node.x
          if (node.y < minY) minY = node.y
        })
        editingLoopBodyNode.value.innerOffsetX = minX
        editingLoopBodyNode.value.innerOffsetY = minY
      }

      editingLoopBodyNode.value.innerNodes = JSON.parse(JSON.stringify(loopBodyInnerNodes.value))
      editingLoopBodyNode.value.innerConnections = JSON.parse(JSON.stringify(loopBodyInnerConnections.value))
    }
    loopBodyEditorVisible.value = false
    editingLoopBodyNode.value = null
    ElMessage.success('循环体已保存')
  }

  // 在循环体中添加节点
  const addNodeToLoopBody = (type) => {
    const nodeConfig = getNodeTypeConfig(type)
    if (!nodeConfig) return

    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      name: nodeConfig.name,
      x: 100 + loopBodyInnerNodes.value.length * 250,
      y: 150,
      inputs: [{ id: `in-${Date.now()}`, name: '输入' }],
      outputs: [{ id: `out-${Date.now()}`, name: '输出' }],
      config: {},
    }

    loopBodyInnerNodes.value.push(newNode)
  }

  // 删除循环体中的节点
  const deleteNodeFromLoopBody = (nodeId) => {
    loopBodyInnerNodes.value = loopBodyInnerNodes.value.filter((n) => n.id !== nodeId)
    loopBodyInnerConnections.value = loopBodyInnerConnections.value.filter(
      (c) => c.sourceId !== nodeId && c.targetId !== nodeId
    )
    loopBodySelectedNode.value = null
  }

  // 选择循环体内部节点
  const selectLoopBodyInnerNode = (loopBodyNode, innerNode, event, hideContextMenu) => {
    event.stopPropagation()
    if (hideContextMenu) {
      hideContextMenu()
    }
    showLoopBodyInlineMenu.value = null
    loopBodyNode.selectedInnerNode = innerNode
    loopBodyNode.selectedInnerConnection = null
  }

  // 循环体内部节点拖拽
  const startDragLoopBodyInnerNode = (loopBodyNode, innerNode, event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!loopBodyNode.innerNodeDragState) {
      loopBodyNode.innerNodeDragState = {
        isDragging: false,
        innerNode: null,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
      }
    }

    loopBodyNode.innerNodeDragState.isDragging = true
    loopBodyNode.innerNodeDragState.innerNode = innerNode
    loopBodyNode.innerNodeDragState.startX = event.clientX
    loopBodyNode.innerNodeDragState.startY = event.clientY
    loopBodyNode.innerNodeDragState.offsetX = innerNode.x
    loopBodyNode.innerNodeDragState.offsetY = innerNode.y

    const handleMove = (e) => {
      if (!loopBodyNode.innerNodeDragState?.isDragging) return
      const dx = e.clientX - loopBodyNode.innerNodeDragState.startX
      const dy = e.clientY - loopBodyNode.innerNodeDragState.startY
      loopBodyNode.innerNodeDragState.innerNode.x = Math.max(0, loopBodyNode.innerNodeDragState.offsetX + dx)
      loopBodyNode.innerNodeDragState.innerNode.y = Math.max(0, loopBodyNode.innerNodeDragState.offsetY + dy)
    }

    const handleUp = () => {
      if (loopBodyNode.innerNodeDragState) {
        loopBodyNode.innerNodeDragState.isDragging = false
        loopBodyNode.innerNodeDragState.innerNode = null
      }
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  // 计算内部画布的实际需要尺寸
  const getInnerCanvasSize = (node) => {
    const innerNodes = node.innerNodes || []

    const minCanvasWidth = 500
    const minCanvasHeight = 300

    if (innerNodes.length === 0) {
      return {
        width: minCanvasWidth,
        height: minCanvasHeight,
      }
    }

    const nodeWidth = 220
    const getNodeHeight = (n) => {
      const inputParams = getNodeInputParams(n)
      const outputParams = getNodeOutputParams(n)
      let height = 56
      if (inputParams.length > 0) {
        height += 36
      }
      if (outputParams.length > 0) {
        height += 36
      }
      return Math.max(height, 80)
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = 0
    let maxY = 0

    innerNodes.forEach((n) => {
      if (n.x < minX) minX = n.x
      if (n.y < minY) minY = n.y
      const nodeHeight = getNodeHeight(n)
      const nodeRight = n.x + nodeWidth
      const nodeBottom = n.y + nodeHeight
      if (nodeRight > maxX) maxX = nodeRight
      if (nodeBottom > maxY) maxY = nodeBottom
    })

    const padding = 40
    const canvasWidth = Math.max(minCanvasWidth, maxX + padding)
    const canvasHeight = Math.max(minCanvasHeight, maxY + padding)

    return {
      width: canvasWidth,
      height: canvasHeight,
      offsetX: minX < Infinity ? -minX + 20 : 0,
      offsetY: minY < Infinity ? -minY + 20 : 0,
    }
  }

  // 计算循环体节点的动态大小
  const getLoopBodyNodeSize = (node) => {
    const canvasSize = getInnerCanvasSize(node)

    const baseWidth = 550
    const baseHeight = 350

    const padding = 20
    const headerHeight = 40

    const finalWidth = Math.max(baseWidth, canvasSize.width + padding * 2)
    const finalHeight = Math.max(baseHeight, canvasSize.height + padding + headerHeight)

    return {
      width: finalWidth + 'px',
      minWidth: finalWidth + 'px',
      height: finalHeight + 'px',
      minHeight: finalHeight + 'px',
    }
  }

  // 获取循环体内部连线路径
  const getLoopBodyConnectionPath = (conn, loopBodyNode, part) => {
    const innerNodes = loopBodyNode.innerNodes || []
    const targetNode = innerNodes.find((n) => n.id === conn.targetId)

    if (!targetNode) return ''

    const canvasSize = getInnerCanvasSize(loopBodyNode)
    const offsetX = canvasSize.offsetX || 0

    const nodeWidth = 220
    const getInnerNodeHeight = (n) => {
      const inputParams = getNodeInputParams(n)
      const outputParams = getNodeOutputParams(n)
      let height = 56
      if (inputParams.length > 0) {
        height += 36
      }
      if (outputParams.length > 0) {
        height += 36
      }
      return Math.max(height, 80)
    }

    let x1, y1

    if (conn.sourceId === '__start__') {
      x1 = -offsetX
      y1 = targetNode.y + getInnerNodeHeight(targetNode) / 2
    } else {
      const sourceNode = innerNodes.find((n) => n.id === conn.sourceId)
      if (!sourceNode) return ''
      x1 = sourceNode.x + nodeWidth
      y1 = sourceNode.y + getInnerNodeHeight(sourceNode) / 2
    }

    const x2 = targetNode.x
    const y2 = targetNode.y + getInnerNodeHeight(targetNode) / 2

    const midX = (x1 + x2) / 2
    const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`

    if (part === 'start') {
      const controlX = (x1 + midX) / 2
      return `M ${x1} ${y1} C ${controlX} ${y1}, ${controlX} ${y1}, ${midX} ${(y1 + y2) / 2}`
    } else {
      const controlX = (midX + x2) / 2
      return `M ${midX} ${(y1 + y2) / 2} C ${controlX} ${y2}, ${controlX} ${y2}, ${x2} ${y2}`
    }
  }

  // 点击画布关闭菜单
  const handleLoopBodyCanvasClick = (loopBodyNode, event, hideContextMenu) => {
    event.stopPropagation()
    if (hideContextMenu) {
      hideContextMenu()
    }
    showLoopBodyInlineMenu.value = null
    loopBodyNode.selectedInnerNode = null
    loopBodyNode.selectedInnerConnection = null
  }

  return {
    loopBodyEditorVisible,
    editingLoopBodyNode,
    loopBodyInnerNodes,
    loopBodyInnerConnections,
    loopBodySelectedNode,
    loopBodySelectedConnection,
    showLoopBodyInlineMenu,
    loopBodyCanvasPortState,
    toggleLoopBodyAddMenu,
    addNodeToLoopBodyInline,
    openLoopBodyEditor,
    saveLoopBodyEditor,
    addNodeToLoopBody,
    deleteNodeFromLoopBody,
    selectLoopBodyInnerNode,
    startDragLoopBodyInnerNode,
    getInnerCanvasSize,
    getLoopBodyNodeSize,
    getLoopBodyConnectionPath,
    handleLoopBodyCanvasClick,
  }
}
