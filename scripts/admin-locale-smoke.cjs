// Offline administration presentation checks: block all external requests, never save or log in.
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

async function run() {
  const output = path.resolve('audit/2026-10-15/screenshots')
  fs.mkdirSync(output, { recursive: true })
  const browser = await chromium.launch({ headless: true, ...(process.env.REMAI_BROWSER_PATH ? { executablePath: process.env.REMAI_BROWSER_PATH } : {}) })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    return url.hostname === '127.0.0.1' || url.hostname === 'localhost' ? route.continue() : route.abort()
  })
  const page = await context.newPage()
  const errors = []
  const checks = []
  page.on('pageerror', error => errors.push(error.message))
  const base = process.env.REMAI_ADMIN_URL || 'http://127.0.0.1:8080'
  try {
    await page.goto(`${base}/#/pages/login/index`)
    await page.waitForLoadState('networkidle')
    await page.locator('.locale-button').filter({ hasText: 'English' }).click()
    await page.getByText('Administrator account', { exact: true }).waitFor()
    assert.equal(await page.locator('html').getAttribute('lang'), 'en')
    checks.push('Signed-out administrator can switch to English')
    await page.screenshot({ path: path.join(output, 'admin-login-en.png'), fullPage: true })
    await page.reload()
    await page.getByText('Administrator account', { exact: true }).waitFor()
    checks.push('Administrator locale persists after reload')
    // A local invalid marker opens presentation only. External network is blocked above.
    await page.evaluate(() => localStorage.setItem('admin_token', 'offline-ui-fixture'))
    await page.goto(`${base}/#/pages/goods/list`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Add product', exact: true }).click()
    await page.getByText('English name', { exact: true }).waitFor()
    await page.getByText('English description', { exact: true }).waitFor()
    checks.push('Product form labels and optional English fields render in English (offline fixture)')
    await page.screenshot({ path: path.join(output, 'admin-product-form-offline-en.png'), fullPage: true })
    await page.getByRole('button', { name: 'Cancel', exact: true }).last().click()
    assert.deepEqual(errors, [], 'No uncaught administration JavaScript errors')
    await page.evaluate(() => localStorage.removeItem('admin_token'))
    fs.writeFileSync(path.join(output, 'admin-results.json'), JSON.stringify({ checks, errors, limits: 'Offline presentation only. All external requests blocked; invalid local token marker removed. No authentication, database write or deployment was exercised.' }, null, 2))
    console.log(JSON.stringify({ passed: checks.length, checks, errors }, null, 2))
  } finally { await browser.close() }
}
run().catch(error => { console.error(error); process.exitCode = 1 })
