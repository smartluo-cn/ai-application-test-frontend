<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Close,
  SwitchFilled,
} from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:visible', 'submit'])

// 表单数据
const formData = ref({
  // 基本信息
  projectType: 'delivery', // delivery 或 temporary
  projectCode: '',
  projectName: '',
  solutionType: '',
  startDate: '',
  endDate: '',
  // 伙伴信息
  companyName: '',
  partnerProductName: '',
  // 项目责任人
  account: 'luojiaxing 00123456',
  responsibleName: '',
  email: '',
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

// 关闭弹窗
const handleClose = () => {
  emit('update:visible', false)
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
    emit('submit', formData.value)
    ElMessage.success('项目创建成功')
    handleClose()
  } catch {
    ElMessage.warning('请完善必填信息')
  }
}

// 取消
const handleCancel = () => {
  handleClose()
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="创建项目"
    width="680px"
    :close-on-click-modal="false"
    class="create-project-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
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
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.create-project-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid #e8e8e8;
  padding: 16px 20px;
  margin-right: 0;
}

.create-project-dialog :deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.create-project-dialog :deep(.el-dialog__body) {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.create-project-dialog :deep(.el-dialog__footer) {
  border-top: 1px solid #e8e8e8;
  padding: 16px 20px;
}

.project-form {
  width: 100%;
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #e8e8e8;
}

.form-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 8px;
}

.title-text {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  position: relative;
  padding-left: 10px;
}

.title-text::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
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
  gap: 12px;
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
  gap: 12px;
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
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  font-size: 14px;
  color: #333;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  border-radius: 6px;
}

:deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #f5f5f5;
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .el-button {
  min-width: 80px;
  border-radius: 6px;
}

.dialog-footer .el-button--primary {
  background: #e63946;
  border-color: #e63946;
}

.dialog-footer .el-button--primary:hover {
  background: #d62839;
  border-color: #d62839;
}
</style>
