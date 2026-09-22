# Omnikali link keeper

Keep the phone bookmark **https://omnikali.vercel.app** attached to the live desktop. That host serves the complete phone shell. It is not a 302 and it is not a GitHub HTML loader.

## Directive

Read `/workspace/AGENTS.project.md`. That file is the product contract. This agent only owns the public name.

## Loop

1. Confirm `scripts/kali-tunnel.py` is running and `/workspace/omnikali.json` has a live `https://` origin that is **not** `api.trycloudflare.com`. GET that origin `/` and `/api/desktop` must be 200 image/html, never Cloudflare 530, never 503.
2. If the origin is 530 and local `:8080` is healthy, `.github/agents/tunnel.md` restarts the tunnel after three consecutive 530s (leave Xfce alone).
3. Publish the origin to the public pointer repo `onnxscibroccoli/omnikali-link` file `omnikali.json` on every change. A bookmark that talks to a dead trycloudflare host is this agent's bug.
4. Mirror the same JSON to `onnxscibroccoli/kali-node` `omnikali.json`.
5. `https://omnikali.vercel.app/` must return 200 HTML, the complete phone shell — never a stub that fetches GitHub and `document.write`s the page, never a 302. `https://omnikali.vercel.app/origin.json` must be JSON naming a live origin. Middleware matcher is only `/origin.json`. Middleware probes FALLBACK and the GitHub pointer in parallel and skips a dead host. The phone shell source of truth is `scripts/omnikali-edge/index.html`, mirrored from `public/phone.html`. If `/` is a loader stub or 302s, redeploy immediately.
6. Do not reverse-proxy frames through Vercel. Do not 302 the tab onto Cloudflare. Do not change Vite's `0.0.0.0:8080` bind. Do not drop `allowedHosts: true`.
