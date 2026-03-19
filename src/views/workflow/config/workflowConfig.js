/**
 * 工作流编辑器配置文件
 * 包含节点类型、分类、图标映射等配置
 */

// 节点类型分组配置
export const nodeCategories = [
  { key: 'logic', name: '逻辑处理' },
  { key: 'testDesign', name: '测试设计' },
  { key: 'testPrep', name: '测试准备' },
  { key: 'testExec', name: '测试执行' },
  { key: 'eval', name: '结果评估' },
  { key: 'report', name: '报告' },
]

// 节点类型配置
export const nodeTypes = [
  // 基础（不在弹窗中显示）
  { type: 'start', name: '开始', icon: 'VideoPlay', color: '#10b981', category: 'basic' },
  { type: 'end', name: '结束', icon: 'CircleCheck', color: '#ef4444', category: 'basic' },
  // 逻辑处理
  { type: 'condition', name: '条件判断', icon: 'Brush', color: '#ec4899', category: 'logic' },
  { type: 'loop', name: '循环', icon: 'Timer', color: '#3b82f6', category: 'logic' },
  { type: 'loopBody', name: '循环体', icon: 'Grid', color: '#06b6d4', category: 'basic' }, // 循环体节点，不在弹窗中显示
  // 测试准备
  { type: 'envConnect', name: '环境对接', icon: 'Monitor', color: '#64748b', category: 'testPrep' },
  { type: 'tableExtract', name: '表格提取', icon: 'Grid', color: '#10b981', category: 'testPrep' },
  { type: 'textClean', name: '文本清洗', icon: 'Document', color: '#6366f1', category: 'testPrep' },
  { type: 'textDedupe', name: '文本去重', icon: 'Files', color: '#8b5cf6', category: 'testPrep' },
  { type: 'textGeneralize', name: '文本泛化', icon: 'EditPen', color: '#a855f7', category: 'testPrep' },
  { type: 'textGenerate', name: '文本生成', icon: 'ChatDotRound', color: '#06b6d4', category: 'testPrep' },
  { type: 'imageGenerate', name: '图像生成', icon: 'Picture', color: '#f59e0b', category: 'testPrep' },
  { type: 'imageCutout', name: '抠图', icon: 'Crop', color: '#84cc16', category: 'testPrep' },
  { type: 'imageEnhance', name: '画质提升', icon: 'DataLine', color: '#22c55e', category: 'testPrep' },
  { type: 'videoExtractAudio', name: '视频提取音频', icon: 'Film', color: '#0ea5e9', category: 'testPrep' },
  { type: 'audioToText', name: '音频转文本', icon: 'Microphone', color: '#14b8a6', category: 'testPrep' },
  { type: 'videoFrame', name: '视频抽帧', icon: 'Film', color: '#64748b', category: 'testPrep' },
  // 测试设计
  { type: 'testPlan', name: '测试方案生成', icon: 'DocumentAdd', color: '#f97316', category: 'testDesign' },
  // 测试执行
  { type: 'apiAuto', name: 'HTTPS/HTTP接口调用', icon: 'Connection', color: '#3b82f6', category: 'testExec' },
  { type: 'aiAuto', name: 'AI自动化', icon: 'Cpu', color: '#8b5cf6', category: 'testExec' },
  // 结果评估
  { type: 'judgeModel', name: '裁判模型', icon: 'DataAnalysis', color: '#ec4899', category: 'eval' },
  { type: 'firstTokenLatency', name: '首Token响应时延', icon: 'Stopwatch', color: '#f59e0b', category: 'eval' },
  { type: 'tokenOutputTime', name: '每Token输出耗时', icon: 'TrendingCharts', color: '#06b6d4', category: 'eval' },
  { type: 'e2eLatency', name: '端到端时延', icon: 'Timer', color: '#6366f1', category: 'eval' },
  // 报告
  { type: 'reportGenerate', name: '生成报告', icon: 'DocumentAdd', color: '#10b981', category: 'report' },
  { type: 'reportAnalysis', name: '报告分析', icon: 'TrendCharts', color: '#0ea5e9', category: 'report' },
]

// 节点功能描述映射
export const nodeDescriptions = {
  tableExtract: '从表格文件中提取指定列的数据',
  textClean: '对文本数据进行清洗、过滤和标准化处理',
}

// 变量类型级联选择器数据
export const typeOptions = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'Object' },
  {
    value: 'array',
    label: 'Array',
    children: [
      { value: 'string', label: 'String' },
      { value: 'number', label: 'Number' },
      { value: 'boolean', label: 'Boolean' },
      { value: 'object', label: 'Object' },
    ],
  },
]

// 常量配置
export const CLICK_THRESHOLD = 200 // 点击阈值（毫秒）
export const MOVE_THRESHOLD = 5 // 移动阈值（像素）
export const LONG_PRESS_THRESHOLD = 150 // 长按阈值（毫秒）
export const DEFAULT_NODE_WIDTH = 220 // 默认节点宽度

// 获取节点类型配置
export const getNodeTypeConfig = (type) => {
  return nodeTypes.find((t) => t.type === type) || nodeTypes[0]
}

// 将参数的 type 和 elementType 转换为级联选择器的值
export const getTypeValue = (param) => {
  if (!param.type) return ['string']
  if (param.type === 'array') {
    return ['array', param.elementType || 'string']
  }
  return [param.type]
}

// 处理级联选择器值变化
export const handleTypeChange = (value, row) => {
  if (!value || value.length === 0) {
    row.type = 'string'
    row.elementType = undefined
    return
  }
  if (value[0] === 'array') {
    row.type = 'array'
    row.elementType = value[1] || 'string'
  } else {
    row.type = value[0]
    row.elementType = undefined
  }
}
