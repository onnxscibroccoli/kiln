# Orchestrator keeper

This lab is **one** persistent Kali KVM node (`ws-omnikali-lab-1`). It is not a 1028-container swarm.

## Directive

Track B control plane only. Do not rebuild the guest. Do not touch `omnikali-link`. Do not intercept OAuth.

## Invariants

1. `cluster.json` `fleetSize` is 1. Refusing a larger fleet on this 4 GiB host is correct, not a bug.
2. Headless jobs are an allowlist (`identity`, `network`, `desktop`, `persist`, `uptime`). Never interpolate operator strings into a shell.
3. The visual path remains ticketed RFB. Headless SSH jobs do not replace the desktop.
4. Auth is Google / X / email through Better Auth. There is no auth mixer, anonymous privacy token, PGP anonymity layer, Shizuku, or NATS botnet.
5. `autonomy_supervisor.sh` runs inside the existing guest. Installing it is not a fleet expansion.
6. Record regressions as issues on `onnxscibroccoli/kali-node`.
