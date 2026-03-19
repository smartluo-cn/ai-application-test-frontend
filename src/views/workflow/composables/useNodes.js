/**
 * 节点相关逻辑 Composable
 * 包含节点增删改、选择、参数处理等功能
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getNodeTypeConfig, DEFAULT_NODE_WIDTH } from '../config/workflowConfig'

export function useNodes(nodes, connections, selectedNode, selectedConnection, hoveredConnection) {
  // 重命名对话框
  const renameDialogVisible = ref(false)
  const newNodeName = ref('')

  // 选中节点
  const selectNode = (node, event, hideContextMenu, initConditionConfig, initTextCleanConfig, initLoopConfig) => {
    event?.stopPropagation()
    if (hideContextMenu) {
      hideContextMenu()
    }

    // 循环体节点没有配置面板，点击不选中
    if (node.type === 'loopBody') {
      return
    }

    selectedNode.value = node
    selectedConnection.value = null

    // 初始化不同类型节点的配置
    if (node.type === 'condition' && initConditionConfig) {
      initConditionConfig()
    }
    if (node.type === 'textClean' && initTextCleanConfig) {
      initTextCleanConfig()
    }
    if (node.type === 'loop' && initLoopConfig) {
      initLoopConfig()
    }
  }

  // 选中连线
  const selectConnection = (connection, event, hideContextMenu) => {
    event?.stopPropagation()
    if (hideContextMenu) {
      hideContextMenu()
    }
    selectedConnection.value = connection
    selectedNode.value = null
    hoveredConnection.value = connection
  }

  // 添加节点
  const addNode = (type) => {
    const typeConfig = getNodeTypeConfig(type)
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      name: typeConfig.name,
      x: 200 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      inputs: [{ id: `in-${Date.now()}`, name: '输入' }],
      outputs: [{ id: `out-${Date.now()}`, name: '输出' }],
      config: {},
    }

    // 开始和结束节点特殊处理
    if (type === 'start') {
      newNode.inputs = []
      newNode.inputParams = []
    } else if (type === 'end') {
      newNode.outputs = []
    }

    // 循环节点特殊处理
    if (type === 'loop') {
      newNode.inputParams = []
      newNode.config = {
        arrayElementType: 'string',
      }
    }

    nodes.value.push(newNode)
    selectedNode.value = newNode
  }

  // 删除选中节点
  const deleteSelectedNode = () => {
    if (!selectedNode.value) return

    const nodeId = selectedNode.value.id
    nodes.value = nodes.value.filter((n) => n.id !== nodeId)
    connections.value = connections.value.filter(
      (c) => c.sourceId !== nodeId && c.targetId !== nodeId
    )
    selectedNode.value = null
  }

  // 删除选中连线
  const deleteSelectedConnection = (conn) => {
    const connectionToDelete = conn || selectedConnection.value
    if (!connectionToDelete) return
    connections.value = connections.value.filter((c) => c.id !== connectionToDelete.id)
    selectedConnection.value = null
  }

  // 创建节点副本
  const duplicateNode = () => {
    if (!selectedNode.value) return

    const originalNode = selectedNode.value
    const newNode = {
      ...JSON.parse(JSON.stringify(originalNode)),
      id: `${originalNode.type}-${Date.now()}`,
      name: `${originalNode.name} (副本)`,
      x: originalNode.x + 50,
      y: originalNode.y + 50,
    }

    nodes.value.push(newNode)
    ElMessage.success('副本创建成功')
  }

  // 显示重命名对话框
  const showRenameDialog = () => {
    if (!selectedNode.value) return
    newNodeName.value = selectedNode.value.name
    renameDialogVisible.value = true
  }

  // 确认重命名
  const confirmRename = () => {
    if (!selectedNode.value || !newNodeName.value.trim()) return
    selectedNode.value.name = newNodeName.value.trim()
    renameDialogVisible.value = false
    ElMessage.success('重命名成功')
  }

  // 格式化参数类型显示
  const formatParamType = (param) => {
    if (!param.type) return 'String'
    if (param.type === 'array' && param.elementType) {
      const elementTypes = {
        string: 'String',
        number: 'Number',
        boolean: 'Boolean',
        object: 'Object',
      }
      return `Array[${elementTypes[param.elementType] || 'String'}]`
    }
    return param.type.charAt(0).toUpperCase() + param.type.slice(1)
  }

  // 获取节点的输入参数
  const getNodeInputParams = (node) => {
    if (!node) return []

    // 开始节点：输入参数与输出参数相同
    if (node.type === 'start') {
      const outputParams = node.outputParams || []
      if (outputParams.length === 0) {
        return [{ name: '-', type: '-', isPlaceholder: true }]
      }
      return outputParams.map((param) => ({
        name: param.name || '',
        type: formatParamType(param),
      }))
    }

    // 表格提取节点
    if (node.type === 'tableExtract') {
      return [
        {
          name: 'file',
          type: 'File',
          required: true,
          description: '需要提取数据的表格文件',
        },
      ]
    }

    // 文本清洗节点
    if (node.type === 'textClean') {
      return [
        { name: 'input_file', type: 'File', required: true, description: '需要被清洗的目标xlsx文件' },
        { name: 'cols', type: 'String', required: true, description: '指定xlsx文件中需要清洗的列（英文逗号分隔）' },
        { name: 'remove_extra_spaces', type: 'Boolean', required: false, description: '是否去除多余空格' },
        { name: 'remove_html_tags', type: 'Boolean', required: false, description: '是否去除HTML标签' },
        { name: 'remove_special_chars', type: 'Boolean', required: false, description: '是否去除特殊字符' },
        { name: 'standardized_newline_char', type: 'Boolean', required: false, description: '是否标准化换行符' },
        { name: 'trim_front_back', type: 'Boolean', required: false, description: '是否去除首尾空白' },
      ]
    }

    // 条件判断节点
    if (node.type === 'condition') {
      const variables = new Set()
      if (node.config?.branches) {
        node.config.branches.forEach((branch) => {
          branch.conditions?.forEach((cond) => {
            if (cond.variable) {
              variables.add(cond.variable)
            }
          })
        })
      }
      return Array.from(variables).map((v) => ({
        name: v,
        type: 'Any',
      }))
    }

    // 循环节点
    if (node.type === 'loop') {
      const params = []
      params.push({ name: 'times', type: 'Number', required: false, description: '循环次数，要求为正整数' })
      params.push({
        name: 'cycle_array',
        type: 'Array',
        required: false,
        description: '循环数组',
        elementType: node.config?.arrayElementType || 'string',
      })
      if (node.inputParams && node.inputParams.length > 0) {
        node.inputParams.forEach((param) => {
          if (param.name) {
            params.push({
              name: param.name,
              type: formatParamType(param),
              required: param.required || false,
              description: param.description || '',
            })
          }
        })
      }
      return params
    }

    return [{ name: 'input', type: 'Any' }]
  }

  // 获取节点的输出参数
  const getNodeOutputParams = (node) => {
    if (!node) return []

    if (node.type === 'start') {
      const outputParams = node.outputParams || []
      if (outputParams.length === 0) {
        return [{ name: '-', type: '-', isPlaceholder: true }]
      }
      return outputParams.map((param) => ({
        name: param.name || '',
        type: formatParamType(param),
      }))
    }

    if (node.type === 'end') {
      const inputParams = getNodeInputParams(node)
      if (inputParams.length === 0) {
        return [{ name: '-', type: '-', isPlaceholder: true }]
      }
      return inputParams
    }

    if (node.type === 'tableExtract') {
      const outputParams = node.outputParams || []
      if (outputParams.length === 0) {
        return [{ name: '-', type: '-', isPlaceholder: true }]
      }
      return outputParams.map((param) => ({
        name: param.name || '',
        type: 'String',
      }))
    }

    if (node.type === 'textClean') {
      return [{ name: 'output_file', type: 'File', description: '被清洗之后的xlsx文件' }]
    }

    if (node.type === 'condition') {
      return [{ name: 'result', type: 'Boolean' }]
    }

    if (node.type === 'aiAuto') {
      return [
        { name: 'response', type: 'String' },
        { name: 'tokens', type: 'Number' },
      ]
    }

    if (node.type === 'apiAuto') {
      const responseValue = node.config?.responseValue
      if (responseValue && typeof responseValue === 'string' && responseValue.trim()) {
        try {
          const parsed = JSON.parse(responseValue.trim())
          if (typeof parsed === 'object' && parsed !== null) {
            const outputs = []
            const flattenObject = (obj, prefix = '') => {
              for (const key in obj) {
                const varName = prefix ? `${prefix}.${key}` : key
                const value = obj[key]
                if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                  flattenObject(value, varName)
                } else {
                  let varType = 'String'
                  if (typeof value === 'number') varType = 'Number'
                  else if (typeof value === 'boolean') varType = 'Boolean'
                  else if (Array.isArray(value)) varType = 'Array'
                  outputs.push({ name: varName, type: varType })
                }
              }
            }
            flattenObject(parsed)
            if (outputs.length > 0) {
              return outputs
            }
          }
        } catch (e) {
          // 不是有效的JSON
        }
      }
      return [
        { name: 'response', type: 'String' },
        { name: 'statusCode', type: 'Number' },
      ]
    }

    if (node.type === 'textGenerate') {
      return [{ name: 'text', type: 'String' }]
    }

    if (node.type === 'imageGenerate') {
      return [{ name: 'imageUrl', type: 'String' }]
    }

    if (node.type === 'audioToText') {
      return [{ name: 'text', type: 'String' }]
    }

    if (node.type === 'judgeModel') {
      return [
        { name: 'score', type: 'Number' },
        { name: 'reason', type: 'String' },
      ]
    }

    if (['firstTokenLatency', 'tokenOutputTime', 'e2eLatency'].includes(node.type)) {
      return [{ name: 'latency', type: 'Number' }]
    }

    if (node.type === 'reportGenerate') {
      return [{ name: 'reportUrl', type: 'String' }]
    }

    return [{ name: '-', type: '-', isPlaceholder: true }]
  }

  // 计算节点参数端口位置
  const getNodeParamPortPosition = (node, paramIndex, type) => {
    const headerHeight = 56
    let startY = node.y + headerHeight

    const inputParams = getNodeInputParams(node)
    if (type === 'output' && inputParams.length > 0) {
      startY += 36
    }

    startY += paramIndex * 24

    return startY
  }

  return {
    renameDialogVisible,
    newNodeName,
    selectNode,
    selectConnection,
    addNode,
    deleteSelectedNode,
    deleteSelectedConnection,
    duplicateNode,
    showRenameDialog,
    confirmRename,
    formatParamType,
    getNodeInputParams,
    getNodeOutputParams,
    getNodeParamPortPosition,
  }
}
