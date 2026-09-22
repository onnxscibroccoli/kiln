#!/usr/bin/env bash
# Self-host only: XFCE on Xvfb + TigerVNC + noVNC/websockify.
# The hosted Kiln app uses an in-browser compositor instead — Vercel cannot
# run Xorg. Use this on a Debian/Ubuntu machine you control.
set -euo pipefail

DISPLAY_NUM="${DISPLAY_NUM:-1}"
VNC_PORT="${VNC_PORT:-5901}"
WEB_PORT="${WEB_PORT:-6080}"
GEOM="${GEOM:-1280x800x24}"
USER_NAME="${USER:-kiln}"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y \
  xfce4 xfce4-goodies xfce4-terminal ristretto thunar mousepad \
  tigervnc-standalone-server tigervnc-common \
  novnc websockify python3-numpy \
  dbus-x11 fonts-dejavu-core

install -d "/home/${USER_NAME}/.vnc"
if [[ ! -f "/home/${USER_NAME}/.vnc/passwd" ]]; then
  echo "Set a VNC password:"
  su - "${USER_NAME}" -c "vncpasswd"
fi

cat > "/home/${USER_NAME}/.vnc/xstartup" <<'EOF'
#!/bin/sh
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XDG_SESSION_TYPE=x11
export DISPLAY="${DISPLAY:-:1}"
exec startxfce4
EOF
chmod +x "/home/${USER_NAME}/.vnc/xstartup"
chown -R "${USER_NAME}:${USER_NAME}" "/home/${USER_NAME}/.vnc"

su - "${USER_NAME}" -c "vncserver -kill :${DISPLAY_NUM}" >/dev/null 2>&1 || true
su - "${USER_NAME}" -c "vncserver :${DISPLAY_NUM} -geometry ${GEOM%x*} -depth 24 -localhost yes"

websockify --web=/usr/share/novnc "${WEB_PORT}" "127.0.0.1:${VNC_PORT}" &
echo "noVNC listening on http://0.0.0.0:${WEB_PORT}/vnc.html"
wait
