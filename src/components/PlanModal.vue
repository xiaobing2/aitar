<template>
  <div class="modal" v-if="visible">
    <div class="modal-mask" @click="$emit('close')" />
    <div class="modal-body glass-card">
      <h2 class="modal-title">AI 制定计划</h2>
      <textarea v-model="input" placeholder="我想 ..." class="glass-input" />
      <div class="actions">
        <button class="btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn-primary" :disabled="loading || !input" @click="handleGenerate">
          {{ loading ? '生成中...' : '生成计划' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { generatePlan } from '@/utils/ali_plan'
export default {
  props: {
    visible: Boolean
  },
  data() {
    return { input: '', loading: false }
  },
  methods: {
    async handleGenerate() {
      if (!this.input) return
      this.loading = true
      try {
        const plan = await generatePlan(this.input)
        const subtasks = plan.steps.map((t, i) => ({ id: `s_${i}`, text: t, done: false }))
        this.$emit('generated', {
          title: plan.title || this.input,
          subtasks
        })
        this.input = ''
        this.$emit('close')
      } catch (e) {
        alert(e.message)
      } finally {
        this.loading = false
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
  backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.4);
}
.modal-body {
  position: relative;
  width: 400px;
  padding: 24px;
  z-index: 1;
}
.modal-title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
textarea {
  width: 100%;
  min-height: 120px;
  resize: vertical;
  margin-bottom: 16px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
