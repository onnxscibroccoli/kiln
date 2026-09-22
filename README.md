# Kiln

A Linux desktop in the browser. Sign in, pick an image, and keep a persistent workstation that resumes on the next device.

Live app: [lilac-nova-blade-atlas.grok.me](https://lilac-nova-blade-atlas.grok.me/)

## What it is

Open a box and you get an **XFCE session on display :0**: Kasm-style control strip (clipboard, extra keys, fullscreen), wallpaper, desktop pictures, Applications menu, Thunar, Mousepad, **Ristretto** image viewer, Web, Agent. The volume is yours.

- Click kiln.svg / landscape.svg on the desktop — Ristretto opens the picture
- Search Ubuntu, Fedora, Arch, Debian, Kali, and more
- Paste a public GitHub URL to clone into `~/projects`
- Google / X / email sign-in

The hosted app is a graphical compositor (multi-user persistent boxes). A real Xorg process cannot run on the hosted deployment. For a machine you control, use the provision scripts below — they start XFCE on X11 and expose it in a browser.

## Self-host XFCE + noVNC (native)

Debian/Ubuntu. Installs XFCE, TigerVNC, websockify, noVNC, Ristretto, and sample pictures, then prints a web URL.

```bash
sudo bash scripts/provision-xfce-novnc.sh
```

Optional env: `DISPLAY_NUM`, `VNC_PORT`, `WEB_PORT`, `GEOM`, `USER_NAME`, `VNC_PASSWORD`.

## Self-host XFCE + KasmVNC (Docker)

Polished remote-desktop UI (linuxserver/webtop:ubuntu-xfce). Requires Docker.

```bash
sudo bash scripts/provision-kasmvnc.sh
```

Compose file: `deploy/docker-compose.kasmvnc.yml`.

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
