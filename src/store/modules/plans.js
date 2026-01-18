import {
  getAllPlans,
  addPlan as addPlanDB,
  updatePlan as updatePlanDB,
  deletePlan as deletePlanDB
} from '@/utils/db'

const state = {
  plans: [],
  loading: false,
  error: null
}

const mutations = {
  SET_PLANS(state, plans) {
    state.plans = plans
  },
  ADD_PLAN(state, plan) {
    state.plans.unshift(plan)
  },
  UPDATE_PLAN(state, plan) {
    const idx = state.plans.findIndex(p => p.id === plan.id)
    if (idx !== -1) {
      // 深度复制 plan 对象，确保所有嵌套属性都是新的引用
      const updatedPlan = {
        ...plan,
        subtasks: (plan.subtasks || []).map(s => ({ ...s }))
      }
      // 使用 Vue.set 确保响应式更新
      state.plans.splice(idx, 1, updatedPlan)
    }
  },
  DELETE_PLAN(state, id) {
    state.plans = state.plans.filter(p => p.id !== id)
  },
  SET_LOADING(state, v) {
    state.loading = v
  },
  SET_ERROR(state, e) {
    state.error = e
  }
}

const actions = {
  async fetchPlans({ commit }) {
    commit('SET_LOADING', true)
    try {
      const plans = await getAllPlans()
      commit('SET_PLANS', plans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch (e) {
      commit('SET_ERROR', e.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  async createPlan({ commit }, plan) {
    const saved = await addPlanDB(plan)
    commit('ADD_PLAN', saved)
    return saved
  },
  async updatePlan({ commit }, plan) {
    const saved = await updatePlanDB(plan)
    commit('UPDATE_PLAN', saved)
    return saved
  },
  async deletePlan({ commit }, id) {
    await deletePlanDB(id)
    commit('DELETE_PLAN', id)
  },
  async toggleSubtask({ dispatch, state }, { planId, subtaskId }) {
    // 从 store 中获取最新的 plan，确保数据一致性
    const currentPlan = state.plans.find(p => p.id === planId)
    if (!currentPlan) {
      throw new Error('计划不存在')
    }
    
    // 基于 store 中的 plan 计算新的 subtasks
    const subtasks = (currentPlan.subtasks || []).map(s =>
      s.id === subtaskId ? { ...s, done: !s.done } : { ...s }
    )
    const done = subtasks.every(s => s.done)
    
    // 更新 plan
    await dispatch('updatePlan', { 
      ...currentPlan, 
      subtasks, 
      done 
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
