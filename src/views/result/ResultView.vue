<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  Document,
  Download,
  View,
  Search,
  Calendar,
  TrendCharts,
  CircleCheck,
  CircleClose,
  Edit,
  Timer,
  User,
  ArrowUp,
  ArrowDown,
  Minus,
} from '@element-plus/icons-vue'

const router = useRouter()

// 搜索和筛选
const searchKeyword = ref('')
const selectedTestType = ref('all')
const dateRange = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 测试类型选项
const testTypeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'objective', label: '客观题' },
  { value: 'subjective', label: '主观题' },
]

// 模拟报告数据
const allReports = ref([
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
    executor: '张三',
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
    executor: '李四',
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
    executor: '王五',
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
    executor: '张三',
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
    executor: '王五',
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
    executor: '李四',
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
    executor: '张三',
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
    executor: '李四',
  },
])

// 过滤后的报告列表
const filteredReports = computed(() => {
  let result = allReports.value

  // 测试类型筛选
  if (selectedTestType.value !== 'all') {
    result = result.filter(r => r.testType === selectedTestType.value)
  }

  // 日期范围筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(r => {
      const date = r.createdAt.split(' ')[0]
      return date >= start && date <= end
    })
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(r =>
      r.name.toLowerCase().includes(keyword) ||
      r.taskName.toLowerCase().includes(keyword) ||
      r.environment.toLowerCase().includes(keyword)
    )
  }

  return result
})

// 分页后的报告列表
const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredReports.value.slice(start, start + pageSize.value)
})

// 总数
const total = computed(() => filteredReports.value.length)

// 统计数据
const statistics = computed(() => {
  const objectiveReports = allReports.value.filter(r => r.testType === 'objective')
  const subjectiveReports = allReports.value.filter(r => r.testType === 'subjective')

  const avgPassRate = objectiveReports.length > 0
    ? (objectiveReports.reduce((sum, r) => sum + r.passRate, 0) / objectiveReports.length).toFixed(1)
    : 0

  const avgScore = subjectiveReports.length > 0
    ? (subjectiveReports.reduce((sum, r) => sum + r.avgScore, 0) / subjectiveReports.length).toFixed(1)
    : 0

  return {
    totalReports: allReports.value.length,
    objectiveCount: objectiveReports.length,
    subjectiveCount: subjectiveReports.length,
    avgPassRate,
    avgScore,
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

// 查看报告详情
const viewReportDetail = (report) => {
  router.push(`/result/${report.id}`)
}

// 导出报告
const exportReport = (report) => {
  ElMessage.success(`正在导出报告：${report.name}`)
}

// 获取通过率趋势
const getPassRateTrend = (report) => {
  // 模拟趋势数据
  const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'flat'
  return trend
}

// 获取趋势图标
const getTrendIcon = (trend) => {
  if (trend === 'up') return ArrowUp
  if (trend === 'down') return ArrowDown
  return Minus
}

// 获取趋势颜色
const getTrendColor = (trend) => {
  if (trend === 'up') return '#67c23a'
  if (trend === 'down') return '#f56c6c'
  return '#909399'
}

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
}
</script>

<template>
  <div class="report-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>测试报告</h2>
        <span class="report-count">共 {{ allReports.length }} 份报告</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.totalReports }}</div>
          <div class="stat-label">总报告数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon objective">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.objectiveCount }}</div>
          <div class="stat-label">客观题报告</div>
          <div class="stat-sub">平均通过率 {{ statistics.avgPassRate }}%</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon subjective">
          <el-icon><Edit /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ statistics.subjectiveCount }}</div>
          <div class="stat-label">主观题报告</div>
          <div class="stat-sub">平均评分 {{ statistics.avgScore }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon trend">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">+12%</div>
          <div class="stat-label">较上周</div>
          <div class="stat-sub trend-up">测试质量提升</div>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索报告名称、任务或环境"
        :prefix-icon="Search"
        clearable
        style="width: 300px"
        @input="handleSearch"
      />
      <el-select v-model="selectedTestType" placeholder="测试类型" style="width: 120px" @change="handleSearch">
        <el-option
          v-for="type in testTypeOptions"
          :key="type.value"
          :label="type.label"
          :value="type.value"
        />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        style="width: 260px"
        @change="handleSearch"
      />
    </div>

    <!-- 报告列表 -->
    <div class="report-list" v-if="total > 0">
      <el-card v-for="report in paginatedReports" :key="report.id" class="report-card" shadow="hover">
        <div class="report-header">
          <div class="report-title">
            <el-icon class="report-icon" :class="report.testType">
              <component :is="report.testType === 'subjective' ? Edit : CircleCheck" />
            </el-icon>
            <div class="title-info">
              <h3 class="report-name">{{ report.name }}</h3>
              <div class="report-meta">
                <el-tag :type="getTestTypeTagType(report.testType)" size="small" effect="plain">
                  {{ getTestTypeText(report.testType) }}
                </el-tag>
                <span class="meta-item">
                  <el-icon><Document /></el-icon>
                  {{ report.taskName }}
                </span>
              </div>
            </div>
          </div>
          <div class="report-actions">
            <el-button size="small" :icon="View" @click="viewReportDetail(report)">查看详情</el-button>
            <el-button size="small" :icon="Download" @click="exportReport(report)">导出</el-button>
          </div>
        </div>

        <div class="report-body">
          <!-- 客观题统计 -->
          <template v-if="report.testType === 'objective'">
            <div class="stat-row">
              <div class="stat-item">
                <span class="stat-label">总用例</span>
                <span class="stat-value">{{ report.totalCases }}</span>
              </div>
              <div class="stat-item success">
                <span class="stat-label">通过</span>
                <span class="stat-value">{{ report.passedCases }}</span>
              </div>
              <div class="stat-item danger">
                <span class="stat-label">失败</span>
                <span class="stat-value">{{ report.failedCases }}</span>
              </div>
              <div class="stat-item highlight">
                <span class="stat-label">通过率</span>
                <span class="stat-value" :style="{ color: getPassRateColor(report.passRate) }">
                  {{ report.passRate }}%
                </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均响应</span>
                <span class="stat-value">{{ report.avgResponseTime }}ms</span>
              </div>
            </div>
            <div class="progress-bar">
              <el-progress
                :percentage="report.passRate"
                :stroke-width="8"
                :color="getPassRateColor(report.passRate)"
              />
            </div>
          </template>

          <!-- 主观题统计 -->
          <template v-else>
            <div class="stat-row">
              <div class="stat-item">
                <span class="stat-label">总用例</span>
                <span class="stat-value">{{ report.totalCases }}</span>
              </div>
              <div class="stat-item primary">
                <span class="stat-label">已评估</span>
                <span class="stat-value">{{ report.evaluatedCases }}</span>
              </div>
              <div class="stat-item warning">
                <span class="stat-label">待评估</span>
                <span class="stat-value">{{ report.pendingCases }}</span>
              </div>
              <div class="stat-item highlight">
                <span class="stat-label">平均评分</span>
                <span class="stat-value" :style="{ color: getScoreLevel(report.avgScore).color }">
                  {{ report.avgScore }}
                  <span class="score-level">({{ getScoreLevel(report.avgScore).text }})</span>
                </span>
              </div>
            </div>
            <div class="score-distribution">
              <span class="dist-item excellent">优秀 {{ report.scoreDistribution.excellent }}</span>
              <span class="dist-item good">良好 {{ report.scoreDistribution.good }}</span>
              <span class="dist-item medium">中等 {{ report.scoreDistribution.medium }}</span>
              <span class="dist-item poor">较差 {{ report.scoreDistribution.poor }}</span>
            </div>
          </template>
        </div>

        <div class="report-footer">
          <div class="footer-info">
            <span class="info-item">
              <el-icon><User /></el-icon>
              {{ report.executor }}
            </span>
            <span class="info-divider">|</span>
            <span class="info-item">
              <el-icon><Calendar /></el-icon>
              {{ report.createdAt }}
            </span>
            <span class="info-divider">|</span>
            <span class="info-item">
              <el-icon><Timer /></el-icon>
              耗时 {{ report.duration }}
            </span>
          </div>
          <div class="environment-tag">
            {{ report.environment }}
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 空状态 -->
    <el-empty v-if="total === 0" description="暂无测试报告" />
  </div>
</template>

<style scoped>
.report-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.report-count {
  font-size: 14px;
  color: #909399;
}

/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.objective {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.stat-icon.subjective {
  background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
}

.stat-icon.trend {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.stat-sub {
  font-size: 12px;
  color: #67c23a;
  margin-top: 2px;
}

.stat-sub.trend-up {
  color: #67c23a;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

/* 报告列表 */
.report-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report-card {
  border-radius: 8px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.report-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.report-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
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

.title-info {
  flex: 1;
}

.report-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.report-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.report-actions {
  display: flex;
  gap: 8px;
}

/* 报告主体 */
.report-body {
  margin-bottom: 16px;
}

.stat-row {
  display: flex;
  gap: 32px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-item .stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-item .stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stat-item.success .stat-value {
  color: #67c23a;
}

.stat-item.danger .stat-value {
  color: #f56c6c;
}

.stat-item.primary .stat-value {
  color: #409eff;
}

.stat-item.warning .stat-value {
  color: #e6a23c;
}

.stat-item.highlight .stat-value {
  font-size: 20px;
}

.score-level {
  font-size: 12px;
  font-weight: normal;
}

.progress-bar {
  padding: 0 16px;
}

.score-distribution {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
}

.dist-item {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.dist-item.excellent {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.dist-item.good {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.dist-item.medium {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.dist-item.poor {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

/* 报告底部 */
.report-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-divider {
  color: #dcdfe6;
}

.environment-tag {
  font-size: 12px;
  padding: 4px 10px;
  background: #f4f4f5;
  border-radius: 4px;
  color: #606266;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}
</style>
