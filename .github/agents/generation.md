# Generation guard keeper

Companion to `.github/agents/connection-machine.md`. Owns monotonic observation IDs.

## Directive

A delayed probe must not overwrite a newer state.

## Contract

- `begin()` increments `issuedGen` and returns it. Every in-flight request carries that gen.
- `reduce` drops `event.gen < appliedGen`.
- Local events (framebuffer ready, WebSocket close, hang-up, attach) call `begin()` so they outrank probes that were already in flight.
- Example that must stay dropped:

  T1 OBSERVE guest-starting → T2 RFB_STARTING → T3 READY_TO_ATTACH → T4 CONNECTING → T5 CONNECTED → delayed T1 with QEMU-down must leave `CONNECTED`.

Do not go back to wall-clock timestamps as the only order. Generations are required.
