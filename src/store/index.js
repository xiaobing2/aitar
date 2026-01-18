import Vue from 'vue'
import Vuex from 'vuex'
import taskModule from './modules/tasks'
import settingsModule from './modules/settings'
import plansModule from './modules/plans'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    tasks: taskModule,
    settings: settingsModule,
    plans: plansModule
  }
})

