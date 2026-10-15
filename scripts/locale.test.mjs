import test from 'node:test'
import assert from 'node:assert/strict'

const values = new Map()
const calls = []
globalThis.uni = {
  getStorageSync: key => values.get(key),
  setStorageSync: (key, value) => values.set(key, value),
  setTabBarItem: options => calls.push(['tab', options]),
  setNavigationBarTitle: options => calls.push(['title', options]),
  showToast: options => calls.push(['toast', options]),
  showModal: options => calls.push(['modal', options]),
  showLoading: options => calls.push(['loading', options]),
  showActionSheet: options => calls.push(['sheet', options])
}
globalThis.getCurrentPages = () => [{ route: 'pages/pay/pay' }]

test('locale controller translates display text and persists only supported languages', async () => {
  const { t, locale, setLocale } = await import('../小程序前端/locale/index.js')
  assert.equal(locale.value, 'zh-CN')
  assert.equal(t('无需餐具'), '无需餐具')
  assert.equal(setLocale('en'), true)
  assert.equal(locale.value, 'en')
  assert.equal(t('无需餐具'), 'No cutlery')
  assert.equal(values.get('remai_locale'), 'en')
  assert.equal(setLocale('invalid'), false)
  assert.equal(locale.value, 'en')
  assert.equal(t(22.5), 22.5)
  assert.equal(t(null), null)
  setLocale('zh-CN')
})

test('merchant English fields are display-only and unapproved content remains intact', async () => {
  const { localized, setLocale } = await import('../小程序前端/locale/index.js')
  const product = { id: 'cake1', name: '草莓蛋糕', nameEn: 'Strawberry cake', price: 22 }
  const before = JSON.stringify(product)
  setLocale('en')
  assert.equal(localized(product, 'name'), 'Strawberry cake')
  assert.equal(localized({ name: '顾客自定义名称' }, 'name'), '顾客自定义名称')
  assert.equal(JSON.stringify(product), before)
  setLocale('zh-CN')
  assert.equal(localized(product, 'name'), '草莓蛋糕')
})

test('switching refreshes native chrome and translates native dialogs without changing callbacks', async () => {
  const { default: plugin, setLocale } = await import('../小程序前端/locale/index.js')
  const app = { config: { globalProperties: {} }, mixin() {} }
  plugin.install(app)
  calls.length = 0
  setLocale('en')
  assert.equal(calls.filter(([type]) => type === 'tab').length, 4)
  assert.ok(calls.some(([type, options]) => type === 'title' && options.title === 'Checkout'))
  const success = () => {}
  uni.showModal({ title: '提示', content: '无需餐具', success })
  const [, options] = calls.find(([type]) => type === 'modal')
  assert.equal(options.content, 'No cutlery')
  assert.equal(options.confirmText, 'OK')
  assert.equal(options.cancelText, 'Cancel')
  assert.equal(options.success, success)
  setLocale('zh-CN')
})

test('a new app instance restores English from storage and supports administration chrome', async () => {
  values.set('remai_locale', 'en')
  const { default: plugin, locale, t, registerMessages, setLocale } = await import('../小程序前端/locale/index.js?restored')
  assert.equal(locale.value, 'en')
  registerMessages({ '订单管理': 'Orders', '非法字典值': 42 })
  assert.equal(t('订单管理'), 'Orders')
  assert.equal(t('非法字典值'), '非法字典值')
  globalThis.getCurrentPages = () => [{ route: 'pages/order/list' }]
  plugin.install({ config: { globalProperties: {} }, mixin() {} }, {
    titles: { 'pages/order/list': '订单管理' }, tabs: ['首页', '商品', '订单', '我的']
  })
  calls.length = 0
  setLocale('en')
  assert.ok(calls.some(([type, options]) => type === 'title' && options.title === 'Orders'))
  setLocale('zh-CN')
})
