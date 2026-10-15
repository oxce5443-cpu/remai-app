'use strict'
// 商品管理云函数
const db = uniCloud.database()

async function getCategories() {
	const res = await db.collection('goods-category').orderBy('sort', 'asc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function getGoodsList({ categoryId }) {
	let query = db.collection('goods').where({ is_sell: true })
	if (categoryId) query = query.where({ category_id: categoryId })
	const res = await query.orderBy('sales', 'desc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

async function getGoodsDetail({ id }) {
	const goodsRes = await db.collection('goods').doc(id).get()
	if (!goodsRes.data || goodsRes.data.length === 0) {
		return { errCode: 'GOODS_NOT_FOUND', errMsg: '商品不存在' }
	}
	const goods = goodsRes.data[0]
	const specRes = await db.collection('goods-spec').where({ goods_id: id }).get()
	goods.specs = specRes.data
	return { errCode: 0, errMsg: 'success', data: goods }
}

// 菜单去重：历史 seed 数据与 db_init 数据并存时，优先确定性 _id 分类与 remai- 图商品（保留基准），
// 仅做读取层过滤，不删除云端任何数据（遵循「只增不删减」原则）
const CANONICAL_CATS = ['cat_signature', 'cat_drinks', 'cat_snacks', 'cat_new']

async function getMenuData() {
	const categories = await db.collection('goods-category')
		.where({ is_show: true }).orderBy('sort', 'asc').get()
	const goodsRes = await db.collection('goods')
		.where({ is_sell: true }).orderBy('sales', 'desc').get()

	// 分类：优先确定性 _id；若云端无确定性分类（极端场景）则全部保留
	const canonicalCats = categories.data.filter(c => CANONICAL_CATS.includes(c._id))
	const cats = canonicalCats.length > 0 ? canonicalCats : categories.data

	// 商品：按 name 去重，同名单优先保留 image 含 'remai-' 的版本（db_init 基准）
	const groups = new Map()
	for (const g of goodsRes.data) {
		if (!groups.has(g.name)) groups.set(g.name, [])
		groups.get(g.name).push(g)
	}
	const goods = []
	for (const [name, items] of groups) {
		const prefer = items.find(g => String(g.image || '').indexOf('remai-') > -1)
		goods.push(prefer || items[0])
	}
	// 保留计价与可售字段，最终对外结构由下方显式映射决定。
	const goodsBrief = goods.map(g => ({
		...g,
		_id: g._id,
		name: g.name,
		image: g.image || '',
		category_id: g.category_id
	}))
	const goodsByCat = new Map()
	for (const g of goodsBrief) {
		if (!goodsByCat.has(g.category_id)) goodsByCat.set(g.category_id, [])
		goodsByCat.get(g.category_id).push(g)
	}

	const result = cats.map(cat => ({
		id: cat._id,
		name: cat.name,
		name_en: cat.name_en || '',
		icon: cat.icon || '',
		sort: cat.sort || 0,
		goods_list: (goodsByCat.get(cat._id) || []).map(g => ({
			id: g._id,
			name: g.name,
			name_en: g.name_en || '',
			price: parseFloat(g.price),
			original_price: g.original_price || '',
			content: g.description || '',
			content_en: g.description_en || '',
			image: g.image || '',
			images: g.image ? [g.image] : [],
			sales: g.sales || 0,
			stock: g.stock == null ? 9999 : g.stock,
			use_property: 0,
			property: [],
			specs: [],
			is_label: 0
		}))
	}))
	return { errCode: 0, errMsg: 'success', data: result }
}

async function addCategory({ name, sort, is_show }) {
	const res = await db.collection('goods-category').add({
		name, sort: sort || 0, is_show: is_show !== false, created_at: new Date()
	})
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
	const goodsCheck = await db.collection('goods').where({ category_id: id }).count()
	if (goodsCheck.total > 0) {
		return { errCode: 'CATEGORY_HAS_GOODS', errMsg: '该分类下有商品，无法删除' }
	}
	await db.collection('goods-category').doc(id).remove()
	return { errCode: 0, errMsg: 'success' }
}

async function addGoods({ category_id, name, price, original_price, description, image, stock, specs }) {
	const goodsRes = await db.collection('goods').add({
		category_id, name, price, original_price: original_price || '',
		description: description || '', image: image || '',
		is_sell: true, stock: stock || 9999, sales: 0, created_at: new Date()
	})
	if (specs && specs.length > 0) {
		for (const spec of specs) {
			await db.collection('goods-spec').add({ goods_id: goodsRes.id, name: spec.name, options: spec.options })
		}
	}
	return { errCode: 0, errMsg: 'success', id: goodsRes.id }
}

async function updateGoods({ id, category_id, name, price, original_price, description, image, is_sell, stock, specs }) {
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
	if (specs !== undefined) {
		await db.collection('goods-spec').where({ goods_id: id }).remove()
		for (const spec of specs) {
			await db.collection('goods-spec').add({ goods_id: id, name: spec.name, options: spec.options })
		}
	}
	return { errCode: 0, errMsg: 'success' }
}

async function deleteGoods({ id }) {
	await db.collection('goods').doc(id).remove()
	await db.collection('goods-spec').where({ goods_id: id }).remove()
	return { errCode: 0, errMsg: 'success' }
}

async function getAllGoods() {
	const res = await db.collection('goods').orderBy('created_at', 'desc').get()
	return { errCode: 0, errMsg: 'success', data: res.data }
}

exports.main = async (event) => {
	// 遗留管理入口不接受用户 token；正常后台统一使用已鉴权的 admin 云函数。
	if (["addCategory", "updateCategory", "deleteCategory", "addGoods", "updateGoods", "deleteGoods", "getAllGoods"].includes(event && event.action)) {
		return { errCode: 'UNAUTHORIZED', errMsg: '请通过管理后台 admin 云函数操作' }
	}

	const { action, ...rest } = event || {}
	const actions = {
		getCategories, getGoodsList, getGoodsDetail, getMenuData,
		addCategory, updateCategory, deleteCategory,
		addGoods, updateGoods, deleteGoods, getAllGoods
	}
	if (action && actions[action]) return await actions[action](rest)
	return await getMenuData()
}
