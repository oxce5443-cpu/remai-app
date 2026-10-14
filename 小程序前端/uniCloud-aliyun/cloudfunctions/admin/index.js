'use strict'
// admin 云函数 - 商户后台专用
const db = uniCloud.database()
const $ = db.command
const crypto = require('crypto')

// ============== 管理员配置（仅 uniCloud 控制台环境变量，无任何默认凭证；未配置时拒绝服务）==============
// 密码哈希算法：scrypt(password, ADMIN_PASSWORD_SALT, 64) 的 hex
function envStr(name) {
  if (typeof process.env === 'object' && process.env[name]) return String(process.env[name]).trim()
  return ''
}
const ADMIN_CONFIG = {
  username: envStr('ADMIN_USERNAME'),
  // 密码哈希 = scrypt(密码, ADMIN_PASSWORD_SALT, 64).hex，在控制台环境变量 ADMIN_PASSWORD_HASH 配置
  password_hash: envStr('ADMIN_PASSWORD_HASH'),
  // 密码盐：ADMIN_PASSWORD_SALT
  salt: envStr('ADMIN_PASSWORD_SALT'),
  // token 签名密钥：ADMIN_TOKEN_SECRET
  token_secret: envStr('ADMIN_TOKEN_SECRET')
}
function isAdminConfigured() {
  return Boolean(ADMIN_CONFIG.username && ADMIN_CONFIG.password_hash && ADMIN_CONFIG.salt && ADMIN_CONFIG.token_secret)
}

/**
 * 生成管理员 token
 */
function generateAdminToken(username) {
  const payload = {
    username,
    timestamp: Date.now(),
    expire: Date.now() + 24 * 60 * 60 * 1000 // 24小时过期
  }
  const token = Buffer.from(JSON.stringify(payload)).toString('base64')
  const sign = crypto.createHmac('sha256', ADMIN_CONFIG.token_secret).update(token).digest('hex')
  return `${token}.${sign}`
}

/**
 * 校验管理员 token
 */
function verifyAdminToken(token) {
  if (typeof token !== 'string' || token.length > 4096) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 2 || !/^[0-9a-f]{64}$/.test(parts[1])) return null
    const [payloadStr, sign] = parts
    const expectedSign = crypto.createHmac('sha256', ADMIN_CONFIG.token_secret).update(payloadStr).digest('hex')
    if (!crypto.timingSafeEqual(Buffer.from(sign, 'hex'), Buffer.from(expectedSign, 'hex'))) return null

    const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString())
    if (payload.username !== ADMIN_CONFIG.username || !Number.isFinite(payload.expire) || payload.expire <= Date.now()) return null

    return payload
  } catch (e) {
    return null
  }
}

/**
 * 管理员登录
 */
async function adminLogin({ username, password }) {
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password || username.length > 128 || password.length > 1024) {
    return { errCode: 'PARAM_REQUIRED', errMsg: '用户名和密码不能为空' }
  }

  if (!isAdminConfigured()) {
    return { errCode: 'ADMIN_CONFIG_MISSING', errMsg: '管理员环境变量未配置（ADMIN_USERNAME/ADMIN_PASSWORD_SALT/ADMIN_PASSWORD_HASH/ADMIN_TOKEN_SECRET），请先在 uniCloud 控制台配置' }
  }

  const passwordHash = crypto.scryptSync(password, ADMIN_CONFIG.salt, 64).toString('hex')

  if (username !== ADMIN_CONFIG.username || !(/^[0-9a-f]{128}$/i.test(ADMIN_CONFIG.password_hash) && crypto.timingSafeEqual(Buffer.from(passwordHash, 'hex'), Buffer.from(ADMIN_CONFIG.password_hash, 'hex')))) {
    return { errCode: 'AUTH_FAILED', errMsg: '用户名或密码错误' }
  }

  const token = generateAdminToken(username)
  return {
    errCode: 0,
    errMsg: 'success',
    data: {
      token,
      user: {
        username,
        nickname: '管理员',
        role: 'admin'
      }
    }
  }
}

/**
 * 校验管理员权限
 */
function checkAdminAuth(event) {
  if (!isAdminConfigured()) {
    return { errCode: 'ADMIN_CONFIG_MISSING', errMsg: '管理员环境变量未配置，拒绝服务' }
  }
  const token = event.admin_token || event.token || ''
  const payload = verifyAdminToken(token)
  if (!payload) {
    return { errCode: 'UNAUTHORIZED', errMsg: '未登录或登录已过期，请重新登录' }
  }
  return null
}

function startOfDay(date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date, days) {
	const next = new Date(date)
	next.setDate(next.getDate() + days)
	return next
}

function formatDateKey(date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function isPaidOrder(order) {
	return !['pending', 'cancelled'].includes(order.status)
}

async function getOrdersInRange(startDate, endDate) {
	const res = await db.collection('orders').where({
		created_at: $.gte(startDate).and($.lt(endDate))
	}).limit(500).get()
	return res.data || []
}

function sumOrderAmount(orders) {
	return orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0)
}

async function getDashboard() {
	const now = new Date()
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
	const todayOrders = await db.collection('orders').where({ created_at: db.command.gte(todayStart) }).count()
	const todayOrdersList = await db.collection('orders').where({
		created_at: db.command.gte(todayStart), status: db.command.nin(['pending', 'cancelled'])
	}).get()
	let todaySales = 0
	for (const o of todayOrdersList.data) todaySales += parseFloat(o.total_price || 0)
	const monthOrders = await db.collection('orders').where({ created_at: db.command.gte(monthStart) }).count()
	const memberCount = await db.collection('uni-id-users').count()
	const pendingOrders = await db.collection('orders').where({ status: 'paid' }).count()
	const topGoods = await db.collection('goods').orderBy('sales', 'desc').limit(5).field({ name: true, sales: true }).get()
	return { errCode: 0, errMsg: 'success', data: {
		today_order_count: todayOrders.total, today_sales: todaySales.toFixed(2),
		month_order_count: monthOrders.total, member_count: memberCount.total,
		pending_order_count: pendingOrders.total, top_goods: topGoods.data
	}}
}

async function getDashboardOverview() {
	const now = new Date()
	const todayStart = startOfDay(now)
	const tomorrowStart = addDays(todayStart, 1)
	const todayOrders = await getOrdersInRange(todayStart, tomorrowStart)
	const paidTodayOrders = todayOrders.filter(isPaidOrder)
	const todaySales = sumOrderAmount(paidTodayOrders)
	const newUsers = await db.collection('uni-id-users').where({
		created_at: $.gte(todayStart).and($.lt(tomorrowStart))
	}).count()
	return {
		errCode: 0,
		errMsg: 'success',
		data: {
			today_order_count: paidTodayOrders.length,
			today_sales: todaySales.toFixed(2),
			today_new_users: newUsers.total || 0,
			avg_order_amount: paidTodayOrders.length ? (todaySales / paidTodayOrders.length).toFixed(2) : '0.00'
		}
	}
}

async function getOrderTrend({ days = 7 } = {}) {
	const safeDays = Math.min(Math.max(parseInt(days, 10) || 7, 1), 30)
	const todayStart = startOfDay(new Date())
	const rangeStart = addDays(todayStart, -(safeDays - 1))
	const rangeEnd = addDays(todayStart, 1)
	const orders = (await getOrdersInRange(rangeStart, rangeEnd)).filter(isPaidOrder)
	const bucket = {}
	for (let i = 0; i < safeDays; i += 1) {
		const day = addDays(rangeStart, i)
		bucket[formatDateKey(day)] = { stat_date: formatDateKey(day), order_count: 0, sales_amount: '0.00' }
	}
	orders.forEach((order) => {
		const key = formatDateKey(new Date(order.created_at))
		if (!bucket[key]) return
		bucket[key].order_count += 1
		bucket[key].sales_amount = (parseFloat(bucket[key].sales_amount) + parseFloat(order.total_price || 0)).toFixed(2)
	})
	return { errCode: 0, errMsg: 'success', data: Object.values(bucket) }
}

async function getGoodsSalesRank({ limit = 10 } = {}) {
	const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50)
	const res = await db.collection('goods')
		.orderBy('sales', 'desc')
		.limit(safeLimit)
		.field({ name: true, sales: true, price: true, image: true, images: true })
		.get()
	return {
		errCode: 0,
		errMsg: 'success',
		data: (res.data || []).map((item) => ({
			...item,
			sales_amount: (parseFloat(item.price || 0) * Number(item.sales || 0)).toFixed(2)
		}))
	}
}

async function getConsumptionDistribution({ days = 30 } = {}) {
	const safeDays = Math.min(Math.max(parseInt(days, 10) || 30, 1), 90)
	const todayStart = startOfDay(new Date())
	const orders = (await getOrdersInRange(addDays(todayStart, -(safeDays - 1)), addDays(todayStart, 1))).filter(isPaidOrder)
	const ranges = [
		{ label: '0-50', min: 0, max: 50, count: 0 },
		{ label: '50-100', min: 50, max: 100, count: 0 },
		{ label: '100-200', min: 100, max: 200, count: 0 },
		{ label: '200+', min: 200, max: Infinity, count: 0 }
	]
	orders.forEach((order) => {
		const amount = parseFloat(order.total_price || 0)
		const range = ranges.find((item) => amount >= item.min && amount < item.max)
		if (range) range.count += 1
	})
	return { errCode: 0, errMsg: 'success', data: ranges }
}

async function getRecentOrders({ limit = 10 } = {}) {
	const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 30)
	const res = await db.collection('orders').orderBy('created_at', 'desc').limit(safeLimit).get()
	return { errCode: 0, errMsg: 'success', data: res.data || [] }
}

async function getCategories() {
	const res = await db.collection('goods-category').orderBy('sort', 'asc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function addCategory({ name, sort, is_show }) {
	const res = await db.collection('goods-category').add({ name, sort: sort || 0, is_show: is_show !== false, created_at: new Date() })
	return { errCode: 0, errMsg: 'success', id: res.id }
}

async function updateCategory({ id, name, sort, is_show }) {
	const updateData = {}
	if (name !== undefined) updateData.name = name
	if (sort !== undefined) updateData.sort = sort
	if (is_show !== undefined) updateData.is_show = is_show
	await db.collection('goods-category').doc(id).update(updateData)
	return { errCode: 0, errMsg: 'success' }
}

async function deleteCategory({ id }) {
	await db.collection('goods-category').doc(id).remove()
	return { errCode: 0, errMsg: 'success' }
}

async function getAllGoods() {
	try {
		const res = await db.collection('goods').orderBy('created_at', 'desc').get()
		console.log('getAllGoods query result:', res)
		console.log('getAllGoods data count:', res.data?.length || 0)
		return { errCode: 0, errMsg: 'success', data: res.data }
	} catch (error) {
		console.error('getAllGoods error:', error)
		return { errCode: 1, errMsg: error.message, data: [] }
	}
}

async function addGoods({ category_id, name, price, original_price, description, image, stock }) {
	const res = await db.collection('goods').add({
		category_id, name, price, original_price: original_price || '',
		description: description || '', image: image || '',
		is_sell: true, stock: stock || 9999, sales: 0, created_at: new Date()
	})
	return { errCode: 0, errMsg: 'success', id: res.id }
}

async function updateGoods({ id, category_id, name, price, original_price, description, image, is_sell, stock }) {
	const updateData = {}
	if (category_id !== undefined) updateData.category_id = category_id
	if (name !== undefined) updateData.name = name
	if (price !== undefined) updateData.price = price
	if (original_price !== undefined) updateData.original_price = original_price
	if (description !== undefined) updateData.description = description
	if (image !== undefined) updateData.image = image
	if (is_sell !== undefined) updateData.is_sell = is_sell
	if (stock !== undefined) updateData.stock = stock
	await db.collection('goods').doc(id).update(updateData)
	return { errCode: 0, errMsg: 'success' }
}

async function deleteGoods({ id }) {
	await db.collection('goods').doc(id).remove()
	return { errCode: 0, errMsg: 'success' }
}

async function getOrders({ status, page = 1, pageSize = 20 }) {
	let query = db.collection('orders')
	if (status) query = query.where({ status })
	const res = await query.orderBy('created_at', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
	for (const order of res.data) {
		const goodsRes = await db.collection('order-goods').where({ order_id: order._id }).get()
		order.goods_list = goodsRes.data
	}
	// 后端 snake_case → 管理端 camelCase 字段映射
	const mapped = (res.data || []).map((o) => ({
		id: o._id,
		orderNo: o.order_no,
		type: o.type,
		status: o.status,
		totalPrice: o.total_price,
		personCount: o.people_number || 1,
		tableNo: String(o.table_no || '').trim(),
		cutleryCount: o.cutlery_count == null ? null : o.cutlery_count,
		address: o.address_id || '',
		createTime: o.created_at,
		remark: o.remark || '',
		goodsList: (o.goods_list || []).map((g) => ({
			id: g._id,
			name: g.goods_name,
			price: g.price,
			count: g.num,
			image: g.image || ''
		}))
	}))
	return { errCode: 0, errMsg: 'success', data: mapped }
}

async function updateOrderStatus({ order_id, status }) {
	const transitions = { pending: ['cancelled'], paid: ['processing'], processing: ['completed'] }
	const res = await db.collection('orders').doc(order_id).get()
	const order = res.data && res.data[0]
	if (!order) return { errCode: 'ORDER_NOT_FOUND', errMsg: '订单不存在' }
	if (!(transitions[order.status] || []).includes(status)) return { errCode: 'INVALID_TRANSITION', errMsg: '不允许此状态转换；支付与退款须由真实支付流程确认' }
	const result = await db.collection('orders').where({ _id: order_id, status: order.status }).update({ status, updated_at: new Date() })
	if (!result.updated) return { errCode: 'ORDER_STATE_CHANGED', errMsg: '订单状态已改变，请刷新' }
	return { errCode: 0, errMsg: 'success' }
}

async function getMembers({ keyword, page = 1, pageSize = 20 }) {
	let query = db.collection('uni-id-users')
	if (keyword) {
		query = query.where({ $or: [{ nickname: db.RegExp({ regexp: keyword }) }, { mobile: db.RegExp({ regexp: keyword }) }] })
	}
	const res = await query.field({ _id: true, nickname: true, avatar: true, mobile: true, points: true, balance: true, member_level: true, member_level_name: true, created_at: true }).orderBy('created_at', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function adjustPoints({ member_id, type, points, reason }) {
	const userRes = await db.collection('uni-id-users').doc(member_id).get()
	if (!userRes.data || userRes.data.length === 0) return { errCode: 'USER_NOT_FOUND', errMsg: '用户不存在' }
	const currentPoints = userRes.data[0].points || 0
	const newPoints = type === 'increase' ? currentPoints + points : Math.max(0, currentPoints - points)
	await db.collection('uni-id-users').doc(member_id).update({ points: newPoints })
	await db.collection('points-log').add({ member_id, type, points, reason, created_at: new Date() })
	return { errCode: 0, errMsg: 'success', new_points: newPoints }
}

async function adjustBalance({ member_id, amount, type }) {
	const userRes = await db.collection('uni-id-users').doc(member_id).get()
	if (!userRes.data || userRes.data.length === 0) return { errCode: 'USER_NOT_FOUND', errMsg: '用户不存在' }
	const currentBalance = parseFloat(userRes.data[0].balance || 0)
	const newBalance = type === 'increase' ? currentBalance + parseFloat(amount) : Math.max(0, currentBalance - parseFloat(amount))
	await db.collection('uni-id-users').doc(member_id).update({ balance: newBalance.toFixed(2) })
	return { errCode: 0, errMsg: 'success', new_balance: newBalance.toFixed(2) }
}

async function getStore() {
	const all = await db.collection('store').limit(10).get()
	if (!all.data || all.data.length === 0) {
		return { errCode: 'STORE_NOT_FOUND', errMsg: '门店未配置' }
	}
	// 读取层优选：历史 seed 曾写入北京示范店，统一以含「杭州」的门店为基准门店
	const prefer = all.data.find(s => String(s.address || '').indexOf('杭州') > -1)
	return { errCode: 0, errMsg: 'success', data: prefer || all.data[0] }
}

async function updateStore(params) {
	const all = await db.collection('store').limit(10).get()
	const updateData = { ...params, updated_at: new Date() }
	if (all.data && all.data.length > 0) {
		const target = all.data.find(s => String(s.address || '').indexOf('杭州') > -1) || all.data[0]
		await db.collection('store').doc(target._id).update(updateData)
	} else {
		updateData.created_at = new Date()
		await db.collection('store').add(updateData)
	}
	return { errCode: 0, errMsg: 'success' }
}

function dedupeBanners(list) {
	const groups = new Map()
	for (const b of list) {
		if (!groups.has(b.title)) groups.set(b.title, [])
		groups.get(b.title).push(b)
	}
	const out = []
	for (const [title, items] of groups) {
		const prefer = items.find(b => String(b.image || '').indexOf('remai-') > -1)
		out.push(prefer || items[0])
	}
	return out
}

async function getBanners() {
	const res = await db.collection('banner').orderBy('sort', 'asc').get()
	return { errCode: 0, errMsg: 'success', data: dedupeBanners(res.data) }
}

async function addBanner({ title, image, link, sort, is_show }) {
	const res = await db.collection('banner').add({ title, image, link: link || '', sort: sort || 0, is_show: is_show !== false, created_at: new Date() })
	return { errCode: 0, errMsg: 'success', id: res.id }
}

async function updateBanner({ id, title, image, link, sort, is_show }) {
	const updateData = {}
	if (title !== undefined) updateData.title = title
	if (image !== undefined) updateData.image = image
	if (link !== undefined) updateData.link = link
	if (sort !== undefined) updateData.sort = sort
	if (is_show !== undefined) updateData.is_show = is_show
	await db.collection('banner').doc(id).update(updateData)
	return { errCode: 0, errMsg: 'success' }
}

async function deleteBanner({ id }) {
	await db.collection('banner').doc(id).remove()
	return { errCode: 0, errMsg: 'success' }
}

async function getCoupons() {
	const res = await db.collection('coupon').orderBy('created_at', 'desc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function addCoupon({ title, type, value, min_price, start_time, end_time, total_count, is_show }) {
	const res = await db.collection('coupon').add({
		title, type, value, min_price: min_price || '0',
		start_time: new Date(start_time), end_time: new Date(end_time),
		total_count, remain_count: total_count, is_show: is_show !== false, created_at: new Date()
	})
	return { errCode: 0, errMsg: 'success', id: res.id }
}

async function updateCoupon({ id, ...params }) {
	const updateData = { ...params }
	if (updateData.start_time) updateData.start_time = new Date(updateData.start_time)
	if (updateData.end_time) updateData.end_time = new Date(updateData.end_time)
	await db.collection('coupon').doc(id).update(updateData)
	return { errCode: 0, errMsg: 'success' }
}

async function deleteCoupon({ id }) {
	await db.collection('coupon').doc(id).remove()
	return { errCode: 0, errMsg: 'success' }
}

async function getCardPackages() {
	const res = await db.collection('card-package').orderBy('sort', 'asc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function addCardPackage({ name, amount, gift_amount, is_show, sort }) {
	const res = await db.collection('card-package').add({ name, amount, gift_amount, is_show: is_show !== false, sort: sort || 0, created_at: new Date() })
	return { errCode: 0, errMsg: 'success', id: res.id }
}

async function updateCardPackage({ id, ...params }) {
	await db.collection('card-package').doc(id).update(params)
	return { errCode: 0, errMsg: 'success' }
}

async function deleteCardPackage({ id }) {
	await db.collection('card-package').doc(id).remove()
	return { errCode: 0, errMsg: 'success' }
}

function buildQRCodePayload({ code, table_no, store_id }) {
	return JSON.stringify({
		code,
		table_no,
		store_id: store_id || '',
		path: `pages/index/index?table_no=${encodeURIComponent(table_no)}`
	})
}

function buildFallbackQRCodeUrl(payload) {
	return `https://api.qrserver.com/v1/create-qr-code/?size=430x430&data=${encodeURIComponent(payload)}`
}

async function getQRCodes() {
	const res = await db.collection('qrcode').orderBy('created_at', 'desc').get()
	const records = res.data || []
	const fileIds = records.map((item) => item.file_id).filter(Boolean)
	let fileUrlMap = new Map()

	if (fileIds.length > 0) {
		try {
			const tempRes = await uniCloud.getTempFileURL({ fileList: fileIds })
			fileUrlMap = new Map(
				(tempRes.fileList || []).map((item) => [item.fileID, item.tempFileURL])
			)
		} catch (error) {
			console.warn('getQRCodes getTempFileURL failed:', error)
		}
	}

	return {
		errCode: 0,
		errMsg: 'success',
		data: records.map((item) => ({
			...item,
			qrcode: item.qrcode || fileUrlMap.get(item.file_id) || item.file_id || ''
		}))
	}
}

async function generateQRCode({ table_no, store_id }) {
	const normalizedTableNo = String(table_no || '').trim()
	if (!normalizedTableNo) return { errCode: 'INVALID_PARAM', errMsg: '桌号不能为空' }

	const code = 'QR' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()
	const payload = buildQRCodePayload({ code, table_no: normalizedTableNo, store_id })
	try {
		let file_id = ''
		let qrcode = ''

		if (uniCloud.wxacode && typeof uniCloud.wxacode.get === 'function') {
			try {
				const wxacodeResult = await uniCloud.wxacode.get({
					path: `pages/index/index?table_no=${encodeURIComponent(normalizedTableNo)}`,
					width: 430,
					auto_color: true,
					is_hyaline: false
				})
				if (wxacodeResult.errCode === 0 && wxacodeResult.buffer) {
					const uploadResult = await uniCloud.uploadFile({
						cloudPath: `qrcode/${code}.png`,
						fileContent: wxacodeResult.buffer
					})
					file_id = uploadResult.fileID || ''
				}
			} catch (error) {
				console.warn('generateQRCode wxacode unavailable, fallback to remote QR image:', error)
			}
		}

		if (!file_id) {
			qrcode = buildFallbackQRCodeUrl(payload)
		}

		const created_at = new Date()
		const data = {
			code,
			table_no: normalizedTableNo,
			store_id: store_id || '',
			status: 'idle',
			created_at
		}
		if (file_id) data.file_id = file_id
		if (qrcode) data.qrcode = qrcode

		const res = await db.collection('qrcode').add(data)
		return {
			errCode: 0,
			errMsg: 'success',
			data: {
				id: res.id,
				...data,
				qrcode: qrcode || file_id
			}
		}
	} catch (error) {
		return { errCode: 'SYSTEM_ERROR', errMsg: error.message }
	}
}

async function updateQRCodeStatus({ id, status }) {
	await db.collection('qrcode').doc(id).update({ status })
	return { errCode: 0, errMsg: 'success' }
}

async function deleteQRCode({ id }) {
	await db.collection('qrcode').doc(id).remove()
	return { errCode: 0, errMsg: 'success' }
}

async function getPointsMall() {
	const res = await db.collection('points-mall').orderBy('created_at', 'desc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function addPointsGoods({ goods_name, points, stock, exchange_desc, image, is_show, sort }) {
	const res = await db.collection('points-mall').add({ goods_name, points, stock: stock || 0, exchange_desc: exchange_desc || '', image: image || '', is_show: is_show !== false, sort: sort || 0, created_at: new Date() })
	return { errCode: 0, errMsg: 'success', id: res.id }
}

async function updatePointsGoods({ id, ...params }) {
	await db.collection('points-mall').doc(id).update(params)
	return { errCode: 0, errMsg: 'success' }
}

async function deletePointsGoods({ id }) {
	await db.collection('points-mall').doc(id).remove()
	return { errCode: 0, errMsg: 'success' }
}

exports.main = async (event) => {
	const { action, ...rest } = event || {}

	// 登录接口不需要鉴权
	if (action === 'login') {
		return await adminLogin(rest)
	}

	// 其他接口都需要鉴权
	const authError = checkAdminAuth(event)
	if (authError) {
		return authError
	}

	const actions = {
		getDashboard,
		getDashboardOverview, getOrderTrend, getGoodsSalesRank, getConsumptionDistribution, getRecentOrders,
		getCategories, addCategory, updateCategory, deleteCategory,
		getAllGoods, addGoods, updateGoods, deleteGoods,
		getOrders, updateOrderStatus,
		getMembers, adjustPoints, adjustBalance,
		getStore, updateStore,
		getBanners, addBanner, updateBanner, deleteBanner,
		getCoupons, addCoupon, updateCoupon, deleteCoupon,
		getCardPackages, addCardPackage, updateCardPackage, deleteCardPackage,
		getQRCodes, generateQRCode, updateQRCodeStatus, deleteQRCode,
		getPointsMall, addPointsGoods, updatePointsGoods, deletePointsGoods
	}
	if (action && actions[action]) return await actions[action](rest)
	return { errCode: 'INVALID_ACTION', errMsg: `Unknown action: ${action}` }
}
