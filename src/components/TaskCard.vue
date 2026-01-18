<template>
  <div 
    ref="cardElement"
    class="task-card"
    :class="{ 
      'done': task.done, 
      'expired': isExpired, 
      'is-zoomed': isZoomed 
    }"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
  >
    <div class="card-content">
      <div class="card-header">
        <div class="task-source" v-if="task.source !== 'local'">
          <span class="source-badge" :class="task.source">
            {{ getSourceName(task.source) }}
          </span>
        </div>
        <div class="task-actions">
          <button 
            v-if="!isZoomed"
            class="action-btn"
            @click.stop="toggleDone"
            :title="task.done ? '标记未完成' : '标记完成'"
          >
            <span v-if="task.done">✓</span>
            <span v-else>○</span>
          </button>
          <button 
            v-if="!isZoomed"
            class="action-btn delete-btn"
            @click.stop="handleDelete"
            title="删除"
          >
            ×
          </button>
          <button 
            v-if="isZoomed"
            class="action-btn close-zoomed-btn"
            @click.stop="handleClose"
            title="关闭"
          >
            ×
          </button>
        </div>
      </div>
      
      <h3 class="task-title">{{ task.title }}</h3>
      
      <p class="task-detail" v-if="task.detail">{{ task.detail }}</p>
      
      <div class="task-footer">
        <div class="deadline-info" v-if="task.deadline">
          <span class="deadline-icon">⏰</span>
          <span class="deadline-text" :class="{ 'expired': isExpired }">
            {{ timeRemaining }}
          </span>
        </div>
        <div class="task-from" v-if="task.from">
          <span class="from-text">{{ task.from.sender }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getTimeRemaining, isExpired as checkExpired } from '@/utils/date'

export default {
  name: 'TaskCard',
  props: {
    task: {
      type: Object,
      required: true
    },
    isZoomed: {
        type: Boolean,
        default: false
    },
    disableHover: {
        type: Boolean,
        default: false
    }
  },
  computed: {
    isExpired() {
      return checkExpired(this.task.deadline)
    },
    timeRemaining() {
      if (!this.task.deadline) return ''
      const remaining = getTimeRemaining(this.task.deadline)
      return remaining.text
    },
  },

  methods: {
    handleClick() {
      this.$emit('click', this.task)
    },
    handleMouseEnter() {
      if (!this.isZoomed && !this.disableHover) {
        this.$emit('zoom-in', this.task);
      }
    },
    toggleDone() {
      this.$emit('toggle', this.task)
    },
    handleDelete() {
      if (confirm('确定要删除这个任务吗？')) {
        this.$emit('delete', this.task)
      }
    },
    handleClose() {
      this.$emit('close');
    },
    getSourceName(source) {
      const names = {
        qq: 'QQ',
        dingtalk: '钉钉',
        wechat: '微信'
      }
      return names[source] || source
    }
  }
}
</script>

<style scoped>
.task-card {
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

.task-card:hover {
  transform: translateY(-10px) rotateX(6deg) rotateY(4deg);
  box-shadow: 
    0 0 0 1px rgba(15, 23, 42, 1),
    0 16px 36px rgba(15, 23, 42, 0.95),
    0 34px 80px rgba(15, 23, 42, 0.9),
    0 60px 130px rgba(15, 23, 42, 0.85),
    inset 0 3px 8px rgba(255, 255, 255, 0.18),
    inset 0 -5px 14px rgba(15, 23, 42, 1);
}

/* 外圈柔光 - 完全匹配 aa.png 的颜色顺序 */
.task-card::before {
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

/* 内圈锐利光线 - 完全匹配 aa.png 的颜色顺序，增加厚度 */
.task-card::after {
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

/* --- States --- */

.task-card.done {
  opacity: 0.8;
}

.task-card.done .card-content {
  background: rgba(30, 35, 60, 0.4);
}

.task-card.done::before {
  opacity: 0.3;
  background: #888;
  filter: blur(15px);
}

.task-card.done::after {
  border-width: 2px;
  background-image: linear-gradient(135deg, #999, #bbb);
}

.task-card.expired::before {
  background: #ff6b6b;
  opacity: 0.6;
}

.task-card.expired::after {
  background-image: linear-gradient(135deg, #ff5555, #ff2222);
}

/* 内容样式 */
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

.source-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
  color: #fff;
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

.close-zoomed-btn {
  width: 32px;
  height: 32px;
  font-size: 20px;
  background: rgba(0, 0, 0, 0.2);
}

.task-title {
  position: relative;
  z-index: 2;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.task-detail {
  position: relative;
  z-index: 2;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  margin-bottom: 16px;
  flex: 1;
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
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

.deadline-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.deadline-icon {
  font-size: 16px;
}

.deadline-text.expired {
  color: #ff6b6b;
  font-weight: 600;
}

.task-from {
  font-size: 12px;
  opacity: 0.8;
}
</style>
