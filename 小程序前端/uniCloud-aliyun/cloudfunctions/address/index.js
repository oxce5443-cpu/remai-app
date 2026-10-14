'use strict'
// 收货地址云函数
const db = uniCloud.database()
const uniIdCommon = require('uni-id-common')

async function getAddresses(_, uid) {
	if (!uid) return { errCode: 0, errMsg: 'success', data: [] }
	const res = await db.collection('address').where({ member_id: uid })
		.orderBy('is_default', 'desc').orderBy('created_at', 'desc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function addAddress({ accept_name, mobile, province, city, area, street, lat, lng, is_default }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	if (is_default) {
		await db.collection('address').where({ member_id: uid, is_default: true }).update({ is_default: false })
	}
	const res = await db.collection('address').add({
		member_id: uid, accept_name, mobile, province: province || '', city: city || '',
		area: area || '', street, lat: lat || '', lng: lng || '', is_default: is_default || false, created_at: new Date()
	})
	return { errCode: 0, errMsg: 'success', id: res.id }
}

async function updateAddress({ id, accept_name, mobile, province, city, area, street, lat, lng, is_default }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	const addr = await db.collection('address').doc(id).get()
	if (!addr.data || addr.data.length === 0 || addr.data[0].member_id !== uid) {
		return { errCode: 'ADDRESS_NOT_FOUND', errMsg: '地址不存在' }
	}
	if (is_default) {
		await db.collection('address').where({ member_id: uid, is_default: true }).update({ is_default: false })
	}
	const updateData = {}
	if (accept_name !== undefined) updateData.accept_name = accept_name
	if (mobile !== undefined) updateData.mobile = mobile
	if (province !== undefined) updateData.province = province
	if (city !== undefined) updateData.city = city
	if (area !== undefined) updateData.area = area
	if (street !== undefined) updateData.street = street
	if (lat !== undefined) updateData.lat = lat
	if (lng !== undefined) updateData.lng = lng
	if (is_default !== undefined) updateData.is_default = is_default
	await db.collection('address').doc(id).update(updateData)
	return { errCode: 0, errMsg: 'success' }
}

async function deleteAddress({ id }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	const addr = await db.collection('address').doc(id).get()
	if (!addr.data || addr.data.length === 0 || addr.data[0].member_id !== uid) {
		return { errCode: 'ADDRESS_NOT_FOUND', errMsg: '地址不存在' }
	}
	await db.collection('address').doc(id).remove()
	return { errCode: 0, errMsg: 'success' }
}

async function setDefault({ id }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	await db.collection('address').where({ member_id: uid, is_default: true }).update({ is_default: false })
	await db.collection('address').doc(id).update({ is_default: true })
	return { errCode: 0, errMsg: 'success' }
}

exports.main = async (event, context) => {
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
		getAddresses: (r) => getAddresses(r, uid),
		addAddress: (r) => addAddress(r, uid),
		updateAddress: (r) => updateAddress(r, uid),
		deleteAddress: (r) => deleteAddress(r, uid),
		setDefault: (r) => setDefault(r, uid)
	}
	if (action && actions[action]) return await actions[action](rest)
	return await getAddresses(rest, uid)
}
