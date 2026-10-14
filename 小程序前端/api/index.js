/**
 * 热麦点餐 · 统一 API 层（契约 §4.1 / §4.5）
 * - 统一解包云函数响应 { errCode, errMsg, data }，成功 errCode=0
 * - 唯一一处 snake_case ⇄ camelCase 映射（normalize / serialize）
 * - 头像归一 avatar（URL 字符串）；金额归一 number
 * - 业务代码仅用 uni.*；无浏览器专属 API
 * - FALLBACK_MOCK 由 config/env.js 驱动，staging/prod 强制 false
 */
import env from '@/config/env.js'

/* ═══════════ 云函数客户端（CLI 模式显式 init，HBuilderX 模式回退全局） ═══════════ */
let _cloudClient = null
function getCloudClient() {
  if (_cloudClient) return _cloudClient
  try {
    _cloudClient = uniCloud.init({
      provider: env.provider,
      spaceId: env.spaceId
    })
    return _cloudClient
  } catch (e) {
    // HBuilderX 已关联云空间时，全局 uniCloud 即已初始化
    return uniCloud
  }
}

/* ═══════════ 统一错误对象 ═══════════ */
export class ApiError extends Error {
  constructor(errCode, errMsg, data = null) {
    super(errMsg || '请求失败')
    this.name = 'ApiError'
    this.errCode = errCode
    this.data = data
  }
}

/* ═══════════ 鉴权 token ═══════════ */
const TOKEN_KEY = 'uni_id_token'
function getAuthToken() {
  return uni.getStorageSync(TOKEN_KEY) || uni.getStorageSync('token') || ''
}
function clearAuth() {
  uni.removeStorageSync(TOKEN_KEY)
  uni.removeStorageSync('token')
  uni.removeStorageSync('member')
  uni.$emit('remai-auth-expired')
}

/* ═══════════ 命名转换助手（唯一收口处） ═══════════ */
const CAMEL_RE = /_([a-z])/g
const SNAKE_RE = /([A-Z])/g

function toCamel(key) {
  return key.replace(CAMEL_RE, (_, c) => c.toUpperCase())
}
function toSnake(key) {
  return key.replace(SNAKE_RE, (c) => '_' + c.toLowerCase())
}

// 数据库金额字段统一转 number
const AMOUNT_KEYS = new Set([
  'price', 'totalPrice', 'total_price', 'originalPrice', 'original_price',
  'amount', 'giftAmount', 'gift_amount', 'balance', 'points', 'value',
  'minPrice', 'min_price', 'packingFee', 'packing_fee', 'deliveryFee', 'delivery_fee'
])

function normalizeValue(key, value) {
  if (AMOUNT_KEYS.has(key) && value !== null && value !== undefined && value !== '') {
    const n = Number(value)
    if (!Number.isNaN(n)) return n
  }
  return value
}

// snake_case → camelCase，仅在 API 出口做一次
export function normalize(obj) {
  if (Array.isArray(obj)) return obj.map(normalize)
  if (obj && typeof obj === 'object') {
    const out = {}
    for (const rawKey of Object.keys(obj)) {
      const camel = toCamel(rawKey)
      let val = normalize(obj[rawKey])
      out[camel] = normalizeValue(camel, val)
    }
    // 头像归一：优先 avatar；兼容 avatar_file.url
    if (!out.avatar && obj.avatar_file && obj.avatar_file.url) {
      out.avatar = obj.avatar_file.url
    }
    return out
  }
  return obj
}

// camelCase → snake_case，请求出参用
export function serialize(obj) {
  if (Array.isArray(obj)) return obj.map(serialize)
  if (obj && typeof obj === 'object') {
    const out = {}
    for (const key of Object.keys(obj)) {
      out[toSnake(key)] = serialize(obj[key])
    }
    return out
  }
  return obj
}

/* ═══════════ 逻辑名 → 云函数 action 路由表（对齐契约 §4.3） ═══════════ */
const cloudFunctionMap = {
  store:             { fn: 'store',   action: 'getStore' },
  goods:             { fn: 'goods',   action: 'getMenuData' },
  addresses:         { fn: 'address', action: 'getAddresses' },
  orders:            { fn: 'order',   action: 'getOrders' },
  member:            { fn: 'member',  action: 'getMember' },
  packages:          { fn: 'store',   action: 'getPackages' },
  cards:             { fn: 'card',    action: 'getCardPackages' },
  rechargeCards:     { fn: 'card',    action: 'getCardPackages' },
  pointsMall:        { fn: 'points',  action: 'getPointsGoods' },
  // 签到：V3 骨架对接 member.signIn；历史/今日签到信息走积分流水与会员信息
  attendance:        { fn: 'member',  action: 'signIn' },
  attendanceList:   { fn: 'member',  action: 'getPointsLog' },
  todayAttendance:   { fn: 'member',  action: 'getMember' },
  customPoints:      { fn: 'member',  action: 'getPointsLog' },
  customerCoupons:   { fn: 'coupon', action: 'getMyCoupons' },
  giftCards:         { fn: 'card',    action: 'getGiftCards' },
  banners:           { fn: 'banner',  action: 'getBanners' }
}

/* ═══════════ 超时控制 ═══════════ */
function withTimeout(ms, promise) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('请求超时，请稍后重试')), ms)
    promise.then(
      (res) => { clearTimeout(timer); resolve(res) },
      (err) => { clearTimeout(timer); reject(err) }
    )
  })
}

/* ═══════════ 核心：调用云函数并统一解包 ═══════════ */
async function callCloud(fnName, action, data = {}) {
  const client = getCloudClient()
  const token = getAuthToken()
  const payload = { ...serialize(data) }
  if (action) payload.action = action
  // 登录态：微信小程序端 callFunction 的 header 自定义字段不传递，token 必须走 data 通道（event.uniIdToken），
  // 云端各云函数统一用 uni-id-common checkToken(event.uniIdToken) 校验
  if (token) payload.uniIdToken = token

  const res = await withTimeout(env.timeout, client.callFunction({
    name: fnName,
    data: payload,
    header: token ? { 'uni-id-token': token } : {}
  }))

  const result = (res && res.result) || {}
  // 兼容：云函数直接返回裸数据时也视为成功
  if (result.errCode === undefined) {
    return normalize(result.data !== undefined ? result.data : result)
  }
  if (result.errCode === 0) {
    return normalize(result.data)
  }
  // 401：未登录/登录过期，清除本地凭证
  if ([401, 'UNAUTHORIZED', 'uni-id-token-expired', 'uni-id-check-token-failed'].includes(result.errCode)) clearAuth()
  throw new ApiError(result.errCode, result.errMsg, result.data)
}

function callCloudByLogicalName(name, data = {}) {
  const mapped = cloudFunctionMap[name]
  // 允许页面显式指定 action：this.$api('orders', { action: 'createOrder', ... })
  const action = data.action || (mapped ? mapped.action : undefined)
  const fnName = mapped ? mapped.fn : name
  const { action: _omit, ...rest } = data
  return callCloud(fnName, action, rest)
}

// 重试（仅网络超时类）
async function invoke(name, data, retryLeft = env.retryCount) {
  try {
    return await callCloudByLogicalName(name, data)
  } catch (err) {
    if (retryLeft > 0 && err && err.message && err.message.includes('超时')) {
      await new Promise((r) => setTimeout(r, 800))
      return invoke(name, data, retryLeft - 1)
    }
    throw err
  }
}

/**
 * 默认导出：路由式调用，兼容历史页面 this.$api('goods') 写法
 * 云函数失败时直接抛错，由页面四态处理；staging/prod 禁止任何静默假数据回退
 */
export default async function request(name, data = {}) {
  try {
    return await invoke(name, data)
  } catch (err) {
    if (env.FALLBACK_MOCK && env.env === 'dev') {
      console.warn(`[API ${name}] 云函数失败（dev 环境提示）：${err.message}`)
    }
    throw err
  }
}

/* ═══════════ 领域化方法（新代码优先使用） ═══════════ */
export const api = {
  // 公开
  getStore:        () => callCloud('store', 'getStore'),
  getPackages:     () => callCloud('store', 'getPackages'),
  getBanners:      () => callCloud('banner', 'getBanners'),
  getMenuData:     () => callCloud('goods', 'getMenuData'),
  getGoodsDetail:  (data) => callCloud('goods', 'getGoodsDetail', data),

  // 会员
  loginByWeixin:   (data) => callCloud('uni-id', 'loginByWeixin', data),
  getMember:       () => callCloud('member', 'getMember'),
  updateMember:    (data) => callCloud('member', 'updateMember', data),
  getPointsLog:    (data) => callCloud('member', 'getPointsLog', data),
  signIn:          () => callCloud('member', 'signIn'),

  // 购物车（cart 云函数 + 本地缓存降级由 store/页面处理）
  getCart:         () => callCloud('cart', 'getCart'),
  syncCart:        (data) => callCloud('cart', 'syncCart', data),

  // 订单
  createOrder:     (data) => callCloud('order', 'createOrder', data),
  getOrders:       (data) => callCloud('order', 'getOrders', data),
  getOrderDetail:  (data) => callCloud('order', 'getOrderDetail', data),
  cancelOrder:     (data) => callCloud('order', 'cancelOrder', data),

  // 支付
  createPayment:   (data) => callCloud('pay', 'createPayment', data),
  balancePay:      (data) => callCloud('pay', 'balancePay', data),
  queryPayStatus:  (data) => callCloud('pay', 'queryPayStatus', data),

  // 优惠券
  getCoupons:      () => callCloud('coupon', 'getCoupons'),
  getMyCoupons:    (data) => callCloud('coupon', 'getMyCoupons', data),
  receiveCoupon:   (data) => callCloud('coupon', 'receiveCoupon', data),
  useCoupon:       (data) => callCloud('coupon', 'useCoupon', data),

  // 储值卡 / 礼品卡
  getCardPackages: () => callCloud('card', 'getCardPackages'),
  getGiftCards:    () => callCloud('card', 'getGiftCards'),
  recharge:        (data) => callCloud('card', 'recharge', data),

  // 积分商城
  getPointsGoods:  () => callCloud('points', 'getPointsGoods'),
  redeem:          (data) => callCloud('points', 'redeem', data),

  // 地址
  getAddresses:    () => callCloud('address', 'getAddresses'),
  addAddress:      (data) => callCloud('address', 'addAddress', data),
  updateAddress:   (data) => callCloud('address', 'updateAddress', data),
  deleteAddress:   (data) => callCloud('address', 'deleteAddress', data),
  setDefault:      (data) => callCloud('address', 'setDefault', data)
}

export { env }
