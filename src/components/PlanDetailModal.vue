<template>
  <div class="modal" v-if="visible" @click.self="$emit('close')">
    <div class="modal-mask"></div>
    <div class="modal-content glass-card" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">{{ localPlan.title }}</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="plan-progress">
        <div class="progress-info">
          <span class="progress-text">完成进度：{{ doneCount }}/{{ localPlan.subtasks.length }}</span>
          <div class="progress-bar-large">
            <div class="progress-fill" :style="{ width: `${(doneCount / localPlan.subtasks.length) * 100}%` }"></div>
          </div>
        </div>
      </div>
      
      <div class="subtasks-list">
        <div 
          class="subtask-item" 
          v-for="(s, index) in localPlan.subtasks" 
          :key="s.id"
          :class="{ done: s.done }"
        >
          <label class="subtask-label">
            <div class="custom-checkbox">
              <input 
                type="checkbox" 
                :checked="s.done" 
                @change="handleToggleSubtask(s.id)"
                class="subtask-checkbox"
              />
              <span class="checkmark"></span>
            </div>
            <span class="subtask-number">{{ index + 1 }}</span>
            <span class="subtask-text" :class="{ checked: s.done }">{{ s.text }}</span>
          </label>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="btn-danger" @click="handleDelete">删除计划</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlanDetailModal',
  props: {
    visible: Boolean,
    plan: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      localPlan: { ...this.plan },
      isUpdating: false // 标记是否正在更新，防止 watch 覆盖用户操作
    }
  },
  watch: {
    plan: {
      handler(newPlan) {
        if (newPlan && newPlan.id) {
          // 如果正在更新中，不覆盖 localPlan（避免删除线消失）
          if (this.isUpdating) {
            return
          }
          
          // 只有当 plan ID 不同时才完全替换
          if (!this.localPlan || !this.localPlan.id || this.localPlan.id !== newPlan.id) {
            this.localPlan = {
              ...newPlan,
              subtasks: (newPlan.subtasks || []).map(s => ({ ...s }))
            }
          } else {
            // 同步更新，确保与 store 一致
            // 只有当 subtasks 结构或状态发生变化时才更新
            const newSubtasks = (newPlan.subtasks || []).map(s => ({ ...s }))
            const currentSubtasks = this.localPlan.subtasks || []
            
            // 检查 subtasks 是否有变化
            const subtasksChanged = newSubtasks.length !== currentSubtasks.length ||
              newSubtasks.some((newSubtask, index) => {
                const currentSubtask = currentSubtasks[index]
                return !currentSubtask || 
                       currentSubtask.id !== newSubtask.id ||
                       currentSubtask.done !== newSubtask.done
              })
            
            // 检查 plan.done 是否有变化
            const doneChanged = this.localPlan.done !== newPlan.done
            
            if (subtasksChanged || doneChanged) {
              this.localPlan = {
                ...this.localPlan,
                subtasks: newSubtasks,
                done: newPlan.done
              }
            }
          }
        }
      },
      immediate: true,
      deep: true
    }
  },
  computed: {
    doneCount() {
      return (this.localPlan.subtasks || []).filter(s => s.done).length
    }
  },
  methods: {
    async handleToggleSubtask(subtaskId) {
      // 设置更新标志，防止 watch 覆盖
      this.isUpdating = true
      
      // 立即更新本地状态，实现即时UI反馈
      const subtask = this.localPlan.subtasks.find(s => s.id === subtaskId)
      if (subtask) {
        const newDoneState = !subtask.done
        // 创建新的 subtasks 数组，更新对应步骤的状态
        const updatedSubtasks = this.localPlan.subtasks.map(s => 
          s.id === subtaskId ? { ...s, done: newDoneState } : { ...s }
        )
        const allDone = updatedSubtasks.every(s => s.done)
        
        // 更新 localPlan
        this.localPlan = {
          ...this.localPlan,
          subtasks: updatedSubtasks,
          done: allDone
        }
      }
      
      // 发送事件到父组件，只传递 planId 和 subtaskId，让 store 从最新数据计算
      this.$emit('toggle-subtask', { planId: this.localPlan.id, subtaskId })
      
      // 延迟重置标志，确保 store 更新完成
      setTimeout(() => {
        this.isUpdating = false
      }, 500)
    },
    handleDelete() {
      if (confirm('确定要删除这个计划吗？')) {
        this.$emit('delete', this.localPlan.id)
        this.$emit('close')
      }
    }
  }
}
</script>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-mask {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.6);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  padding: 40px;
  z-index: 1;
  border-radius: 24px;
  background: rgba(2, 6, 23, 0.85);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  box-shadow: 
    0 0 0 1px rgba(15, 23, 42, 0.9),
    0 20px 40px rgba(15, 23, 42, 0.95),
    0 40px 80px rgba(15, 23, 42, 0.9),
    inset 0 2px 6px rgba(255, 255, 255, 0.14);
  overflow-y: auto;
  overflow-x: hidden;
  animation: modalAppear 0.3s ease-out;
  scrollbar-width: none; /* Firefox - 隐藏滚动条 */
  -ms-overflow-style: none; /* IE/Edge - 隐藏滚动条 */
}

/* 完全隐藏滚动条但保持滚动功能 */
.modal-content::-webkit-scrollbar {
  display: none; /* Chrome/Safari - 隐藏滚动条 */
  width: 0;
  height: 0;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-content::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 27px;
  background: conic-gradient(
    from 0deg at 50% 50%,
    #ff8c42,
    #ff6b9d,
    #4da6ff,
    #7b68ee,
    #9370db,
    #ff69b4,
    #ff8c42
  );
  z-index: -2;
  filter: blur(20px);
  opacity: 0.8;
}

/* 移除 ::after 伪元素，去除矩形边框 */

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 50%;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.plan-progress {
  margin-bottom: 32px;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.progress-bar-large {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
}

.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
  max-height: 50vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
  padding-left: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
}

/* 自定义滚动条样式 - 更美观 */
.subtasks-list::-webkit-scrollbar {
  width: 4px;
}

.subtasks-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 2px;
}

.subtasks-list::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.3);
  border-radius: 2px;
  transition: background 0.2s;
}

.subtasks-list::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.5);
}

.subtask-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.subtask-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.subtask-item.done {
  opacity: 0.7;
}

.subtask-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  width: 100%;
}

.custom-checkbox {
  position: relative;
  flex-shrink: 0;
  margin-top: 2px;
}

.subtask-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  width: 0;
  height: 0;
}

.checkmark {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(99, 102, 241, 0.5);
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.subtask-checkbox:checked ~ .checkmark {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
}

.checkmark::after {
  content: '';
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.subtask-checkbox:checked ~ .checkmark::after {
  display: block;
}

.subtask-label:hover .checkmark {
  border-color: rgba(99, 102, 241, 0.8);
  background: rgba(255, 255, 255, 0.15);
}

.subtask-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.4);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #c7d2fe;
  flex-shrink: 0;
}

.subtask-item.done .subtask-number {
  background: rgba(74, 222, 128, 0.2);
  border-color: rgba(74, 222, 128, 0.4);
  color: #4ade80;
}

.subtask-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  word-break: break-word;
}

.subtask-text.checked {
  text-decoration: line-through;
  opacity: 0.6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-danger {
  padding: 10px 20px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
  transform: translateY(-2px);
}
</style>
