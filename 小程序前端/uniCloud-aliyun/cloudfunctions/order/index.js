'use strict'
// 订单云函数
const db = uniCloud.database()
const uniIdCommon = require('uni-id-common')

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

async function createOrder({ type, address_id, people_number, table_no, qrcode_id, remark, cutlery_count = 0, goods_list }, uid) {
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

	// ===== 服务端计价（防金额篡改）：以 goods 集合实时单价 × 数量重算，前端金额仅作展示 =====
	// 前端传入的 total_price / packing_fee / delivery_fee 一律不再采信
	let totalPrice = 0
	const verifiedGoods = []
	for (const item of goods_list) {
		const goodsRes = await db.collection('goods').doc(item.goods_id).get()
		const goods = goodsRes.data && goodsRes.data[0]
		if (!goods || goods.is_sell === false) {
			return { errCode: 'GOODS_OFF', errMsg: `${item.goods_name || '商品'}已下架` }
		}
		const num = Number(item.num || 0)
		if (!Number.isFinite(num) || num <= 0) {
			return { errCode: 'INVALID_NUM', errMsg: '商品数量无效' }
		}
		if (Number(goods.stock || 0) < num) {
			return { errCode: 'STOCK_NOT_ENOUGH', errMsg: `${goods.name}库存不足` }
		}
		const price = Number(goods.price || 0)
		if (!Number.isFinite(price) || price < 0) {
			return { errCode: 'PRICE_INVALID', errMsg: `${goods.name}价格异常` }
		}
		totalPrice += price * num
		verifiedGoods.push({
			goods_id: item.goods_id,
			goods_name: item.goods_name || goods.name,
			price,
			num,
			image: item.image || (goods.image && goods.image.url) || '',
			property: item.property || '',
			specs: Array.isArray(item.specs) ? item.specs : []
		})
	}

	// 包装费/配送费服务端定价：当前扫码堂食/外带场景均为 0；未来外卖扩展在此补充计价规则
	const feePacking = '0.00'
	const feeDelivery = '0.00'

	const orderNo = genOrderNo()
	const now = new Date()
	const orderRes = await db.collection('orders').add({
		order_no: orderNo,
		member_id: memberId,
		type,
		status: 'pending',
		total_price: totalPrice.toFixed(2),
		packing_fee: feePacking,
		delivery_fee: feeDelivery,
		address_id: address_id || '',
		people_number: people_number || 1,
		table_no: String(table_no || '').trim(),
		qrcode_id: qrcode_id || '',
		remark: remark || '',
		cutlery_count,
		inventory_deducted: false,
		created_at: now,
		updated_at: now
	})

	// 创建订单商品（价格一律以服务端计价为准）
	for (const item of verifiedGoods) {
		await db.collection('order-goods').add({
			order_id: orderRes.id,
			goods_id: item.goods_id,
			goods_name: item.goods_name,
			price: item.price,
			num: item.num,
			image: item.image || '',
			property: item.property || '',
			specs: item.specs || [],
			created_at: now
		})
	}

	// 注意：销量和库存的扣减在支付成功后执行（pay 云函数中）
	// 创建订单时不扣减，避免未支付订单占用库存

	return {
		errCode: 0,
		errMsg: 'success',
		data: {
			order_id: orderRes.id,
			order_no: orderNo,
			status: 'pending'
		}
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

	const now = new Date()
	await db.collection('orders').doc(order_id).update({
		status: 'cancelled',
		cancel_time: now,
		cancel_reason: reason || '用户取消',
		updated_at: now
	})

	// 如果已经扣减了库存，回滚
	if (order.inventory_deducted) {
		await rollbackOrderInventory(order_id)
	}

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
