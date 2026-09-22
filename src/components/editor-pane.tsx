import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function EditorPane({
  path,
  value,
  dirty,
  onChange,
  onSave,
}: {
  path: string | null;
  value: string;
  dirty: boolean;
  onChange: (next: string) => void;
  onSave: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSave]);

  if (!path) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-display text-xl tracking-tight">No file open</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Pick a file in the tree or type <span className="font-mono text-sage">code README.md</span> in
          the terminal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 items-center justify-between gap-3 border-b border-border px-3">
        <div className="truncate font-mono text-xs text-muted-foreground">
          {path}
          {dirty ? " · unsaved" : ""}
        </div>
        <Button size="sm" variant={dirty ? "default" : "ghost"} onClick={onSave} disabled={!dirty}>
          Save
        </Button>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="min-h-0 flex-1 resize-none bg-terminal px-4 py-3 font-mono text-[13px] leading-6 text-foreground outline-none"
      />
    </div>
  );
}
