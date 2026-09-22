# Kiln

A real x86 PC in the browser. Sign in, start a box, and use a live Linux GUI (Tiny Core Linux with X11) as if it were sitting on your desk.

Live app: [lilac-nova-blade-atlas.grok.me](https://lilac-nova-blade-atlas.grok.me/)

## What it is

Each box is a **virtual PC** running in the tab (BIOS, VGA, kernel, X server). The included live desktop is **Tiny Core Linux 11** — actual Linux, actual Xvesa, FLWM, real apps. Click the display to take the mouse.

- Not a painted window manager and not a terminal wrapper
- Snapshot the running machine and resume later
- Paste a **32-bit live ISO URL** to boot another image (Damn Small Linux, Debian i386, …)
- 64-bit live CDs (current Kali/Ubuntu) cannot boot in this emulator; attach an i386 ISO instead

## Stack

React 19, TanStack Start, Tailwind v4, [v86](https://github.com/copy/v86), Better Auth, PGLite.

## Self-host a native X11 stack

On a machine you administer, `scripts/provision-xfce-novnc.sh` and `scripts/provision-kasmvnc.sh` install XFCE + VNC + a browser client. That path is independent of the in-browser PC.

## Develop

```bash
npm install
npm run dev
```

Auth and database come from the host environment. Do not commit a `.env`.

```bash
npm run typecheck
npm run build
```

## License

Source published as-is for the Kiln workstation app. v86 is BSD-2-Clause; Tiny Core Linux is its own license. Bios/wasm under `public/vm/` come from the v86 project.
