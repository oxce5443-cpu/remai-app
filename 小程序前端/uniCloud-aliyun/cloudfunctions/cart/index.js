'use strict'
// 购物车云函数
const db = uniCloud.database()
const uniIdCommon = require('uni-id-common')

// 获取购物车
async function getCart(_, uid) {
	if (!uid) return { errCode: 0, errMsg: 'success', data: [] }
	const res = await db.collection('cart').where({ member_id: uid })
		.orderBy('created_at', 'desc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

// 添加商品到购物车
async function addToCart({ goods_id, goods_name, goods_name_en, cate_id, price, number, image, use_property, props_text, props }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }

	const now = new Date()
	const num = parseInt(number) || 1

	// 检查是否已存在相同商品（相同规格）
	let query = { member_id: uid, goods_id }
	if (use_property && props_text) {
		query.props_text = props_text
	}

	const existRes = await db.collection('cart').where(query).get()

	if (existRes.data && existRes.data.length > 0) {
		// 已存在，更新数量
		const item = existRes.data[0]
		await db.collection('cart').doc(item._id).update({
			number: item.number + num,
			...(typeof goods_name_en === 'string' ? { goods_name_en } : {}),
			updated_at: now
		})
		return { errCode: 0, errMsg: 'success', id: item._id }
	} else {
		// 不存在，新增
		const res = await db.collection('cart').add({
			member_id: uid,
			goods_id,
			goods_name,
			// Presentation snapshot only; checkout still uses server catalogue pricing.
			goods_name_en: typeof goods_name_en === 'string' ? goods_name_en : '',
			cate_id: cate_id || '',
			price: price || '0',
			number: num,
			image: image || '',
			use_property: use_property || false,
			props_text: props_text || '',
			props: props || '',
			created_at: now,
			updated_at: now
		})
		return { errCode: 0, errMsg: 'success', id: res.id }
	}
}

// 更新购物车商品数量
async function updateCartItem({ item_id, number }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }

	const itemRes = await db.collection('cart').doc(item_id).get()
	if (!itemRes.data || itemRes.data.length === 0) {
		return { errCode: 'ITEM_NOT_FOUND', errMsg: '商品不存在' }
	}

	const item = itemRes.data[0]
	if (item.member_id !== uid) {
		return { errCode: 'UNAUTHORIZED', errMsg: '无权操作' }
	}

	const num = parseInt(number)
	if (num <= 0) {
		// 数量为0，删除
		await db.collection('cart').doc(item_id).remove()
		return { errCode: 0, errMsg: 'success' }
	}

	await db.collection('cart').doc(item_id).update({
		number: num,
		updated_at: new Date()
	})
	return { errCode: 0, errMsg: 'success' }
}

// 删除购物车商品
async function removeFromCart({ item_id }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }

	const itemRes = await db.collection('cart').doc(item_id).get()
	if (!itemRes.data || itemRes.data.length === 0) {
		return { errCode: 'ITEM_NOT_FOUND', errMsg: '商品不存在' }
	}

	const item = itemRes.data[0]
	if (item.member_id !== uid) {
		return { errCode: 'UNAUTHORIZED', errMsg: '无权操作' }
	}

	await db.collection('cart').doc(item_id).remove()
	return { errCode: 0, errMsg: 'success' }
}

// 清空购物车
async function clearCart(_, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }

	await db.collection('cart').where({ member_id: uid }).remove()
	return { errCode: 0, errMsg: 'success' }
}

// 批量同步购物车（本地缓存覆盖云端：先清空再逐条插入）
async function syncCart({ items }, uid) {
	if (!uid) return { errCode: 'UNAUTHORIZED', errMsg: '请先登录' }
	if (!Array.isArray(items)) return { errCode: 0, errMsg: 'success', data: [] }

	await db.collection('cart').where({ member_id: uid }).remove()
	const now = new Date()
	const inserted = []
	for (const it of items) {
		if (!it.goods_id) continue
		const res = await db.collection('cart').add({
			member_id: uid,
			goods_id: it.goods_id,
			goods_name: it.goods_name || '',
			goods_name_en: typeof it.goods_name_en === 'string' ? it.goods_name_en : '',
			cate_id: it.cate_id || '',
			price: it.price || '0',
			number: parseInt(it.number) || 1,
			image: it.image || '',
			use_property: it.use_property || false,
			props_text: it.props_text || '',
			props: it.props || '',
			selected: it.selected !== false,
			created_at: now,
			updated_at: now
		})
		inserted.push(res.id)
	}
	return { errCode: 0, errMsg: 'success', data: inserted }
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
		getCart: (r) => getCart(r, uid),
		addToCart: (r) => addToCart(r, uid),
		updateCartItem: (r) => updateCartItem(r, uid),
		removeFromCart: (r) => removeFromCart(r, uid),
		clearCart: (r) => clearCart(r, uid),
		syncCart: (r) => syncCart(r, uid)
	}
	if (action && actions[action]) return await actions[action](rest)
	return await getCart(rest, uid)
}
