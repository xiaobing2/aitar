/**
 * 本地测试脚本
 * 用于测试边缘函数webhook.js
 * 
 * 使用方法：
 * 1. 在 functions 目录下创建 .env 文件，配置 QQ_SECRET
 * 2. 运行: node test-local.js
 */

import webhookModule from './webhook.js'
// ESA边缘函数格式：默认导出包含fetch函数的对象
const handler = webhookModule.fetch
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 加载环境变量
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env') })

// 模拟请求对象
function createMockRequest(method, path, body = null, headers = {}) {
  const baseUrl = 'http://localhost'
  const url = new URL(path, baseUrl)
  
  return {
    method,
    url: url.href,
    body: body ? JSON.stringify(body) : null,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }
}

// 测试回调地址验证（op=13）
async function testValidation() {
  console.log('\n🧪 测试1: 回调地址验证（op=13）')
  console.log('=' .repeat(50))
  
  const request = createMockRequest('POST', '/api/webhook/qq/group', {
    op: 13,
    d: {
      plain_token: 'test_token_12345',
      event_ts: Math.floor(Date.now() / 1000).toString()
    }
  })
  
  try {
    const response = await handler(request)
    const data = await response.json()
    
    console.log('✅ 响应状态:', response.status)
    console.log('📦 响应数据:', JSON.stringify(data, null, 2))
    
    if (data.plain_token && data.signature) {
      console.log('✅ 验证成功！返回了签名')
    } else {
      console.log('❌ 验证失败：缺少签名')
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 测试群消息接收（op=0）
async function testGroupMessage() {
  console.log('\n🧪 测试2: 群消息接收（op=0）')
  console.log('=' .repeat(50))
  
  const request = createMockRequest('POST', '/api/webhook/qq/group', {
    op: 0,
    t: 'GROUP_AT_MESSAGE_CREATE',
    d: {
      group_openid: 'test_group_123',
      author: {
        member_openid: 'test_user_123',
        member_nickname: '测试用户'
      },
      content: '今天下午3点前完成报告',
      timestamp: Math.floor(Date.now() / 1000)
    }
  })
  
  try {
    const response = await handler(request)
    const data = await response.json()
    
    console.log('✅ 响应状态:', response.status)
    console.log('📦 响应数据:', JSON.stringify(data, null, 2))
    
    if (data.code === 0) {
      console.log('✅ 消息接收成功！')
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 测试消息查询
async function testGetMessages() {
  console.log('\n🧪 测试3: 消息查询')
  console.log('=' .repeat(50))
  
  const request = createMockRequest('GET', '/api/edge/messages')
  
  try {
    const response = await handler(request)
    const data = await response.json()
    
    console.log('✅ 响应状态:', response.status)
    console.log('📦 响应数据:', JSON.stringify(data, null, 2))
    
    if (data.code === 0 && Array.isArray(data.data)) {
      console.log(`✅ 查询成功！找到 ${data.data.length} 条消息`)
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 测试CORS预检
async function testCORS() {
  console.log('\n🧪 测试4: CORS预检请求')
  console.log('=' .repeat(50))
  
  const request = createMockRequest('OPTIONS', '/api/webhook/qq/group', null, {
    'Origin': 'http://localhost:8080',
    'Access-Control-Request-Method': 'POST'
  })
  
  try {
    const response = await handler(request)
    
    console.log('✅ 响应状态:', response.status)
    console.log('📦 CORS头:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods')
    })
    
    if (response.status === 200 || response.status === 204) {
      console.log('✅ CORS预检成功！')
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 主函数
async function main() {
  console.log('🚀 开始本地测试边缘函数')
  console.log('📝 QQ_SECRET:', process.env.QQ_SECRET ? '已配置' : '❌ 未配置（请创建 .env 文件）')
  
  if (!process.env.QQ_SECRET) {
    console.log('\n⚠️  警告: QQ_SECRET 未配置，签名验证测试可能失败')
    console.log('💡 提示: 复制 .env.example 为 .env 并填入 QQ_SECRET')
  }
  
  await testCORS()
  await testValidation()
  await testGroupMessage()
  await testGetMessages()
  
  console.log('\n✅ 所有测试完成！')
}

main().catch(console.error)
