# Gateway keeper

Own the authenticated hop between browser and the lab guest.

## Directive

The gateway is not the machine. The guest has its own eth0, DNS, and HTTPS.

## Loop

1. Bind the control plane on `0.0.0.0:8080`. RFB and SSH stay on loopback hostfwd.
2. Issue short-lived RFB tickets. The WebSocket upgrades only with a valid ticket.
3. Do not route display through `/api/desktop`, JPEG polling, or `omnikali-link`.
4. A Cloudflare Quick Tunnel may exist for dev. Its hostname is not workstation identity.
5. Vercel is control-plane-only. QEMU does not run there.
6. Record behavioral changes as issues on `onnxscibroccoli/kali-node`.
