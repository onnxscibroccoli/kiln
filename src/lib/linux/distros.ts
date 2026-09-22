export type PkgKind = "apk" | "apt" | "dnf" | "pacman" | "zypper" | "xbps" | "nix" | "emerge";
export type DesktopKind = "gnome" | "kde" | "xfce" | "cinnamon" | "pantheon" | "flwm" | "none";
export type BootMedia = "cdrom" | "hda" | "fda";

/** Official Tiny Core live ISO used by v86. CORS-open, ~20 MB, real X11. */
export const TINYCORE_ISO = "/vm/TinyCore-11.0.iso";
export const BUILDROOT_ISO = "/vm/linux4.iso";
export const KOLIBRI_IMG = "/vm/kolibri.img";

export type Distro = {
  id: string;
  name: string;
  version: string;
  pretty: string;
  family: string;
  kernel: string;
  pkg: PkgKind;
  pkgBin: string;
  shell: string;
  libc: string;
  desktop: DesktopKind;
  tags: string[];
  summary: string;
  github?: string;
  osRelease: string;
  desk: string;
  bootIso?: string;
  bootMedia?: BootMedia;
  bootMemoryMb?: number;
};

function os(
  name: string,
  id: string,
  versionId: string,
  pretty: string,
  extra: string[] = [],
): string {
  return [
    `NAME="${name}"`,
    `ID=${id}`,
    `VERSION_ID="${versionId}"`,
    `PRETTY_NAME="${pretty}"`,
    ...extra,
  ].join("\n");
}

function make(
  d: Omit<Distro, "osRelease" | "libc" | "shell" | "pkgBin" | "bootIso" | "bootMedia" | "bootMemoryMb"> &
    Partial<Pick<Distro, "osRelease" | "libc" | "shell" | "pkgBin" | "bootIso" | "bootMedia" | "bootMemoryMb">>,
): Distro {
  const pkgBin =
    d.pkgBin ??
    (d.pkg === "apk"
      ? "apk"
      : d.pkg === "dnf"
        ? "dnf"
        : d.pkg === "pacman"
          ? "pacman"
          : d.pkg === "zypper"
            ? "zypper"
            : d.pkg === "xbps"
              ? "xbps-install"
              : d.pkg === "nix"
                ? "nix-env"
                : d.pkg === "emerge"
                  ? "emerge"
                  : "apt");
  return {
    libc: d.pkg === "apk" ? "musl" : "glibc",
    shell: d.pkg === "apk" ? "ash" : "bash",
    osRelease: os(d.name, d.id, d.version, d.pretty, [`HOME_URL=https://kiln.local/${d.id}`]),
    bootIso: d.bootIso ?? TINYCORE_ISO,
    bootMedia: d.bootMedia ?? "cdrom",
    bootMemoryMb: d.bootMemoryMb ?? 256,
    ...d,
    pkgBin,
  };
}

const RAW: Distro[] = [
  make({
    id: "tinycore",
    name: "Tiny Core",
    version: "11.0",
    pretty: "Tiny Core Linux 11",
    family: "tinycore",
    kernel: "4.19.10-tinycore",
    pkg: "apk",
    pkgBin: "tce-load",
    desktop: "flwm",
    tags: ["live", "gui", "x11", "tiny", "real"],
    summary: "Live Linux GUI. Real kernel, Xvesa, FLWM. This is the included desktop.",
    desk: "alpine",
    bootIso: TINYCORE_ISO,
    bootMedia: "cdrom",
  }),
  make({
    id: "buildroot",
    name: "Buildroot",
    version: "4.16",
    pretty: "Buildroot Linux",
    family: "buildroot",
    kernel: "4.16.13",
    pkg: "apk",
    pkgBin: "busybox",
    desktop: "none",
    tags: ["live", "minimal", "busybox"],
    summary: "Minimal real Linux kernel + busybox (console).",
    desk: "void",
    bootIso: BUILDROOT_ISO,
    bootMedia: "cdrom",
    bootMemoryMb: 128,
  }),
  make({
    id: "kolibri",
    name: "KolibriOS",
    version: "live",
    pretty: "KolibriOS",
    family: "kolibri",
    kernel: "kolibri",
    pkg: "apk",
    pkgBin: "n/a",
    desktop: "flwm",
    tags: ["live", "gui", "tiny"],
    summary: "Tiny native GUI OS. Real framebuffer desktop.",
    desk: "elementary",
    bootIso: KOLIBRI_IMG,
    bootMedia: "fda",
    bootMemoryMb: 128,
  }),
  make({
    id: "ubuntu",
    name: "Ubuntu",
    version: "24.04",
    pretty: "Ubuntu 24.04.1 LTS",
    family: "debian",
    kernel: "6.8.0-41-generic",
    pkg: "apt",
    desktop: "gnome",
    tags: ["lts", "desktop", "gnome", "beginner"],
    summary: "64-bit live CDs cannot boot here. Ships Tiny Core x86 with X11; paste a 32-bit ISO to override.",
    desk: "ubuntu",
  }),
  make({
    id: "debian",
    name: "Debian",
    version: "12",
    pretty: "Debian GNU/Linux 12 (bookworm)",
    family: "debian",
    kernel: "6.1.0-25-amd64",
    pkg: "apt",
    desktop: "gnome",
    tags: ["stable", "server", "vanilla"],
    summary: "Paste a Debian i386 live ISO, or use Tiny Core’s X11 desktop.",
    desk: "debian",
  }),
  make({
    id: "alpine",
    name: "Alpine",
    version: "3.20",
    pretty: "Alpine Linux v3.20",
    family: "alpine",
    kernel: "6.6.32-kiln",
    pkg: "apk",
    desktop: "none",
    tags: ["tiny", "musl", "container", "fast"],
    summary: "Tiny musl. Default live GUI is Tiny Core X11.",
    desk: "alpine",
  }),
  make({
    id: "fedora",
    name: "Fedora",
    version: "41",
    pretty: "Fedora Linux 41",
    family: "rhel",
    kernel: "6.11.4-300.fc41",
    pkg: "dnf",
    desktop: "gnome",
    tags: ["workstation", "gnome", "rpm"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "fedora",
  }),
  make({
    id: "arch",
    name: "Arch",
    version: "rolling",
    pretty: "Arch Linux",
    family: "arch",
    kernel: "6.11.6-arch1-1",
    pkg: "pacman",
    desktop: "none",
    tags: ["rolling", "minimal", "btw"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "arch",
  }),
  make({
    id: "opensuse",
    name: "openSUSE Leap",
    version: "15.6",
    pretty: "openSUSE Leap 15.6",
    family: "suse",
    kernel: "6.4.0-suse",
    pkg: "zypper",
    desktop: "kde",
    tags: ["kde", "stable", "suse"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "suse",
  }),
  make({
    id: "tumbleweed",
    name: "Tumbleweed",
    version: "rolling",
    pretty: "openSUSE Tumbleweed",
    family: "suse",
    kernel: "6.11.0-suse",
    pkg: "zypper",
    desktop: "kde",
    tags: ["rolling", "kde", "suse"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "tumbleweed",
  }),
  make({
    id: "kali",
    name: "Kali",
    version: "2024.4",
    pretty: "Kali GNU/Linux 2024.4",
    family: "debian",
    kernel: "6.11.2-kali",
    pkg: "apt",
    desktop: "xfce",
    tags: ["security", "xfce", "tools"],
    summary: "Official Kali is 64-bit. This box boots Tiny Core X11 unless you attach an i386 ISO.",
    desk: "kali",
  }),
  make({
    id: "mint",
    name: "Linux Mint",
    version: "22",
    pretty: "Linux Mint 22 Wilma",
    family: "debian",
    kernel: "6.8.0-mint",
    pkg: "apt",
    desktop: "cinnamon",
    tags: ["cinnamon", "beginner", "mint"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "mint",
  }),
  make({
    id: "pop",
    name: "Pop!_OS",
    version: "22.04",
    pretty: "Pop!_OS 22.04 LTS",
    family: "debian",
    kernel: "6.8.0-pop",
    pkg: "apt",
    desktop: "gnome",
    tags: ["cosmic", "nvidia", "system76"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "pop",
  }),
  make({
    id: "nixos",
    name: "NixOS",
    version: "24.11",
    pretty: "NixOS 24.11",
    family: "nix",
    kernel: "6.6.63-nix",
    pkg: "nix",
    desktop: "none",
    tags: ["declarative", "reproducible"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "nix",
  }),
  make({
    id: "void",
    name: "Void",
    version: "rolling",
    pretty: "Void Linux",
    family: "void",
    kernel: "6.6.63-void",
    pkg: "xbps",
    desktop: "none",
    tags: ["runit", "independent", "rolling"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "void",
  }),
  make({
    id: "rocky",
    name: "Rocky Linux",
    version: "9.5",
    pretty: "Rocky Linux 9.5",
    family: "rhel",
    kernel: "5.14.0-rocky",
    pkg: "dnf",
    desktop: "gnome",
    tags: ["el", "rhel", "server"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "rocky",
  }),
  make({
    id: "alma",
    name: "AlmaLinux",
    version: "9.5",
    pretty: "AlmaLinux 9.5",
    family: "rhel",
    kernel: "5.14.0-alma",
    pkg: "dnf",
    desktop: "gnome",
    tags: ["el", "rhel", "server"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "alma",
  }),
  make({
    id: "manjaro",
    name: "Manjaro",
    version: "24",
    pretty: "Manjaro Linux",
    family: "arch",
    kernel: "6.11-manjaro",
    pkg: "pacman",
    desktop: "xfce",
    tags: ["arch", "beginner", "xfce"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "manjaro",
  }),
  make({
    id: "elementary",
    name: "elementary OS",
    version: "8",
    pretty: "elementary OS 8",
    family: "debian",
    kernel: "6.8.0-elem",
    pkg: "apt",
    desktop: "pantheon",
    tags: ["pantheon", "design"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "elementary",
  }),
  make({
    id: "gentoo",
    name: "Gentoo",
    version: "rolling",
    pretty: "Gentoo Linux",
    family: "gentoo",
    kernel: "6.6.62-gentoo",
    pkg: "emerge",
    desktop: "none",
    tags: ["source", "compile", "portage"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "gentoo",
  }),
  make({
    id: "zorin",
    name: "Zorin OS",
    version: "17",
    pretty: "Zorin OS 17",
    family: "debian",
    kernel: "6.8.0-zorin",
    pkg: "apt",
    desktop: "gnome",
    tags: ["beginner", "windows-like"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    desk: "zorin",
  }),
  make({
    id: "raspbian",
    name: "Raspberry Pi OS",
    version: "12",
    pretty: "Debian GNU/Linux 12 (Raspberry Pi OS)",
    family: "debian",
    kernel: "6.6.31-v8-pi",
    pkg: "apt",
    desktop: "xfce",
    tags: ["arm", "pi", "education"],
    summary: "ARM images cannot boot here. Tiny Core X11 is the live x86 machine.",
    desk: "pi",
  }),
  make({
    id: "bluefin",
    name: "Bluefin",
    version: "41",
    pretty: "Bluefin (Fedora Atomic)",
    family: "rhel",
    kernel: "6.11.4-bluefin",
    pkg: "dnf",
    desktop: "gnome",
    tags: ["ublue", "atomic", "github", "developer"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    github: "ublue-os/bluefin",
    desk: "bluefin",
  }),
  make({
    id: "bazzite",
    name: "Bazzite",
    version: "41",
    pretty: "Bazzite (Fedora Atomic)",
    family: "rhel",
    kernel: "6.11.4-bazzite",
    pkg: "dnf",
    desktop: "kde",
    tags: ["ublue", "gaming", "github", "steam"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    github: "ublue-os/bazzite",
    desk: "bazzite",
  }),
  make({
    id: "cachyos",
    name: "CachyOS",
    version: "rolling",
    pretty: "CachyOS",
    family: "arch",
    kernel: "6.12.1-cachyos",
    pkg: "pacman",
    desktop: "kde",
    tags: ["arch", "performance", "github"],
    summary: "64-bit live CDs cannot boot here. Tiny Core X11 is the live machine.",
    github: "CachyOS/linux-cachyos",
    desk: "cachy",
  }),
];

export const DISTROS: Record<string, Distro> = Object.fromEntries(RAW.map((d) => [d.id, d]));
export const DISTRO_IDS = RAW.map((d) => d.id);
export type DistroId = string;

export function isDistroId(value: string): value is DistroId {
  return value in DISTROS;
}

export function getDistro(id: string | null | undefined): Distro {
  if (id && DISTROS[id]) return DISTROS[id]!;
  return DISTROS.tinycore!;
}

export function searchImages(query: string): Distro[] {
  const q = query.trim().toLowerCase();
  const all = RAW;
  if (!q) return all;
  return all.filter((d) => {
    const blob = [d.id, d.name, d.pretty, d.family, d.pkg, d.desktop, d.github, ...d.tags, d.summary]
      .join(" ")
      .toLowerCase();
    return q.split(/\s+/).every((part) => blob.includes(part));
  });
}

export function inferDistroFromGithub(input: string): Distro | null {
  const s = input.toLowerCase();
  if (/\.(iso|img)(\?|#|$)/i.test(s)) return DISTROS.tinycore!;
  for (const d of RAW) {
    if (d.github && s.includes(d.github.toLowerCase())) return d;
  }
  if (s.includes("tinycore") || s.includes("tiny-core")) return DISTROS.tinycore!;
  if (s.includes("ubuntu")) return DISTROS.ubuntu!;
  if (s.includes("debian")) return DISTROS.debian!;
  if (s.includes("alpine")) return DISTROS.alpine!;
  if (s.includes("fedora") || s.includes("ublue")) return DISTROS.fedora!;
  if (s.includes("archlinux") || s.includes("/arch")) return DISTROS.arch!;
  if (s.includes("nixos")) return DISTROS.nixos!;
  if (s.includes("kali")) return DISTROS.kali!;
  return null;
}

export const FEATURED_IDS = ["tinycore", "buildroot", "kolibri", "debian", "kali", "ubuntu"] as const;
