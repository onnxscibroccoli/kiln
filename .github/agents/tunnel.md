# Tunnel keeper

Keep the public origin alive. Cloudflare 530 is this agent's bug after three consecutive failures.

## Directive

Read `/workspace/AGENTS.project.md`. This agent owns `scripts/kali-tunnel.py` and the live origin URL.

## Loop

1. `scripts/kali-tunnel.py` must be running. Cloudflare quick tunnel over QUIC is first, Serveo is fallback.
2. Probe the published origin every ~10s. HTTP 530 / 502 / 523 **and** a healthy `http://127.0.0.1:8080/` three times in a row → terminate the tunnel process so a new URL is issued. One 530 is a flap — do not restart. If `:8080` is down, wait. Do not restart because Vite blipped. Do not restart Xfce.
3. The origin must never be `api.trycloudflare.com`. Accept `*.trycloudflare.com` except `api.` / `www.`, and `*.serveousercontent.com`.
4. On every new URL, write `/workspace/omnikali.json`, rewrite `scripts/omnikali-edge/middleware.js` FALLBACK, then publish `onnxscibroccoli/omnikali-link` and mirror into `kali-node`. Confirm `https://omnikali.vercel.app/origin.json` names a 200 origin, not a 530.
5. Drop a stale `/tmp/kali-tunnel.lock` whose pid is gone. `scripts/wake-kali.py` starts the tunnel if it is missing.
6. Record behavioral changes as issues on `onnxscibroccoli/kali-node`.
