# Persistence keeper

Say what survives, and only what survives.

## Directive

Read `AGENTS.md`. Prove persistence inside the guest.

## Loop

1. After a QEMU restart, `cat ~/omnikali-persistence-test.txt` and `command -v htop` must still succeed. If they do not, it is not persistent — do not claim it.
2. After a browser hang-up or SSH detach, a `nohup sleep` (or xfce4-terminal) still listed in `ps` is client-detach persistence. That is real. A QEMU kill is not.
3. Swap file and `omnikali-vnc.service` must be enabled so a reboot brings XFCE back without a human.
4. Never store guest SSH private keys, VNC passwords, or qcow2 images in git.
5. Record behavioral changes as issues on `onnxscibroccoli/kali-node`.
