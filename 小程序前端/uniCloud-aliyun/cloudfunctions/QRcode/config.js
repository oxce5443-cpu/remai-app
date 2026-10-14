// 小程序配置信息
// appSecret 一律走 uniCloud 控制台环境变量 WX_APPSECRET，代码零硬编码
module.exports = {
	appId: (typeof process.env !== 'undefined' && process.env.WX_APPID) || 'wxd608b92fed6a3f92',
	appSecret: (typeof process.env !== 'undefined' && process.env.WX_APPSECRET) || ''
};
