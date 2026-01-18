import { openDB } from 'idb'

const DB_NAME = 'aitag_db'
const DB_VERSION = 2

// 数据库初始化
export async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      console.log(`🔄 数据库升级: ${oldVersion} -> ${newVersion}`)
      
      // 任务表
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' })
        taskStore.createIndex('source', 'source')
        taskStore.createIndex('done', 'done')
        taskStore.createIndex('deadline', 'deadline')
        taskStore.createIndex('createdAt', 'createdAt')
        console.log('✅ 创建 tasks 表')
      }
      
      // 配置表
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' })
        console.log('✅ 创建 config 表')
      }
      
      // 监听群组表
      if (!db.objectStoreNames.contains('monitoredGroups')) {
        const groupStore = db.createObjectStore('monitoredGroups', { keyPath: 'id' })
        groupStore.createIndex('group_id', 'group_id')
        groupStore.createIndex('enabled', 'enabled')
        console.log('✅ 创建 monitoredGroups 表')
      }

      // 计划表（AI制定计划）- 版本2新增
      if (!db.objectStoreNames.contains('plans')) {
        const planStore = db.createObjectStore('plans', { keyPath: 'id' })
        planStore.createIndex('done', 'done')
        planStore.createIndex('createdAt', 'createdAt')
        console.log('✅ 创建 plans 表')
      }
    }
  })
  return db
}

// 获取数据库实例（确保数据库已初始化）
let dbInstance = null
export async function getDB() {
  if (!dbInstance) {
    dbInstance = await initDB()
  }
  return dbInstance
}

// 强制重新初始化数据库（用于升级）
export async function resetDB() {
  dbInstance = null
  return await initDB()
}

// ========== 任务操作 ==========

// 获取所有任务
export async function getAllTasks() {
  const db = await getDB()
  return await db.getAll('tasks')
}

// 根据source获取任务
export async function getTasksBySource(source) {
  const db = await getDB()
  const index = db.transaction('tasks').store.index('source')
  return await index.getAll(source)
}

// 添加任务
export async function addTask(task) {
  const db = await getDB()
  const taskData = {
    ...task,
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString()
  }
  await db.put('tasks', taskData)
  return taskData
}

// 更新任务
export async function updateTask(task) {
  const db = await getDB()
  const taskData = {
    ...task,
    updatedAt: new Date().toISOString()
  }
  await db.put('tasks', taskData)
  return taskData
}

// 删除任务
export async function deleteTask(id) {
  const db = await getDB()
  await db.delete('tasks', id)
}

// ========== 配置操作 ==========

// 获取配置
export async function getConfig(key) {
  const db = await getDB()
  const config = await db.get('config', key)
  return config ? config.value : null
}

// 设置配置
export async function setConfig(key, value) {
  const db = await getDB()
  await db.put('config', { key, value })
}

// 删除配置
export async function deleteConfig(key) {
  const db = await getDB()
  await db.delete('config', key)
}

// ========== 监听群组操作 ==========

// 获取所有监听群组
export async function getAllMonitoredGroups() {
  const db = await getDB()
  return await db.getAll('monitoredGroups')
}

// 添加监听群组
export async function addMonitoredGroup(group) {
  const db = await getDB()
  const groupData = {
    ...group,
    id: group.id || `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: group.createdAt || new Date().toISOString(),
    updatedAt: group.updatedAt || new Date().toISOString()
  }
  await db.put('monitoredGroups', groupData)
  return groupData
}

// 更新监听群组
export async function updateMonitoredGroup(group) {
  const db = await getDB()
  const groupData = {
    ...group,
    updatedAt: new Date().toISOString()
  }
  await db.put('monitoredGroups', groupData)
  return groupData
}

// 删除监听群组
export async function deleteMonitoredGroup(id) {
  const db = await getDB()
  await db.delete('monitoredGroups', id)
}

// ========== AI制定计划操作 ==========

// 获取所有计划
export async function getAllPlans() {
  const db = await getDB()
  return await db.getAll('plans')
}

// 添加计划
export async function addPlan(plan) {
  const db = await getDB()
  const planData = {
    ...plan,
    id: plan.id || `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    done: plan.done || false,
    createdAt: plan.createdAt || new Date().toISOString(),
    updatedAt: plan.updatedAt || new Date().toISOString(),
    subtasks: Array.isArray(plan.subtasks) ? plan.subtasks : []
  }
  await db.put('plans', planData)
  return planData
}

// 更新计划
export async function updatePlan(plan) {
  const db = await getDB()
  const planData = {
    ...plan,
    updatedAt: new Date().toISOString()
  }
  await db.put('plans', planData)
  return planData
}

// 删除计划
export async function deletePlan(id) {
  const db = await getDB()
  await db.delete('plans', id)
}
