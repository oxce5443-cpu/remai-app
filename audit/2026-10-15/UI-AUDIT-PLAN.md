# REMAI visual-system audit and focused plan

Scope: customer frontend shared SCSS, inspected against Home, Menu, Orders, Account and checkout source. This is a source-level assessment; device screenshots and interaction checks remain separate verification gates.

Direction: warm bakery identity, quiet cream surfaces, dark cocoa actions, system typography for transactional content, and serif branding only where already intentional. Preserve existing layout and business behavior.

| Priority | Evidence | Impact | Change |
|---|---|---|---|
| P1 | `static/style/app.scss` final brand block forces gradient/background, white foreground and zero border onto every primary button with `!important` | Overrides native plain and disabled states; unavailable checkout may appear enabled | Remove forced declarations; preserve disabled/plain states and use dark cocoa contrast |
| P1 | Same block forces every `.prop-value` background with `!important` | Suppresses page-specific selected option styling | Stop globally styling functional property choices |
| P1 | Same block paints `.cart-item` and `.profile-row` as elevated cards alongside their containing sections | Nested card surfaces obscure the page hierarchy | Keep global card treatment for semantic containers only |
| P2 | `uni.scss` uses low-contrast caramel `#B6855B` for white-labelled primary controls; secondary tokens as light as `#9B8573` | Small labels and primary actions become harder to read | Darken action and muted text tokens, retain wheat accents |
| P2 | Global brand block assigns serif fonts to product names and all prices | Transactional information loses native platform readability | Restrict serif utility to deliberate branding; use system numerals for amounts |
| P2 | `.old-money` globally adds strong gradients, multiple shadows and blur to navigation and bottom bars | Excess decoration competes with product imagery | Flat cream page background, opaque surfaces, restrained borders/shadows |
| P2 | Menu `.qty-btn` is 42rpx, `.qty-add` 46rpx, modal `.btn` 36rpx; several pills are similarly short | Small tap targets, especially on narrow devices | Add minimum hit area to critical existing controls without changing flow |
| P2 | English text is longer than Chinese; headers/store rows contain horizontal flex groups | Potential wrapping/overflow in translated mode | Provide conservative wrapping and flex min-width rules in shared SCSS |

Verification: compile shared SCSS through the existing WeChat build; inspect actual rendered Chinese and English main pages at small-phone sizes. A successful build is not proof of visual or WCAG compliance. Native WeChat/real iOS, safe-area, keyboard and voice-over checks remain required.

## Implementation verification

- Shared stylesheet compiled with installed Sass using the project's `~@/` alias: 16,263 CSS characters, exit 0.
- `git diff --check` for both changed SCSS files passed.
- Full WeChat build attempted while localization was being generated: blocked by missing `locale/en.js` at that moment; final integrated build belongs to the main verification pass.
- Existing page-level `.prop-value.selected` retains its contrasting border/background; removed global forced background so the selected rule can apply.
- No source layouts, handlers, routes, assets, dependencies or cloud bindings changed by this visual pass.
- Existing safe-area layout declarations retained. Real iOS screenshots, English long-copy layout and keyboard/screen-reader checks are unverified until runtime review.
