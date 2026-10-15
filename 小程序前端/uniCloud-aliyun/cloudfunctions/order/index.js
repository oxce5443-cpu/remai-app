'use strict'
// 订单云函数
const db = uniCloud.database()
const uniIdCommon = require('uni-id-common')
const crypto = require('crypto')

function canonical(value) {
	if (Array.isArray(value)) return value.map(canonical)
	if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
	return value
}
function digest(value) { return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex') }
function record(result) { return result && (Array.isArray(result.data) ? result.data[0] : result.data) }
function creationError(code, message) { return Object.assign(new Error(message), { businessCode: code }) }

function genOrderNo() {
	return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase()
}

/**
 * 检查库存是否充足
 */
async function assertStockAvailable(goods_list) {
	for (const item of goods_list) {
		const goodsRes = await db.collection('goods').doc(item.goods_id).get()
		const goods = goodsRes.data && goodsRes.data[0]
		if (!goods || goods.is_sell === false) {
			return { ok: false, message: `${item.goods_name || '商品'}已下架` }
		}
		if (Number(goods.stock || 0) < Number(item.num || 0)) {
			return { ok: false, message: `${goods.name}库存不足` }
		}
	}
	return { ok: true }
}

async function createOrder({ request_key, type, address_id, people_number, table_no, qrcode_id, remark, cutlery_count = 0, goods_list }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录后下单' }
	if (!['takein', 'takeout'].includes(type)) return { errCode: 'INVALID_TYPE', errMsg: '订单类型无效' }
	if (!Number.isInteger(cutlery_count) || cutlery_count < 0 || cutlery_count > 99) return { errCode: 'INVALID_CUTLERY', errMsg: '餐具数量须为 0 至 99' }
	const memberId = uid
	if (!Array.isArray(goods_list) || goods_list.length === 0) {
		return { errCode: 'GOODS_EMPTY', errMsg: '商品不能为空' }
	}

	if (goods_list.some(item => !item || !Number.isInteger(Number(item.num)) || Number(item.num) <= 0 || Number(item.num) > 999)) {
		return { errCode: 'INVALID_NUM', errMsg: '商品数量须为 1 至 999 的整数' }
	}
	if (typeof request_key !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(request_key)) return { errCode: 'INVALID_REQUEST_KEY', errMsg: '下单请求标识无效，请重新确认订单' }
	if (goods_list.length > 50 || goods_list.some(item => typeof item.goods_id !== 'string' || !item.goods_id.trim())) return { errCode: 'INVALID_GOODS', errMsg: '商品清单无效' }
	if (typeof db.startTransaction !== 'function') return { errCode: 'TRANSACTION_UNAVAILABLE', errMsg: '订单服务暂不可用，请稍后重试' }
	const selection = goods_list.map(item => ({ goods_id: item.goods_id, num: Number(item.num), property: item.property || '', specs: Array.isArray(item.specs) ? item.specs : [] }))
	const payload = { type, address_id: address_id || '', people_number: people_number || 1, table_no: String(table_no || '').trim(), qrcode_id: qrcode_id || '', remark: remark || '', cutlery_count, goods_list: selection }
	const fingerprint = digest(payload)
	const orderId = digest([memberId, request_key]).slice(0, 32)
	let transaction
	try {
		transaction = await db.startTransaction()
		const existing = record(await transaction.collection('orders').doc(orderId).get())
		if (existing) {
			if (existing.member_id !== memberId) throw creationError('UNAUTHORIZED', '无权访问订单')
			if (existing.request_fingerprint !== fingerprint) throw creationError('IDEMPOTENCY_CONFLICT', '订单内容已改变，请重新确认订单')
			if (!existing.creation_complete || existing.line_count !== selection.length || !Array.isArray(existing.line_ids) || existing.line_ids.length !== existing.line_count) throw creationError('ORDER_INCOMPLETE', '订单记录不完整，请联系客服')
			const lines = []
			for (const id of existing.line_ids) {
				const line = record(await transaction.collection('order-goods').doc(id).get())
				if (!line || line.order_id !== orderId) throw creationError('ORDER_INCOMPLETE', '订单记录不完整，请联系客服')
				lines.push(line)
			}
			if (digest(lines.map(line => ({ goods_id: line.goods_id, price: line.price, num: line.num, property: line.property, specs: line.specs }))) !== existing.lines_hash) throw creationError('ORDER_INCOMPLETE', '订单记录不完整，请联系客服')
			await transaction.commit()
			return { errCode: 0, errMsg: 'success', data: { order_id: orderId, order_no: existing.order_no, status: existing.status } }
		}
		let totalCents = 0
		const quantities = new Map()
		const lines = []
		const now = new Date()
		for (let index = 0; index < selection.length; index++) {
			const item = selection[index]
			const goods = record(await transaction.collection('goods').doc(item.goods_id).get())
			if (!goods || goods.is_sell === false) throw creationError('GOODS_OFF', '商品已下架')
			const quantity = (quantities.get(item.goods_id) || 0) + item.num
			quantities.set(item.goods_id, quantity)
			if (!Number.isFinite(Number(goods.stock)) || Number(goods.stock) < quantity) throw creationError('STOCK_NOT_ENOUGH', '商品库存不足')
			const price = Number(goods.price)
			const cents = Math.round(price * 100)
			if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(cents)) throw creationError('PRICE_INVALID', '商品价格异常')
			totalCents += cents * item.num
			if (!Number.isSafeInteger(totalCents)) throw creationError('PRICE_INVALID', '订单金额异常')
			lines.push({ ...item, _id: digest([orderId, index]).slice(0, 32), order_id: orderId, goods_name: goods.name, goods_name_en: goods.name_en || '', price: cents / 100, image: typeof goods.image === 'string' ? goods.image : (goods.image && goods.image.url) || '', created_at: now })
		}
		const orderNo = genOrderNo()
		const linesHash = digest(lines.map(line => ({ goods_id: line.goods_id, price: line.price, num: line.num, property: line.property, specs: line.specs })))
		const { goods_list: _selection, ...fulfilment } = payload
		await transaction.collection('orders').add({
			...fulfilment, _id: orderId, order_no: orderNo, member_id: memberId,
			status: 'pending', total_price: (totalCents / 100).toFixed(2),
			packing_fee: '0.00', delivery_fee: '0.00', inventory_deducted: false,
			request_fingerprint: fingerprint, creation_complete: true,
			line_count: lines.length, line_ids: lines.map(line => line._id), lines_hash: linesHash,
			created_at: now, updated_at: now
		})
		for (const line of lines) await transaction.collection('order-goods').add(line)
		await transaction.commit()
		return { errCode: 0, errMsg: 'success', data: { order_id: orderId, order_no: orderNo, status: 'pending' } }
	} catch (error) {
		if (transaction) { try { await transaction.rollback() } catch (_) {} }
		return { errCode: error.businessCode || 'ORDER_CREATE_RETRY', errMsg: error.businessCode ? error.message : '下单未确认，请使用相同订单重试' }
	}
}

async function getOrders({ status, page = 1, pageSize = 10 }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	let query = db.collection('orders').where({ member_id: uid })
	if (status) query = query.where({ status })
	const res = await query.orderBy('created_at', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
	for (const order of res.data) {
		const goodsRes = await db.collection('order-goods').where({ order_id: order._id }).get()
		order.goods_list = goodsRes.data
	}
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function getOrderDetail({ order_id }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	const orderRes = await db.collection('orders').doc(order_id).get()
	if (!orderRes.data || orderRes.data.length === 0) {
		return { errCode: 'ORDER_NOT_FOUND', errMsg: '订单不存在' }
	}
	const order = orderRes.data[0]
	if (order.member_id !== uid) return { errCode: 'UNAUTHORIZED', errMsg: '无权访问' }
	const goodsRes = await db.collection('order-goods').where({ order_id }).get()
	order.goods_list = goodsRes.data
	return { errCode: 0, errMsg: 'success', data: order }
}

/**
 * 回滚库存（取消订单/支付失败时调用）
 */
async function rollbackOrderInventory(order_id) {
	const orderRes = await db.collection('orders').doc(order_id).get()
	const order = orderRes.data && orderRes.data[0]
	if (!order || order.inventory_deducted !== true) return

	const goodsRes = await db.collection('order-goods').where({ order_id }).get()
	for (const item of goodsRes.data || []) {
		const goodsDoc = await db.collection('goods').doc(item.goods_id).get()
		const goods = goodsDoc.data && goodsDoc.data[0]
		if (!goods) continue
		const num = Number(item.num || 0)
		await db.collection('goods').doc(item.goods_id).update({
			stock: Number(goods.stock || 0) + num,
			sales: Math.max(Number(goods.sales || 0) - num, 0),
			updated_at: new Date()
		})
	}
	await db.collection('orders').doc(order_id).update({
		inventory_deducted: false,
		updated_at: new Date()
	})
}

async function cancelOrder({ order_id, reason }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	const orderRes = await db.collection('orders').doc(order_id).get()
	if (!orderRes.data || orderRes.data.length === 0) {
		return { errCode: 'ORDER_NOT_FOUND', errMsg: '订单不存在' }
	}
	const order = orderRes.data[0]
	if (order.member_id !== uid) {
		return { errCode: 'UNAUTHORIZED', errMsg: '无权操作' }
	}
	if (order.status !== 'pending') {
		return { errCode: 'ORDER_CANNOT_CANCEL', errMsg: '该订单无法取消' }
	}
	if (order.inventory_deducted === true || order.settlement_complete === true) {
		return { errCode: 'ORDER_RECONCILIATION_REQUIRED', errMsg: '订单支付记录异常，请联系客服核实' }
	}

	const now = new Date()
	const result = await db.collection('orders').where({ _id: order_id, member_id: uid, status: 'pending' }).update({
		status: 'cancelled',
		cancel_time: now,
		cancel_reason: reason || '用户取消',
		updated_at: now
	})
	if (!result.updated) return { errCode: 'ORDER_STATE_CHANGED', errMsg: '订单状态已改变，请刷新' }
	// Pending orders reserve no stock. Never roll back a concurrently completed payment here.

	return { errCode: 0, errMsg: 'success' }
}

async function adminGetOrders({ status, start_date, end_date, page = 1, pageSize = 20 }) {
	let query = db.collection('orders')
	if (status) query = query.where({ status })
	const res = await query.orderBy('created_at', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
	for (const order of res.data) {
		const goodsRes = await db.collection('order-goods').where({ order_id: order._id }).get()
		order.goods_list = goodsRes.data
	}
	const countRes = await db.collection('orders').count()
	return { errCode: 0, errMsg: 'success', data: res.data, total: countRes.total }
}

async function adminUpdateStatus({ order_id, status }) {
	const updateData = { status, updated_at: new Date() }
	if (status === 'completed' || status === 'paid') updateData.pay_time = new Date()
	await db.collection('orders').doc(order_id).update(updateData)
	return { errCode: 0, errMsg: 'success' }
}

exports.main = async (event, context) => {
	// 遗留管理入口不接受用户 token；正常后台统一使用已鉴权的 admin 云函数。
	if (["adminGetOrders", "adminUpdateStatus"].includes(event && event.action)) {
		return { errCode: 'UNAUTHORIZED', errMsg: '请通过管理后台 admin 云函数操作' }
	}

	// 获取登录 uid（匿名模式下为 null）
	let uid = null
	try {
		const token = event.uniIdToken || event.token || ''
		if (token) {
			const uniId = uniIdCommon.createInstance({ context })
			const payload = await uniId.checkToken(token, { autoRefresh: false })
			if (payload && !payload.errCode && payload.uid) uid = payload.uid
		}
	} catch (e) {}

	const { action, ...rest } = event || {}
	switch (action) {
		case 'createOrder':    return await createOrder(rest, uid)
		case 'getOrders':      return await getOrders(rest, uid)
		case 'getOrderDetail': return await getOrderDetail(rest, uid)
		case 'cancelOrder':    return await cancelOrder(rest, uid)
		case 'adminGetOrders': return await adminGetOrders(rest)
		case 'adminUpdateStatus': return await adminUpdateStatus(rest)
		default:               return await getOrders(rest, uid)
	}
}
