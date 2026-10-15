# Verification record — 2026-10-15

This record distinguishes local presentation/model checks from real cloud/payment acceptance.

## Observed runtime checks

- Customer H5 preview: `scripts/ui-locale-smoke.cjs` passed nine checks. Chinese→English, English persistence, switch back, English home/menu/pickup/checkout/login rendering and account layouts at 320/390/430px were exercised. A disposable local browser cart reproduced the checkout fee-row defect before its fix. No customer order or payment was submitted. Images/results are under `screenshots/`.
- Administrator H5 preview: `scripts/admin-locale-smoke.cjs` passed three checks: signed-out English selection, persistence, and product dialog English labels/content inputs. The browser blocked all external requests. A local invalid marker opened the offline product presentation; it was removed. This is not evidence of successful administrator authentication or a database save.
- WeChat Developer Tools Stable 2.02.2608070 / base library 3.15.2 / iPhone 12/13 Pro simulator: the actual custom homepage rendered below the clock/notch after the status spacer fix. Account language selection changed visible account labels, cached customer pages, native tabs (`Home`, `Menu`, `Pickup`, `Account`) and the native title (`Account`). These changes were observed through the app's accessibility tree after a real button click, not inferred from code or browser tests.
- The same native console still reports `FC invoke failed, resource exhausted` for store, goods and banners. The cloud billing/quota/configuration cause is not established. Menu error/retry UI renders; a successful live catalogue/order journey was not demonstrated.
- The Mac was temporarily locked; it was subsequently unlocked by the user and native language/status checks resumed. Physical iPhone behavior, native pay sheet, real identity and merchant acceptance remain untested.

## Behavioral regression evidence

- Final local suite: **113 passed, 0 failed** (`node --test scripts/*.test.cjs scripts/*.test.mjs`). Static plan checks: **62 passed**; WeChat entry verification: **29 routes passed**. Secret scan: **415 Git candidate files, 0 findings**; binary images are outside text scanning. `git diff --check` passed.

- Catalogue projection regression reproduced invalid price/stock behavior before the fix.
- English cart round-trip regressions reproduced the lost translation before the fix.
- Product detail regressions reproduced ignored IDs/demo writes before actual source loading and stock guards.
- Locale behavior tests cover persistence, unsupported locale rejection, unchanged canonical merchant records, native dialog callback preservation and configurable administrator navigation.
- New checkout-intent tests cover reuse after module/app recreation, deliberate changed checkout rotation, and selective clearing after matching confirmation/cancellation.
- Review exposed metadata-only key rotation and loss of unresolved attempts after switching drafts. The helper now fingerprints the server's semantic selection fields and retains unresolved attempts separately. A regression covers metadata refresh, A→B→A and module recreation after an ambiguous response. Retained attempts are cleared selectively on confirmed completion/cancellation; storage failure prevents a new request. Clearing application storage still removes this recovery information.
- A checkout flow test reproduced a balance debit when the authoritative server amount differed from the displayed amount. The fix refreshes the canonical pending order and requires renewed confirmation before payment when the total changes.
- New order-creation regressions cover complete atomic writes, rollback after a later line failure, owner-scoped duplicate requests, conflicting payloads, concurrent attempts and corrupted line manifests. This uses the isolated model database; actual uniCloud transaction limits/isolation remain a release gate.

## Reproducible commands

Final customer `build:mp-weixin` and administrator `build:h5` builds exited successfully. Existing Sass deprecation warnings remain. The latest capsule-spacing adjustment was rebuilt but has not yet had a native visual check because the Mac locked again.

From the project root:

```sh
node --test scripts/*.test.cjs scripts/*.test.mjs
node scripts/verify-plan.mjs
node 小程序前端/scripts/verify-wechat-entry.mjs
python3 scripts/scan-secrets.py
```

From `小程序前端`: `npm run build:mp-weixin`.
From `管理后台`: `npm run build:h5`.

Browser scripts require Playwright and a local preview. This pass reused bundled Playwright plus the existing Google Chrome application. Set `NODE_PATH` to the available Playwright package directory and `REMAI_BROWSER_PATH` to a supported browser executable if no Playwright browser is installed. No new project dependency was added.

## Limits

Static predicates, model transactions, viewport overflow assertions and successful builds do not prove production readiness, absence of all visual clipping, actual cloud permissions or completion of all visible interactions. See `READINESS-ASSESSMENT.md` for remaining release blockers and the acceptance checklist.
