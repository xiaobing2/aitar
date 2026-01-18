import { getAlibabaApiKey } from './config'

// 使用边缘函数代理，避免CORS问题
const API_BASE_URL = process.env.VUE_APP_EDGE_API_BASE 
  ? `${process.env.VUE_APP_EDGE_API_BASE}/ali-api`
  : '/api/edge/ali-api'

// 获取当前时间字符串
function getCurrentTimeString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  
  return {
    dateStr: `${year}年${month}月${day}日`,
    timeStr: `${year}-${month}-${day} ${hours}:${minutes}`
  }
}

// 解析AI返回的JSON
function parseAIResponse(text) {
  try {
    // 尝试直接解析JSON
    return JSON.parse(text)
  } catch (e) {
    // 尝试提取JSON部分
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('无法解析AI响应')
  }
}

// 判断消息是否为任务
export async function isTaskMessage(message) {
  const apiKey = getAlibabaApiKey()
  
  if (!apiKey) {
    console.warn('⚠️ 未配置阿里云API Key，使用简单检测')
    return simpleTaskDetection(message)
  }
  
  const { dateStr, timeStr } = getCurrentTimeString()
  
  const prompt = `你是一个任务提取助手。请分析以下QQ群消息，判断是否为任务，并提取关键信息。

当前时间：${dateStr} ${timeStr}

消息内容：
${message}

请按以下要求分析：

1. **判断是否为任务**：
   - 包含明确的待办事项、需要完成的工作
   - 有截止时间要求（如"今天11点前"、"明天完成"）
   - 有具体行动要求（如"完成"、"提交"、"修改"）

2. **提取标题**（重要！）：
   - 提取核心任务动作和对象，去除客套话、链接、无关信息
   - 标题要简洁明确，10-25字

3. **简化内容**：
   - 提取任务的核心要求，去除客套话、链接、无关信息
   - 50-100字，要点形式

4. **识别截止时间**（非常重要！）：
   - 必须仔细识别消息中的所有时间表达
   - 如果消息中有时间要求，提取原始时间表达式（保持原样）
   - 示例：
     * 消息："今天上午11点前完成" -> deadline: "今天上午11点前"
     * 消息："明天下午3点提交" -> deadline: "明天下午3点"
   - 如果没有时间要求，返回null

请严格按照以下JSON格式返回，只返回JSON，不要其他文字：
{
    "is_task": true,
    "title": "提取的简洁标题",
    "detail": "简化的任务描述",
    "deadline": "原始时间表达式，或null"
}`

  try {
    // 通过边缘函数代理，避免CORS问题
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: apiKey,
        requestBody: {
          model: 'qwen-turbo',
          input: {
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          parameters: {
            temperature: 0.1,
            max_tokens: 2000
          }
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 兼容新旧API格式
    let content = ''
    if (data.output?.text) {
      // 新格式：output.text
      content = data.output.text
    } else if (data.output?.choices?.[0]?.message?.content) {
      // 旧格式：output.choices[0].message.content
      content = data.output.choices[0].message.content
    }
    
    if (!content) {
      console.warn('⚠️ AI返回内容为空，使用简单检测')
      return simpleTaskDetection(message)
    }
    
    const result = parseAIResponse(content)
    
    // 如果有deadline，解析时间
    if (result.deadline) {
      result.deadline = parseDeadline(result.deadline)
    }
    
    return result
  } catch (error) {
    console.error('❌ AI API调用失败:', error)
    return simpleTaskDetection(message)
  }
}

// 解析截止时间
export function parseDeadline(deadlineStr) {
  if (!deadlineStr || deadlineStr.toLowerCase() === 'null' || deadlineStr === '') {
    return null
  }
  
  const now = new Date()
  const deadlineLower = deadlineStr.toLowerCase().trim()
  
  // 尝试解析标准格式
  try {
    const dt = new Date(deadlineStr)
    if (!isNaN(dt.getTime())) {
      return formatDateTime(dt)
    }
  } catch (e) {
    // 继续其他解析方式
  }
  
  // 解析中文日期格式：1月20日、1月20日18:00
  const dateMatch = deadlineLower.match(/(\d{1,2})月(\d{1,2})日/)
  if (dateMatch) {
    const month = parseInt(dateMatch[1])
    const day = parseInt(dateMatch[2])
    let year = now.getFullYear()
    
    // 如果月份已过，可能是明年
    if (month < now.getMonth() + 1 || (month === now.getMonth() + 1 && day < now.getDate())) {
      year += 1
    }
    
    // 尝试提取时间
    const timeMatch = deadlineLower.match(/(\d{1,2}):(\d{1,2})|(\d{1,2})\s*点/)
    if (timeMatch) {
      const hour = parseInt(timeMatch[1] || timeMatch[3])
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      const dt = new Date(year, month - 1, day, hour, minute)
      return formatDateTime(dt)
    } else {
      const dt = new Date(year, month - 1, day, 23, 59)
      return formatDateTime(dt)
    }
  }
  
  // 今天相关
  if (deadlineLower.includes('今天') || deadlineLower.includes('今日')) {
    const timePatterns = [
      /今天(?:上午|早上|早晨)\s*(\d{1,2})\s*点(?:前|)?/,
      /今天下午\s*(\d{1,2})\s*点(?:前|)?/,
      /今天晚上\s*(\d{1,2})\s*点(?:前|)?/,
      /今天\s*(\d{1,2}):(\d{1,2})/,
      /今天\s*(\d{1,2})\s*点(?:前|)?/
    ]
    
    for (const pattern of timePatterns) {
      const match = deadlineLower.match(pattern)
      if (match) {
        let hour = parseInt(match[1])
        const minute = match[2] ? parseInt(match[2]) : 0
        
        if (deadlineLower.includes('下午') && hour < 12) {
          hour += 12
        }
        if (deadlineLower.includes('晚上') && hour < 12) {
          hour += 12
        }
        
        const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute)
        return formatDateTime(dt)
      }
    }
    
    // 默认今天23:59
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59)
    return formatDateTime(dt)
  }
  
  // 明天相关
  if (deadlineLower.includes('明天') || deadlineLower.includes('明日')) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const timePatterns = [
      /明天(?:上午|早上|早晨)\s*(\d{1,2})\s*点(?:前|)?/,
      /明天下午\s*(\d{1,2})\s*点(?:前|)?/,
      /明天晚上\s*(\d{1,2})\s*点(?:前|)?/,
      /明天\s*(\d{1,2}):(\d{1,2})/,
      /明天\s*(\d{1,2})\s*点(?:前|)?/
    ]
    
    for (const pattern of timePatterns) {
      const match = deadlineLower.match(pattern)
      if (match) {
        let hour = parseInt(match[1])
        const minute = match[2] ? parseInt(match[2]) : 0
        
        if (deadlineLower.includes('下午') && hour < 12) {
          hour += 12
        }
        if (deadlineLower.includes('晚上') && hour < 12) {
          hour += 12
        }
        
        const dt = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), hour, minute)
        return formatDateTime(dt)
      }
    }
    
    // 默认明天23:59
    const dt = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59)
    return formatDateTime(dt)
  }
  
  // 后天
  if (deadlineLower.includes('后天')) {
    const dayAfter = new Date(now)
    dayAfter.setDate(dayAfter.getDate() + 2)
    const dt = new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 23, 59)
    return formatDateTime(dt)
  }
  
  // 本周
  if (deadlineLower.includes('本周') || deadlineLower.includes('这周')) {
    const daysUntilSunday = 7 - now.getDay()
    const sunday = new Date(now)
    sunday.setDate(sunday.getDate() + daysUntilSunday)
    const dt = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59)
    return formatDateTime(dt)
  }
  
  // N天内
  const daysMatch = deadlineLower.match(/(\d+)\s*天(?:内|后)/)
  if (daysMatch) {
    const days = parseInt(daysMatch[1])
    const targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() + days)
    const dt = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59)
    return formatDateTime(dt)
  }
  
  // 无法解析，返回null
  console.warn('⚠️ 无法解析时间:', deadlineStr)
  return null
}

// 格式化日期时间为 YYYY-MM-DD HH:MM
function formatDateTime(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 简单任务检测（备用方案）
function simpleTaskDetection(message) {
  const taskKeywords = ['完成', '提交', '修改', '检查', '处理', '准备', '安排']
  const hasKeyword = taskKeywords.some(keyword => message.includes(keyword))
  
  return {
    is_task: hasKeyword,
    title: hasKeyword ? message.substring(0, 30) : '',
    detail: message,
    deadline: null
  }
}
