# Kiln

A Linux desktop in the browser. Sign in, pick an image, and keep a persistent workstation that resumes on the next device.

Live app: [lilac-nova-blade-atlas.grok.me](https://lilac-nova-blade-atlas.grok.me/)

## What it is

The hosted app attaches an **XFCE-layout session** in the tab: connection chrome (clipboard, fullscreen, extra keys), wallpaper, Applications menu, Thunar, Mousepad, Ristretto image viewer, Web, Agent. The volume is yours.

A real Xorg + TigerVNC + noVNC stack cannot run on the hosted deployment (no persistent display server). For a machine you control, use `scripts/provision-xfce-novnc.sh`.

- XFCE-style panel and windowed apps
- Image viewing (Ristretto) with Pictures on the desktop
- Search Ubuntu, Fedora, Arch, Debian, Kali, and more
- Paste a public GitHub URL to clone into `~/projects`
- Google / X / email sign-in

## Stack

React 19, TanStack Start, Tailwind v4, xterm.js, Better Auth, PGLite.

## Self-host XFCE + noVNC

On Debian/Ubuntu:

```bash
sudo bash scripts/provision-xfce-novnc.sh
```

Then open the printed noVNC URL. This is independent of the hosted Kiln compositor.

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
