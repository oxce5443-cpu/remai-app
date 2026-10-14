# REMAI (热麦)

A WeChat restaurant ordering application built with **uni-app, Vue 3 and uniCloud**, accompanied by an H5 merchant administration console. Customers browse products, customise their cart, select cutlery and place orders; the backend manages catalogue data, membership, orders and WeChat Pay integration.

**Status: audited development baseline — NOT READY for production release.** Both applications compile locally, but cloud deployment, real WeChat login/payment, complete QR store/table validation and device acceptance remain outstanding. See the [readiness assessment](audit/2026-10-14/FINAL-ASSESSMENT.md) before using real customer data or accepting payments.

## Architecture

| Directory | Responsibility |
| --- | --- |
| `小程序前端/` | Customer Mini Program: Vue 3, Vuex, uni-app pages, components and static assets |
| `小程序前端/api/` | Cloud-function transport, response handling and field-name conversion |
| `小程序前端/uniCloud-aliyun/cloudfunctions/` | 15 cloud functions, including `uni-id`, `admin`, `order`, `pay`, catalogue and membership services |
| `小程序前端/uniCloud-aliyun/cloudfunctions/common/` | Deployable shared authentication and configuration modules |
| `小程序前端/uniCloud-aliyun/database/` | 17 database collection schemas and example initial data |
| `管理后台/` | Merchant H5 application: Vue 3, Pinia, Element Plus and Vite |
| `seed-data/` | Sample catalogue/store/banner data and explicit import utilities |
| `scripts/` | Static verification, secret scanning and isolated backend regression tests |
| `工程报告/`, `audit/` | Historical documentation, architecture, defects, remediation and release checklists |

The four customer entry pages are Home, Menu, Orders and My Account. Business data is accessed through uniCloud functions. User authentication exchanges a WeChat login code server-side and issues an application JWT; the merchant console uses a separate administrator credential and signed token. [Authentication details and request flow](audit/2026-10-14/AUTHENTICATION.md).

Historical backups, compiled releases, `node_modules`, local `.env` files, private certificates and editor/cache files are intentionally excluded. Required source code and static assets are retained in their existing directories.

## Development environment

- macOS, Linux or Windows with Node.js and npm; local baseline was tested with Node **24.14.1**. Keep the committed lockfiles and use `npm ci`.
- HBuilderX with Vue 3/uni-app and uniCloud support.
- WeChat Developer Tools and an authorised Mini Program AppID.
- An accessible **uniCloud Alibaba Cloud** service space for integration testing.
- A WeChat Pay merchant account bound to the Mini Program for real payments.

The dependencies pin DCloud packages to `3.0.0-4080720251210001`. The Mini Program commands use a Node launcher that resolves the source directory and reads ignored local environment configuration. HBuilderX is an alternative development entry point.

## Install and build from a clean checkout

```bash
git clone https://github.com/oxce5443-cpu/remai-app.git
cd remai-app

cd 小程序前端
npm ci
# Copy .env.example to .env.local and fill in the cloud client association values.
cp .env.example .env.local
npm run build:mp-weixin
cd ../管理后台
npm ci
npm run build:h5
```

Customer output: `小程序前端/dist/build/mp-weixin/`.

Merchant output: `管理后台/dist/build/h5/`.

Development commands are `npm run dev:mp-weixin` from `小程序前端/` and `npm run dev:h5` from `管理后台/`. Compilation does not require merchant secrets, but real login, API data and payment require configured cloud services.

## uniCloud configuration

1. Open `小程序前端/` in HBuilderX. Inspect the existing cloud-space binding, owner, region, billing and backups before changing it. An expired service must be investigated or renewed; **do not recreate or overwrite a production space/database**.
2. Use an isolated development/staging space. Review `小程序前端/config/env.js` and set the client association values using `小程序前端/.env.example` → `.env.local`; the current space identifier is public configuration, not a usable cloud credential. The existing dev/staging/prod entries require isolation before release.
3. Confirm the Mini Program AppID in `manifest.json`, `project.config.json`, environment configuration and cloud functions belongs to the intended account. AppIDs are public identifiers; AppSecrets are private.
4. Configure the following **server environment variables** in the uniCloud console. Use `.env.cloud.example` as a names-only checklist; uniCloud does not automatically load that file. Never put server secrets in frontend `VITE_*` variables.

| Variables | Cloud function / purpose |
| --- | --- |
| `UNI_ID_TOKEN_SECRET` | Same strong random value, at least 32 characters, on `uni-id`, `member`, `order`, `pay`, `cart`, `address`, `card`, `coupon`, `points` |
| `WX_APPID`, `WX_APPSECRET` | `uni-id`: server-side WeChat login |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD_SALT`, `ADMIN_PASSWORD_HASH`, `ADMIN_TOKEN_SECRET` | `admin`: merchant authentication |
| `WX_APPID`, `WXPAY_MCH_ID`, `WXPAY_APIV3_KEY`, `WXPAY_MCH_SERIAL_NO`, `WXPAY_MCH_PRIVATE_KEY` | `pay`: merchant identity, API v3 key and RSA signing |
| `WXPAY_PLATFORM_PUBLIC_KEY`, `WXPAY_PLATFORM_PUBLIC_KEY_ID`, `WXPAY_NOTIFY_URL` | `pay`: notification verification and HTTPS callback |
| `SEED_ENABLED=false` | Keep sample-data insertion disabled by default |

Administrator hashes use **`crypto.scryptSync(password, salt, 64).toString('hex')`**. Configure your own strong password and random salt/signing keys. Historical documents referring to iterative SHA-256 or payment API v2 describe obsolete configuration. Do not reuse sample credentials.

5. Review and upload the shared modules and cloud functions using HBuilderX. The deployable shared modules are under `cloudfunctions/common/`; additional legacy/plugin copies remain in the tree and must not overwrite the audited configuration.
6. Review and upload database schemas only to the intended space, with a backup/change plan for any existing data. Client writes to server-owned data are denied; cloud functions must also enforce their own authentication and ownership checks.
7. Sample data is optional and intended for a verified empty test space. Inspect the importer and target first. Enable `SEED_ENABLED` only for the explicit initialisation operation, then disable it. Never run seed blindly against production.

### Merchant H5 configuration

Copy `管理后台/.env.example` to an ignored `.env.development` or `.env.production`, then configure:

```dotenv
VITE_UNICLOUD_PROVIDER=aliyun
VITE_UNICLOUD_SPACE_ID=<your-space-id>
VITE_UNICLOUD_CLIENT_SECRET=<web-association-value>
```

The Web association value is exposed by the browser build and **does not grant administrator privileges**. Keep administrator passwords, token signing keys and merchant private keys on the server. Configure authorised Web domains/origins in the cloud console.

## WeChat Developer Tools

1. Build the Mini Program, then import `小程序前端/dist/build/mp-weixin/` into WeChat Developer Tools. Do not import a historical archive or root-level compiled directory.
2. Select the correct AppID, verify account/project permissions and confirm the app can reach its configured cloud space.
3. For HBuilderX development, open `小程序前端/` and use **Run → Mini Program Simulator → WeChat Developer Tools**. HBuilderX may generate its own ignored `unpackage/` output.
4. Configure production request/upload/download domains and privacy declarations in the WeChat console. The existing development `urlCheck=false` setting is not a production compliance check.
5. Test scan/cold launch, login/expiry, menu availability, cutlery, order retries and payment cancellation/confirmation on both iOS and Android devices.

## Tests

Run from the repository root:

```bash
node --test scripts/security-regression.test.cjs
node scripts/verify-plan.mjs
node 小程序前端/scripts/verify-wechat-entry.mjs
python3 scripts/scan-secrets.py
```

The baseline has 88 backend regression tests, 62 static checks and 5 Mini Program entry checks. Backend tests execute real cloud-function code with isolated database models and generated test cryptographic keys. They do not establish real cloud transaction behaviour or merchant integration. The secret scanner checks the actual tracked/candidate upload files, including XML inside Office documents, without printing matched values.

## Deployment and release

Deployment is a separate, explicitly approved operation:

1. Complete the [release checklist](audit/2026-10-14/DEPLOYMENT-CHECKLIST.md), especially server order-creation transactions/idempotency, QR store/table validation, complete pricing, real payment reconciliation/refunds and privacy requirements.
2. Deploy reviewed schemas, shared modules and functions to an isolated space; configure environment variables there and run integration tests.
3. Configure the `pay` function's HTTPS URL endpoint as `WXPAY_NOTIFY_URL`. Notifications must retain the original body and signature headers. Verify real successful/failed notifications, replay handling, transaction conflicts and refunds. Never simulate successful production payments.
4. Build/deploy the merchant H5 to approved hosting with the matching Web association configuration.
5. Produce a WeChat experience version, perform device/operational acceptance, prepare privacy and release-review materials, then obtain approval before production deployment/submission.
6. Establish monitoring, backups, payment reconciliation and rollback procedures.

Online recharge is intentionally unavailable until a real paid recharge flow exists. Full multi-administrator RBAC and server-side logout are also outstanding. No deployment or production-resource creation is performed by cloning, installing or building this repository.

## Security and documentation

Secrets must be entered through local ignored environment files or the cloud console. If a credential was ever stored in a historical copy, rotate it at its issuer; removing text from this baseline does not revoke it. Do not upload excluded backups, screenshots of credentials or local rollback snapshots.

Start with the [audit assessment](audit/2026-10-14/FINAL-ASSESSMENT.md), [authentication walkthrough](audit/2026-10-14/AUTHENTICATION.md) and [deployment checklist](audit/2026-10-14/DEPLOYMENT-CHECKLIST.md). Older reports are preserved for project history and may contain obsolete setup instructions. Third-party code retains its original licence notices; this baseline does not grant rights to third-party branding or assets.
