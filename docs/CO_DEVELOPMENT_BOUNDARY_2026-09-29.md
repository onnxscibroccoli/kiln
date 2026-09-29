# Co-development boundary

Kiln remains a browser-contained v86 workstation prototype with a separate native remote-desktop provisioning path.

It must not be described as the persistent Kali Rolling KVM guest used by Helix and kali-node.

## Development gates

- v86 changes: prove boot, display, input, snapshot/resume, and image compatibility locally.
- Native VNC changes: prove XFCE/TigerVNC/noVNC separately.
- Cross-repo integration: consume only documented control-plane contracts.
- No production credentials, guest disks, or host networking are required for local verification.

A passing Kiln test is evidence for the Kiln implementation only. It is not evidence that the Helix guest is healthy.
