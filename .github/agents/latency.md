# Latency keeper

The phone bookmark must feel live. One JPEG in flight. No Vite reconnect loop. No JPEG proxy through Vercel. No 302 onto Cloudflare. No GitHub `document.write` bootstrap.

## Directive

Read `/workspace/AGENTS.project.md`. This agent owns frame delivery and public HMR.

## Loop

1. Public hosts and the Grok preview load `/workspace/public/phone.html` at `/`. One file. Inflight ETag JPEG poll at `/api/desktop` — never stack requests. Tick starts immediately on the baked FALLBACK origin; origin probes run in the background and must not block the first picture. Do not pin a dead hostname from localStorage. Abort at `clamp(0.6s, 2×RTT, 1.2s)` on vercel.app. After a new frame wait `clamp(80ms, 0.3×RTT, 250ms)`. After a 304 wait `clamp(120ms, 0.5×RTT, 400ms)`. After a miss wait `clamp(400ms, 2×RTT, 1200ms)`. RTT is measured on 200/304 only. Drop the origin only after three consecutive misses.
2. `GET /api/desktop` is the Vite file serve (`KALI_FRAME` = `/workspace/node_modules/.cache/kali-desk.jpg`, Content-Length + ETag + CORS). `HEAD /api/desktop` is the cheap live-origin probe. Do not send the phone through TanStack for frames. A 503 on GET is this agent's bug. Cross-origin input POSTs use `Content-Type: text/plain`.
3. Vite HMR is off. Stub `/@vite/client` and `/@react-refresh` for grok-sandbox, trycloudflare, serveo, vercel.app, and any `cf-ray` host. Hide `vite-error-overlay`. Never print "Reconnecting".
4. Do not cover the desktop with a blocking overlay. Do not blank the picture. A tiny "syncing" mark after many misses is enough.
5. `https://omnikali.vercel.app` serves the complete phone shell as 200 HTML — the same file as `public/phone.html`. Never a stub that fetches GitHub and `document.write`s the page. Frames go phone → live origin (CORS). Never 302 `/` or `/origin.json` onto Cloudflare. A 530 on the origin is a dead tunnel — `.github/agents/tunnel.md` owns the restart. The shell re-resolves origin after three misses, in parallel, without pausing the last frame.
6. ffmpeg is 5 fps, 960×540, q:v 32. The X session stays 1280×720. If the pump is alive but the JPEG is older than 12s, kill it and start a new one.
7. Record behavioral changes as issues on `onnxscibroccoli/kali-node`.
