# Connection machine keeper

RFB_NOT_READY is not VM_NOT_RUNNING. RFB_NOT_READY is not USER_DISCONNECTED.

## Directive

Track B frontend only. Do not rebuild the Kali guest. Do not touch `omnikali-link`. Do not replace RFB with JPEG polling.

## Independent dimensions

Keep these separate. Never fold them into one `VM_UP` flag.

| Dimension | Owner | Ready means |
|---|---|---|
| vm | QEMU pid probe | hypervisor process is alive |
| guest | SSH inside Kali | `sshd` answered |
| network | `ip -4` eth0 | guest NIC has an address |
| desktop | xfce4-session | graphical session is up |
| rfb | TCP banner `RFB 003.` | TigerVNC speaks RFB |
| session | noVNC client | framebuffer handshake completed |
| auth | tickets / sign-in | ticket is valid |

systemd `omnikali-vnc.service` active is **not** RFB ready.

## Phases

`AUTHENTICATED` `OFF` `VM_STARTING` `VM_UNAVAILABLE` `GUEST_STARTING` `DESKTOP_STARTING` `RFB_STARTING` `READY_TO_ATTACH` `CONNECTING` `CONNECTED` `RECONNECTING` `DISCONNECTED` `AUTH_REQUIRED` `SESSION_EXPIRED` `ERROR`

`VM_BOOTING` is not a phase. Do not add it back.

## Invariants

1. QEMU + SSH + XFCE up and no RFB banner is `RFB_STARTING`, never `VM_BOOTING`, never `DISCONNECTED`.
2. Guest reachable and XFCE still coming up is `DESKTOP_STARTING`.
3. QEMU up and SSH down is `GUEST_STARTING`.
4. Unexpected WebSocket/RFB loss while the guest is healthy is `RECONNECTING`.
5. Hang-up is `DISCONNECTED` with `wantAttached=false`. The guest persists.
6. `CONNECTED` is assigned only after a real noVNC framebuffer handshake (`FRAMEBUFFER_READY`).
7. Probe results are generation-guarded. `gen < appliedGen` is dropped. A stale T1/T2 observation must not rewind T5 `CONNECTED`.
8. Local events (`FRAMEBUFFER_READY`, `WS_CLOSE`, `HANGUP`) call `begin()` so they outrank in-flight probes.
9. Invalid/expired tickets are `SESSION_EXPIRED`. Missing sign-in is `AUTH_REQUIRED`. Neither is a VM failure.
10. `READY_TO_ATTACH` auto-attaches with 800ms–8s backoff. Do not require a second Attach click.
11. Record regressions as issues on `onnxscibroccoli/kali-node`.

## Wiring

- Probe = `getWorkstationStatus` mapped to `ReadinessInputs` → `OBSERVE`
- Connect = `issueRfbTicket` → `TICKET_OK` / `TICKET_DENIED`
- `RfbDisplay` `onState`: `CONNECTED` → `FRAMEBUFFER_READY`; unclean close → `WS_CLOSE`; hang-up unmounts the client
