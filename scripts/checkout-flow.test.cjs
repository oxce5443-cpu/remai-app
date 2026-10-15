const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

test('checkout requires a new confirmation before debiting a changed server amount', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../小程序前端/pages/pay/pay.vue'), 'utf8')
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  let debits = 0
  const store = { state: { token: 'test-user', orderType: 'takein', address: {}, store: {} }, commit() {}, async dispatch() {} }
  const context = {
    ref: value => ({ value }), computed: getter => ({ get value() { return getter() } }),
    useStore: () => store, onLoad() {}, t: value => value,
    getCheckoutIntent: () => ({ key: 'checkout-test-key-1234' }), rememberCheckoutOrder() {}, clearCheckoutIntent() {},
    api: {
      async createOrder() { return { orderId: 'order1', status: 'pending' } },
      async getOrderDetail() { return { _id: 'order1', status: 'pending', type: 'takein', totalPrice: 22, goodsList: [{ goodsId: 'bread', goodsName: '面包', price: 22, num: 1 }], cutleryCount: 0 } },
      async balancePay() { debits += 1 }
    },
    uni: { getStorageSync: () => 0, setStorageSync() {}, showLoading() {}, hideLoading() {}, showToast() {},
      async showModal() { return { confirm: false } }, navigateTo() {}, reLaunch() {} },
    setTimeout() {}, console
  }
  vm.runInNewContext(script + '\nglobalThis.page = { cart, form, pay, existingOrder, amount };', context)
  context.page.cart.value = [{ id: 'bread', name: '面包', price: 18, number: 1 }]
  context.page.form.value.payMethod = 'balance'
  await context.page.pay()
  assert.equal(debits, 0, 'a changed amount must not be debited after confirmation was declined')
  assert.equal(context.page.amount.value, '22.00', 'checkout should show the authoritative server amount for review')
})
