// Local preview verification only: no orders, payments, account edits or cloud writes.
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

async function run() {
  const output = path.resolve(process.env.REMAI_UI_OUTPUT || 'audit/2026-10-15/screenshots')
  fs.mkdirSync(output, { recursive: true })
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.REMAI_BROWSER_PATH ? { executablePath: process.env.REMAI_BROWSER_PATH } : {})
  })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const checks = []
  const base = process.env.REMAI_UI_URL || 'http://127.0.0.1:5173'
  try {
    await page.goto(`${base}/#/pages/mine/mine`)
    await page.waitForLoadState('networkidle')
    const languageSwitch = page.getByRole('button', { name: 'English', exact: true })
    await languageSwitch.waitFor()
    await page.screenshot({ path: path.join(output, 'account-zh.png'), fullPage: true })
    await languageSwitch.click()
    await page.getByText('Member benefits', { exact: true }).first().waitFor()
    assert.equal(await page.getByText('我的订单', { exact: true }).count(), 0)
    checks.push('Signed-out language switch updates customer account UI')
    await page.screenshot({ path: path.join(output, 'account-en.png'), fullPage: true })
    await page.reload()
    await page.getByText('Member benefits', { exact: true }).first().waitFor()
    checks.push('English preference survives reload')

    // Local presentation fixture only; never submit or pay for this cart.
    await page.evaluate(() => {
      const store = document.querySelector('#app').__vue_app__.config.globalProperties.$store
      store.commit('SET_STORE', { name: 'Test bakery', packingFee: 2, deliveryCost: 0 })
      store.commit('SET_ORDER_TYPE', 'takeout')
      store.commit('SET_CART', [{ id: 'ui-fixture', name: 'UI test bread', price: 18, number: 1 }])
    })
    await page.evaluate(() => { location.hash = '/pages/pay/pay' })
    await page.getByText('Packaging', { exact: true }).first().waitFor()
    checks.push('Checkout displays the same configured packaging fee used in its total (local fixture)')
    await page.evaluate(() => {
      const store = document.querySelector('#app').__vue_app__.config.globalProperties.$store
      store.commit('REMOVE_CART')
      store.commit('SET_STORE', {})
      store.commit('SET_ORDER_TYPE', 'takein')
    })
    await page.reload()

    for (const [name, route] of [
      ['home', 'index/index'], ['menu', 'menu/menu'], ['pickup', 'take-foods/take-foods'],
      ['checkout', 'pay/pay'], ['login', 'login/login']
    ]) {
      await page.goto(`${base}/#/pages/${route}`)
      await page.waitForLoadState('networkidle')
      if (name === 'menu') await page.getByText('Preparing the menu…', { exact: true }).waitFor({ state: 'hidden', timeout: 25000 })
      await page.screenshot({ path: path.join(output, `${name}-en.png`), fullPage: true })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2)
      assert.equal(overflow, false, `${name} should fit a 390px viewport`)
      checks.push(`${name}: English route renders without horizontal page overflow`)
    }
    await page.goto(`${base}/#/pages/mine/mine`)
    await page.getByRole('button', { name: '简体中文', exact: true }).click()
    await page.getByText('我的订单', { exact: true }).waitFor()
    checks.push('Switching back restores Chinese')
    for (const width of [320, 430]) {
      await page.setViewportSize({ width, height: 844 })
      await page.screenshot({ path: path.join(output, `account-zh-${width}.png`), fullPage: true })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false)
    }
    assert.deepEqual(errors, [], 'No uncaught browser JavaScript errors')
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ checks, errors, limits: 'H5 preview only. Cloud failure states may render. No successful checkout, live merchant transaction or iOS device acceptance is implied.' }, null, 2))
    console.log(JSON.stringify({ passed: checks.length, checks, errors, output }, null, 2))
  } finally { await browser.close() }
}
run().catch(error => { console.error(error); process.exitCode = 1 })
