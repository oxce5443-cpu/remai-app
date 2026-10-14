'use strict'

const uniIdCommon = require('uni-id-common')

const db = uniCloud.database()
const userCollection = db.collection('uni-id-users')

let uniIdConfigCenter = null
try {
	uniIdConfigCenter = require('uni-config-center')({ pluginId: 'uni-id' })
} catch (error) {
	console.warn('uni-id config center is not available:', error.message)
}

// 微信凭证只从云端环境变量 / uni-config-center 读取；源码内禁止内置 AppSecret（原 wx.local.json 兜底已禁用）

function normalizeString(value) {
	return value === undefined || value === null ? '' : String(value).trim()
}

function isConfiguredSecret(value) {
	const text = normalizeString(value)
	return Boolean(text) && !/填写|获取|appid|appsecret|示例|demo/i.test(text)
}

function getMpWeixinConfig() {
	if (!uniIdConfigCenter || !uniIdConfigCenter.hasFile('config.json')) return {}
	const config = uniIdConfigCenter.config()
	const mpConfig = config && config['mp-weixin'] && config['mp-weixin'].oauth && config['mp-weixin'].oauth.weixin
	return mpConfig || {}
}

async function getWeixinSession(code) {
	const config = getMpWeixinConfig()
	const appid = normalizeString(process.env.WX_APPID || config.appid)
	const appsecret = normalizeString(process.env.WX_APPSECRET || config.appsecret)

	if (!isConfiguredSecret(appid) || !isConfiguredSecret(appsecret)) {
		return {
			errCode: 'WEIXIN_CONFIG_MISSING',
			errMsg: '请在 uni-config-center/uni-id/config.json 或云函数环境变量 WX_APPID/WX_APPSECRET 中配置真实微信小程序 AppID/AppSecret'
		}
	}

	const url = 'https://api.weixin.qq.com/sns/jscode2session'
	const res = await uniCloud.httpclient.request(url, {
		method: 'GET',
		dataType: 'json',
		timeout: 5000,
		data: {
			appid,
			secret: appsecret,
			js_code: code,
			grant_type: 'authorization_code'
		}
	})
	const body = res.data || {}
	if (body.errcode) {
		return {
			errCode: body.errcode,
			errMsg: body.errmsg || '微信登录凭证校验失败'
		}
	}
	return {
		errCode: 0,
		openid: body.openid,
		unionid: body.unionid,
		session_key: body.session_key
	}
}

async function findUserByOpenid(openid) {
	const res = await userCollection.where({
		'wx_openid.mp': openid
	}).limit(1).get()
	return (res.data && res.data[0]) || null
}

function buildUserProfile({ userRecord, fallbackInfo = {} }) {
	const nickname = userRecord.nickname || fallbackInfo.nickName || fallbackInfo.nickname || '热麦会员'
	const avatar = userRecord.avatar || userRecord.avatar_file && userRecord.avatar_file.url || fallbackInfo.avatarUrl || fallbackInfo.avatar || ''
	return {
		_id: userRecord._id,
		uid: userRecord._id,
		nickname,
		avatar,
		avatar_file: userRecord.avatar_file || null,
		mobile: userRecord.mobile || '',
		wx_openid: userRecord.wx_openid || {},
		role: userRecord.role || [],
		status: userRecord.status || 0
	}
}

async function upsertUser({ openid, unionid, sessionKey, userInfo }) {
	const now = Date.now()
	const existing = await findUserByOpenid(openid)
	const baseData = {
		wx_openid: { mp: openid },
		wx_unionid: unionid || '',
		weixin: { session_key: sessionKey || '' },
		nickname: userInfo.nickName || userInfo.nickname || '热麦会员',
		avatar: userInfo.avatarUrl || userInfo.avatar || '',
		last_login_date: now,
		updated_at: new Date()
	}

	if (existing) {
		await userCollection.doc(existing._id).update(baseData)
		return {
			...existing,
			...baseData
		}
	}

	const addRes = await userCollection.add({
		...baseData,
		role: [],
		status: 0,
		created_at: new Date(),
		register_date: now
	})
	return {
		_id: addRes.id,
		...baseData,
		role: [],
		status: 0
	}
}

function getClientInfo() {
	if (typeof uniCloud.getClientInfo === 'function') {
		return uniCloud.getClientInfo()
	}
	return {
		appId: '__UNI__ADMINAPP',
		platform: 'mp-weixin',
		locale: 'zh-Hans',
		clientIP: ''
	}
}

async function createUniIdToken(uid) {
	const clientInfo = {
		...getClientInfo(),
		platform: 'mp-weixin'
	}
	const uniId = uniIdCommon.createInstance({ clientInfo })
	const tokenRes = await uniId.createToken({ uid })
	if (tokenRes.errCode) throw tokenRes
	return tokenRes
}

async function loginByWeixin(params = {}) {
	const code = normalizeString(params.code)
	if (!code) {
		return { errCode: 'PARAM_REQUIRED', code: 'PARAM_REQUIRED', errMsg: '缺少微信登录 code' }
	}

	const sessionRes = await getWeixinSession(code)
	if (sessionRes.errCode) {
		return {
			errCode: sessionRes.errCode,
			code: sessionRes.errCode,
			errMsg: sessionRes.errMsg || '微信登录失败'
		}
	}

	const userRecord = await upsertUser({
		openid: sessionRes.openid,
		unionid: sessionRes.unionid,
		sessionKey: sessionRes.session_key,
		userInfo: params.userInfo || params.user_info || {}
	})
	const tokenRes = await createUniIdToken(userRecord._id)
	const userInfo = buildUserProfile({
		userRecord,
		fallbackInfo: params.userInfo || params.user_info || {}
	})

	return {
		errCode: 0,
		code: 0,
		errMsg: 'success',
		token: tokenRes.token,
		tokenExpired: tokenRes.tokenExpired,
		uid: userRecord._id,
		userInfo,
		data: {
			token: tokenRes.token,
			tokenExpired: tokenRes.tokenExpired,
			uid: userRecord._id,
			userInfo,
			member: userInfo
		}
	}
}

async function checkToken(params = {}) {
	const token = normalizeString(params.token)
	if (!token) return { errCode: 'TOKEN_EMPTY', code: 'TOKEN_EMPTY', errMsg: 'token不能为空' }
	const uniId = uniIdCommon.createInstance({ clientInfo: getClientInfo() })
	const payload = await uniId.checkToken(token, { autoRefresh: false })
	return { errCode: 0, code: 0, errMsg: 'success', data: payload, ...payload }
}

exports.main = async (event = {}) => {
	const action = event.action || event.method || 'loginByWeixin'
	const params = event.params || event.data || event

	switch (action) {
		case 'loginByWeixin':
		case 'loginByWeixinMiniProgram':
			return loginByWeixin(params)
		case 'checkToken':
			return checkToken(params)
		default:
			return {
				errCode: 'ACTION_NOT_FOUND',
				code: 'ACTION_NOT_FOUND',
				errMsg: `不支持的 uni-id action: ${action}`
			}
	}
}
