# REMAI independent engineering assessment — 2026-10-15

**Current verdict: NOT READY for public transactions.** The application is a functional development baseline with concrete UI/localization improvements. A percentage such as “70% complete” is not substantiated by successful customer/admin/merchant acceptance evidence. Healthy cloud service alone will not resolve the verified source defects below.

This is an independent engineering rubric, not an Apple, WeChat, ISO or external certification. Scores mean: 1 = important functionality unproven or blocked; 2 = partial working implementation with material gaps; 3 = locally verified foundation needing integration acceptance; 4 = representative integration verified; 5 = production operations and release gates verified. No category may compensate for a failed payment/data-integrity release gate.

| Area | Provisional score / 5 | Evidence and practical limit |
|---|---:|---|
| Architecture / maintainability | 3 | Existing Vue 3/uni-app customer app, separate admin H5, central API/store and uniCloud functions retained; no replacement framework added. Main workflows inspected; not a claim of exhaustive behavior coverage. |
| Customer visual usability | 3 | Warm bakery identity preserved, clearer shared styling and English layouts; local H5 screenshots at 390px plus account at 320/430px. Native iPhone safe areas and touch behavior still need unlocked simulator/real device inspection. |
| Internationalization | 3 | Shared persisted reactive locale, customer presentation migration, native UI adapter, explicit merchant English fields and cart round-trip mapping. Missing merchant translations and image/rich-text copy require approved content. Admin UI implementation/verification is tracked separately below. |
| Security foundation | 2 | Authentication/payment signature/model regression tests pass locally; deployed permission state, secrets rotation, admin rate limits/RBAC and real merchant operation remain unverified. |
| Transactional correctness | 2 | Atomic idempotent creation and conditional cancellation pass isolated regressions; persisted client retry recovery and server amount reconfirmation are implemented. Real cloud concurrency, complete quotation and external-payment compensation remain release blockers. |
| Cloud / operational readiness | 1 | Actual WeChat simulator observed `FC invoke failed, resource exhausted` for store/banner/goods. Billing/quota cause is not established. No production deployment or database mutation was performed. |
| Testability | 3 | Source-executing isolated regressions and browser checks exist; mocked/model database tests do not prove actual cloud transaction semantics or end-to-end payment. |

## Implemented changes and why

- Final local verification: 113 regression tests, 62 static plan checks and 29 route checks pass; customer browser checks pass 9/9 and offline admin presentation checks pass 3/3. These results do not establish live cloud or merchant acceptance.
- Persisted checkout attempts now survive metadata refresh and intervening drafts. Server order creation writes the header and lines transactionally with owner-scoped idempotency. A changed authoritative total requires confirmation before payment. Deploy the corresponding client/backend changes together; older clients lack required request keys.

- Added shared locale behavior with Chinese default, persistent English selection, reactive presentation functions, safe fallbacks, native tab/title/dialog translation and merchant-approved English field lookup. Customer names, addresses, notes, IDs, amounts and backend enums remain canonical.
- Migrated customer pages/components/calendar to explicit translation calls; language selection works while signed out. English catalogue names survive both local cart use and cloud synchronization/reload. Unsupported translations remain original rather than being invented.
- Added English product/category/store/banner inputs through admin forms, backend writes, schemas and customer reads. Existing records need no destructive migration.
- Preserved authoritative menu price, stock (including zero), sales and descriptions. Previously the menu projection stripped those fields and then constructed invalid prices and synthetic available stock.
- Replaced the detail page’s hardcoded product ID/prices/recommendations with actual requested product loading, unavailable/error states and guarded canonical cart updates. Specification-dependent detail products are explicitly unavailable online until the real selection contract exists; no fake successful selection flow is promised.
- Corrected H5 entry import resolution: `./App` resolved to `App.json`, producing a blank app; explicit `./App.vue` renders the actual application.
- Corrected checkout presentation to read the actual store-info object for store/fee rows. A disposable local cart reproduced the missing fee display before the change. This does not resolve the separate server quotation mismatch.
- Removed invented homepage sales, prices, branch/opening claims and membership date/tier defaults when live data is absent. Added correct status-bar spacer behavior for the custom home header; native visual acceptance remains pending.
- Refined shared typography, contrast, surfaces, selected/disabled states, English wrapping, focus treatment, reduced motion and critical touch targets. No third-party assets, fonts, SDKs, models or new runtime packages were downloaded for this pass.

Detailed evidence and implementation records: `IMPROVEMENT-PLAN.md`, `BACKEND-AUDIT.md`, `LOCALIZATION-PLAN.md`, `UI-AUDIT-PLAN.md`, source diffs, executable tests and `screenshots/results.json`. Changes remain reviewable in the working tree; no commit hash, PR, upload or deployment is claimed.

## Verified release blockers and next corrective actions

| Priority | Issue / source evidence | Impact | Next action |
|---|---|---|---|
| P0 | Atomic/idempotent order creation is now locally implemented and model-tested; deployed behavior remains unproven (`cloudfunctions/order/index.js`, createOrder) | Release cannot rely on local models for actual transaction limits/isolation | Deploy matching client/server/schema to an authorized isolated space; verify failure/retry/concurrency against real database |
| P0 | Local paid→cancelled overwrite is fixed with a conditional owner/status update; remote payment can still arrive after cancellation | Received money and cancelled fulfillment may diverge | Merchant close/query/reconciliation and compensation, plus real concurrency acceptance |
| P0 | Merchant response verification, active query recovery/refunds and stock-loss compensation incomplete (`cloudfunctions/pay/index.js`) | Missing notification or successful payment with failed local settlement cannot be safely recovered | Complete and verify merchant lifecycle in an authorized isolated environment |
| P1 | Server base-price quotation and fixed fees disagree with UI options/fees | Charged and displayed selections/totals may differ | One server-authoritative quotation contract; validated spec and fee pricing |
| P1 | Menu response still empties specification arrays; detail cannot honestly complete specification purchase | Products requiring options cannot complete supported selection | Implement catalogue spec data and server pricing together; test canonical selection through payment |
| P1 | QR collection naming and active store/table association are inconsistent/unvalidated | Forged/disabled/cross-store table values may be accepted | Canonical server-resolved QR/store/table model with safe legacy handling |
| P1 | Existing coupon redemption, gift-card purchase, package payment and help-centre controls include inert/unimplemented actions | Visible interactions are not a complete product | Implement approved operational/legal content and real endpoints; do not substitute fake success |
| P1 | Admin operational validation/RBAC/limiting/audit and financial adjustment gaps | Operational misuse/inconsistent balances | Bounded validation, attributable role/store permissions and atomic financial ledgers |
| P1 | Live cloud currently fails; native language/status-bar rendering verified after Mac unlocked, physical device acceptance remains open | No successful complete customer journey established | Restore verified cloud access; run physical-iPhone acceptance before release |
| P2 | Merchant custom text, historical snapshots, selected spec labels, legal rich text and text baked into images need approved translations | Some real content can remain Chinese | Enter audited English content; review both locales with actual catalogue/order data |

See `BACKEND-AUDIT.md` for exact source paths and local fault evidence. No cloud migration, resource recreation, production seeding, live order, payment, refund or automatic merge was performed.

## Release acceptance checklist

- [ ] Complete the transactional/payment/quotation/QR code defects above with relevant fault and concurrency regressions.
- [ ] Verify isolated cloud deployment: function/common-module versions, environment variables, schema/indexes and actual auth/permissions. Rotate previously exposed credentials through their authorized owners.
- [ ] Confirm actual business identity, WeChat AppID ownership, merchant eligibility, approved privacy/membership/refund terms, customer support and content/asset rights.
- [ ] Demonstrate scan → validated store/table → live menu/options → cart → explicit cutlery → server quote → unique order → real verified payment → fulfillment → customer/admin matching status.
- [ ] Exercise cancellation, timeout/retry, missing callback, stock conflict, failure recovery, refund and reconciliation in the appropriate merchant test/acceptance environment.
- [ ] Review Chinese and English with real translated catalogue data, historical orders, long labels, native controls, errors and customer-entered content.
- [ ] Inspect all four main screens and checkout on representative physical iPhones, safe areas, font scaling and touch/scroll behavior. H5 screenshots are not iOS certification.
- [ ] Verify real administrator product availability, zero stock, English content entry, order status/cutlery visibility and role boundaries.
- [ ] Complete explicit release approval and rollback/monitoring/backup preparation before production upload or deployment.

The complete public-ready objective remains active. This report records concrete progress and unmet requirements; it does not redefine completion as a passing local build.
