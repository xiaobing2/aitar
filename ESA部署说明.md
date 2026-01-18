# ESA Pages 部署配置说明

## 📋 配置文件说明

项目根目录已创建 `esa.jsonc` 配置文件，用于配置ESA Pages的部署参数。

### 配置文件内容

```jsonc
{
  "name": "glass-memo",
  "entry": "./functions/webhook.js",
  "assets": {
    "directory": "./dist",
    "notFoundStrategy": "singlePageApplication"
  }
}
```

### 配置项说明

1. **`name`**: 项目名称
2. **`entry`**: 边缘函数入口文件路径（相对于项目根目录）
   - 当前配置：`./functions/webhook.js`
   - 这是处理QQ Webhook和API代理的边缘函数
3. **`assets.directory`**: 静态资源目录（Vue构建后的输出目录）
   - 当前配置：`./dist`
   - 这是 `npm run build` 后生成的目录
4. **`assets.notFoundStrategy`**: 404处理策略
   - 设置为 `"singlePageApplication"` 因为这是Vue SPA应用
   - 所有路由请求都会返回 `index.html`，由前端路由处理

---

## 🚀 部署步骤

### 1. 确保代码已提交到GitHub

```bash
git add .
git commit -m "Add ESA configuration"
git push origin main
```

### 2. 在ESA控制台配置

1. **登录阿里云ESA控制台**
   - 访问：https://www.aliyun.com/product/esa

2. **创建Pages项目**
   - 进入"函数和Pages" → "Pages"
   - 点击"创建项目"
   - 选择"从GitHub导入"或"手动创建"

3. **配置Git仓库**
   - 仓库地址：`https://github.com/xiaobing2/aitar`
   - 分支：`main`
   - 构建命令：`npm run build`（已在package.json中配置）

4. **环境变量配置**（重要！）
   在ESA控制台的项目设置中，添加以下环境变量：
   
   - **`QQ_SECRET`**: QQ机器人Secret（用于Webhook签名验证）
     - 获取方式：QQ开放平台 → 机器人应用 → 基本信息 → AppSecret
   
   - **`VUE_APP_EDGE_API_BASE`**（可选）: 边缘函数API地址
     - 如果边缘函数和Pages部署在同一个项目，可以不配置
     - 如果分开部署，需要配置边缘函数的完整URL

### 3. 验证配置

部署后，检查以下几点：

1. ✅ **构建成功**
   - 在构建日志中应该看到 `Build complete. The dist directory is ready to be deployed.`
   - 不应该再出现 `Assets directory not set` 或 `Function file not found` 错误

2. ✅ **静态资源加载**
   - 访问部署后的URL，应该能看到页面正常显示
   - 检查浏览器控制台，确保没有404错误

3. ✅ **边缘函数工作**
   - 访问 `https://your-domain.com/api/webhook/qq/group` 应该能正常响应
   - 可以发送测试请求验证

---

## 🔧 常见问题

### 问题1: Assets directory not set

**原因**: `esa.jsonc` 文件不存在或配置错误

**解决**:
1. 确保项目根目录有 `esa.jsonc` 文件
2. 检查 `assets.directory` 配置是否正确（应该是 `./dist`）
3. 确保构建命令 `npm run build` 成功执行并生成了 `dist` 目录

### 问题2: Function file not found

**原因**: `entry` 路径配置错误或文件不存在

**解决**:
1. 检查 `functions/webhook.js` 文件是否存在
2. 确认 `entry` 路径是相对于项目根目录的（`./functions/webhook.js`）
3. 确保文件已提交到Git仓库

### 问题3: 404页面问题

**原因**: SPA应用路由配置不正确

**解决**:
1. 确保 `notFoundStrategy` 设置为 `"singlePageApplication"`
2. 检查 `vue.config.js` 中的 `publicPath` 配置
3. 确保路由模式设置为 `history` 模式（在 `src/router/index.js` 中）

### 问题4: 边缘函数无法访问

**原因**: 环境变量未配置或路径不正确

**解决**:
1. 在ESA控制台配置 `QQ_SECRET` 环境变量
2. 检查边缘函数的URL路径是否正确
3. 查看边缘函数的日志，确认是否有错误

---

## 📝 注意事项

1. **环境变量安全**
   - ✅ 不要在代码中硬编码密钥
   - ✅ 使用ESA控制台的环境变量功能
   - ✅ 确保 `.env` 文件在 `.gitignore` 中

2. **构建优化**
   - 当前构建会产生警告（console.log语句），不影响功能
   - 如果希望消除警告，可以在代码中使用 `// eslint-disable-next-line` 注释

3. **文件大小**
   - `chunk-vendors.js` 文件较大（714KB），这是正常的（包含Three.js等大型库）
   - 已启用Gzip压缩，实际传输大小约为206KB

4. **边缘函数格式**
   - `webhook.js` 使用 `export async function handler(request)` 格式
   - 这是ESA边缘函数的标准格式，无需修改

---

## 🔗 相关文档

- [ESA Pages 官方文档](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/build-pages)
- [边缘函数开发指南](./functions/README.md)
- [QQ配置说明](./QQ配置说明.md)
- [部署指南](./DEPLOY.md)

---

## ✅ 部署检查清单

部署前请确认：

- [ ] `esa.jsonc` 文件已创建并提交到Git
- [ ] `functions/webhook.js` 文件存在且已提交
- [ ] `package.json` 中有 `build` 脚本
- [ ] 在ESA控制台配置了 `QQ_SECRET` 环境变量
- [ ] GitHub仓库是公开的（或ESA有访问权限）
- [ ] 构建命令 `npm run build` 在本地测试成功

部署后请验证：

- [ ] 网站可以正常访问
- [ ] 静态资源（CSS、JS、图片）正常加载
- [ ] 前端路由正常工作（刷新页面不404）
- [ ] 边缘函数可以访问（测试 `/api/webhook/qq/group`）
- [ ] QQ Webhook可以正常接收消息
