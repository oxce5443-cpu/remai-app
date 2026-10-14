/**
 * 云端数据现状只读探查脚本（热麦点餐 · remai-app）
 * 用法：UNICLOUD_SPACE_ID=... UNICLOUD_CLIENT_SECRET=... node check-cloud-data.js
 * 只读查询 goods-category / goods / store / banner 四个集合，输出数量与关键字段。
 */
const https = require('https')

const SPACE_ID = process.env.UNICLOUD_SPACE_ID || ''
const CLIENT_SECRET = process.env.UNICLOUD_CLIENT_SECRET || ''
if (!SPACE_ID || !CLIENT_SECRET) { console.error('missing env'); process.exit(1) }

const BASE = `https://api.next.bspapp.com`

function request(method, p, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(p, BASE)
    const req = https.request({
      hostname: url.hostname, port: 443, path: url.pathname + url.search, method,
      headers: { 'Content-Type': 'application/json', 'space-id': SPACE_ID, 'space-token': CLIENT_SECRET }
    }, (res) => {
      let data = ''
      res.on('data', (c) => { data += c })
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }) } catch { resolve({ status: res.statusCode, body: data }) } })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function list(collection, where = {}) {
  const r = await request('POST', `/database/${collection}/get`, { where, limit: 100 })
  return r
}

async function main() {
  for (const coll of ['goods-category', 'goods', 'store', 'banner', 'orders']) {
    const r = await list(coll)
    const data = r.body && r.body.data ? r.body.data : r.body
    const arr = Array.isArray(data) ? data : []
    console.log(`\n=== ${coll} : ${arr.length} 条 (status=${r.status}) ===`)
    if (coll === 'goods-category') {
      for (const d of arr) console.log('  ', d._id, '|', d.name, '|', d.sort)
    } else if (coll === 'goods') {
      for (const d of arr) console.log('  ', d._id, '|', d.name, '|', d.price, '|', d.image)
    } else if (coll === 'store') {
      for (const d of arr) console.log('  ', d._id, '|', d.name, '|', d.address)
    } else if (coll === 'banner') {
      for (const d of arr) console.log('  ', d._id, '|', d.title, '|', d.image)
    } else {
      console.log('  ', JSON.stringify(arr).slice(0, 300))
    }
  }
}
main().catch(e => console.error('ERR', e.message))
