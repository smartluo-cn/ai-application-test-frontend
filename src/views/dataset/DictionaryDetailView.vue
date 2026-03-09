<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Collection,
  Calendar,
  Edit,
  Delete,
  Link,
  FolderOpened,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 数据字典数据
const dictionary = ref(null)

// 关联的测评集列表
const linkedDatasets = ref([])

// 模拟所有测评集数据
const allDatasets = ref([
  {
    id: '1',
    name: '通用对话测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    testType: 'objective',
    tags: ['对话', '通用'],
    description: '包含多轮对话、常识问答等通用场景的测试数据',
    dataCount: 256,
    dictionaryId: 'dict-1',
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
  {
    id: '9',
    name: '情感分析测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    testType: 'objective',
    tags: ['情感', 'NLP'],
    description: '包含文本情感分类、情绪识别等任务',
    dataCount: 200,
    dictionaryId: 'dict-5',
    createdAt: '2024-02-17',
    updatedAt: '2024-02-26',
  },
  {
    id: '10',
    name: '文本摘要测评集',
    icon: 'Document',
    iconType: 'preset',
    testType: 'subjective',
    tags: ['摘要', '生成'],
    description: '包含新闻摘要、论文摘要等任务',
    dataCount: 156,
    dictionaryId: 'dict-3',
    createdAt: '2024-02-18',
    updatedAt: '2024-02-26',
  },
  {
    id: '12',
    name: 'SQL生成测评集',
    icon: 'Cpu',
    iconType: 'preset',
    testType: 'objective',
    tags: ['SQL', '数据库'],
    description: '包含自然语言转SQL的任务',
    dataCount: 120,
    dictionaryId: 'dict-2',
    createdAt: '2024-02-20',
    updatedAt: '2024-02-26',
  },
  {
    id: '13',
    name: '文本分类测评集',
    icon: 'ChatDotRound',
    iconType: 'preset',
    testType: 'objective',
    tags: ['分类', 'NLP'],
    description: '包含新闻分类、意图识别等任务',
    dataCount: 280,
    dictionaryId: 'dict-1',
    createdAt: '2024-02-21',
    updatedAt: '2024-02-26',
  },
])

// 模拟数据字典数据
const mockDictionaries = {
  'dict-1': {
    id: 'dict-1',
    name: '通用对话测试',
    description: '用于测试模型的基础对话能力，包含多轮对话、意图识别等测试场景',
    columns: [
      { key: 'id', label: 'ID', type: 'string', description: '唯一标识符' },
      { key: 'input', label: '输入', type: 'string', description: '用户输入内容' },
      { key: 'expectedOutput', label: '期望输出', type: 'string', description: '期望的模型输出' },
      { key: 'category', label: '分类', type: 'enum', enumOptions: ['问候', '询问', '建议', '闲聊', '投诉', '咨询'], description: '对话分类' },
      { key: 'difficulty', label: '难度', type: 'enum', enumOptions: ['简单', '中等', '困难'], description: '测试难度等级' },
    ],
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
  },
  'dict-2': {
    id: 'dict-2',
    name: '代码生成测试',
    description: '用于测试模型的代码生成能力',
    columns: [
      { key: 'id', label: 'ID', type: 'string', description: '唯一标识符' },
      { key: 'prompt', label: '提示词', type: 'string', description: '代码生成提示' },
      { key: 'expectedCode', label: '期望代码', type: 'string', description: '期望生成的代码' },
      { key: 'language', label: '编程语言', type: 'enum', enumOptions: ['Python', 'JavaScript', 'Java', 'C++', 'Go'], description: '目标编程语言' },
    ],
    createdAt: '2024-02-01',
    updatedAt: '2024-02-15',
  },
  'dict-3': {
    id: 'dict-3',
    name: '文本摘要测试',
    description: '用于测试模型的文本摘要能力',
    columns: [
      { key: 'id', label: 'ID', type: 'string', description: '唯一标识符' },
      { key: 'originalText', label: '原文', type: 'string', description: '待摘要的原文' },
      { key: 'expectedSummary', label: '期望摘要', type: 'string', description: '期望的摘要内容' },
      { key: 'length', label: '摘要长度', type: 'enum', enumOptions: ['短', '中', '长'], description: '目标摘要长度' },
    ],
    createdAt: '2024-02-25',
    updatedAt: '2024-02-26',
  },
  'dict-4': {
    id: 'dict-4',
    name: '阅读理解测试',
    description: '用于测试模型的阅读理解和信息提取能力',
    columns: [
      { key: 'id', label: 'ID', type: 'string', description: '唯一标识符' },
      { key: 'context', label: '上下文', type: 'string', description: '阅读材料' },
      { key: 'question', label: '问题', type: 'string', description: '待回答的问题' },
      { key: 'expectedAnswer', label: '期望答案', type: 'string', description: '期望的答案' },
    ],
    createdAt: '2024-02-19',
    updatedAt: '2024-02-26',
  },
  'dict-5': {
    id: 'dict-5',
    name: '情感分析测试',
    description: '用于测试模型的情感分析能力',
    columns: [
      { key: 'id', label: 'ID', type: 'string', description: '唯一标识符' },
      { key: 'text', label: '文本', type: 'string', description: '待分析文本' },
      { key: 'expectedSentiment', label: '期望情感', type: 'enum', enumOptions: ['正面', '负面', '中性'], description: '期望的情感分类' },
    ],
    createdAt: '2024-02-17',
    updatedAt: '2024-02-26',
  },
}

// 加载数据字典数据
const loadDictionary = () => {
  const id = route.params.id
  dictionary.value = mockDictionaries[id] || null

  if (dictionary.value) {
    // 加载关联的测评集
    linkedDatasets.value = allDatasets.value.filter(
      (d) => d.dictionaryId === dictionary.value.id
    )
  }
}

// 返回列表
const goBack = () => {
  router.push('/dataset')
}

// 跳转到测评集详情
const goToDatasetDetail = (datasetId) => {
  router.push(`/dataset/${datasetId}`)
}

// 获取字段类型标签类型
const getFieldTypeTagType = (type) => {
  const typeMap = {
    string: '',
    number: 'success',
    boolean: 'warning',
    enum: 'info',
  }
  return typeMap[type] || ''
}

// 获取字段类型文本
const getFieldTypeText = (type) => {
  const typeMap = {
    string: '字符串',
    number: '数字',
    boolean: '布尔值',
    enum: '枚举',
  }
  return typeMap[type] || type
}

// 编辑数据字典
const handleEdit = () => {
  ElMessage.info('编辑功能开发中')
}

// 删除数据字典
const handleDelete = () => {
  if (linkedDatasets.value.length > 0) {
    ElMessage.warning(`该字典已被 ${linkedDatasets.value.length} 个测评集关联，无法删除`)
    return
  }

  ElMessageBox.confirm('确定要删除该数据字典吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    ElMessage.success('删除成功')
    goBack()
  })
}

onMounted(() => {
  loadDictionary()
})
</script>

<template>
  <div class="dictionary-detail-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="goBack" circle />
        <div class="header-info" v-if="dictionary">
          <h2>{{ dictionary.name }}</h2>
          <div class="header-meta">
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              创建于 {{ dictionary.createdAt }}
            </span>
            <span class="meta-item">
              <el-icon><Collection /></el-icon>
              {{ dictionary.columns.length }} 个字段
            </span>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button :icon="Edit" @click="handleEdit">编辑</el-button>
        <el-button :icon="Delete" type="danger" @click="handleDelete">删除</el-button>
      </div>
    </div>

    <!-- 数据字典信息卡片 -->
    <el-card class="info-card" v-if="dictionary">
      <div class="info-content">
        <div class="info-icon">
          <el-icon :size="48"><Collection /></el-icon>
        </div>
        <div class="info-details">
          <div class="info-row">
            <span class="info-label">描述：</span>
            <span class="info-value">{{ dictionary.description }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">更新时间：</span>
            <span class="info-value">{{ dictionary.updatedAt }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 字段定义 -->
    <el-card class="fields-card" v-if="dictionary">
      <template #header>
        <div class="card-header">
          <span class="card-title">字段定义</span>
          <el-tag type="info" size="small">{{ dictionary.columns.length }} 个字段</el-tag>
        </div>
      </template>

      <el-table :data="dictionary.columns" style="width: 100%" border>
        <el-table-column prop="key" label="字段ID" width="150">
          <template #default="{ row }">
            <code class="field-key">{{ row.key }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="label" label="字段名称" width="120" />
        <el-table-column prop="type" label="字段类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getFieldTypeTagType(row.type)" size="small">
              {{ getFieldTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enumOptions" label="枚举选项" min-width="200">
          <template #default="{ row }">
            <template v-if="row.type === 'enum' && row.enumOptions">
              <el-tag
                v-for="option in row.enumOptions"
                :key="option"
                size="small"
                type="info"
                effect="plain"
                style="margin-right: 4px; margin-bottom: 4px"
              >
                {{ option }}
              </el-tag>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="150">
          <template #default="{ row }">
            <span class="field-desc">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 关联的测评集 -->
    <el-card class="linked-card" v-if="dictionary">
      <template #header>
        <div class="card-header">
          <div class="card-title-wrapper">
            <span class="card-title">关联的测评集</span>
            <el-tag type="primary" size="small" effect="plain">
              {{ linkedDatasets.length }} 个
            </el-tag>
          </div>
        </div>
      </template>

      <div v-if="linkedDatasets.length > 0" class="linked-datasets">
        <div
          v-for="dataset in linkedDatasets"
          :key="dataset.id"
          class="linked-dataset-item"
          @click="goToDatasetDetail(dataset.id)"
        >
          <div class="dataset-icon">
            <el-icon :size="24"><FolderOpened /></el-icon>
          </div>
          <div class="dataset-info">
            <div class="dataset-name">{{ dataset.name }}</div>
            <div class="dataset-meta">
              <span>{{ dataset.dataCount }} 条数据</span>
              <span class="separator">·</span>
              <span>{{ dataset.testType === 'subjective' ? '主观题' : '客观题' }}</span>
            </div>
          </div>
          <div class="dataset-arrow">
            <el-icon><Link /></el-icon>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无关联的测评集" :image-size="80" />
    </el-card>
  </div>
</template>

<style scoped>
.dictionary-detail-page {
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

.header-actions {
  display: flex;
  gap: 8px;
}

.info-card {
  margin-bottom: 24px;
}

.info-content {
  display: flex;
  gap: 24px;
}

.info-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: #fff;
  flex-shrink: 0;
}

.info-details {
  flex: 1;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 80px;
  flex-shrink: 0;
  font-size: 14px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.fields-card,
.linked-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.field-key {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  color: #606266;
}

.text-muted {
  color: #c0c4cc;
}

.field-desc {
  font-size: 13px;
  color: #909399;
}

.linked-datasets {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.linked-dataset-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.linked-dataset-item:hover {
  background: #f0f4ff;
  border-color: #409eff;
}

.dataset-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: #fff;
  flex-shrink: 0;
}

.dataset-info {
  flex: 1;
}

.dataset-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.dataset-meta {
  font-size: 13px;
  color: #909399;
}

.separator {
  margin: 0 8px;
}

.dataset-arrow {
  color: #909399;
  transition: transform 0.2s ease;
}

.linked-dataset-item:hover .dataset-arrow {
  color: #409eff;
  transform: translateX(4px);
}
</style>
