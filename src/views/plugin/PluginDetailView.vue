<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  VideoPlay,
  CopyDocument,
  Setting,
  Edit,
  Check,
  Close,
  Plus,
  FullScreen,
  Collection,
  Delete,
  Warning,
  CircleCheck,
  Download,
  Document,
  FolderOpened,
  DataAnalysis,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import 'highlight.js/styles/atom-one-dark.css'

// 注册 Python 语法
hljs.registerLanguage('python', python)

const route = useRoute()
const router = useRouter()

// 插件数据
const plugin = ref(null)

// 编辑状态 - 每个区块独立编辑
const isEditingBasicInfo = ref(false)
const isEditingCode = ref(false)
const isEditingParams = ref(false)
const isFullscreen = ref(false)
const codeTextareaRef = ref(null)

// 基本信息编辑表单
const basicInfoForm = reactive({
  name: '',
  description: '',
  category: 'data',
  tags: [],
  status: 'active',
  dataDictionaryId: '',
})

// 代码编辑表单
const codeForm = reactive({
  code: '',
})

// 参数编辑表单
const paramsForm = reactive({
  params: [],
})

// 代码行数
const codeLines = computed(() => {
  const lines = codeForm.code.split('\n').length
  return Math.max(lines, 15)
})

// 高亮后的代码
const highlightedCode = computed(() => {
  try {
    return hljs.highlight(codeForm.code, { language: 'python' }).value
  } catch {
    return codeForm.code
  }
})

// 是否可编辑（系统插件不允许编辑）
const canEdit = computed(() => {
  return plugin.value?.source !== 'system'
})

// 获取类型对应的 Python 类型注解
const getTypeAnnotation = (type) => {
  const typeMap = {
    string: 'str',
    number: 'float | int',
    boolean: 'bool',
    json: 'dict | Any',
  }
  return typeMap[type] || 'Any'
}

// 动态生成 config 参数的注释文档
const configParamDoc = computed(() => {
  // 根据编辑状态决定使用哪个参数列表
  const params = isEditingParams.value ? paramsForm.params : (plugin.value?.params || [])

  if (!params || params.length === 0) {
    return null
  }

  const lines = [
    '    """',
    '    执行插件函数',
    '',
    '    Args:',
    '        input_data: 输入数据',
    '        config: 配置参数对象，包含以下属性：',
  ]

  params.forEach(param => {
    const typeAnnotation = getTypeAnnotation(param.type)
    const defaultVal = param.default !== '' ? ` (默认: ${param.default})` : ''
    const desc = param.description || '无描述'
    lines.push(`            - ${param.name}: ${typeAnnotation}${defaultVal}`)
    lines.push(`              ${desc}`)
  })

  lines.push('    """')

  return lines.join('\n')
})

// 参数编辑对话框
const paramDialogVisible = ref(false)
const isEditParamMode = ref(false)
const editingParamIndex = ref(-1)
const paramFormData = reactive({
  name: '',
  type: 'string',
  default: '',
  description: '',
})

// 参数类型选项
const paramTypes = [
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔值' },
  { value: 'json', label: 'JSON' },
]

// 分类选项
const categoryOptions = [
  { value: 'data', label: '数据处理' },
  { value: 'execution', label: '测试执行' },
  { value: 'evaluation', label: '结果评估' },
  { value: 'metrics', label: '指标采集' },
]

// 系统打点数据源（指标采集专用）
const systemDataSources = [
  { value: 'response_time', label: '响应时间', type: 'number' },
  { value: 'request_count', label: '请求次数', type: 'number' },
  { value: 'token_count', label: 'Token数量', type: 'number' },
  { value: 'status', label: '请求状态', type: 'enum', options: ['success', 'error', 'timeout'] },
  { value: 'model_name', label: '模型名称', type: 'string' },
  { value: 'prompt_tokens', label: '输入Token', type: 'number' },
  { value: 'completion_tokens', label: '输出Token', type: 'number' },
]

// 聚合方式选项（指标采集专用）
const aggregationOptions = [
  { value: 'sum', label: '求和', description: '计算总和' },
  { value: 'avg', label: '平均值', description: '计算平均值' },
  { value: 'max', label: '最大值', description: '获取最大值' },
  { value: 'min', label: '最小值', description: '获取最小值' },
  { value: 'count', label: '计数', description: '统计数量' },
  { value: 'p50', label: 'P50', description: '50分位数' },
  { value: 'p95', label: 'P95', description: '95分位数' },
  { value: 'p99', label: 'P99', description: '99分位数' },
  { value: 'percentage', label: '百分比', description: '计算占比' },
]

// 预设标签选项
const presetTags = [
  '数据处理',
  '文本清洗',
  'JSON',
  '安全',
  '测试执行',
  'HTTP',
  'API',
  '数据库',
  '结果评估',
  'NLP',
  '性能',
  '文本匹配',
  '工具',
  '转换',
  '指标采集',
  '监控',
]

// 数据字典列表
const dataDictionaries = ref([
  {
    id: 'dict-1',
    name: '通用对话测试',
    description: '用于测试模型的基础对话能力，包含多轮对话、意图识别等测试场景',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'input', label: '输入', type: 'string' },
      { key: 'expectedOutput', label: '期望输出', type: 'string' },
    ],
  },
  {
    id: 'dict-2',
    name: '代码生成测试',
    description: '用于测试模型的代码生成能力，包含 Python、Java、SQL 等编程语言的代码生成测试',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'prompt', label: '提示词', type: 'string' },
      { key: 'expectedCode', label: '期望代码', type: 'string' },
    ],
  },
  {
    id: 'dict-3',
    name: '文本摘要测试',
    description: '用于测试模型的文本摘要能力',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'originalText', label: '原文', type: 'string' },
      { key: 'expectedSummary', label: '期望摘要', type: 'string' },
    ],
  },
  {
    id: 'dict-4',
    name: '阅读理解测试',
    description: '用于测试模型的阅读理解和信息提取能力',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'passage', label: '文章', type: 'string' },
      { key: 'question', label: '问题', type: 'string' },
      { key: 'answer', label: '答案', type: 'string' },
    ],
  },
  {
    id: 'dict-5',
    name: '情感分析测试',
    description: '用于测试模型的情感分析能力',
    columns: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'text', label: '文本', type: 'string' },
      { key: 'sentiment', label: '情感', type: 'string' },
    ],
  },
])

// 需要关联数据字典的分类
const categoriesRequireDictionary = ['data', 'execution', 'evaluation']

// 测评集列表（模拟数据）
const allDatasets = ref([
  {
    id: '1',
    name: '通用对话测评集',
    testType: 'objective',
    tags: ['对话', '通用'],
    description: '包含多轮对话、常识问答等通用场景的测试数据',
    dataCount: 256,
    dictionaryId: 'dict-1',
  },
  {
    id: '2',
    name: '代码生成测评集',
    testType: 'objective',
    tags: ['代码', '编程'],
    description: '包含多种编程语言的代码生成任务',
    dataCount: 128,
    dictionaryId: 'dict-2',
  },
  {
    id: '3',
    name: '文档理解测评集',
    testType: 'objective',
    tags: ['文档', '理解'],
    description: '包含长文档阅读理解、信息提取等任务',
    dataCount: 512,
    dictionaryId: 'dict-3',
  },
  {
    id: '4',
    name: '数据分析测评集',
    testType: 'objective',
    tags: ['数据', '分析'],
    description: '包含数据解读、图表分析等任务',
    dataCount: 96,
    dictionaryId: 'dict-1',
  },
  {
    id: '5',
    name: '数学推理测评集',
    testType: 'objective',
    tags: ['数学', '推理'],
    description: '包含数学计算、逻辑推理等任务',
    dataCount: 180,
    dictionaryId: 'dict-4',
  },
  {
    id: '6',
    name: '情感分析测评集',
    testType: 'objective',
    tags: ['情感', '分析'],
    description: '包含正面、负面、中性情感的文本分析',
    dataCount: 200,
    dictionaryId: 'dict-5',
  },
])

// 是否需要选择测评集（数据处理、测试执行、结果评估）
const needsDatasetSelection = computed(() => {
  return plugin.value && categoriesRequireDictionary.includes(plugin.value.category)
})

// 获取同一数据字典的测评集列表
const availableDatasets = computed(() => {
  if (!plugin.value || !plugin.value.dataDictionaryId) {
    return []
  }
  return allDatasets.value.filter(d => d.dictionaryId === plugin.value.dataDictionaryId)
})

// 测试相关
const testInput = ref('')
const selectedDatasetId = ref('') // 选中的测评集ID
const testConfig = ref('{}')
const testResult = ref('')
const isTesting = ref(false)
const testProgress = ref(0) // 测试进度 0-100
const testLogs = ref([]) // 测试执行日志
const logContainerRef = ref(null) // 日志容器引用

// 处理后的数据集（数据处理、测试执行、结果评估类型插件）
const processedData = ref(null) // 处理后的数据
const processedColumns = ref([]) // 数据列定义
const processedCount = ref(0) // 处理的数据条数
const isSavingDataset = ref(false) // 是否正在保存为测评集
const saveDialogVisible = ref(false) // 保存对话框
const isDownloading = ref(false) // 是否正在下载
const newDatasetForm = reactive({
  name: '',
  description: '',
  tags: [],
})

// ========== 指标采集插件专用变量 ==========
// 指标配置表单
const metricsForm = reactive({
  metrics: [],
})
const isEditingMetrics = ref(false)

// 指标编辑对话框
const metricDialogVisible = ref(false)
const isEditMetricMode = ref(false)
const editingMetricIndex = ref(-1)
const metricFormData = reactive({
  id: '',
  name: '',
  displayName: '',
  source: '',
  aggregation: '',
  unit: '',
  description: '',
})

// 指标采集测试
const metricsTestDataCount = ref(100) // 模拟数据量
const metricsResult = ref(null) // 采集结果
const isMetricsTesting = ref(false) // 是否正在测试
const metricsTestProgress = ref(0) // 测试进度
const metricsTestLogs = ref([]) // 测试日志
const metricsLogContainerRef = ref(null) // 日志容器引用

// 结果集标题（根据插件类别）
const resultSetTitle = computed(() => {
  const titles = {
    data: '处理后的数据集',
    execution: '执行结果集',
    evaluation: '评估结果集',
  }
  return titles[plugin.value?.category] || '结果集'
})

// 添加日志
const addLog = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  testLogs.value.push({
    id: Date.now(),
    timestamp,
    message,
    type, // info, success, error, warning
  })
  // 自动滚动到底部
  nextTick(() => {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
    }
  })
}

// 清空日志
const clearLogs = () => {
  testLogs.value = []
  testProgress.value = 0
  testResult.value = ''
}

// 加载插件数据
const loadPlugin = () => {
  const id = route.params.id
  // 模拟数据
  const mockPlugins = {
    'plugin-1': {
      id: 'plugin-1',
      name: '数据预处理脚本',
      description: '对输入数据进行清洗和标准化处理，去除多余空白、统一换行符、移除HTML标签',
      category: 'data',
      tags: ['数据处理', '文本清洗'],
      source: 'system',
      dataDictionaryId: 'dict-1',
      code: `def execute(input_data, config):
    import re
    result = input_data.strip()
    result = result.replace('\\r\\n', '\\n')
    result = re.sub(r'<[^>]+>', '', result)
    return result`,
      params: [
        { name: 'remove_html', type: 'boolean', default: 'true', description: '是否移除HTML标签' },
      ],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-02-26 15:30',
      createdAt: '2024-02-15',
      updatedAt: '2024-02-20',
    },
    'plugin-2': {
      id: 'plugin-2',
      name: 'JSON 数据提取',
      description: '从嵌套 JSON 中提取指定路径的数据，支持多级路径访问',
      category: 'data',
      tags: ['数据处理', 'JSON'],
      source: 'custom',
      dataDictionaryId: 'dict-2',
      code: `def execute(input_data, config):
    import json
    def get_nested_value(obj, path):
        keys = path.split('.')
        result = obj
        for key in keys:
            if isinstance(result, dict) and key in result:
                result = result[key]
            else:
                return None
        return result
    path = config.get('path', '')
    data = json.loads(input_data) if isinstance(input_data, str) else input_data
    return get_nested_value(data, path)`,
      params: [
        { name: 'path', type: 'string', default: '', description: '数据路径，如 data.result' },
      ],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-02-26 14:20',
      createdAt: '2024-02-01',
      updatedAt: '2024-02-15',
    },
    'plugin-3': {
      id: 'plugin-3',
      name: '敏感词过滤',
      description: '检测并过滤文本中的敏感词汇，返回过滤后的文本和发现的敏感词列表',
      category: 'data',
      tags: ['数据处理', '安全'],
      source: 'system',
      code: `def execute(input_data, config):
    text = str(input_data)
    sensitive_words = config.get('words', '').split(',')
    found_words = []
    filtered_text = text
    for word in sensitive_words:
        word = word.strip()
        if word and word in text:
            found_words.append(word)
            filtered_text = filtered_text.replace(word, '*' * len(word))
    return {
        'has_sensitive': len(found_words) > 0,
        'found_words': found_words,
        'filtered_text': filtered_text
    }`,
      params: [
        { name: 'words', type: 'string', default: '', description: '敏感词列表，逗号分隔' },
      ],
      status: 'active',
      testResult: 'failed',
      lastTestTime: '2024-02-25 10:00',
      createdAt: '2024-02-25',
      updatedAt: '2024-02-26',
    },
    'plugin-4': {
      id: 'plugin-4',
      name: 'HTTP 请求执行器',
      description: '执行自定义 HTTP 请求，支持 GET、POST 等方法，可配置请求头和请求体',
      category: 'execution',
      tags: ['测试执行', 'HTTP', 'API'],
      code: `def execute(input_data, config):
    import urllib.request
    import json

    url = config.get('url', '')
    method = config.get('method', 'GET')
    headers = config.get('headers', {})

    req = urllib.request.Request(url, method=method)
    for key, value in headers.items():
        req.add_header(key, value)

    if method == 'POST' and input_data:
        req.data = json.dumps(input_data).encode()

    with urllib.request.urlopen(req) as response:
        return response.read().decode()

    return None`,
      params: [
        { name: 'url', type: 'string', default: '', description: '请求URL' },
        { name: 'method', type: 'string', default: 'GET', description: '请求方法' },
      ],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-02-26 16:00',
      createdAt: '2024-02-10',
      updatedAt: '2024-02-18',
    },
    'plugin-5': {
      id: 'plugin-5',
      name: '数据库查询执行器',
      description: '执行 SQL 查询语句，支持 MySQL、PostgreSQL 等数据库',
      category: 'execution',
      tags: ['测试执行', '数据库'],
      code: `def execute(input_data, config):
    # 数据库查询执行器
    # 注意：实际使用需要安装相应数据库驱动
    query = config.get('query', '')
    params = input_data if isinstance(input_data, list) else []

    # 模拟执行
    return {
        'query': query,
        'params': params,
        'rows': [],
        'rowcount': 0
    }`,
      params: [
        { name: 'query', type: 'string', default: '', description: 'SQL查询语句' },
      ],
      status: 'inactive',
      testResult: 'pending',
      lastTestTime: null,
      createdAt: '2024-01-20',
      updatedAt: '2024-02-10',
    },
    'plugin-6': {
      id: 'plugin-6',
      name: '文本相似度评估',
      description: '计算两个文本之间的相似度分数，返回0-1之间的浮点数',
      category: 'evaluation',
      tags: ['结果评估', 'NLP'],
      code: `def execute(input_data, config):
    from difflib import SequenceMatcher

    text1 = input_data.get('text1', '')
    text2 = input_data.get('text2', '')

    similarity = SequenceMatcher(None, text1, text2).ratio()
    return {
        'similarity': similarity,
        'percentage': similarity * 100
    }`,
      params: [],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-02-26 11:00',
      createdAt: '2024-02-10',
      updatedAt: '2024-02-18',
    },
    'plugin-7': {
      id: 'plugin-7',
      name: '响应时间分析',
      description: '分析 API 响应时间并生成统计报告，包括最小值、最大值、平均值、中位数、P95等',
      category: 'evaluation',
      tags: ['结果评估', '性能'],
      code: `def execute(input_data, config):
    times = input_data if isinstance(input_data, list) else [input_data]

    if not times:
        return {'error': 'No data provided'}

    sorted_times = sorted(times)
    n = len(sorted_times)

    result = {
        'count': n,
        'min': sorted_times[0],
        'max': sorted_times[-1],
        'mean': sum(times) / n,
        'median': sorted_times[n // 2] if n % 2 else (sorted_times[n//2-1] + sorted_times[n//2]) / 2,
        'p95': sorted_times[int(n * 0.95)]
    }

    return result`,
      params: [],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-02-26 09:30',
      createdAt: '2024-01-20',
      updatedAt: '2024-02-10',
    },
    'plugin-8': {
      id: 'plugin-8',
      name: '关键词匹配评估',
      description: '检查输出中是否包含预期的关键词，支持多个关键词和匹配模式',
      category: 'evaluation',
      tags: ['结果评估', '文本匹配'],
      dataDictionaryId: 'dict-4',
      code: `def execute(input_data, config):
    import re

    text = str(input_data.get('output', ''))
    keywords = config.get('keywords', '').split(',')
    mode = config.get('mode', 'any')  # any, all, none

    found = []
    for kw in keywords:
        kw = kw.strip()
        if kw and re.search(kw, text, re.IGNORECASE):
            found.append(kw)

    if mode == 'any':
        passed = len(found) > 0
    elif mode == 'all':
        passed = len(found) == len([k for k in keywords if k.strip()])
    else:  # none
        passed = len(found) == 0

    return {
        'passed': passed,
        'found_keywords': found,
        'mode': mode
    }`,
      params: [
        { name: 'keywords', type: 'string', default: '', description: '关键词列表，逗号分隔' },
        { name: 'mode', type: 'string', default: 'any', description: '匹配模式: any/all/none' },
      ],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-02-28 14:00',
      createdAt: '2024-02-28',
      updatedAt: '2024-02-28',
    },
    'plugin-9': {
      id: 'plugin-9',
      name: 'AI对话执行器',
      description: '执行AI对话测试，支持单轮和多轮对话场景，自动评估回复质量和一致性',
      category: 'execution',
      tags: ['测试执行', 'AI对话', '多轮对话'],
      source: 'system',
      dataDictionaryId: 'dict-1',
      code: `def execute(input_data, config):
    """
    AI对话执行器
    输入数据格式（来自关联的数据字典）:
    {
        "id": "对话ID",
        "prompt": "用户输入的提示",
        "expected_response": "期望的回复",
        "context": "上下文信息（多轮对话时使用）"
    }
    """
    import time

    # 获取配置参数
    model = config.get('model', 'default')
    max_tokens = config.get('max_tokens', 1024)
    temperature = config.get('temperature', 0.7)
    timeout = config.get('timeout', 30)

    # 解析输入数据
    prompt = input_data.get('prompt', '')
    expected = input_data.get('expected_response', '')
    context = input_data.get('context', [])

    # 模拟AI对话执行
    start_time = time.time()

    # 构建对话历史（用于多轮对话）
    conversation_history = []
    for turn in context:
        conversation_history.append({
            'role': 'user',
            'content': turn.get('user', '')
        })
        conversation_history.append({
            'role': 'assistant',
            'content': turn.get('assistant', '')
        })

    # 添加当前用户输入
    conversation_history.append({
        'role': 'user',
        'content': prompt
    })

    # 模拟AI响应（实际应用中调用AI模型API）
    response = f"[模拟响应] 针对问题 '{prompt[:50]}...' 的回复"
    if expected:
        response += f" (期望: {expected[:30]}...)"

    end_time = time.time()

    # 返回执行结果
    result = {
        'success': True,
        'conversation_id': input_data.get('id'),
        'prompt': prompt,
        'response': response,
        'expected_response': expected,
        'model': model,
        'turns': len(conversation_history) // 2 + 1,
        'latency_ms': round((end_time - start_time) * 1000, 2),
        'tokens_used': {
            'prompt': len(prompt.split()),
            'completion': len(response.split()),
            'total': len(prompt.split()) + len(response.split())
        },
        'config': {
            'max_tokens': max_tokens,
            'temperature': temperature
        }
    }

    return result`,
      params: [
        { name: 'model', type: 'string', default: 'claude-3-sonnet', description: 'AI模型名称' },
        { name: 'max_tokens', type: 'number', default: '1024', description: '最大输出token数' },
        { name: 'temperature', type: 'number', default: '0.7', description: '生成温度(0-1)' },
        { name: 'timeout', type: 'number', default: '30', description: '请求超时时间(秒)' },
      ],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-03-12 10:30',
      createdAt: '2024-03-12',
      updatedAt: '2024-03-12',
    },
    'plugin-metrics-1': {
      id: 'plugin-metrics-1',
      name: '响应性能指标采集',
      description: '采集API响应时间相关的性能指标，支持平均值、P95、P99等多种聚合方式',
      category: 'metrics',
      tags: ['指标采集', '性能'],
      source: 'system',
      // 指标采集插件不需要 dataDictionaryId, code, params
      metrics: [
        {
          id: 'metric-1',
          name: 'avg_response_time',
          displayName: '平均响应时间',
          source: 'response_time',
          aggregation: 'avg',
          unit: 'ms',
          description: '所有请求的平均响应时间',
        },
        {
          id: 'metric-2',
          name: 'p95_response_time',
          displayName: 'P95响应时间',
          source: 'response_time',
          aggregation: 'p95',
          unit: 'ms',
          description: '95%的请求响应时间在此范围内',
        },
        {
          id: 'metric-3',
          name: 'error_rate',
          displayName: '错误率',
          source: 'status',
          aggregation: 'percentage',
          unit: '%',
          description: '请求错误率百分比',
        },
        {
          id: 'metric-4',
          name: 'total_tokens',
          displayName: '总Token数',
          source: 'token_count',
          aggregation: 'sum',
          unit: '个',
          description: '所有请求的总Token消耗',
        },
      ],
      status: 'active',
      testResult: 'success',
      lastTestTime: '2024-03-12 14:00',
      createdAt: '2024-03-12',
      updatedAt: '2024-03-12',
    },
  }

  plugin.value = mockPlugins[id] || null
  if (plugin.value) {
    // 初始化测试配置
    updateTestConfig()
    // 指标采集插件：初始化指标配置
    if (plugin.value.category === 'metrics' && plugin.value.metrics) {
      metricsForm.metrics = [...plugin.value.metrics]
    }
  }
}

// 返回上一页
const goBack = () => {
  router.push('/plugin')
}

// 删除插件
const handleDelete = async () => {
  if (!plugin.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除插件「${plugin.value.name}」吗？删除后将无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )

    // 模拟删除操作
    // 实际项目中这里应该调用 API 删除插件
    // await deletePlugin(plugin.value.id)

    ElMessage.success('插件删除成功')
    router.push('/plugin')
  } catch (e) {
    // 用户取消删除
    if (e !== 'cancel') {
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

// 运行测试
const runTest = async () => {
  // 验证输入
  if (needsDatasetSelection.value && !selectedDatasetId.value) {
    ElMessage.warning('请选择测评集')
    return
  }
  if (!needsDatasetSelection.value && !testInput.value.trim()) {
    ElMessage.warning('请输入测试数据')
    return
  }

  isTesting.value = true
  clearLogs()
  clearProcessedData() // 清空之前的处理结果
  const startTime = Date.now()

  try {
    // 阶段1：初始化
    addLog('开始执行测试...', 'info')
    testProgress.value = 5
    await sleep(300)

    addLog('加载插件代码...', 'info')
    testProgress.value = 10
    await sleep(200)

    // 阶段2：准备数据
    if (needsDatasetSelection.value) {
      addLog(`加载测评集数据: ${getSelectedDatasetName()}`, 'info')
      testProgress.value = 20
      await sleep(400)
      addLog('数据加载完成，共 256 条记录', 'success')
    } else {
      addLog('解析输入数据...', 'info')
      testProgress.value = 20
      await sleep(200)
      addLog('输入数据解析完成', 'success')
    }

    // 阶段3：解析配置
    testProgress.value = 25
    addLog('解析配置参数...', 'info')
    await sleep(200)

    try {
      const config = JSON.parse(testConfig.value)
      const configKeys = Object.keys(config)
      if (configKeys.length > 0) {
        addLog(`配置参数: ${configKeys.map(k => `${k}=${config[k]}`).join(', ')}`, 'info')
      } else {
        addLog('无配置参数', 'info')
      }
    } catch {
      addLog('配置参数格式错误，使用默认配置', 'warning')
    }
    testProgress.value = 30

    // 阶段4：执行插件
    addLog('开始执行插件代码...', 'info')
    testProgress.value = 35
    await sleep(300)

    // 模拟执行过程
    const steps = [
      { progress: 45, msg: '正在处理数据...', type: 'info' },
      { progress: 55, msg: '执行数据清洗...', type: 'info' },
      { progress: 65, msg: '应用转换规则...', type: 'info' },
      { progress: 75, msg: '生成输出结果...', type: 'info' },
      { progress: 85, msg: '验证输出格式...', type: 'info' },
      { progress: 90, msg: '整理执行结果...', type: 'info' },
    ]

    for (const step of steps) {
      await sleep(400)
      testProgress.value = step.progress
      addLog(step.msg, step.type)
    }

    // 阶段5：完成
    testProgress.value = 95
    await sleep(200)
    addLog('插件执行完成', 'success')

    testProgress.value = 100
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(3)

    // 数据处理、测试执行、结果评估类型插件：生成结果集
    if (needsDatasetSelection.value) {
      generateProcessedData()
      const categoryText = {
        data: '处理',
        execution: '执行',
        evaluation: '评估',
      }
      addLog(`共${categoryText[plugin.value.category]} ${processedCount.value} 条数据`, 'success')
    }

    // 生成执行结果
    testResult.value = JSON.stringify(
      {
        status: 'success',
        output: '测试执行成功',
        execution_time: `${executionTime}s`,
        processed_count: needsDatasetSelection.value ? 256 : 1,
        success_count: needsDatasetSelection.value ? 250 : 1,
        failed_count: needsDatasetSelection.value ? 6 : 0,
        has_result_data: needsDatasetSelection.value,
        result_type: plugin.value.category,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )

    addLog(`执行完成，耗时 ${executionTime}s`, 'success')
    ElMessage.success('测试执行成功')
  } catch (e) {
    testProgress.value = 0
    addLog(`执行失败: ${e.message}`, 'error')
    testResult.value = JSON.stringify(
      {
        status: 'error',
        error: e.message,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
    ElMessage.error('测试执行失败')
  } finally {
    isTesting.value = false
  }
}

// 辅助函数：延迟
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 获取选中的测评集名称
const getSelectedDatasetName = () => {
  const dataset = allDatasets.value.find((d) => d.id === selectedDatasetId.value)
  return dataset ? dataset.name : ''
}

// 取消测试
const cancelTest = () => {
  isTesting.value = false
  addLog('测试已被用户取消', 'warning')
  ElMessage.warning('测试已取消')
}

// 生成处理后的模拟数据
const generateProcessedData = () => {
  const category = plugin.value.category
  // 获取关联数据字典的列定义
  const dict = dataDictionaries.value.find((d) => d.id === plugin.value.dataDictionaryId)

  // 根据插件类别定义不同的结果列
  if (category === 'data') {
    // 数据处理类型：原始数据 + 处理后输出
    if (!dict) {
      processedColumns.value = [
        { key: 'id', label: 'ID', type: 'string' },
        { key: 'input', label: '输入', type: 'string' },
        { key: 'processed_output', label: '处理后输出', type: 'string' },
      ]
    } else {
      processedColumns.value = dict.columns.map((col) => ({ ...col }))
      processedColumns.value.push({ key: 'processed_output', label: '处理后输出', type: 'string' })
    }
  } else if (category === 'execution') {
    // 测试执行类型：原始数据 + 执行状态 + 执行结果
    if (!dict) {
      processedColumns.value = [
        { key: 'id', label: 'ID', type: 'string' },
        { key: 'input', label: '输入', type: 'string' },
        { key: 'status', label: '执行状态', type: 'enum', enumOptions: ['成功', '失败', '超时'] },
        { key: 'output', label: '执行结果', type: 'string' },
        { key: 'latency_ms', label: '耗时(ms)', type: 'number' },
      ]
    } else {
      processedColumns.value = dict.columns.map((col) => ({ ...col }))
      processedColumns.value.push(
        { key: 'status', label: '执行状态', type: 'enum', enumOptions: ['成功', '失败', '超时'] },
        { key: 'output', label: '执行结果', type: 'string' },
        { key: 'latency_ms', label: '耗时(ms)', type: 'number' }
      )
    }
  } else if (category === 'evaluation') {
    // 结果评估类型：原始数据 + 评估结果 + 分数
    if (!dict) {
      processedColumns.value = [
        { key: 'id', label: 'ID', type: 'string' },
        { key: 'input', label: '输入', type: 'string' },
        { key: 'actual_output', label: '实际输出', type: 'string' },
        { key: 'passed', label: '是否通过', type: 'enum', enumOptions: ['通过', '未通过'] },
        { key: 'score', label: '评分', type: 'number' },
        { key: 'reason', label: '评估说明', type: 'string' },
      ]
    } else {
      processedColumns.value = dict.columns.map((col) => ({ ...col }))
      processedColumns.value.push(
        { key: 'actual_output', label: '实际输出', type: 'string' },
        { key: 'passed', label: '是否通过', type: 'enum', enumOptions: ['通过', '未通过'] },
        { key: 'score', label: '评分', type: 'number' },
        { key: 'reason', label: '评估说明', type: 'string' }
      )
    }
  }

  // 生成模拟数据
  const dataCount = 20
  processedData.value = []
  for (let i = 1; i <= dataCount; i++) {
    const row = { id: i }
    processedColumns.value.forEach((col) => {
      if (col.key === 'id') return

      // 根据列类型和插件类别生成不同的数据
      if (col.key === 'processed_output') {
        row[col.key] = `处理结果_${i}: 经过插件 "${plugin.value.name}" 处理后的数据`
      } else if (col.key === 'status') {
        row[col.key] = col.enumOptions[Math.floor(Math.random() * 2)] // 大部分成功
      } else if (col.key === 'output') {
        row[col.key] = `执行结果_${i}: 插件 "${plugin.value.name}" 执行完成`
      } else if (col.key === 'latency_ms') {
        row[col.key] = Math.floor(Math.random() * 500) + 100
      } else if (col.key === 'actual_output') {
        row[col.key] = `实际输出_${i}: 模型生成的回复内容...`
      } else if (col.key === 'passed') {
        row[col.key] = i <= 17 ? '通过' : '未通过' // 85% 通过率
      } else if (col.key === 'score') {
        row[col.key] = (Math.random() * 0.3 + 0.7).toFixed(2) // 0.7-1.0 之间
      } else if (col.key === 'reason') {
        row[col.key] =
          i <= 17 ? `评估通过：输出符合预期` : `评估未通过：输出与期望存在差异`
      } else if (col.type === 'enum' && col.enumOptions) {
        row[col.key] = col.enumOptions[Math.floor(Math.random() * col.enumOptions.length)]
      } else {
        row[col.key] = `示例${col.label}_${i}`
      }
    })
    processedData.value.push(row)
  }
  processedCount.value = dataCount
}

// 保存为测评集
const openSaveDialog = () => {
  if (!processedData.value || processedData.value.length === 0) {
    ElMessage.warning('暂无处理后的数据可保存')
    return
  }
  // 根据插件类别生成不同的默认名称和描述
  const categoryConfig = {
    data: { prefix: '处理结果', desc: '处理生成的数据集', tag: '插件处理' },
    execution: { prefix: '执行结果', desc: '执行生成的数据集', tag: '插件执行' },
    evaluation: { prefix: '评估结果', desc: '评估生成的数据集', tag: '插件评估' },
  }
  const config = categoryConfig[plugin.value.category] || categoryConfig.data

  newDatasetForm.name = `${plugin.value.name}_${config.prefix}_${new Date().toLocaleDateString()}`
  newDatasetForm.description = `由插件 "${plugin.value.name}" ${config.desc}`
  newDatasetForm.tags = [config.tag, ...plugin.value.tags]
  saveDialogVisible.value = true
}

const handleSaveDataset = async () => {
  if (!newDatasetForm.name.trim()) {
    ElMessage.warning('请输入测评集名称')
    return
  }
  isSavingDataset.value = true
  try {
    // 模拟保存操作
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('测评集保存成功')
    saveDialogVisible.value = false
    // 清空处理后的数据（已保存）
    clearProcessedData()
  } catch (e) {
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    isSavingDataset.value = false
  }
}

// 清空处理后的数据
const clearProcessedData = () => {
  processedData.value = null
  processedColumns.value = []
  processedCount.value = 0
}

// ========== 指标采集插件专用函数 ==========

// 获取数据源标签
const getDataSourceLabel = (value) => {
  const source = systemDataSources.find((s) => s.value === value)
  return source ? source.label : value
}

// 获取聚合方式标签
const getAggregationLabel = (value) => {
  const agg = aggregationOptions.find((a) => a.value === value)
  return agg ? agg.label : value
}

// 打开指标编辑对话框
const openMetricDialog = (metric = null, index = -1) => {
  isEditMetricMode.value = !!metric
  editingMetricIndex.value = index

  if (metric) {
    metricFormData.id = metric.id
    metricFormData.name = metric.name
    metricFormData.displayName = metric.displayName
    metricFormData.source = metric.source
    metricFormData.aggregation = metric.aggregation
    metricFormData.unit = metric.unit
    metricFormData.description = metric.description || ''
  } else {
    metricFormData.id = `metric-${Date.now()}`
    metricFormData.name = ''
    metricFormData.displayName = ''
    metricFormData.source = ''
    metricFormData.aggregation = ''
    metricFormData.unit = ''
    metricFormData.description = ''
  }

  metricDialogVisible.value = true
}

// 提交指标配置
const handleMetricSubmit = () => {
  if (!metricFormData.name.trim()) {
    ElMessage.warning('请输入指标标识')
    return
  }
  if (!metricFormData.displayName.trim()) {
    ElMessage.warning('请输入指标名称')
    return
  }
  if (!metricFormData.source) {
    ElMessage.warning('请选择数据源')
    return
  }
  if (!metricFormData.aggregation) {
    ElMessage.warning('请选择聚合方式')
    return
  }

  const metric = {
    id: metricFormData.id,
    name: metricFormData.name,
    displayName: metricFormData.displayName,
    source: metricFormData.source,
    aggregation: metricFormData.aggregation,
    unit: metricFormData.unit,
    description: metricFormData.description,
  }

  if (isEditMetricMode.value) {
    metricsForm.metrics[editingMetricIndex.value] = metric
    ElMessage.success('指标更新成功')
  } else {
    metricsForm.metrics.push(metric)
    ElMessage.success('指标添加成功')
  }

  metricDialogVisible.value = false
}

// 删除指标
const deleteMetric = (index) => {
  ElMessageBox.confirm('确定要删除该指标吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      metricsForm.metrics.splice(index, 1)
      ElMessage.success('指标删除成功')
    })
    .catch(() => {})
}

// 添加指标日志
const addMetricsLog = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  metricsTestLogs.value.push({
    id: Date.now(),
    timestamp,
    message,
    type,
  })
  nextTick(() => {
    if (metricsLogContainerRef.value) {
      metricsLogContainerRef.value.scrollTop = metricsLogContainerRef.value.scrollHeight
    }
  })
}

// 清空指标日志
const clearMetricsLogs = () => {
  metricsTestLogs.value = []
}

// 指标采集测试
const runMetricsTest = async () => {
  if (metricsForm.metrics.length === 0) {
    ElMessage.warning('请先添加指标配置')
    return
  }

  isMetricsTesting.value = true
  metricsTestProgress.value = 0
  metricsResult.value = null
  clearMetricsLogs()

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  try {
    // 阶段1：初始化
    addMetricsLog('开始指标采集测试...', 'info')
    metricsTestProgress.value = 5
    await sleep(300)

    addMetricsLog(`生成 ${metricsTestDataCount.value} 条模拟打点数据...`, 'info')
    metricsTestProgress.value = 20
    await sleep(500)

    // 阶段2：模拟生成打点数据
    addMetricsLog('打点数据生成完成', 'success')
    metricsTestProgress.value = 40
    await sleep(300)

    // 阶段3：计算指标
    addMetricsLog('开始计算指标...', 'info')
    metricsTestProgress.value = 50

    for (let i = 0; i < metricsForm.metrics.length; i++) {
      const metric = metricsForm.metrics[i]
      await sleep(200)
      metricsTestProgress.value = 50 + (i + 1) * (40 / metricsForm.metrics.length)
      addMetricsLog(`计算指标: ${metric.displayName} (${metric.aggregation})`, 'info')
    }

    // 阶段4：生成结果
    metricsTestProgress.value = 95
    await sleep(200)
    addMetricsLog('指标计算完成', 'success')

    // 生成模拟结果
    generateMetricsResult()

    metricsTestProgress.value = 100
    addMetricsLog('指标采集测试完成', 'success')
  } catch (e) {
    addMetricsLog(`测试失败: ${e.message}`, 'error')
  } finally {
    isMetricsTesting.value = false
  }
}

// 生成指标采集结果
const generateMetricsResult = () => {
  const results = []

  metricsForm.metrics.forEach((metric) => {
    let value = 0

    // 根据聚合方式生成不同的模拟值
    switch (metric.aggregation) {
      case 'sum':
        value = Math.floor(Math.random() * 10000) + 1000
        break
      case 'avg':
        value = (Math.random() * 500 + 100).toFixed(2)
        break
      case 'max':
        value = Math.floor(Math.random() * 1000) + 500
        break
      case 'min':
        value = Math.floor(Math.random() * 50) + 10
        break
      case 'count':
        value = metricsTestDataCount.value
        break
      case 'p50':
        value = (Math.random() * 200 + 150).toFixed(2)
        break
      case 'p95':
        value = (Math.random() * 300 + 400).toFixed(2)
        break
      case 'p99':
        value = (Math.random() * 500 + 600).toFixed(2)
        break
      case 'percentage':
        value = (Math.random() * 5 + 1).toFixed(2)
        break
      default:
        value = (Math.random() * 100).toFixed(2)
    }

    results.push({
      ...metric,
      value,
      dataSourceLabel: getDataSourceLabel(metric.source),
      aggregationLabel: getAggregationLabel(metric.aggregation),
    })
  })

  metricsResult.value = results
}

// 下载指标采集结果
const downloadMetricsResult = () => {
  if (!metricsResult.value || metricsResult.value.length === 0) {
    ElMessage.warning('暂无结果数据可下载')
    return
  }

  // 生成 CSV 数据
  const headers = ['指标名称', '指标标识', '数据源', '聚合方式', '值', '单位', '描述']
  let csvContent = '\uFEFF' // BOM for UTF-8
  csvContent += headers.join(',') + '\n'

  metricsResult.value.forEach((metric) => {
    const row = [
      metric.displayName,
      metric.name,
      metric.dataSourceLabel,
      metric.aggregationLabel,
      metric.value,
      metric.unit,
      metric.description || '',
    ]
    csvContent += row.join(',') + '\n'
  })

  // 创建 Blob 并下载
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${plugin.value.name}_指标采集结果_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('结果下载成功')
}

// 清空指标结果
const clearMetricsResult = () => {
  metricsResult.value = null
  metricsTestProgress.value = 0
  clearMetricsLogs()
}

// 下载结果（测试执行和结果评估类型插件）
const downloadResult = async () => {
  if (!processedData.value || processedData.value.length === 0) {
    ElMessage.warning('暂无结果数据可下载')
    return
  }

  isDownloading.value = true
  try {
    // 生成 CSV 数据
    const headers = processedColumns.value.map((col) => col.label)
    const keys = processedColumns.value.map((col) => col.key)

    // 构建 CSV 内容
    let csvContent = '\uFEFF' // BOM for UTF-8
    csvContent += headers.join(',') + '\n'

    processedData.value.forEach((row) => {
      const values = keys.map((key) => {
        let value = row[key]
        // 处理包含逗号或换行的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      })
      csvContent += values.join(',') + '\n'
    })

    // 根据插件类别生成不同的文件名
    const categoryNames = {
      execution: '执行结果',
      evaluation: '评估结果',
    }
    const categoryName = categoryNames[plugin.value.category] || '结果'

    // 创建 Blob 并下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${plugin.value.name}_${categoryName}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    ElMessage.success('结果下载成功')
  } catch (e) {
    console.error('下载失败:', e)
    ElMessage.error('下载失败，请稍后重试')
  } finally {
    isDownloading.value = false
  }
}

// 复制代码
const handleCopyCode = () => {
  const code = isEditingCode.value ? codeForm.code : plugin.value?.code
  if (code) {
    navigator.clipboard.writeText(code)
    ElMessage.success('代码已复制到剪贴板')
  }
}

// 获取分类文字
const getCategoryText = (category) => {
  const found = categoryOptions.find(c => c.value === category)
  return found ? found.label : category
}

// 获取测试结果文字
const getTestResultText = (result) => {
  if (result === 'success') return '测试通过'
  if (result === 'failed') return '测试失败'
  return '未测试'
}

// 获取数据字典名称
const getDictionaryName = (dictId) => {
  if (!dictId) return ''
  const dict = dataDictionaries.value.find((d) => d.id === dictId)
  return dict ? dict.name : ''
}

// 获取数据字典字段数量
const getDictionaryFieldCount = (dictId) => {
  if (!dictId) return 0
  const dict = dataDictionaries.value.find((d) => d.id === dictId)
  return dict?.columns?.length || 0
}

// 跳转到数据字典详情页
const goToDictionaryDetail = (dictId) => {
  if (dictId) {
    router.push(`/data-dictionary/${dictId}`)
  }
}

// 判断分类是否需要关联数据字典
const needsDictionary = (category) => {
  return categoriesRequireDictionary.includes(category)
}

// 进入基本信息编辑模式
const enterBasicInfoEditMode = () => {
  if (plugin.value) {
    basicInfoForm.name = plugin.value.name
    basicInfoForm.description = plugin.value.description
    basicInfoForm.category = plugin.value.category
    basicInfoForm.tags = [...plugin.value.tags]
    basicInfoForm.status = plugin.value.status
    basicInfoForm.dataDictionaryId = plugin.value.dataDictionaryId || ''
    isEditingBasicInfo.value = true
  }
}

// 取消基本信息编辑
const cancelBasicInfoEdit = () => {
  isEditingBasicInfo.value = false
}

// 保存基本信息
const saveBasicInfoEdit = () => {
  if (!basicInfoForm.name.trim()) {
    ElMessage.warning('请输入插件名称')
    return
  }
  // 验证数据字典关联
  if (needsDictionary(basicInfoForm.category) && !basicInfoForm.dataDictionaryId) {
    ElMessage.warning('请选择关联的数据字典')
    return
  }
  if (plugin.value) {
    plugin.value.name = basicInfoForm.name
    plugin.value.description = basicInfoForm.description
    plugin.value.category = basicInfoForm.category
    plugin.value.tags = [...basicInfoForm.tags]
    plugin.value.status = basicInfoForm.status
    plugin.value.dataDictionaryId = needsDictionary(basicInfoForm.category) ? basicInfoForm.dataDictionaryId : ''
    plugin.value.updatedAt = new Date().toISOString().slice(0, 10)
    isEditingBasicInfo.value = false
    ElMessage.success('基本信息保存成功')
  }
}

// 进入代码编辑模式
const enterCodeEditMode = () => {
  if (plugin.value) {
    codeForm.code = plugin.value.code
    isEditingCode.value = true
  }
}

// 取消代码编辑
const cancelCodeEdit = () => {
  isEditingCode.value = false
  isFullscreen.value = false
}

// 保存代码
const saveCodeEdit = () => {
  if (plugin.value) {
    plugin.value.code = codeForm.code
    plugin.value.updatedAt = new Date().toISOString().slice(0, 10)
    isEditingCode.value = false
    isFullscreen.value = false
    ElMessage.success('代码保存成功')
  }
}

// 进入参数编辑模式
const enterParamsEditMode = () => {
  if (plugin.value) {
    paramsForm.params = plugin.value.params ? plugin.value.params.map(p => ({ ...p })) : []
    isEditingParams.value = true
  }
}

// 取消参数编辑
const cancelParamsEdit = () => {
  isEditingParams.value = false
}

// 保存参数
const saveParamsEdit = () => {
  if (plugin.value) {
    plugin.value.params = paramsForm.params.map(p => ({ ...p }))
    plugin.value.updatedAt = new Date().toISOString().slice(0, 10)
    // 更新测试配置的默认值
    updateTestConfig()
    isEditingParams.value = false
    ElMessage.success('参数配置保存成功')
  }
}

// 更新测试配置的默认值
const updateTestConfig = () => {
  if (plugin.value && plugin.value.params && plugin.value.params.length > 0) {
    testConfig.value = JSON.stringify(
      plugin.value.params.reduce((acc, p) => {
        acc[p.name] = p.default
        return acc
      }, {}),
      null,
      2
    )
  } else {
    testConfig.value = '{}'
  }
}

// 添加参数
const addParam = () => {
  isEditParamMode.value = false
  editingParamIndex.value = -1
  paramFormData.name = ''
  paramFormData.type = 'string'
  paramFormData.default = ''
  paramFormData.description = ''
  paramDialogVisible.value = true
}

// 编辑参数
const editParam = (index) => {
  isEditParamMode.value = true
  editingParamIndex.value = index
  const param = paramsForm.params[index]
  paramFormData.name = param.name
  paramFormData.type = param.type
  paramFormData.default = param.default
  paramFormData.description = param.description
  paramDialogVisible.value = true
}

// 保存参数
const handleParamSubmit = () => {
  if (!paramFormData.name.trim()) {
    ElMessage.warning('请输入参数名称')
    return
  }

  const param = {
    name: paramFormData.name,
    type: paramFormData.type,
    default: paramFormData.default,
    description: paramFormData.description,
  }

  if (isEditParamMode.value) {
    paramsForm.params[editingParamIndex.value] = param
  } else {
    paramsForm.params.push(param)
  }
  paramDialogVisible.value = false
}

// 删除参数
const removeParam = (index) => {
  paramsForm.params.splice(index, 1)
}

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// ESC 键退出全屏
const handleGlobalKeydown = (e) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
  }
}

// 代码编辑键盘事件处理
const handleCodeKeydown = (e) => {
  if (e.key === 'Tab') {
    e.preventDefault()
    const start = e.target.selectionStart
    const end = e.target.selectionEnd
    codeForm.code = codeForm.code.substring(0, start) + '    ' + codeForm.code.substring(end)
    nextTick(() => {
      e.target.selectionStart = e.target.selectionEnd = start + 4
    })
  }
}

// 同步滚动
const handleCodeScroll = (e) => {
  const lineNumbers = e.target.parentElement.querySelector('.line-numbers')
  if (lineNumbers) {
    lineNumbers.scrollTop = e.target.scrollTop
  }
}

onMounted(() => {
  loadPlugin()
  // 添加全局键盘事件监听
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  // 移除全局键盘事件监听
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="plugin-detail-page" v-if="plugin">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="goBack" circle />
        <div class="header-info">
          <h2>{{ plugin.name }}</h2>
          <div class="header-meta">
            <span class="meta-item">
              <el-icon><Setting /></el-icon>
              {{ getCategoryText(plugin.category) }}
            </span>
            <span class="meta-item">
              创建于 {{ plugin.createdAt }}
            </span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button class="delete-btn" @click="handleDelete">
          <el-icon><Delete /></el-icon>
          删除
        </el-button>
      </div>
    </div>

    <!-- 插件信息卡片 -->
    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <div class="card-actions">
            <template v-if="isEditingBasicInfo">
              <el-button size="small" @click="cancelBasicInfoEdit">
                <el-icon><Close /></el-icon>
                取消
              </el-button>
              <el-button size="small" type="primary" @click="saveBasicInfoEdit">
                <el-icon><Check /></el-icon>
                保存
              </el-button>
            </template>
            <el-tooltip v-else-if="!canEdit" content="系统插件不支持编辑" placement="top">
              <el-button size="small" type="primary" disabled>
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
            </el-tooltip>
            <el-button v-else size="small" type="primary" @click="enterBasicInfoEditMode">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </div>
        </div>
      </template>
      <el-form label-width="80px" label-position="left">
        <!-- 名称 -->
        <el-form-item label="插件名称" :required="isEditingBasicInfo">
          <template v-if="isEditingBasicInfo">
            <el-input
              v-model="basicInfoForm.name"
              placeholder="请输入插件名称"
              maxlength="50"
              show-word-limit
            />
          </template>
          <template v-else>
            <span class="form-value">{{ plugin.name }}</span>
          </template>
        </el-form-item>

        <!-- 描述 -->
        <el-form-item label="描述">
          <template v-if="isEditingBasicInfo">
            <el-input
              v-model="basicInfoForm.description"
              type="textarea"
              :rows="2"
              placeholder="请输入插件功能描述"
            />
          </template>
          <template v-else>
            <span class="form-value">{{ plugin.description }}</span>
          </template>
        </el-form-item>

        <!-- 分类 -->
        <el-form-item label="分类">
          <template v-if="isEditingBasicInfo">
            <el-radio-group v-model="basicInfoForm.category">
              <el-radio-button
                v-for="cat in categoryOptions"
                :key="cat.value"
                :value="cat.value"
              >
                {{ cat.label }}
              </el-radio-button>
            </el-radio-group>
          </template>
          <template v-else>
            <el-tag type="primary" size="small">{{ getCategoryText(plugin.category) }}</el-tag>
          </template>
        </el-form-item>

        <!-- 标签 -->
        <el-form-item label="标签">
          <template v-if="isEditingBasicInfo">
            <el-select
              v-model="basicInfoForm.tags"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="请选择或输入标签"
              style="width: 100%"
            >
              <el-option v-for="tag in presetTags" :key="tag" :label="tag" :value="tag" />
            </el-select>
          </template>
          <template v-else>
            <div class="tag-list">
              <el-tag v-for="tag in plugin.tags" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
            </div>
          </template>
        </el-form-item>

        <!-- 状态 -->
        <el-form-item label="状态">
          <template v-if="isEditingBasicInfo">
            <el-radio-group v-model="basicInfoForm.status">
              <el-radio value="active">启用</el-radio>
              <el-radio value="inactive">禁用</el-radio>
            </el-radio-group>
          </template>
          <template v-else>
            <el-tag :type="plugin.status === 'active' ? 'success' : 'info'" size="small">
              {{ plugin.status === 'active' ? '已启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-form-item>

        <!-- 插件来源（只读） -->
        <el-form-item label="插件来源">
          <el-tag :type="plugin.source === 'system' ? 'primary' : 'warning'" size="small" effect="plain">
            {{ plugin.source === 'system' ? '系统' : '自定义' }}
          </el-tag>
        </el-form-item>

        <!-- 数据字典 - 仅当分类为数据处理、测试执行、结果评估时显示 -->
        <el-form-item
          v-if="needsDictionary(isEditingBasicInfo ? basicInfoForm.category : plugin.category)"
          label="数据字典"
        >
          <template v-if="isEditingBasicInfo">
            <el-select
              v-model="basicInfoForm.dataDictionaryId"
              placeholder="请选择关联的数据字典"
              style="width: 100%"
              clearable
            >
              <el-option
                v-for="dict in dataDictionaries"
                :key="dict.id"
                :label="dict.name"
                :value="dict.id"
              >
                <div style="display: flex; flex-direction: column">
                  <span>{{ dict.name }}</span>
                  <span style="font-size: 12px; color: #909399">{{ dict.description }}</span>
                </div>
              </el-option>
            </el-select>
          </template>
          <template v-else>
            <div class="dictionary-display" v-if="plugin.dataDictionaryId">
              <div class="dictionary-link clickable" @click="goToDictionaryDetail(plugin.dataDictionaryId)">
                <el-icon><Collection /></el-icon>
                <span>{{ getDictionaryName(plugin.dataDictionaryId) }}</span>
                <el-tag size="small" type="info" effect="plain">
                  {{ getDictionaryFieldCount(plugin.dataDictionaryId) }} 个字段
                </el-tag>
              </div>
            </div>
            <span v-else class="text-muted">未关联</span>
          </template>
        </el-form-item>

        <!-- 测试状态（只读） -->
        <el-form-item label="测试状态" v-if="!isEditingBasicInfo">
          <div class="test-status" :class="plugin.testResult">
            <span class="status-dot"></span>
            <span class="status-text">{{ getTestResultText(plugin.testResult) }}</span>
            <span class="test-time" v-if="plugin.lastTestTime">{{ plugin.lastTestTime }}</span>
          </div>
        </el-form-item>

        <!-- 更新时间（只读） -->
        <el-form-item label="更新时间" v-if="!isEditingBasicInfo">
          <span class="form-value">{{ plugin.updatedAt }}</span>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 代码区域（指标采集类型和系统插件不显示） -->
    <el-card
      v-if="plugin.category !== 'metrics' && plugin.source !== 'system'"
      class="code-card"
      :class="{ 'is-fullscreen': isFullscreen && isEditingCode }"
    >
      <template #header>
        <div class="card-header">
          <span>插件代码</span>
          <div class="card-actions">
            <template v-if="isEditingCode">
              <el-button size="small" @click="cancelCodeEdit">
                <el-icon><Close /></el-icon>
                取消
              </el-button>
              <el-button size="small" type="primary" @click="saveCodeEdit">
                <el-icon><Check /></el-icon>
                保存
              </el-button>
              <el-button type="primary" link @click="isFullscreen = !isFullscreen">
                <el-icon><FullScreen /></el-icon>
                {{ isFullscreen ? '退出全屏' : '全屏编辑' }}
              </el-button>
            </template>
            <template v-else>
              <el-button type="primary" link @click="handleCopyCode">
                <el-icon><CopyDocument /></el-icon>
                复制代码
              </el-button>
              <el-tooltip v-if="!canEdit" content="系统插件不支持编辑" placement="top">
                <el-button size="small" type="primary" disabled>
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </el-tooltip>
              <el-button v-else size="small" type="primary" @click="enterCodeEditMode">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
            </template>
          </div>
        </div>
      </template>
      <!-- 函数签名与参数说明 -->
      <div class="function-signature" v-if="configParamDoc">
        <div class="signature-header">
          <span class="signature-icon">📝</span>
          <span class="signature-title">execute 函数参数说明</span>
          <el-tag size="small" type="info" effect="plain" class="sync-tag">
            与配置参数联动
          </el-tag>
        </div>
        <pre class="signature-content"><code>def execute(input_data, config):
{{ configParamDoc }}</code></pre>
      </div>
      <div class="function-signature empty-signature" v-else>
        <div class="signature-header">
          <span class="signature-icon">📝</span>
          <span class="signature-title">execute 函数参数说明</span>
        </div>
        <div class="empty-hint">
          <el-icon><Warning /></el-icon>
          <span>暂无配置参数，请在「配置参数」区域添加参数后自动生成注释</span>
        </div>
      </div>

      <!-- 编辑模式：代码编辑器 -->
      <template v-if="isEditingCode">
        <div class="code-editor-wrapper">
          <div class="editor-header">
            <span class="editor-title">
              <el-icon><Document /></el-icon>
              plugin.py
            </span>
            <div class="editor-actions">
              <span class="editor-tip">
                必须定义 <code>execute(input_data, config)</code> 函数作为入口
              </span>
            </div>
          </div>
          <div class="editor-container">
            <div class="line-numbers">
              <span v-for="line in codeLines" :key="line">{{ line }}</span>
            </div>
            <div class="code-area">
              <pre class="code-highlight"><code v-html="highlightedCode"></code></pre>
              <textarea
                ref="codeTextareaRef"
                v-model="codeForm.code"
                class="code-input"
                placeholder="请输入 Python 代码"
                spellcheck="false"
                @keydown="handleCodeKeydown"
                @scroll="handleCodeScroll"
              ></textarea>
            </div>
          </div>
        </div>
      </template>
      <!-- 查看模式：代码展示 -->
      <template v-else>
        <pre class="code-content"><code>{{ plugin.code }}</code></pre>
      </template>
    </el-card>

    <!-- 参数配置 -->
    <el-card class="params-card">
      <template #header>
        <div class="card-header">
          <span>配置参数</span>
          <div class="card-actions">
            <template v-if="isEditingParams">
              <el-button size="small" @click="cancelParamsEdit">
                <el-icon><Close /></el-icon>
                取消
              </el-button>
              <el-button size="small" type="primary" @click="saveParamsEdit">
                <el-icon><Check /></el-icon>
                保存
              </el-button>
              <el-button type="primary" link @click="addParam">
                <el-icon><Plus /></el-icon>
                添加参数
              </el-button>
            </template>
            <el-tooltip v-else-if="!canEdit" content="系统插件不支持编辑" placement="top">
              <el-button size="small" type="primary" disabled>
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
            </el-tooltip>
            <el-button v-else size="small" type="primary" @click="enterParamsEditMode">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </div>
        </div>
      </template>

      <!-- 编辑模式：可编辑参数表格 -->
      <template v-if="isEditingParams">
        <el-table :data="paramsForm.params" border v-if="paramsForm.params.length > 0">
          <el-table-column prop="name" label="参数名" width="150" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              {{ paramTypes.find(t => t.value === row.type)?.label || row.type }}
            </template>
          </el-table-column>
          <el-table-column prop="default" label="默认值" width="150" />
          <el-table-column prop="description" label="说明" />
          <el-table-column label="操作" width="120">
            <template #default="{ $index }">
              <el-button size="small" link @click="editParam($index)">编辑</el-button>
              <el-button size="small" link type="danger" @click="removeParam($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无参数配置，点击上方按钮添加" :image-size="60" />
      </template>

      <!-- 查看模式：只读参数表格 -->
      <template v-else>
        <el-table :data="plugin.params" border v-if="plugin.params && plugin.params.length > 0">
          <el-table-column prop="name" label="参数名" width="150" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="default" label="默认值" width="150" />
          <el-table-column prop="description" label="说明" />
        </el-table>
        <el-empty v-else description="暂无参数配置" :image-size="60" />
      </template>
    </el-card>

    <!-- 指标配置区域（仅指标采集类型） -->
    <el-card v-if="plugin.category === 'metrics'" class="metrics-card">
      <template #header>
        <div class="card-header">
          <span>指标配置</span>
          <div class="card-actions">
            <template v-if="isEditingMetrics">
              <el-button size="small" @click="isEditingMetrics = false">
                <el-icon><Close /></el-icon>
                取消
              </el-button>
              <el-button size="small" type="primary" @click="isEditingMetrics = false">
                <el-icon><Check /></el-icon>
                保存
              </el-button>
            </template>
            <template v-else>
              <el-tooltip v-if="!canEdit" content="系统插件不支持编辑" placement="top">
                <el-button
                  size="small"
                  type="primary"
                  disabled
                >
                  <el-icon><Plus /></el-icon>
                  添加指标
                </el-button>
              </el-tooltip>
              <el-button
                v-else
                size="small"
                type="primary"
                @click="openMetricDialog()"
              >
                <el-icon><Plus /></el-icon>
                添加指标
              </el-button>
              <el-tooltip v-if="!canEdit" content="系统插件不支持编辑" placement="top">
                <el-button size="small" disabled>
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </el-tooltip>
              <el-button v-else size="small" @click="isEditingMetrics = true">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
            </template>
          </div>
        </div>
      </template>

      <!-- 指标列表 -->
      <el-table
        v-if="metricsForm.metrics.length > 0"
        :data="metricsForm.metrics"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="displayName" label="指标名称" width="150" />
        <el-table-column prop="name" label="指标标识" width="180" />
        <el-table-column label="数据源" width="120">
          <template #default="{ row }">
            {{ getDataSourceLabel(row.source) }}
          </template>
        </el-table-column>
        <el-table-column label="聚合方式" width="100">
          <template #default="{ row }">
            {{ getAggregationLabel(row.aggregation) }}
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row, $index }">
            <el-button type="primary" link size="small" @click="openMetricDialog(row, $index)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="deleteMetric($index)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无指标配置，请点击上方按钮添加" :image-size="60" />
    </el-card>

    <!-- 测试区域 -->
    <el-card class="test-card">
      <template #header>
        <span>{{ plugin.category === 'metrics' ? '指标采集测试' : '测试运行' }}</span>
      </template>
      <div class="test-content">
        <!-- 指标采集类型：模拟测试 -->
        <template v-if="plugin.category === 'metrics'">
          <!-- 说明 -->
          <div class="test-section">
            <div class="section-label">测试说明</div>
            <el-alert
              type="info"
              :closable="false"
              show-icon
            >
              <template #title>
                指标采集插件会在测试执行过程中自动采集数据，此处可模拟测试以预览采集结果。
              </template>
            </el-alert>
          </div>

          <!-- 模拟数据量 -->
          <div class="test-section">
            <div class="section-label">模拟数据量</div>
            <el-select v-model="metricsTestDataCount" style="width: 200px">
              <el-option :value="50" label="50 条" />
              <el-option :value="100" label="100 条" />
              <el-option :value="200" label="200 条" />
              <el-option :value="500" label="500 条" />
              <el-option :value="1000" label="1000 条" />
            </el-select>
          </div>

          <!-- 运行按钮 -->
          <div class="test-action">
            <el-button type="primary" @click="runMetricsTest" :loading="isMetricsTesting">
              <el-icon><VideoPlay /></el-icon>
              {{ isMetricsTesting ? '采集中...' : '运行模拟测试' }}
            </el-button>
          </div>

          <!-- 执行进度和日志 -->
          <div class="test-execution" v-if="isMetricsTesting || metricsTestLogs.length > 0">
            <!-- 进度条 -->
            <div class="progress-section" v-if="isMetricsTesting">
              <div class="progress-header">
                <span class="progress-label">执行进度</span>
                <span class="progress-percent">{{ metricsTestProgress }}%</span>
              </div>
              <el-progress
                :percentage="metricsTestProgress"
                :stroke-width="10"
                :show-text="false"
                :status="metricsTestProgress === 100 ? 'success' : ''"
              />
            </div>

            <!-- 执行日志 -->
            <div class="log-section">
              <div class="log-header">
                <span class="log-label">执行日志</span>
              </div>
              <div class="log-container" ref="metricsLogContainerRef">
                <div
                  v-for="log in metricsTestLogs"
                  :key="log.id"
                  class="log-item"
                  :class="log.type"
                >
                  <span class="log-time">[{{ log.timestamp }}]</span>
                  <span class="log-message">{{ log.message }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 采集结果 -->
          <div class="metrics-result-section" v-if="metricsResult && metricsResult.length > 0 && !isMetricsTesting">
            <div class="processed-header">
              <div class="processed-title">
                <el-icon><DataAnalysis /></el-icon>
                <span>采集结果</span>
                <el-tag size="small" type="info">{{ metricsResult.length }} 个指标</el-tag>
              </div>
              <div class="processed-actions">
                <el-button type="primary" size="small" @click="downloadMetricsResult" :loading="isDownloading">
                  <el-icon><Download /></el-icon>
                  下载结果
                </el-button>
                <el-button size="small" @click="clearMetricsResult">
                  <el-icon><Delete /></el-icon>
                  清空
                </el-button>
              </div>
            </div>

            <!-- 指标卡片 -->
            <div class="metrics-cards">
              <div
                v-for="metric in metricsResult"
                :key="metric.id"
                class="metric-card"
              >
                <div class="metric-header">
                  <span class="metric-name">{{ metric.displayName }}</span>
                  <el-tag size="small" type="info">{{ metric.aggregationLabel }}</el-tag>
                </div>
                <div class="metric-value">
                  <span class="value">{{ metric.value }}</span>
                  <span class="unit">{{ metric.unit }}</span>
                </div>
                <div class="metric-info">
                  <span class="data-source">数据源: {{ metric.dataSourceLabel }}</span>
                </div>
                <div class="metric-desc" v-if="metric.description">
                  {{ metric.description }}
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 其他类型：正常测试 -->
        <template v-else>
        <!-- 输入数据区域：根据插件类型切换输入方式 -->
        <div class="test-section">
          <div class="section-label">
            输入数据
            <el-tag v-if="needsDatasetSelection" size="small" type="info" class="input-type-tag">
              选择测评集
            </el-tag>
            <el-tag v-else size="small" type="info" class="input-type-tag">
              手动输入
            </el-tag>
          </div>

          <!-- 数据处理、测试执行、结果评估：选择同一数据字典的测评集 -->
          <template v-if="needsDatasetSelection">
            <el-select
              v-model="selectedDatasetId"
              placeholder="请选择测评集"
              style="width: 100%"
              clearable
              :disabled="!plugin.dataDictionaryId"
            >
              <template #empty>
                <div class="empty-dataset-tip">
                  <el-icon><Warning /></el-icon>
                  <span>暂无关联的测评集</span>
                </div>
              </template>
              <el-option
                v-for="dataset in availableDatasets"
                :key="dataset.id"
                :label="dataset.name"
                :value="dataset.id"
              >
                <div class="dataset-option">
                  <span class="dataset-name">{{ dataset.name }}</span>
                  <span class="dataset-count">{{ dataset.dataCount }} 条数据</span>
                </div>
              </el-option>
            </el-select>
            <div class="input-hint" v-if="!plugin.dataDictionaryId">
              <el-icon><Warning /></el-icon>
              <span>请先在基本信息中关联数据字典</span>
            </div>
            <div class="input-hint" v-else-if="availableDatasets.length === 0">
              <el-icon><Warning /></el-icon>
              <span>当前数据字典下暂无测评集，请先创建测评集</span>
            </div>
            <div class="input-hint success" v-else>
              <el-icon><CircleCheck /></el-icon>
              <span>已关联数据字典：{{ getDictionaryName(plugin.dataDictionaryId) }}，共 {{ availableDatasets.length }} 个测评集可选</span>
            </div>
          </template>

          <!-- 其他类型：手动输入 -->
          <template v-else>
            <el-input
              v-model="testInput"
              type="textarea"
              :rows="4"
              placeholder="请输入测试数据"
            />
          </template>
        </div>

        <!-- 配置参数 -->
        <div class="test-section">
          <div class="section-label">配置参数</div>
          <el-input
            v-model="testConfig"
            type="textarea"
            :rows="4"
            placeholder="请输入配置参数（JSON格式）"
          />
        </div>

        <!-- 运行按钮 -->
        <div class="test-action">
          <el-button type="primary" @click="runTest" :loading="isTesting">
            <el-icon><VideoPlay /></el-icon>
            {{ isTesting ? '执行中...' : '运行测试' }}
          </el-button>
          <el-button v-if="isTesting" @click="cancelTest" type="danger" plain>
            <el-icon><Close /></el-icon>
            取消
          </el-button>
        </div>

        <!-- 执行进度和日志 -->
        <div class="test-execution" v-if="isTesting || testLogs.length > 0">
          <!-- 进度条 -->
          <div class="progress-section" v-if="isTesting">
            <div class="progress-header">
              <span class="progress-label">执行进度</span>
              <span class="progress-percent">{{ testProgress }}%</span>
            </div>
            <el-progress
              :percentage="testProgress"
              :stroke-width="10"
              :show-text="false"
              :status="testProgress === 100 ? 'success' : ''"
            />
          </div>

          <!-- 执行日志 -->
          <div class="log-section">
            <div class="log-header">
              <span class="log-label">执行日志</span>
              <el-button v-if="!isTesting && testLogs.length > 0" size="small" text @click="clearLogs">
                <el-icon><Delete /></el-icon>
                清空日志
              </el-button>
            </div>
            <div class="log-container" ref="logContainerRef">
              <div
                v-for="log in testLogs"
                :key="log.id"
                class="log-item"
                :class="log.type"
              >
                <span class="log-time">[{{ log.timestamp }}]</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 执行结果 -->
        <div class="test-result" v-if="testResult && !isTesting">
          <div class="section-label">执行结果</div>
          <pre class="result-content">{{ testResult }}</pre>
        </div>

        <!-- 结果集（数据处理、测试执行、结果评估类型插件） -->
        <div class="processed-data-section" v-if="processedData && processedData.length > 0 && !isTesting">
          <div class="processed-header">
            <div class="processed-title">
              <el-icon><Document /></el-icon>
              <span>{{ resultSetTitle }}</span>
              <el-tag size="small" type="info">{{ processedCount }} 条数据</el-tag>
              <el-tag size="small" type="warning" effect="plain">
                {{ plugin.category === 'data' ? '未保存' : '未下载' }}
              </el-tag>
            </div>
            <div class="processed-actions">
              <!-- 测试执行和结果评估类型：下载结果 -->
              <template v-if="plugin.category === 'execution' || plugin.category === 'evaluation'">
                <el-button type="primary" size="small" @click="downloadResult" :loading="isDownloading">
                  <el-icon><Download /></el-icon>
                  下载结果
                </el-button>
              </template>
              <!-- 数据处理类型：保存为测评集 -->
              <template v-else>
                <el-button type="primary" size="small" @click="openSaveDialog">
                  <el-icon><FolderOpened /></el-icon>
                  保存为测评集
                </el-button>
              </template>
              <el-button size="small" @click="clearProcessedData">
                <el-icon><Delete /></el-icon>
                清空
              </el-button>
            </div>
          </div>

          <div class="data-table-wrapper">
            <el-table
              :data="processedData"
              border
              stripe
              max-height="400"
              style="width: 100%"
            >
              <el-table-column
                v-for="col in processedColumns"
                :key="col.key"
                :prop="col.key"
                :label="col.label"
                :min-width="col.key === 'id' ? 60 : 150"
                show-overflow-tooltip
              >
                <template #header>
                  <div class="table-header-cell">
                    <span class="col-label">{{ col.label }}</span>
                    <el-tag v-if="col.type === 'enum'" size="small" type="info" effect="plain" class="col-type">
                      枚举
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="processed-tip">
            <el-icon><Warning /></el-icon>
            <span>此数据集尚未保存，再次运行测试时将被新的处理结果覆盖</span>
          </div>
        </div>
        </template>
      </div>
    </el-card>
  </div>

  <!-- 未找到插件 -->
  <div class="not-found" v-else>
    <el-empty description="插件不存在" />
    <el-button type="primary" @click="goBack">返回列表</el-button>
  </div>

  <!-- 参数配置对话框 -->
  <el-dialog
    v-model="paramDialogVisible"
    :title="isEditParamMode ? '编辑参数' : '添加参数'"
    width="450px"
    :close-on-click-modal="false"
  >
    <el-form :model="paramFormData" label-width="80px" label-position="left">
      <el-form-item label="参数名" required>
        <el-input v-model="paramFormData.name" placeholder="如：threshold" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="paramFormData.type" style="width: 100%">
          <el-option v-for="t in paramTypes" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="默认值">
        <el-input v-model="paramFormData.default" placeholder="参数默认值" />
      </el-form-item>
      <el-form-item label="说明">
        <el-input v-model="paramFormData.description" placeholder="参数用途说明" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="paramDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleParamSubmit">确定</el-button>
    </template>
  </el-dialog>

  <!-- 保存为测评集对话框 -->
  <el-dialog
    v-model="saveDialogVisible"
    title="保存为测评集"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form :model="newDatasetForm" label-width="80px" label-position="left">
      <el-form-item label="名称" required>
        <el-input v-model="newDatasetForm.name" placeholder="请输入测评集名称" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="newDatasetForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入测评集描述"
        />
      </el-form-item>
      <el-form-item label="标签">
        <el-select
          v-model="newDatasetForm.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="请选择或输入标签"
          style="width: 100%"
        >
          <el-option v-for="tag in presetTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </el-form-item>
      <el-form-item label="数据预览">
        <div class="preview-info">
          <el-icon><Document /></el-icon>
          <span>共 {{ processedCount }} 条数据，{{ processedColumns.length }} 个字段</span>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="saveDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSaveDataset" :loading="isSavingDataset">
        保存
      </el-button>
    </template>
  </el-dialog>

  <!-- 指标编辑对话框 -->
  <el-dialog
    v-model="metricDialogVisible"
    :title="isEditMetricMode ? '编辑指标' : '添加指标'"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form :model="metricFormData" label-width="90px" label-position="left">
      <el-form-item label="指标标识" required>
        <el-input v-model="metricFormData.name" placeholder="如：avg_response_time" />
      </el-form-item>
      <el-form-item label="指标名称" required>
        <el-input v-model="metricFormData.displayName" placeholder="如：平均响应时间" />
      </el-form-item>
      <el-form-item label="数据源" required>
        <el-select v-model="metricFormData.source" style="width: 100%" placeholder="请选择数据源">
          <el-option
            v-for="source in systemDataSources"
            :key="source.value"
            :label="source.label"
            :value="source.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="聚合方式" required>
        <el-select v-model="metricFormData.aggregation" style="width: 100%" placeholder="请选择聚合方式">
          <el-option
            v-for="agg in aggregationOptions"
            :key="agg.value"
            :label="agg.label"
            :value="agg.value"
          >
            <div class="aggregation-option">
              <span>{{ agg.label }}</span>
              <span class="agg-desc">{{ agg.description }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="单位">
        <el-input v-model="metricFormData.unit" placeholder="如：ms、%、个" style="width: 150px" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="metricFormData.description"
          type="textarea"
          :rows="2"
          placeholder="请输入指标描述"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="metricDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleMetricSubmit">
        {{ isEditMetricMode ? '保存' : '添加' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.plugin-detail-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.header-info h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #909399;
}

.info-card,
.code-card,
.params-card,
.test-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-value {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.test-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.test-status.success .status-dot {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  box-shadow: 0 0 8px rgba(103, 194, 58, 0.5);
}

.test-status.failed .status-dot {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  box-shadow: 0 0 8px rgba(245, 108, 108, 0.5);
}

.test-status.pending .status-dot {
  background: #c0c4cc;
}

.test-status.success .status-text {
  color: #67c23a;
}

.test-status.failed .status-text {
  color: #f56c6c;
}

.test-status.pending .status-text {
  color: #909399;
}

.test-time {
  font-size: 12px;
  color: #a0a0a0;
}

.dictionary-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 数据字典链接样式 */
.dictionary-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #667eea;
  font-size: 14px;
}

.dictionary-link.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: 6px;
}

.dictionary-link.clickable:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #5a67d8;
}

.dictionary-link .el-icon {
  font-size: 16px;
}

.text-muted {
  color: #c0c4cc;
  font-size: 14px;
}

/* 函数签名区域样式 */
.function-signature {
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%);
  border: 1px solid #d4e8ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.function-signature.empty-signature {
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-color: #e8e8e8;
}

.signature-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.signature-icon {
  font-size: 16px;
}

.signature-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.sync-tag {
  margin-left: auto;
  font-size: 11px;
}

.signature-content {
  background: #fff;
  padding: 12px 16px;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
  overflow-x: auto;
  border: 1px solid #e8e8e8;
}

.signature-content code {
  color: #606266;
}

.empty-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 13px;
  padding: 8px 0;
}

.empty-hint .el-icon {
  font-size: 16px;
  color: #e6a23c;
}

.code-content {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}

.code-editor :deep(textarea) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: #f5f7fa;
  border-radius: 8px;
}

.test-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.test-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-type-tag {
  font-size: 11px;
}

.dataset-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dataset-name {
  font-weight: 500;
}

.dataset-count {
  font-size: 12px;
  color: #909399;
}

.empty-dataset-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  color: #909399;
}

.input-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #fdf6ec;
  border-radius: 6px;
  font-size: 12px;
  color: #e6a23c;
}

.input-hint .el-icon {
  font-size: 14px;
}

.input-hint.success {
  background: #f0f9eb;
  color: #67c23a;
}

.test-action {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
}

/* 执行进度和日志样式 */
.test-execution {
  margin-top: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.progress-section {
  padding: 16px;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%);
  border-bottom: 1px solid #e4e7ed;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.progress-percent {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.log-section {
  background: #1e1e1e;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #3d3d3d;
}

.log-label {
  font-size: 13px;
  font-weight: 500;
  color: #e0e0e0;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.8;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  color: #d4d4d4;
}

.log-time {
  color: #6a9955;
  flex-shrink: 0;
}

.log-message {
  word-break: break-all;
}

.log-item.info .log-message {
  color: #9cdcfe;
}

.log-item.success .log-message {
  color: #4ec9b0;
}

.log-item.error .log-message {
  color: #f14c4c;
}

.log-item.warning .log-message {
  color: #cca700;
}

/* 日志滚动条样式 */
.log-container::-webkit-scrollbar {
  width: 6px;
}

.log-container::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.log-container::-webkit-scrollbar-thumb {
  background: #4d4d4d;
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb:hover {
  background: #5d5d5d;
}

.test-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-content {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

/* 处理后的数据区域样式 */
.processed-data-section {
  margin-top: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.processed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%);
  border-bottom: 1px solid #e4e7ed;
}

.processed-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.processed-title .el-icon {
  color: #409eff;
}

.processed-actions {
  display: flex;
  gap: 8px;
}

.data-table-wrapper {
  padding: 16px;
  background: #fff;
}

.table-header-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.col-label {
  font-weight: 500;
}

.col-type {
  font-size: 10px;
  padding: 0 4px;
  height: 18px;
  line-height: 16px;
}

.processed-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #fdf6ec;
  border-top: 1px solid #e4e7ed;
  font-size: 12px;
  color: #e6a23c;
}

/* 保存对话框预览信息 */
.preview-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 14px;
  color: #606266;
}

.preview-info .el-icon {
  color: #409eff;
  font-size: 18px;
}

.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  gap: 24px;
}

/* 代码编辑器样式 */
.code-editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  background: #282c34;
}

.code-card.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  margin: 0;
  border-radius: 0;
}

.code-card.is-fullscreen .code-editor-wrapper {
  height: calc(100vh - 120px);
  border-radius: 0;
  border: none;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #21252b;
  border-bottom: 1px solid #3d4148;
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #abb2bf;
  font-size: 13px;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.editor-tip {
  color: #5c6370;
  font-size: 12px;
}

.editor-tip code {
  background: #3d4148;
  padding: 2px 6px;
  border-radius: 4px;
  color: #98c379;
  font-family: 'Monaco', 'Menlo', monospace;
}

.editor-container {
  display: flex;
  height: 400px;
  overflow: hidden;
}

.code-card.is-fullscreen .editor-container {
  height: calc(100vh - 170px);
}

.line-numbers {
  padding: 16px 12px;
  background: #282c34;
  color: #5c6370;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  text-align: right;
  user-select: none;
  border-right: 1px solid #3d4148;
  min-width: 50px;
  overflow: hidden;
}

.line-numbers span {
  display: block;
}

.code-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.code-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #abb2bf;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: auto;
  pointer-events: none;
}

.code-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 16px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: transparent;
  caret-color: #fff;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: auto;
}

.code-input::placeholder {
  color: #5c6370;
}

/* 全屏按钮样式 */
.fullscreen-btn {
  background: transparent;
  border: none;
  color: #5c6370;
}

.fullscreen-btn:hover {
  color: #abb2bf;
}

/* 删除按钮样式优化 */
.delete-btn {
  border-color: #dcdfe6;
  background: #fff;
  color: #606266;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: #fef0f0;
  border-color: #fbc4c4;
  color: #f56c6c;
}

.delete-btn:hover .el-icon {
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

/* 指标采集插件样式 */
.metrics-card {
  margin-bottom: 20px;
}

.aggregation-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agg-desc {
  font-size: 12px;
  color: #909399;
}

.metrics-result-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.metrics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.metric-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.metric-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #d3d8de;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.metric-value .value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
}

.metric-value .unit {
  font-size: 14px;
  color: #909399;
}

.metric-info {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.metric-desc {
  font-size: 12px;
  color: #606266;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e4e7ed;
}
</style>
