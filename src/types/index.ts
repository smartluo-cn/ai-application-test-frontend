// 任务状态
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

// 任务类型
export interface Task {
  id: string
  name: string
  status: TaskStatus
  progress: number
  createdAt: string
  updatedAt: string
  description?: string
}

// 统计卡片数据
export interface StatData {
  title: string
  value: number
  icon: string
  color: string
}

// 菜单项
export interface MenuItem {
  index: string
  title: string
  icon: string
  route: string
}

// 快捷操作
export interface QuickAction {
  label: string
  icon: string
  route?: string
  action?: () => void
}

// 测评集
export interface Dataset {
  id: string
  name: string
  icon: string
  iconType: 'preset' | 'custom'
  customIconUrl?: string
  tags: string[]
  description: string
  dataCount: number
  createdAt: string
  updatedAt: string
}
