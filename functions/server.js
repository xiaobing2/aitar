/**
 * 本地开发服务器
 * 用于测试边缘函数 webhook.js
 * 
 * 使用方法：
 * 1. 设置环境变量: export QQ_SECRET="your_secret"
 * 2. 运行: node server.js
 * 3. 访问: http://localhost:3000
 */

import webhookModule from './webhook.js'
// ESA边缘函数格式：默认导出包含fetch函数的对象
const handler = webhookModule.fetch
import http from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// 加载环境变量
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env') })

const PORT = process.env.PORT || 3000

const server = http.createServer(async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Signature-Ed25519, X-Signature-Timestamp')
  
  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }
  
  // 读取请求体
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
  })
  
  req.on('end', async () => {
    try {
      // 构建请求对象
      const url = new URL(req.url, `http://${req.headers.host}`)
      const request = {
        method: req.method,
        url: url.href,
        body: body || null,
        headers: req.headers
      }
      
      console.log(`📨 ${req.method} ${req.url}`)
      
      // 调用handler
      const response = await handler(request)
      
      // 设置响应头
      for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value)
      }
      res.statusCode = response.status
      
      // 发送响应体
      const text = await response.text()
      res.end(text)
      
      console.log(`✅ ${req.method} ${req.url} - ${response.status}`)
    } catch (error) {
      console.error('❌ 处理请求失败:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: error.message }))
    }
  })
})

server.listen(PORT, () => {
  console.log('🚀 本地开发服务器启动')
  console.log(`📍 地址: http://localhost:${PORT}`)
  console.log(`📝 QQ_SECRET: ${process.env.QQ_SECRET ? '✅ 已配置' : '❌ 未配置（请设置环境变量或创建 .env 文件）'}`)
  console.log(`\n💡 测试命令:`)
  console.log(`   curl -X POST http://localhost:${PORT}/api/webhook/qq/group \\`)
  console.log(`     -H "Content-Type: application/json" \\`)
  console.log(`     -d '{"op":13,"d":{"plain_token":"test","event_ts":"1234567890"}}'`)
})
