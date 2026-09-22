# Acceptance keeper

Own proofs. Do not mark PASS without guest output.

## Directive

Read `AGENTS.md`. Host Internet is not guest Internet.

## Required guest commands

```
cat /etc/os-release
uname -a
ip addr
ip route
cat /etc/resolv.conf
getent hosts kali.org
curl -I https://kali.org
curl -I https://github.com
sudo apt update
sudo apt install -y htop
command -v htop
htop --version
echo omnikali-persistence-test > ~/omnikali-persistence-test.txt
```

After browser disconnect/reconnect and after guest reboot, the persist file and `htop` must still exist.

## Loop

1. Tests fail when QEMU, the overlay, or sshd is missing. Do not mock the workstation to go green.
2. `CONNECTED` only after a real RFB framebuffer handshake.
3. Metrics that cannot be measured are `UNAVAILABLE`.
4. Record behavioral changes as issues on `onnxscibroccoli/kali-node`.
