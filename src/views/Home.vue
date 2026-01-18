<template>
  <div class="home">
    <!-- 3D背景 -->
    <Scene3D />
    
    <!-- 页面进入动画遮罩 -->
    <div class="page-loader" v-if="loadingPage">
      <div class="loader-content">
        <div class="loader-logo">GLASS MEMO</div>
        <div class="loader-bar">
          <div class="loader-progress"></div>
        </div>
      </div>
    </div>
    <header class="header glass-card">
      <div class="header-content">
        <h1 class="title">
          <span class="title-icon">📝</span>
          Glass Memo
        </h1>
        <p class="subtitle">智能备忘录 - 让AI帮你管理任务</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="showCreateModal">
          <span>+</span> 新建任务
        </button>
        <button class="btn-primary" @click="showPlanModal" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          ✨ AI制定计划
        </button>
        <router-link to="/settings" class="btn-secondary">
          ⚙️ 设置
        </router-link>
      </div>
    </header>

    <div class="tabs glass-card">
      <button 
        class="tab-btn"
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'"
      >
        全部任务
      </button>
      <button 
        class="tab-btn"
        :class="{ active: activeTab === 'local' }"
        @click="activeTab = 'local'"
      >
        我的任务
      </button>
      <button 
        class="tab-btn"
        :class="{ active: activeTab === 'chat' }"
        @click="activeTab = 'chat'"
      >
        群聊任务
      </button>
      <button 
        class="tab-btn"
        :class="{ active: activeTab === 'pending' }"
        @click="activeTab = 'pending'"
      >
        待完成
      </button>
      <button 
        class="tab-btn"
        :class="{ active: activeTab === 'plans' }"
        @click="activeTab = 'plans'"
      >
        📋 AI计划
      </button>
    </div>

    <div class="content">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="error" class="error glass-card">
        <p>⚠️ {{ error }}</p>
      </div>

      <!-- 计划视图 -->
      <template v-if="activeTab === 'plans'">
        <div v-if="plansLoading" class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
        <div v-else-if="plans.length === 0" class="empty glass-card">
          <div class="empty-icon">🎯</div>
          <p>还没有AI制定的计划</p>
          <button class="btn-primary" @click="showPlanModal">
            创建第一个计划
          </button>
        </div>
        <div v-else class="tasks-grid">
          <PlanCard
            v-for="plan in plans"
            :key="`plan-${plan.id}-${plan.updatedAt || plan.createdAt}-${(plan.subtasks || []).map(s => `${s.id}:${s.done}`).join(',')}`"
            :plan="plan"
            @click="handlePlanClick"
            @delete="handleDeletePlan"
          />
        </div>
      </template>

      <!-- 任务视图 -->
      <template v-else>
        <div v-if="displayTasks.length === 0 && (activeTab !== 'all' || plans.length === 0)" class="empty glass-card">
          <div class="empty-icon">📋</div>
          <p>暂无任务</p>
          <button class="btn-primary" @click="showCreateModal">
            创建第一个任务
          </button>
        </div>

        <div v-else class="tasks-grid">
          <!-- 全部任务标签页：同时显示任务和计划 -->
          <template v-if="activeTab === 'all'">
            <!-- 显示所有任务 -->
            <TaskCard
              v-for="task in displayTasks"
              :key="task.id"
              :task="task"
              @click="handleTaskClick"
              @toggle="handleToggle"
              @delete="handleDelete"
            />
            <!-- 显示所有计划 -->
            <PlanCard
              v-for="plan in plans"
              :key="`plan-${plan.id}-${plan.updatedAt || plan.createdAt}-${(plan.subtasks || []).map(s => `${s.id}:${s.done}`).join(',')}`"
              :plan="plan"
              @click="handlePlanClick"
              @delete="handleDeletePlan"
            />
          </template>
          <!-- 其他标签页：只显示任务 -->
          <template v-else>
            <TaskCard
              v-for="task in displayTasks"
              :key="task.id"
              :task="task"
              @click="handleTaskClick"
              @toggle="handleToggle"
              @delete="handleDelete"
            />
          </template>
        </div>
      </template>


    </div>

    <TaskModal
      :visible="modalVisible"
      :task="editingTask"
      @create="handleCreate"
      @update="handleUpdate"
      @close="handleCloseModal"
    />

    <PlanModal
      :visible="planModalVisible"
      @generated="handlePlanGenerated"
      @close="planModalVisible = false"
    />

    <PlanDetailModal
      :visible="planDetailVisible"
      :plan="selectedPlan"
      @toggle-subtask="handleToggleSubtask"
      @delete="handleDeletePlan"
      @close="planDetailVisible = false"
    />
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import TaskCard from '@/components/TaskCard.vue'
import TaskModal from '@/components/TaskModal.vue'
import PlanCard from '@/components/PlanCard.vue'
import PlanModal from '@/components/PlanModal.vue'
import PlanDetailModal from '@/components/PlanDetailModal.vue'
import Scene3D from '@/components/Scene3D.vue'

export default {
  name: 'Home',
  components: {
    TaskCard,
    TaskModal,
    PlanCard,
    PlanModal,
    PlanDetailModal,
    Scene3D
  },
  data() {
    return {
      activeTab: 'all',
      modalVisible: false,
      editingTask: null,
      loadingPage: true,
      planModalVisible: false,
      planDetailVisible: false,
      selectedPlan: null
    }
  },
  computed: {
    ...mapState('tasks', ['loading', 'error']),
    ...mapState('plans', {
      plans: 'plans',
      plansLoading: 'loading'
    }),
    ...mapGetters('tasks', ['allTasks', 'localTasks', 'chatTasks', 'pendingTasks']),
    displayTasks() {
      switch (this.activeTab) {
        case 'local':
          return this.localTasks
        case 'chat':
          return this.chatTasks
        case 'pending':
          return this.pendingTasks
        default:
          return this.allTasks
      }
    }
  },
  watch: {
    // 监听 plans 变化，同步更新 selectedPlan
    plans: {
      handler(newPlans) {
        if (this.selectedPlan && this.selectedPlan.id) {
          const updatedPlan = newPlans.find(p => p.id === this.selectedPlan.id)
          if (updatedPlan) {
            // 创建新对象引用，确保 PlanDetailModal 能检测到变化
            this.selectedPlan = {
              ...updatedPlan,
              subtasks: (updatedPlan.subtasks || []).map(s => ({ ...s }))
            }
          }
        }
      },
      deep: true
    }
  },
  created() {
    // 页面加载动画
    setTimeout(() => {
      this.loadingPage = false
    }, 2000)
    
    // 首次拉取任务和计划
    this.fetchTasks()
    this.fetchPlans()
  },
  mounted() {
    // 启动轮询机制（从边缘函数获取新消息）
    this.startPolling()
  },
  beforeUnmount() {
    // 停止轮询
    this.stopPolling()
  },
  methods: {
    ...mapActions('tasks', ['fetchTasks', 'createTask', 'updateTask', 'deleteTask', 'startPolling', 'stopPolling']),
    ...mapActions('plans', ['fetchPlans', 'createPlan', 'updatePlan', 'deletePlan', 'toggleSubtask']),
    showCreateModal() {
      this.editingTask = null
      this.modalVisible = true
    },
    handleTaskClick(task) {
      this.editingTask = task
      this.modalVisible = true
    },
    handleCloseModal() {
      this.modalVisible = false
      this.editingTask = null
    },
    async handleCreate(taskData) {
      try {
        await this.createTask(taskData)
        this.$message?.success?.('任务创建成功') || alert('任务创建成功')
      } catch (error) {
        this.$message?.error?.(error.message) || alert('创建失败: ' + error.message)
      }
    },
    async handleUpdate(task) {
      try {
        await this.updateTask(task)
        this.$message?.success?.('任务更新成功') || alert('任务更新成功')
      } catch (error) {
        this.$message?.error?.(error.message) || alert('更新失败: ' + error.message)
      }
    },
    async handleToggle(task) {
      try {
        await this.updateTask({ ...task, done: !task.done })
      } catch (error) {
        this.$message?.error?.(error.message) || alert('更新失败: ' + error.message)
      }
    },
    async handleDelete(task) {
      try {
        await this.deleteTask({ id: task.id, source: task.source })
        this.$message?.success?.('任务已删除') || alert('任务已删除')
      } catch (error) {
        this.$message?.error?.(error.message) || alert('删除失败: ' + error.message)
      }
    },

    // 计划相关方法
    showPlanModal() {
      this.planModalVisible = true
    },
    async handlePlanGenerated(planData) {
      try {
        await this.createPlan(planData)
        this.$message?.success?.('计划创建成功') || alert('计划创建成功')
        // 切换到计划标签页
        this.activeTab = 'plans'
      } catch (error) {
        this.$message?.error?.(error.message) || alert('创建失败: ' + error.message)
      }
    },
    async handleToggleSubtask({ planId, subtaskId }) {
      try {
        await this.toggleSubtask({ planId, subtaskId })
        // 更新后，从 store 中获取最新的 plan，同步更新 selectedPlan
        if (this.selectedPlan && this.selectedPlan.id === planId) {
          const updatedPlan = this.plans.find(p => p.id === planId)
          if (updatedPlan) {
            // 创建新对象引用，确保 PlanDetailModal 能检测到变化
            this.selectedPlan = {
              ...updatedPlan,
              subtasks: (updatedPlan.subtasks || []).map(s => ({ ...s }))
            }
          }
        }
      } catch (error) {
        this.$message?.error?.(error.message) || alert('更新失败: ' + error.message)
      }
    },
    handlePlanClick(plan) {
      // 从 store 中获取最新的 plan，确保状态是最新的
      const latestPlan = this.plans.find(p => p.id === plan.id) || plan
      this.selectedPlan = latestPlan
      this.planDetailVisible = true
    },
    async handleDeletePlan(planId) {
      try {
        await this.deletePlan(planId)
        this.$message?.success?.('计划已删除') || alert('计划已删除')
        this.planDetailVisible = false
        this.selectedPlan = null
      } catch (error) {
        this.$message?.error?.(error.message) || alert('删除失败: ' + error.message)
      }
    }

  },

}
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding: 30px 20px;
  max-width: 1600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* 页面加载动画 */
.page-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeOut 0.5s ease-out 1.5s forwards;
}

.loader-content {
  text-align: center;
}

.loader-logo {
  font-size: 48px;
  font-weight: 700;
  color: white;
  letter-spacing: 8px;
  margin-bottom: 30px;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  animation: logoGlow 2s ease-in-out infinite;
}

.loader-bar {
  width: 300px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.loader-progress {
  height: 100%;
  background: linear-gradient(90deg, #ff6b9d, #c471ed, #4facfe);
  border-radius: 2px;
  animation: loading 1.5s ease-in-out;
  box-shadow: 0 0 10px rgba(255, 107, 157, 0.5);
}

@keyframes loading {
  from { width: 0%; }
  to { width: 100%; }
}

@keyframes logoGlow {
  0%, 100% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.5); }
  50% { text-shadow: 0 0 30px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 107, 157, 0.5); }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    visibility: hidden;
  }
}

.header {
  padding: 40px 50px;
  margin-bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  animation: slideDown 0.8s ease-out;
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  animation: shimmer 3s infinite;
}

@keyframes slideDown {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes shimmer {
  to { left: 100%; }
}

.header-content {
  flex: 1;
}

.title {
  font-size: 42px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, #ffffff 0%, #ff6b9d 50%, #c471ed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titleGlow 3s ease-in-out infinite;
}

@keyframes titleGlow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.2); }
}

.title-icon {
  font-size: 40px;
}

.subtitle {
  font-size: 16px;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(255, 107, 157, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 157, 0.5);
}

.btn-secondary {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tabs {
  padding: 15px;
  margin-bottom: 40px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(15px) saturate(180%);
  -webkit-backdrop-filter: blur(15px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

@keyframes fadeInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.tab-btn {
  padding: 12px 24px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.tab-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transition: left 0.5s;
}

.tab-btn:hover::before {
  left: 100%;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--text-primary);
  background: linear-gradient(135deg, 
    rgba(255, 107, 157, 0.3),
    rgba(196, 113, 237, 0.3)
  );
  box-shadow: 
    0 4px 15px rgba(255, 107, 157, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.content {
  min-height: 400px;
}

.loading, .error, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading p, .error p, .empty p {
  color: var(--text-secondary);
  font-size: 16px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 40px;
  padding: 40px 0;
  animation: fadeInUp 0.8s ease-out 0.4s both;
  perspective: 1500px;
  transform-style: preserve-3d;
}

.tasks-grid .task-card.is-placeholder {
  visibility: hidden;
}

.tasks-grid.zoomed-active {
  pointer-events: none;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .btn-primary, .btn-secondary {
    flex: 1;
    justify-content: center;
  }

  .tasks-grid {
    grid-template-columns: 1fr;
  }
}

.hover-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: auto;
  background: transparent;
  cursor: default;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>

