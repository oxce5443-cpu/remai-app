import { createSSRApp } from 'vue'
import App from './App.vue'
import api from './api'
import util from './common/util'
import store from './store'
import localePlugin from './locale'

export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  app.use(localePlugin)
  app.config.globalProperties.$api = api
  app.config.globalProperties.$util = util

  return {
    app
  }
}

// force hmr full reload
