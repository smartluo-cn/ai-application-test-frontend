/**
 * 画布相关逻辑 Composable
 * 包含缩放控制、画布拖拽等功能
 */
import { reactive } from 'vue'

export function useCanvas(canvas) {
  // 画布拖拽状态
  const canvasDragState = reactive({
    isDragging: false,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  })

  // 缩放画布
  const zoomIn = () => {
    canvas.scale = Math.min(2, canvas.scale + 0.1)
  }

  const zoomOut = () => {
    canvas.scale = Math.max(0.5, canvas.scale - 0.1)
  }

  const resetZoom = () => {
    canvas.scale = 1
  }

  // 开始拖拽画布
  const startDragCanvas = (event) => {
    // 只有点击在空白处才触发画布拖拽
    if (event.target.closest('.flow-node, .connection-path, .connection-add-btn, .node-action-btn')) {
      return
    }

    canvasDragState.isDragging = true
    canvasDragState.startX = event.clientX
    canvasDragState.startY = event.clientY
    canvasDragState.startOffsetX = canvas.offsetX
    canvasDragState.startOffsetY = canvas.offsetY

    document.addEventListener('mousemove', onDragCanvas)
    document.addEventListener('mouseup', stopDragCanvas)
  }

  // 拖拽画布
  const onDragCanvas = (event) => {
    if (!canvasDragState.isDragging) return

    const dx = event.clientX - canvasDragState.startX
    const dy = event.clientY - canvasDragState.startY

    canvas.offsetX = canvasDragState.startOffsetX + dx
    canvas.offsetY = canvasDragState.startOffsetY + dy
  }

  // 停止拖拽画布
  const stopDragCanvas = () => {
    canvasDragState.isDragging = false
    document.removeEventListener('mousemove', onDragCanvas)
    document.removeEventListener('mouseup', stopDragCanvas)
  }

  // 处理画布点击事件
  const handleCanvasClick = (deselectAll, hideContextMenu) => {
    deselectAll()
    hideContextMenu()
  }

  return {
    canvasDragState,
    zoomIn,
    zoomOut,
    resetZoom,
    startDragCanvas,
    onDragCanvas,
    stopDragCanvas,
    handleCanvasClick,
  }
}
