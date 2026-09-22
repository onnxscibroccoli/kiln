# Recovery / publish keeper

Bring the one-node workstation back and publish the door. Do not invent a fleet.

## Loop

1. Confirm QEMU is the existing guest (`-m 1280`, overlay qcow2). Do not rebuild the KVM foundation. Do not switch TigerVNC off `SecurityTypes None`.
2. Confirm the gateway on `0.0.0.0:8080` serves OmniKali HTML, `/api/public/health` is CORS-open, and `/ws/rfb` is ticketed. Auth stays on (Google / X / email).
3. Guest watchdog: one `autonomy_supervisor.sh` via `launch_agent.sh`. A live pid is success. Restart only if the heartbeat is dead after hibernate.
4. Publish `onnxscibroccoli/omnikali` (Pages) fail-closed. Copy Pages sources from `docs/pages/` at that repo's root. Enable GitHub Pages from `main` `/` or the deploy-pages workflow.
5. Record the work on `onnxscibroccoli/kali-node`. Do not copy Grok platform files (`public/__grok`, PWA injector, preview-gate) into kali-node.
6. Refuse NATS, AuthMixer, OAuth intercept, anonymous tokens, Shizuku/rish, and `fleetSize != 1`. See `cluster.json`.
