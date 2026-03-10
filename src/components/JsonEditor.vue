<template>
  <div class="json-editor-container">
    <div ref="editorRef" class="json-editor"></div>
    <div v-if="errorMessage" class="json-error">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, shallowRef } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { linter, lintGutter } from '@codemirror/lint'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { WarningFilled } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'error'])

const editorRef = ref(null)
const errorMessage = ref('')
const editorView = shallowRef(null)

// JSON 语法检查
const jsonLinter = linter((view) => {
  const diagnostics = []
  const content = view.state.doc.toString()

  if (!content.trim()) {
    errorMessage.value = ''
    emit('error', null)
    return diagnostics
  }

  try {
    JSON.parse(content)
    errorMessage.value = ''
    emit('error', null)
  } catch (e) {
    const match = e.message.match(/position (\d+)/)
    const position = match ? parseInt(match[1]) : 0

    diagnostics.push({
      from: Math.min(position, view.state.doc.length),
      to: Math.min(position + 1, view.state.doc.length),
      severity: 'error',
      message: e.message,
    })

    errorMessage.value = `JSON 格式错误: ${e.message}`
    emit('error', e.message)
  }

  return diagnostics
})

// 创建编辑器
const createEditor = () => {
  if (!editorRef.value || editorView.value) return

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const content = update.state.doc.toString()
      emit('update:modelValue', content)
    }
  })

  const extensions = [
    basicSetup,
    json(),
    jsonLinter,
    lintGutter(),
    syntaxHighlighting(defaultHighlightStyle),
    EditorView.lineWrapping,
    updateListener,
    EditorState.tabSize.of(2),
  ]

  if (props.readonly) {
    extensions.push(EditorView.editable.of(false))
  }

  const state = EditorState.create({
    doc: props.modelValue || '',
    extensions,
  })

  editorView.value = new EditorView({
    state,
    parent: editorRef.value,
  })
}

// 更新编辑器内容
const updateContent = (newContent) => {
  if (!editorView.value) return

  const currentContent = editorView.value.state.doc.toString()
  if (currentContent !== newContent) {
    editorView.value.dispatch({
      changes: {
        from: 0,
        to: editorView.value.state.doc.length,
        insert: newContent || '',
      },
    })
  }
}

// 格式化 JSON
const formatJson = () => {
  if (!editorView.value) return

  const content = editorView.value.state.doc.toString()
  if (!content.trim()) return

  try {
    const parsed = JSON.parse(content)
    const formatted = JSON.stringify(parsed, null, 2)
    updateContent(formatted)
  } catch {
    // 格式错误时不做处理
  }
}

// 暴露方法给父组件
defineExpose({
  formatJson,
  getContent: () => editorView.value?.state.doc.toString() || '',
})

watch(
  () => props.modelValue,
  (newVal) => {
    updateContent(newVal)
  }
)

onMounted(() => {
  createEditor()
})

onUnmounted(() => {
  if (editorView.value) {
    editorView.value.destroy()
    editorView.value = null
  }
})
</script>

<style scoped>
.json-editor-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.json-editor {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #fafbfc;
  height: 350px;
}

.json-editor :deep(.cm-editor) {
  height: 100%;
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  background: #fafbfc;
}

.json-editor :deep(.cm-scroller) {
  overflow: auto;
  background: #fafbfc;
}

.json-editor :deep(.cm-content) {
  padding: 12px 0;
  caret-color: #1f2937;
  background: #fafbfc;
}

.json-editor :deep(.cm-line) {
  padding: 0 16px;
  color: #1f2937;
}

.json-editor :deep(.cm-selectionBackground) {
  background: rgba(59, 130, 246, 0.2) !important;
}

.json-editor :deep(.cm-activeLine) {
  background: rgba(0, 0, 0, 0.03);
}

.json-editor :deep(.cm-gutters) {
  background: #f3f4f6;
  border-right: 1px solid #e5e7eb;
  color: #9ca3af;
}

.json-editor :deep(.cm-activeLineGutter) {
  background: rgba(0, 0, 0, 0.03);
}

/* JSON 语法高亮颜色 - 浅色主题 */
.json-editor :deep(.cm-property) {
  color: #0369a1;
}

.json-editor :deep(.cm-string) {
  color: #059669;
}

.json-editor :deep(.cm-number) {
  color: #d97706;
}

.json-editor :deep(.cm-bool) {
  color: #7c3aed;
}

.json-editor :deep(.cm-null) {
  color: #dc2626;
}

.json-editor :deep(.cm-punctuation) {
  color: #6b7280;
}

.json-editor :deep(.cm-bracket) {
  color: #6b7280;
}

/* 错误提示样式 */
.json-editor :deep(.cm-lintRange-error) {
  background: rgba(220, 38, 38, 0.1);
  text-decoration: wavy underline #dc2626;
}

.json-editor :deep(.cm-lintPoint-error) {
  background: rgba(220, 38, 38, 0.15);
}

.json-editor :deep(.cm-diagnostic-error) {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
}

.json-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 12px;
}

.json-error .el-icon {
  flex-shrink: 0;
}
</style>
