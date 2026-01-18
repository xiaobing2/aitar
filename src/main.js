import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { initDB } from './utils/db'
import './assets/styles/main.css'

Vue.config.productionTip = false

// 纯前端模式：移除Socket.IO
// 实时更新将通过轮询边缘函数API实现（后续添加）

// 创建事件总线用于任务卡片之间的通信
Vue.prototype.$eventBus = new Vue()

// 初始化数据库（确保数据库升级）
initDB().then(() => {
  console.log('✅ 数据库初始化完成')
}).catch(error => {
  console.error('❌ 数据库初始化失败:', error)
  // 如果升级失败，提示用户清除浏览器数据
  if (error.name === 'VersionError' || error.message.includes('object stores')) {
    console.warn('⚠️ 数据库版本冲突，请清除浏览器数据后刷新页面')
    alert('数据库版本冲突，请清除浏览器数据（F12 -> Application -> Storage -> Clear site data）后刷新页面')
  }
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

