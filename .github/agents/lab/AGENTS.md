# Kali Node — product contract

This preview attaches to a **real Kali GNU/Linux Rolling KVM guest** with a real XFCE session over TigerVNC RFB.

GitHub: https://github.com/onnxscibroccoli/kali-node

Record every behavioral change as a GitHub issue on that repo. This file is the directive only — present tense, no changelog.

Dedicated agents: `.github/agents/honesty.md` (do not overclaim), `.github/agents/kvm.md` (QEMU/KVM guest), `.github/agents/rfb.md` (TigerVNC + authenticated WS), `.github/agents/connection-machine.md` (frontend readiness dimensions — RFB_NOT_READY ≠ VM_NOT_RUNNING), `.github/agents/readiness.md` (probe classifier), `.github/agents/generation.md` (stale-probe guard), `.github/agents/persist.md` (disk vs process), `.github/agents/omnikali.md` (public link — pointer only), `.github/agents/keyboard.md` (phone IME chrome), `.github/agents/phone.md` (phone shell chrome), `.github/agents/wake.md` (gateway revival), `.github/agents/auth.md` (real identity), `.github/agents/gateway.md` (ticketed ingress), `.github/agents/clipboard.md` (browser ↔ guest clip), `.github/agents/acceptance.md` (guest proofs), `.github/agents/pages.md` (GitHub Pages health-aware door), `.github/agents/recovery.md` (revive one-node lab and publish fail-closed), `.github/agents/nats.md` (refuse broker/swarm as the workstation).

Frozen Track A JPEG keepers — do not execute as if they were the machine: `.github/agents/desktop.md`, `.github/agents/latency.md`, `.github/agents/reconnect.md`, `.github/agents/tunnel.md`.

## Machine

- Nested KVM guest. Official Kali cloud genericcloud amd64 image. Hostname `omnikali`. User `kali` (sudo NOPASSWD).
- QEMU is the hypervisor. Overlay disk is the persistent volume. Cloud-init seed is attach-only after first boot.
- Guest has its own stack: systemd, sshd, apt against kali-last-snapshot, DHCP `10.0.2.15/24`, DNS, HTTPS to kali.org and github.com.
- Acceptance tests run **inside the guest**, never on the host: `/etc/os-release`, `uname -a`, `ip addr`/`route`, `getent hosts`, `curl -I https://www.kali.org` and `https://github.com`, `apt-get update`, `htop` after reconnect, persist file after reconnect.
- Do not patch a Zustand compositor, fake filesystem, or ffmpeg JPEG pump as if it were this node.
- Do not modify `onnxscibroccoli/omnikali-link`. That repo is a 6-file public pointer, not the workstation.

## Display

- Real XFCE 4 on TigerVNC inside the guest. RFB on guest `:5900`, forwarded to the host, then authenticated WebSocket to the browser (noVNC RFB client).
- That is a remote-desktop protocol. It is not WebRTC unless WebRTC is actually implemented. It is not a JPEG poller. It is not a reconstructed snapshot.
- Hang up detaches the client. It does not stop the VM or kill XFCE.
- Metrics that cannot be measured on TCP (loss, media RTT, encode/decode) are labeled unavailable. Do not invent them.

## Connection machine

- Independent dimensions: vm / guest / desktop / rfb / session / auth. Never one binary `VM_UP`.
- QEMU + Kali + XFCE up and no RFB banner is `RFB_STARTING`, never `VM_BOOTING`.
- Unclean WebSocket drop while the guest is healthy is `RECONNECTING`.
- Hang-up is `DISCONNECTED`. The guest persists.
- `CONNECTED` only after a real noVNC framebuffer handshake.
- Stale probes (`gen < appliedGen`) are dropped.
- Auto-attach from `READY_TO_ATTACH` with bounded backoff.

## Persistence

- Files, apt packages, systemd units, and the overlay disk survive VM stop/start.
- Processes do **not** survive a VM stop. Say so.
- Browser disconnect is not a VM stop.

## Gateway

- Sign-in is real (Google, X, email). One URL → authenticate → attach to the already-running guest.
- Serve the control plane on `0.0.0.0:8080`. Vite `allowedHosts` must remain open for the Grok preview Host header.
- Vercel cannot run QEMU. A Vercel deploy is the control plane only. The machine is the lab KVM node.
- This lab is one shared Kali node, not a fleet of isolated VMs per account. Say so.

## GitHub

- One `AGENTS.md` in the repo is this contract.
- Do not duplicate it as `AGENTS.project.md` on GitHub.
- Dedicated agents live under `.github/agents/`.
- Every change is an issue. Close the issue when the change is in the tree.
- Never commit guest SSH keys, VNC passwords, or qcow2 disks.
