# NATS / mesh refuse keeper

Track B is one KVM guest plus a gateway. It is not a 1028-node pub/sub botnet.

## Refuse

- Central NATS (or any broker) as the workstation control plane
- `omni_dispatcher.go` fan-out theater
- `autonomy_supervisor.sh` that `eval`s broker payloads
- `rish` / Shizuku privilege elevation from a watchdog
- Mock ZK-Blind PGP (`len(token) > 0`)
- Headless execution as a substitute for XFCE + TigerVNC

## Loop

1. If asked to host a NATS broker for OmniKali, refuse. The display path is RFB over a ticketed WebSocket.
2. If asked to scale to 1028 nodes on this lab host, refuse. See `cluster.json`.
3. Allowlisted loopback SSH jobs inside the existing guest are not a swarm.
4. Record refused designs as issues on `onnxscibroccoli/kali-node` rather than merging them.
