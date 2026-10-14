'use strict'
/**
 * 热麦点餐 · 支付云函数（微信支付 API v3 · JSAPI）
 * -------------------------------------------------
 * 链路：小程序确认订单 → createPayment（统一下单拿 prepay_id + 支付参数）
 *       → uni.requestPayment 拉起收银台 → 微信异步回调 notify_url（本云函数 URL 化地址）
 *       → notify：验签 → AES-256-GCM 解密 → 订单置为 paid → 扣库存 → 送积分 → 回执 SUCCESS
 * 幂等：同一订单重复回调不重复扣库存/送积分；金额与订单不符直接拒绝。
 *
 * 所有商户敏感配置一律来自 uniCloud 控制台「云函数 pay → 环境变量」：
 *   WXPAY_MCH_ID                  微信支付商户号（mchid）
 *   WXPAY_APIV3_KEY               APIv3 密钥（32 位，商户平台「API安全」设置）
 *   WXPAY_MCH_SERIAL_NO           商户 API 证书序列号（apiclient_cert.pem 的序列号）
 *   WXPAY_MCH_PRIVATE_KEY         商户 API 私钥 PEM 全文（apiclient_key.pem 内容）
 *   WXPAY_PLATFORM_PUBLIC_KEY     微信支付公钥 PEM 全文（商户平台下载，回调验签用）
 *   WXPAY_PLATFORM_PUBLIC_KEY_ID  微信支付公钥 ID（回调头 Wechatpay-Serial 比对）
 *   WXPAY_NOTIFY_URL              本云函数 URL 化后的公网 HTTPS 地址
 * 微信支付公钥模式（推荐）：商户平台 → 账户中心 → API安全 → 微信支付公钥 下载。
 */
const db = uniCloud.database()
const $ = db.command
const crypto = require('crypto')
const uniIdCommon = require('uni-id-common')

/* ═══════════ 配置读取（环境变量，禁止硬编码进源码） ═══════════ */
function envStr(name) {
  return typeof process.env === 'object' && process.env[name] ? String(process.env[name]).trim() : ''
}

const WX_PAY = {
  appid: envStr('WX_APPID'),
  mchid: envStr('WXPAY_MCH_ID'),
  apiv3Key: envStr('WXPAY_APIV3_KEY'),
  mchSerialNo: envStr('WXPAY_MCH_SERIAL_NO'),
  mchPrivateKey: envStr('WXPAY_MCH_PRIVATE_KEY'),
  platformPublicKey: envStr('WXPAY_PLATFORM_PUBLIC_KEY'),
  platformPublicKeyId: envStr('WXPAY_PLATFORM_PUBLIC_KEY_ID'),
  notifyUrl: envStr('WXPAY_NOTIFY_URL')
}

const WXPAY_API_BASE = 'https://api.mch.weixin.qq.com'

function isPayConfigured() {
  return Boolean(WX_PAY.appid && WX_PAY.mchid && WX_PAY.apiv3Key.length === 32 && WX_PAY.mchSerialNo && WX_PAY.mchPrivateKey && WX_PAY.platformPublicKey && WX_PAY.platformPublicKeyId)
}

/* ═══════════ 库存（保留自原实现） ═══════════ */
async function assertStockAvailable(order_id) {
  const goodsRes = await db.collection('order-goods').where({ order_id }).get()
  for (const item of goodsRes.data || []) {
    const goodsDoc = await db.collection('goods').doc(item.goods_id).get()
    const goods = goodsDoc.data && goodsDoc.data[0]
    if (!goods || goods.is_sell === false) {
      return { ok: false, message: `${item.goods_name || '商品'}已下架` }
    }
    if (Number(goods.stock || 0) < Number(item.num || 0)) {
      return { ok: false, message: `${goods.name}库存不足` }
    }
  }
  return { ok: true }
}

function transactionRecord(res) {
  return Array.isArray(res.data) ? res.data[0] : res.data
}

// 阿里云事务只使用 doc 读写；明细 ID 在事务前查询，明细内容在事务内重新读取。
async function applyPayment(orderId, mode, paymentData, uid) {
  if (typeof db.startTransaction !== 'function') return { ok: false, message: '云数据库事务不可用，拒绝支付落账' }
  const lines = await db.collection('order-goods').where({ order_id: orderId }).get()
  if (!lines.data || !lines.data.length) return { ok: false, message: '订单明细为空' }
  const transaction = await db.startTransaction()
  try {
    const order = transactionRecord(await transaction.collection('orders').doc(orderId).get())
    if (!order || (uid && order.member_id !== uid)) throw new Error('订单不存在或无权支付')
    const totalCents = Math.round(Number(order.total_price) * 100)
    if (!Number.isSafeInteger(totalCents) || totalCents <= 0) throw new Error('订单金额无效')
    if (mode === 'wechat' && Number(paymentData.amount.total) !== totalCents) throw new Error('支付金额不符')
    if (order.status !== 'pending') {
      if (['paid', 'processing', 'completed'].includes(order.status) && order.inventory_deducted === true && order.settlement_complete === true && order.pay_mode === mode && (mode === 'balance' || order.transaction_id === paymentData.transaction_id)) {
        await transaction.commit()
        return { ok: true, skipped: 'already_settled' }
      }
      throw new Error('订单状态不允许落账；历史不完整支付或取消竞争需要对账处理')
    }
    const user = transactionRecord(await transaction.collection('uni-id-users').doc(order.member_id).get())
    if (!user) throw new Error('会员不存在')
    let newBalance = Number(user.balance || 0)
    if (mode === 'balance') {
      const balanceCents = Math.round(newBalance * 100)
      if (!Number.isSafeInteger(balanceCents) || balanceCents < totalCents) throw new Error('余额不足')
      newBalance = (balanceCents - totalCents) / 100
    }
    const quantities = new Map()
    for (const line of lines.data) {
      const item = transactionRecord(await transaction.collection('order-goods').doc(line._id).get())
      if (!item || item.order_id !== orderId || !Number.isInteger(Number(item.num)) || Number(item.num) <= 0) throw new Error('订单商品无效')
      quantities.set(item.goods_id, (quantities.get(item.goods_id) || 0) + Number(item.num))
    }
    const now = new Date()
    for (const [goodsId, quantity] of quantities) {
      const goods = transactionRecord(await transaction.collection('goods').doc(goodsId).get())
      if (!goods || goods.is_sell === false || Number(goods.stock) < quantity) throw new Error('商品库存不足或已下架')
      await transaction.collection('goods').doc(goodsId).update({ stock: Number(goods.stock) - quantity, sales: Number(goods.sales || 0) + quantity, updated_at: now })
    }
    const points = Math.floor(totalCents / 100)
    const userUpdate = { points: Number(user.points || 0) + points }
    if (mode === 'balance') userUpdate.balance = newBalance
    await transaction.collection('uni-id-users').doc(order.member_id).update(userUpdate)
    if (points > 0) await transaction.collection('points-log').add({ _id: 'pay_points_' + orderId, member_id: order.member_id, type: 'increase', points, reason: `消费赠送：订单${order.order_no}`, order_id: orderId, created_at: now })
    await transaction.collection('recharge-log').add({ _id: 'pay_consume_' + orderId, member_id: order.member_id, type: 'consume', amount: totalCents / 100, order_id: orderId, order_no: order.order_no, pay_mode: mode, transaction_id: mode === 'wechat' ? paymentData.transaction_id : '', created_at: now })
    await transaction.collection('orders').doc(orderId).update({ status: 'paid', pay_time: now, pay_mode: mode, transaction_id: mode === 'wechat' ? paymentData.transaction_id : '', inventory_deducted: true, settlement_complete: true, updated_at: now })
    await transaction.commit()
    return { ok: true, data: { new_balance: newBalance, points_earned: points } }
  } catch (error) {
    try { await transaction.rollback() } catch (rollbackError) { console.error('[pay] rollback failed') }
    return { ok: false, message: error.message || '支付事务失败' }
  }
}

/* ═══════════ 微信支付 V3 签名 ═══════════ */
function signWithPrivateKey(message) {
  const privateKey = crypto.createPrivateKey(WX_PAY.mchPrivateKey)
  return crypto.sign('RSA-SHA256', Buffer.from(message, 'utf8'), privateKey).toString('base64')
}

function buildAuthorizationHeader(method, urlPath, bodyStr) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonceStr = crypto.randomBytes(16).toString('hex')
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonceStr}\n${bodyStr}\n`
  const signature = signWithPrivateKey(message)
  return `WECHATPAY2-SHA256-RSA2048 mchid="${WX_PAY.mchid}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${WX_PAY.mchSerialNo}"`
}

/**
 * 统一下单（V3 JSAPI）并组装小程序拉起支付的参数
 */
async function createWxPayV3({ order, openid }) {
  if (!isPayConfigured()) {
    return {
      errCode: 'WX_PAY_NOT_CONFIGURED',
      errMsg: '微信支付商户参数未配置，请在 uniCloud 控制台为 pay 云函数配置 WXPAY_* 环境变量'
    }
  }
  if (!WX_PAY.notifyUrl) {
    return { errCode: 'WX_PAY_NOTIFY_URL_MISSING', errMsg: '未配置支付回调地址 WXPAY_NOTIFY_URL，请先对 pay 云函数开启 URL 化并填入公网地址' }
  }

  const totalFee = Math.round(parseFloat(order.total_price) * 100)
  if (!Number.isSafeInteger(totalFee) || totalFee <= 0) {
    return { errCode: 'INVALID_AMOUNT', errMsg: '订单金额无效' }
  }

  const urlPath = '/v3/pay/transactions/jsapi'
  const body = JSON.stringify({
    appid: WX_PAY.appid,
    mchid: WX_PAY.mchid,
    description: `热麦餐饮-${order.order_no}`,
    out_trade_no: order.order_no,
    notify_url: WX_PAY.notifyUrl,
    amount: { total: totalFee, currency: 'CNY' },
    payer: { openid }
  })

  try {
    const res = await uniCloud.httpclient.request(WXPAY_API_BASE + urlPath, {
      method: 'POST',
      data: body,
      contentType: 'json',
      dataType: 'json',
      timeout: 5000,
      headers: {
        Authorization: buildAuthorizationHeader('POST', urlPath, body),
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'remai-miniprogram/1.0.0'
      }
    })

    const result = res.data || {}
    if (res.status !== 200) {
      return {
        errCode: result.code || 'WX_PAY_ERROR',
        errMsg: result.message || `微信支付下单失败（HTTP ${res.status}）`
      }
    }

    // 小程序端 uni.requestPayment 所需参数（signType: RSA）
    const timeStamp = Math.floor(Date.now() / 1000).toString()
    const nonceStr = crypto.randomBytes(16).toString('hex')
    const pack = `prepay_id=${result.prepay_id}`
    const paySignMsg = `${WX_PAY.appid}\n${timeStamp}\n${nonceStr}\n${pack}\n`
    const paySign = signWithPrivateKey(paySignMsg)

    return {
      errCode: 0,
      errMsg: 'success',
      data: {
        appId: WX_PAY.appid,
        timeStamp,
        nonceStr,
        package: pack,
        signType: 'RSA',
        paySign
      }
    }
  } catch (error) {
    return { errCode: 'PAY_ERROR', errMsg: error.message || '微信支付下单失败' }
  }
}

/* ═══════════ 回调：验签 + 解密 ═══════════ */
function decryptResource(resource) {
  const { ciphertext, associated_data, nonce } = resource
  const buffer = Buffer.from(ciphertext, 'base64')
  const authTag = buffer.subarray(buffer.length - 16)
  const cipherData = buffer.subarray(0, buffer.length - 16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(WX_PAY.apiv3Key, 'utf8'), Buffer.from(nonce, 'utf8'))
  decipher.setAuthTag(authTag)
  if (associated_data) decipher.setAAD(Buffer.from(associated_data, 'utf8'))
  return decipher.update(cipherData, null, 'utf8') + decipher.final('utf8')
}

function verifyNotifySignature(headers, bodyStr) {
  if (!WX_PAY.platformPublicKey) {
    return { ok: false, message: '未配置微信支付公钥 WXPAY_PLATFORM_PUBLIC_KEY，无法验签' }
  }
  const timestamp = headers['wechatpay-timestamp']
  const nonce = headers['wechatpay-nonce']
  const signature = headers['wechatpay-signature']
  const serial = headers['wechatpay-serial']
  if (!timestamp || !nonce || !signature || !serial) {
    return { ok: false, message: '回调缺少微信支付签名头' }
  }
  if (!WX_PAY.platformPublicKeyId || serial !== WX_PAY.platformPublicKeyId) {
    return { ok: false, message: `微信支付公钥 ID 不匹配（期望 ${WX_PAY.platformPublicKeyId}，收到 ${serial}）` }
  }
  if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return { ok: false, message: '回调时间戳无效' }
  const message = `${timestamp}\n${nonce}\n${bodyStr}\n`
  try {
    const publicKey = crypto.createPublicKey(WX_PAY.platformPublicKey)
    const verified = crypto.verify('RSA-SHA256', Buffer.from(message, 'utf8'), publicKey, Buffer.from(signature, 'base64'))
    return verified ? { ok: true } : { ok: false, message: '回调验签失败' }
  } catch (error) {
    return { ok: false, message: `验签异常：${error.message}` }
  }
}

/**
 * 支付成功后的订单落账（幂等）
 */
async function settlePaidOrder(paymentData) {
  if (!paymentData || paymentData.trade_state !== 'SUCCESS') return { ok: true, skipped: 'trade_state_not_success' }

  const outTradeNo = paymentData.out_trade_no
  const transactionId = paymentData.transaction_id
  if (!outTradeNo || !transactionId) return { ok: false, message: '支付流水信息不完整' }
  if (paymentData.appid !== WX_PAY.appid || paymentData.mchid !== WX_PAY.mchid || !paymentData.amount || paymentData.amount.currency !== 'CNY') return { ok: false, message: '支付商户、应用或币种不匹配' }

  const orderRes = await db.collection('orders').where({ order_no: outTradeNo }).limit(1).get()
  const order = orderRes.data && orderRes.data[0]
  if (!order) return { ok: false, message: '订单不存在' }

  // 金额核对：微信返回 amount.total（单位：分）
  const expectTotal = Math.round(parseFloat(order.total_price) * 100)
  const paidTotal = Number(paymentData.amount && paymentData.amount.total)
  if (paidTotal !== expectTotal) {
    return { ok: false, message: `金额不符：订单 ${expectTotal} 分，实付 ${paidTotal} 分` }
  }


  return await applyPayment(order._id, 'wechat', paymentData)
}

/**
 * 支付回调入口（云函数 URL 化后由微信服务器调用）
 * 成功必须返回 HTTP 200 + {"code":"SUCCESS"}；失败返回非 SUCCESS 让微信重试
 */
async function handlePayNotify(event) {
  try {
    const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]))
    if (typeof event.body !== 'string') return { code: 'FAIL', message: '缺少原始回调报文' }
    const bodyStr = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body

    // 1. 验签
    const check = verifyNotifySignature(headers, bodyStr)
    if (!check.ok) {
      console.error('[pay notify] 验签失败:', check.message)
      return { code: 'FAIL', message: '签名校验失败' }
    }

    // 2. 解密
    let resource
    try {
      resource = JSON.parse(bodyStr).resource
    } catch (e) {
      return { code: 'FAIL', message: '回调报文解析失败' }
    }
    const plaintext = decryptResource(resource)
    const paymentData = JSON.parse(plaintext)

    // 3. 订单落账（幂等）
    const settle = await settlePaidOrder(paymentData)
    if (!settle.ok) {
      console.error('[pay notify] 落账失败:', settle.message)
      return { code: 'FAIL', message: '订单处理失败' }
    }

    return { code: 'SUCCESS', message: '成功' }
  } catch (error) {
    console.error('[pay notify] 异常:', error)
    return { code: 'FAIL', message: '处理异常' }
  }
}

/* ═══════════ 面向小程序端业务接口 ═══════════ */
async function createPayment({ order_id }, uid) {
  if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }

  const orderRes = await db.collection('orders').doc(order_id).get()
  if (!orderRes.data || orderRes.data.length === 0) {
    return { errCode: 'ORDER_NOT_FOUND', errMsg: '订单不存在' }
  }
  const order = orderRes.data[0]
  if (order.member_id !== uid) return { errCode: 'UNAUTHORIZED', errMsg: '无权支付' }
  if (order.status !== 'pending') return { errCode: 'ORDER_PAID', errMsg: '订单已支付，请勿重复支付' }

  const stockCheck = await assertStockAvailable(order_id)
  if (!stockCheck.ok) return { errCode: 'STOCK_NOT_ENOUGH', errMsg: stockCheck.message }

  const openid = await getUserOpenid(uid)
  if (!openid) return { errCode: 'OPENID_NOT_FOUND', errMsg: '未获取到微信身份，请重新登录后支付' }

  return await createWxPayV3({ order, openid })
}

async function getUserOpenid(uid) {
  const userRes = await db.collection('uni-id-users').doc(uid).get()
  if (!userRes.data || userRes.data.length === 0) return ''
  const user = userRes.data[0]
  return user.wx_openid && user.wx_openid.mp ? user.wx_openid.mp : ''
}

async function balancePay({ order_id }, uid) {
  if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
  const result = await applyPayment(order_id, 'balance', null, uid)
  if (!result.ok) return { errCode: 'PAYMENT_FAILED', errMsg: result.message }
  return { errCode: 0, errMsg: 'success', data: result.data || { already_paid: true } }
}

async function queryPayStatus({ order_id }, uid) {
  if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }

  const orderRes = await db.collection('orders').doc(order_id).get()
  if (!orderRes.data || orderRes.data.length === 0) {
    return { errCode: 'ORDER_NOT_FOUND', errMsg: '订单不存在' }
  }
  const order = orderRes.data[0]
  if (order.member_id !== uid) return { errCode: 'UNAUTHORIZED', errMsg: '无权查看' }

  return {
    errCode: 0,
    errMsg: 'success',
    data: {
      order_id: order._id,
      order_no: order.order_no,
      status: order.status,
      total_price: order.total_price,
      pay_time: order.pay_time || null,
      pay_mode: order.pay_mode || ''
    }
  }
}

exports.main = async (event, context) => {
  const { action, ...rest } = event || {}

  // 微信支付回调（云函数 URL 化后由微信服务器调用）无需登录鉴权，必须先于鉴权处理
  if (event && event.httpMethod) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: { Allow: 'POST' }, body: '', isBase64Encoded: false }
    const result = await handlePayNotify(event)
    return { statusCode: result.code === 'SUCCESS' ? 204 : 500, headers: { 'Content-Type': 'application/json' }, body: result.code === 'SUCCESS' ? '' : JSON.stringify(result), isBase64Encoded: false }
  }
  if (action === 'notify') return await handlePayNotify(event)

  // 业务接口统一 uni-id 鉴权（与 member/order/cart/coupon/card/address/points 七函数一致）
  let uid = null
  try {
    const token = event.uniIdToken || event.token || ''
    if (token) {
      const uniId = uniIdCommon.createInstance({ context })
      const payload = await uniId.checkToken(token, { autoRefresh: false })
      if (payload && !payload.errCode && payload.uid) uid = payload.uid
    }
  } catch (e) {}

  switch (action) {
    case 'createPayment':
      return await createPayment(rest, uid)
    case 'balancePay':
      return await balancePay(rest, uid)
    case 'queryPayStatus':
      return await queryPayStatus(rest, uid)
    default:
      return { errCode: 'INVALID_ACTION', errMsg: `Unknown action: ${action}` }
  }
}
