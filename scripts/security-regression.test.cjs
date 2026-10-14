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
const crypto = require('node:crypto')
const salt = crypto.randomBytes(32).toString('hex')
const adminEnv = {
  ADMIN_USERNAME: 'test-admin', ADMIN_PASSWORD_SALT: salt,
  ADMIN_PASSWORD_HASH: crypto.scryptSync('test-password', salt, 64).toString('hex'),
  ADMIN_TOKEN_SECRET: crypto.randomBytes(32).toString('hex')
}
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
    const records = []
    const db = { collection(name) { return { doc: () => ({ get: async () => ({ data: [{ name: 'Bread', price: 18, stock: 10, is_sell: true }] }) }), add: async data => { records.push({ name, data }); return { id: 'new-order' } } } } }
    const fn = load('order', { database: db })
    const result = await fn.main({ action: 'createOrder', type: 'takein', uniIdToken: 'customer', cutlery_count, goods_list: [{ goods_id: 'bread', num: 2, price: 0.01 }] }, {})
    assert.equal(result.errCode, 0)
    assert.equal(records.find(r => r.name === 'orders').data.cutlery_count, cutlery_count)
    assert.equal(records.find(r => r.name === 'orders').data.total_price, '36.00')
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
function transactionalDatabase({ failCollection = '' } = {}) {
  let version = 0
  let state = {
    orders: { o: { _id: 'o', order_no: 'ORD-test', member_id: 'customer', status: 'pending', total_price: 36, inventory_deducted: false } },
    'order-goods': { l1: { _id: 'l1', order_id: 'o', goods_id: 'g', num: 1 }, l2: { _id: 'l2', order_id: 'o', goods_id: 'g', num: 1 } },
    goods: { g: { _id: 'g', stock: 10, sales: 0, is_sell: true } },
    'uni-id-users': { customer: { _id: 'customer', points: 0, balance: 100 } },
    'points-log': {}, 'recharge-log': {}
  }
  const clone = value => JSON.parse(JSON.stringify(value))
  function collection(data, name, transactional) {
    return {
      where(filter) { return { limit() { return this }, get: async () => ({ data: Object.values(data[name] || {}).filter(row => Object.entries(filter).every(([key, value]) => row[key] === value)).map(clone) }) } },
      doc(id) { return {
        get: async () => ({ data: transactional ? clone(data[name][id] || null) : data[name][id] ? [clone(data[name][id])] : [] }),
        update: async patch => { if (name === failCollection) throw new Error('injected-write-failure'); Object.assign(data[name][id], clone(patch)); return { updated: 1 } }
      } },
      add: async row => { if (name === failCollection) throw new Error('injected-write-failure'); if (data[name][row._id]) throw new Error('duplicate ID'); data[name][row._id] = clone(row); return { id: row._id } }
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
