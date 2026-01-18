# 本地测试指南

## 📋 前置准备

1. **安装依赖**（如果需要使用 dotenv）
```bash
cd functions
npm install dotenv
```

2. **配置环境变量**
```bash
# 复制示例文件
cp env.example .env

# 编辑 .env 文件，填入真实的 QQ_SECRET
# QQ_SECRET=你的QQ机器人Secret
```

## 🧪 方法1: 使用测试脚本

### 运行测试脚本
```bash
cd functions
node test-local.js
```

### 测试内容
- ✅ CORS预检请求
- ✅ 回调地址验证（op=13）
- ✅ 群消息接收（op=0）
- ✅ 消息查询API

## 🧪 方法2: 使用 Node.js 直接测试

### 设置环境变量
```bash
# Windows PowerShell
$env:QQ_SECRET="your_qq_bot_secret_here"
node test-local.js

# Windows CMD
set QQ_SECRET=your_qq_bot_secret_here
node test-local.js

# Linux/Mac
export QQ_SECRET="your_qq_bot_secret_here"
node test-local.js
```

## 🧪 方法3: 使用 curl 测试（需要本地服务器）

### 启动本地服务器

创建一个简单的本地服务器 `server.js`:

```javascript
import { handler } from './webhook.js'
import http from 'http'

const server = http.createServer(async (req, res) => {
  // 读取请求体
  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', async () => {
    const request = {
      method: req.method,
      url: `http://localhost:3000${req.url}`,
      body: body || null,
      headers: req.headers
    }
    
    const response = await handler(request)
    
    // 设置响应头
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value)
    }
    res.statusCode = response.status
    
    const text = await response.text()
    res.end(text)
  })
})

server.listen(3000, () => {
  console.log('🚀 本地服务器启动: http://localhost:3000')
  console.log('📝 QQ_SECRET:', process.env.QQ_SECRET ? '已配置' : '❌ 未配置')
})
```

### 运行服务器
```bash
# 设置环境变量
export QQ_SECRET="your_qq_bot_secret_here"

# 启动服务器
node server.js
```

### 使用 curl 测试
```bash
# 测试回调验证（op=13）
curl -X POST http://localhost:3000/api/webhook/qq/group \
  -H "Content-Type: application/json" \
  -d '{
    "op": 13,
    "d": {
      "plain_token": "test_token_12345",
      "event_ts": "1234567890"
    }
  }'

# 测试群消息接收（op=0）
curl -X POST http://localhost:3000/api/webhook/qq/group \
  -H "Content-Type: application/json" \
  -d '{
    "op": 0,
    "t": "GROUP_AT_MESSAGE_CREATE",
    "d": {
      "group_openid": "test_group_123",
      "author": {
        "member_openid": "test_user_123",
        "member_nickname": "测试用户"
      },
      "content": "今天下午3点前完成报告",
      "timestamp": 1234567890
    }
  }'

# 测试消息查询
curl http://localhost:3000/api/edge/messages
```

## 🧪 方法4: 使用 Postman/Insomnia

1. **创建请求**
   - URL: `http://localhost:3000/api/webhook/qq/group`
   - Method: POST
   - Headers: `Content-Type: application/json`

2. **测试回调验证**
   ```json
   {
     "op": 13,
     "d": {
       "plain_token": "test_token_12345",
       "event_ts": "1234567890"
     }
   }
   ```

3. **测试群消息**
   ```json
   {
     "op": 0,
     "t": "GROUP_AT_MESSAGE_CREATE",
     "d": {
       "group_openid": "test_group_123",
       "author": {
         "member_openid": "test_user_123",
         "member_nickname": "测试用户"
       },
       "content": "今天下午3点前完成报告",
       "timestamp": 1234567890
     }
   }
   ```

## ⚠️ 注意事项

1. **环境变量配置**
   - 本地测试时，`QQ_SECRET` 必须配置，否则签名验证会失败
   - 可以通过 `.env` 文件或环境变量设置

2. **Ed25519 签名**
   - 边缘函数环境可能不支持完整的 Ed25519
   - 本地测试时，如果签名失败，会使用 fallback 方案
   - 实际部署时需要确保平台支持 Ed25519

3. **消息存储**
   - 本地测试使用内存存储（Map）
   - 重启后消息会丢失
   - 生产环境应使用持久化存储

## 🔍 调试技巧

1. **查看日志**
   ```javascript
   // 在 webhook.js 中添加 console.log
   console.log('收到请求:', { method, path, body })
   ```

2. **检查环境变量**
   ```javascript
   console.log('QQ_SECRET:', process.env.QQ_SECRET ? '已配置' : '未配置')
   ```

3. **测试签名生成**
   ```javascript
   const signature = await generateEd25519Signature('test_secret', '1234567890', 'test_token')
   console.log('生成的签名:', signature)
   ```

## 📚 相关文档

- [QQ开放平台文档](https://bot.q.qq.com/wiki/)
- [边缘函数部署指南](../functions/README.md)
