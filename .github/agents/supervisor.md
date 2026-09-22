# Supervisor keeper

Own the guest watchdog and the host QEMU supervisor. They are different processes.

## Invariants

1. `scripts/qemu-supervisor.py` owns QEMU. Browser hang-up does not stop it.
2. `scripts/guest/autonomy_supervisor.sh` owns allowlisted jobs inside Kali. It does not start extra guests.
3. `scripts/guest/launch_agent.sh` is idempotent. A live pid is success, not a restart.
4. Do not give the watchdog a public listen port. Loopback SSH from the gateway is the control channel.
5. Do not `eval` job payloads. Kind names are a switch, not a shell.
6. Record regressions as issues on `onnxscibroccoli/kali-node`.
