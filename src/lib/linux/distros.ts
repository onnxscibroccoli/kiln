export type PkgKind = "apk" | "apt" | "dnf" | "pacman" | "zypper" | "xbps" | "nix" | "emerge";
export type DesktopKind = "gnome" | "kde" | "xfce" | "cinnamon" | "pantheon" | "none";

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

function make(d: Omit<Distro, "osRelease" | "libc" | "shell" | "pkgBin"> & Partial<Pick<Distro, "osRelease" | "libc" | "shell" | "pkgBin">>): Distro {
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
    ...d,
    pkgBin,
  };
}

const RAW: Distro[] = [
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
    summary: "Familiar LTS desktop. apt + GNOME.",
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
    summary: "Stable GNU userspace. apt. Long support.",
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
    summary: "Tiny musl image. apk. Boots fast.",
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
    summary: "Current GNOME workstation. dnf.",
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
    summary: "Rolling, you assemble the rest. pacman.",
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
    summary: "Leap + Plasma. zypper.",
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
    summary: "Rolling Plasma. zypper dup.",
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
    summary: "Debian-based lab desktop. XFCE.",
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
    tags: ["cinnamon", "desktop", "beginner"],
    summary: "Cinnamon desktop on Ubuntu LTS.",
    desk: "mint",
  }),
  make({
    id: "popos",
    name: "Pop!_OS",
    version: "22.04",
    pretty: "Pop!_OS 22.04 LTS",
    family: "debian",
    kernel: "6.9.3-pop",
    pkg: "apt",
    desktop: "gnome",
    tags: ["cosmic", "system76", "laptop"],
    summary: "System76 COSMIC-flavored Ubuntu.",
    desk: "pop",
  }),
  make({
    id: "nixos",
    name: "NixOS",
    version: "24.11",
    pretty: "NixOS 24.11",
    family: "nix",
    kernel: "6.6.63-nixos",
    pkg: "nix",
    desktop: "gnome",
    tags: ["declarative", "reproducible"],
    summary: "Declarative config. nix-env in this box.",
    desk: "nix",
  }),
  make({
    id: "void",
    name: "Void",
    version: "current",
    pretty: "Void Linux",
    family: "void",
    kernel: "6.6.63_1",
    pkg: "xbps",
    desktop: "xfce",
    tags: ["runit", "independent", "musl"],
    summary: "runit, xbps, no systemd theatre.",
    desk: "void",
  }),
  make({
    id: "rocky",
    name: "Rocky Linux",
    version: "9.5",
    pretty: "Rocky Linux 9.5",
    family: "rhel",
    kernel: "5.14.0-el9",
    pkg: "dnf",
    desktop: "gnome",
    tags: ["el", "server", "rhel"],
    summary: "RHEL-compatible. dnf.",
    desk: "rocky",
  }),
  make({
    id: "alma",
    name: "AlmaLinux",
    version: "9.5",
    pretty: "AlmaLinux 9.5",
    family: "rhel",
    kernel: "5.14.0-el9",
    pkg: "dnf",
    desktop: "gnome",
    tags: ["el", "server", "rhel"],
    summary: "Community EL. dnf.",
    desk: "alma",
  }),
  make({
    id: "manjaro",
    name: "Manjaro",
    version: "24.2",
    pretty: "Manjaro Linux 24.2",
    family: "arch",
    kernel: "6.12.1-manjaro",
    pkg: "pacman",
    desktop: "kde",
    tags: ["arch", "kde", "beginner"],
    summary: "Arch made neighborly. pacman.",
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
    tags: ["pantheon", "design", "desktop"],
    summary: "Pantheon desktop on Ubuntu.",
    desk: "elementary",
  }),
  make({
    id: "gentoo",
    name: "Gentoo",
    version: "2.17",
    pretty: "Gentoo Linux",
    family: "gentoo",
    kernel: "6.6.62-gentoo",
    pkg: "emerge",
    desktop: "none",
    tags: ["source", "compile", "portage"],
    summary: "Portage. You wanted this.",
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
    summary: "Ubuntu-based desktop for switchers.",
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
    summary: "Debian for the Pi, here as a userspace.",
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
    summary: "Universal Blue GNOME. GitHub image.",
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
    summary: "Universal Blue gaming desktop.",
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
    summary: "Arch with a performance kernel.",
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
  return DISTROS.ubuntu!;
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
  for (const d of RAW) {
    if (d.github && s.includes(d.github.toLowerCase())) return d;
  }
  if (s.includes("ubuntu")) return DISTROS.ubuntu!;
  if (s.includes("debian")) return DISTROS.debian!;
  if (s.includes("alpine")) return DISTROS.alpine!;
  if (s.includes("fedora") || s.includes("ublue")) return DISTROS.fedora!;
  if (s.includes("archlinux") || s.includes("/arch")) return DISTROS.arch!;
  if (s.includes("nixos")) return DISTROS.nixos!;
  if (s.includes("kali")) return DISTROS.kali!;
  return null;
}

export const FEATURED_IDS = ["ubuntu", "fedora", "arch", "debian", "alpine", "bluefin"] as const;
