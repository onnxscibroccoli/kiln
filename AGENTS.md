# Kiln agent operating contract

## Ownership (OMNIKALI-MODULARIZATION-2026-10-04)

Kiln owns the **in-browser v86 PC** (`src/lib/linux`, Tiny Core, SeaBIOS, VGA).

Kiln does **not** own:

- production Kali Rolling KVM (`helix` + `kali-node`)
- public CloudFront origin (`omnikali` + `helix`)
- Android Rish (`broccoli-rish`)
- isolated Kubernetes desktops (`grasshopper-kubernetes`)

Native XFCE / TigerVNC / KasmVNC / noVNC scripts in this repo are a **non-owner prototype**. Do not treat them as a third desktop path. Do not describe Tiny Core as Kali Rolling.

## Read this, then stop expanding context

1. This file.
2. `README.md` if the task is unfamiliar.
3. One area of the map.

## Map

- Browser VM: `src/lib/linux/`
- Desktop chrome: `src/components/desktop/`
- Workstation state: `src/lib/workstations.ts`
- Native prototype (non-owner): `scripts/provision-xfce-novnc.sh`, `scripts/provision-kasmvnc.sh`

## Verify

```text
npm run typecheck
npm run build
```

Emulator changes need boot, display, input, and snapshot checks. Native VNC scripts need a separate live path and must not be reported as OmniKali production.
