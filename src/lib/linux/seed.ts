import { type Distro } from "./distros";
import { dir, file, Vfs } from "./vfs";

export const BASE_PACKAGES = ["busybox", "coreutils", "git", "nodejs", "vim", "curl", "neofetch"];

export function homeDir(user: string): string {
  return `/home/${user}`;
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

This is your persistent Kiln workstation — a Linux userspace in the browser.
Files, history, and packages survive across sessions once you are signed in.

## First commands

    ls -la
    neofetch
    cat ${home}/projects/hello/hello.js
    node ${home}/projects/hello/hello.js
    git clone https://github.com/owner/repo

Open a file in the editor with \`code README.md\` or click it in the tree.

Distro: ${distro.pretty}
Shell:  ${distro.shell}
User:   ${user}
${githubRepo ? `\nGitHub origin: ${githubRepo}\n` : ""}`;

  const helloJs = `const os = { user: "${user}", host: "${hostname}" };
console.log("hello from kiln");
console.log("running on " + os.host + " as " + os.user);
`;

  const bashrc = `# ~/.bashrc — kiln ${distro.id}
export EDITOR=vim
export TERM=xterm-256color
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
      motd: file(`Welcome to ${distro.pretty} on Kiln.\nPersistent volume attached.\n`),
      "resolv.conf": file("nameserver 1.1.1.1\nnameserver 8.8.8.8\n"),
      issue: file(`${distro.pretty} \\n \\l\n`),
    }),
    home: dir({
      [user]: dir({
        "README.md": file(readme),
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
        syslog: file("kiln-init: persistent volume mounted\n"),
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
    `[    0.390000] systemd[1]: Started Kiln workstation target.`,
  ];
}
