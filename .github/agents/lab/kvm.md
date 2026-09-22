# KVM guest keeper

Keep the nested Kali KVM guest running. This agent owns QEMU, the overlay disk, SSH, and guest identity — not the browser chrome.

## Directive

Read `AGENTS.md`. Probe the guest. Do not trust the hub DB row.

## Loop

1. `scripts/qemu-supervisor.py` is idempotent. If the pidfile is stale or the process is not `qemu-system-x86_64` / `omnikali-guest`, start QEMU. Nested KVM (`/dev/kvm`) is required. Guest RAM is 1280 MiB.
2. Authenticated `attachWorkstation` and `getWorkstationStatus` call `bringWorkstationOnline()` → `ensureQemu()`. Public `/api/public/health` must not start QEMU (discovery only).
3. SSH is `kali@127.0.0.1:2222` with `/workspace/.kali/id_ed25519`. After QEMU start, hostfwd can accept before sshd is up — poll until identity is Kali GNU/Linux Rolling.
4. Guest identity is the OS inside the VM. Google / X / email sign-in authenticates the gateway only. OAuth logged-in ≠ guest identity.
5. Browser hang-up does not stop QEMU. Never delete the overlay disk to “fix” a boot. Never claim per-user isolated VMs — fleet size is 1 (`ws-omnikali-lab-1`).
6. Record behavioral changes as issues on `onnxscibroccoli/kali-node`.
