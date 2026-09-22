import { getDistro, TINYCORE_ISO, type Distro } from "./distros";

export type BootMedia = "cdrom" | "hda" | "fda";

export type BootSpec = {
  url: string;
  media: BootMedia;
  memoryMb: number;
  async: boolean;
  label: string;
  sendEnter?: boolean;
  startx?: boolean;
};

export function isIsoUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const s = value.trim();
  return /^https?:\/\//i.test(s) && /\.(iso|img|bin)(\?|#|$)/i.test(s);
}

export function bootSpecFor(distro: Distro, isoOrRepo?: string | null): BootSpec {
  const custom = isoOrRepo?.trim() ?? "";
  if (isIsoUrl(custom)) {
    const name = custom.split("/").pop()?.split("?")[0] || "custom.iso";
    return {
      url: custom,
      media: name.endsWith(".img") ? "hda" : "cdrom",
      memoryMb: 256,
      async: true,
      label: name,
      sendEnter: true,
      startx: true,
    };
  }
  return {
    url: distro.bootIso || TINYCORE_ISO,
    media: distro.bootMedia ?? "cdrom",
    memoryMb: distro.bootMemoryMb ?? 256,
    async: false,
    label: (distro.bootIso || TINYCORE_ISO) === TINYCORE_ISO ? "Tiny Core Linux 11" : distro.pretty,
    sendEnter: distro.bootMedia !== "fda",
    startx: distro.desktop !== "none",
  };
}

export function bootSpecForIds(distroId: string, isoOrRepo?: string | null): BootSpec {
  return bootSpecFor(getDistro(distroId), isoOrRepo);
}
