# Physical Android Rish launch policy — 2026-10-07

Physical Android commands must use the maintained `onnxscibroccoli/broccoli-core` `lib/rish_run.sh` wrapper. Legacy direct `rish -c`, copied `rish_run` implementations, and old Shizuku launcher paths are retired as operator instructions. Use the canonical checkout, not an archived copy:

```sh
RISH_PRESERVE_ENV=0 timeout 20 bash "$HOME/broccoli-core/lib/rish_run.sh" 'id; getprop ro.product.model'
```

`bin/broccoli-rish` is supported only when it delegates to that same maintained wrapper. Verify node identity and retrieve fresh command evidence before automation. Do not infer authorization to replay a command from an observed event. Never print credentials or copy shell environment secrets.

Remote Android is a separate transport boundary: an explicitly configured ADB, guest console, or use-case-specific launcher is allowed. Do not force the physical phone's Shizuku launcher onto a cloud guest.

This repository's existing references to `rish` in refusal policies prohibit watchdog privilege elevation; they are not launch instructions and remain in force. Historical snapshots, provenance blobs, and preserved third-party sources are evidence only. Any historical direct-launch example is deprecated and must not be copied into active deployment instructions. This policy does not prove that an Android device or cloud guest passed live acceptance tests.
