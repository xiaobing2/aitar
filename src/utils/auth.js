/**
 * QQ OAuth2.0 认证工具
 * 处理QQ登录、Token管理、API调用
 */

import CryptoJS from 'crypto-js'

const STORAGE_KEY = 'aitag_auth'
const ENCRYPTION_KEY = 'aitag_encryption_key' // 生产环境应该使用更安全的密钥

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
 * 获取存储的认证信息
 */
export function getAuthInfo() {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY)
    if (!encrypted) return null
    return decrypt(encrypted)
  } catch (error) {
    console.error('获取认证信息失败:', error)
    return null
  }
}

/**
 * 保存认证信息
 */
export function saveAuthInfo(authInfo) {
  try {
    const encrypted = encrypt(authInfo)
    if (encrypted) {
      localStorage.setItem(STORAGE_KEY, encrypted)
      return true
    }
    return false
  } catch (error) {
    console.error('保存认证信息失败:', error)
    return false
  }
}

/**
 * 清除认证信息
 */
export function clearAuthInfo() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 检查是否已登录
 */
export function isLoggedIn() {
  const authInfo = getAuthInfo()
  return authInfo && authInfo.access_token && authInfo.expires_at > Date.now()
}

/**
 * 获取QQ登录URL
 */
export async function getQQLoginUrl() {
  try {
    const response = await fetch('/api/auth/qq/login-url', {
      method: 'GET'
    })
    const data = await response.json()
    if (data.code === 0) {
      return data.data.login_url
    }
    throw new Error(data.message || '获取登录URL失败')
  } catch (error) {
    console.error('获取QQ登录URL失败:', error)
    throw error
  }
}

/**
 * 处理QQ登录回调
 */
export async function handleQQCallback(code) {
  try {
    const response = await fetch('/api/auth/qq/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    })
    const data = await response.json()
    if (data.code === 0) {
      const authInfo = {
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
        expires_at: Date.now() + (data.data.expires_in * 1000),
        openid: data.data.openid,
        appid: data.data.appid
      }
      saveAuthInfo(authInfo)
      return authInfo
    }
    throw new Error(data.message || '登录失败')
  } catch (error) {
    console.error('处理QQ回调失败:', error)
    throw error
  }
}

/**
 * 刷新Token
 */
export async function refreshToken() {
  try {
    const authInfo = getAuthInfo()
    if (!authInfo || !authInfo.refresh_token) {
      throw new Error('未找到刷新Token')
    }

    const response = await fetch('/api/auth/qq/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refresh_token: authInfo.refresh_token
      })
    })
    const data = await response.json()
    if (data.code === 0) {
      const newAuthInfo = {
        ...authInfo,
        access_token: data.data.access_token,
        expires_at: Date.now() + (data.data.expires_in * 1000)
      }
      if (data.data.refresh_token) {
        newAuthInfo.refresh_token = data.data.refresh_token
      }
      saveAuthInfo(newAuthInfo)
      return newAuthInfo
    }
    throw new Error(data.message || '刷新Token失败')
  } catch (error) {
    console.error('刷新Token失败:', error)
    // 如果刷新失败，清除认证信息，需要重新登录
    clearAuthInfo()
    throw error
  }
}

/**
 * 获取有效的Token（自动刷新）
 */
export async function getValidToken() {
  let authInfo = getAuthInfo()
  if (!authInfo) {
    throw new Error('未登录')
  }

  // 如果Token即将过期（5分钟内），自动刷新
  if (authInfo.expires_at - Date.now() < 5 * 60 * 1000) {
    try {
      authInfo = await refreshToken()
    } catch (error) {
      throw new Error('Token已过期，请重新登录')
    }
  }

  return authInfo.access_token
}

/**
 * 调用QQ API
 */
export async function callQQAPI(endpoint, options = {}) {
  try {
    const token = await getValidToken()
    const response = await fetch(`https://api.sgroup.qq.com${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    return await response.json()
  } catch (error) {
    console.error('调用QQ API失败:', error)
    throw error
  }
}

/**
 * 登出
 */
export function logout() {
  clearAuthInfo()
}
