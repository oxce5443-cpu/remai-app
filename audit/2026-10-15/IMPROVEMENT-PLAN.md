# REMAI focused improvement pass — 2026-10-15

Scope: preserve the existing uni-app/Vue 3 customer app, administration app and uniCloud backend. Improve bakery interface quality and implement Chinese/English customer UI. No production deployment, cloud migration, destructive database work, or live payment is authorized by this pass.

## Initial verified findings

| Priority | Finding | Evidence | Impact | Planned action |
|---|---|---|---|---|
| P0 | Prior release blockers require revalidation, not an assumed 70% readiness score | audit/2026-10-14/FINAL-ASSESSMENT.md; actual backend review in this pass | Builds alone cannot certify ordering/payment integrity | Run existing isolated regressions and inspect current server contracts; record remaining gaps |
| P1 | Customer interface has no shared locale or persisted language preference | 小程序前端/main.js; pages/index/index.vue; pages/mine/mine.vue | English customers cannot navigate/checkout reliably | Add dependency-free reactive locale layer, visible signed-out language switch, translated pages/components/native controls |
| P1 | Merchant-authored content and customer data must not be mutated during translation | api/index.js normalize/serialize; store/index.js | Translating canonical cart/address/order values could damage fulfillment | Translate presentation only; prefer explicit English catalog fields, preserve original user input and payloads |
| P1 | Home displays fabricated fallback sales, price and opening claims when data is unavailable | pages/index/index.vue fallback product/store blocks | Outage can look like a real available catalogue | Replace unsupported claims with honest availability states while preserving navigation |
| P2 | Global styling repeatedly forces gradients/shadows and small secondary text | static/style/app.scss; uni.scss | Weak hierarchy, readability and English layout resilience | Restrained warm surfaces, native system text, legible contrast, safe areas and touch targets |

## Implementation order and acceptance evidence

1. Audit backend and UI; record local baseline tests separately from cloud/device evidence.
2. Add locale tests for persistence, Chinese/English switching, native navigation/messages, safe interpolation and unchanged business/user data; demonstrate missing-feature failure before implementation.
3. Migrate customer presentation to explicit translation calls and reviewed English messages. Keep routes, enums, IDs, prices and API payload semantics stable. Document merchant translations that need actual approved content.
4. Improve existing design tokens/shared styling, then inspect actual rendered primary pages and checkout in both languages. Native WeChat build and real-device acceptance remain separate gates.
5. Build customer WeChat package and admin H5, rerun regression suite and record coverage and limitations. Publish an updated independent readiness assessment; do not infer successful cloud service, merchant authorization or iOS device testing from compilation.

Native multi-agent tools coordinate local audit, locale migration and visual-system changes. Ruflo guidance was inspected; no additional orchestration framework is needed. Taste guidance informs restraint and screenshot critique; its marketing-page constraints do not override bakery application usability.
