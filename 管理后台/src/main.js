import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const pinia = createPinia()

export function createApp() {
	const app = createSSRApp(App)

	// 注册 Element Plus 图标
	for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
		app.component(key, component)
	}

	app.use(ElementPlus)
	app.use(pinia)
	return {
		app,
		pinia
	}
}
