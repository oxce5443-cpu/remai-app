'use strict'
// 优惠券云函数
const db = uniCloud.database()
const uniIdCommon = require('uni-id-common')

async function getAvailableCoupons() {
	const now = new Date()
	const res = await db.collection('coupon').where({
		is_show: true,
		remain_count: db.command.gt(0),
		start_time: db.command.lte(now),
		end_time: db.command.gte(now)
	}).get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function getMyCoupons({ status }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	let query = db.collection('member-coupon').where({ member_id: uid })
	if (status) query = query.where({ status })
	const myCoupons = await query.orderBy('created_at', 'desc').get()
	for (const mc of myCoupons.data) {
		const couponRes = await db.collection('coupon').doc(mc.coupon_id).get()
		if (couponRes.data && couponRes.data.length > 0) mc.coupon_info = couponRes.data[0]
	}
	return { errCode: 0, errMsg: 'success', data: myCoupons.data }
}

async function receiveCoupon({ coupon_id }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	const now = new Date()
	const couponRes = await db.collection('coupon').doc(coupon_id).get()
	if (!couponRes.data || couponRes.data.length === 0) return { errCode: 'COUPON_NOT_FOUND', errMsg: '优惠券不存在' }
	const coupon = couponRes.data[0]
	if (coupon.remain_count <= 0) return { errCode: 'COUPON_EMPTY', errMsg: '优惠券已领完' }
	if (now < new Date(coupon.start_time) || now > new Date(coupon.end_time)) {
		return { errCode: 'COUPON_EXPIRED', errMsg: '优惠券不在领取时间内' }
	}
	const existRes = await db.collection('member-coupon').where({ member_id: uid, coupon_id }).get()
	if (existRes.data && existRes.data.length > 0) return { errCode: 'ALREADY_RECEIVED', errMsg: '已领取过该优惠券' }
	await db.collection('member-coupon').add({ member_id: uid, coupon_id, status: 'unused', created_at: now })
	await db.collection('coupon').doc(coupon_id).update({ remain_count: coupon.remain_count - 1 })
	return { errCode: 0, errMsg: 'success' }
}

async function useCoupon({ member_coupon_id, order_id }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	const mcRes = await db.collection('member-coupon').doc(member_coupon_id).get()
	if (!mcRes.data || mcRes.data.length === 0) return { errCode: 'MEMBER_COUPON_NOT_FOUND', errMsg: '优惠券不存在' }
	const mc = mcRes.data[0]
	if (mc.member_id !== uid) return { errCode: 'UNAUTHORIZED', errMsg: '无权使用' }
	if (mc.status !== 'unused') return { errCode: 'COUPON_USED', errMsg: '优惠券已使用或已过期' }
	await db.collection('member-coupon').doc(member_coupon_id).update({ status: 'used', used_at: new Date(), order_id })
	return { errCode: 0, errMsg: 'success' }
}

async function getCoupons() {
	return await getAvailableCoupons()
}

async function adminGetCoupons() {
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

async function updateCoupon({ id, title, type, value, min_price, start_time, end_time, total_count, is_show }) {
	const updateData = {}
	if (title !== undefined) updateData.title = title
	if (type !== undefined) updateData.type = type
	if (value !== undefined) updateData.value = value
	if (min_price !== undefined) updateData.min_price = min_price
	if (start_time !== undefined) updateData.start_time = new Date(start_time)
	if (end_time !== undefined) updateData.end_time = new Date(end_time)
	if (total_count !== undefined) updateData.total_count = total_count
	if (is_show !== undefined) updateData.is_show = is_show
	await db.collection('coupon').doc(id).update(updateData)
	return { errCode: 0, errMsg: 'success' }
}

async function deleteCoupon({ id }) {
	await db.collection('coupon').doc(id).remove()
	return { errCode: 0, errMsg: 'success' }
}

exports.main = async (event, context) => {
	// 遗留管理入口不接受用户 token；正常后台统一使用已鉴权的 admin 云函数。
	if (["adminGetCoupons", "addCoupon", "updateCoupon", "deleteCoupon"].includes(event && event.action)) {
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
		getAvailableCoupons, getCoupons,
		getMyCoupons: (r) => getMyCoupons(r, uid),
		receiveCoupon: (r) => receiveCoupon(r, uid),
		useCoupon: (r) => useCoupon(r, uid),
		adminGetCoupons, addCoupon, updateCoupon, deleteCoupon
	}
	if (action && actions[action]) return await actions[action](rest)
	return await getAvailableCoupons()
}
