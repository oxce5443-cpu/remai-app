# Customer localization plan

## Evidence and scope

The customer app uses Vue 3 and uni-app with 32 Vue page files, shared components, native navigation/tab labels, and Chinese labels generated in JavaScript. There is no current locale engine. The administration client is a separate application and requires its own locale integration; this change targets the customer journey first.

## Implementation

1. Keep Chinese source labels as translation keys and add a dependency-free reactive locale engine.
2. Translate explicit template labels and display expressions, placeholders and accessibility labels without changing stored business values, request payloads, addresses, user names or customer remarks.
3. Translate native navigation/tab titles and toast/modal labels centrally, including newly created requests after switching languages.
4. Add a persisted Chinese/English switch accessible from My Account while logged out.
5. Prefer explicit bilingual catalog fields from backend records. Product names, descriptions, categories, store content and rich-text marketing content require translated source data; do not fabricate translations for customer-authored content.
6. Verify compiler compatibility, locale persistence/reactivity and representative navigation/order states. Browser build checks alone cannot establish native WeChat rendering or real payment readiness.

## Risks

Chinese string comparisons in fulfillment/order state code must remain unchanged. Template literals with interpolated values require careful translation. Dynamic native titles may be updated during page lifecycle events. English labels are longer and require screenshot checks at mobile widths. Existing remote image text and HTML content cannot be translated by replacing application labels. Third-party parser/calendar internals must not receive broad source rewrites.

## Implementation evidence

- Inspected 54 customer/shared Vue SFCs including two local calendar components. Initial extraction identified 420 unique Chinese source strings across template text, literal attributes, script display defaults and native titles. The English dictionary includes these labels plus parameterized count/minimum-spend phrases and generic API errors.
- My Account now exposes Chinese/English controls without login. Template display translation preserves canonical order modes, payment methods, property selections, address and customer nickname/remark values. The cutlery picker translates its display array while keeping numeric indices unchanged.
- Catalog fields prefer merchant-approved English variants. Cart items retain the English product name, and menu search considers both languages. Unknown merchant text stays intact and requires approved bilingual content; this is not automatic machine translation.
- Removed fabricated homepage fallback sales, prices, store hours and branch claims, and removed the arbitrary membership card date and default premium tier. Unavailable data now produces an explicit unavailable state.
- `node scripts/locale.test.mjs`: 3 passed, 0 failed (locale persistence, merchant fields, native chrome/dialogs). All 54 template compilations completed without template errors. Generic SFC parsing flags the pre-existing conditional multi-script blocks in `uni-swipe-action-item`; the uni-app platform preprocessor is the authoritative build check for that component.
- `git diff --check`: passed after normalization of five previously mixed-CRLF SFCs.

## Remaining verification and product issues

Native WeChat visual checks, English overflow checks, real authentication, live catalog retrieval, full checkout/payment, and admin translated-data editing still require integration verification. Existing inert controls observed in help centre, coupon redemption, gift cards and package purchase need a separate feature audit; translated labels do not prove those functions work. Rich-text coupon/marketing content and text embedded in raster assets require approved English assets/content.

## Administration localization extension

The administration frontend has 12 Vue pages, uses the existing Vue 3 uni-app stack and Element Plus, and stores administrator authentication separately. Extend the same lightweight locale engine with an administrator dictionary rather than installing another library. Translate template labels, native page/tab labels, validation messages, confirmation dialogs and Element Plus built-in controls; leave form values, query keys, stored enums and server payloads unchanged. Provide a visible language control on every page including signed-out login. Use Element Plus's existing bundled English/Chinese language objects through a reactive global provider. Dashboard chart legends require an explicit locale-triggered redraw; imported merchant data requires approved bilingual values. Verify source compilation, literal label coverage and browser interactions before claiming the complete interface translated.

Administration implementation: all 12 page templates now translate UI labels and include the shared language switch (inside the login form on the signed-out screen). A 264-label administration dictionary covers all 250 initially extracted source labels. The same customer locale controller registers admin native navigation/tab labels without copying authentication or cloud configuration. Element Plus receives its existing bundled English/Chinese locales through `provideGlobalConfig(computed(...), app, true)`, allowing built-in controls to update reactively. Validation messages use accessors so new validation resolves the active language; Element Plus messages/confirmations and dynamic deletion prompts translate at invocation. Dashboard legend/axis labels redraw on language changes without fetching or modifying cloud data. Vue is deduplicated in the admin Vite configuration so imported shared locale refs use the app's reactivity runtime.

Administration source verification: 14 Vue SFCs (12 pages, App and LanguageSwitch) compiled templates/scripts with zero errors; all 250 baseline label keys have dictionary entries; `git diff --check` passed. This source check does not replace a browser smoke test or native build. Fixed a pre-existing goods-management runtime defect: edit/delete handlers referenced `ElMessage` and `ElMessageBox` without importing them.
