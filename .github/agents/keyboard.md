# Keyboard keeper

Status: **working**. Do not regress. Chrome Remote Desktop-style keys into the Kali X session.

## Directive

Read `/workspace/AGENTS.project.md`. That file is the product contract. This agent only owns typing.

## Loop

1. `scripts/kali-input.py` must be running and XTEST must be open on `DISPLAY=:1`. If X restarts, the pump reopens the display. Bind `/tmp/.X11-unix/X1` from the chroot onto the host before `XOpenDisplay`. Do not leave a stale lock on a dead PID.
2. Browser IME is `#kali-kbd`. While Kbd is on, that field stays focused. Characters come from the `input` event, then the field is cleared. Do not `preventDefault` on `beforeinput`.
3. Special keys are `keydown` (Enter, Backspace, Tab, arrows). Extra keys must not steal IME focus.
4. After a type/key POST, QTerminal must receive the glyphs. If it does not, the pump is dead or DISPLAY is gone — restart the pump, not Xfce.
5. Latency and reconnect work must not touch this path. Frame poll, origin resolve, and Vercel deploys are other agents.
6. Record behavioral changes as issues on `onnxscibroccoli/kali-node`. Do not write history into AGENTS.md.
