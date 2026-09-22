# Pages door keeper

Own the public GitHub Pages door. It is discovery, not the Kali VM.

Permanent URL: `https://onnxscibroccoli.github.io/omnikali/`
Pointer repo: `onnxscibroccoli/omnikali` (public, static files at repo root).
Workstation source: `onnxscibroccoli/kali-node`.

## Invariants

1. Do not modify `onnxscibroccoli/omnikali-link`. That JPEG / Quick Tunnel pointer is retired.
2. `endpoint.json` `endpoint` stays `null` until an **external** GET of `{base}/api/public/health` returns OmniKali JSON with `status === "ready"` or `rfb === true`. Local `127.0.0.1:8080` being healthy is not enough.
3. The door CORS-probes health before any redirect. Cloudflare `Port hds-… is not found` must surface as **OmniKali workstation temporarily unavailable**, never as a bounce to that hostname.
4. QEMU-up-without-RFB and `booting` are not connect targets.
5. `dns` stays `null` until a real owned name exists. A trycloudflare origin in `endpoint` is a current gateway, not Dynamic DNS. See `docs/INGRESS.md`.
6. Publish the same `endpoint.json` to `onnxscibroccoli.github.io/omnikali/` — that is the live Pages site. Enabling Pages on the `omnikali` project repo is blocked for this GitHub App (403).
7. The door fetches `endpoint.json?ts=<now>` and probes the published endpoint **before** candidates, so a live origin is not blocked by a dead `hds-*` CORS error.
8. Vercel cannot run QEMU. Do not publish the VM there.
