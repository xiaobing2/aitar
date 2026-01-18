const state = {
  webhookUrl: '',
  enabledPlatforms: {
    qq: false,
    dingtalk: false,
    wechat: false
  },
  selectedGroups: {
    qq: [],
    dingtalk: [],
    wechat: []
  }
}

const mutations = {
  SET_WEBHOOK_URL(state, url) {
    state.webhookUrl = url
  },
  SET_PLATFORM_ENABLED(state, { platform, enabled }) {
    state.enabledPlatforms[platform] = enabled
  },
  SET_SELECTED_GROUPS(state, { platform, groups }) {
    state.selectedGroups[platform] = groups
  }
}

const actions = {
  saveSettings({ state }) {
    localStorage.setItem('glassMemo_settings', JSON.stringify({
      webhookUrl: state.webhookUrl,
      enabledPlatforms: state.enabledPlatforms,
      selectedGroups: state.selectedGroups
    }))
  },

  loadSettings({ commit }) {
    const saved = localStorage.getItem('glassMemo_settings')
    if (saved) {
      const settings = JSON.parse(saved)
      commit('SET_WEBHOOK_URL', settings.webhookUrl || '')
      Object.keys(settings.enabledPlatforms || {}).forEach(platform => {
        commit('SET_PLATFORM_ENABLED', {
          platform,
          enabled: settings.enabledPlatforms[platform]
        })
      })
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

