import { getAllTasks, getTasksBySource, addTask, updateTask as updateTaskInDB, deleteTask as deleteTaskFromDB } from '@/utils/db'

export default {
  // 获取任务列表（纯前端，使用IndexedDB）
  async getTasks(source = 'all') {
    try {
      if (source === 'all') {
        return await getAllTasks()
      } else {
        return await getTasksBySource(source)
      }
    } catch (error) {
      console.error('获取任务失败:', error)
      return []
    }
  },

  // 创建任务（纯前端，使用IndexedDB）
  async createTask(task) {
    try {
      // 生成ID
      const taskData = {
        ...task,
        id: task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return await addTask(taskData)
    } catch (error) {
      console.error('创建任务失败:', error)
      throw error
    }
  },

  // 更新任务（纯前端，使用IndexedDB）
  async updateTask(id, task) {
    try {
      const taskData = {
        ...task,
        id,
        updatedAt: new Date().toISOString()
      }
      return await updateTaskInDB(taskData)
    } catch (error) {
      console.error('更新任务失败:', error)
      throw error
    }
  },

  // 删除任务（纯前端，使用IndexedDB）
  async deleteTask(id) {
    try {
      await deleteTaskFromDB(id)
    } catch (error) {
      console.error('删除任务失败:', error)
      throw error
    }
  }
}

