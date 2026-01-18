# 环境变量配置指南

## 📝 创建 .env 文件

由于 `.env` 文件包含敏感信息，不会被提交到版本控制。请按照以下步骤手动创建：

### 步骤1: 创建文件

在 `aitar/functions/` 目录下创建 `.env` 文件：

**Windows:**
```powershell
cd aitar\functions
New-Item -Path .env -ItemType File
```

**Linux/Mac:**
```bash
cd aitar/functions
touch .env
```

### 步骤2: 编辑文件内容

将以下内容复制到 `.env` 文件中：

```env
# QQ机器人配置
# 请填入你的真实QQ机器人Secret

# QQ机器人Secret（用于Webhook签名验证）
# 获取方式：QQ开放平台 -> 机器人应用 -> 基本信息 -> AppSecret
QQ_SECRET=your_qq_bot_secret_here

# 运行环境
NODE_ENV=development
```

### 步骤3: 替换真实值

将 `your_qq_bot_secret_here` 替换为你的真实 QQ 机器人 Secret。

**获取 QQ_SECRET 的方法：**
1. 登录 [QQ开放平台](https://bot.q.qq.com/)
2. 进入你的机器人应用
3. 在"基本信息"页面找到 `AppSecret`
4. 复制并粘贴到 `.env` 文件中

### 步骤4: 验证配置

运行测试脚本验证配置是否正确：

```bash
cd aitar/functions
node test-local.js
```

如果看到 `✅ QQ_SECRET: 已配置`，说明配置成功！

## 🔒 安全提示

- ✅ `.env` 文件已在 `.gitignore` 中，不会被提交到版本控制
- ✅ 不要将 `.env` 文件分享给他人
- ✅ 不要将 `QQ_SECRET` 提交到代码仓库
- ✅ 生产环境使用平台的环境变量配置功能

## 📚 相关文档

- [本地测试指南](./LOCAL_TEST.md)
- [部署指南](./README.md)
