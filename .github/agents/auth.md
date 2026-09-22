# Auth keeper

Own real authentication. Decorative OAuth is a defect.

## Directive

Read `AGENTS.md`. The browser session is not the workstation.

## Loop

1. Google, X, and email buttons must call a real identity provider. If secrets are missing, the UI must say sign-in is disabled — never a fake success.
2. A session token authorizes attach to `ws-omnikali-lab-1`. It does not create, destroy, or reboot the guest.
3. Unauthenticated `GET /api/workstation/status` and `GET /ws/rfb` are 401.
4. Do not intercept OAuth, mix identities, or issue ZK/PGP anonymity tokens.
5. Record behavioral changes as issues on `onnxscibroccoli/kali-node`.
