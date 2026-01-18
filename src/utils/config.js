/**
 * 配置管理工具
 * 处理配置的加密存储和读取
 */
import CryptoJS from 'crypto-js'

const CONFIG_KEY = 'aitag_config'
const ENCRYPTION_KEY = 'aitag_config_key' // 生产环境应该使用更安全的密钥

/**
 * 加密数据
 */
function encrypt(data) {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString()
  } catch (error) {
    console.error('加密失败:', error)
    return null
  }
}

/**
 * 解密数据
 */
function decrypt(encryptedData) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return JSON.parse(decrypted)
  } catch (error) {
    console.error('解密失败:', error)
    return null
  }
}

/**
 * 获取配置
 */
export function getConfig() {
  try {
    const encrypted = localStorage.getItem(CONFIG_KEY)
    if (!encrypted) {
      return {
        alibaba: {
          api_key: ''
        },
        groups: [],
        settings: {
          auto_create_task: true,
          notification_enabled: true
        }
      }
    }
    return decrypt(encrypted) || {}
  } catch (error) {
    console.error('获取配置失败:', error)
    return {}
  }
}

/**
 * 保存配置
 */
export function saveConfig(config) {
  try {
    const encrypted = encrypt(config)
    if (encrypted) {
      localStorage.setItem(CONFIG_KEY, encrypted)
      return true
    }
    return false
  } catch (error) {
    console.error('保存配置失败:', error)
    return false
  }
}

/**
 * 更新配置（部分更新）
 */
export function updateConfig(updates) {
  const config = getConfig()
  const newConfig = {
    ...config,
    ...updates
  }
  return saveConfig(newConfig)
}

/**
 * 获取阿里云API Key
 */
export function getAlibabaApiKey() {
  const config = getConfig()
  return config.alibaba?.api_key || ''
}

/**
 * 保存阿里云API Key
 */
export function saveAlibabaApiKey(apiKey) {
  return updateConfig({
    alibaba: {
      api_key: apiKey
    }
  })
}

/**
 * 获取监听群组列表
 */
export function getMonitoredGroups() {
  const config = getConfig()
  return config.groups || []
}

/**
 * 保存监听群组列表
 */
export function saveMonitoredGroups(groups) {
  return updateConfig({
    groups
  })
}

/**
 * 添加监听群组
 */
export function addMonitoredGroup(group) {
  const groups = getMonitoredGroups()
  // 检查是否已存在
  if (groups.find(g => g.group_id === group.group_id)) {
    return false
  }
  groups.push({
    ...group,
    enabled: true,
    created_at: new Date().toISOString()
  })
  return saveMonitoredGroups(groups)
}

/**
 * 更新监听群组
 */
export function updateMonitoredGroup(groupId, updates) {
  const groups = getMonitoredGroups()
  const index = groups.findIndex(g => g.group_id === groupId)
  if (index === -1) {
    return false
  }
  groups[index] = {
    ...groups[index],
    ...updates
  }
  return saveMonitoredGroups(groups)
}

/**
 * 删除监听群组
 */
export function deleteMonitoredGroup(groupId) {
  const groups = getMonitoredGroups()
  const filtered = groups.filter(g => g.group_id !== groupId)
  return saveMonitoredGroups(filtered)
}

/**
 * 清除所有配置
 */
export function clearConfig() {
  localStorage.removeItem(CONFIG_KEY)
}
