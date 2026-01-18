import taskApi from '@/api/tasks'
import { fetchNewMessages, markMessageProcessed } from '@/utils/edge_api'
import { isTaskMessage } from '@/utils/ali_api_client'
import { addTask } from '@/utils/db'

const state = {
  localTasks: [],
  chatTasks: [],
  loading: false,
  error: null,
  pollingInterval: null,
  lastPollTime: null
}

const mutations = {
  SET_LOCAL_TASKS(state, tasks) {
    state.localTasks = tasks
  },
  SET_CHAT_TASKS(state, tasks) {
    state.chatTasks = tasks
  },
  ADD_TASK(state, task) {
    // 适配后端数据格式（created_at -> createdAt）
    const adaptedTask = {
      ...task,
      createdAt: task.created_at || task.createdAt,
      updatedAt: task.updated_at || task.updatedAt
    }
    
    // 检查是否已存在（避免重复添加）
    const allTasks = [...state.localTasks, ...state.chatTasks]
    const exists = allTasks.find(t => t.id === adaptedTask.id)
    if (exists) {
      console.log('⚠️ 任务已存在，跳过添加:', adaptedTask.id)
      return
    }
    
    if (adaptedTask.source === 'local') {
      state.localTasks.push(adaptedTask)
    } else {
      state.chatTasks.push(adaptedTask)
    }
    console.log('✅ 任务已添加到状态:', adaptedTask.id, adaptedTask.source)
  },
  UPDATE_TASK(state, updatedTask) {
    // 适配后端数据格式
    const adaptedTask = {
      ...updatedTask,
      createdAt: updatedTask.created_at || updatedTask.createdAt,
      updatedAt: updatedTask.updated_at || updatedTask.updatedAt
    }
    
    const list = adaptedTask.source === 'local' ? state.localTasks : state.chatTasks
    const index = list.findIndex(t => t.id === adaptedTask.id)
    if (index !== -1) {
      list.splice(index, 1, adaptedTask)
      console.log('✅ 任务已更新:', adaptedTask.id)
    } else {
      // 如果找不到，可能是 source 不匹配，尝试在两个列表中查找
      const allTasks = [...state.localTasks, ...state.chatTasks]
      const taskIndex = allTasks.findIndex(t => t.id === adaptedTask.id)
      if (taskIndex !== -1) {
        const foundTask = allTasks[taskIndex]
        const correctList = foundTask.source === 'local' ? state.localTasks : state.chatTasks
        const correctIndex = correctList.findIndex(t => t.id === adaptedTask.id)
        if (correctIndex !== -1) {
          correctList.splice(correctIndex, 1, adaptedTask)
          console.log('✅ 任务已更新（跨列表）:', adaptedTask.id)
        }
      } else {
        console.log('⚠️ 未找到要更新的任务:', adaptedTask.id)
      }
    }
  },
  DELETE_TASK(state, { id, source }) {
    const list = source === 'local' ? state.localTasks : state.chatTasks
    const index = list.findIndex(t => t.id === id)
    if (index !== -1) {
      list.splice(index, 1)
    }
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  },
  SET_POLLING_INTERVAL(state, interval) {
    state.pollingInterval = interval
  },
  SET_LAST_POLL_TIME(state, time) {
    state.lastPollTime = time
  }
}

const actions = {
  // 纯前端模式：移除Socket.IO，使用轮询或事件驱动
  // 实时更新将通过轮询边缘函数API实现
  async fetchTasks({ commit }, source = 'all') {
    commit('SET_LOADING', true)
    try {
      const tasks = await taskApi.getTasks(source)
      // IndexedDB返回的数据已经是标准格式
      const adaptedTasks = tasks.map(task => ({
        ...task,
        createdAt: task.createdAt || task.created_at,
        updatedAt: task.updatedAt || task.updated_at
      }))
      if (source === 'all' || source === 'local') {
        commit('SET_LOCAL_TASKS', adaptedTasks.filter(t => t.source === 'local'))
      }
      if (source === 'all' || source !== 'local') {
        commit('SET_CHAT_TASKS', adaptedTasks.filter(t => t.source !== 'local'))
      }
      commit('SET_ERROR', null)
    } catch (error) {
      commit('SET_ERROR', error.message)
      console.error('获取任务失败:', error)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createTask({ commit }, taskData) {
    commit('SET_LOADING', true)
    try {
      // 构建任务数据，IndexedDB会自动生成id和createdAt
      const taskPayload = {
        source: 'local',
        title: taskData.title,
        detail: taskData.detail || '',
        deadline: taskData.deadline || null,
        done: false
      }
      // 调用API创建任务，IndexedDB会返回完整的任务对象
      const task = await taskApi.createTask(taskPayload)
      // IndexedDB返回的数据已经是标准格式
      const adaptedTask = {
        ...task,
        createdAt: task.createdAt || task.created_at,
        updatedAt: task.updatedAt || task.updated_at
      }
      commit('ADD_TASK', adaptedTask)
      commit('SET_ERROR', null)
      return adaptedTask
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async updateTask({ commit }, task) {
    commit('SET_LOADING', true)
    try {
      // IndexedDB使用标准格式
      const updatePayload = {
        ...task
      }
      const updatedTask = await taskApi.updateTask(task.id, updatePayload)
      // IndexedDB返回的数据已经是标准格式
      const adaptedTask = {
        ...updatedTask,
        createdAt: updatedTask.createdAt || updatedTask.created_at,
        updatedAt: updatedTask.updatedAt || updatedTask.updated_at
      }
      commit('UPDATE_TASK', adaptedTask)
      commit('SET_ERROR', null)
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async deleteTask({ commit }, { id, source }) {
    commit('SET_LOADING', true)
    try {
      await taskApi.deleteTask(id)
      commit('DELETE_TASK', { id, source })
      commit('SET_ERROR', null)
    } catch (error) {
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async toggleTask({ state, dispatch }, { id, source }) {
    const list = source === 'local' ? state.localTasks : state.chatTasks
    const task = list.find(t => t.id === id)
    if (task) {
      const updatedTask = { ...task, done: !task.done }
      await dispatch('updateTask', updatedTask)
    }
  },

  /**
   * 启动轮询，定期从边缘函数获取新消息
   */
  startPolling({ commit, dispatch }, interval = 30000) {
    // 清除已有轮询
    dispatch('stopPolling')
    
    // 立即执行一次
    dispatch('pollNewMessages')
    
    // 设置定时轮询
    const pollInterval = setInterval(() => {
      dispatch('pollNewMessages')
    }, interval)
    
    commit('SET_POLLING_INTERVAL', pollInterval)
    console.log('✅ 轮询已启动，间隔:', interval, 'ms')
  },

  /**
   * 停止轮询
   */
  stopPolling({ commit, state }) {
    if (state.pollingInterval) {
      clearInterval(state.pollingInterval)
      commit('SET_POLLING_INTERVAL', null)
      console.log('⏹️ 轮询已停止')
    }
  },

  /**
   * 轮询新消息
   */
  async pollNewMessages({ commit, dispatch, state }) {
    try {
      const lastPollTime = state.lastPollTime || new Date().toISOString()
      const messages = await fetchNewMessages(lastPollTime)
      
      if (messages && messages.length > 0) {
        console.log(`📨 收到 ${messages.length} 条新消息`)
        
        // 处理每条消息
        for (const message of messages) {
          await dispatch('processMessage', message)
          // 标记消息已处理
          await markMessageProcessed(message.id)
        }
      }
      
      // 更新最后轮询时间
      commit('SET_LAST_POLL_TIME', new Date().toISOString())
    } catch (error) {
      console.error('轮询消息失败:', error)
    }
  },

  /**
   * 处理新消息，提取任务信息
   */
  async processMessage({ dispatch }, message) {
    try {
      const content = message.content || ''
      
      // 使用AI判断是否为任务消息并提取信息
      const taskInfo = await isTaskMessage(content)
      if (!taskInfo || !taskInfo.is_task) {
        console.log('ℹ️ 消息不是任务，跳过:', content.substring(0, 50))
        return
      }
      
      // 创建任务
      const task = {
        source: message.type === 'GROUP_AT_MESSAGE_CREATE' ? 'qq_group' : 'qq_private',
        title: taskInfo.title || content.substring(0, 50),
        detail: taskInfo.detail || content,
        deadline: taskInfo.deadline || null,
        done: false,
        from: {
          platform: 'qq',
          groupId: message.groupOpenid || null,
          sender: message.memberNickname || message.userNickname || '未知用户'
        }
      }
      
      // 保存到IndexedDB
      const savedTask = await addTask(task)
      
      // 添加到Vuex状态
      dispatch('fetchTasks', 'all')
      
      console.log('✅ 任务已提取并保存:', savedTask.id, savedTask.title)
    } catch (error) {
      console.error('处理消息失败:', error)
    }
  }
}

const getters = {
  allTasks: state => [...state.localTasks, ...state.chatTasks],
  localTasks: state => state.localTasks,
  chatTasks: state => state.chatTasks,
  pendingTasks: state => {
    const all = [...state.localTasks, ...state.chatTasks]
    return all.filter(t => !t.done)
  },
  completedTasks: state => {
    const all = [...state.localTasks, ...state.chatTasks]
    return all.filter(t => t.done)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

