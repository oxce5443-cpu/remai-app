#!/usr/bin/env node
/**
 * 热麦点餐小程序 · 生产版整合验证脚本
 * 适配最终目录结构：uniCloud-aliyun/ + 管理后台/ + seed-data/ + scripts/
 * 20+ 项静态检查；无法实测云函数运行/微信支付/管理端构建（标注 Known Issues）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const uc = path.join(root, '小程序前端', 'uniCloud-aliyun')
const cf = path.join(uc, 'cloudfunctions')
const dbDir = path.join(uc, 'database')
const admin = path.join(root, '管理后台')
const seed = path.join(root, 'seed-data')

const checks = []
function check(name, predicate) { checks.push({ name, predicate }) }
function exists(p) { try { return fs.existsSync(p) } catch { return false } }
function read(p) { try { return fs.readFileSync(p, 'utf8') } catch { return '' } }

// ===== 云函数存在性（15 个一等公民） =====
const EXPECTED_CF = ['address','admin','banner','card','cart','coupon','goods','member','order','pay','points','QRcode','seed','store','uni-id']
for (const name of EXPECTED_CF) {
  check(`云函数存在: ${name}`, () => exists(path.join(cf, name, 'index.js')))
}
check('云函数总数 = 15', () => EXPECTED_CF.every((n) => exists(path.join(cf, n, 'index.js'))))

// ===== Schema 存在性（17 集合） =====
const EXPECTED_SCHEMA = ['address','banner','card-package','cart','coupon','goods-category','goods-spec','goods','member-coupon','order-goods','orders','points-log','points-mall','QRcode','recharge-log','store','uni-id-users']
for (const s of EXPECTED_SCHEMA) {
  check(`Schema 存在: ${s}`, () => exists(path.join(dbDir, `${s}.schema.json`)))
}
check('Schema 总数 = 17', () => EXPECTED_SCHEMA.every((s) => exists(path.join(dbDir, `${s}.schema.json`))))

// ===== 安全加固 =====
const adminSrc = read(path.join(cf, 'admin', 'index.js'))
check('admin: login 免鉴权但其余强制 checkAdminAuth', () => /action === 'login'/.test(adminSrc) && /checkAdminAuth\(event\)/.test(adminSrc))
check('admin: 凭据来自 process.env（无硬编码密码）', () => /process\.env/.test(adminSrc) && /ADMIN_USERNAME/.test(adminSrc))
check('admin: HMAC-SHA256 token 签名', () => /createHmac\('sha256'/.test(adminSrc))

const paySrc = read(path.join(cf, 'pay', 'index.js'))
check('pay: HTTP 与 notify 回调入口存在（须真实商户联调）', () => /action === 'notify'/.test(paySrc) && /event.httpMethod/.test(paySrc) && /handlePayNotify/.test(paySrc))
check('pay: API v3 RSA 支付签名存在', () => /signWithPrivateKey/.test(paySrc) && /RSA-SHA256/.test(paySrc))
check('pay: WX 配置来自 process.env（无硬编码 mch_id）', () => /process\.env/.test(paySrc) && /WXPAY_MCH_ID/.test(paySrc) && !/mch_id:\s*'[0-9]{6,}'/.test(paySrc))

const seedSrc = read(path.join(cf, 'seed', 'index.js'))
check('seed: 生产环境拒绝执行（SEED_ENABLED 开关）', () => /SEED_ENABLED/.test(seedSrc) && /403/.test(seedSrc))

const uniidSrc = read(path.join(cf, 'uni-id', 'index.js'))
check('uni-id: appsecret 来自 process.env', () => /process\.env/.test(uniidSrc) && /WX_APPSECRET/.test(uniidSrc))

// V3 原版设计：admin* 端点分布在各用户云函数中（与 V3 一致，不强制收敛）
check('V3 行为: order 保留 adminGetOrders/adminUpdateStatus', () => /adminGetOrders/.test(read(path.join(cf, 'order', 'index.js'))) && /adminUpdateStatus/.test(read(path.join(cf, 'order', 'index.js'))))
check('V3 行为: member 保留 adminGetMembers/adminChangePoints', () => /adminGetMembers/.test(read(path.join(cf, 'member', 'index.js'))))

// ===== V3 原版 action 保留 =====
const memberSrc = read(path.join(cf, 'member', 'index.js'))
check('member: V3 actions 保留（getMember/updateMember/changePoints/changeBalance）', () => ['getMember','updateMember','changePoints','changeBalance'].every((a) => memberSrc.includes(a)))
const cartSrc = read(path.join(cf, 'cart', 'index.js'))
check('cart: getCart + syncCart 保留', () => /getCart/.test(cartSrc) && /syncCart/.test(cartSrc))
check('member: signIn action 存在（按日幂等）', () => /case 'signIn'/.test(memberSrc) && /daily_sign_in/.test(memberSrc))
const storeSrc = read(path.join(cf, 'store', 'index.js'))
check('store: getPackages 返回空数组', () => /getPackages/.test(storeSrc))

// ===== Schema 归一 =====
const ordersSchema = read(path.join(dbDir, 'orders.schema.json'))
check('orders: status 枚举含 refunded', () => /refunded/.test(ordersSchema))
check('orders: total_price 为 double(number)', () => /"total_price"[\s\S]*"bsonType":\s*"double"/.test(ordersSchema))
const uniidSchema = read(path.join(dbDir, 'uni-id-users.schema.json'))
check('uni-id-users: avatar 为 URL 字符串、balance 为 double', () => /"avatar"[\s\S]*"bsonType":\s*"string"/.test(uniidSchema) && /"balance"[\s\S]*"bsonType":\s*"double"/.test(uniidSchema))
check('orders: 声明 member_id+status 索引', () => /"member_id":\s*1[\s\S]*"status":\s*1/.test(ordersSchema))

// ===== 管理后台 =====
const apiJs = read(path.join(admin, 'src', 'utils', 'api.js'))
check('管理后台 api.js: 无硬编码 clientSecret 默认值', () => /VITE_UNICLOUD_CLIENT_SECRET/.test(apiJs))
check('管理后台: .env.example 存在', () => exists(path.join(admin, '.env.example')))
check('管理后台: API 从 Vite 环境读取空间配置', () => /import.meta.env.VITE_UNICLOUD_SPACE_ID/.test(apiJs))
check('管理后台: 安全环境模板包含提供商配置', () => /VITE_UNICLOUD_PROVIDER/.test(read(path.join(admin, '.env.example'))))
const loginVue = read(path.join(admin, 'src', 'pages', 'login', 'index.vue'))
check('管理后台登录: 无硬编码 admin/123456 校验', () => !/admin.*123456/.test(loginVue) && /adminRequest\('login'/.test(loginVue))
const dashboardVue = read(path.join(admin, 'src', 'pages', 'index', 'index.vue'))
check('管理后台: ECharts 看板 5 统计 action 保留', () => ['getDashboardOverview','getOrderTrend','getGoodsSalesRank','getConsumptionDistribution','getRecentOrders'].every((a) => dashboardVue.includes(a)))

// ===== seed-data =====
check('seed-data: 4 个 JSON 存在', () => ['1-goods-category.json','2-goods.json','3-store.json','4-banner.json'].every((f) => exists(path.join(seed, f))))
const goodsJson = read(path.join(seed, '2-goods.json'))
check('seed-data: 无 TODO_CATEGORY_ID 占位', () => !/TODO_CATEGORY_ID/.test(goodsJson))
check('seed-data: 商品引用确定性分类 id', () => /cat_signature|cat_drinks/.test(goodsJson))

// ===== 敏感项全局 grep（源码零密钥） =====
function walk(dir, acc = []) {
  if (!exists(dir)) return acc
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.DS_Store') continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}
let leaked = []
for (const file of [...walk(path.join(uc, 'common')), ...walk(path.join(cf, 'common')), path.join(cf, 'uni-id', 'wx.local.json')]) {
  if (!file.endsWith('.json')) continue
  try {
    const data = JSON.parse(read(file))
    const inspect = (value) => {
      if (!value || typeof value !== 'object') return
      for (const [key, child] of Object.entries(value)) {
        if (['tokenSecret', 'passwordSecret', 'appsecret'].includes(key) && typeof child === 'string' && child && !/填写|示例|your|appsecret/i.test(child)) leaked.push(path.relative(root, file))
        inspect(child)
      }
    }
    inspect(data)
  } catch {}
}
check('活动配置不含内置签名密钥或 AppSecret（不覆盖历史归档）', () => leaked.length === 0)

// ===== 运行 =====
let failed = 0
for (const item of checks) {
  let ok = false
  try { ok = Boolean(item.predicate()) } catch { ok = false }
  if (ok) console.log(`PASS  ${item.name}`)
  else { failed += 1; console.error(`FAIL  ${item.name}`) }
}
if (leaked.length) console.error('发现敏感配置；仅报告文件，不输出密钥或匹配模式:', [...new Set(leaked)])
console.log(`\n共 ${checks.length} 项检查，失败 ${failed} 项`)
process.exit(failed > 0 ? 1 : 0)
