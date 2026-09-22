import { useState } from "react";
import { cn } from "@/lib/utils";

const KEYS = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"] as const;

export function CalcApp() {
  const [expr, setExpr] = useState("");
  const [shown, setShown] = useState("0");

  function press(k: string) {
    if (k === "=") {
      const safe = expr.replace(/[^0-9+\-*/().]/g, "");
      if (!safe) return;
      try {
        const val = Function(`"use strict"; return (${safe})`)();
        const next = typeof val === "number" && Number.isFinite(val) ? String(val) : "Error";
        setShown(next);
        setExpr(next === "Error" ? "" : next);
      } catch {
        setShown("Error");
        setExpr("");
      }
      return;
    }
    const next = expr + k;
    setExpr(next);
    setShown(next);
  }

  return (
    <div className="flex h-full flex-col bg-background p-3">
      <div className="mb-3 flex h-16 items-end justify-end rounded-lg bg-card px-4 font-mono text-2xl tabular-nums">
        {shown}
      </div>
      <div className="grid flex-1 grid-cols-4 gap-2">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className={cn(
              "rounded-lg text-lg",
              k === "=" ? "bg-sage text-ink" : "bg-secondary text-secondary-foreground",
            )}
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setExpr("");
            setShown("0");
          }}
          className="col-span-4 h-11 rounded-lg bg-card text-sm"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
