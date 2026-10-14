/**
 * 种子数据导入脚本
 *
 * 用法（在项目根目录，Node 18+）：
 *   node seed-data/import-seed.js
 *
 * 环境变量：
 *   UNICLOUD_SPACE_ID      云空间 ID（必填）
 *   UNICLOUD_CLIENT_SECRET Web 端 clientSecret（必填）
 *
 * 说明：
 * - 分类使用确定性 _id（cat_signature / cat_drinks / cat_snacks / cat_new），
 *   商品 category_id 直接引用，无需人工替换 TODO 占位。
 * - 幂等：按 _id upsert，重复运行不会重复插入。
 * - 金额字段为 number（元），与 schema 归一一致。
 */
const https = require('https')
const fs = require('fs')
const path = require('path')

const SPACE_ID = process.env.UNICLOUD_SPACE_ID || ''
const CLIENT_SECRET = process.env.UNICLOUD_CLIENT_SECRET || ''

if (!SPACE_ID || !CLIENT_SECRET) {
  console.error('请先设置环境变量 UNICLOUD_SPACE_ID 与 UNICLOUD_CLIENT_SECRET')
  process.exit(1)
}

const BASE = `https://${SPACE_ID}.api.aliyun.com`

function request(method, p, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(p, BASE)
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'space-id': SPACE_ID,
        'space-token': CLIENT_SECRET
      }
    }, (res) => {
      let data = ''
      res.on('data', (c) => { data += c })
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch { resolve(data) } })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

function upsert(collection, doc) {
  return request('POST', `/database/${collection}/upsert`, { data: doc })
}

async function main() {
  const dir = __dirname
  const categories = JSON.parse(fs.readFileSync(path.join(dir, '1-goods-category.json'), 'utf8'))
  const goods = JSON.parse(fs.readFileSync(path.join(dir, '2-goods.json'), 'utf8'))
  const stores = JSON.parse(fs.readFileSync(path.join(dir, '3-store.json'), 'utf8'))
  const banners = JSON.parse(fs.readFileSync(path.join(dir, '4-banner.json'), 'utf8'))

  console.log('导入分类...')
  for (const c of categories) await upsert('goods-category', c)
  console.log(`  ✓ ${categories.length} 个分类`)

  console.log('导入商品...')
  for (const g of goods) await upsert('goods', g)
  console.log(`  ✓ ${goods.length} 个商品`)

  console.log('导入门店...')
  for (const s of stores) await upsert('store', s)
  console.log(`  ✓ ${stores.length} 个门店`)

  console.log('导入轮播图...')
  for (const b of banners) await upsert('banner', b)
  console.log(`  ✓ ${banners.length} 张轮播图`)

  console.log('\n种子数据导入完成。')
}

main().catch((e) => { console.error('导入失败:', e); process.exit(1) })
