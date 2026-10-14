# Cloud connection debugging 2026-10-14

Reported symptoms: POST to api.next.bspapp.com/client returned 403; store, banner, goods and WeChat login failed with “The specified signature does not match.”

Verified local root cause: customer .env defined a legacy UNI_CLOUD_PROVIDER. The build launcher used the merged .env value before the documented .env.local VITE_UNICLOUD_* fields. Parsing the actual compiled JavaScript confirmed its provider clientSecret did not match the current local association configuration. No secret values were printed.

Fix: explicit process UNI_CLOUD_PROVIDER remains an intentional override; otherwise the launcher now prefers documented VITE_UNICLOUD_* fields. The legacy .env JSON is used only if these fields are absent. Invalid/partial current configuration still fails rather than silently selecting stale credentials. The parser uses wx.getWindowInfo when available, retaining the old API for older clients.

Verification: npm run build:mp-weixin completed successfully. Parsed compiled provider now matches local configuration; all eight tabBar icon paths exist. In WeChat Developer Tools, the homepage renders. Opening Menu triggers real cloud calls. The current console contains “FC invoke failed, resource exhausted” for store/banner/goods, rather than the previous signature mismatch. Menu remains unavailable.

Remaining blocker: EXTERNAL CLOUD SERVICE / CONFIGURATION CHECK REQUIRED. Inspect the existing space in the uniCloud console for resource quota, package status, expiry/billing and function logs. No account/billing state has been inspected, and exhaustion is not proof of nonpayment. No production resource, database or cloud function was changed or redeployed. Login and order/payment integration are not verified.

Official configuration reference: https://doc.dcloud.net.cn/uniCloud/concepts/space
