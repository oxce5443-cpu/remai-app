const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

function page({ row, error, cart = [] } = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../小程序前端/pages/goods/goods.vue'), 'utf8')
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  const calls = { requested: [], messages: [], commits: [], dispatches: [], storageWrites: [] }
  let load
  const store = { state: { cart }, commit(name, data) { calls.commits.push([name, data]); this.state.cart = data }, dispatch(name) { calls.dispatches.push(name) } }
  const sandbox = {
    ref: value => ({ value }), computed: getter => ({ get value() { return getter() } }),
    onLoad: callback => { load = callback }, store,
    api: { async getGoodsDetail(input) { calls.requested.push(input); if (error) throw error; return row } },
    uni: { getStorageSync: () => cart, setStorageSync: (...args) => calls.storageWrites.push(args), showToast: options => calls.messages.push(options.title), navigateBack() {}, switchTab() {} },
    console
  }
  vm.runInNewContext(script + '\nglobalThis.result = { product, recommendations, currentPrice, totalPrice, quantity, addToCart, increaseQty };', sandbox)
  return { load: options => load(options), state: sandbox.result, calls, store }
}

test('goods detail loads incoming product ID and canonical price instead of demo content', async () => {
  const view = page({ row: { _id: 'actual-bread', name: '原麦面包', nameEn: 'Whole wheat', price: 18, stock: 4, categoryId: 'bread', image: '/actual.png', isSell: true, specs: [] } })
  await view.load({ id: 'actual-bread' })
  assert.equal(view.calls.requested.length, 1)
  assert.equal(view.calls.requested[0].id, 'actual-bread')
  assert.equal(view.state.product.value.id, 'actual-bread')
  assert.equal(view.state.currentPrice.value, 18)
  assert.equal(view.state.recommendations.value.length, 0)
  view.state.addToCart()
  const saved = view.store.state.cart[0]
  assert.equal(saved.id, 'actual-bread')
  assert.equal(saved.cateId, 'bread')
  assert.equal(saved.nameEn, 'Whole wheat')
  assert.equal(saved.price, 18)
  assert.equal(saved.number, 1)
  assert.equal(view.calls.dispatches[0], 'syncCart')
})

test('goods detail cannot add unloaded, unavailable or oversubscribed products', async () => {
  for (const options of [{ error: new Error('offline') }, { row: { _id: 'bread', price: 18, stock: 0, isSell: true } }, { row: { _id: 'bread', price: 18, stock: 3, isSell: false } }, { row: { _id: 'bread', price: 18, stock: 1, isSell: true }, cart: [{ id: 'bread', number: 1 }] }, { row: { _id: 'bread', price: 18, stock: 3, isSell: true, specs: [{ name: 'Size', options: ['Small', 'Large'] }] } }]) {
    const view = page(options)
    view.state.addToCart()
    assert.equal(view.calls.commits.length, 0)
    assert.equal(view.calls.storageWrites.length, 0)
    await view.load({ id: 'bread' })
    view.state.addToCart()
    assert.equal(view.calls.commits.length, 0)
  }
})
