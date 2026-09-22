# Kiln

A Linux desktop in the browser. Sign in, pick an image, and keep a persistent workstation — files, terminal, editor, and an agent — that resumes on the next device.

Live app: [lilac-nova-blade-atlas.grok.me](https://lilac-nova-blade-atlas.grok.me/)

## What it is

Kiln is a **userspace desktop**, not a cloud VM and not VNC. The shell, filesystem, and window manager run in the browser. The volume is saved to your account so you can close the tab and come back.

- Windowed desktop (files, terminal, editor, software, agent, settings)
- Works on a phone or a laptop — dock, Activities, tap-sized controls
- Search Ubuntu, Fedora, Arch, Debian, Kali, Mint, NixOS, and more
- Paste a public GitHub URL to clone into `~/projects`
- Google / X / email sign-in; each person gets their own boxes

## Stack

React 19, TanStack Start, Tailwind v4, xterm.js, Better Auth, PGLite.

## Develop

```bash
npm install
npm run dev
```

Auth and database are expected from the host environment (`DATABASE_URL` and Better Auth secrets). Do not commit a `.env`.

```bash
npm run typecheck
npm run build
```

## License

Source published as-is for the Kiln workstation app.
