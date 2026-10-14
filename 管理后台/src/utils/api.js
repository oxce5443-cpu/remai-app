/**
 * 管理后台 uniCloud 客户端配置
 *
 * 安全说明（契约 §5/§6 + 用户决策）：
 * - spaceId / clientSecret 一律来自 Vite 环境变量，源码零硬编码默认值
 * - 真实值在 .env.development / .env.production 中本地配置，不提交仓库
 * - 部署文档见 README：clientSecret 需与 uniCloud 控制台「Web 端关联」一致
 */
const UNI_CLOUD_CONFIG = {
  provider: import.meta.env.VITE_UNICLOUD_PROVIDER || 'aliyun',
  // 未配置时抛错，避免静默用错空间
  spaceId: import.meta.env.VITE_UNICLOUD_SPACE_ID || '',
  clientSecret: import.meta.env.VITE_UNICLOUD_CLIENT_SECRET || ''
}
const FUNCTION_NAME = 'admin'

function assertConfigured() {
  if (!UNI_CLOUD_CONFIG.spaceId || !UNI_CLOUD_CONFIG.clientSecret) {
    throw new Error('uniCloud 环境变量未配置：请在 .env.development / .env.production 填写 VITE_UNICLOUD_SPACE_ID 与 VITE_UNICLOUD_CLIENT_SECRET')
  }
}

function initUniCloud() {
  assertConfigured()
  if (typeof uniCloud === 'undefined' || !uniCloud.init) {
    throw new Error('uniCloud 未定义，请确认在 uni-app H5 环境运行')
  }
  return uniCloud.init({
    provider: UNI_CLOUD_CONFIG.provider,
    spaceId: UNI_CLOUD_CONFIG.spaceId,
    clientSecret: UNI_CLOUD_CONFIG.clientSecret
  })
}

async function adminRequest(action, data = {}) {
  try {
    const client = initUniCloud()
    const adminToken = uni.getStorageSync('admin_token') || ''
    const res = await client.callFunction({
      name: FUNCTION_NAME,
      data: { action, admin_token: adminToken, ...data }
    })
    const result = res && res.result
    if (!result) return null

    if (result.errCode === 401 || result.errCode === 'UNAUTHORIZED') {
      uni.removeStorageSync('admin_token')
      uni.removeStorageSync('admin_user')
      uni.reLaunch({ url: '/pages/login/index' })
      throw new Error(result.errMsg || '登录已过期，请重新登录')
    }
    if (result.errCode !== undefined && result.errCode !== 0) {
      throw new Error(result.errMsg || '请求失败')
    }
    return result.data !== undefined ? result.data : result
  } catch (error) {
    console.error(`[API ${action}] Failed:`, error)
    throw error
  }
}

function checkLogin() {
  const token = uni.getStorageSync('admin_token')
  if (!token) {
    uni.reLaunch({ url: '/pages/login/index' })
    return false
  }
  return true
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function formatMoney(amount) {
  return Number(amount || 0).toFixed(2)
}

function getOrderStatusText(status) {
  const map = {
    pending: '待支付', paid: '已支付', processing: '制作中',
    completed: '已完成', cancelled: '已取消', refunded: '已退款'
  }
  return map[status] || status
}

function getOrderTypeText(type) {
  return { takein: '到店自取', takeout: '外卖配送' }[type] || type
}

export {
  UNI_CLOUD_CONFIG, adminRequest, checkLogin,
  formatDate, formatMoney, getOrderStatusText, getOrderTypeText
}
export default adminRequest
