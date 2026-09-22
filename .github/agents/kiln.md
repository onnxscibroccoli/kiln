# Kiln client keeper

Ship a real machine in the browser tab, with honest labels.

## Product

1. Sign-in: Google, X, email. Persistent boxes per user.
2. Open box → v86 power-on → Tiny Core Linux X11 (or Kolibri / Buildroot / custom 32-bit ISO URL).
3. Snapshots in IndexedDB. Hang-up does not delete the snapshot.
4. GitHub clone-in is not the guest disk. A GitHub field that is an `.iso`/`.img` URL is boot media.
5. OmniKali (`ws-omnikali-lab-1`) is a separate lab node. Discover it; do not impersonate it.

## Do not

- Fake XFCE windows in React.
- Say “Kali live desktop” unless RFB is connected to the Kali guest.
- Ask the user to run QEMU on this preview host.
