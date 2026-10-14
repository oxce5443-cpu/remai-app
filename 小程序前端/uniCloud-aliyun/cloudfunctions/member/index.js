'use strict'
// 会员云函数
const db = uniCloud.database()
const uniIdCommon = require('uni-id-common')

async function getMember(_, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	const uniIdRes = await db.collection('uni-id-users').doc(uid).get()
	if (!uniIdRes.data || uniIdRes.data.length === 0) {
		return { errCode: 'MEMBER_NOT_FOUND', errMsg: '会员不存在' }
	}
	const user = uniIdRes.data[0]
	return {
		errCode: 0, errMsg: 'success',
		data: {
			_id: user._id, nickname: user.nickname || '微信用户', avatar: user.avatar || '',
			mobile: user.mobile || '', points: user.points || 0, balance: user.balance || '0.00',
			member_level: user.member_level || 1, member_level_name: user.member_level_name || 'VIP1',
			created_at: user.created_at
		}
	}
}

async function updateMember({ nickname, avatar }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	const updateData = {}
	if (nickname !== undefined) updateData.nickname = nickname
	if (avatar !== undefined) updateData.avatar = avatar
	await db.collection('uni-id-users').doc(uid).update(updateData)
	return { errCode: 0, errMsg: 'success' }
}

async function getPointsLog({ page = 1, pageSize = 20 }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	const res = await db.collection('points-log').where({ member_id: uid })
		.orderBy('created_at', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function changePoints({ member_id, type, points, reason, order_id }) {
	const userRes = await db.collection('uni-id-users').doc(member_id).get()
	if (!userRes.data || userRes.data.length === 0) return
	const currentPoints = userRes.data[0].points || 0
	const newPoints = type === 'increase' ? currentPoints + points : Math.max(0, currentPoints - points)
	await db.collection('uni-id-users').doc(member_id).update({ points: newPoints })
	await db.collection('points-log').add({
		member_id, type, points, reason, order_id: order_id || '', created_at: new Date()
	})
	return { errCode: 0, errMsg: 'success', new_points: newPoints }
}

async function changeBalance({ member_id, amount, type }) {
	const userRes = await db.collection('uni-id-users').doc(member_id).get()
	if (!userRes.data || userRes.data.length === 0) return
	const currentBalance = parseFloat(userRes.data[0].balance || 0)
	const newBalance = type === 'increase'
		? currentBalance + parseFloat(amount)
		: Math.max(0, currentBalance - parseFloat(amount))
	await db.collection('uni-id-users').doc(member_id).update({ balance: newBalance.toFixed(2) })
	return { errCode: 0, errMsg: 'success', new_balance: newBalance.toFixed(2) }
}

async function adminGetMembers({ keyword, page = 1, pageSize = 20 }) {
	let query = db.collection('uni-id-users')
	if (keyword) {
		query = query.where({
			$or: [{ nickname: db.RegExp({ regexp: keyword }) }, { mobile: db.RegExp({ regexp: keyword }) }]
		})
	}
	const res = await query.field({ password: false, email: false })
		.orderBy('created_at', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function adminChangePoints({ member_id, type, points, reason }) {
	return await changePoints({ member_id, type, points, reason })
}

async function adminChangeBalance({ member_id, amount, type }) {
	return await changeBalance({ member_id, amount, type })
}

// 每日签到：今日已签则幂等返回；未签则 +5 积分，连续7天额外 +3
async function signIn(_, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	const today = new Date()
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
	const reason = `daily_sign_in:${todayStr}`

	const existed = await db.collection('points-log').where({ member_id: uid, reason }).limit(1).get()
	if (existed.data && existed.data.length > 0) {
		return { errCode: 0, errMsg: '今日已签到', data: { already_signed: true, points: existed.data[0].points } }
	}

	// 连续签到天数：查最近一条签到记录
	const recent = await db.collection('points-log').where({ member_id: uid, reason: /^daily_sign_in:/ })
		.orderBy('created_at', 'desc').limit(1).get()
	let continuous = 1
	if (recent.data && recent.data.length > 0) {
		const lastDate = new Date(recent.data[0].created_at)
		const diff = Math.floor((today - lastDate) / 86400000)
		continuous = diff === 1 ? 2 : 1 // 简化：仅判断是否连续第二天
	}

	const basePoints = 5
	const bonusPoints = continuous >= 2 ? 3 : 0
	const totalPoints = basePoints + bonusPoints

	const userRes = await db.collection('uni-id-users').doc(uid).get()
	const currentPoints = (userRes.data && userRes.data[0].points) || 0
	await db.collection('uni-id-users').doc(uid).update({ points: currentPoints + totalPoints })
	await db.collection('points-log').add({
		member_id: uid, type: 'increase', points: totalPoints, reason, created_at: new Date()
	})
	return { errCode: 0, errMsg: 'success', data: { already_signed: false, points: totalPoints, continuous, new_points: currentPoints + totalPoints } }
}

exports.main = async (event, context) => {
	// 遗留管理入口不接受用户 token；正常后台统一使用已鉴权的 admin 云函数。
	if (["changePoints", "changeBalance", "adminGetMembers", "adminChangePoints", "adminChangeBalance"].includes(event && event.action)) {
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
	switch (action) {
		case 'getMember':           return await getMember(rest, uid)
		case 'updateMember':        return await updateMember(rest, uid)
		case 'getPointsLog':        return await getPointsLog(rest, uid)
		case 'changePoints':        return await changePoints(rest)
		case 'changeBalance':       return await changeBalance(rest)
		case 'adminGetMembers':     return await adminGetMembers(rest)
		case 'adminChangePoints':   return await adminChangePoints(rest)
		case 'adminChangeBalance':  return await adminChangeBalance(rest)
		case 'signIn':              return await signIn(rest, uid)
		default:                    return await getMember(rest, uid)
	}
}
