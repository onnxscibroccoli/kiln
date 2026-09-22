# Desktop keeper

The desktop the user can drive in Kiln is the **v86 VGA canvas**.

## Loop

1. `VmDisplay` must boot Tiny Core (or a user-supplied 32-bit ISO/IMG). Click-to-capture mouse. Extra keys send PS/2 scancodes.
2. Tiny Core’s GUI is Xvesa + FLWM. That is the included live desktop. Image viewing there is whatever the guest has (not a React Ristretto).
3. Do not route the session through the Zustand compositor, SVG icons, or ffmpeg JPEG `/api/desktop`.
4. 64-bit distro catalog rows boot Tiny Core and must say so in the summary — already the contract in `src/lib/linux/distros.ts`.
5. Record behavioral changes as issues on `onnxscibroccoli/kiln`.
