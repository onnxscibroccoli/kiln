export type V86Instance = {
  add_listener: (ev: string, cb: (...args: unknown[]) => void) => void;
  remove_listener: (ev: string, cb: (...args: unknown[]) => void) => void;
  run: () => Promise<void> | void;
  stop: () => Promise<void> | void;
  destroy: () => Promise<void> | void;
  lock_mouse: () => Promise<void> | void;
  save_state: () => Promise<ArrayBuffer>;
  restore_state: (state: ArrayBuffer) => Promise<void>;
  is_running: () => boolean;
  screen_set_scale: (x: number, y: number) => void;
  keyboard_send_scancodes: (codes: number[], delay?: number) => Promise<void> | void;
};

type V86Ctor = new (config: Record<string, unknown>) => V86Instance;

declare global {
  interface Window {
    V86?: V86Ctor;
  }
}

let loading: Promise<V86Ctor> | null = null;

if (typeof window !== "undefined") polyfillImmediate();

function polyfillImmediate() {
  const g = globalThis as Record<string, unknown>;
  if (!g.global) g.global = globalThis;
  if (typeof g.setImmediate !== "function") {
    g.setImmediate = (fn: (...args: unknown[]) => void, ...args: unknown[]) =>
      globalThis.setTimeout(fn, 0, ...args);
  }
}

export function loadV86(): Promise<V86Ctor> {
  if (typeof window === "undefined") return Promise.reject(new Error("V86 is browser-only"));
  polyfillImmediate();
  if (window.V86) return Promise.resolve(window.V86);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    polyfillImmediate();
    const script = document.createElement("script");
    script.src = "/vm/libv86.js";
    script.async = true;
    script.onload = () => {
      if (window.V86) resolve(window.V86);
      else reject(new Error("Emulator loaded without V86"));
    };
    script.onerror = () => reject(new Error("Could not load the emulator"));
    document.head.appendChild(script);
  });
  return loading;
}

const DB_NAME = "kiln-vm";
const STORE = "snapshots";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadSnapshot(boxId: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(boxId);
      req.onsuccess = () => resolve((req.result as ArrayBuffer | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveSnapshot(boxId: string, state: ArrayBuffer): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(state, boxId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** PS/2 set-1 make codes, then break (make | 0x80). */
export const KEYS: Record<string, number[]> = {
  Esc: [0x01],
  Tab: [0x0f],
  Ctrl: [0x1d],
  Alt: [0x38],
  Del: [0x53],
  F1: [0x3b],
  F2: [0x3c],
  Super: [0x5b],
};

export async function sendChord(emu: V86Instance, names: string[]): Promise<void> {
  const make: number[] = [];
  for (const n of names) make.push(...(KEYS[n] ?? []));
  const brk = [...make].reverse().map((c) => c | 0x80);
  await emu.keyboard_send_scancodes([...make, ...brk], 20);
}
