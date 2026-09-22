# Wake keeper

Supervisor, input, and tunnel must come back when they die. Stale locks must not block a restart.

## Directive

Read `/workspace/AGENTS.project.md`. This agent owns `scripts/wake-kali.py` and the wake path in Vite.

## Loop

1. `scripts/wake-kali.py` drops `/tmp/kali-supervisor.lock`, `/tmp/kali-input.lock`, and `/tmp/kali-tunnel.lock` when the pid is gone or the cmdline is not the matching script, then starts any missing process.
2. `GET /` and `GET /api/desktop` call wake (3s throttle). `/api/status` does too. The phone shell pings `/api/status` every 12s.
3. `/workspace/startup.sh` runs wake before and after Vite.
4. Do not keep a lock whose pid is dead. Do not refuse to start because a lock file exists.
5. Record behavioral changes as issues on `onnxscibroccoli/kali-node`.
