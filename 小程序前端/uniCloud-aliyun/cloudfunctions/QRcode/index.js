'use strict'
// QRcode 云函数
const db = uniCloud.database()

async function generateQRCode({ table_no }) {
	try {
		const normalizedTableNo = String(table_no || '').trim()
		const path = normalizedTableNo
			? `pages/index/index?table_no=${encodeURIComponent(normalizedTableNo)}`
			: 'pages/index/index'
		const result = await uniCloud.wxacode.get({
			path, width: 430, auto_color: true, is_hyaline: false
		})
		if (result.errCode !== 0) return { errCode: result.errCode, errMsg: result.errMsg }
		const uploadResult = await uniCloud.uploadFile({
			cloudPath: `qrcode/${Date.now()}.png`, fileContent: result.buffer
		})
		if (!uploadResult.fileID) return { errCode: 'UPLOAD_FAILED', errMsg: '图片上传失败' }
		const data = { createTime: new Date(), qrcode: uploadResult.fileID }
		if (normalizedTableNo) data.table_no = normalizedTableNo
		await db.collection('QRcode').add(data)
		return { errCode: 0, errMsg: 'success', qrcode: uploadResult.fileID }
	} catch (error) {
		return { errCode: 'SYSTEM_ERROR', errMsg: error.message }
	}
}

async function getQRCodeList() {
	try {
		const result = await db.collection('QRcode').orderBy('createTime', 'desc').get()
		return { errCode: 0, errMsg: 'success', data: result.data }
	} catch (error) {
		return { errCode: 'SYSTEM_ERROR', errMsg: error.message }
	}
}

async function getQRCodes() {
	return await getQRCodeList()
}

exports.main = async (event) => {
	// 遗留管理入口不接受用户 token；正常后台统一使用已鉴权的 admin 云函数。
	if (true) {
		return { errCode: 'UNAUTHORIZED', errMsg: '请通过管理后台 admin 云函数操作' }
	}

	const { action, ...rest } = event || {}
	const actions = { generateQRCode, getQRCodeList, getQRCodes }
	if (action && actions[action]) return await actions[action](rest)
	return await getQRCodes()
}
