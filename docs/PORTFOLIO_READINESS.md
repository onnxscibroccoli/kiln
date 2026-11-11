# Portfolio reviewer readiness — kiln

**Focus:** Browser-accessible Linux desktop and persistent workspace prototype  
**Current evidence status:** `SOURCE_PRESENT / CI_NOT_VERIFIED` (2026-11-11 snapshot; **not** production approval).  
**Tracking:** [repository issue](https://github.com/onnxscibroccoli/kiln/issues/3) · [portfolio master ledger](https://github.com/onnxscibroccoli/broccoli-core/issues/102)  


## Inspect actual source
- [package.json](https://github.com/onnxscibroccoli/kiln/blob/main/package.json)
- [src](https://github.com/onnxscibroccoli/kiln/tree/main/src)
- [server](https://github.com/onnxscibroccoli/kiln/tree/main/server)

**CI evidence:** no trustworthy workflow result was established during the initial portfolio audit. Mark NOT_VERIFIED until a run proves otherwise.

Recorded 2026-11-11:
- This repository has **no `.github/workflows/`**, so no GitHub Actions CI exists. CI status: NOT_VERIFIED.
- Local reproduction on PR head `a01459f` (main `fed4779` + docs), Node 24.22.1, by a portfolio agent:
  - `npm ci --ignore-scripts` succeeded (exit 0).
  - `npm run build` exited 0 with `DATABASE_URL` unset; the migrate step was skipped.
  - `npm run typecheck` exited 0.
  - This is local evidence only, not a CI run.
- **Caution:** `npm run build` also runs `db:migrate`, which applies `migrations/` to whatever `DATABASE_URL` is set. Unset it for review builds.

## First reviewer command (check prerequisites before executing)

```sh
npm ci && npm run build
```

This is a proposed reproduction command, **not a claim of executed testing**. Confirm the command exists in the current repository; record missing scripts/dependencies as NOT_VERIFIED rather than masking failures.

## Ordered implementation queue

1. [ ] Document what the desktop frontend actually renders versus backend/container capability.
2. [ ] Create a reproducible local build and minimal acceptance test; inspect package scripts before use.
3. [ ] Introduce a read-only GitHub Actions build check.
4. [ ] Do not imply a secure multi-tenant deployment until isolation/auth is tested.

## Evidence promotion gate

A project is not ready for a public professional demonstration merely because it has a README, an Actions schedule, or a test result unrelated to its claimed behavior. Provide exact source SHA, real test scope, negative controls, and meaningful limitations. Production or hardware assertions require an authorized real environment and appropriately scoped acceptance.

## Safe resumption

Inspect this issue and the master ledger, refresh the repo's `main` head and relevant PRs, implement the first unchecked item on a draft PR, attach exact test evidence and update the tracker. Avoid mass merging, secret exposure, false human review, and speculative employment claims.
