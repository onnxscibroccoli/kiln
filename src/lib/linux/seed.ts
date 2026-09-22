import { type Distro } from "./distros";
import { dir, file, Vfs } from "./vfs";

export const BASE_PACKAGES = ["busybox", "coreutils", "git", "nodejs", "vim", "curl", "neofetch"];

export function homeDir(user: string): string {
  return `/home/${user}`;
}

const ART = {
  kiln: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#0c0c0e"/><rect x="80" y="220" width="200" height="90" fill="#2a1810"/><rect x="100" y="160" width="40" height="60" fill="#c46a48"/><circle cx="460" cy="120" r="48" fill="#c5d0cc" opacity="0.35"/><text x="80" y="80" fill="#f1efe8" font-family="serif" font-size="28">Kiln</text></svg>\n`,
  display: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#121214"/><rect x="90" y="70" width="460" height="260" rx="8" fill="#1c1c20" stroke="#c5d0cc" stroke-width="2"/><rect x="110" y="90" width="420" height="200" fill="#0c0c0e"/><rect x="280" y="330" width="80" height="12" fill="#8fa09b"/></svg>\n`,
  wallpaper: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a2420"/><stop offset="1" stop-color="#0c0c0e"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="1280" cy="160" r="180" fill="#c5d0cc" opacity="0.08"/><rect x="140" y="640" width="480" height="150" fill="#2a1810" opacity="0.4"/></svg>\n`,
  landscape: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2830"/><stop offset="1" stop-color="#8aa0aa"/></linearGradient></defs><rect width="640" height="400" fill="url(#sky)"/><circle cx="500" cy="90" r="36" fill="#f1efe8" opacity="0.7"/><path d="M0 280 L180 180 L320 260 L480 150 L640 240 L640 400 L0 400 Z" fill="#14201c"/><path d="M0 330 L220 250 L400 320 L640 270 L640 400 L0 400 Z" fill="#1a2420"/></svg>\n`,
};

function pictureFiles() {
  return {
    "kiln.svg": file(ART.kiln),
    "display.svg": file(ART.display),
    "wallpaper.svg": file(ART.wallpaper),
    "landscape.svg": file(ART.landscape),
  };
}

export function seedVfs(opts: {
  distro: Distro;
  user: string;
  hostname: string;
  githubRepo?: string | null;
}): Vfs {
  const { distro, user, hostname, githubRepo } = opts;
  const home = homeDir(user);
  const readme = `# ${hostname}

This is your persistent Kiln desktop — an XFCE session on display :0.

Open pictures from the desktop or Pictures. Ristretto is the image viewer.
Thunar is files. The control strip is clipboard, extra keys, and fullscreen.

Distro: ${distro.pretty}
Session: xfce4-session · DISPLAY=:0
User:   ${user}
${githubRepo ? `\nGitHub origin: ${githubRepo}\n` : ""}`;

  const helloJs = `const os = { user: "${user}", host: "${hostname}" };
console.log("hello from kiln");
console.log("running on " + os.host + " as " + os.user);
`;

  const bashrc = `# ~/.bashrc — kiln ${distro.id}
export EDITOR=mousepad
export TERM=xterm-256color
export DISPLAY=:0
export XDG_CURRENT_DESKTOP=XFCE
PS1='\\u@\\h:\\w\\$ '
`;

  const root = dir({
    bin: dir(),
    boot: dir(),
    dev: dir(),
    etc: dir({
      hostname: file(hostname + "\n"),
      hosts: file(`127.0.0.1 localhost ${hostname}\n::1 localhost\n`),
      "os-release": file(distro.osRelease + "\n"),
      passwd: file(
        [
          "root:x:0:0:root:/root:/bin/sh",
          `${user}:x:1000:1000:${user}:${home}:/bin/${distro.shell}`,
          "",
        ].join("\n"),
      ),
      group: file(`root:x:0:\n${user}:x:1000:\n`),
      motd: file(`Welcome to ${distro.pretty} on Kiln.\nXFCE session on display :0.\n`),
      "resolv.conf": file("nameserver 1.1.1.1\nnameserver 8.8.8.8\n"),
      issue: file(`${distro.pretty} \\n \\l\n`),
    }),
    home: dir({
      [user]: dir({
        "README.md": file(readme),
        Desktop: dir({
          "kiln.svg": file(ART.kiln),
          "display.svg": file(ART.display),
          "landscape.svg": file(ART.landscape),
        }),
        Documents: dir(),
        Downloads: dir(),
        Pictures: dir(pictureFiles()),
        ".bashrc": file(bashrc),
        ".profile": file("source ~/.bashrc\n"),
        ".gitconfig": file(`[user]\n\tname = ${user}\n\temail = ${user}@${hostname}.kiln\n`),
        projects: dir({
          hello: dir({
            "hello.js": file(helloJs, 0o755),
            "package.json": file(
              JSON.stringify(
                { name: "hello", private: true, version: "0.0.1", main: "hello.js" },
                null,
                2,
              ) + "\n",
            ),
          }),
        }),
      }),
    }),
    proc: dir({
      version: file(`Linux version ${distro.kernel} (kiln@build) #1 SMP PREEMPT\n`),
      cpuinfo: file(
        [
          "processor\t: 0",
          "vendor_id\t: KilnVirtual",
          "cpu family\t: 6",
          "model name\t: Kiln vCPU",
          "cpu MHz\t\t: 2800.000",
          "flags\t\t: fpu sse sse2 lm",
          "",
        ].join("\n"),
      ),
      meminfo: file("MemTotal:        2048000 kB\nMemFree:         1424000 kB\n"),
      uptime: file("128.40 640.12\n"),
    }),
    root: dir({ ".bashrc": file(bashrc) }),
    sys: dir(),
    tmp: dir(),
    usr: dir({
      bin: dir(),
      lib: dir(),
      local: dir({ bin: dir() }),
      share: dir({ man: dir() }),
    }),
    var: dir({
      log: dir({
        syslog: file("kiln-init: xfce4-session attached on :0\n"),
      }),
      lib: dir({
        kiln: dir({
          "packages.json": file(JSON.stringify(BASE_PACKAGES) + "\n"),
        }),
      }),
    }),
  });

  return new Vfs(root);
}

export function ensureUserDirs(vfs: Vfs, user: string): void {
  const home = homeDir(user);
  for (const d of ["Desktop", "Documents", "Downloads", "Pictures", "projects"]) {
    vfs.mkdir(`${home}/${d}`, true);
  }
  const files: Record<string, string> = {
    [`${home}/Pictures/kiln.svg`]: ART.kiln,
    [`${home}/Pictures/display.svg`]: ART.display,
    [`${home}/Pictures/wallpaper.svg`]: ART.wallpaper,
    [`${home}/Pictures/landscape.svg`]: ART.landscape,
    [`${home}/Desktop/kiln.svg`]: ART.kiln,
    [`${home}/Desktop/display.svg`]: ART.display,
    [`${home}/Desktop/landscape.svg`]: ART.landscape,
  };
  for (const [path, content] of Object.entries(files)) {
    if (!vfs.exists(path)) vfs.writeFile(path, content);
  }
}

export function bootLines(distro: Distro, hostname: string, restoring: boolean): string[] {
  const k = distro.kernel;
  return [
    `[    0.000000] Linux version ${k} (kiln@build) (gcc 13.2.0, ${distro.libc})`,
    `[    0.000000] Command line: kiln root=UUID=persistent rw quiet`,
    `[    0.041000] kiln-virt: 2 vCPU, 2 GiB memory`,
    `[    0.118000] kiln-fs: mounting persistent volume on /`,
    restoring
      ? `[    0.184000] kiln-fs: restoring last session for ${hostname}`
      : `[    0.184000] kiln-fs: formatting new persistent volume`,
    `[    0.251000] kiln-net: virtio-net up (10.0.0.2/24)`,
    `[    0.318000] kiln-init: ${distro.pretty}`,
    `[    0.390000] xfce4-session[1]: DISPLAY=:0 attached.`,
  ];
}
