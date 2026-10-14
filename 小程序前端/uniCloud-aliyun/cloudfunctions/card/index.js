'use strict'
// 储值卡云函数
const db = uniCloud.database()
const uniIdCommon = require('uni-id-common')

async function getCardPackages() {
	const res = await db.collection('card-package').where({ is_show: true }).orderBy('sort', 'asc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function recharge({ package_id }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	// 充值必须先创建真实支付订单并经服务端通知落账，现有直接加余额路径禁止执行。
	return { errCode: 'RECHARGE_NOT_AVAILABLE', errMsg: '在线充值暂未开放，请联系门店' }
}

async function getRechargeLogs({ page = 1, pageSize = 20 }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	const res = await db.collection('recharge-log').where({ member_id: uid })
		.orderBy('created_at', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function getGiftCards() {
	const res = await db.collection('card-package').where({ is_show: true }).orderBy('sort', 'asc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function adminGetPackages() {
	const res = await db.collection('card-package').orderBy('sort', 'asc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function addPackage({ name, amount, gift_amount, is_show, sort }) {
	const res = await db.collection('card-package').add({
		name, amount, gift_amount, is_show: is_show !== false, sort: sort || 0, created_at: new Date()
	})
	return { errCode: 0, errMsg: 'success', id: res.id }
}

async function updatePackage({ id, name, amount, gift_amount, is_show, sort }) {
	const updateData = {}
	if (name !== undefined) updateData.name = name
	if (amount !== undefined) updateData.amount = amount
	if (gift_amount !== undefined) updateData.gift_amount = gift_amount
	if (is_show !== undefined) updateData.is_show = is_show
	if (sort !== undefined) updateData.sort = sort
	await db.collection('card-package').doc(id).update(updateData)
	return { errCode: 0, errMsg: 'success' }
}

async function deletePackage({ id }) {
	await db.collection('card-package').doc(id).remove()
	return { errCode: 0, errMsg: 'success' }
}

exports.main = async (event, context) => {
	// 遗留管理入口不接受用户 token；正常后台统一使用已鉴权的 admin 云函数。
	if (["adminGetPackages", "addPackage", "updatePackage", "deletePackage"].includes(event && event.action)) {
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
		getCardPackages, getGiftCards,
		recharge: (r) => recharge(r, uid),
		getRechargeLogs: (r) => getRechargeLogs(r, uid),
		adminGetPackages, addPackage, updatePackage, deletePackage
	}
	if (action && actions[action]) return await actions[action](rest)
	return await getCardPackages()
}
