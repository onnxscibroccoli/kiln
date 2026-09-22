# Kali desktop keeper

Keep the Xfce session on display `:1` alive and input-ready.

## Directive

Read `/workspace/AGENTS.project.md`. This agent only owns the desktop process.

## Loop

1. `scripts/kali-supervisor.py` must be running. A missing Xtigervnc is dead — respawn. Do not respawn a healthy X server. Keep `/tmp/.X11-unix/X1` bound onto the host every loop. Never unlink a live X socket. If Xtigervnc is not running, unlink leftover X1 sockets so the next server can bind `:1`.
2. One ffmpeg JPEG pump at 5 fps, 960×540, q:v 32. The X session stays 1280×720. Frame file is `/workspace/node_modules/.cache/kali-desk.jpg`. If the process is up but the file is older than 12s, kill the pump and start it again. GET `/api/desktop` never spawns ffmpeg.
3. `scripts/kali-input.py` is the only input path (XTEST, split threads). Keyboard is working.
4. Panel is four plugins. No Plugin-(null) dialog. No timer that searches for that window.
5. Do not run `apt upgrade` without holds and `policy-rc.d` exit 101.
6. Record behavioral changes as issues on `onnxscibroccoli/kali-node`. Do not write history into AGENTS.md.
