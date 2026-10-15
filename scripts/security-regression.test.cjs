'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const root = path.resolve(__dirname, '..')
const cf = path.join(root, '小程序前端/uniCloud-aliyun/cloudfunctions')
function load(name, { tokenPayload = { errCode: 0, uid: 'customer' }, env = {}, database } = {}) {
  let touched = 0
  const db = database || { command: {}, collection() { touched++; throw new Error('DATABASE_TOUCHED') } }
  const sandbox = {
    exports: {}, Buffer, Date, console: { log() {}, warn() {}, error() {} },
    process: { env }, uniCloud: { database: () => db },
    require(name) {
      if (name === 'uni-id-common') return { createInstance: () => ({ checkToken: async () => tokenPayload }) }
      if (name === 'crypto') return require('node:crypto')
      if (name === 'uni-config-center') throw new Error('not installed in isolated test')
      throw new Error('unexpected dependency: ' + name)
    }
  }
  vm.runInNewContext(fs.readFileSync(path.join(cf, name, 'index.js'), 'utf8'), sandbox)
  return { main: sandbox.exports.main, touched: () => touched }
}
const restricted = {
  order: ['adminGetOrders', 'adminUpdateStatus'],
  member: ['changePoints', 'changeBalance', 'adminGetMembers', 'adminChangePoints', 'adminChangeBalance'],
  goods: ['addCategory', 'updateCategory', 'deleteCategory', 'addGoods', 'updateGoods', 'deleteGoods', 'getAllGoods'],
  banner: ['getAllBanners', 'addBanner', 'updateBanner', 'deleteBanner'],
  store: ['updateStore'],
  card: ['adminGetPackages', 'addPackage', 'updatePackage', 'deletePackage'],
  coupon: ['adminGetCoupons', 'addCoupon', 'updateCoupon', 'deleteCoupon'],
  points: ['adminGetGoods', 'addGoods', 'updateGoods', 'deleteGoods'],
  QRcode: ['generateQRCode', 'getQRCodeList', 'getQRCodes']
}
for (const [name, actions] of Object.entries(restricted)) {
  for (const action of actions) {
    for (const authenticated of [false, true]) test(`${name}.${action}: denies ${authenticated ? 'customer' : 'anonymous'} before DB access`, async () => {
      const fn = load(name)
      const result = await fn.main({ action, uniIdToken: authenticated ? 'customer-token' : '' }, {})
      assert.equal(result.errCode, 'UNAUTHORIZED')
      assert.equal(fn.touched(), 0)
    })
  }
}
test('card.recharge: cannot credit balance without verified payment', async () => {
  const fn = load('card')
  const result = await fn.main({ action: 'recharge', package_id: 'package', uniIdToken: 'customer' }, {})
  assert.equal(result.errCode, 'RECHARGE_NOT_AVAILABLE')
  assert.equal(fn.touched(), 0)
})
test('order: rejects invalid quantities before writes', async () => {
  for (const num of [0, -1, 1.5, NaN, Infinity]) {
    const fn = load('order')
    const result = await fn.main({ action: 'createOrder', type: 'takein', goods_list: [{ goods_id: 'g', num }], uniIdToken: 'customer' }, {})
    assert.equal(result.errCode, 'INVALID_NUM')
    assert.equal(fn.touched(), 0)
  }
})
test('order: rejects invalid cutlery before writes', async () => {
  const fn = load('order')
  const result = await fn.main({ action: 'createOrder', type: 'takein', cutlery_count: -1, goods_list: [{ goods_id: 'g', num: 1 }], uniIdToken: 'customer' }, {})
  assert.equal(result.errCode, 'INVALID_CUTLERY')
  assert.equal(fn.touched(), 0)
})
module.exports = { load }
test('cart cloud roundtrip: preserves optional English display snapshot without changing business fields', async () => {
  let rows = []
  const database = { collection() { return {
    where(filter) { const query = { async remove() { rows = rows.filter(row => row.member_id !== filter.member_id) }, orderBy() { return query }, async get() { return { data: rows.filter(row => Object.entries(filter).every(([key, value]) => row[key] === value)) } } }; return query },
    async add(data) { rows.push({ ...data, _id: 'cart-' + rows.length }); return { id: rows.at(-1)._id } },
    doc(id) { return { async update(data) { Object.assign(rows.find(row => row._id === id), data) } } }
  } } }
  const fn = load('cart', { database })
  const auth = { uniIdToken: 'customer' }
  const item = { goods_id: 'bread', goods_name: '面包', goods_name_en: 'Bread', price: 18, number: 2 }
  await fn.main({ ...auth, action: 'syncCart', items: [item] }, {})
  let result = await fn.main({ ...auth, action: 'getCart' }, {})
  assert.equal(result.data[0].goods_name_en, 'Bread')
  assert.equal(result.data[0].goods_name, '面包')
  assert.equal(result.data[0].price, 18)
  assert.equal(result.data[0].number, 2)
  await fn.main({ ...auth, action: 'clearCart' }, {})
  await fn.main({ ...auth, action: 'addToCart', ...item }, {})
  result = await fn.main({ ...auth, action: 'getCart' }, {})
  assert.equal(result.data[0].goods_name_en, 'Bread')
})
test('cart store sync and reload: maps English display name at both API boundaries', async () => {
  let submitted
  const source = fs.readFileSync(path.join(root, '小程序前端/store/index.js'), 'utf8').replace(/^import .*$/gm, '').replace('export default store', 'globalThis.result = store')
  const sandbox = { createStore: definition => definition, request: async () => ({}), api: {
    async syncCart(data) { submitted = data },
    async getCart() { return [{ goodsId: 'bread', goodsName: '面包', goodsNameEn: 'Bread', price: 18, number: 2 }] }
  }, uni: { getStorageSync: () => '', $on() {} }, console }
  vm.runInNewContext(source, sandbox)
  const definition = sandbox.result
  const state = { token: 'customer', cart: [{ id: 'bread', name: '面包', nameEn: 'Bread', price: 18, number: 2 }] }
  await definition.actions.syncCart({ state })
  assert.equal(submitted.items[0].goodsNameEn, 'Bread')
  let restored
  await definition.actions.loadCart({ state, commit(name, data) { restored = data } })
  assert.equal(restored[0].nameEn, 'Bread')
  assert.equal(restored[0].name, '面包')
  assert.equal(restored[0].price, 18)
  assert.equal(restored[0].number, 2)
})
test('menu contract: preserves authoritative price, sold-out stock, descriptions and optional translations', async () => {
  const records = {
    'goods-category': [{ _id: 'cat_signature', name: '面包', name_en: 'Bread', sort: 0, is_show: true }],
    goods: [{ _id: 'bread', category_id: 'cat_signature', name: '牛角包', name_en: 'Croissant', description: '新鲜烘焙', description_en: 'Freshly baked', price: 18, original_price: 20, stock: 0, sales: 12, image: '/bread.png', is_sell: true }]
  }
  const database = { collection(name) { const query = { where() { return query }, orderBy() { return query }, async get() { return { data: records[name] } } }; return query } }
  const result = await load('goods', { database }).main({ action: 'getMenuData' }, {})
  const category = result.data[0]
  const product = category.goods_list[0]
  assert.equal(product.price, 18)
  assert.equal(product.stock, 0)
  assert.equal(product.content, '新鲜烘焙')
  assert.equal(product.sales, 12)
  assert.equal(product.original_price, 20)
  assert.equal(category.name_en, 'Bread')
  assert.equal(product.name_en, 'Croissant')
  assert.equal(product.content_en, 'Freshly baked')
})
const crypto = require('node:crypto')
const salt = crypto.randomBytes(32).toString('hex')
const adminEnv = {
  ADMIN_USERNAME: 'test-admin', ADMIN_PASSWORD_SALT: salt,
  ADMIN_PASSWORD_HASH: crypto.scryptSync('test-password', salt, 64).toString('hex'),
  ADMIN_TOKEN_SECRET: crypto.randomBytes(32).toString('hex')
}
test('admin catalogue writes: retain optional English content and preserve explicit zero stock', async () => {
  const saved = []
  const database = { command: {}, collection(name) { return {
    async add(data) { saved.push({ name, data }); return { id: 'new' } },
    doc(id) { return { async update(data) { saved.push({ name, id, data }); return { updated: 1 } } } }
  } } }
  const fn = load('admin', { env: adminEnv, database })
  const auth = await fn.main({ action: 'login', username: 'test-admin', password: 'test-password' })
  for (const action of ['addGoods', 'updateGoods']) {
    await fn.main({ action, admin_token: auth.data.token, id: 'bread', name: '面包', name_en: 'Bread', description_en: 'Baked today', stock: 0 })
    const record = saved.at(-1)
    assert.equal(record.data.name_en, 'Bread')
    assert.equal(record.data.description_en, 'Baked today')
    assert.equal(record.data.stock, 0)
  }
  for (const action of ['addCategory', 'updateCategory']) {
    await fn.main({ action, admin_token: auth.data.token, id: 'category', name: '面包', name_en: 'Bread' })
    assert.equal(saved.at(-1).data.name_en, 'Bread')
  }
  for (const action of ['addBanner', 'updateBanner']) {
    await fn.main({ action, admin_token: auth.data.token, id: 'banner', title: '新鲜烘焙', title_en: 'Freshly baked' })
    assert.equal(saved.at(-1).data.title_en, 'Freshly baked')
  }
  await fn.main({ action: 'updateGoods', admin_token: auth.data.token, id: 'bread', name: '原文' })
  assert.equal(Object.hasOwn(saved.at(-1).data, 'name_en'), false)
  await fn.main({ action: 'updateGoods', admin_token: auth.data.token, id: 'bread', name_en: '', description_en: '' })
  assert.equal(saved.at(-1).data.name_en, '')
  assert.equal(saved.at(-1).data.description_en, '')
})
test('admin login: scrypt password verification and signed 24h token', async () => {
  const fn = load('admin', { env: adminEnv })
  const bad = await fn.main({ action: 'login', username: 'test-admin', password: 'wrong' })
  assert.equal(bad.errCode, 'AUTH_FAILED')
  const good = await fn.main({ action: 'login', username: 'test-admin', password: 'test-password' })
  assert.equal(good.errCode, 0)
  const [encoded, sig] = good.data.token.split('.')
  assert.equal(sig, crypto.createHmac('sha256', adminEnv.ADMIN_TOKEN_SECRET).update(encoded).digest('hex'))
  const payload = JSON.parse(Buffer.from(encoded, 'base64'))
  assert.equal(payload.username, 'test-admin')
  assert.equal(payload.expire - payload.timestamp, 86400000)
  assert.equal(fn.touched(), 0)
})
test('admin: rejects malformed, tampered and expired tokens', async () => {
  const fn = load('admin', { env: adminEnv })
  const signed = (payload) => {
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
    return encoded + '.' + crypto.createHmac('sha256', adminEnv.ADMIN_TOKEN_SECRET).update(encoded).digest('hex')
  }
  for (const token of ['', 'malformed', signed({ username: 'other', expire: Date.now() + 1000 }), signed({ username: 'test-admin', expire: 1 }), signed({ username: 'test-admin' }), signed({ username: 'test-admin', expire: Date.now() + 1000 }) + '.extra']) {
    const result = await fn.main({ action: 'getOrders', admin_token: token })
    assert.equal(result.errCode, 'UNAUTHORIZED')
  }
  assert.equal(fn.touched(), 0)
})
test('admin: cannot mark unpaid orders paid or refunded', async () => {
  let writes = 0
  const db = { command: {}, collection: () => ({ doc: () => ({ get: async () => ({ data: [{ _id: 'o', status: 'pending' }] }), update: async () => { writes++; return { updated: 1 } } }) }) }
  const fn = load('admin', { env: adminEnv, database: db })
  const auth = await fn.main({ action: 'login', username: 'test-admin', password: 'test-password' })
  for (const status of ['paid', 'refunded', 'completed', 'processing']) {
    const result = await fn.main({ action: 'updateOrderStatus', order_id: 'o', status, admin_token: auth.data.token })
    assert.equal(result.errCode, 'INVALID_TRANSITION')
  }
  assert.equal(writes, 0)
})
const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const payEnv = { WX_APPID: 'test-app', WXPAY_MCH_ID: 'test-mch', WXPAY_APIV3_KEY: crypto.randomBytes(16).toString('hex'), WXPAY_PLATFORM_PUBLIC_KEY_ID: 'PUB_KEY_ID_test', WXPAY_PLATFORM_PUBLIC_KEY: keys.publicKey.export({ type: 'spki', format: 'pem' }) }
function notify(payment, { timestamp = String(Math.floor(Date.now() / 1000)), base64 = false } = {}) {
  const nonce = 'testnonce123'
  const associated = 'transaction'
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(payEnv.WXPAY_APIV3_KEY), Buffer.from(nonce))
  cipher.setAAD(Buffer.from(associated))
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payment)), cipher.final(), cipher.getAuthTag()]).toString('base64')
  const raw = JSON.stringify({ resource: { ciphertext: encrypted, nonce, associated_data: associated } })
  const signature = crypto.sign('RSA-SHA256', Buffer.from(`${timestamp}\ntestnonce\n${raw}\n`), keys.privateKey).toString('base64')
  return { httpMethod: 'POST', headers: { 'Wechatpay-Timestamp': timestamp, 'Wechatpay-Nonce': 'testnonce', 'Wechatpay-Serial': payEnv.WXPAY_PLATFORM_PUBLIC_KEY_ID, 'Wechatpay-Signature': signature }, body: base64 ? Buffer.from(raw).toString('base64') : raw, isBase64Encoded: base64 }
}
test('pay HTTP: rejects absent/invalid signatures without DB access', async () => {
  const fn = load('pay', { env: payEnv })
  const result = await fn.main({ httpMethod: 'POST', body: '{}', headers: {} }, {})
  assert.equal(result.statusCode, 500)
  assert.equal(fn.touched(), 0)
  assert.equal((await fn.main({ httpMethod: 'GET' })).statusCode, 405)
})
test('pay HTTP: decrypts signed base64 body and validates merchant identity', async () => {
  const fn = load('pay', { env: payEnv })
  const result = await fn.main(notify({ trade_state: 'SUCCESS', out_trade_no: 'o', transaction_id: 'tx', appid: 'wrong', mchid: payEnv.WXPAY_MCH_ID, amount: { total: 100, currency: 'CNY' } }, { base64: true }))
  assert.equal(result.statusCode, 500)
  assert.equal(fn.touched(), 0)
})
test('pay HTTP: rejects replay timestamp before DB access', async () => {
  const fn = load('pay', { env: payEnv })
  const result = await fn.main(notify({ trade_state: 'SUCCESS' }, { timestamp: '1' }))
  assert.equal(result.statusCode, 500)
  assert.equal(fn.touched(), 0)
})
test('pay HTTP: verified non-success event acknowledges without payment mutation', async () => {
  const fn = load('pay', { env: payEnv })
  const result = await fn.main(notify({ trade_state: 'CLOSED' }))
  assert.equal(result.statusCode, 204)
  assert.equal(fn.touched(), 0)
})
test('order: stores explicit no-cutlery and cutlery count using server price', async () => {
  for (const cutlery_count of [0, 2]) {
    const db = creationDatabase()
    const fn = load('order', { database: db })
    const result = await fn.main({ action: 'createOrder', type: 'takein', request_key: 'test_cutlery_request', uniIdToken: 'customer', cutlery_count, goods_list: [{ goods_id: 'g', num: 2, price: 0.01 }] }, {})
    assert.equal(result.errCode, 0)
    const order = db.inspect().orders[result.data.order_id]
    assert.equal(order.cutlery_count, cutlery_count)
    assert.equal(order.total_price, '36.00')
  }
})
test('schema: server-owned collections deny client writes and session reads', () => {
  for (const filename of fs.readdirSync(path.join(cf, '..', 'database')).filter(x => x.endsWith('.schema.json'))) {
    const schema = JSON.parse(fs.readFileSync(path.join(cf, '..', 'database', filename)))
    for (const operation of ['create', 'update', 'delete']) assert.equal(schema.permission[operation], false, filename + ':' + operation)
  }
  const users = JSON.parse(fs.readFileSync(path.join(cf, '..', 'database', 'uni-id-users.schema.json')))
  for (const field of ['token', 'weixin', 'wx_openid', 'wx_unionid']) assert.equal(users.properties[field].permission.read, false)
})
test('real uni-id-common: revoked tokens and banned accounts fail immediately', async () => {
  const user = { _id: 'u', role: [], status: 0, token: [] }
  const config = { tokenSecret: crypto.randomBytes(32).toString('hex'), tokenExpiresIn: 7200, tokenExpiresThreshold: 1200 }
  const database = { command: {}, collection: () => ({ doc: () => ({ get: async () => ({ data: [user] }), update: async data => { Object.assign(user, data); return { updated: 1 } } }) }) }
  const sandbox = { module: { exports: {} }, exports: {}, Buffer, console, uniCloud: { database: () => database, initI18n: () => ({ locale: 'zh-Hans', t: key => key }) }, require: name => {
    if (name === 'crypto') return crypto
    if (name === 'uni-config-center') return () => ({ hasFile: filename => filename === 'config.json', config: () => config })
    throw new Error('unexpected module')
  } }
  sandbox.require.resolve = () => { throw new Error('no optional language file') }
  vm.runInNewContext(fs.readFileSync(path.join(cf, 'common/uni-id-common/index.js'), 'utf8'), sandbox)
  const instance = sandbox.module.exports.createInstance({ clientInfo: { appId: 'test', platform: 'mp-weixin', locale: 'zh-Hans' } })
  const created = await instance.createToken({ uid: 'u' })
  assert.equal(created.errCode, 0)
  assert.equal((await instance.checkToken(created.token, { autoRefresh: false })).uid, 'u')
  user.token = []
  assert.equal((await instance.checkToken(created.token, { autoRefresh: false })).errCode, 'uni-id-check-token-failed')
  user.token = [created.token]; user.status = 1
  assert.equal((await instance.checkToken(created.token, { autoRefresh: false })).errCode, 'uni-id-account-banned')
})
test('cloud package entrypoints and shared module dependencies exist', () => {
  for (const name of fs.readdirSync(cf).filter(name => name !== 'common')) {
    const packagePath = path.join(cf, name, 'package.json')
    if (!fs.existsSync(packagePath)) continue
    const pkg = JSON.parse(fs.readFileSync(packagePath))
    assert.ok(fs.existsSync(path.join(cf, name, pkg.main)), name + ' main')
    for (const value of Object.values(pkg.dependencies || {})) if (value.startsWith('file:')) assert.ok(fs.existsSync(path.resolve(cf, name, value.slice(5))), name + ' file dependency')
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(cf, 'common/uni-id-common/package.json')))
  assert.ok(fs.existsSync(path.resolve(cf, 'common/uni-id-common', pkg.dependencies['uni-config-center'].slice(5))))
})
test('config center: requires environment signing key, has no built-in fallback', () => {
  const directory = path.join(cf, 'common/uni-config-center')
  function center(env) {
    const sandbox = { module: { exports: {} }, exports: {}, __dirname: directory, process: { env }, require }
    vm.runInNewContext(fs.readFileSync(path.join(directory, 'index.js'), 'utf8'), sandbox)
    return sandbox.module.exports({ pluginId: 'uni-id' })
  }
  assert.throws(() => center({}).config(), /UNI_ID_TOKEN_SECRET/)
  const secret = crypto.randomBytes(32).toString('hex')
  assert.equal(center({ UNI_ID_TOKEN_SECRET: secret }).config().tokenSecret, secret)
})
function transactionalDatabase({ failCollection = '', failWriteNumber = 1, initialState } = {}) {
  let version = 0
  let selectedWrites = 0
  let state = {
    orders: { o: { _id: 'o', order_no: 'ORD-test', member_id: 'customer', status: 'pending', total_price: 36, inventory_deducted: false } },
    'order-goods': { l1: { _id: 'l1', order_id: 'o', goods_id: 'g', num: 1 }, l2: { _id: 'l2', order_id: 'o', goods_id: 'g', num: 1 } },
    goods: { g: { _id: 'g', stock: 10, sales: 0, is_sell: true } },
    'uni-id-users': { customer: { _id: 'customer', points: 0, balance: 100 } },
    'points-log': {}, 'recharge-log': {}
  }
  if (initialState) state = JSON.parse(JSON.stringify(initialState))
  const clone = value => JSON.parse(JSON.stringify(value))
  function collection(data, name, transactional) {
    return {
      where(filter) { return { limit() { return this }, get: async () => ({ data: Object.values(data[name] || {}).filter(row => Object.entries(filter).every(([key, value]) => row[key] === value)).map(clone) }) } },
      doc(id) { return {
        get: async () => ({ data: transactional ? clone(data[name][id] || null) : data[name][id] ? [clone(data[name][id])] : [] }),
        update: async patch => { if (name === failCollection) throw new Error('injected-write-failure'); Object.assign(data[name][id], clone(patch)); return { updated: 1 } }
      } },
      add: async row => { if (name === failCollection && ++selectedWrites === failWriteNumber) throw new Error('injected-write-failure'); const id = row._id || 'generated_' + Object.keys(data[name]).length; if (data[name][id]) throw new Error('duplicate ID'); data[name][id] = clone({ ...row, _id: id }); return { id } }
    }
  }
  return {
    command: {}, collection: name => collection(state, name, false), inspect: () => clone(state),
    async startTransaction() {
      const startVersion = version
      const draft = clone(state)
      return { collection: name => collection(draft, name, true), commit: async () => { if (version !== startVersion) throw new Error('transaction-conflict'); state = draft; version++ }, rollback: async () => {} }
    }
  }
}
function creationDatabase(options = {}) {
  return transactionalDatabase({ ...options, initialState: {
    orders: {}, 'order-goods': {}, goods: {
      g: { _id: 'g', name: '面包', name_en: 'Bread', price: 18, stock: 10, is_sell: true },
      h: { _id: 'h', name: '牛角包', price: 8, stock: 4, is_sell: true }
    }
  } })
}
const creationRequest = { action: 'createOrder', type: 'takein', request_key: 'checkout_request_12345', uniIdToken: 'customer', cutlery_count: 0, goods_list: [{ goods_id: 'g', num: 2 }, { goods_id: 'h', num: 1 }] }
test('order cancellation: conditional update preserves payment winning after pending read', async () => {
  const actual = { _id: 'cancel-order', member_id: 'customer', status: 'pending', inventory_deducted: false }
  let writes = 0
  const database = { collection(name) {
    assert.equal(name, 'orders')
    return {
      doc() { return {
        async get() { const snapshot = { ...actual }; actual.status = 'paid'; actual.inventory_deducted = true; return { data: [snapshot] } },
        async update(patch) { writes++; Object.assign(actual, patch); return { updated: 1 } }
      } },
      where(filter) { return { async update(patch) { if (!Object.entries(filter).every(([key, value]) => actual[key] === value)) return { updated: 0 }; writes++; Object.assign(actual, patch); return { updated: 1 } } } }
    }
  } }
  const result = await load('order', { database }).main({ action: 'cancelOrder', order_id: actual._id, uniIdToken: 'customer' }, {})
  assert.equal(result.errCode, 'ORDER_STATE_CHANGED')
  assert.equal(actual.status, 'paid')
  assert.equal(actual.inventory_deducted, true)
  assert.equal(writes, 0)
})
test('order cancellation: normal pending cancellation is owner scoped and does not mutate stock', async () => {
  const order = { _id: 'cancel-order', member_id: 'customer', status: 'pending', inventory_deducted: false }
  const database = { collection(name) { assert.equal(name, 'orders'); return {
    doc() { return { async get() { return { data: [{ ...order }] } }, async update(patch) { Object.assign(order, patch); return { updated: 1 } } } },
    where(filter) { return { async update(patch) { assert.equal(filter.member_id, 'customer'); assert.equal(filter.status, 'pending'); assert.equal(filter._id, order._id); Object.assign(order, patch); return { updated: 1 } } } }
  } } }
  const result = await load('order', { database }).main({ action: 'cancelOrder', order_id: order._id, uniIdToken: 'customer' }, {})
  assert.equal(result.errCode, 0)
  assert.equal(order.status, 'cancelled')
})
test('order cancellation: inconsistent previously settled pending record requires reconciliation', async () => {
  let writes = 0
  const database = { collection() { return { doc() { return {
    async get() { return { data: [{ _id: 'legacy', member_id: 'customer', status: 'pending', inventory_deducted: true }] } },
    async update() { writes++; return { updated: 1 } }
  } }, where() { return { async get() { return { data: [] } }, async update() { writes++; return { updated: 1 } } } } } } }
  const result = await load('order', { database }).main({ action: 'cancelOrder', order_id: 'legacy', uniIdToken: 'customer' }, {})
  assert.equal(result.errCode, 'ORDER_RECONCILIATION_REQUIRED')
  assert.equal(writes, 0)
})
test('order creation: commits complete lines once and replays same owner key', async () => {
  const database = creationDatabase()
  const fn = load('order', { database })
  const first = await fn.main(creationRequest, {})
  assert.equal(first.errCode, 0)
  const second = await fn.main(creationRequest, {})
  assert.equal(second.data.order_id, first.data.order_id)
  const state = database.inspect()
  assert.equal(Object.keys(state.orders).length, 1)
  assert.equal(Object.keys(state['order-goods']).length, 2)
  const order = state.orders[first.data.order_id]
  assert.equal(order.creation_complete, true)
  assert.equal(order.line_count, 2)
  assert.equal(Number(order.total_price), 44)
  assert.equal(order.cutlery_count, 0)
  assert.equal(Object.values(state['order-goods'])[0].goods_name_en, 'Bread')
  assert.equal(state.goods.g.stock, 10)
})
test('order creation: line write failure rolls back header and every line', async () => {
  const database = creationDatabase({ failCollection: 'order-goods', failWriteNumber: 2 })
  const before = database.inspect()
  const result = await load('order', { database }).main(creationRequest, {})
  assert.notEqual(result.errCode, 0)
  assert.deepEqual(database.inspect(), before)
})
test('order creation: concurrent duplicate retries produce one complete order', async () => {
  const database = creationDatabase()
  const fn = load('order', { database })
  const results = await Promise.all([fn.main(creationRequest, {}), fn.main(creationRequest, {})])
  assert.ok(results.some(result => result.errCode === 0))
  const replay = await fn.main(creationRequest, {})
  assert.equal(replay.errCode, 0)
  assert.equal(Object.keys(database.inspect().orders).length, 1)
  assert.equal(Object.keys(database.inspect()['order-goods']).length, 2)
})
test('order creation: key reuse with changed payload conflicts; another owner has separate identity', async () => {
  const database = creationDatabase()
  const fn = load('order', { database })
  const first = await fn.main(creationRequest, {})
  const changed = await fn.main({ ...creationRequest, cutlery_count: 2 }, {})
  assert.equal(changed.errCode, 'IDEMPOTENCY_CONFLICT')
  const other = await load('order', { database, tokenPayload: { errCode: 0, uid: 'other' } }).main(creationRequest, {})
  assert.equal(other.errCode, 0)
  assert.notEqual(other.data.order_id, first.data.order_id)
  assert.equal(Object.keys(database.inspect().orders).length, 2)
})
test('order creation: missing request key and unavailable transactions fail before writes', async () => {
  const database = creationDatabase()
  const fn = load('order', { database })
  assert.equal((await fn.main({ ...creationRequest, request_key: '' }, {})).errCode, 'INVALID_REQUEST_KEY')
  const noTransaction = load('order', { database: { collection() { throw new Error('must not write') } } })
  assert.equal((await noTransaction.main(creationRequest, {})).errCode, 'TRANSACTION_UNAVAILABLE')
  assert.equal(Object.keys(database.inspect().orders).length, 0)
})
test('order creation: replay validates line manifest and refuses corrupt records', async () => {
  const database = creationDatabase()
  const fn = load('order', { database })
  const created = await fn.main(creationRequest, {})
  const order = database.inspect().orders[created.data.order_id]
  await database.collection('order-goods').doc(order.line_ids[0]).update({ num: 999 })
  assert.equal((await fn.main(creationRequest, {})).errCode, 'ORDER_INCOMPLETE')
  assert.equal(Object.keys(database.inspect().orders).length, 1)
})
test('order creation: replay after catalogue change returns original amount and checks owner', async () => {
  const database = creationDatabase()
  const fn = load('order', { database })
  const created = await fn.main(creationRequest, {})
  await database.collection('goods').doc('g').update({ price: 90, stock: 0 })
  assert.equal((await fn.main(creationRequest, {})).data.order_id, created.data.order_id)
  assert.equal(Number(database.inspect().orders[created.data.order_id].total_price), 44)
  await database.collection('orders').doc(created.data.order_id).update({ member_id: 'unrelated-owner' })
  assert.equal((await fn.main(creationRequest, {})).errCode, 'UNAUTHORIZED')
})
test('order creation: duplicate product lines cannot exceed combined stock', async () => {
  const database = creationDatabase()
  const result = await load('order', { database }).main({ ...creationRequest, goods_list: [{ goods_id: 'g', num: 6 }, { goods_id: 'g', num: 6 }] }, {})
  assert.equal(result.errCode, 'STOCK_NOT_ENOUGH')
  assert.equal(Object.keys(database.inspect().orders).length, 0)
})
const successfulPayment = { trade_state: 'SUCCESS', out_trade_no: 'ORD-test', transaction_id: 'tx-test', appid: payEnv.WX_APPID, mchid: payEnv.WXPAY_MCH_ID, amount: { total: 3600, currency: 'CNY' } }
test('pay transaction: duplicate callback commits inventory/points/ledger only once', async () => {
  const database = transactionalDatabase()
  const fn = load('pay', { env: payEnv, database })
  for (let i = 0; i < 2; i++) assert.equal((await fn.main(notify(successfulPayment))).statusCode, 204)
  const state = database.inspect()
  assert.equal(state.orders.o.status, 'paid')
  assert.equal(state.orders.o.settlement_complete, true)
  assert.equal(state.goods.g.stock, 8)
  assert.equal(state.goods.g.sales, 2)
  assert.equal(state['uni-id-users'].customer.points, 36)
  assert.equal(Object.keys(state['points-log']).length, 1)
  assert.equal(Object.keys(state['recharge-log']).length, 1)
})
test('pay transaction: ledger failure rolls back every mutation', async () => {
  const database = transactionalDatabase({ failCollection: 'recharge-log' })
  const before = database.inspect()
  const fn = load('pay', { env: payEnv, database })
  assert.equal((await fn.main(notify(successfulPayment))).statusCode, 500)
  assert.deepEqual(database.inspect(), before)
})
test('pay transaction: concurrent callbacks conflict then retry without double settlement', async () => {
  const database = transactionalDatabase()
  const fn = load('pay', { env: payEnv, database })
  const results = await Promise.all([fn.main(notify(successfulPayment)), fn.main(notify(successfulPayment))])
  assert.equal(results.filter(result => result.statusCode === 204).length, 1)
  assert.equal((await fn.main(notify(successfulPayment))).statusCode, 204)
  assert.equal(database.inspect().goods.g.stock, 8)
  assert.equal(Object.keys(database.inspect()['recharge-log']).length, 1)
})
test('balance payment: debit, stock, points and ledger commit once for repeat request', async () => {
  const database = transactionalDatabase()
  const fn = load('pay', { env: payEnv, database })
  for (let i = 0; i < 2; i++) assert.equal((await fn.main({ action: 'balancePay', order_id: 'o', uniIdToken: 'customer' }, {})).errCode, 0)
  const state = database.inspect()
  assert.equal(state['uni-id-users'].customer.balance, 64)
  assert.equal(state.goods.g.stock, 8)
  assert.equal(state['uni-id-users'].customer.points, 36)
})
test('balance payment: failure after debit restores account and inventory', async () => {
  const database = transactionalDatabase({ failCollection: 'orders' })
  const before = database.inspect()
  const fn = load('pay', { database })
  assert.equal((await fn.main({ action: 'balancePay', order_id: 'o', uniIdToken: 'customer' }, {})).errCode, 'PAYMENT_FAILED')
  assert.deepEqual(database.inspect(), before)
})
