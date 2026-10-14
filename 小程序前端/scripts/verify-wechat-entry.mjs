#!/usr/bin/env node
/**
 * 热麦点餐 · 微信小程序入口静态校验
 * 校验：① 根 index.html 存在且含 #app 与 /main.js；② main.js 存在；
 *       ③ pages.json JSON5 合法且每路由对应 pages/*.vue；
 *       ④ pages/ 下无 wxml/wxss/同名编译产物；⑤ manifest.json 含 mp-weixin appid。
 * 输出 PASS/FAIL。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const results = []
function check(name, ok, detail = '') {
	results.push({ name, ok, detail })
}

// ① index.html
const indexHtml = path.join(ROOT, 'index.html')
if (fs.existsSync(indexHtml)) {
	const html = fs.readFileSync(indexHtml, 'utf8')
	check('index.html 存在且含 #app 与 /main.js',
		html.includes('<div id="app">') && html.includes('src="/main.js"'))
} else check('index.html 存在', false, '缺失')

// ② main.js
check('main.js 存在', fs.existsSync(path.join(ROOT, 'main.js')))

// ③ pages.json（去注释后 JSON.parse）路由对应 .vue
function stripComments(s) {
	return s.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
}
try {
	const pagesJson = JSON.parse(stripComments(fs.readFileSync(path.join(ROOT, 'pages.json'), 'utf8')))
	const routes = (pagesJson.pages || []).map(p => p.path)
	const subRoutes = (pagesJson.subPackages || []).flatMap(sp =>
		(sp.pages || []).map(p => sp.root + '/' + p.path))
	const allRoutes = [...routes, ...subRoutes]
	const missing = allRoutes.filter(r => !fs.existsSync(path.join(ROOT, r + '.vue')))
	check(`pages.json 合法且路由全部对应 .vue（${allRoutes.length} 路由）`,
		missing.length === 0, missing.join(', '))
} catch (e) {
	check('pages.json JSON5 合法', false, e.message)
}

// ④ 无编译产物
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(en => {
	const p = path.join(dir, en.name)
	if (en.isDirectory()) return walk(p)
	return [p]
})
const pagesDir = path.join(ROOT, 'pages')
const compiled = walk(pagesDir).filter(f => /\.(wxml|wxss)$/.test(f))
check('pages/ 无 wxml/wxss 编译产物', compiled.length === 0, compiled.join(', '))

// ⑤ manifest.json 含 mp-weixin appid
try {
	const m = JSON.parse(stripComments(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8')))
	const appid = (m['mp-weixin'] && m['mp-weixin'].appid) || m.appid || ''
	check('manifest.json 含 mp-weixin appid', /^wx[0-9a-f]{16}$/.test(appid), appid)
} catch (e) {
	check('manifest.json JSON5 合法', false, e.message)
}

// 汇总
const passed = results.every(r => r.ok)
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail && !r.ok ? '  -> ' + r.detail : ''}`)
console.log(`\n==== ${passed ? 'PASS' : 'FAIL'} ====`)
process.exit(passed ? 0 : 1)
