# QQ机器人配置说明

## 📍 配置位置

QQ机器人的ID和密钥需要配置在两个地方：

### 1. 边缘函数配置（必需）

**位置**：`functions/.env` 文件

**配置项**：
```env
QQ_SECRET=你的QQ机器人Secret
```

**如何获取**：
1. 登录 [QQ开放平台](https://bot.q.qq.com/)
2. 进入你的机器人应用
3. 在"基本信息"页面找到 `AppSecret`
4. 复制并粘贴到 `.env` 文件中

**创建步骤**：
```bash
# 1. 进入functions目录
cd functions

# 2. 复制示例文件
cp env.example .env

# 3. 编辑.env文件，填入真实的QQ_SECRET
# Windows: 用记事本打开 .env
# Linux/Mac: nano .env 或 vim .env
```

### 2. 生产环境配置（部署时）

部署到不同平台时，需要在平台的环境变量中配置：

#### 阿里云ESA边缘函数
1. 登录阿里云ESA控制台
2. 进入边缘函数管理
3. 找到你的函数，点击"环境变量"
4. 添加环境变量：
   - 变量名：`QQ_SECRET`
   - 变量值：你的QQ机器人Secret

#### Cloudflare Workers
```bash
wrangler secret put QQ_SECRET
# 然后输入你的QQ_SECRET值
```

#### Vercel
1. 进入Vercel Dashboard
2. 选择你的项目 → Settings → Environment Variables
3. 添加：
   - Key: `QQ_SECRET`
   - Value: 你的QQ机器人Secret

---

## 📝 QQ_APPID（可选）

**说明**：QQ_APPID主要用于QQ登录功能，如果你的项目不需要QQ登录，可以不配置。

**如果需要配置**：

### 前端配置（本地开发）
创建 `.env.local` 文件（在项目根目录）：
```env
VUE_APP_QQ_APPID=你的QQ机器人AppID
```

### 生产环境
在ESA Pages的环境变量中配置：
- 变量名：`VUE_APP_QQ_APPID`
- 变量值：你的QQ机器人AppID

**如何获取QQ_APPID**：
1. 登录 [QQ开放平台](https://bot.q.qq.com/)
2. 进入你的机器人应用
3. 在"基本信息"页面找到 `AppID`

---

## ✅ 验证配置

### 本地测试
```bash
cd functions
node test-local.js
```

如果看到 `✅ QQ_SECRET: 已配置`，说明配置成功！

### 检查边缘函数
启动边缘函数服务器：
```bash
cd functions
node server.js
```

如果看到 `📝 QQ_SECRET: ✅ 已配置`，说明配置正确。

---

## 🔒 安全提示

1. ✅ **不要提交 `.env` 文件到Git仓库**
   - `.env` 文件已在 `.gitignore` 中
   - 确保不要意外提交

2. ✅ **生产环境使用平台的环境变量**
   - 不要将密钥硬编码在代码中
   - 使用平台提供的环境变量功能

3. ✅ **定期更换密钥**
   - 如果密钥泄露，立即在QQ开放平台重置

---

## 📚 相关文档

- [边缘函数部署指南](./functions/README.md)
- [环境变量配置指南](./functions/SETUP_ENV.md)
- [本地测试指南](./functions/LOCAL_TEST.md)
