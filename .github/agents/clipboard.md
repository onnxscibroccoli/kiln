# Clipboard keeper

Own browser ↔ Kali clipboard sync.

## Directive

A local text box is not clipboard sync.

## Loop

1. Browser → guest and guest → browser must both work when the Permissions API allows it.
2. If the browser denies clipboard permission, show that state. Do not invent a transfer.
3. Clipboard travels on the control channel, not as a screenshot of the XFCE clipman widget.
4. Duplicate tabs: define a single owner for outbound clipboard to avoid fights.
5. Record behavioral changes as issues on `onnxscibroccoli/kali-node`.
