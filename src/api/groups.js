// 纯前端模式：使用IndexedDB存储群组信息
import { getAllMonitoredGroups, addMonitoredGroup, updateMonitoredGroup, deleteMonitoredGroup } from '@/utils/db'

export default {

  // 获取监听群组列表
  async getGroups() {
    try {
      const groups = await getAllMonitoredGroups()
      return groups || []
    } catch (error) {
      console.error('获取群组列表失败:', error)
      return []
    }
  },

  // 添加监听群组
  async addGroup(groupData) {
    try {
      // 检查是否已存在
      const existingGroups = await getAllMonitoredGroups()
      const exists = existingGroups.find(g => g.group_id === groupData.group_id)
      if (exists) {
        throw new Error('该QQ群已在监听列表中')
      }
      
      // 添加默认字段
      const group = {
        group_id: groupData.group_id,
        group_name: groupData.group_name || groupData.group_id,
        enabled: groupData.enabled !== undefined ? groupData.enabled : true
      }
      
      const savedGroup = await addMonitoredGroup(group)
      return savedGroup
    } catch (error) {
      console.error('添加群组失败:', error)
      throw error
    }
  },

  // 更新群组配置
  async updateGroup(groupId, groupData) {
    try {
      const groups = await getAllMonitoredGroups()
      const group = groups.find(g => g.id === groupId)
      if (!group) {
        throw new Error('群组不存在')
      }
      
      const updatedGroup = {
        ...group,
        ...groupData
      }
      
      const savedGroup = await updateMonitoredGroup(updatedGroup)
      return savedGroup
    } catch (error) {
      console.error('更新群组失败:', error)
      throw error
    }
  },

  // 删除监听群组
  async deleteGroup(groupId) {
    try {
      await deleteMonitoredGroup(groupId)
      return true
    } catch (error) {
      console.error('删除群组失败:', error)
      throw error
    }
  }
}
