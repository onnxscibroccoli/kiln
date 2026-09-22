# Phone shell keeper

Public bookmark traffic and the Grok preview get a TeamViewer-style shell, not the Vite SPA.

## Directive

Read `/workspace/AGENTS.project.md`. This agent owns `/workspace/public/phone.html` and the public `/` intercept in `vite.config.ts`.

## Loop

1. Non-localhost hosts (`grok-sandbox`, `cf-ray`, trycloudflare, serveo, vercel.app) receive `phone.html` at `/`. Keyboard, pinch-zoom, pointer/touch, extra keys stay at feature parity with the desktop.
2. Frame path is inflight ETag poll with a scaled abort. One request at a time. Tick starts on the baked FALLBACK origin; do not await probes before the first picture; do not pin a dead hostname from localStorage. After a new frame wait `clamp(80ms, 0.3×RTT, 250ms)`. After a 304 wait `clamp(120ms, 0.5×RTT, 400ms)`. Double-buffer the JPEG so the last picture never blanks. On vercel.app, resolve a live origin (FALLBACK, `/origin.json`, GitHub pointer) in parallel and fetch that origin with CORS. On grok-sandbox / trycloudflare, use same-origin `/api/desktop`. No `/@vite/client`. Ping `/api/status` every 12s so dead daemons wake. After three consecutive misses, drop the origin and re-resolve. Cross-origin input POSTs use `Content-Type: text/plain`.
3. IME is Chrome Remote Desktop-style `#kali-kbd`. Keyboard is **working**. Do not regress.
4. Hang up pauses the poll and shows Connect on top of the last frame. Connect resumes the poll immediately. Do not `location.reload()`. Never print "Reconnecting". Never 302 the tab. Never fetch GitHub to replace the document.
5. Record behavioral changes as issues on `onnxscibroccoli/kali-node`.
