/**
 * 边缘函数API客户端
 * 用于与阿里云边缘函数通信
 */
const EDGE_API_BASE = process.env.VUE_APP_EDGE_API_BASE || '/api/edge'

/**
 * 获取新消息
 * @param {string} lastTimestamp - 上次获取消息的时间戳（ISO格式）
 */
export async function fetchNewMessages(lastTimestamp = null) {
  try {
    const url = lastTimestamp 
      ? `${EDGE_API_BASE}/messages?since=${encodeURIComponent(lastTimestamp)}`
      : `${EDGE_API_BASE}/messages`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    if (data.code === 0) {
      return data.data || []
    }
    throw new Error(data.message || '获取消息失败')
  } catch (error) {
    console.error('获取新消息失败:', error)
    return []
  }
}

/**
 * 标记消息已处理
 */
export async function markMessageProcessed(messageId) {
  try {
    const response = await fetch(`${EDGE_API_BASE}/messages/${messageId}/processed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    return data.code === 0
  } catch (error) {
    console.error('标记消息失败:', error)
    return false
  }
}

/**
 * 获取边缘函数状态
 */
export async function getEdgeStatus() {
  try {
    const response = await fetch(`${EDGE_API_BASE}/status`, {
      method: 'GET'
    })
    
    const data = await response.json()
    return data.code === 0 ? data.data : null
  } catch (error) {
    console.error('获取边缘函数状态失败:', error)
    return null
  }
}
