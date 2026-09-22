# Ingress keeper

Own the public HTTPS + WebSocket path to the already-running Kali node.

Permanent name: `https://onnxscibroccoli.github.io/omnikali/`
Pointer: `endpoint.json` (GitHub Pages). Not a JPEG poller. Not `omnikali-link`.
How: `docs/INGRESS.md`. Original supervisor: `scripts/kali-tunnel.py` (retired JPEG). Live supervisor: `scripts/public-ingress.sh`.

## Invariants

1. Do not modify `onnxscibroccoli/omnikali-link`.
2. Do not claim a Grok `hds-*-6014` URL is live after Cloudflare `Port … is not found`.
3. A public origin is live only after an **external** GET of `{origin}/api/public/health` returns OmniKali JSON with `status === "ready"` or `rfb === true`.
4. Publish that origin to both `onnxscibroccoli/omnikali` `endpoint.json` **and** `onnxscibroccoli.github.io` `omnikali/endpoint.json` (the URL people actually open).
5. Quick Tunnel hostnames are ephemeral. GitHub Pages is the stable door. A named Cloudflare tunnel or real DNS is the persistent next hop — record it as an issue, do not fake `dns`.
6. Vercel cannot run QEMU. Ingress is in front of the lab gateway, not a second VM.
7. Restore TigerVNC with `SecurityTypes None` behind loopback + tickets. Do not rebuild KVM.
8. Ticketed `/ws/rfb` through the tunnel must speak `RFB 003.008`. A 401 without a ticket is fine; a 500 on a valid ticket is not.
9. Do not run `scripts/kali-tunnel.py` — it still writes the JPEG pointer.
