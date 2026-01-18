/**
 * ESA Edge Function - Glass Memo 后端API
 * 处理任务CRUD和AI消息分类
 */

// 模拟 Edge KV 存储（实际应使用 ESA Edge KV SDK）
const tasksStore = new Map()

// AI分类函数（实际应调用通义千问API）
async function classifyTask(message) {
  // 任务关键词
  const taskKeywords = ['任务', '待办', '要做', '完成', '截止', 'ddl', 'deadline', '提醒', '记得']
  const deadlineKeywords = ['今天', '明天', '后天', '本周', '下周', '月', '日', '号', '点', '时']
  
  const lowerMsg = message.toLowerCase()
  const hasTaskKeyword = taskKeywords.some(kw => lowerMsg.includes(kw))
  const hasDeadlineKeyword = deadlineKeywords.some(kw => message.includes(kw))
  
  return hasTaskKeyword || hasDeadlineKeyword
}

// 提取截止时间
function extractDeadline(message) {
  const now = new Date()
  const patterns = [
    { regex: /今天\s*(\d{1,2})[点:](\d{1,2})/, handler: (m) => {
      const h = parseInt(m[1]), min = parseInt(m[2] || 0)
      const date = new Date(now)
      date.setHours(h, min, 0, 0)
      return date > now ? date.toISOString() : null
    }},
    { regex: /明天\s*(\d{1,2})[点:](\d{1,2})/, handler: (m) => {
      const h = parseInt(m[1]), min = parseInt(m[2] || 0)
      const date = new Date(now)
      date.setDate(date.getDate() + 1)
      date.setHours(h, min, 0, 0)
      return date.toISOString()
    }},
    { regex: /(\d{1,2})[月/](\d{1,2})[日号]/, handler: (m) => {
      const month = parseInt(m[1]) - 1, day = parseInt(m[2])
      const date = new Date(now.getFullYear(), month, day, 23, 59, 0)
      return date > now ? date.toISOString() : null
    }},
    { regex: /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})/, handler: (m) => {
      const year = parseInt(m[1]), month = parseInt(m[2]) - 1, day = parseInt(m[3])
      return new Date(year, month, day, 23, 59, 0).toISOString()
    }}
  ]
  
  for (const { regex, handler } of patterns) {
    const match = message.match(regex)
    if (match) {
      const deadline = handler(match)
      if (deadline) return deadline
    }
  }
  
  return null
}

// 生成UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

// 主处理函数
export async function handler(request) {
  const { method, url, body } = request
  
  // 处理 OPTIONS 预检请求
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  const urlObj = new URL(url)
  const path = urlObj.pathname
  
  try {
    // Webhook: 接收来自QQ/钉钉/微信的消息
    if (method === 'POST' && path === '/tasks/inbound') {
      return await handleInboundMessage(body)
    }
    
    // GET /api/tasks - 获取任务列表
    if (method === 'GET' && path === '/api/tasks') {
      const source = urlObj.searchParams.get('source') || 'all'
      return await getTasks(source)
    }
    
    // POST /api/tasks - 创建任务
    if (method === 'POST' && path === '/api/tasks') {
      return await createTask(body)
    }
    
    // PATCH /api/tasks/:id - 更新任务
    if (method === 'PATCH' && path.startsWith('/api/tasks/')) {
      const id = path.split('/').pop()
      return await updateTask(id, body)
    }
    
    // DELETE /api/tasks/:id - 删除任务
    if (method === 'DELETE' && path.startsWith('/api/tasks/')) {
      const id = path.split('/').pop()
      return await deleteTask(id)
    }
    
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Handler error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 处理入站消息（来自QQ/钉钉/微信）
async function handleInboundMessage(body) {
  try {
    const data = typeof body === 'string' ? JSON.parse(body) : body
    const { platform, group_id, sender, msg, ts } = data
    
    // AI判断是否为任务
    const isTask = await classifyTask(msg)
    if (!isTask) {
      return new Response(JSON.stringify({ message: 'ignored' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // 提取任务信息和截止时间
    const deadline = extractDeadline(msg)
    const title = msg.length > 50 ? msg.substring(0, 50) + '...' : msg
    
    const task = {
      id: generateUUID(),
      source: platform || 'qq',
      title,
      detail: msg,
      deadline,
      done: false,
      createdAt: new Date(ts || Date.now()).toISOString(),
      from: {
        platform,
        groupId: group_id,
        sender
      }
    }
    
    // 保存到 KV（实际应使用 Edge KV SDK）
    tasksStore.set(task.id, task)
    
    return new Response(JSON.stringify({ message: 'ok', task }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Inbound message error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 获取任务列表
async function getTasks(source) {
  const allTasks = Array.from(tasksStore.values())
  let filteredTasks = allTasks
  
  if (source === 'local') {
    filteredTasks = allTasks.filter(t => t.source === 'local')
  } else if (source !== 'all') {
    filteredTasks = allTasks.filter(t => t.source === source)
  }
  
  // 按创建时间倒序
  filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  
  return new Response(JSON.stringify({ data: filteredTasks }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// 创建任务
async function createTask(body) {
  try {
    const data = typeof body === 'string' ? JSON.parse(body) : body
    const task = {
      ...data,
      id: data.id || generateUUID(),
      createdAt: data.createdAt || new Date().toISOString()
    }
    
    tasksStore.set(task.id, task)
    
    return new Response(JSON.stringify({ data: task }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 更新任务
async function updateTask(id, body) {
  try {
    const existingTask = tasksStore.get(id)
    if (!existingTask) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const data = typeof body === 'string' ? JSON.parse(body) : body
    const updatedTask = { ...existingTask, ...data }
    
    tasksStore.set(id, updatedTask)
    
    return new Response(JSON.stringify({ data: updatedTask }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 删除任务
async function deleteTask(id) {
  const deleted = tasksStore.delete(id)
  
  return new Response(JSON.stringify({ message: deleted ? 'deleted' : 'not found' }), {
    status: deleted ? 200 : 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

