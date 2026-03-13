<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

import {
  Plus,
  VideoPlay,
  VideoPause,
  Delete,
  Refresh,
  Search,
  Setting,
  Document,
  Timer,
  CircleCheck,
  CircleClose,
  Warning,
  More,
  CopyDocument,
  View,
  Stopwatch,
  DataAnalysis,
  Edit,
} from '@element-plus/icons-vue'

// 搜索关键词
const searchKeyword = ref('')

// 状态筛选
const selectedStatus = ref('all')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 测试任务列表
const tasks = ref([
  {
    id: 'task-1',
    name: '智能客服系统 - 意图识别测试',
    environment: '智能客服系统',
    environmentId: '1',
    dataset: '客服对话数据集 v2.0',
    datasetId: 'ds-1',
    status: 'running',
    progress: 65,
    totalCases: 500,
    completedCases: 325,
    passedCases: 310,
    failedCases: 15,
    startTime: '2024-03-01 14:30:00',
    endTime: null,
    duration: '00:32:15',
    executor: '张三',
  },
  {
    id: 'task-2',
    name: '文档问答系统 - RAG检索测试',
    environment: '文档问答系统',
    environmentId: '2',
    dataset: '文档问答测试集',
    datasetId: 'ds-2',
    status: 'completed',
    progress: 100,
    totalCases: 200,
    completedCases: 200,
    passedCases: 185,
    failedCases: 15,
    startTime: '2024-03-01 10:00:00',
    endTime: '2024-03-01 10:45:30',
    duration: '00:45:30',
    executor: '李四',
  },
  {
    id: 'task-3',
    name: '智能写作助手 - 创意文本生成测试',
    environment: '智能写作助手',
    environmentId: '4',
    dataset: '创意写作数据集',
    datasetId: 'ds-6',
    status: 'running',
    progress: 40,
    totalCases: 100,
    completedCases: 40,
    passedCases: 35,
    failedCases: 5,
    startTime: '2024-03-01 15:00:00',
    endTime: null,
    duration: '00:18:30',
    executor: '王五',
  },
  {
    id: 'task-4',
    name: '智能客服系统 - 多轮对话测试',
    environment: '智能客服系统',
    environmentId: '1',
    dataset: '多轮对话测试集',
    datasetId: 'ds-4',
    status: 'completed',
    progress: 100,
    totalCases: 80,
    completedCases: 80,
    passedCases: 75,
    failedCases: 5,
    startTime: '2024-03-01 09:00:00',
    endTime: '2024-03-01 09:30:00',
    duration: '00:30:00',
    executor: '张三',
  },
  {
    id: 'task-5',
    name: '推荐引擎 - 个性化推荐测试',
    environment: '智能推荐引擎',
    environmentId: '3',
    dataset: '用户行为数据集',
    datasetId: 'ds-3',
    status: 'failed',
    progress: 42,
    totalCases: 300,
    completedCases: 126,
    passedCases: 100,
    failedCases: 26,
    startTime: '2024-03-01 09:15:00',
    endTime: '2024-03-01 09:28:45',
    duration: '00:13:45',
    executor: '王五',
    errorMessage: '环境连接超时',
  },
  {
    id: 'task-6',
    name: '智能翻译系统 - 文学翻译质量测试',
    environment: '智能翻译系统',
    environmentId: '5',
    dataset: '文学翻译测试集',
    datasetId: 'ds-7',
    status: 'pending',
    progress: 0,
    totalCases: 50,
    completedCases: 0,
    passedCases: 0,
    failedCases: 0,
    startTime: null,
    endTime: null,
    duration: '-',
    executor: '李四',
  },
])

// 状态选项
const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '等待执行' },
  { value: 'running', label: '执行中' },
  { value: 'paused', label: '已暂停' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '执行失败' },
]

// 新建任务对话框
const dialogVisible = ref(false)
const formRef = ref()
const taskFormData = reactive({
  name: '',
  description: '',
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
}

// 执行详情对话框 - 已改为页面跳转

// 过滤后的任务列表
const filteredTasks = computed(() => {
  let result = tasks.value

  // 状态筛选
  if (selectedStatus.value !== 'all') {
    result = result.filter(t => t.status === selectedStatus.value)
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(t =>
      t.name.toLowerCase().includes(keyword) ||
      t.environment.toLowerCase().includes(keyword) ||
      t.dataset.toLowerCase().includes(keyword)
    )
  }

  return result
})

// 分页后的任务列表
const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTasks.value.slice(start, start + pageSize.value)
})

// 任务总数
const total = computed(() => filteredTasks.value.length)

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    pending: 'info',
    running: 'primary',
    paused: 'warning',
    completed: 'success',
    failed: 'danger',
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '等待执行',
    running: '执行中',
    paused: '已暂停',
    completed: '已完成',
    failed: '执行失败',
  }
  return texts[status] || status
}

// 获取状态图标
const getStatusIcon = (status) => {
  const icons = {
    pending: Stopwatch,
    running: VideoPlay,
    paused: VideoPause,
    completed: CircleCheck,
    failed: CircleClose,
  }
  return icons[status] || Stopwatch
}

// 获取日志级别类型
const getLogLevelType = (level) => {
  const types = {
    info: '',
    success: 'success',
    warning: 'warning',
    error: 'danger',
  }
  return types[level] || ''
}

// 打开新建任务对话框
const openCreateDialog = () => {
  taskFormData.name = ''
  taskFormData.description = ''
  dialogVisible.value = true
}

// 提交新建任务
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      const newTask = {
        id: `task-${Date.now()}`,
        name: taskFormData.name,
        description: taskFormData.description,
        environment: '',
        environmentId: '',
        dataset: '',
        datasetId: '',
        status: 'pending',
        progress: 0,
        totalCases: 0,
        completedCases: 0,
        passedCases: 0,
        failedCases: 0,
        startTime: null,
        endTime: null,
        duration: '-',
        executor: '当前用户',
      }

      tasks.value.unshift(newTask)
      ElMessage.success('任务创建成功，请在详情页完成配置')
      dialogVisible.value = false

      // 跳转到任务详情页进行配置
      router.push({ name: 'execution-detail', params: { id: newTask.id } })
    }
  })
}

// 启动任务
const startTask = (task) => {
  if (task.status === 'running') return

  task.status = 'running'
  task.startTime = task.startTime || new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).replace(/\//g, '-')
  ElMessage.success(`任务「${task.name}」已开始执行`)
}

// 暂停任务
const pauseTask = (task) => {
  if (task.status !== 'running') return
  task.status = 'paused'
  ElMessage.warning(`任务「${task.name}」已暂停`)
}

// 停止任务
const stopTask = (task) => {
  ElMessageBox.confirm(`确定要停止任务「${task.name}」吗？`, '停止确认', {
    confirmButtonText: '确定停止',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    task.status = 'failed'
    task.endTime = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(/\//g, '-')
    ElMessage.success(`任务「${task.name}」已停止`)
  })
}

// 重新执行
const retryTask = (task) => {
  task.status = 'pending'
  task.progress = 0
  task.completedCases = 0
  task.passedCases = 0
  task.failedCases = 0
  task.startTime = null
  task.endTime = null
  task.duration = '-'
  ElMessage.success(`任务「${task.name}」已重置，可重新执行`)
}

// 删除任务
const deleteTask = (task) => {
  ElMessageBox.confirm(`确定要删除任务「${task.name}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const index = tasks.value.findIndex(t => t.id === task.id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 查看详情
const viewDetail = (task) => {
  router.push({ name: 'execution-detail', params: { id: task.id } })
}

// 复制任务
const copyTask = (task) => {
  const newTask = {
    ...task,
    id: `task-${Date.now()}`,
    name: `${task.name} (副本)`,
    status: 'pending',
    progress: 0,
    completedCases: 0,
    passedCases: 0,
    failedCases: 0,
    startTime: null,
    endTime: null,
    duration: '-',
  }
  tasks.value.unshift(newTask)
  ElMessage.success('任务已复制')
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
  <div class="execution-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>任务管理</h2>
        <span class="task-count">共 {{ tasks.length }} 个任务</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建任务</el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon running">
          <el-icon><VideoPlay /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ tasks.filter(t => t.status === 'running').length }}</div>
          <div class="stat-label">执行中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pending">
          <el-icon><Stopwatch /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ tasks.filter(t => t.status === 'pending').length }}</div>
          <div class="stat-label">等待执行</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completed">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ tasks.filter(t => t.status === 'completed').length }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon failed">
          <el-icon><CircleClose /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ tasks.filter(t => t.status === 'failed').length }}</div>
          <div class="stat-label">执行失败</div>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索任务名称、环境或数据集"
        :prefix-icon="Search"
        clearable
        style="width: 300px"
        @input="handleSearch"
      />
      <el-select v-model="selectedStatus" placeholder="状态筛选" style="width: 140px" @change="handleSearch">
        <el-option
          v-for="status in statusOptions"
          :key="status.value"
          :label="status.label"
          :value="status.value"
        />
      </el-select>
    </div>

    <!-- 任务列表 -->
    <div class="task-list" v-if="total > 0">
      <el-card v-for="task in paginatedTasks" :key="task.id" class="task-card" shadow="hover">
        <div class="task-header">
          <div class="task-title">
            <el-icon class="status-icon" :class="task.status">
              <component :is="getStatusIcon(task.status)" />
            </el-icon>
            <h3 class="task-name">{{ task.name }}</h3>
            <el-tag :type="getStatusType(task.status)" size="small">
              {{ getStatusText(task.status) }}
            </el-tag>
          </div>
          <div class="task-actions">
            <template v-if="task.status === 'pending'">
              <el-button type="primary" size="small" :icon="VideoPlay" @click="startTask(task)">启动</el-button>
            </template>
            <template v-if="task.status === 'running'">
              <el-button size="small" :icon="VideoPause" @click="pauseTask(task)">暂停</el-button>
              <el-button size="small" type="danger" @click="stopTask(task)">停止</el-button>
            </template>
            <template v-if="task.status === 'paused'">
              <el-button type="primary" size="small" :icon="VideoPlay" @click="startTask(task)">继续</el-button>
              <el-button size="small" type="danger" @click="stopTask(task)">停止</el-button>
            </template>
            <template v-if="task.status === 'completed' || task.status === 'failed'">
              <el-button size="small" :icon="Refresh" @click="retryTask(task)">重新执行</el-button>
            </template>
            <el-button size="small" :icon="View" @click="viewDetail(task)">详情</el-button>
            <el-dropdown trigger="click" @click.stop>
              <el-button size="small" :icon="More" circle />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="copyTask(task)">
                    <el-icon><CopyDocument /></el-icon>
                    复制任务
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="deleteTask(task)">
                    <span style="color: #f56c6c">
                      <el-icon><Delete /></el-icon>
                      删除
                    </span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="task-info">
          <div class="info-item">
            <el-icon><Setting /></el-icon>
            <span class="info-label">环境：</span>
            <span class="info-value">{{ task.environment }}</span>
          </div>
          <div class="info-item">
            <el-icon><Document /></el-icon>
            <span class="info-label">数据集：</span>
            <span class="info-value">{{ task.dataset }}</span>
          </div>
          <div class="info-item">
            <el-icon><Timer /></el-icon>
            <span class="info-label">时长：</span>
            <span class="info-value">{{ task.duration }}</span>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="task-progress" v-if="task.status === 'running' || task.status === 'paused'">
          <el-progress
            :percentage="task.progress"
            :status="task.status === 'paused' ? 'warning' : ''"
            :stroke-width="8"
          />
          <div class="progress-info">
            <span>{{ task.completedCases }} / {{ task.totalCases }} 用例</span>
            <span>
              <el-icon style="color: #67c23a"><CircleCheck /></el-icon>
              {{ task.passedCases }}
              <el-icon style="color: #f56c6c; margin-left: 8px"><CircleClose /></el-icon>
              {{ task.failedCases }}
            </span>
          </div>
        </div>

        <!-- 完成统计 -->
        <div class="task-result" v-if="task.status === 'completed' || task.status === 'failed'">
          <div class="result-item">
            <span class="result-label">总计</span>
            <span class="result-value">{{ task.totalCases }}</span>
          </div>
          <div class="result-item success">
            <span class="result-label">通过</span>
            <span class="result-value">{{ task.passedCases }}</span>
          </div>
          <div class="result-item danger">
            <span class="result-label">失败</span>
            <span class="result-value">{{ task.failedCases }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">通过率</span>
            <span class="result-value">{{ task.completedCases > 0 ? Math.round(task.passedCases / task.completedCases * 100) : 0 }}%</span>
          </div>
        </div>

        <div class="task-footer">
          <div class="footer-info">
            <span>执行人：{{ task.executor }}</span>
            <span class="footer-divider">|</span>
            <span>开始：{{ task.startTime || '-' }}</span>
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
    <el-empty v-if="total === 0" description="暂无任务，点击上方按钮创建" />

    <!-- 新建任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新建任务"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="taskFormData"
        :rules="formRules"
        label-width="80px"
        label-position="left"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskFormData.name" placeholder="请输入任务名称" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="任务描述">
          <el-input v-model="taskFormData.description" type="textarea" :rows="4" placeholder="请输入任务描述（可选）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">创建并配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.execution-page {
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

.task-count {
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

.stat-icon.running {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #909399 0%, #b4b4b4 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.stat-icon.failed {
  background: linear-gradient(135deg, #f56c6c 0%, #f89898 100%);
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

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

/* 任务列表 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card {
  border-radius: 8px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-icon {
  font-size: 20px;
}

.status-icon.running {
  color: #409eff;
  animation: pulse 1.5s infinite;
}

.status-icon.paused {
  color: #e6a23c;
}

.status-icon.completed {
  color: #67c23a;
}

.status-icon.failed {
  color: #f56c6c;
}

.status-icon.pending {
  color: #909399;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.task-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.task-actions {
  display: flex;
  gap: 8px;
}

/* 任务信息 */
.task-info {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.info-item .el-icon {
  color: #909399;
}

.info-label {
  color: #909399;
}

/* 进度信息 */
.task-progress {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.progress-info .el-icon {
  vertical-align: middle;
}

/* 结果统计 */
.task-result {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.result-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.result-label {
  font-size: 12px;
  color: #909399;
}

.result-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.result-item.success .result-value {
  color: #67c23a;
}

.result-item.danger .result-value {
  color: #f56c6c;
}

.result-item.primary .result-value {
  color: #409eff;
}

.result-item.warning .result-value {
  color: #e6a23c;
}

/* 任务底部 */
.task-footer {
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.footer-info {
  font-size: 12px;
  color: #909399;
}

.footer-divider {
  margin: 0 8px;
  color: #dcdfe6;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}
</style>
