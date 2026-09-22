# KVM keeper (lab pointer)

Kiln does **not** run QEMU. Nested KVM is `onnxscibroccoli/kali-node`.

## Loop

1. Do not start QEMU, download qcow2, or cloud-init in this app builder sandbox.
2. If the user wants Kali Rolling XFCE, attach to the OmniKali gateway published in `endpoint.json` (`transport: rfb-over-websocket`). If the endpoint is null, say the lab node is unavailable.
3. The in-tab PC is v86 + Tiny Core. Keep that path working instead of simulating KVM.
4. Record lab hypervisor work on `onnxscibroccoli/kali-node`, not here.
