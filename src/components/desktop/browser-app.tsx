import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { type ShellHooks } from "@/lib/linux/shell";

export function BrowserApp({ hooks }: { hooks: ShellHooks }) {
  const [url, setUrl] = useState("https://example.com");
  const [body, setBody] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Enter an address.");
  const [busy, setBusy] = useState(false);
  const [html, setHtml] = useState(false);

  async function go(e: FormEvent) {
    e.preventDefault();
    const target = url.trim();
    if (!target) return;
    const href = /^https?:\/\//i.test(target) ? target : `https://${target}`;
    setUrl(href);
    setBusy(true);
    setStatus("Loading…");
    try {
      const res = await hooks.fetchUrl(href);
      const text = res.body || "";
      const looksHtml = /<html|<body|<!doctype html/i.test(text.slice(0, 800));
      setHtml(looksHtml);
      setBody(text);
      setStatus(`${res.status} · ${href}`);
    } catch (err) {
      setHtml(false);
      setBody(null);
      setStatus(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <form onSubmit={go} className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-2">
        <label htmlFor="kiln-url" className="sr-only">
          Address
        </label>
        <input
          id="kiln-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-11 min-w-0 flex-1 bg-transparent px-2 font-mono text-sm outline-none"
          spellCheck={false}
          autoCapitalize="off"
        />
        <Button type="submit" size="sm" disabled={busy} className="h-11">
          Go
        </Button>
      </form>
      <p className="shrink-0 px-3 py-1 text-[11px] text-muted-foreground">{status}</p>
      <div className="min-h-0 flex-1 overflow-auto bg-card">
        {html && body ? (
          <iframe
            title="Page"
            sandbox=""
            srcDoc={body.slice(0, 180_000)}
            className="h-full w-full border-0 bg-paper"
          />
        ) : (
          <pre className="whitespace-pre-wrap p-3 font-mono text-xs leading-relaxed text-muted-foreground">
            {body ?? "Pages load as a reader view. Some hosts block the fetch."}
          </pre>
        )}
      </div>
    </div>
  );
}
