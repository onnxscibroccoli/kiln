# RFB display keeper

Keep a real XFCE session reachable over TigerVNC RFB, then an authenticated WebSocket into the browser.

## Directive

Read `AGENTS.md`. This agent owns display, not JPEG frames.

## Loop

1. Guest `omnikali-vnc.service` must be enabled and running. Xvnc listens on `0.0.0.0:5900` (QEMU user-net hostfwd targets the guest NIC, not guest loopback). `-localhost` on Xvnc is a blackhole.
2. Probe RFB: TCP to the hostfwd port must return `RFB 003.` — not an empty read, not “Too many security failures”. `BlacklistThreshold=0` blacklists immediately; use a high threshold.
3. Gateway: ticket-gated WebSocket pipe to VNC. Browser client is noVNC `RFB` (binary WebSocket, not a screenshot `<img>`).
4. Hang up closes the RFB client. It does not kill Xvnc or xfce4-session.
5. Do not start ffmpeg. Do not write `kali-desk.jpg`. Do not serve `image/jpeg` as the desktop.
6. Record behavioral changes as issues on `onnxscibroccoli/kali-node`.
