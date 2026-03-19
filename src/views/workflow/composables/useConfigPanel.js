/**
 * 配置面板逻辑 Composable
 * 包含各类型节点的配置初始化、参数增删改、变量选择等功能
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export function useConfigPanel(selectedNode, nodes, connections, getNodeOutputParams) {
  // 当前正在选择变量的字段
  const variableSelectorField = ref(null)
  const showVariableSelectorDialog = ref(false)

  // 测评集列表数据
  const datasetList = ref([
    {
      id: '1',
      name: '通用对话测评集',
      dictionaryId: 'dict-1',
      columns: [
        { key: 'id', label: 'ID', type: 'string' },
        { key: 'input', label: '输入', type: 'string' },
        { key: 'expectedOutput', label: '期望输出', type: 'string' },
      ],
    },
    {
      id: '2',
      name: '代码生成测评集',
      dictionaryId: 'dict-2',
      columns: [
        { key: 'id', label: 'ID', type: 'string' },
        { key: 'prompt', label: '提示词', type: 'string' },
        { key: 'expectedCode', label: '期望代码', type: 'string' },
      ],
    },
    {
      id: '3',
      name: '文本摘要测评集',
      dictionaryId: 'dict-3',
      columns: [
        { key: 'id', label: 'ID', type: 'string' },
        { key: 'originalText', label: '原文', type: 'string' },
        { key: 'expectedSummary', label: '期望摘要', type: 'string' },
      ],
    },
    {
      id: '4',
      name: '情感分析测评集',
      dictionaryId: 'dict-5',
      columns: [
        { key: 'id', label: 'ID', type: 'string' },
        { key: 'text', label: '文本', type: 'string' },
        { key: 'expectedSentiment', label: '期望情感', type: 'enum' },
      ],
    },
    {
      id: '5',
      name: '翻译能力测评集',
      dictionaryId: 'dict-6',
      columns: [
        { key: 'id', label: 'ID', type: 'string' },
        { key: 'sourceText', label: '源文本', type: 'string' },
        { key: 'expectedTranslation', label: '期望翻译', type: 'string' },
      ],
    },
  ])

  // 添加输入参数
  const addInputParam = () => {
    if (!selectedNode.value) return
    if (!selectedNode.value.inputParams) {
      selectedNode.value.inputParams = []
    }
    selectedNode.value.inputParams.push({
      name: '',
      type: 'string',
      required: false,
    })
  }

  // 删除输入参数
  const removeInputParam = (index) => {
    if (!selectedNode.value || !selectedNode.value.inputParams) return
    selectedNode.value.inputParams.splice(index, 1)
  }

  // 添加输出参数（用于开始节点）
  const addOutputParam = () => {
    if (!selectedNode.value) return
    if (!selectedNode.value.outputParams) {
      selectedNode.value.outputParams = []
    }
    selectedNode.value.outputParams.push({
      name: '',
      type: 'string',
      elementType: 'string',
      required: false,
    })
  }

  // 删除输出参数
  const removeOutputParam = (index) => {
    if (!selectedNode.value || !selectedNode.value.outputParams) return
    selectedNode.value.outputParams.splice(index, 1)
  }

  // 初始化条件判断节点配置
  const initConditionConfig = () => {
    if (!selectedNode.value) return
    if (!selectedNode.value.config.branches) {
      selectedNode.value.config.branches = [
        {
          id: `branch-${Date.now()}`,
          name: '分支1',
          logic: 'and',
          conditions: [
            {
              id: `cond-${Date.now()}`,
              variable: '',
              operator: 'eq',
              value: '',
            },
          ],
        },
      ]
    }
  }

  // 添加条件分支
  const addConditionBranch = () => {
    if (!selectedNode.value) return
    initConditionConfig()
    const branchCount = selectedNode.value.config.branches.length + 1
    selectedNode.value.config.branches.push({
      id: `branch-${Date.now()}`,
      name: `分支${branchCount}`,
      logic: 'and',
      conditions: [
        {
          id: `cond-${Date.now()}`,
          variable: '',
          operator: 'eq',
          value: '',
        },
      ],
    })
    updateConditionOutputs()
  }

  // 删除条件分支
  const removeConditionBranch = (index) => {
    if (!selectedNode.value || !selectedNode.value.config.branches) return
    if (selectedNode.value.config.branches.length <= 1) return
    selectedNode.value.config.branches.splice(index, 1)
    updateConditionOutputs()
  }

  // 添加条件
  const addCondition = (branchIndex) => {
    if (!selectedNode.value || !selectedNode.value.config.branches) return
    const branch = selectedNode.value.config.branches[branchIndex]
    if (!branch.conditions) {
      branch.conditions = []
    }
    branch.conditions.push({
      id: `cond-${Date.now()}`,
      variable: '',
      operator: 'eq',
      value: '',
    })
  }

  // 删除条件
  const removeCondition = (branchIndex, condIndex) => {
    if (!selectedNode.value || !selectedNode.value.config.branches) return
    const branch = selectedNode.value.config.branches[branchIndex]
    if (!branch.conditions) return
    branch.conditions.splice(condIndex, 1)
    if (branch.conditions.length === 0) {
      branch.conditions.push({
        id: `cond-${Date.now()}`,
        variable: '',
        operator: 'eq',
        value: '',
      })
    }
  }

  // 更新条件节点的输出端口
  const updateConditionOutputs = () => {
    if (!selectedNode.value || selectedNode.value.type !== 'condition') return
    const branches = selectedNode.value.config.branches || []
    const outputs = branches.map((branch, index) => ({
      id: `out-branch-${index}`,
      name: branch.name,
    }))
    outputs.push({
      id: 'out-default',
      name: '默认',
    })
    selectedNode.value.outputs = outputs
  }

  // 初始化循环节点配置
  const initLoopConfig = () => {
    if (!selectedNode.value) return
    if (!selectedNode.value.inputParams) {
      selectedNode.value.inputParams = []
    }
    if (!selectedNode.value.config) {
      selectedNode.value.config = {}
    }
    if (!selectedNode.value.config.arrayElementType) {
      selectedNode.value.config.arrayElementType = 'string'
    }
  }

  // 添加循环节点的自定义输入变量
  const addLoopInputParam = () => {
    if (!selectedNode.value) return
    if (!selectedNode.value.inputParams) {
      selectedNode.value.inputParams = []
    }
    selectedNode.value.inputParams.push({
      name: '',
      type: 'string',
      elementType: 'string',
      required: false,
      description: '',
    })
  }

  // 删除循环节点的自定义输入变量
  const removeLoopInputParam = (index) => {
    if (!selectedNode.value || !selectedNode.value.inputParams) return
    selectedNode.value.inputParams.splice(index, 1)
  }

  // 初始化文本清洗节点配置
  const initTextCleanConfig = () => {
    if (!selectedNode.value) return
    if (!selectedNode.value.config.inputType) {
      selectedNode.value.config.inputType = 'text'
      selectedNode.value.config.textContent = ''
      selectedNode.value.config.datasetId = ''
      selectedNode.value.config.datasetFields = []
      selectedNode.value.config.removeExtraSpaces = true
      selectedNode.value.config.removeHtmlTags = false
      selectedNode.value.config.removeSpecialChars = false
      selectedNode.value.config.normalizeNewlines = true
      selectedNode.value.config.trimWhitespace = true
    }
  }

  // 处理文件上传
  const handleFileUpload = (file, field) => {
    if (!selectedNode.value) return false

    const isValidType = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    if (!isValidType) {
      ElMessage.warning('请上传 xlsx 或 xls 格式的文件')
      return false
    }

    selectedNode.value.config[field] = file.name
    ElMessage.success(`文件 ${file.name} 已选择`)
    return false
  }

  // 显示变量选择器
  const showVariableSelector = (field) => {
    variableSelectorField.value = field
    showVariableSelectorDialog.value = true
  }

  // 获取前置节点的输出变量列表
  const getUpstreamNodeOutputs = () => {
    if (!selectedNode.value) return []

    const outputs = []
    const visitedNodes = new Set()

    const findUpstreamNodes = (nodeId) => {
      if (visitedNodes.has(nodeId)) return
      visitedNodes.add(nodeId)

      const incomingConns = connections.value.filter((c) => c.targetId === nodeId)
      incomingConns.forEach((conn) => {
        const sourceNode = nodes.value.find((n) => n.id === conn.sourceId)
        if (sourceNode && !visitedNodes.has(sourceNode.id)) {
          const nodeOutputs = getNodeOutputParams(sourceNode)
          nodeOutputs.forEach((param) => {
            outputs.push({
              nodeId: sourceNode.id,
              nodeName: sourceNode.name,
              param: param.name,
              type: param.type,
              variable: `\${${sourceNode.name}.${param.name}}`,
            })
          })
          findUpstreamNodes(sourceNode.id)
        }
      })
    }

    findUpstreamNodes(selectedNode.value.id)
    return outputs
  }

  // 选择变量
  const selectVariable = (variable) => {
    if (!selectedNode.value || !variableSelectorField.value) return
    selectedNode.value.config[variableSelectorField.value] = variable
    showVariableSelectorDialog.value = false
    variableSelectorField.value = null
  }

  // 获取选中的测评集
  const getSelectedDataset = () => {
    if (!selectedNode.value || !selectedNode.value.config.datasetId) return null
    return datasetList.value.find((d) => d.id === selectedNode.value.config.datasetId)
  }

  // 获取测评集的字段列表
  const getDatasetFields = () => {
    const dataset = getSelectedDataset()
    if (!dataset) return []
    return dataset.columns.filter((col) => col.type === 'string')
  }

  // 当测评集选择变化时
  const onDatasetChange = () => {
    if (selectedNode.value) {
      selectedNode.value.config.datasetFields = []
    }
  }

  // 获取输出格式预览
  const getOutputFormatPreview = () => {
    if (!selectedNode.value) return ''

    const config = selectedNode.value.config
    const inputType = config.inputType || 'text'

    if (inputType === 'text') {
      return `"清洗后的文本内容示例"`
    } else {
      const fields = config.datasetFields || []
      const sampleFields = fields.length > 0 ? fields : ['question', 'answer']

      const items = sampleFields.map((field) => ({
        field: field,
        originalContent: `原始${field}内容示例`,
        cleanedContent: `清洗后的${field}内容示例`,
      }))
      return JSON.stringify(items, null, 2)
    }
  }

  return {
    variableSelectorField,
    showVariableSelectorDialog,
    datasetList,
    addInputParam,
    removeInputParam,
    addOutputParam,
    removeOutputParam,
    initConditionConfig,
    addConditionBranch,
    removeConditionBranch,
    addCondition,
    removeCondition,
    updateConditionOutputs,
    initLoopConfig,
    addLoopInputParam,
    removeLoopInputParam,
    initTextCleanConfig,
    handleFileUpload,
    showVariableSelector,
    getUpstreamNodeOutputs,
    selectVariable,
    getSelectedDataset,
    getDatasetFields,
    onDatasetChange,
    getOutputFormatPreview,
  }
}
