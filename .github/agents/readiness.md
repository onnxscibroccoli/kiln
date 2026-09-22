# Readiness classifier keeper

Companion to `.github/agents/connection-machine.md`. Owns `src/lib/readiness.ts` only.

## Directive

Do not rebuild QEMU. Do not touch `omnikali-link`. Do not replace RFB with JPEG.

## Probe order

1. QEMU pid → vm
2. SSH inside Kali → guest
3. eth0 address → network
4. xfce4-session → desktop
5. `RFB 003.` banner on the hostfwd port → rfb

A TCP accept without the banner is not RFB ready. systemd `active` is not RFB ready.

## Output

`classifyReadiness` never returns `VM_BOOTING`.

| Inputs | stage |
|---|---|
| QEMU down | `OFF` |
| QEMU pid-file but process gone | `VM_STARTING` |
| QEMU up, SSH down | `GUEST_STARTING` |
| SSH + eth0, XFCE down | `DESKTOP_STARTING` |
| XFCE up, no RFB banner | `RFB_STARTING` |
| RFB banner `RFB ` | `READY_TO_ATTACH` |
