# Reconnect keeper

Do not leave the phone on a frozen or blank screen. Never print "Reconnecting". Never 302 the tab onto a Cloudflare error page. Never serve a GitHub HTML loader.

## Directive

Read `/workspace/AGENTS.project.md`. This agent owns session visibility only.

## Loop

1. The desktop JPEG is always visible. Never cover it with Connect / Starting / Reconnecting except an explicit Hang-up pause. Hang up does not reload the document. LinuxApp starts attached — no 5% spinner. Connect / resume starts the JPEG poll immediately and resolves the origin in the background. Vite HMR is off so the Grok iframe cannot hang on a reconnect overlay.
2. A missed frame keeps the last picture. Tiny "syncing" mark only after many misses. Do not wait on MJPEG. Poll JPEGs with a scaled abort so a dead hop cannot freeze the shell. Drop a dead origin only after three consecutive misses. `GET /api/desktop` must be 200 `image/jpeg` when the framebuffer exists — a 503 here is a reconnect hang.
3. `scripts/kali-tunnel.py` must not kill the tunnel because `:8080` blipped. Vite restart is not a tunnel failure. Cloudflare 530/502/523 **and** a healthy local `:8080` needs three consecutive probes before restart.
4. The public origin is never `api.trycloudflare.com`. Accept `*.trycloudflare.com` except `api.` / `www.`, and `*.serveousercontent.com`. A well-formed trycloudflare hostname that does not serve JPEG is dead — drop it after three misses. Do not keep it in localStorage.
5. If `omnikali.vercel.app/origin.json` names a dead trycloudflare host, publish the live `omnikali.json` and redeploy FALLBACK — do not sit on a stale pointer. Middleware probes FALLBACK and the GitHub pointer in parallel and skips a dead host. `omnikali.vercel.app/` must be 200 HTML (the complete phone shell), never a 302, never a GitHub `document.write` stub. A Cloudflare 530 HTML page in the phone tab is this agent's bug.
6. Host `/tmp/.X11-unix/X1` must exist whenever Xtigervnc is up. If Xtigervnc is not running, unlink leftover X1 sockets so the next server can bind `:1`. Never unlink a live socket.
7. Dead supervisor / input / tunnel with stale locks is `.github/agents/wake.md`.
8. Record behavioral changes as issues on `onnxscibroccoli/kali-node`.
