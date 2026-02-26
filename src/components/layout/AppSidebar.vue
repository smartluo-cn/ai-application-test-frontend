<script setup lang="ts">
import {
  HomeFilled,
  FolderOpened,
  Document,
  Setting,
  Connection,
  VideoPlay,
  DataAnalysis,
  Monitor,
} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuItem } from '@/types'

const route = useRoute()
const router = useRouter()

const menuItems: MenuItem[] = [
  { index: '1', title: '首页', icon: 'HomeFilled', route: '/dashboard' },
  { index: '2', title: '测评集管理', icon: 'FolderOpened', route: '/dataset' },
  { index: '3', title: 'Prompt管理', icon: 'Document', route: '/prompt' },
  { index: '4', title: '环境管理', icon: 'Setting', route: '/environment' },
  { index: '5', title: '插件管理', icon: 'Connection', route: '/plugin' },
  { index: '6', title: '测试执行', icon: 'VideoPlay', route: '/execution' },
  { index: '7', title: '测试结果', icon: 'DataAnalysis', route: '/result' },
]

const iconComponents: Record<string, any> = {
  HomeFilled,
  FolderOpened,
  Document,
  Setting,
  Connection,
  VideoPlay,
  DataAnalysis,
}

const getIcon = (iconName: string) => iconComponents[iconName]

const handleSelect = (index: string) => {
  const item = menuItems.find((m) => m.index === index)
  if (item) {
    router.push(item.route)
  }
}

const activeMenu = () => {
  const item = menuItems.find((m) => m.route === route.path)
  return item ? item.index : '1'
}
</script>

<template>
  <aside class="app-sidebar">
    <div class="logo">
      <el-icon :size="28" color="#409eff"><Monitor /></el-icon>
      <span class="logo-text">AI应用测试平台</span>
    </div>
    <el-menu
      :default-active="activeMenu()"
      class="sidebar-menu"
      @select="handleSelect"
    >
      <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index">
        <el-icon>
          <component :is="getIcon(item.icon)" />
        </el-icon>
        <span>{{ item.title }}</span>
      </el-menu-item>
    </el-menu>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: #263445;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  background-color: transparent;
}

.sidebar-menu .el-menu-item {
  color: #bfcbd9;
  background-color: transparent;
}

.sidebar-menu .el-menu-item:hover {
  background-color: #263445;
}

.sidebar-menu .el-menu-item.is-active {
  color: #409eff;
  background-color: #263445;
}
</style>
