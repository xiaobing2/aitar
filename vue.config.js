const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  outputDir: 'dist',
  assetsDir: 'static',
  productionSourceMap: false,
  devServer: {
    port: 8080,
    open: true,
    proxy: {
      // 代理边缘函数API（如果本地开发时启动了边缘函数服务器）
      '/api/edge': {
        target: process.env.VUE_APP_EDGE_API_BASE || 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: {
          '^/api/edge': '/api/edge'
        },
        logLevel: 'debug'
      },
      // 代理阿里云API（开发环境备选方案）
      '/api/ali-proxy': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        pathRewrite: {
          '^/api/ali-proxy': '/api/v1/services/aigc/text-generation/generation'
        },
        secure: true
      },
      // 保留其他API代理（如果需要）
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        // 如果边缘函数服务器运行在3000端口，优先使用边缘函数
        bypass: function(req, res, proxyOptions) {
          // 如果请求的是 /api/edge，已经在上面处理了
          if (req.url.startsWith('/api/edge')) {
            return false
          }
          // 其他API请求继续代理到5000端口
          return req.url
        }
      }
    }
  }
})

