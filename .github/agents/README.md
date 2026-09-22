# Kiln agents

Copied from `onnxscibroccoli/kali-node` and scoped for **this** repo.

Kiln is the browser client. It is not the QEMU/KVM lab.

- **In-tab machine:** v86 boots a real 32-bit x86 PC. The included live desktop is Tiny Core Linux (kernel + Xvesa + FLWM). That is a real GUI, not a Zustand compositor and not Kali Rolling.
- **Kali Rolling KVM:** lives in `onnxscibroccoli/kali-node`. Display is TigerVNC RFB. Public door is `https://onnxscibroccoli.github.io/omnikali/`. When `endpoint.json` is unavailable, do not fake XFCE.
- **Vercel / this hosted app cannot run QEMU.** Do not claim it does.

Read `honesty.md` first. Record Kiln behavioral changes as issues on `onnxscibroccoli/kiln`.
