import { computed, createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ElementPlus, { provideGlobalConfig } from 'element-plus'
import elementEnglish from 'element-plus/es/locale/lang/en'
import elementChinese from 'element-plus/es/locale/lang/zh-cn'
import localePlugin, { locale, registerMessages } from './locale'
import adminEnglish from './locale/en'
import LanguageSwitch from './components/LanguageSwitch.vue'
import pagesConfig from './pages.json'
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
	registerMessages(adminEnglish)
	app.use(localePlugin, {
		titles: Object.fromEntries(pagesConfig.pages.map(page => [page.path, page.style.navigationBarTitleText])),
		tabs: pagesConfig.tabBar.list.map(tab => tab.text)
	})
	provideGlobalConfig(computed(() => ({ locale: locale.value === 'en' ? elementEnglish : elementChinese })), app, true)
	app.component('LanguageSwitch', LanguageSwitch)
	app.use(pinia)
	return {
		app,
		pinia
	}
}
