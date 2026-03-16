<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Bell,
  ArrowDown,
  UserFilled,
} from '@element-plus/icons-vue'

const router = useRouter()

// 顶部菜单项
const menuItems = [
  { label: '首页', path: '/', active: false },
  { label: '集成验证', path: '/integration', active: true },
  { label: '方案体验', path: '/experience', active: false },
  { label: '在线实训', path: '/training', active: false },
]

// 获取默认日期（今天和明天）
const getDefaultDates = () => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return {
    startDate: formatDate(today),
    endDate: formatDate(tomorrow),
  }
}

const defaultDates = getDefaultDates()

// 表单数据（默认填充测试数据）
const formData = ref({
  // 基本信息
  projectType: 'temporary', // 默认选择临时项目
  projectCode: '',
  projectName: 'test_project', // 默认项目名称
  solutionType: 'ai_test', // 默认选择AI应用测试
  startDate: defaultDates.startDate, // 默认今天
  endDate: defaultDates.endDate, // 默认明天
  // 伙伴信息
  companyName: '',
  partnerProductName: '',
  // 项目责任人
  account: 'luojiaxing 00123456',
  responsibleName: 'luojiaxing', // 默认姓名
  email: 'luojiaxing@123.com', // 默认邮箱
  phone: '',
})

// 交付项目编码选项
const projectCodeOptions = [
  { value: 'PRJ-2024-001', label: 'PRJ-2024-001' },
  { value: 'PRJ-2024-002', label: 'PRJ-2024-002' },
  { value: 'PRJ-2024-003', label: 'PRJ-2024-003' },
  { value: 'PRJ-2024-004', label: 'PRJ-2024-004' },
]

// 方案选项
const solutionOptions = [
  { value: 'ai_test', label: 'AI应用测试' },
  { value: 'computing', label: '算力平台' },
]

// 是否为交付项目
const isDeliveryProject = computed(() => formData.value.projectType === 'delivery')

// 表单引用
const formRef = ref(null)

// 表单校验规则
const rules = {
  projectName: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
  ],
  solutionType: [
    { required: true, message: '请选择方案', trigger: 'change' },
  ],
  startDate: [
    { required: true, message: '请选择项目开始时间', trigger: 'change' },
  ],
  endDate: [
    { required: true, message: '请选择项目结束时间', trigger: 'change' },
  ],
  responsibleName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
}

// 交付项目编码校验（仅交付项目需要）
const projectCodeRules = computed(() =>
  isDeliveryProject.value
    ? [{ required: true, message: '请选择交付项目编码', trigger: 'change' }]
    : []
)

// 菜单点击
const handleMenuClick = (item) => {
  if (item.path) {
    router.push(item.path)
  }
}

// 切换项目类型
const handleProjectTypeChange = (value) => {
  formData.value.projectType = value
  if (value === 'temporary') {
    formData.value.projectCode = ''
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    // TODO: 调用API创建项目
    console.log('提交项目数据:', formData.value)
    ElMessage.success('项目创建成功')

    // 根据方案类型跳转到不同页面
    if (formData.value.solutionType === 'ai_test') {
      // AI应用测试 - 跳转到新建工作流的编排页面
      // TODO: 后端返回新创建的工作流 ID，这里暂时使用时间戳模拟
      const newWorkflowId = `workflow_${Date.now()}`
      // 通过 query 参数传递项目名称
      router.push({
        path: `/workflow/${newWorkflowId}`,
        query: { projectName: formData.value.projectName },
      })
    } else {
      // 其他方案 - 跳转回集成验证页面
      router.push('/integration')
    }
  } catch {
    ElMessage.warning('请完善必填信息')
  }
}

// 取消
const handleCancel = () => {
  router.back()
}

// 用户下拉菜单命令
const handleUserCommand = (command) => {
  if (command === 'logout') {
    ElMessage.info('退出登录')
  } else {
    ElMessage.info(`跳转到${command}`)
  }
}
</script>

<template>
  <div class="create-project-page">
    <!-- 顶部导航栏 -->
    <header class="top-header">
      <div class="header-content">
        <!-- 左侧 Logo 和菜单 -->
        <div class="header-left">
          <div class="logo-section">
            <img src="@/assets/logo.png" alt="Logo" class="logo-image" />
          </div>
          <!-- 菜单项 -->
          <nav class="header-menu">
            <div
              v-for="item in menuItems"
              :key="item.label"
              class="menu-item"
              :class="{ active: item.active }"
              @click="handleMenuClick(item)"
            >
              {{ item.label }}
            </div>
          </nav>
        </div>

        <!-- 右侧功能区 -->
        <div class="header-right">
          <div class="header-action">
            <span class="lang-switch">EN</span>
          </div>
          <div class="header-action">
            <el-icon :size="18"><Bell /></el-icon>
          </div>
          <div class="header-action">
            <span>帮助</span>
          </div>
          <el-dropdown trigger="hover" @command="handleUserCommand">
            <div class="header-action user-dropdown">
              <el-icon :size="18"><UserFilled /></el-icon>
              <span>17721884685</span>
              <el-icon :size="12"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="training">我的实训</el-dropdown-item>
                <el-dropdown-item command="projects">我的项目</el-dropdown-item>
                <el-dropdown-item command="tickets">我的工单</el-dropdown-item>
                <el-dropdown-item command="todos">我的代办</el-dropdown-item>
                <el-dropdown-item command="account">我的账号</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 表单内容区域 -->
    <div class="form-wrapper">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        label-position="left"
        class="project-form"
      >
        <!-- 基本信息区块 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-text">基本信息</span>
            <span class="required-hint">* 全部必填</span>
          </div>

          <!-- 项目类型切换 -->
          <el-form-item label="项目类型">
            <div class="project-type-switch">
              <span
                :class="['type-option', { active: formData.projectType === 'delivery' }]"
                @click="handleProjectTypeChange('delivery')"
              >
                交付项目
              </span>
              <el-switch
                :model-value="formData.projectType === 'temporary'"
                active-color="#e63946"
                @change="(val) => handleProjectTypeChange(val ? 'temporary' : 'delivery')"
              />
              <span
                :class="['type-option', { active: formData.projectType === 'temporary' }]"
                @click="handleProjectTypeChange('temporary')"
              >
                临时项目
              </span>
            </div>
          </el-form-item>

          <!-- 交付项目编码（仅交付项目显示） -->
          <el-form-item
            v-if="isDeliveryProject"
            label="交付项目编码"
            prop="projectCode"
            :rules="projectCodeRules"
          >
            <el-select
              v-model="formData.projectCode"
              placeholder="请选择交付项目编码"
              style="width: 100%"
            >
              <el-option
                v-for="item in projectCodeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <!-- 项目名称 -->
          <el-form-item label="项目名称" prop="projectName">
            <el-input
              v-model="formData.projectName"
              placeholder="请输入项目名称"
              maxlength="100"
            />
          </el-form-item>

          <!-- 方案 -->
          <el-form-item label="方案" prop="solutionType">
            <el-select
              v-model="formData.solutionType"
              placeholder="请选择方案"
              style="width: 100%"
            >
              <el-option
                v-for="item in solutionOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <!-- 项目时间 -->
          <el-form-item label="项目时间" required>
            <div class="date-range">
              <el-form-item prop="startDate" class="date-item">
                <el-date-picker
                  v-model="formData.startDate"
                  type="date"
                  placeholder="开始时间"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
              <span class="date-separator">至</span>
              <el-form-item prop="endDate" class="date-item">
                <el-date-picker
                  v-model="formData.endDate"
                  type="date"
                  placeholder="结束时间"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </div>
          </el-form-item>
        </div>

        <!-- 伙伴信息区块 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-text">伙伴信息</span>
            <span class="optional-hint">全部非必填</span>
          </div>

          <!-- 公司名称 -->
          <el-form-item label="公司名称">
            <el-input
              v-model="formData.companyName"
              placeholder="请输入公司名称"
              maxlength="100"
            />
          </el-form-item>

          <!-- 伙伴产品/方案名称 -->
          <el-form-item label="产品/方案名称">
            <el-input
              v-model="formData.partnerProductName"
              placeholder="请输入伙伴产品/方案名称"
              maxlength="100"
            />
          </el-form-item>
        </div>

        <!-- 项目责任人区块 -->
        <div class="form-section">
          <div class="section-title">
            <span class="title-text">项目责任人</span>
          </div>

          <!-- 账号 -->
          <el-form-item label="账号" required>
            <el-input
              v-model="formData.account"
              disabled
              placeholder="自动回填当前登录账号"
            />
          </el-form-item>

          <!-- 姓名 -->
          <el-form-item label="姓名" prop="responsibleName">
            <el-input
              v-model="formData.responsibleName"
              placeholder="请输入姓名"
              maxlength="50"
            />
          </el-form-item>

          <!-- 邮箱 -->
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="formData.email"
              placeholder="请输入邮箱"
              maxlength="100"
            />
          </el-form-item>

          <!-- 电话 -->
          <el-form-item label="电话">
            <el-input
              v-model="formData.phone"
              placeholder="请输入电话"
              maxlength="20"
            />
          </el-form-item>
        </div>

        <!-- 表单操作按钮 -->
        <div class="form-actions">
          <el-button size="large" @click="handleCancel">取消</el-button>
          <el-button type="primary" size="large" @click="handleSubmit">
            创建
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.create-project-page {
  height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部导航栏 */
.top-header {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-image {
  height: 32px;
  object-fit: contain;
}

.header-menu {
  display: flex;
  align-items: center;
  gap: 32px;
}

.menu-item {
  font-size: 14px;
  color: #333;
  cursor: pointer;
  padding: 8px 0;
  position: relative;
  transition: color 0.3s ease;
}

.menu-item:hover {
  color: #e63946;
}

.menu-item.active {
  color: #e63946;
  font-weight: 500;
}

.menu-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #e63946;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-action {
  font-size: 14px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s ease;
}

.header-action:hover {
  color: #e63946;
}

.user-dropdown {
  gap: 6px;
}

/* 表单容器 */
.form-wrapper {
  flex: 1;
  min-height: 0; /* 关键：允许 flex 子项收缩并启用滚动 */
  overflow-y: auto;
  padding: 24px;
}

.project-form {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* 表单区块 */
.form-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px dashed #e8e8e8;
}

.form-section:last-of-type {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 12px;
}

.title-text {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  position: relative;
  padding-left: 12px;
}

.title-text::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background: #e63946;
  border-radius: 2px;
}

.required-hint {
  font-size: 12px;
  color: #999;
}

.optional-hint {
  font-size: 12px;
  color: #999;
}

/* 项目类型切换样式 */
.project-type-switch {
  display: flex;
  align-items: center;
  gap: 16px;
}

.type-option {
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: color 0.3s ease;
  user-select: none;
}

.type-option:hover {
  color: #e63946;
}

.type-option.active {
  color: #e63946;
  font-weight: 500;
}

/* 日期范围样式 */
.date-range {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
}

.date-item {
  flex: 1;
  margin-bottom: 0;
}

.date-separator {
  color: #999;
  font-size: 14px;
  line-height: 32px;
  flex-shrink: 0;
}

/* 表单项样式 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-size: 14px;
  color: #333;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  border-radius: 8px;
}

:deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #f5f5f5;
}

/* 表单操作按钮 - 水平居中 */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e8e8e8;
}

.form-actions .el-button {
  min-width: 120px;
  border-radius: 8px;
}

.form-actions .el-button--primary {
  background: #409eff;
  border-color: #409eff;
}

.form-actions .el-button--primary:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

/* 响应式 */
@media (max-width: 768px) {
  .header-menu {
    display: none;
  }

  .header-right {
    gap: 16px;
  }

  .form-wrapper {
    padding: 16px;
  }

  .project-form {
    padding: 20px;
  }

  .date-range {
    flex-direction: column;
    gap: 12px;
  }

  .date-separator {
    display: none;
  }

  .form-actions {
    flex-direction: column;
    align-items: center;
  }

  .form-actions .el-button {
    width: 100%;
    max-width: 200px;
  }
}
</style>
