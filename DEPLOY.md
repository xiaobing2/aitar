# 部署指南

## 1. 本地开发

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run serve
```

访问 http://localhost:8080

## 2. 部署到ESA Pages

### 方式一：通过GitHub Actions自动部署

1. Fork或克隆本项目到你的GitHub仓库

2. 在GitHub仓库设置中添加Secrets：
   - `ESA_ACCESS_KEY_ID`: 阿里云AccessKey ID
   - `ESA_ACCESS_KEY_SECRET`: 阿里云AccessKey Secret
   - `VUE_APP_API_BASE_URL`: Edge Function的API地址（可选）

3. 推送代码到main分支，GitHub Actions会自动构建和部署

### 方式二：手动部署

1. 构建项目
```bash
npm run build
```

2. 在ESA Pages控制台创建项目

3. 上传dist目录内容

## 3. 部署Edge Function

1. 登录阿里云ESA控制台

2. 创建Edge Function，选择Node.js 18运行时

3. 将 `functions/index.js` 的代码复制到函数中

4. 配置函数触发器为HTTP触发器

5. 记录函数的访问URL，用于配置webhook

## 4. 配置QQ机器人（go-cqhttp）

1. 下载并安装go-cqhttp

2. 在配置文件中添加webhook配置：
```yaml
servers:
  - http:
      host: 0.0.0.0
      port: 5700
      post:
        - url: 'https://your-edge-function-url/tasks/inbound'
          secret: ''
```

3. 启动go-cqhttp

4. 在QQ群中发送包含任务信息的消息测试

## 5. 配置前端API地址

在ESA Pages项目设置中配置环境变量：
- `VUE_APP_API_BASE_URL`: 你的Edge Function地址（如：`https://your-function-url`）

或者修改 `src/api/index.js` 中的 `baseURL` 配置

## 6. 测试

1. 访问部署后的网站URL

2. 创建本地任务测试

3. 在QQ群中发送消息测试AI识别功能

## 注意事项

- 确保Edge Function已正确配置CORS
- 确保webhook URL可公开访问
- 生产环境建议配置HTTPS
- 建议使用Edge KV存储任务数据（当前使用内存存储，重启会丢失）

