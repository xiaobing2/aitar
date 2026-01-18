<template>
  <div 
    class="task-card plan-card" 
    :class="{ done: plan.done }"
    @click="handleClick"
  >
    <div class="card-content">
      <div class="card-header">
        <div class="task-source">
          <span class="source-badge plan">📋 AI计划</span>
        </div>
        <div class="task-actions">
          <button 
            class="action-btn delete-btn"
            @click.stop="handleDelete"
            title="删除"
          >
            ×
          </button>
        </div>
      </div>
      
      <h3 class="task-title">{{ plan.title }}</h3>
      
      <div class="plan-preview">
        <div class="progress-info">
          <span class="progress-text">{{ doneCount }}/{{ plan.subtasks.length }} 已完成</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${(doneCount / plan.subtasks.length) * 100}%` }"></div>
          </div>
        </div>
        <div class="subtasks-preview" v-if="planSubtasks && planSubtasks.length">
          <div 
            class="subtask-preview" 
            v-for="s in planSubtasks.slice(0, 3)" 
            :key="`${s.id}-${s.done}`"
          >
            <span class="subtask-check" :class="{ checked: s.done }">{{ s.done ? '✓' : '○' }}</span>
            <span class="subtask-text" :class="{ checked: s.done }">{{ s.text }}</span>
          </div>
          <div v-if="planSubtasks.length > 3" class="more-subtasks">
            还有 {{ planSubtasks.length - 3 }} 个步骤...
          </div>
        </div>
      </div>
      
      <div class="task-footer">
        <div class="plan-stats">
          <span class="stat-item">共 {{ plan.subtasks.length }} 步</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlanCard',
  props: {
    plan: { type: Object, required: true }
  },
  computed: {
    doneCount() {
      // 直接从 plan.subtasks 计算，确保响应式
      const subtasks = this.plan.subtasks || []
      return subtasks.filter(s => s.done).length
    },
    // 计算属性确保响应式更新，创建新数组引用
    planSubtasks() {
      const subtasks = this.plan.subtasks || []
      // 返回新数组，确保响应式
      return subtasks.map(s => ({ ...s }))
    }
  },
  methods: {
    handleClick() {
      this.$emit('click', this.plan)
    },
    handleDelete() {
      if (confirm('确定要删除这个计划吗？')) {
        this.$emit('delete', this.plan.id)
      }
    }
  }
}
</script>

<style scoped>
/* 使用和 TaskCard 相同的样式 */
.plan-card {
  width: 320px;
  min-height: 240px;
  margin: 25px;
  position: relative;
  cursor: pointer;
  border-radius: 26px;
  background: rgba(2, 6, 23, 0.75);
  -webkit-tap-highlight-color: transparent;
  transform-style: preserve-3d;
  perspective: 1000px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 
    0 0 0 1px rgba(15, 23, 42, 0.9),
    0 10px 24px rgba(15, 23, 42, 0.9),
    0 26px 60px rgba(15, 23, 42, 0.85),
    0 40px 90px rgba(15, 23, 42, 0.8),
    0 60px 120px rgba(15, 23, 42, 0.75),
    inset 0 2px 6px rgba(255, 255, 255, 0.14),
    inset 0 -4px 10px rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.plan-card:hover {
  transform: translateY(-10px) rotateX(6deg) rotateY(4deg);
  box-shadow: 
    0 0 0 1px rgba(15, 23, 42, 1),
    0 16px 36px rgba(15, 23, 42, 0.95),
    0 34px 80px rgba(15, 23, 42, 0.9),
    0 60px 130px rgba(15, 23, 42, 0.85),
    inset 0 3px 8px rgba(255, 255, 255, 0.18),
    inset 0 -5px 14px rgba(15, 23, 42, 1);
}

.plan-card::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 30px;
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
  filter: blur(18px);
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.plan-card::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 28px;
  border: 2px solid transparent;
  background-image: conic-gradient(
    from 0deg at 50% 50%,
    #ff8c42,
    #ff6b9d,
    #4da6ff,
    #7b68ee,
    #9370db,
    #ff69b4,
    #ff8c42
  );
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  z-index: -1;
  pointer-events: none;
}

.card-content {
  position: relative;
  z-index: 1;
  height: 100%;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  padding: 24px;
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  overflow: hidden;
  box-shadow: 
    inset 0 2px 10px rgba(15, 23, 42, 0.9),
    inset 0 -4px 14px rgba(15, 23, 42, 0.85),
    inset 0 1px 2px rgba(248, 250, 252, 0.25);
}

/* 移除左上角蓝色矩形背景 */

.card-header {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.task-source {
  flex: 1;
}

.source-badge.plan {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(99, 102, 241, 0.2);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #c7d2fe;
}

.task-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.delete-btn:hover {
  background: rgba(255, 77, 77, 0.4);
}

.task-title {
  position: relative;
  z-index: 2;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16px;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.plan-preview {
  position: relative;
  z-index: 2;
  flex: 1;
  margin-bottom: 12px;
}

.progress-info {
  margin-bottom: 12px;
}

.progress-text {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.subtasks-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtask-preview {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.subtask-check {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
  margin-top: 2px;
}

.subtask-check.checked {
  color: #4ade80;
}

.subtask-text {
  flex: 1;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.subtask-text.checked {
  text-decoration: line-through;
  opacity: 0.6;
}

.more-subtasks {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  margin-top: 4px;
}

.task-footer {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.plan-stats {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.stat-item {
  display: inline-block;
}

.plan-card.done {
  opacity: 0.8;
}

.plan-card.done .card-content {
  background: rgba(30, 35, 60, 0.4);
}

.plan-card.done::before {
  opacity: 0.3;
}
</style>
