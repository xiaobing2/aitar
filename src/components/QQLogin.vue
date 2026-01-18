<template>
  <div class="qq-bot-config">
    <div class="config-info">
      <div class="info-header">
        <div class="icon">🤖</div>
        <div class="info">
          <h3>QQ机器人配置</h3>
          <p>配置QQ机器人以接收群消息</p>
        </div>
      </div>
      
      <div class="config-status" :class="{ configured: isConfigured }">
        <div class="status-indicator">
          <span class="status-dot" :class="{ active: isConfigured }"></span>
          <span>{{ isConfigured ? '已配置' : '未配置' }}</span>
        </div>
      </div>
      
      <div v-if="!isConfigured" class="config-tips">
        <p>💡 配置步骤：</p>
        <ol>
          <li>在QQ开放平台创建机器人应用，获取 AppID 和 Secret</li>
          <li>部署边缘函数（<code>functions/webhook.js</code>），配置环境变量 <code>QQ_SECRET</code></li>
          <li>在QQ开放平台配置Webhook地址：<code>{{ webhookUrl }}</code></li>
          <li>前端会自动轮询边缘函数获取新消息</li>
        </ol>
        <div style="margin-top: 12px; padding: 12px; background: rgba(255, 193, 7, 0.1); border-radius: 8px;">
          <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 8px;">
            ⚠️ 当前状态：边缘函数未连接或未部署
          </p>
          <button 
            @click="checkEdgeFunctionStatus" 
            class="retry-btn"
            style="padding: 6px 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px; color: var(--text-primary); cursor: pointer; font-size: 12px;"
          >
            🔄 重新检查连接
          </button>
        </div>
        <p style="margin-top: 12px; color: var(--text-secondary); font-size: 12px;">
          💡 提示：纯前端架构，无需后端服务器。所有数据存储在浏览器本地。
        </p>
      </div>
      
      <div v-else class="config-details">
        <div style="padding: 12px; background: rgba(74, 222, 128, 0.1); border-radius: 8px; margin-bottom: 16px;">
          <p style="color: #4ade80; font-size: 14px; margin: 0;">
            ✅ 边缘函数连接正常
          </p>
        </div>
        <div class="detail-item" v-if="appId">
          <span class="label">AppID:</span>
          <span class="value">{{ maskedAppId }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Webhook地址:</span>
          <span class="value">{{ webhookUrl }}</span>
        </div>
        <div style="margin-top: 12px;">
          <button 
            @click="checkEdgeFunctionStatus" 
            class="retry-btn"
            style="padding: 6px 12px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px; color: var(--text-primary); cursor: pointer; font-size: 12px;"
          >
            🔄 刷新状态
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QQLogin', // 保持原名称以兼容现有引用
  data() {
    return {
      isConfigured: false,
      appId: '',
      webhookUrl: ''
    }
  },
  computed: {
    maskedAppId() {
      if (!this.appId) return '未配置'
      if (this.appId.length <= 8) return this.appId
      return this.appId.substring(0, 4) + '****' + this.appId.substring(this.appId.length - 4)
    }
  },
  mounted() {
    this.loadConfig()
    this.getWebhookUrl()
  },
  methods: {
    async loadConfig() {
      // 检查边缘函数是否可用（通过测试连接）
      try {
        // 尝试从localStorage读取配置
        const configStr = localStorage.getItem('qq_bot_config')
        if (configStr) {
          const config = JSON.parse(configStr)
          this.appId = config.appId || ''
        } else {
          // 尝试从环境变量读取AppID（仅用于显示）
          const appId = process.env.VUE_APP_QQ_APPID
          if (appId) {
            this.appId = appId
          }
        }
        
        // 检查边缘函数是否可用
        await this.checkEdgeFunctionStatus()
      } catch (error) {
        console.error('加载配置失败:', error)
        this.isConfigured = false
      }
    },
    
    async checkEdgeFunctionStatus() {
      // 检查边缘函数是否可用
      try {
        const edgeApiBase = process.env.VUE_APP_EDGE_API_BASE || '/api/edge'
        const url = edgeApiBase.startsWith('http') 
          ? `${edgeApiBase}/messages` 
          : `${window.location.origin}${edgeApiBase}/messages`
        
        // 创建超时控制器
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          // 如果返回了正确的格式，说明边缘函数可用
          if (data.code !== undefined) {
            this.isConfigured = true
            return
          }
        }
        this.isConfigured = false
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('边缘函数检查超时（可能未部署或网络问题）')
        } else {
          console.log('边缘函数检查失败（可能未部署）:', error.message)
        }
        this.isConfigured = false
      }
    },
    
    getWebhookUrl() {
      // 获取边缘函数的Webhook地址
      // 如果配置了边缘函数URL，使用配置的URL
      const edgeApiBase = process.env.VUE_APP_EDGE_API_BASE || '/api/edge'
      const protocol = window.location.protocol
      const host = window.location.host
      
      // 边缘函数的webhook路径
      if (edgeApiBase.startsWith('http')) {
        // 如果配置了完整的URL
        this.webhookUrl = `${edgeApiBase}/webhook/qq/group`
      } else {
        // 相对路径，使用当前域名
        this.webhookUrl = `${protocol}//${host}${edgeApiBase}/webhook/qq/group`
      }
    }
  }
}
</script>

<style scoped>
.qq-bot-config {
  padding: 20px;
}

.config-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 24px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.icon {
  font-size: 48px;
}

.info h3 {
  font-size: 20px;
  margin-bottom: 5px;
  color: var(--text-primary);
}

.info p {
  color: var(--text-secondary);
  font-size: 14px;
}

.config-status {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 20px;
}

.config-status.configured {
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-primary);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6b7280;
  transition: all 0.3s;
}

.status-dot.active {
  background: #4ade80;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.config-tips {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.config-tips p {
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.config-tips ol {
  margin-left: 20px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.config-tips code {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.config-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.detail-item .label {
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-item .value {
  color: var(--text-primary);
  font-family: monospace;
  word-break: break-all;
  text-align: right;
  max-width: 60%;
}
</style>
