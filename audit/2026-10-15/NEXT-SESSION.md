# REMAI saved checkpoint — 2026-10-15

Continue in the existing project and repository `oxce5443-cpu/remai-app`. Do not create another repository or replace the stack.

## Work preserved

Customer/admin Chinese-English presentation, merchant English fields, catalogue/stock and real product-detail fixes, checkout fee display, persisted retry recovery, transactional idempotent order creation, conditional pending cancellation, authoritative amount reconfirmation, shared visual improvements, regression scripts, screenshots and audit reports.

Latest local check: 113 tests passed, 0 failed; secret scan found 0 findings in 415 candidate files; diff whitespace check passed. Customer and administrator builds succeeded in the preceding verification pass. See VERIFICATION.md for exact scope and limits.

## Next work

1. Restore legitimate access to the existing uniCloud space. Native requests currently report `FC invoke failed, resource exhausted`; billing/quota cause is unverified. Do not recreate resources or mutate production data.
2. Verify atomic creation/retry/concurrency against an authorized test cloud environment. Deploy matching client/backend versions together because creation now requires request keys.
3. Complete authoritative quotation/specifications, payment query/close/refund/reconciliation and cancellation/payment competition. Do not simulate production payment success.
4. Resolve QR collection/store/table validation and remaining inert customer actions, administrator permissions and financial audit controls described in BACKEND-AUDIT.md.
5. Inspect the latest native capsule spacing and complete physical-device acceptance in both languages. The Mac relocked after earlier native language/status-bar checks.

Public transaction verdict remains NOT READY. No production deployment was performed. Local ignored environment/credential files and generated outputs remain on disk and must stay outside Git.
