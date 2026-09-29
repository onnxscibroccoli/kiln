# Kiln

**Status:** Functional browser workstation prototype / active development  
**Repository:** `onnxscibroccoli/kiln`  
**Documentation snapshot:** 2026-09-28 23:12 EDT

Kiln is a GUI-first virtual PC that runs in the browser. Unlike a painted desktop mockup, its current implementation uses v86 to boot a real x86 Linux image inside the browser.

It is related to the broader remote-computer work but should not be confused with the real Kali Rolling KVM workstation in `kali-node`.

## What it does

The current in-browser machine uses:

- v86;
- SeaBIOS;
- VGA emulation;
- Tiny Core Linux 11;
- X11/Xvesa;
- FLWM;
- real applications.

The user interacts with the virtual machine through the browser.

The repository also contains a separate self-hosting path for native XFCE/TigerVNC/noVNC or Docker KasmVNC.

## Repository map

Approximately 193 tracked files are present.

Important areas:

- `src/components/desktop/` — GUI applications and desktop shell.
- `src/lib/linux/` — boot images, virtual filesystem, Linux distributions, shell, and v86 integration.
- `src/lib/workstations.ts` — workstation state.
- `src/lib/agent.ts` — agent-facing desktop behavior.
- `scripts/provision-xfce-novnc.sh` — native XFCE/noVNC provisioning.
- `scripts/provision-kasmvnc.sh` — KasmVNC provisioning.
- `public/vm/` — VM/emulator assets.
- `.github/agents/` — operational agent contracts.

## Development cycle

**FUNCTIONAL PROTOTYPE / ACTIVE DEVELOPMENT.**

Recent commits moved the product from a GUI-like shell to a real v86-backed Tiny Core desktop and added native/self-hosted remote-display paths.

The current browser VM is deliberately limited. The repository documents that current 64-bit Kali/Ubuntu live images are not supported by the in-browser emulator path.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Authentication and database configuration come from the host environment. Never commit a local `.env`.

## AI model instructions

An AI must keep the two execution modes separate:

1. **in-browser v86 PC** — real emulated x86 Linux in the browser;
2. **native remote desktop** — separately provisioned XFCE/VNC/KasmVNC stack.

Do not describe Kiln's Tiny Core VM as the same thing as OmniKali's persistent Kali Rolling KVM guest.

For changes to the emulator, test boot, display, input, snapshot/resume, and image compatibility.

For changes to the self-hosting scripts, test the real VNC/WebSocket path separately.

**Bottom line:** a genuine browser-contained virtual PC prototype with a separate native remote-desktop provisioning path.


## Cross-Repository Knowledge Graph

**GRAPH TAG: `OMNIKALI-KG-2026-09-28`**

Future AI agents MUST read [`.omnikali/project-knowledge-graph.md`](.omnikali/project-knowledge-graph.md) before cross-repository architectural changes. Verify capability with tests and live evidence, preserve restore points, make atomic changes, and update the graph after material architecture or failure knowledge changes.
