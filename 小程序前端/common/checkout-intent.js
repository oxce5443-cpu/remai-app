// A request key identifies an order attempt; it is not an authentication credential.
const STORAGE_KEY = 'remai_checkout_intent'

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    const result = {}
    for (const key of Object.keys(value).sort()) result[key] = canonical(value[key])
    return result
  }
  return value
}

export function getCheckoutIntent(payload) {
  const fingerprint = JSON.stringify(canonical({
    type: payload.type, address_id: payload.addressId || '',
    people_number: payload.peopleNumber || 1, table_no: String(payload.tableNo || '').trim(),
    qrcode_id: payload.qrcodeId || '', remark: payload.remark || '',
    cutlery_count: payload.cutleryCount ?? 0,
    goods_list: (payload.goodsList || []).map(item => ({
      goods_id: item.goodsId, num: Number(item.num), property: item.property || '',
      specs: Array.isArray(item.specs) ? item.specs : []
    }))
  }))
  const saved = readIntents()
  const existing = saved.find(item => item.fingerprint === fingerprint && /^[A-Za-z0-9_-]{16,128}$/.test(item.key))
  if (existing) return existing
  const intent = {
    key: `checkout-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`,
    fingerprint
  }
  // Persist before sending. If storage fails, don't send an attempt we cannot retry safely.
  try { uni.setStorageSync(STORAGE_KEY, [...saved, intent]) } catch { throw new Error('无法保存下单信息，请清理本地存储后重试') }
  return intent
}

function readIntents() {
  const saved = uni.getStorageSync(STORAGE_KEY)
  return Array.isArray(saved) ? saved : saved && saved.key ? [saved] : []
}

export function rememberCheckoutOrder(requestKey, orderId) {
  const saved = readIntents()
  if (saved.some(item => item.key === requestKey)) {
    uni.setStorageSync(STORAGE_KEY, saved.map(item => item.key === requestKey ? { ...item, orderId } : item))
  }
}

export function clearCheckoutIntent({ requestKey, orderId } = {}) {
  const remaining = readIntents().filter(item => !((requestKey && item.key === requestKey) || (orderId && item.orderId === orderId)))
  if (remaining.length) uni.setStorageSync(STORAGE_KEY, remaining)
  else uni.removeStorageSync(STORAGE_KEY)
}
