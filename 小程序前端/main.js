import { createSSRApp } from 'vue'
import App from './App'
import api from './api'
import util from './common/util'
import store from './store'

export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  app.config.globalProperties.$api = api
  app.config.globalProperties.$util = util

  return {
    app
  }
}

// force hmr full reload
