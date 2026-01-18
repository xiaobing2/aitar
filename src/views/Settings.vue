<template>
  <div class="settings">
    <header class="header glass-card">
      <div class="header-content">
        <router-link to="/" class="back-btn">← 返回</router-link>
        <h1 class="title">设置</h1>
      </div>
    </header>

    <div class="settings-content">
      <!-- QQ机器人配置 -->
      <div class="section glass-card">
        <h2 class="section-title">QQ机器人配置</h2>
        <QQLogin />
      </div>

      <!-- 阿里云API配置 -->
      <div class="section glass-card">
        <h2 class="section-title">阿里云API配置</h2>
        <div class="config-form">
          <div class="form-group">
            <label>API Key</label>
            <input 
              v-model="alibabaApiKey"
              type="password"
              placeholder="请输入阿里云DashScope API Key"
              class="glass-input"
            />
            <p class="form-hint">
              💡 获取方式：访问 <a href="https://dashscope.console.aliyun.com/" target="_blank">阿里云DashScope控制台</a> 创建API Key
            </p>
          </div>
          <button class="btn-primary" @click="saveAlibabaConfig">保存配置</button>
        </div>
      </div>

      <!-- QQ群监听 -->
      <div class="section glass-card">
        <h2 class="section-title">QQ群监听</h2>
        <p class="section-desc">
          系统会自动识别QQ群消息中的任务并添加到任务列表。当收到群消息时，如果该群未在监听列表中，系统会自动添加。
        </p>
        
        <!-- 添加群组表单 -->
        <div class="add-group-form">
          <div class="form-row">
            <div class="form-group">
              <label>QQ群ID（group_openid）</label>
              <input 
                v-model="newGroup.group_id"
                type="text"
                placeholder="请输入QQ群的group_openid（例如：02EE1EDAC74EE95A9FED0C83CA56D290）"
                class="glass-input"
              />
            </div>
            <div class="form-group">
              <label>QQ群名称（可选）</label>
              <input 
                v-model="newGroup.group_name"
                type="text"
                placeholder="QQ群名称（可选，用于显示）"
                class="glass-input"
              />
            </div>
          </div>
          <div class="form-tips">
            <p>💡 提示：</p>
            <ul>
              <li><strong>推荐方式</strong>：直接在QQ群里@机器人发送消息，系统会自动识别并添加该群到监听列表</li>
              <li><strong>手动添加</strong>：如果需要手动添加，请输入QQ官方API返回的 <code>group_openid</code>（32位字符串）</li>
              <li><strong>获取group_openid</strong>：在QQ群里@机器人发送消息后，查看边缘函数日志中的 <code>group_openid</code> 值</li>
              <li><strong>Webhook地址</strong>：部署边缘函数后，将QQ机器人的回调地址设置为边缘函数的 <code>/api/webhook/qq/group</code> 路径</li>
              <li><strong>纯前端架构</strong>：所有数据存储在浏览器本地（IndexedDB），无需后端服务器</li>
            </ul>
          </div>
          <button 
            class="btn-primary" 
            @click="addGroup" 
            :disabled="addingGroup || !newGroup.group_id"
          >
            {{ addingGroup ? '添加中...' : '+ 添加监听QQ群' }}
          </button>
        </div>

        <!-- 群组列表 -->
        <div class="groups-list" v-if="groups.length > 0">
          <div class="group-item" v-for="group in groups" :key="group.id">
            <div class="group-info">
              <div class="group-icon">💬</div>
              <div class="group-details">
                <h3>{{ group.group_name || group.group_id }}</h3>
                <p>群号：{{ group.group_id }}</p>
                <span class="group-status" :class="{ enabled: group.enabled }">
                  {{ group.enabled ? '监听中' : '已暂停' }}
                </span>
              </div>
            </div>
            <div class="group-actions">
              <label class="switch">
                <input 
                  type="checkbox" 
                  :checked="group.enabled"
                  @change="toggleGroup(group.id, $event.target.checked)"
                />
                <span class="slider"></span>
              </label>
              <button class="btn-delete" @click="deleteGroup(group.id)">删除</button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>暂无监听的QQ群，请添加QQ群号</p>
        </div>
      </div>

      <div class="section glass-card">
        <h2 class="section-title">使用说明</h2>
        <div class="instructions">
          <h3>1. 配置QQ机器人</h3>
          <p>在后端 <code>.env</code> 文件中配置 <code>QQ_APPID</code> 和 <code>QQ_SECRET</code></p>
          
          <h3>2. 部署边缘函数</h3>
          <p>将 <code>functions/webhook.js</code> 部署到阿里云边缘函数（或类似平台），配置QQ机器人的回调地址为边缘函数的 <code>/api/webhook/qq/group</code> 路径</p>
          
          <h3>3. 添加监听QQ群</h3>
          <p>在上方输入需要监听的QQ群号，或直接在QQ群里@机器人发送消息，系统会自动识别并添加该群到监听列表</p>
          
          <h3>4. 自动识别任务</h3>
          <p>在监听的QQ群中发送包含任务信息的消息，AI会自动识别并添加到任务列表。前端会定期轮询边缘函数获取新消息</p>
          
          <h3>5. 纯前端架构</h3>
          <p>所有任务数据存储在浏览器本地（IndexedDB），无需后端服务器。配置信息加密存储在localStorage中</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import groupsApi from '@/api/groups'
import QQLogin from '@/components/QQLogin.vue'
import { getConfig, saveAlibabaApiKey } from '@/utils/config'

export default {
  name: 'Settings',
  components: {
    QQLogin
  },
  data() {
    return {
      groups: [],
      loading: false,
      addingGroup: false,
      alibabaApiKey: '',
      newGroup: {
        group_id: '',
        group_name: ''
      }
    }
  },
  computed: {
    ...mapState('settings', ['webhookUrl', 'enabledPlatforms'])
  },
  watch: {
    webhookUrl() {
      this.saveSettings()
    },
    enabledPlatforms: {
      deep: true,
      handler() {
        this.saveSettings()
      }
    }
  },
  created() {
    this.loadSettings()
    this.loadGroups()
    this.loadConfig()
  },
  methods: {
    ...mapActions('settings', ['saveSettings', 'loadSettings']),
    
    // 配置管理
    loadConfig() {
      const config = getConfig()
      this.alibabaApiKey = config.alibaba?.api_key || ''
    },
    
    saveAlibabaConfig() {
      if (!this.alibabaApiKey) {
        this.$message?.warning?.('请输入API Key') || alert('请输入API Key')
        return
      }
      
      if (saveAlibabaApiKey(this.alibabaApiKey)) {
        this.$message?.success?.('配置已保存') || alert('配置已保存')
        // 通知其他组件配置已更新
        this.$eventBus?.$emit?.('config-updated')
      } else {
        this.$message?.error?.('保存失败') || alert('保存失败')
      }
    },
    
    updateWebhookUrl(value) {
      this.$store.commit('settings/SET_WEBHOOK_URL', value)
    },
    togglePlatform(platform) {
      this.$store.commit('settings/SET_PLATFORM_ENABLED', {
        platform,
        enabled: !this.enabledPlatforms[platform]
      })
    },
    async loadGroups() {
      this.loading = true
      try {
        this.groups = await groupsApi.getGroups()
      } catch (error) {
        console.error('加载群组列表失败:', error)
        this.$message?.error('加载群组列表失败')
      } finally {
        this.loading = false
      }
    },
    async addGroup() {
      if (!this.newGroup.group_id) {
        alert('请输入QQ群号')
        return
      }
      
      // 检查是否已添加
      const exists = this.groups.find(
        g => g.group_id === this.newGroup.group_id
      )
      if (exists) {
        alert('该QQ群已在监听列表中')
        return
      }
      
      this.addingGroup = true
      try {
        await groupsApi.addGroup(this.newGroup)
        // 清空表单
        this.newGroup = {
          group_id: '',
          group_name: ''
        }
        // 重新加载列表
        await this.loadGroups()
        alert('添加成功！')
      } catch (error) {
        console.error('添加QQ群失败:', error)
        alert('添加失败: ' + (error.message || '未知错误'))
      } finally {
        this.addingGroup = false
      }
    },
    async toggleGroup(groupId, enabled) {
      try {
        await groupsApi.updateGroup(groupId, { enabled })
        await this.loadGroups()
      } catch (error) {
        console.error('更新群组失败:', error)
        alert('更新失败: ' + (error.message || '未知错误'))
        // 重新加载以恢复状态
        await this.loadGroups()
      }
    },
    async deleteGroup(groupId) {
      if (!confirm('确定要删除这个监听群组吗？')) {
        return
      }
      
      try {
        await groupsApi.deleteGroup(groupId)
        await this.loadGroups()
        alert('删除成功！')
      } catch (error) {
        console.error('删除群组失败:', error)
        alert('删除失败: ' + (error.message || '未知错误'))
      }
    }
  }
}
</script>

<style scoped>
.settings {
  min-height: 100vh;
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.header {
  padding: 20px 30px;
  margin-bottom: 30px;
}

.back-btn {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 10px;
  display: inline-block;
  transition: color 0.2s;
}

.back-btn:hover {
  color: var(--text-primary);
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section {
  padding: 30px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.section-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
}

.glass-input {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 14px;
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.platform-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.platform-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.platform-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.platform-icon {
  font-size: 32px;
}

.platform-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.platform-info p {
  font-size: 13px;
  color: var(--text-secondary);
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.2);
  transition: 0.3s;
  border-radius: 26px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.instructions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.instructions h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.instructions p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.instructions code {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.add-group-form {
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.group-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.group-icon {
  font-size: 32px;
}

.group-details {
  flex: 1;
}

.group-details h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.group-details p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.group-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.group-status.enabled {
  background: rgba(76, 175, 80, 0.3);
  color: #4caf50;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-delete {
  padding: 8px 16px;
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 6px;
  color: #f44336;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: rgba(244, 67, 54, 0.3);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.glass-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23fff' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
  cursor: pointer;
}

.glass-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-refresh {
  margin-left: 10px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: rgba(255, 255, 255, 0.15);
}

.loading-text {
  margin-left: 10px;
  color: var(--text-secondary);
  font-size: 13px;
}

.form-info {
  margin-top: 15px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.form-info strong {
  color: var(--text-primary);
}

.form-tips {
  margin-top: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-tips p {
  margin: 0 0 10px 0;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 14px;
}

.form-tips ul {
  margin: 0;
  padding-left: 20px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.8;
}

.form-tips li {
  margin-bottom: 6px;
}

.form-tips code {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #4da6ff;
}
</style>

