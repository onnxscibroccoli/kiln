import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "muted" | "good" | "warn" | "sage" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        tone === "muted" && "bg-secondary text-muted-foreground",
        tone === "good" && "bg-good/15 text-good",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "sage" && "bg-sage/15 text-sage",
        className,
      )}
      {...props}
    />
  );
}
