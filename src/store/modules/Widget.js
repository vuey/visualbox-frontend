import Vue from 'vue'
import Storage from '@aws-amplify/storage'
import * as t from '@/store/types'
import { API, Zip } from '@/service'
import { cloneDeep } from '@/lib/utils'

const state = {
  list: []
}

const mutations = {
  [t.WIDGET_RESET] (state) {
    state.list = []
    state.public = null
  },
  [t.WIDGET_SET_LIST] (state, payload) {
    state.list = cloneDeep(payload)
  },
  [t.WIDGET_CONCAT_LIST] (state, payload) {
    state.list = state.list.concat(payload)
  },
  [t.WIDGET_DELETE_LIST] (state, id) {
    state.list = state.list.filter(i => i.id !== id)
  },
  [t.WIDGET_COMMIT] (state, project) {
    const index = state.list.findIndex(({ id }) => id === project.id)
    if (index >= 0)
      Vue.set(state.list, index, project)
  },
  [t.WIDGET_CLEAN_DASHBOARD] (state, widgets) {
    // Remove every widget that does not exist in list
    widgets.forEach(w => {
      const index = state.list.findIndex(a => a.id === w.id)
      if (index < 0)
        widgets.splice(index, 1)
    })
  },
  [t.WIDGET_SET_VERSIONS] (state, payload) {
    const index = state.list.findIndex(({ id }) => id === payload.id)
    if (index >= 0)
      Vue.set(state.list[index], 'versions', payload.versions)
  },
  [t.WIDGET_SET_MAPS] (state, payload) {
    let configMap
    try {
      configMap = JSON.parse(payload.configMap)
    } catch (e) {
      configMap = {}
    }

    const index = state.list.findIndex(({ id }) => id === payload.id)
    if (index >= 0) {
      Vue.set(state.list[index], 'configMap', configMap)
      Vue.set(state.list[index], 'sourceMap', payload.sourceMap)
      Vue.set(state.list[index], 'readme', payload.readme)
    }
  }
}

const actions = {
  async list ({ commit }) {
    let result = [] // Default value

    try {
      result = await API.invoke('get', '/widget')
    } catch (e) {
      throw e
    } finally {
      commit(t.WIDGET_SET_LIST, result)
    }
  },
  async create ({ commit }, { id = null, settings = null }) {
    let result = [] // Default value

    try {
      result.push(await API.invoke('post', '/widget', {
        body: { id, settings }
      }))
    } catch (e) {
      throw e
    } finally {
      commit(t.WIDGET_CONCAT_LIST, result)
    }
  },
  async del ({ commit }, id) {
    // Immediately remove widget from local app
    commit(t.WIDGET_DELETE_LIST, id)

    try {
      await API.invoke('del', `/widget/${id}`)
    } catch (e) {
      throw e
    } finally {}
  },

  async commit ({ commit }, project) {
    try {
      commit(t.WIDGET_COMMIT, project)

      const { id } = project
      await API.invoke('put', `/widget/${id}`, { body: project })
    } catch (e) {
      throw e
    }
  },

  async commitFiles ({ commit }, { id, blob }) {
    try {
      // Commit config/source maps
      const configMap = await Zip.readFile('config.json')
      const sourceMap = await Zip.readFile('index.html')
      const readme = await Zip.readFile('README.md')
      commit(t.WIDGET_SET_MAPS, { id, configMap, sourceMap, readme })

      await Storage.put(`${id}.zip`, blob, {
        bucket: process.env.VUE_APP_BUCKET_WIDGET
      })
    } catch (e) {
      throw e
    }
  },

  async signedUrl (_, { id }) {
    try {
      return await Storage.get(`${id}.zip`, {
        bucket: process.env.VUE_APP_BUCKET_WIDGET
      })
    } catch (e) {
      return null
    }
  },

  async publish ({ commit }, id) {
    try {
      const { versions } = await API.invoke('post', '/registry', {
        body: { type: 'WIDGET', id }
      })
      commit(t.WIDGET_SET_VERSIONS, { id, versions })
      commit(`Project/${t.PROJECT_SET_VERSIONS}`, { id, versions }, { root: true })
    } catch (e) {
      throw e
    }
  },

  async depublish ({ commit }, id) {
    try {
      await API.invoke('del', '/registry', {
        body: { type: 'WIDGET', id }
      })
      commit(t.WIDGET_SET_VERSIONS, { id, versions: false })
      commit(`Project/${t.PROJECT_SET_VERSIONS}`, { id, versions: false }, { root: true })
    } catch (e) {
      throw e
    }
  }
}

const getters = {
  /**
   * Get a widget by ID.
   */
  widgetById: ({ list }) => id => {
    return list.find(i => i.id === id)
  },

  /**
   * Get widget config map by ID.
   */
  configMapById: (_, { widgetById }) => id => {
    const widget = widgetById(id)

    if (!widget)
      return null

    return widget.configMap
  },

  /**
   * Get widget source map by ID.
   */
  sourceMapById: (_, { widgetById }) => id => {
    const widget = widgetById(id)

    if (!widget)
      return null

    return widget.sourceMap
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
