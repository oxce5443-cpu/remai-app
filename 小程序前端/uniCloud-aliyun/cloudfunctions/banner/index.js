'use strict'
// 轮播图云函数
const db = uniCloud.database()

// 轮播去重：历史 seed 数据与 db_init 数据并存时，按 title 分组并优先 image 含 'remai-' 的版本（db_init 基准），
// 仅做读取层过滤，不删除云端任何数据（遵循「只增不删减」原则）
function dedupeBanners(list) {
	const groups = new Map()
	for (const b of list) {
		if (!groups.has(b.title)) groups.set(b.title, [])
		groups.get(b.title).push(b)
	}
	const out = []
	for (const [title, items] of groups) {
		const prefer = items.find(b => String(b.image || '').indexOf('remai-') > -1)
		out.push(prefer || items[0])
	}
	return out
}

async function getBanners() {
	const res = await db.collection('banner').where({ is_show: true }).orderBy('sort', 'asc').get()
	return { errCode: 0, errMsg: 'success', data: dedupeBanners(res.data) }
}

async function getAllBanners() {
	const res = await db.collection('banner').orderBy('sort', 'asc').get()
	return { errCode: 0, errMsg: 'success', data: dedupeBanners(res.data) }
}

async function addBanner({ title, image, link, sort, is_show }) {
	const res = await db.collection('banner').add({
		title, image, link: link || '', sort: sort || 0, is_show: is_show !== false, created_at: new Date()
	})
	return { errCode: 0, errMsg: 'success', id: res.id }
}

async function updateBanner({ id, title, image, link, sort, is_show }) {
	const updateData = {}
	if (title !== undefined) updateData.title = title
	if (image !== undefined) updateData.image = image
	if (link !== undefined) updateData.link = link
	if (sort !== undefined) updateData.sort = sort
	if (is_show !== undefined) updateData.is_show = is_show
	await db.collection('banner').doc(id).update(updateData)
	return { errCode: 0, errMsg: 'success' }
}

async function deleteBanner({ id }) {
	await db.collection('banner').doc(id).remove()
	return { errCode: 0, errMsg: 'success' }
}

exports.main = async (event) => {
	// 遗留管理入口不接受用户 token；正常后台统一使用已鉴权的 admin 云函数。
	if (["getAllBanners", "addBanner", "updateBanner", "deleteBanner"].includes(event && event.action)) {
		return { errCode: 'UNAUTHORIZED', errMsg: '请通过管理后台 admin 云函数操作' }
	}

	const { action, ...rest } = event || {}
	const actions = { getBanners, getAllBanners, addBanner, updateBanner, deleteBanner }
	if (action && actions[action]) return await actions[action](rest)
	return await getBanners()
}
