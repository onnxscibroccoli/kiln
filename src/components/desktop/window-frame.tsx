import { type PointerEvent, type ReactNode, useRef } from "react";
import { Minus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type AppId } from "@/lib/linux/shell";

export type WinState = {
  app: AppId;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  open: boolean;
};

export function WindowFrame({
  win,
  desktop,
  active,
  onFocus,
  onClose,
  onMin,
  onMax,
  onMove,
  children,
}: {
  win: WinState;
  desktop: boolean;
  active: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMin: () => void;
  onMax: () => void;
  onMove: (x: number, y: number) => void;
  children: ReactNode;
}) {
  const drag = useRef<{ mx: number; my: number; x: number; y: number } | null>(null);

  if (!win.open) return null;

  const floating = desktop && !win.maximized;

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    if (!floating) return;
    if ((e.target as HTMLElement).closest("button")) return;
    onFocus();
    drag.current = { mx: e.clientX, my: e.clientY, x: win.x, y: win.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.mx;
    const dy = e.clientY - drag.current.my;
    onMove(Math.max(0, drag.current.x + dx), Math.max(0, drag.current.y + dy));
  }

  function onPointerUp() {
    drag.current = null;
  }

  const style = floating
    ? { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }
    : { zIndex: win.z };

  return (
    <section
      role="dialog"
      aria-label={win.title}
      onMouseDown={onFocus}
      className={cn(
        "kiln-window flex min-h-0 flex-col overflow-hidden bg-card text-card-foreground",
        floating ? "absolute rounded-md" : "absolute inset-0 rounded-none md:inset-2 md:rounded-md",
        active ? "opacity-100" : "opacity-95",
        win.minimized && "hidden",
      )}
      style={style}
    >
      <header
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={cn(
          "flex h-11 shrink-0 cursor-default items-center gap-2 border-b px-1",
          active ? "border-border bg-elevated" : "border-border bg-card",
        )}
      >
        <h2 className="min-w-0 flex-1 truncate px-2 text-xs font-medium">{win.title}</h2>
        <div className="flex items-center">
          <IconBtn label="Minimize" onClick={onMin}>
            <Minus className="size-3.5" />
          </IconBtn>
          <IconBtn label="Maximize" onClick={onMax} className="hidden md:inline-flex">
            <Square className="size-3" />
          </IconBtn>
          <IconBtn label="Close" onClick={onClose} danger>
            <X className="size-3.5" />
          </IconBtn>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden bg-background">{children}</div>
    </section>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  className,
  danger,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-11 items-center justify-center text-muted-foreground hover:text-foreground",
        danger && "hover:bg-destructive/20 hover:text-destructive-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
