# 前端后端对接完成说明

## ✅ 已完成的对接工作

### 1. API代理配置
- ✅ 在 `vue.config.js` 中配置了开发服务器代理
- ✅ 前端 `/api` 请求会自动代理到 `http://localhost:5000`

### 2. 任务管理API对接
- ✅ 修改 `src/api/tasks.js` 适配后端数据格式
- ✅ 后端返回格式：`{code: 0, data: [...], message: 'success'}`
- ✅ 支持获取、创建、更新、删除任务
- ✅ 添加了 `user_id` 参数支持

### 3. 群组管理API对接
- ✅ 创建了 `src/api/groups.js` 群组管理API
- ✅ 支持获取、添加、更新、删除监听群组
- ✅ 支持启用/禁用群组监听

### 4. Store数据适配
- ✅ 修改 `src/store/modules/tasks.js` 适配后端数据格式
- ✅ 自动转换字段名（`created_at` → `createdAt`）
- ✅ 保持前端数据格式一致性

### 5. 设置页面功能
- ✅ 修改 `src/views/Settings.vue` 添加QQ群组管理
- ✅ 支持添加监听群组（频道ID、子频道ID）
- ✅ 支持查看、启用/禁用、删除群组
- ✅ 更新了使用说明

## 🚀 使用方法

### 1. 启动后端服务
```bash
cd aitagback
python app.py
```

### 2. 启动前端服务
```bash
cd aitar
npm run serve
```

前端会自动在 `http://localhost:8080` 启动，API请求会代理到后端。

### 3. 测试对接

#### 测试任务管理
1. 打开前端页面 `http://localhost:8080`
2. 点击"新建任务"创建任务
3. 查看任务列表，应该能看到创建的任务
4. 尝试更新、删除任务

#### 测试群组管理
1. 进入"设置"页面
2. 在"QQ群组监听"部分添加群组
3. 填写频道ID和子频道ID
4. 查看群组列表，应该能看到添加的群组
5. 尝试启用/禁用、删除群组

## 📝 数据格式说明

### 任务数据格式
后端返回：
```json
{
  "id": "uuid",
  "user_id": "default_user",
  "title": "任务标题",
  "detail": "任务详情",
  "source": "local" | "chat",
  "done": false,
  "deadline": "2024-01-01T00:00:00",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00",
  "from": {
    "group_id": "...",
    "group_name": "...",
    "user_id": "...",
    "user_name": "..."
  }
}
```

前端使用（自动转换）：
```json
{
  "id": "uuid",
  "title": "任务标题",
  "detail": "任务详情",
  "source": "local" | "chat",
  "done": false,
  "deadline": "2024-01-01T00:00:00",
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2024-01-01T00:00:00",
  "from": {...}
}
```

### 群组数据格式
```json
{
  "id": "uuid",
  "user_id": "default_user",
  "guild_id": "频道ID",
  "channel_id": "子频道ID",
  "guild_name": "频道名称",
  "channel_name": "子频道名称",
  "enabled": true,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

## 🔧 配置说明

### 开发环境
- 前端：`http://localhost:8080`
- 后端：`http://localhost:5000`
- 代理：前端 `/api` → 后端 `http://localhost:5000/api`

### 生产环境
需要修改 `src/api/index.js` 中的 `baseURL`：
```javascript
baseURL: process.env.VUE_APP_API_BASE_URL || '/api'
```

设置环境变量 `VUE_APP_API_BASE_URL` 为后端实际地址。

## ⚠️ 注意事项

1. **用户ID**：目前使用默认用户ID `default_user`，后续可以改为从登录信息获取
2. **错误处理**：API失败时会自动降级到本地存储（localStorage）
3. **数据同步**：前端会定期从后端获取最新数据
4. **CORS**：后端已配置CORS，支持跨域请求

## 🐛 常见问题

### 1. API请求失败
- 检查后端服务是否启动
- 检查代理配置是否正确
- 查看浏览器控制台错误信息

### 2. 数据格式不匹配
- 检查后端返回的数据格式
- 查看前端API适配代码
- 检查Store中的数据转换逻辑

### 3. 群组添加失败
- 检查频道ID和子频道ID是否正确
- 查看后端日志错误信息
- 确认后端数据库连接正常
