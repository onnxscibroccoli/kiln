import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string, fallback = "box"): string {
  const s = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return s || fallback;
}

export function usernameFromDisplay(name: string | null | undefined): string {
  if (!name) return "cinder";
  const first = name.trim().split(/\s+/)[0] ?? "";
  const cleaned = first.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned || "cinder";
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Never";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function isUnauthorized(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { message?: string; status?: number };
  return e.message === "Unauthorized" || e.status === 401;
}
