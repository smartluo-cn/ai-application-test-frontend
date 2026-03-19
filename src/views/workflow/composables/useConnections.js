/**
 * 连线相关逻辑 Composable
 * 包含连线路径计算、创建、删除等功能
 */
import { computed } from 'vue'
import { DEFAULT_NODE_WIDTH } from '../config/workflowConfig'

export function useConnections(nodes, connections, drawingConnection, getNodeOutputParams, getNodeParamPortPosition) {
  // 获取添加按钮的实际 DOM 位置
  const getActionBtnDomPosition = (nodeId) => {
    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`)
    if (!nodeElement) return null

    const btnElement = nodeElement.querySelector('.node-action-btn')
    if (!btnElement) return null

    const btnRect = btnElement.getBoundingClientRect()
    const canvasRect = document.querySelector('.canvas')?.getBoundingClientRect()
    if (!canvasRect) return null

    return {
      x: btnRect.left + btnRect.width / 2 - canvasRect.left,
      y: btnRect.top + btnRect.height / 2 - canvasRect.top,
    }
  }

  // 获取端口的实际 DOM 位置
  const getPortDomPosition = (nodeId, paramIndex, type, nodeType = null) => {
    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`)
    if (!nodeElement) return null

    // 如果是开始节点且类型是输出，使用添加按钮的位置
    if (nodeType === 'start' && type === 'output') {
      return getActionBtnDomPosition(nodeId)
    }

    const portSelector = type === 'output' ? '.output-port' : '.input-port'
    const ports = nodeElement.querySelectorAll(portSelector)
    const portElement = ports[paramIndex]
    if (!portElement) return null

    const portRect = portElement.getBoundingClientRect()
    const canvasRect = document.querySelector('.canvas')?.getBoundingClientRect()
    if (!canvasRect) return null

    return {
      x: portRect.left + portRect.width / 2 - canvasRect.left,
      y: portRect.top + portRect.height / 2 - canvasRect.top,
    }
  }

  // 获取特殊节点端口的计算位置
  const getSpecialPortPosition = (node, type, paramIndex = 0) => {
    const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`)
    if (!nodeElement) return null

    const nodeRect = nodeElement.getBoundingClientRect()
    const canvasRect = document.querySelector('.canvas')?.getBoundingClientRect()
    if (!canvasRect) return null

    const nodeWidth = nodeRect.width
    const nodeHeight = nodeRect.height

    if (node.type === 'loop' && type === 'output') {
      if (paramIndex === 0) {
        return {
          x: node.x + nodeWidth / 2,
          y: node.y + nodeHeight,
        }
      } else {
        return {
          x: node.x + nodeWidth,
          y: node.y + nodeHeight / 2,
        }
      }
    }

    if (node.type === 'loopBody' && type === 'input') {
      return {
        x: node.x + nodeWidth / 2,
        y: node.y,
      }
    }

    return null
  }

  // 计算连线路径
  const getConnectionPath = (connection) => {
    const sourceNode = nodes.value.find((n) => n.id === connection.sourceId)
    const targetNode = nodes.value.find((n) => n.id === connection.targetId)

    if (!sourceNode || !targetNode) return ''

    const sourceParamIndex = connection.sourceParamIndex ?? 0
    const targetParamIndex = connection.targetParamIndex ?? 0

    let x1, y1, x2, y2

    const isLoopToLoopBody = sourceNode.type === 'loop' && targetNode.type === 'loopBody' && sourceParamIndex === 0

    if (isLoopToLoopBody) {
      const loopOutputPos = getSpecialPortPosition(sourceNode, 'output', 0)
      const loopBodyInputPos = getSpecialPortPosition(targetNode, 'input')

      if (loopOutputPos && loopBodyInputPos) {
        x1 = loopOutputPos.x
        y1 = loopOutputPos.y
        x2 = loopBodyInputPos.x
        y2 = loopBodyInputPos.y

        const verticalDistance = Math.abs(y2 - y1)
        const controlOffset = Math.max(30, Math.min(verticalDistance * 0.5, 80))

        return `M ${x1} ${y1} C ${x1} ${y1 + controlOffset}, ${x2} ${y2 - controlOffset}, ${x2} ${y2}`
      }
    }

    const sourcePortPos = getPortDomPosition(sourceNode.id, sourceParamIndex, 'output', sourceNode.type)
    const targetPortPos = getPortDomPosition(targetNode.id, targetParamIndex, 'input', targetNode.type)

    if (sourcePortPos && targetPortPos) {
      x1 = sourcePortPos.x
      y1 = sourcePortPos.y
      x2 = targetPortPos.x
      y2 = targetPortPos.y
    } else {
      if (sourceNode.type === 'start') {
        x1 = sourceNode.x + DEFAULT_NODE_WIDTH - 5
        const params = getNodeOutputParams(sourceNode)
        const paramsHeight = params.length > 0 ? 32 : 0
        const nodeHeight = 40 + paramsHeight
        y1 = sourceNode.y + nodeHeight / 2
      } else if (sourceNode.type === 'loop') {
        const loopOutputPos = getSpecialPortPosition(sourceNode, 'output', sourceParamIndex)
        if (loopOutputPos) {
          x1 = loopOutputPos.x
          y1 = loopOutputPos.y
        } else {
          y1 = getNodeParamPortPosition(sourceNode, sourceParamIndex, 'output')
          x1 = sourceNode.x + DEFAULT_NODE_WIDTH
        }
      } else {
        y1 = getNodeParamPortPosition(sourceNode, sourceParamIndex, 'output')
        x1 = sourceNode.x + DEFAULT_NODE_WIDTH
      }

      if (targetNode.type === 'loopBody') {
        const loopBodyInputPos = getSpecialPortPosition(targetNode, 'input')
        if (loopBodyInputPos) {
          x2 = loopBodyInputPos.x
          y2 = loopBodyInputPos.y
        } else {
          y2 = getNodeParamPortPosition(targetNode, targetParamIndex, 'input')
          x2 = targetNode.x
        }
      } else {
        y2 = getNodeParamPortPosition(targetNode, targetParamIndex, 'input')
        x2 = targetNode.x
      }
    }

    const distance = Math.abs(x2 - x1)
    const controlOffset = Math.max(40, Math.min(distance * 0.4, 120))

    return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`
  }

  // 计算连线中点坐标
  const getConnectionMidpoint = (connection) => {
    const sourceNode = nodes.value.find((n) => n.id === connection.sourceId)
    const targetNode = nodes.value.find((n) => n.id === connection.targetId)

    if (!sourceNode || !targetNode) return null

    const sourceParamIndex = connection.sourceParamIndex ?? 0
    const targetParamIndex = connection.targetParamIndex ?? 0

    let x1, y1, x2, y2
    let isVerticalConnection = false

    const isLoopToLoopBody = sourceNode.type === 'loop' && targetNode.type === 'loopBody' && sourceParamIndex === 0

    if (isLoopToLoopBody) {
      const loopOutputPos = getSpecialPortPosition(sourceNode, 'output', 0)
      const loopBodyInputPos = getSpecialPortPosition(targetNode, 'input')

      if (loopOutputPos && loopBodyInputPos) {
        x1 = loopOutputPos.x
        y1 = loopOutputPos.y
        x2 = loopBodyInputPos.x
        y2 = loopBodyInputPos.y
        isVerticalConnection = true
      }
    }

    if (!isVerticalConnection) {
      const sourcePortPos = getPortDomPosition(sourceNode.id, sourceParamIndex, 'output', sourceNode.type)
      const targetPortPos = getPortDomPosition(targetNode.id, targetParamIndex, 'input', targetNode.type)

      if (sourcePortPos && targetPortPos) {
        x1 = sourcePortPos.x
        y1 = sourcePortPos.y
        x2 = targetPortPos.x
        y2 = targetPortPos.y
      } else {
        if (sourceNode.type === 'start') {
          x1 = sourceNode.x + DEFAULT_NODE_WIDTH - 5
          const params = getNodeOutputParams(sourceNode)
          const paramsHeight = params.length > 0 ? 32 : 0
          const nodeHeight = 40 + paramsHeight
          y1 = sourceNode.y + nodeHeight / 2
        } else {
          y1 = getNodeParamPortPosition(sourceNode, sourceParamIndex, 'output')
          x1 = sourceNode.x + DEFAULT_NODE_WIDTH
        }
        y2 = getNodeParamPortPosition(targetNode, targetParamIndex, 'input')
        x2 = targetNode.x
      }
    }

    const distance = isVerticalConnection ? Math.abs(y2 - y1) : Math.abs(x2 - x1)
    const controlOffset = Math.max(40, Math.min(distance * 0.4, 120))

    let cx1, cy1, cx2, cy2

    if (isVerticalConnection) {
      cx1 = x1
      cy1 = y1 + controlOffset
      cx2 = x2
      cy2 = y2 - controlOffset
    } else {
      cx1 = x1 + controlOffset
      cy1 = y1
      cx2 = x2 - controlOffset
      cy2 = y2
    }

    const t = 0.5
    const mt = 1 - t
    const x = mt * mt * mt * x1 + 3 * mt * mt * t * cx1 + 3 * mt * t * t * cx2 + t * t * t * x2
    const y = mt * mt * mt * y1 + 3 * mt * mt * t * cy1 + 3 * mt * t * t * cy2 + t * t * t * y2

    return { x, y }
  }

  // 计算临时连线路径
  const tempConnectionPath = computed(() => {
    if (!drawingConnection.value) return ''
    const { startX, startY, endX, endY } = drawingConnection.value

    const distance = Math.abs(endX - startX)
    const controlOffset = Math.max(40, Math.min(distance * 0.4, 120))

    return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`
  })

  // 计算连线路径的一部分
  const getConnectionPathPart = (connection, part) => {
    const sourceNode = nodes.value.find((n) => n.id === connection.sourceId)
    const targetNode = nodes.value.find((n) => n.id === connection.targetId)

    if (!sourceNode || !targetNode) return ''

    const sourceParamIndex = connection.sourceParamIndex ?? 0
    const targetParamIndex = connection.targetParamIndex ?? 0

    let x1, y1, x2, y2

    const isLoopToLoopBody = sourceNode.type === 'loop' && targetNode.type === 'loopBody' && sourceParamIndex === 0

    if (isLoopToLoopBody) {
      const loopOutputPos = getSpecialPortPosition(sourceNode, 'output', 0)
      const loopBodyInputPos = getSpecialPortPosition(targetNode, 'input')

      if (loopOutputPos && loopBodyInputPos) {
        x1 = loopOutputPos.x
        y1 = loopOutputPos.y
        x2 = loopBodyInputPos.x
        y2 = loopBodyInputPos.y

        const verticalDistance = Math.abs(y2 - y1)
        const controlOffset = Math.max(30, Math.min(verticalDistance * 0.5, 80))

        const cx1 = x1
        const cy1 = y1 + controlOffset
        const cx2 = x2
        const cy2 = y2 - controlOffset

        const t = 0.5
        const q0x = (1 - t) * x1 + t * cx1
        const q0y = (1 - t) * y1 + t * cy1
        const q1x = (1 - t) * cx1 + t * cx2
        const q1y = (1 - t) * cy1 + t * cy2
        const q2x = (1 - t) * cx2 + t * x2
        const q2y = (1 - t) * cy2 + t * y2

        const r0x = (1 - t) * q0x + t * q1x
        const r0y = (1 - t) * q0y + t * q1y
        const r1x = (1 - t) * q1x + t * q2x
        const r1y = (1 - t) * q1y + t * q2y

        const midX = (1 - t) * r0x + t * r1x
        const midY = (1 - t) * r0y + t * r1y

        if (part === 'start') {
          return `M ${x1} ${y1} C ${q0x} ${q0y}, ${r0x} ${r0y}, ${midX} ${midY}`
        } else {
          return `M ${midX} ${midY} C ${r1x} ${r1y}, ${q2x} ${q2y}, ${x2} ${y2}`
        }
      }
    }

    const sourcePortPos = getPortDomPosition(sourceNode.id, sourceParamIndex, 'output', sourceNode.type)
    const targetPortPos = getPortDomPosition(targetNode.id, targetParamIndex, 'input', targetNode.type)

    if (sourcePortPos && targetPortPos) {
      x1 = sourcePortPos.x
      y1 = sourcePortPos.y
      x2 = targetPortPos.x
      y2 = targetPortPos.y
    } else {
      if (sourceNode.type === 'start') {
        x1 = sourceNode.x + DEFAULT_NODE_WIDTH - 5
        const params = getNodeOutputParams(sourceNode)
        const paramsHeight = params.length > 0 ? 32 : 0
        const nodeHeight = 40 + paramsHeight
        y1 = sourceNode.y + nodeHeight / 2
      } else {
        y1 = getNodeParamPortPosition(sourceNode, sourceParamIndex, 'output')
        x1 = sourceNode.x + DEFAULT_NODE_WIDTH
      }
      y2 = getNodeParamPortPosition(targetNode, targetParamIndex, 'input')
      x2 = targetNode.x
    }

    const distance = Math.abs(x2 - x1)
    const controlOffset = Math.max(40, Math.min(distance * 0.4, 120))

    const p0x = x1, p0y = y1
    const p1x = x1 + controlOffset, p1y = y1
    const p2x = x2 - controlOffset, p2y = y2
    const p3x = x2, p3y = y2

    const t = 0.5
    const q0x = (1 - t) * p0x + t * p1x
    const q0y = (1 - t) * p0y + t * p1y
    const q1x = (1 - t) * p1x + t * p2x
    const q1y = (1 - t) * p1y + t * p2y
    const q2x = (1 - t) * p2x + t * p3x
    const q2y = (1 - t) * p2y + t * p3y

    const r0x = (1 - t) * q0x + t * q1x
    const r0y = (1 - t) * q0y + t * q1y
    const r1x = (1 - t) * q1x + t * q2x
    const r1y = (1 - t) * q1y + t * q2y

    const midX = (1 - t) * r0x + t * r1x
    const midY = (1 - t) * r0y + t * r1y

    if (part === 'start') {
      return `M ${p0x} ${p0y} C ${q0x} ${q0y}, ${r0x} ${r0y}, ${midX} ${midY}`
    } else {
      return `M ${midX} ${midY} C ${r1x} ${r1y}, ${q2x} ${q2y}, ${p3x} ${p3y}`
    }
  }

  // 判断是否是关联连线
  const isAssociationConnection = (conn) => {
    const sourceNode = nodes.value.find((n) => n.id === conn.sourceId)
    const targetNode = nodes.value.find((n) => n.id === conn.targetId)
    return sourceNode?.type === 'loop' && targetNode?.type === 'loopBody'
  }

  return {
    getActionBtnDomPosition,
    getPortDomPosition,
    getSpecialPortPosition,
    getConnectionPath,
    getConnectionMidpoint,
    tempConnectionPath,
    getConnectionPathPart,
    isAssociationConnection,
  }
}
