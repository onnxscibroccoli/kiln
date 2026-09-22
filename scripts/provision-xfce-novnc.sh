#!/usr/bin/env bash
# Native self-host: XFCE on X11 + TigerVNC + websockify + noVNC.
# Provisions the display server, desktop session, web client, and Ristretto
# sample images so a browser can control the machine like a remote desktop.
#
# Usage (Debian/Ubuntu, as root or with sudo):
#   sudo bash scripts/provision-xfce-novnc.sh
#
# Env:
#   DISPLAY_NUM  (default 1)
#   VNC_PORT     (default 5901)
#   WEB_PORT     (default 6080)
#   GEOM         (default 1280x800x24)
#   USER_NAME    (default $SUDO_USER or kiln)
set -euo pipefail

DISPLAY_NUM="${DISPLAY_NUM:-1}"
VNC_PORT="${VNC_PORT:-5901}"
WEB_PORT="${WEB_PORT:-6080}"
GEOM="${GEOM:-1280x800x24}"
USER_NAME="${USER_NAME:-${SUDO_USER:-${USER:-kiln}}}"
HOME_DIR="$(getent passwd "${USER_NAME}" | cut -d: -f6)"
HOME_DIR="${HOME_DIR:-/home/${USER_NAME}}"
GEOM_XY="${GEOM%x*}"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y \
  xfce4 xfce4-goodies xfce4-terminal ristretto thunar mousepad \
  dbus-x11 fonts-dejavu-core \
  tigervnc-standalone-server tigervnc-common \
  novnc websockify python3-numpy

install -d "${HOME_DIR}/.vnc"
install -d "${HOME_DIR}/Pictures"
install -d "${HOME_DIR}/Desktop"

if [[ ! -f "${HOME_DIR}/.vnc/passwd" ]]; then
  if [[ -n "${VNC_PASSWORD:-}" ]]; then
    su - "${USER_NAME}" -c "printf '%s\n%s\n' '${VNC_PASSWORD}' '${VNC_PASSWORD}' | vncpasswd -f > ~/.vnc/passwd"
    chmod 600 "${HOME_DIR}/.vnc/passwd"
  else
    echo "Set a VNC password for ${USER_NAME}:"
    su - "${USER_NAME}" -c "vncpasswd"
  fi
fi

cat > "${HOME_DIR}/.vnc/xstartup" <<'EOF'
#!/bin/sh
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XDG_SESSION_TYPE=x11
export XDG_CURRENT_DESKTOP=XFCE
export DISPLAY="${DISPLAY:-:1}"
[ -x /etc/vnc/xstartup ] && exec /etc/vnc/xstartup
[ -r "$HOME/.Xresources" ] && xrdb "$HOME/.Xresources"
ristretto "$HOME/Pictures/kiln.svg" &
exec startxfce4
EOF
chmod +x "${HOME_DIR}/.vnc/xstartup"

# Sample images so Ristretto has something to open immediately.
cat > "${HOME_DIR}/Pictures/kiln.svg" <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#0c0c0e"/><rect x="80" y="220" width="200" height="90" fill="#2a1810"/><rect x="100" y="160" width="40" height="60" fill="#c46a48"/><circle cx="460" cy="120" r="48" fill="#c5d0cc" opacity="0.35"/><text x="80" y="80" fill="#f1efe8" font-family="serif" font-size="28">Kiln</text></svg>
EOF
cp -f "${HOME_DIR}/Pictures/kiln.svg" "${HOME_DIR}/Desktop/kiln.svg"
chown -R "${USER_NAME}:${USER_NAME}" "${HOME_DIR}/.vnc" "${HOME_DIR}/Pictures" "${HOME_DIR}/Desktop"

su - "${USER_NAME}" -c "vncserver -kill :${DISPLAY_NUM}" >/dev/null 2>&1 || true
su - "${USER_NAME}" -c "vncserver :${DISPLAY_NUM} -geometry ${GEOM_XY} -depth 24 -localhost yes"

NOVNC_WEB=""
for d in /usr/share/novnc /usr/share/novnc/utils/../ /usr/share/webapps/novnc; do
  if [[ -f "${d}/vnc.html" ]]; then NOVNC_WEB="${d}"; break; fi
done
if [[ -z "${NOVNC_WEB}" ]]; then
  echo "noVNC web root not found" >&2
  exit 1
fi

echo "XFCE is running on display :${DISPLAY_NUM}."
echo "noVNC: http://0.0.0.0:${WEB_PORT}/vnc.html?autoconnect=1&resize=remote"
exec websockify --web="${NOVNC_WEB}" "${WEB_PORT}" "127.0.0.1:${VNC_PORT}"
