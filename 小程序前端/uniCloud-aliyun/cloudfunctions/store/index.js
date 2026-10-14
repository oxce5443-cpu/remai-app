'use strict'
// 门店信息云函数
const db = uniCloud.database()

// 门店优选：历史 seed 数据与 db_init 数据并存时，优先返回地址含「杭州」的门店（db_init 基准），
// 仅做读取层优选，不删除云端任何数据（遵循「只增不删减」原则）
async function getStore() {
	const all = await db.collection('store').limit(10).get()
	if (!all.data || all.data.length === 0) {
		return { errCode: 'STORE_NOT_FOUND', errMsg: '门店未配置' }
	}
	const prefer = all.data.find(s => String(s.address || '').indexOf('杭州') > -1)
	return { errCode: 0, errMsg: 'success', data: prefer || all.data[0] }
}

async function updateStore({ name, address, tel, min_price, packing_fee, delivery_fee, server_time, is_open, is_eat, is_takeout, image, notice, avg_delivery_time }) {
	const updateData = {}
	if (name !== undefined) updateData.name = name
	if (address !== undefined) updateData.address = address
	if (tel !== undefined) updateData.tel = tel
	if (min_price !== undefined) updateData.min_price = min_price
	if (packing_fee !== undefined) updateData.packing_fee = packing_fee
	if (delivery_fee !== undefined) updateData.delivery_fee = delivery_fee
	if (server_time !== undefined) updateData.server_time = server_time
	if (is_open !== undefined) updateData.is_open = is_open
	if (is_eat !== undefined) updateData.is_eat = is_eat
	if (is_takeout !== undefined) updateData.is_takeout = is_takeout
	if (image !== undefined) updateData.image = image
	if (notice !== undefined) updateData.notice = notice
	if (avg_delivery_time !== undefined) updateData.avg_delivery_time = avg_delivery_time
	updateData.updated_at = new Date()

	const existing = await db.collection('store').limit(10).get()
	const target = existing.data && existing.data.length > 0
		? (existing.data.find(s => String(s.address || '').indexOf('杭州') > -1) || existing.data[0])
		: null
	if (target) {
		await db.collection('store').doc(target._id).update(updateData)
	} else {
		updateData.created_at = new Date()
		await db.collection('store').add(updateData)
	}
	return { errCode: 0, errMsg: 'success' }
}

exports.main = async (event) => {
	// 遗留管理入口不接受用户 token；正常后台统一使用已鉴权的 admin 云函数。
	if (["updateStore"].includes(event && event.action)) {
		return { errCode: 'UNAUTHORIZED', errMsg: '请通过管理后台 admin 云函数操作' }
	}

	const { action, ...rest } = event || {}
	// 券包列表：当前无独立券包集合，返回空数组（前端渲染空态）
	if (action === 'getPackages') {
		return { errCode: 0, errMsg: 'success', data: [] }
	}
	const actions = { getStore, updateStore }
	if (action && actions[action]) {
		return await actions[action](rest)
	}
	return await getStore()
}
