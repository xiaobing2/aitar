# 边缘函数部署指南

本目录包含边缘函数代码，用于处理QQ Webhook回调。

## 📁 文件说明

- `webhook.js` - QQ Webhook处理器（主要文件）
- `index.js` - 旧的任务API（可保留或删除）

## 🚀 部署平台选择

### 1. 阿里云边缘函数（推荐）

**配置文件**: `.esapages.yaml`（在项目根目录）

**部署步骤**:
```bash
# 1. 安装阿里云CLI工具
npm install -g @alicloud/fun

# 2. 配置访问密钥
fun config

# 3. 部署
cd aitar
fun deploy
```

**环境变量配置**:
- 在阿里云控制台配置 `QQ_SECRET` 环境变量

**Webhook地址**:
- 部署后会获得类似：`https://your-function-id.fcapp.run/api/webhook/qq/group`

---

### 2. Cloudflare Workers

**配置文件**: `functions/wrangler.toml`

**部署步骤**:
```bash
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 配置环境变量（在 Cloudflare Dashboard 中）
# 或使用命令行：
wrangler secret put QQ_SECRET

# 4. 部署
cd functions
wrangler deploy
```

**环境变量配置**:
- 在 Cloudflare Dashboard → Workers → Settings → Environment Variables 中配置
- 或使用命令：`wrangler secret put QQ_SECRET`

**Webhook地址**:
- 部署后会获得类似：`https://aitag-webhook.your-subdomain.workers.dev/api/webhook/qq/group`

---

### 3. Vercel Edge Functions

**配置文件**: `functions/vercel.json`

**部署步骤**:
```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署
cd aitar
vercel --prod
```

**环境变量配置**:
- 在 Vercel Dashboard → Project Settings → Environment Variables 中配置 `QQ_SECRET`

**Webhook地址**:
- 部署后会获得类似：`https://your-project.vercel.app/api/webhook/qq/group`

---

### 4. 其他平台

#### Netlify Functions
创建 `netlify.toml`:
```toml
[build]
  functions = "functions"

[[redirects]]
  from = "/api/webhook/qq/group"
  to = "/.netlify/functions/webhook"
  status = 200
```

#### AWS Lambda
需要创建 `serverless.yml` 或使用 AWS SAM/CloudFormation

---

## ⚙️ 环境变量配置

所有平台都需要配置以下环境变量：

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `QQ_SECRET` | QQ机器人Secret（用于签名验证） | ✅ 是 |
| `NODE_ENV` | 运行环境（production/development） | ❌ 否 |

---

## 🔧 本地测试

### 使用 Node.js 测试

```bash
cd functions
node -e "
const handler = require('./webhook.js').handler;
const request = {
  method: 'POST',
  url: 'http://localhost/api/webhook/qq/group',
  body: JSON.stringify({
    op: 13,
    d: {
      plain_token: 'test_token',
      event_ts: '1234567890'
    }
  }),
  headers: {}
};
handler(request).then(r => console.log(r));
"
```

### 使用 curl 测试

```bash
# 测试验证接口（op=13）
curl -X POST https://your-edge-function-url/api/webhook/qq/group \
  -H "Content-Type: application/json" \
  -d '{
    "op": 13,
    "d": {
      "plain_token": "test_token",
      "event_ts": "1234567890"
    }
  }'

# 测试消息查询接口
curl https://your-edge-function-url/api/edge/messages
```

---

## 📝 注意事项

1. **签名验证**: 确保 `QQ_SECRET` 配置正确，否则QQ回调验证会失败
2. **CORS配置**: 代码中已包含CORS头，支持跨域请求
3. **消息存储**: 当前使用内存存储（Map），重启后会丢失。生产环境建议使用：
   - Cloudflare KV
   - Vercel KV
   - 阿里云 Edge KV
   - 或其他持久化存储
4. **超时设置**: 根据平台限制调整超时时间（当前设置为30秒）

---

## 🔗 相关文档

- [阿里云边缘函数文档](https://help.aliyun.com/product/44239.html)
- [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- [Vercel Edge Functions文档](https://vercel.com/docs/functions/edge-functions)
