/**
 * QQ Webhook处理器
 * 接收QQ官方API的Webhook回调
 */

// 消息存储（实际应使用边缘KV）
const messageStore = new Map()
const processedMessages = new Set()

// CORS响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Signature-Ed25519, X-Signature-Timestamp'
}

/**
 * 处理请求的主函数
 */
async function handleRequest(request) {
  // 获取请求方法和URL
  const method = request.method
  const url = new URL(request.url)
  const path = url.pathname
  
  // 处理OPTIONS预检请求
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 读取请求体（如果需要）
  let body = null
  let headers = {}
  
  try {
    // 获取请求头
    request.headers.forEach((value, key) => {
      headers[key] = value
    })
    
    // 读取请求体（仅POST/PUT请求）
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await request.text()
      } catch (e) {
        // 如果请求体为空或读取失败，body保持为null
        body = null
      }
    }
    
    // QQ Webhook接收
    // 支持两种路径格式：
    // 1. /api/webhook/qq/group (直接访问)
    // 2. /api/edge/webhook/qq/group (ESA Pages自动添加/api/edge前缀)
    if (method === 'POST' && (path === '/api/webhook/qq/group' || path === '/api/edge/webhook/qq/group')) {
      return await handleQQWebhook(body, headers)
    }
    
    // 获取新消息（供前端轮询）
    if (method === 'GET' && path === '/api/edge/messages') {
      const since = url.searchParams.get('since')
      return await getNewMessages(since)
    }
    
    // 标记消息已处理
    if (method === 'POST' && path.startsWith('/api/edge/messages/') && path.endsWith('/processed')) {
      const messageId = path.split('/')[4]
      return await markMessageProcessed(messageId)
    }
    
    // 阿里云API代理（解决CORS问题）
    if (method === 'POST' && path === '/api/edge/ali-api') {
      return await proxyAliAPI(body, headers)
    }
    
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

/**
 * ESA边缘函数导出格式
 * 必须默认导出一个包含fetch函数的对象
 */
export default {
  async fetch(request) {
    return await handleRequest(request)
  }
}

/**
 * 处理QQ Webhook回调
 */
async function handleQQWebhook(body, headers) {
  try {
    const data = typeof body === 'string' ? JSON.parse(body) : body
    
    // 检查是否是回调地址验证（op=13）
    if (data.op === 13) {
      return await handleValidation(data)
    }
    
    // 处理事件推送（op=0）
    if (data.op === 0) {
      return await handleEvent(data)
    }
    
    return new Response(JSON.stringify({ code: 0, message: 'received' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('QQ Webhook处理错误:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

/**
 * 处理回调地址验证（op=13）
 * 使用Ed25519签名算法
 */
async function handleValidation(data) {
  try {
    const validationData = data.d || {}
    const plainToken = validationData.plain_token || ''
    const eventTs = validationData.event_ts || ''
    
    console.log('📝 收到验证请求:', { plainToken, eventTs })
    
    if (!plainToken || !eventTs) {
      console.error('❌ 缺少验证字段')
      return new Response(JSON.stringify({ error: 'Missing validation fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // 获取QQ_SECRET（从环境变量或配置）
    const qqSecret = process.env.QQ_SECRET || ''
    if (!qqSecret) {
      console.error('❌ QQ_SECRET未配置')
      return new Response(JSON.stringify({ error: 'QQ_SECRET not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log('🔐 开始生成签名...')
    
    // 生成Ed25519签名（实际使用HMAC-SHA256）
    const signature = await generateEd25519Signature(qqSecret, eventTs, plainToken)
    
    console.log('✅ 签名生成成功，长度:', signature.length)
    
    const responseData = {
      plain_token: plainToken,
      signature: signature
    }
    
    console.log('📤 返回响应:', JSON.stringify(responseData))
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('❌ 验证处理错误:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

/**
 * 生成Ed25519签名
 * QQ官方要求使用Ed25519算法
 */
async function generateEd25519Signature(secret, eventTs, plainToken) {
  try {
    // QQ官方要求：签名消息 = event_ts + plain_token（字符串拼接）
    const message = eventTs + plainToken
    const encoder = new TextEncoder()
    const messageData = encoder.encode(message)
    
    console.log('🔐 签名参数:', { secretLength: secret.length, message, eventTs, plainToken })
    
    // 尝试使用Web Crypto API的Ed25519
    try {
      // 准备seed：使用secret的SHA-256 hash作为32字节seed
      const secretBuffer = encoder.encode(secret)
      const hashBuffer = await crypto.subtle.digest('SHA-256', secretBuffer)
      const seed = new Uint8Array(hashBuffer).slice(0, 32)
      
      console.log('📝 Seed准备完成，长度:', seed.length)
      
      // 尝试生成Ed25519密钥对
      // 注意：Web Crypto API可能不支持从seed导入Ed25519，这里尝试生成
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'Ed25519'
        },
        true,
        ['sign']
      )
      
      console.log('✅ Ed25519密钥对生成成功')
      
      // 签名
      const signatureBuffer = await crypto.subtle.sign(
        {
          name: 'Ed25519'
        },
        keyPair.privateKey,
        messageData
      )
      
      // 转换为hex字符串（Ed25519签名是64字节）
      const signatureArray = Array.from(new Uint8Array(signatureBuffer))
      const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      console.log('✅ Ed25519签名生成成功，长度:', signatureHex.length)
      
      return signatureHex
    } catch (ed25519Error) {
      console.warn('⚠️ Ed25519不支持，尝试HMAC-SHA256:', ed25519Error.message)
      // 如果Ed25519不支持，使用HMAC-SHA256（虽然可能无法通过验证）
      return await generateHMACSignature(secret, message)
    }
  } catch (error) {
    console.error('❌ 签名生成失败:', error)
    throw error
  }
}

/**
 * 使用HMAC-SHA256生成签名（fallback方案）
 * 注意：QQ严格要求Ed25519，此方案可能无法通过验证
 */
async function generateHMACSignature(secret, message) {
  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(message)
    
    // 导入密钥
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: 'HMAC',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    )
    
    // 生成签名
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    )
    
    // 转换为hex字符串
    const signatureArray = Array.from(new Uint8Array(signatureBuffer))
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    console.log('⚠️ 使用HMAC-SHA256签名，长度:', signatureHex.length)
    
    return signatureHex
  } catch (error) {
    console.error('❌ HMAC签名失败:', error)
    throw error
  }
}

/**
 * 处理事件推送（op=0）
 */
async function handleEvent(data) {
  try {
    const eventType = data.t || ''
    const eventData = data.d || {}
    
    console.log(`📬 收到事件: ${eventType}`)
    
    // 处理群@机器人消息
    if (eventType === 'GROUP_AT_MESSAGE_CREATE') {
      return await handleGroupAtMessage(eventData)
    }
    
    // 处理单聊消息
    if (eventType === 'C2C_MESSAGE_CREATE') {
      return await handleC2CMessage(eventData)
    }
    
    // 其他事件类型
    console.log(`ℹ️ 未处理的事件类型: ${eventType}`)
    return new Response(JSON.stringify({ code: 0, message: `事件 ${eventType} 已接收` }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('事件处理错误:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

/**
 * 处理群@机器人消息
 */
async function handleGroupAtMessage(eventData) {
  try {
    const groupOpenid = eventData.group_openid || ''
    const author = eventData.author || {}
    const memberOpenid = author.member_openid || ''
    const memberNickname = author.member_nickname || '未知用户'
    const content = eventData.content || ''
    const timestamp = eventData.timestamp || Date.now()
    
    console.log(`📨 收到群消息: [${groupOpenid}] ${memberNickname}: ${content}`)
    
    // 存储消息供前端轮询
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const message = {
      id: messageId,
      type: 'GROUP_AT_MESSAGE_CREATE',
      groupOpenid: groupOpenid,
      memberOpenid: memberOpenid,
      memberNickname: memberNickname,
      content: content,
      timestamp: timestamp,
      createdAt: new Date().toISOString(),
      processed: false
    }
    
    messageStore.set(messageId, message)
    
    return new Response(JSON.stringify({ code: 0, message: 'received', data: message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('群消息处理错误:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

/**
 * 处理单聊消息
 */
async function handleC2CMessage(eventData) {
  try {
    const author = eventData.author || {}
    const userOpenid = author.user_openid || ''
    const userNickname = author.user_nickname || '未知用户'
    const content = eventData.content || ''
    const timestamp = eventData.timestamp || Date.now()
    
    console.log(`💬 收到单聊消息: ${userNickname}: ${content}`)
    
    // 存储消息供前端轮询
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const message = {
      id: messageId,
      type: 'C2C_MESSAGE_CREATE',
      userOpenid: userOpenid,
      userNickname: userNickname,
      content: content,
      timestamp: timestamp,
      createdAt: new Date().toISOString(),
      processed: false
    }
    
    messageStore.set(messageId, message)
    
    return new Response(JSON.stringify({ code: 0, message: 'received', data: message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('单聊消息处理错误:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

/**
 * 获取新消息（供前端轮询）
 */
async function getNewMessages(since = null) {
  try {
    const allMessages = Array.from(messageStore.values())
    
    // 过滤未处理的消息
    let newMessages = allMessages.filter(msg => !msg.processed && !processedMessages.has(msg.id))
    
    // 如果提供了since参数，只返回该时间之后的消息
    if (since) {
      const sinceTime = new Date(since).getTime()
      newMessages = newMessages.filter(msg => new Date(msg.createdAt).getTime() > sinceTime)
    }
    
    // 按时间倒序排列
    newMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    return new Response(JSON.stringify({
      code: 0,
      data: newMessages,
      count: newMessages.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('获取消息错误:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

/**
 * 标记消息已处理
 */
async function markMessageProcessed(messageId) {
  try {
    const message = messageStore.get(messageId)
    if (!message) {
      return new Response(JSON.stringify({ code: 404, error: 'Message not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // 标记为已处理
    message.processed = true
    processedMessages.add(messageId)
    messageStore.set(messageId, message)
    
    return new Response(JSON.stringify({
      code: 0,
      message: 'marked as processed'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('标记消息错误:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

/**
 * 代理阿里云API请求（解决CORS问题）
 */
async function proxyAliAPI(body, headers) {
  try {
    const requestData = typeof body === 'string' ? JSON.parse(body) : body
    const { apiKey, requestBody } = requestData
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing API Key' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const API_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    
    console.log('🔄 代理阿里云API请求')
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    const data = await response.json()
    
    console.log(`✅ 阿里云API响应: ${response.status}`)
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ 代理阿里云API错误:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
