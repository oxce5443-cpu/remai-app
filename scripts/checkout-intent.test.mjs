import test from 'node:test'
import assert from 'node:assert/strict'

const storage = new Map()
globalThis.uni = {
  getStorageSync: key => storage.get(key),
  setStorageSync: (key, value) => storage.set(key, value),
  removeStorageSync: key => storage.delete(key)
}

test('the same checkout reuses its request key after page/app recreation', async () => {
  const { getCheckoutIntent } = await import('../小程序前端/common/checkout-intent.js')
  const payload = { type: 'takein', cutleryCount: 0, goodsList: [{ goodsId: 'bread', num: 2 }] }
  const first = getCheckoutIntent(payload)
  const { getCheckoutIntent: restored } = await import('../小程序前端/common/checkout-intent.js?restored')
  assert.equal(restored(payload).key, first.key)
  assert.match(first.key, /^[A-Za-z0-9_-]{16,128}$/)
  assert.notEqual(restored({ ...payload, cutleryCount: 2 }).key, first.key)
  assert.equal(payload.cutleryCount, 0)
})

test('only a confirmed matching checkout or cancelled order clears the persisted intent', async () => {
  const { getCheckoutIntent, rememberCheckoutOrder, clearCheckoutIntent } = await import('../小程序前端/common/checkout-intent.js')
  const payload = { goodsList: [{ goodsId: 'bread', num: 2 }] }
  const first = getCheckoutIntent(payload)
  rememberCheckoutOrder(first.key, 'order1')
  clearCheckoutIntent({ orderId: 'another-order' })
  assert.equal(getCheckoutIntent(payload).key, first.key)
  clearCheckoutIntent({ orderId: 'order1' })
  const next = getCheckoutIntent(payload)
  assert.notEqual(next.key, first.key)
  clearCheckoutIntent({ requestKey: next.key })
  assert.notEqual(getCheckoutIntent(payload).key, next.key)
})

test('metadata refresh and intervening drafts preserve an unresolved attempt after restart', async () => {
  const { getCheckoutIntent } = await import('../小程序前端/common/checkout-intent.js')
  const payload = { type: 'takein', goodsList: [{ goodsId: 'retry-bread', num: 1, price: 12, image: 'old' }] }
  const first = getCheckoutIntent(payload)
  const changedMetadata = { ...payload, totalPrice: 30, goodsList: [{ ...payload.goodsList[0], price: 30, image: 'new', goodsName: 'New name' }] }
  assert.equal(getCheckoutIntent(changedMetadata).key, first.key)
  const second = getCheckoutIntent({ ...payload, cutleryCount: 3 })
  assert.notEqual(second.key, first.key)
  const restored = await import('../小程序前端/common/checkout-intent.js?lost-response')
  assert.equal(restored.getCheckoutIntent(changedMetadata).key, first.key)
})
