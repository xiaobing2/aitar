<template>
  <div class="modal-overlay" v-if="visible" @click="handleOverlayClick">
    <div class="modal-content glass-card" @click.stop>
      <div class="modal-header">
        <h2>{{ isEdit ? '编辑任务' : '新建任务' }}</h2>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label>任务标题 *</label>
          <input 
            type="text" 
            v-model="formData.title"
            placeholder="输入任务标题"
            required
            class="glass-input"
            :class="{ 'task-done': formData.done }"
          />
        </div>
        
        <div class="form-group">
          <label>任务详情</label>
          <textarea 
            v-model="formData.detail"
            placeholder="输入任务详情（可选）"
            rows="4"
            class="glass-input"
            :class="{ 'task-done': formData.done }"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>截止时间</label>
          <input 
            type="datetime-local" 
            v-model="formData.deadline"
            class="glass-input"
          />
        </div>
        
        <div class="form-group" v-if="isEdit">
          <label class="checkbox-label">
            <div class="custom-checkbox">
              <input 
                type="checkbox" 
                v-model="formData.done"
                class="task-checkbox"
              />
              <span class="checkmark"></span>
            </div>
            <span>标记为已完成</span>
          </label>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-cancel" @click="handleClose">
            取消
          </button>
          <button type="submit" class="btn btn-submit">
            {{ isEdit ? '更新' : '创建' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    task: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      formData: {
        title: '',
        detail: '',
        deadline: '',
        done: false
      }
    }
  },
  computed: {
    isEdit() {
      return !!this.task
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        if (this.task) {
          this.formData = {
            title: this.task.title || '',
            detail: this.task.detail || '',
            deadline: this.task.deadline ? this.formatDateTimeLocal(this.task.deadline) : '',
            done: this.task.done || false
          }
        } else {
          this.formData = {
            title: '',
            detail: '',
            deadline: '',
            done: false
          }
        }
      }
    },
    // 监听 done 状态变化，实时保存
    'formData.done'(newVal) {
      if (this.isEdit && this.task && this.visible) {
        // 实时保存 done 状态
        const taskData = {
          ...this.task,
          done: newVal
        }
        this.$emit('update', taskData)
      }
    }
  },
  methods: {
    formatDateTimeLocal(isoString) {
      if (!isoString) return ''
      const date = new Date(isoString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    },
    handleSubmit() {
      const taskData = {
        title: this.formData.title.trim(),
        detail: this.formData.detail.trim(),
        deadline: this.formData.deadline ? new Date(this.formData.deadline).toISOString() : null,
        done: this.formData.done
      }
      
      if (this.isEdit) {
        this.$emit('update', { ...this.task, ...taskData })
      } else {
        this.$emit('create', taskData)
      }
      
      this.handleClose()
    },
    handleClose() {
      this.$emit('close')
    },
    handleOverlayClick() {
      this.handleClose()
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  width: 90%;
  max-width: 500px;
  padding: 30px;
  animation: slideUp 0.3s;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h2 {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  color: var(--text-primary);
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  transition: all 0.2s;
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.glass-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

textarea.glass-input {
  resize: vertical;
  font-family: inherit;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 10px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-submit {
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
  color: white;
  box-shadow: 0 4px 15px rgba(255, 107, 157, 0.4);
}

.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 157, 0.5);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.custom-checkbox {
  position: relative;
  flex-shrink: 0;
}

.task-checkbox {
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

.task-checkbox:checked ~ .checkmark {
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

.task-checkbox:checked ~ .checkmark::after {
  display: block;
}

.checkbox-label:hover .checkmark {
  border-color: rgba(99, 102, 241, 0.8);
  background: rgba(255, 255, 255, 0.15);
}

.glass-input.task-done {
  text-decoration: line-through;
  opacity: 0.6;
}
</style>

