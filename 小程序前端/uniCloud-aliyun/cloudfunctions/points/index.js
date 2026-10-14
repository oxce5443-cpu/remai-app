'use strict'
// 积分商城云函数
const db = uniCloud.database()
const uniIdCommon = require('uni-id-common')

async function getPointsGoods() {
	const res = await db.collection('points-mall').where({ is_show: true }).orderBy('sort', 'asc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function getPointsMall() {
	return await getPointsGoods()
}

async function redeem({ goods_id }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	const goodsRes = await db.collection('points-mall').doc(goods_id).get()
	if (!goodsRes.data || goodsRes.data.length === 0) return { errCode: 'GOODS_NOT_FOUND', errMsg: '商品不存在' }
	const goods = goodsRes.data[0]
	if (goods.stock <= 0) return { errCode: 'STOCK_EMPTY', errMsg: '库存不足' }
	const userRes = await db.collection('uni-id-users').doc(uid).get()
	if (!userRes.data || userRes.data.length === 0) return { errCode: 'USER_NOT_FOUND', errMsg: '用户不存在' }
	const currentPoints = userRes.data[0].points || 0
	const needPoints = parseInt(goods.points)
	if (currentPoints < needPoints) return { errCode: 'POINTS_NOT_ENOUGH', errMsg: '积分不足' }
	await db.collection('uni-id-users').doc(uid).update({ points: currentPoints - needPoints })
	await db.collection('points-log').add({
		member_id: uid, type: 'decrease', points: needPoints,
		reason: `积分兑换：${goods.goods_name}`, created_at: new Date()
	})
	await db.collection('points-mall').doc(goods_id).update({ stock: goods.stock - 1 })
	return { errCode: 0, errMsg: 'success', data: { goods_name: goods.goods_name, points: needPoints, remaining_points: currentPoints - needPoints } }
}

async function adminGetGoods() {
	const res = await db.collection('points-mall').orderBy('created_at', 'desc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function addGoods({ goods_name, points, stock, exchange_desc, image, is_show, sort }) {
	const res = await db.collection('points-mall').add({
		goods_name, points, stock: stock || 0, exchange_desc: exchange_desc || '',
		image: image || '', is_show: is_show !== false, sort: sort || 0, created_at: new Date()
	})
	return { errCode: 0, errMsg: 'success', id: res.id }
}

async function updateGoods({ id, goods_name, points, stock, exchange_desc, image, is_show, sort }) {
	const updateData = {}
	if (goods_name !== undefined) updateData.goods_name = goods_name
	if (points !== undefined) updateData.points = points
	if (stock !== undefined) updateData.stock = stock
	if (exchange_desc !== undefined) updateData.exchange_desc = exchange_desc
	if (image !== undefined) updateData.image = image
	if (is_show !== undefined) updateData.is_show = is_show
	if (sort !== undefined) updateData.sort = sort
	await db.collection('points-mall').doc(id).update(updateData)
	return { errCode: 0, errMsg: 'success' }
}

async function deleteGoods({ id }) {
	await db.collection('points-mall').doc(id).remove()
	return { errCode: 0, errMsg: 'success' }
}

exports.main = async (event, context) => {
	// 遗留管理入口不接受用户 token；正常后台统一使用已鉴权的 admin 云函数。
	if (["adminGetGoods", "addGoods", "updateGoods", "deleteGoods"].includes(event && event.action)) {
		return { errCode: 'UNAUTHORIZED', errMsg: '请通过管理后台 admin 云函数操作' }
	}

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
	const actions = {
		getPointsGoods, getPointsMall,
		redeem: (r) => redeem(r, uid),
		adminGetGoods, addGoods, updateGoods, deleteGoods
	}
	if (action && actions[action]) return await actions[action](rest)
	return await getPointsGoods()
}
