/**
 * 热麦点餐 · 前端环境配置（三档分离）
 * 契约 §5：dev / staging / prod；源码零密钥。
 * spaceId 非敏感（uniCloud 服务空间 ID），appid 为微信小程序公开 AppID。
 * staging / prod 强制 FALLBACK_MOCK=false，禁止静默假数据。
 */

// 构建期环境：HBuilderX 默认可通过 NODE_ENV 判断；缺省按 dev 处理。
const BUILD_ENV = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) || 'development'

const configs = {
  // 开发：可开启 mock 兜底，便于无云函数时联调 UI
  dev: {
    env: 'dev',
    spaceId: 'mp-aaf9bdd3-92cf-4b1d-8920-ef9bb4e3983f',
    appid: 'wxd608b92fed6a3f92',
    provider: 'aliyun',
    // 开发环境允许云函数失败时回退（仅当注入了 mock 数据源时生效）
    FALLBACK_MOCK: true,
    // 请求域名（预留；uniCloud callFunction 模式下不使用 HTTP 域名）
    apiBaseUrl: '',
    timeout: 15000,
    retryCount: 2
  },
  // 预发：禁止假数据
  staging: {
    env: 'staging',
    spaceId: 'mp-aaf9bdd3-92cf-4b1d-8920-ef9bb4e3983f',
    appid: 'wxd608b92fed6a3f92',
    provider: 'aliyun',
    FALLBACK_MOCK: false,
    apiBaseUrl: '',
    timeout: 15000,
    retryCount: 1
  },
  // 生产：禁止假数据
  prod: {
    env: 'prod',
    spaceId: 'mp-aaf9bdd3-92cf-4b1d-8920-ef9bb4e3983f',
    appid: 'wxd608b92fed6a3f92',
    provider: 'aliyun',
    FALLBACK_MOCK: false,
    apiBaseUrl: '',
    timeout: 15000,
    retryCount: 1
  }
}

function resolveEnv() {
  if (BUILD_ENV === 'production') return configs.prod
  if (BUILD_ENV === 'staging' || BUILD_ENV === 'test') return configs.staging
  return configs.dev
}

const env = resolveEnv()

// 硬性安全约束：staging/prod 不允许开启 mock 兜底
if (env.env !== 'dev') {
  env.FALLBACK_MOCK = false
}

export default env
export { configs }
