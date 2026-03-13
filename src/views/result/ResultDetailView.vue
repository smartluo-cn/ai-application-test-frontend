<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Document,
  Download,
  Calendar,
  User,
  CircleCheck,
  Edit,
  MagicStick,
  Loading,
  View,
  EditPen,
  Star,
  Cpu,
  RefreshRight,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 当前激活的标签页
const activeTab = ref('overview')

// AI 分析相关
const isGenerating = ref(false)
const analysisContent = ref('')
const hasAnalysis = ref(false)

// 用例详情弹窗
const detailDialogVisible = ref(false)
const currentCase = ref(null)

// 人工纠正弹窗
const correctDialogVisible = ref(false)
const correctCase = ref(null)
const correctForm = ref({
  score: 80,
  reason: '',
})

// 模拟报告数据
const allReports = [
  {
    id: 'rpt-1',
    name: '智能客服系统 - 意图识别测试报告',
    taskName: '智能客服系统 - 意图识别测试',
    environment: '智能客服系统',
    testType: 'objective',
    status: 'completed',
    totalCases: 500,
    passedCases: 478,
    failedCases: 22,
    passRate: 95.6,
    avgResponseTime: 245,
    createdAt: '2024-03-01 15:30:00',
    duration: '00:45:30',
    executor: 'zhangsan 00123456',
  },
  {
    id: 'rpt-2',
    name: '文档问答系统 - RAG检索测试报告',
    taskName: '文档问答系统 - RAG检索测试',
    environment: '文档问答系统',
    testType: 'objective',
    status: 'completed',
    totalCases: 200,
    passedCases: 185,
    failedCases: 15,
    passRate: 92.5,
    avgResponseTime: 320,
    createdAt: '2024-03-01 11:00:00',
    duration: '00:38:15',
    executor: 'lisi 00123457',
  },
  {
    id: 'rpt-3',
    name: '智能写作助手 - 创意文本生成测试报告',
    taskName: '智能写作助手 - 创意文本生成测试',
    environment: '智能写作助手',
    testType: 'subjective',
    status: 'completed',
    totalCases: 100,
    evaluatedCases: 100,
    pendingCases: 0,
    avgScore: 85.2,
    scoreDistribution: { excellent: 25, good: 45, medium: 22, poor: 8 },
    createdAt: '2024-03-01 16:00:00',
    duration: '00:52:00',
    executor: 'wangwu 00123458',
  },
  {
    id: 'rpt-4',
    name: '智能客服系统 - 多轮对话测试报告',
    taskName: '智能客服系统 - 多轮对话测试',
    environment: '智能客服系统',
    testType: 'subjective',
    status: 'completed',
    totalCases: 80,
    evaluatedCases: 80,
    pendingCases: 0,
    avgScore: 78.5,
    scoreDistribution: { excellent: 15, good: 35, medium: 20, poor: 10 },
    createdAt: '2024-03-01 09:45:00',
    duration: '00:35:20',
    executor: 'zhangsan 00123456',
  },
  {
    id: 'rpt-5',
    name: '推荐引擎 - 个性化推荐测试报告',
    taskName: '推荐引擎 - 个性化推荐测试',
    environment: '智能推荐引擎',
    testType: 'objective',
    status: 'completed',
    totalCases: 300,
    passedCases: 268,
    failedCases: 32,
    passRate: 89.3,
    avgResponseTime: 180,
    createdAt: '2024-02-28 14:20:00',
    duration: '00:28:45',
    executor: 'wangwu 00123458',
  },
  {
    id: 'rpt-6',
    name: '智能翻译系统 - 文学翻译质量测试报告',
    taskName: '智能翻译系统 - 文学翻译质量测试',
    environment: '智能翻译系统',
    testType: 'subjective',
    status: 'completed',
    totalCases: 50,
    evaluatedCases: 45,
    pendingCases: 5,
    avgScore: 72.8,
    scoreDistribution: { excellent: 8, good: 20, medium: 15, poor: 7 },
    createdAt: '2024-02-28 10:30:00',
    duration: '01:15:00',
    executor: 'lisi 00123457',
  },
  {
    id: 'rpt-7',
    name: '代码生成测评报告',
    taskName: '代码生成测试任务',
    environment: '代码生成系统',
    testType: 'objective',
    status: 'completed',
    totalCases: 128,
    passedCases: 115,
    failedCases: 13,
    passRate: 89.8,
    avgResponseTime: 450,
    createdAt: '2024-02-27 16:45:00',
    duration: '00:55:30',
    executor: 'zhangsan 00123456',
  },
  {
    id: 'rpt-8',
    name: '文本摘要生成测试报告',
    taskName: '摘要生成测试任务',
    environment: '文本处理系统',
    testType: 'subjective',
    status: 'completed',
    totalCases: 156,
    evaluatedCases: 156,
    pendingCases: 0,
    avgScore: 81.5,
    scoreDistribution: { excellent: 30, good: 65, medium: 45, poor: 16 },
    createdAt: '2024-02-27 11:20:00',
    duration: '00:42:15',
    executor: 'lisi 00123457',
  },
]

// 当前报告数据
const report = ref(null)

// 客观题用例数据
const objectiveCaseData = ref([
  { id: 'TC001', input: '用户询问"如何退款"', expected: '返回退款流程说明', actual: '返回退款流程说明', status: '通过' },
  { id: 'TC002', input: '用户询问"配送时间"', expected: '返回配送时间范围', actual: '返回配送时间范围', status: '通过' },
  { id: 'TC003', input: '用户询问"会员权益"', expected: '返回会员权益列表', actual: '返回部分权益', status: '失败' },
  { id: 'TC004', input: '用户询问"优惠券使用"', expected: '返回优惠券使用规则', actual: '返回优惠券使用规则', status: '通过' },
  { id: 'TC005', input: '用户询问"商品退换"', expected: '返回退换货政策', actual: '返回退换货政策', status: '通过' },
])

// 主观题用例数据（裁判模型评估 + 人工纠正）
const subjectiveCaseData = ref([
  {
    id: 'TC001',
    input: '请根据以下关键词写一篇300字的产品推广文案：智能、便捷、高效',
    referenceAnswer: '包含所有关键词，字数在280-320字之间，语言流畅有感染力，能够吸引目标用户',
    modelOutput: '智能时代，便捷生活！我们的新产品采用最先进的人工智能技术，让您的每一天都更加高效。无论是工作还是生活，它都能为您提供最贴心的服务。只需一句话，即可完成复杂操作，让繁琐变得简单。选择我们，选择更智能的生活方式！',
    // 裁判模型自动评估
    autoEvaluation: {
      score: 92,
      dimensions: {
        relevance: 95,      // 相关性
        fluency: 90,        // 流畅性
        creativity: 88,     // 创意性
        completeness: 94,   // 完整性
      },
      reason: '文案整体质量优秀，语言流畅自然，三个关键词"智能、便捷、高效"均得到了恰当体现。结构清晰，具有较强的感染力和说服力。字数控制在合理范围内，符合要求。',
      evaluatedAt: '2024-03-01 16:30:00',
    },
    // 人工纠正（可选）
    manualCorrection: null,
  },
  {
    id: 'TC002',
    input: '请将以下英文翻译成中文：The quick brown fox jumps over the lazy dog.',
    referenceAnswer: '准确翻译，语句通顺，符合中文表达习惯',
    modelOutput: '敏捷的棕色狐狸跳过了懒惰的狗。',
    autoEvaluation: {
      score: 88,
      dimensions: {
        accuracy: 95,
        fluency: 85,
        completeness: 90,
      },
      reason: '翻译准确，忠实于原文。语句结构合理，但"懒惰的狗"表达略显生硬，可以优化为"懒狗"更符合中文习惯。',
      evaluatedAt: '2024-03-01 16:35:00',
    },
    manualCorrection: {
      originalScore: 85,
      correctedScore: 88,
      reason: '裁判模型评分略低，实际翻译质量较好，提升2分。',
      correctedBy: 'zhangsan 00123456',
      correctedAt: '2024-03-01 17:00:00',
    },
  },
  {
    id: 'TC003',
    input: '请对以下文章进行摘要：[一篇关于人工智能发展历程与应用前景的长文，约5000字]',
    referenceAnswer: '摘要需包含文章核心观点，字数控制在100-150字以内',
    modelOutput: '本文详细介绍了人工智能从诞生至今的发展历程，包括符号主义、连接主义等主要流派。同时探讨了AI在医疗、金融、教育等领域的应用现状，并对其未来发展前景进行了展望。',
    autoEvaluation: {
      score: 72,
      dimensions: {
        accuracy: 75,
        conciseness: 65,
        completeness: 70,
      },
      reason: '摘要基本涵盖了文章主要内容，但存在以下问题：1) 字数略超要求（约95字）；2) 未能突出文章的核心论点；3) 部分重要细节被遗漏，如AI发展中的关键技术突破。',
      evaluatedAt: '2024-03-01 16:40:00',
    },
    manualCorrection: {
      originalScore: 72,
      correctedScore: 75,
      reason: '虽然存在不足，但摘要基本可用，评分调整为75分。',
      correctedBy: 'lisi 00123457',
      correctedAt: '2024-03-01 17:15:00',
    },
  },
  {
    id: 'TC004',
    input: '请根据以下场景编写一段客服对话：顾客因商品质量问题要求退货，客服需要妥善处理',
    referenceAnswer: '对话自然流畅，符合客服规范，能够体现专业性并有效解决问题',
    modelOutput: '客服：您好，很高兴为您服务。请问有什么可以帮助您的？\n顾客：我买的商品有质量问题，想退货。\n客服：非常抱歉给您带来不便，请问具体是什么问题呢？\n顾客：衣服有破损。\n客服：理解您的心情，我们会为您办理退货。请您提供订单号，我来帮您处理。\n顾客：好的，订单号是12345。\n客服：已为您提交退货申请，快递员会在1-2天内上门取件，退款将在确认收货后3个工作日内到账。',
    autoEvaluation: {
      score: 85,
      dimensions: {
        professionalism: 90,
        effectiveness: 82,
        naturalness: 85,
      },
      reason: '对话整体专业、有效，客服态度良好，能够妥善解决问题。不足之处：1) 缺少对顾客情感的进一步安抚；2) 可以主动提供补偿方案提升用户体验。',
      evaluatedAt: '2024-03-01 16:45:00',
    },
    manualCorrection: null,
  },
  {
    id: 'TC005',
    input: '请写一首关于春天的五言绝句',
    referenceAnswer: '符合五言绝句格律要求（平仄、押韵），意境优美，具有文学性',
    modelOutput: '春日暖阳照，花开满枝头。燕归檐下语，绿意满山丘。',
    autoEvaluation: {
      score: 95,
      dimensions: {
        form: 95,       // 格律
        imagery: 95,    // 意境
        creativity: 90, // 创意
      },
      reason: '诗作格律严谨，符合五言绝句规范。意象选取恰当，"暖阳、花开、燕归、绿意"勾勒出春日生机勃勃的画面。语言清新自然，具有较好的文学性。',
      evaluatedAt: '2024-03-01 16:50:00',
    },
    manualCorrection: null,
  },
  {
    id: 'TC006',
    input: '请解释量子计算的基本原理及其潜在应用',
    referenceAnswer: '解释准确、通俗易懂，能够涵盖量子比特、叠加态、纠缠等核心概念，并列举实际应用场景',
    modelOutput: '量子计算是利用量子力学原理进行信息处理的技术。其核心概念包括：量子比特可以同时处于0和1的叠加态，实现并行计算；量子纠缠使多个量子比特产生关联。潜在应用包括：密码破解、药物研发、金融建模、人工智能等。',
    autoEvaluation: {
      score: 0,
      dimensions: null,
      reason: '等待评估',
      evaluatedAt: null,
    },
    manualCorrection: null,
  },
  {
    id: 'TC007',
    input: '请为一家精品咖啡店写一段品牌宣传语',
    referenceAnswer: '宣传语简洁有力，富有创意，能够体现品牌特色并吸引目标客户',
    modelOutput: '一杯匠心，品味生活。我们精心甄选全球优质咖啡豆，以匠心工艺呈现每一杯咖啡的独特风味。在这里，时间慢下来，让咖啡香陪你度过美好时光。',
    autoEvaluation: {
      score: 82,
      dimensions: {
        creativity: 78,
        appeal: 85,
        brandFit: 85,
      },
      reason: '宣传语整体较好，"一杯匠心，品味生活"开篇有力。体现了精品咖啡的定位。不足：创意度一般，类似表达较为常见，可以更独特。',
      evaluatedAt: '2024-03-01 17:00:00',
    },
    manualCorrection: null,
  },
  {
    id: 'TC008',
    input: '请优化以下Python代码并说明理由',
    referenceAnswer: '优化后代码效率明显提升，解释清晰有说服力',
    modelOutput: '建议使用列表推导式替代for循环，使用内置函数sum()替代手动累加。优化后代码更简洁，执行效率提升约30%。',
    autoEvaluation: {
      score: 58,
      dimensions: {
        correctness: 60,
        completeness: 50,
        clarity: 65,
      },
      reason: '回答存在明显不足：1) 未提供具体的优化代码示例；2) 优化建议过于笼统；3) 缺少性能对比数据支持；4) 未考虑代码可读性等其他因素。',
      evaluatedAt: '2024-03-01 17:05:00',
    },
    manualCorrection: {
      originalScore: 58,
      correctedScore: 55,
      reason: '裁判模型评分偏高，考虑到回答缺少实际代码示例，调整为55分更合理。',
      correctedBy: 'wangwu 00123458',
      correctedAt: '2024-03-01 17:30:00',
    },
  },
])

// 当前用例数据
const caseData = computed(() => {
  if (!report.value) return []
  return report.value.testType === 'objective' ? objectiveCaseData.value : subjectiveCaseData.value
})

// 评分分布数据（用于图表）
const scoreData = computed(() => {
  if (!report.value || report.value.testType !== 'subjective') return []
  const dist = report.value.scoreDistribution
  const total = report.value.totalCases
  return [
    { label: '优秀', value: dist.excellent, percentage: ((dist.excellent / total) * 100).toFixed(1), color: '#67c23a' },
    { label: '良好', value: dist.good, percentage: ((dist.good / total) * 100).toFixed(1), color: '#409eff' },
    { label: '中等', value: dist.medium, percentage: ((dist.medium / total) * 100).toFixed(1), color: '#e6a23c' },
    { label: '较差', value: dist.poor, percentage: ((dist.poor / total) * 100).toFixed(1), color: '#f56c6c' },
  ]
})

// 加载报告数据
onMounted(() => {
  const reportId = route.params.id
  const found = allReports.find((r) => r.id === reportId)
  if (found) {
    report.value = found
  } else {
    ElMessage.error('报告不存在')
    router.push('/result')
  }
})

// 获取测试类型文本
const getTestTypeText = (testType) => {
  return testType === 'subjective' ? '主观题' : '客观题'
}

// 获取测试类型标签类型
const getTestTypeTagType = (testType) => {
  return testType === 'subjective' ? 'warning' : ''
}

// 获取通过率颜色
const getPassRateColor = (rate) => {
  if (rate >= 90) return '#67c23a'
  if (rate >= 70) return '#e6a23c'
  return '#f56c6c'
}

// 获取评分等级
const getScoreLevel = (score) => {
  if (score >= 90) return { text: '优秀', color: '#67c23a' }
  if (score >= 75) return { text: '良好', color: '#409eff' }
  if (score >= 60) return { text: '中等', color: '#e6a23c' }
  return { text: '较差', color: '#f56c6c' }
}

// 获取评分标签类型
const getScoreTagType = (score) => {
  if (score >= 90) return 'success'
  if (score >= 75) return ''
  if (score >= 60) return 'warning'
  return 'danger'
}

// 获取用例最终评分
const getFinalScore = (caseItem) => {
  if (caseItem.manualCorrection) {
    return caseItem.manualCorrection.correctedScore
  }
  return caseItem.autoEvaluation?.score || 0
}

// 获取评估状态
const getEvalStatus = (caseItem) => {
  if (!caseItem.autoEvaluation?.evaluatedAt) {
    return { text: '待评估', type: 'info' }
  }
  if (caseItem.manualCorrection) {
    return { text: '已纠正', type: 'warning' }
  }
  return { text: '已评估', type: 'success' }
}

// 返回列表
const goBack = () => {
  router.push('/result')
}

// 导出报告
const exportReport = () => {
  ElMessage.success(`正在导出报告：${report.value.name}`)
}

// 查看用例详情
const viewCaseDetail = (caseItem) => {
  currentCase.value = caseItem
  detailDialogVisible.value = true
}

// 打开人工纠正弹窗
const openCorrectDialog = (caseItem) => {
  correctCase.value = caseItem
  correctForm.value = {
    score: getFinalScore(caseItem),
    reason: caseItem.manualCorrection?.reason || '',
  }
  correctDialogVisible.value = true
}

// 提交纠正
const submitCorrection = () => {
  if (!correctCase.value) return

  const index = subjectiveCaseData.value.findIndex((c) => c.id === correctCase.value.id)
  if (index !== -1) {
    const originalScore = subjectiveCaseData.value[index].autoEvaluation?.score || 0
    subjectiveCaseData.value[index].manualCorrection = {
      originalScore,
      correctedScore: correctForm.value.score,
      reason: correctForm.value.reason,
      correctedBy: 'current_user 00123459',
      correctedAt: new Date().toLocaleString('zh-CN'),
    }
  }

  correctDialogVisible.value = false
  ElMessage.success('纠正成功')
}

// 生成 AI 分析
const generateAnalysis = async () => {
  if (isGenerating.value) return

  isGenerating.value = true
  activeTab.value = 'analysis'

  await new Promise((resolve) => setTimeout(resolve, 2000))

  if (report.value.testType === 'objective') {
    analysisContent.value = generateObjectiveAnalysis()
  } else {
    analysisContent.value = generateSubjectiveAnalysis()
  }

  hasAnalysis.value = true
  isGenerating.value = false
  ElMessage.success('报告分析生成完成')
}

// 生成客观题分析
const generateObjectiveAnalysis = () => {
  const r = report.value
  const level = r.passRate >= 90 ? '优秀' : r.passRate >= 70 ? '良好' : '需改进'

  return `## 测试报告分析

### 整体评估
本次测试 **${r.name}** 整体表现 **${level}**，通过率达到 **${r.passRate}%**。

### 数据统计
- 总用例数：${r.totalCases} 个
- 通过用例：${r.passedCases} 个
- 失败用例：${r.failedCases} 个
- 平均响应时间：${r.avgResponseTime}ms

### 改进建议
建议对失败的 ${r.failedCases} 个用例进行详细分析，找出根本原因并优化。`
}

// 生成主观题分析
const generateSubjectiveAnalysis = () => {
  const r = report.value
  const level = getScoreLevel(r.avgScore)
  const dist = r.scoreDistribution

  return `## 测试报告分析

### 整体评估
本次测试 **${r.name}** 整体表现 **${level.text}**，平均评分 **${r.avgScore}** 分。

### 数据统计
- 总用例数：${r.totalCases} 个
- 已评估：${r.evaluatedCases} 个
- 待评估：${r.pendingCases} 个

### 评分分布
- 优秀（≥90分）：${dist.excellent} 个
- 良好（75-89分）：${dist.good} 个
- 中等（60-74分）：${dist.medium} 个
- 较差（<60分）：${dist.poor} 个

### 改进建议
针对评分较低的用例，建议进行人工复核，优化提示词设计。`
}
</script>

<template>
  <div class="report-detail-page" v-if="report">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="back-section">
          <el-button class="back-btn" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回列表</span>
          </el-button>
        </div>
        <div class="report-title">
          <el-icon class="report-icon" :class="report.testType">
            <component :is="report.testType === 'subjective' ? Edit : CircleCheck" />
          </el-icon>
          <div class="title-info">
            <h2>{{ report.name }}</h2>
            <div class="report-meta">
              <el-tag :type="getTestTypeTagType(report.testType)" size="small" effect="plain">
                {{ getTestTypeText(report.testType) }}
              </el-tag>
              <span class="meta-item">
                <el-icon><Document /></el-icon>
                {{ report.taskName }}
              </span>
              <span class="meta-item">
                <el-icon><User /></el-icon>
                {{ report.executor }}
              </span>
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ report.createdAt }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <el-button
          type="success"
          :icon="isGenerating ? Loading : MagicStick"
          :loading="isGenerating"
          @click="generateAnalysis"
        >
          {{ isGenerating ? '生成中...' : '生成分析' }}
        </el-button>
        <el-button type="primary" :icon="Download" @click="exportReport">导出报告</el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <!-- 客观题统计 -->
      <template v-if="report.testType === 'objective'">
        <div class="stat-card">
          <div class="stat-value">{{ report.totalCases }}</div>
          <div class="stat-label">总用例数</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">{{ report.passedCases }}</div>
          <div class="stat-label">通过</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-value">{{ report.failedCases }}</div>
          <div class="stat-label">失败</div>
        </div>
        <div class="stat-card highlight">
          <div class="stat-value" :style="{ color: getPassRateColor(report.passRate) }">
            {{ report.passRate }}%
          </div>
          <div class="stat-label">通过率</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ report.avgResponseTime }}ms</div>
          <div class="stat-label">平均响应时间</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ report.duration }}</div>
          <div class="stat-label">执行时长</div>
        </div>
      </template>

      <!-- 主观题统计 -->
      <template v-else>
        <div class="stat-card">
          <div class="stat-value">{{ report.totalCases }}</div>
          <div class="stat-label">总用例数</div>
        </div>
        <div class="stat-card primary">
          <div class="stat-value">{{ report.evaluatedCases }}</div>
          <div class="stat-label">已评估</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value">{{ report.pendingCases }}</div>
          <div class="stat-label">待评估</div>
        </div>
        <div class="stat-card highlight">
          <div class="stat-value" :style="{ color: getScoreLevel(report.avgScore).color }">
            {{ report.avgScore }}
            <span class="score-level">({{ getScoreLevel(report.avgScore).text }})</span>
          </div>
          <div class="stat-label">平均评分</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ report.duration }}</div>
          <div class="stat-label">执行时长</div>
        </div>
      </template>
    </div>

    <!-- 通过率进度条（客观题） -->
    <div class="progress-section" v-if="report.testType === 'objective'">
      <div class="section-title">通过率分布</div>
      <el-progress
        :percentage="report.passRate"
        :stroke-width="16"
        :color="getPassRateColor(report.passRate)"
      />
    </div>

    <!-- 评分分布（主观题） -->
    <div class="score-section" v-if="report.testType === 'subjective'">
      <div class="section-title">评分分布</div>
      <div class="score-chart">
        <div class="chart-bars">
          <div class="bar-item" v-for="item in scoreData" :key="item.label">
            <div class="bar-label">{{ item.label }}</div>
            <div class="bar-wrapper">
              <div
                class="bar"
                :style="{ width: item.percentage + '%', background: item.color }"
              ></div>
            </div>
            <div class="bar-value">{{ item.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情标签页 -->
    <div class="detail-tabs">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="报告概览" name="overview">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="报告名称" :span="2">{{ report.name }}</el-descriptions-item>
            <el-descriptions-item label="关联任务">{{ report.taskName }}</el-descriptions-item>
            <el-descriptions-item label="测试环境">{{ report.environment }}</el-descriptions-item>
            <el-descriptions-item label="测试类型">
              <el-tag :type="getTestTypeTagType(report.testType)" size="small" effect="plain">
                {{ getTestTypeText(report.testType) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="执行人">{{ report.executor }}</el-descriptions-item>
            <el-descriptions-item label="生成时间">{{ report.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="执行时长">{{ report.duration }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="用例详情" name="cases">
          <!-- 客观题用例表格 -->
          <el-table
            v-if="report.testType === 'objective'"
            :data="caseData"
            style="width: 100%"
            border
          >
            <el-table-column prop="id" label="用例ID" width="100" />
            <el-table-column prop="input" label="输入" min-width="180" />
            <el-table-column prop="expected" label="期望输出" min-width="180" />
            <el-table-column prop="actual" label="实际输出" min-width="180" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === '通过' ? 'success' : 'danger'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" :icon="View" @click="viewCaseDetail(row)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 主观题用例表格 -->
          <el-table
            v-else
            :data="caseData"
            style="width: 100%"
            border
          >
            <el-table-column prop="id" label="用例ID" width="90" />
            <el-table-column prop="input" label="输入" min-width="200" show-overflow-tooltip />
            <el-table-column label="模型评分" width="100" align="center">
              <template #default="{ row }">
                <template v-if="row.autoEvaluation?.evaluatedAt">
                  <el-tag :type="getScoreTagType(row.autoEvaluation.score)" size="small">
                    {{ row.autoEvaluation.score }}
                  </el-tag>
                </template>
                <template v-else>
                  <el-tag type="info" size="small">待评估</el-tag>
                </template>
              </template>
            </el-table-column>
            <el-table-column label="最终评分" width="100" align="center">
              <template #default="{ row }">
                <template v-if="row.autoEvaluation?.evaluatedAt">
                  <span :style="{ color: getScoreLevel(getFinalScore(row)).color, fontWeight: '600' }">
                    {{ getFinalScore(row) }}
                  </span>
                </template>
                <template v-else>
                  <span style="color: #909399">-</span>
                </template>
              </template>
            </el-table-column>
            <el-table-column label="评估状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="getEvalStatus(row).type" size="small" effect="plain">
                  {{ getEvalStatus(row).text }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" :icon="View" @click="viewCaseDetail(row)">
                  查看详情
                </el-button>
                <el-button
                  v-if="row.autoEvaluation?.evaluatedAt"
                  type="warning"
                  link
                  size="small"
                  :icon="RefreshRight"
                  @click="openCorrectDialog(row)"
                >
                  纠正
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="性能分析" name="performance">
          <div class="performance-section">
            <el-empty description="性能分析图表展示区域" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="AI 分析" name="analysis">
          <div class="analysis-section">
            <div v-if="!hasAnalysis && !isGenerating" class="analysis-empty">
              <el-empty description="暂无分析内容">
                <template #image>
                  <el-icon :size="60" color="#c0c4cc"><MagicStick /></el-icon>
                </template>
                <el-button type="success" :icon="MagicStick" @click="generateAnalysis">
                  一键生成分析报告
                </el-button>
              </el-empty>
            </div>
            <div v-if="isGenerating" class="analysis-loading">
              <el-icon class="loading-icon" :size="40"><Loading /></el-icon>
              <p>AI 正在分析报告数据，请稍候...</p>
            </div>
            <div v-if="hasAnalysis && !isGenerating" class="analysis-content">
              <div class="analysis-header">
                <h3>
                  <el-icon><MagicStick /></el-icon>
                  AI 智能分析报告
                </h3>
                <el-button size="small" :icon="MagicStick" @click="generateAnalysis">
                  重新生成
                </el-button>
              </div>
              <div class="analysis-body" v-html="renderMarkdown(analysisContent)"></div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 用例详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="用例详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <template v-if="currentCase">
        <!-- 客观题详情 -->
        <template v-if="currentCase.status">
          <div class="case-detail-section">
            <h4 class="section-subtitle">基本信息</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="用例ID">{{ currentCase.id }}</el-descriptions-item>
              <el-descriptions-item label="输入">
                <div class="case-content">{{ currentCase.input }}</div>
              </el-descriptions-item>
              <el-descriptions-item label="期望输出">
                <div class="case-content">{{ currentCase.expected }}</div>
              </el-descriptions-item>
              <el-descriptions-item label="实际输出">
                <div class="case-content" :class="{ 'output-fail': currentCase.status === '失败' }">
                  {{ currentCase.actual }}
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="执行状态">
                <el-tag :type="currentCase.status === '通过' ? 'success' : 'danger'" size="large">
                  {{ currentCase.status }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </template>

        <!-- 主观题详情 -->
        <template v-else>
          <div class="case-detail-section">
            <h4 class="section-subtitle">基本信息</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="用例ID">{{ currentCase.id }}</el-descriptions-item>
              <el-descriptions-item label="输入">
                <div class="case-content">{{ currentCase.input }}</div>
              </el-descriptions-item>
              <el-descriptions-item label="参考答案">
                <div class="case-content">{{ currentCase.referenceAnswer }}</div>
              </el-descriptions-item>
              <el-descriptions-item label="模型输出">
                <div class="case-content output">{{ currentCase.modelOutput }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="case-detail-section" v-if="currentCase.autoEvaluation?.evaluatedAt">
            <h4 class="section-subtitle">
              <el-icon><Cpu /></el-icon>
              裁判模型评估结果
            </h4>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="评估分数">
                <el-tag :type="getScoreTagType(currentCase.autoEvaluation.score)" size="large">
                  <el-icon><Star /></el-icon>
                  {{ currentCase.autoEvaluation.score }} 分（{{ getScoreLevel(currentCase.autoEvaluation.score).text }}）
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="评估时间">
                {{ currentCase.autoEvaluation.evaluatedAt }}
              </el-descriptions-item>
              <el-descriptions-item label="评估维度" :span="2" v-if="currentCase.autoEvaluation.dimensions">
                <div class="dimension-list">
                  <span
                    v-for="(value, key) in currentCase.autoEvaluation.dimensions"
                    :key="key"
                    class="dimension-item"
                  >
                    {{ { relevance: '相关性', fluency: '流畅性', creativity: '创意性', completeness: '完整性', accuracy: '准确性', conciseness: '简洁性', professionalism: '专业性', effectiveness: '有效性', naturalness: '自然度', form: '格律', imagery: '意境', appeal: '吸引力', brandFit: '品牌契合度', correctness: '正确性', clarity: '清晰度' }[key] || key }}：
                    <strong>{{ value }}</strong>
                  </span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="评估理由" :span="2">
                <div class="case-content">{{ currentCase.autoEvaluation.reason }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="case-detail-section" v-if="currentCase.manualCorrection">
            <h4 class="section-subtitle correction">
              <el-icon><EditPen /></el-icon>
              人工纠正记录
            </h4>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="原始评分">
                <span style="text-decoration: line-through; color: #909399">
                  {{ currentCase.manualCorrection.originalScore }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="纠正后评分">
                <el-tag :type="getScoreTagType(currentCase.manualCorrection.correctedScore)" size="large">
                  {{ currentCase.manualCorrection.correctedScore }} 分（{{ getScoreLevel(currentCase.manualCorrection.correctedScore).text }}）
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="纠正人">
                {{ currentCase.manualCorrection.correctedBy }}
              </el-descriptions-item>
              <el-descriptions-item label="纠正时间">
                {{ currentCase.manualCorrection.correctedAt }}
              </el-descriptions-item>
              <el-descriptions-item label="纠正理由" :span="2">
                <div class="case-content">{{ currentCase.manualCorrection.reason }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="case-detail-section" v-if="!currentCase.autoEvaluation?.evaluatedAt">
            <el-empty description="该用例尚未进行评估" :image-size="80" />
          </div>
        </template>
      </template>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentCase?.autoEvaluation?.evaluatedAt"
          type="warning"
          :icon="RefreshRight"
          @click="detailDialogVisible = false; openCorrectDialog(currentCase)"
        >
          纠正评估
        </el-button>
      </template>
    </el-dialog>

    <!-- 人工纠正弹窗 -->
    <el-dialog
      v-model="correctDialogVisible"
      title="纠正评估结果"
      width="650px"
      :close-on-click-modal="false"
    >
      <template v-if="correctCase">
        <div class="correct-info">
          <div class="correct-row">
            <span class="correct-label">用例ID：</span>
            <span class="correct-value">{{ correctCase.id }}</span>
          </div>
          <div class="correct-row">
            <span class="correct-label">输入：</span>
            <span class="correct-value">{{ correctCase.input }}</span>
          </div>
        </div>

        <el-divider />

        <div class="score-comparison">
          <div class="score-item original">
            <div class="score-label">模型评分</div>
            <div class="score-number">{{ correctCase.autoEvaluation?.score || '-' }}</div>
          </div>
          <div class="score-arrow">
            <el-icon><ArrowLeft /></el-icon>
            <span>纠正</span>
          </div>
          <div class="score-item corrected">
            <div class="score-label">纠正后评分</div>
            <div class="score-number" :style="{ color: getScoreLevel(correctForm.score).color }">
              {{ correctForm.score }}
            </div>
          </div>
        </div>

        <el-form :model="correctForm" label-width="80px" style="margin-top: 20px">
          <el-form-item label="评分">
            <div class="score-slider-wrapper">
              <el-slider
                v-model="correctForm.score"
                :min="0"
                :max="100"
                :step="1"
              />
              <el-tag :type="getScoreTagType(correctForm.score)" size="default" class="score-tag">
                {{ getScoreLevel(correctForm.score).text }} ({{ correctForm.score }}分)
              </el-tag>
            </div>
          </el-form-item>
          <el-form-item label="纠正理由">
            <el-input
              v-model="correctForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请输入纠正理由（必填）"
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="correctDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!correctForm.reason"
          @click="submitCorrection"
        >
          确认纠正
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  methods: {
    renderMarkdown(content) {
      if (!content) return ''
      return content
        .replace(/^### (.*$)/gm, '<h4 class="md-h4">$1</h4>')
        .replace(/^## (.*$)/gm, '<h3 class="md-h3">$1</h3>')
        .replace(/^# (.*$)/gm, '<h2 class="md-h2">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>')
    },
  },
}
</script>

<style scoped>
.report-detail-page {
  padding: 24px;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 返回按钮样式 */
.back-section {
  margin-bottom: 4px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.back-btn:hover {
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
}

.back-btn .el-icon {
  font-size: 16px;
}

.report-title {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.report-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.report-icon.objective {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.report-icon.subjective {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.title-info h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.report-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

/* 统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-card .stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 8px;
}

.stat-card.success .stat-value {
  color: #67c23a;
}

.stat-card.danger .stat-value {
  color: #f56c6c;
}

.stat-card.primary .stat-value {
  color: #409eff;
}

.stat-card.warning .stat-value {
  color: #e6a23c;
}

.score-level {
  font-size: 14px;
  font-weight: normal;
}

/* 进度条区域 */
.progress-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

/* 评分分布 */
.score-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.score-chart {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bar-label {
  width: 60px;
  font-size: 14px;
  color: #606266;
  flex-shrink: 0;
}

.bar-wrapper {
  flex: 1;
  height: 24px;
  background: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.bar-value {
  width: 50px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  text-align: right;
}

/* 详情标签页 */
.detail-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.performance-section {
  padding: 40px 0;
}

/* AI 分析区域 */
.analysis-section {
  min-height: 400px;
}

.analysis-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.analysis-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #909399;
}

.loading-icon {
  animation: spin 1s linear infinite;
  color: #67c23a;
  margin-bottom: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.analysis-content {
  padding: 20px 0;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.analysis-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.analysis-header h3 .el-icon {
  color: #67c23a;
}

.analysis-body {
  line-height: 1.8;
  color: #606266;
}

.analysis-body :deep(.md-h2) {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 24px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.analysis-body :deep(.md-h3) {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 12px 0;
}

.analysis-body :deep(.md-h4) {
  font-size: 15px;
  font-weight: 600;
  color: #606266;
  margin: 16px 0 8px 0;
}

.analysis-body :deep(ul) {
  padding-left: 20px;
  margin: 12px 0;
}

.analysis-body :deep(li) {
  margin: 8px 0;
  line-height: 1.6;
}

.analysis-body :deep(strong) {
  color: #303133;
  font-weight: 600;
}

/* 用例详情弹窗 */
.case-detail-section {
  margin-bottom: 24px;
}

.case-detail-section:last-child {
  margin-bottom: 0;
}

.section-subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.section-subtitle.correction {
  color: #e6a23c;
}

.section-subtitle .el-icon {
  color: #409eff;
}

.section-subtitle.correction .el-icon {
  color: #e6a23c;
}

.case-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  color: #606266;
}

.case-content.output {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
}

.case-content.output-fail {
  background: #fef0f0;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #f56c6c;
}

.dimension-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.dimension-item {
  font-size: 14px;
  color: #606266;
}

.dimension-item strong {
  color: #303133;
}

/* 人工纠正弹窗 */
.correct-info {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
}

.correct-row {
  display: flex;
  margin-bottom: 8px;
}

.correct-row:last-child {
  margin-bottom: 0;
}

.correct-label {
  width: 70px;
  color: #909399;
  flex-shrink: 0;
}

.correct-value {
  flex: 1;
  color: #303133;
}

.score-comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.score-item {
  text-align: center;
  padding: 16px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.score-item .score-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.score-item .score-number {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.score-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #e6a23c;
}

.score-arrow .el-icon {
  transform: rotate(180deg);
  font-size: 20px;
}

.score-arrow span {
  font-size: 12px;
}

.score-slider-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.score-slider-wrapper :deep(.el-slider) {
  flex: 1;
}

.score-tag {
  min-width: 100px;
  text-align: center;
}
</style>
