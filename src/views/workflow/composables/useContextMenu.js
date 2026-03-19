/**
 * 右键菜单 Composable
 * 管理右键菜单的显示、隐藏和操作
 */
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'

export function useContextMenu() {
  // 右键菜单状态
  const contextMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    node: null,
    connection: null,
  })

  // 显示右键菜单
  const showContextMenu = (node, event, selectNode) => {
    event.preventDefault()
    event.stopPropagation()

    if (selectNode) {
      selectNode(node)
    }

    contextMenu.visible = true
    contextMenu.x = event.clientX
    contextMenu.y = event.clientY
    contextMenu.node = node
  }

  // 隐藏右键菜单
  const hideContextMenu = () => {
    contextMenu.visible = false
    contextMenu.node = null
    contextMenu.connection = null
  }

  // 右键菜单操作：重命名
  const contextMenuRename = (showRenameDialog) => {
    hideContextMenu()
    if (showRenameDialog) {
      showRenameDialog()
    }
  }

  // 右键菜单操作：创建副本
  const contextMenuDuplicate = (duplicateNode) => {
    hideContextMenu()
    if (duplicateNode) {
      duplicateNode()
    }
  }

  // 右键菜单操作：删除
  const contextMenuDelete = (deleteSelectedNode) => {
    hideContextMenu()
    if (deleteSelectedNode) {
      deleteSelectedNode()
    }
  }

  // 右键菜单操作：调整布局
  const contextMenuAutoLayout = (autoLayoutNodes) => {
    hideContextMenu()
    if (autoLayoutNodes) {
      autoLayoutNodes()
    }
  }

  // 显示连线右键菜单
  const showConnectionContextMenu = (connection, event, selectConnection) => {
    event.preventDefault()
    event.stopPropagation()

    if (selectConnection) {
      selectConnection(connection)
    }

    contextMenu.visible = true
    contextMenu.x = event.clientX
    contextMenu.y = event.clientY
    contextMenu.connection = connection
  }

  // 连线右键菜单操作：删除连线
  const connectionMenuDelete = (deleteSelectedConnection) => {
    if (!contextMenu.connection) return
    if (deleteSelectedConnection) {
      deleteSelectedConnection(contextMenu.connection)
    }
    hideContextMenu()
  }

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
    contextMenuRename,
    contextMenuDuplicate,
    contextMenuDelete,
    contextMenuAutoLayout,
    showConnectionContextMenu,
    connectionMenuDelete,
  }
}
