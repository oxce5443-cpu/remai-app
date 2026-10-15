import { ref } from 'vue'
import english from './en.js'

const STORAGE_KEY = 'remai_locale'
const SUPPORTED = ['zh-CN', 'en']
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key)
let saved
try { saved = uni.getStorageSync(STORAGE_KEY) } catch { /* first launch */ }
export const locale = ref(SUPPORTED.includes(saved) ? saved : 'zh-CN')

// Administration can register its own presentation vocabulary while sharing locale behavior.
export function registerMessages(messages) {
  for (const [key, value] of Object.entries(messages || {})) {
    if (typeof value === 'string') english[key] = value
  }
}

/** Presentation only. Unknown text and non-string business values are preserved. */
export function t(value, params = {}) {
  const language = locale.value
  if (typeof value !== 'string') return value
  const key = value.trim()
  const translated = language === 'en' && has(english, key) ? english[key] : value
  return translated.replace(/\{(\w+)\}/g, (token, name) => has(params, name) ? String(params[name]) : token)
}

/** Prefer merchant-approved English copy without changing the catalogue/cart record. */
export function localized(record, field) {
  if (!record) return ''
  if (locale.value === 'en') {
    const englishValue = record[`${field}En`] || record[`${field}_en`]
    if (typeof englishValue === 'string' && englishValue.trim()) return englishValue
  }
  return t(record[field] ?? '')
}

const titles = {
  'pages/index/index': '热麦',
  'pages/menu/menu': '点餐',
  'pages/take-foods/take-foods': '取餐',
  'pages/mine/mine': '我的',
  'pages/goods/goods': '商品详情',
  'pages/pay/pay': '确认订单',
  'pages/remark/remark': '备注',
  'pages/packages/index': '券包商品',
  'pages/packages/detail': '购买劵包',
  'pages/balance/balance': '会员储值',
  'pages/login/login': '登录',
  'pages/address/address': '我的地址',
  'pages/address/add': '地址',
  'pages/integrals/integrals': '积分商城',
  'pages/attendance/attendance': '签到',
  'pages/orders/orders': '历史订单',
  'pages/orders/detail': '订单详情',
  'pages/mine/member-code': '会员码',
  'pages/coupons/coupons': '我的卡券',
  'pages/mine/userinfo': '用户信息',
  'pages/integrals/flow': '积分明细',
  'pages/integrals/detail': '兑换详情',
  'pages/giftcard/giftcard': '礼品卡',
  'pages/brand/brand': '品牌故事',
  'pages/services/services': '服务',
  'pages/services/help-center': '帮助中心',
  'pages/invoice/invoice': '发票',
  'pages/activities/invite': '邀请好友',
  'pages/review/review': '评价'
}

export function registerPageTitles(overrides) {
  for (const [route, title] of Object.entries(overrides || {})) {
    if (typeof title === 'string') titles[route] = title
  }
}
let tabLabels = ['首页', '点餐', '取餐', '我的']

export function refreshNativeChrome() {
  if (typeof uni === 'undefined') return
  const ignoreUnsupportedPage = () => {}
  tabLabels.forEach((text, index) => {
    uni.setTabBarItem?.({ index, text: t(text), fail: ignoreUnsupportedPage })
  })
  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
  const route = pages[pages.length - 1]?.route
  if (titles[route]) uni.setNavigationBarTitle?.({ title: t(titles[route]), fail: ignoreUnsupportedPage })
}

export function setLocale(value) {
  if (!SUPPORTED.includes(value)) return false
  locale.value = value
  // #ifdef H5
  if (typeof document !== 'undefined') document.documentElement.lang = value
  // #endif
  try { uni.setStorageSync(STORAGE_KEY, value) } catch { /* switch works even if storage is full */ }
  refreshNativeChrome()
  return true
}

let nativeInstalled = false
function installNativeMessages() {
  if (nativeInstalled || typeof uni === 'undefined') return
  nativeInstalled = true
  const fields = {
    showToast: ['title'], showLoading: ['title'],
    showModal: ['title', 'content', 'confirmText', 'cancelText'],
    showActionSheet: ['itemList'], setNavigationBarTitle: ['title']
  }
  for (const [method, keys] of Object.entries(fields)) {
    if (typeof uni[method] !== 'function') continue
    const original = uni[method].bind(uni)
    uni[method] = (options = {}) => {
      const next = { ...options }
      if (method === 'showModal') {
        next.confirmText ??= '确定'
        next.cancelText ??= '取消'
      }
      for (const key of keys) {
        if (Array.isArray(next[key])) next[key] = next[key].map(item => t(item))
        else if (typeof next[key] === 'string') next[key] = t(next[key])
      }
      return original(next)
    }
  }
}

export default {
  install(app, options = {}) {
    if (options.titles) registerPageTitles(options.titles)
    if (Array.isArray(options.tabs) && options.tabs.length === 4 && options.tabs.every(text => typeof text === 'string')) tabLabels = [...options.tabs]
    // #ifdef H5
    if (typeof document !== 'undefined') document.documentElement.lang = locale.value
    // #endif
    app.config.globalProperties.$t = t
    app.config.globalProperties.$localized = localized
    // CSS env(safe-area-inset-top) can be zero inside the WeChat WebView.
    let windowInfo = {}
    try { windowInfo = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync() } catch { /* unsupported host */ }
    app.config.globalProperties.$safeTop = Number(windowInfo.statusBarHeight) || 0
    let menuBottom = 0
    try { menuBottom = uni.getMenuButtonBoundingClientRect?.().bottom || 0 } catch { /* H5 has no native capsule */ }
    app.config.globalProperties.$menuButtonGap = Math.max(0, menuBottom - (Number(windowInfo.statusBarHeight) || 0))
    installNativeMessages()
    app.mixin({ onShow: refreshNativeChrome })
  }
}
