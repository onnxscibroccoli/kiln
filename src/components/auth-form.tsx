import { useState, type FormEvent, type JSX } from "react";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.42Z"
      />
      <path
        fill="currentColor"
        d="M12 22c2.7 0 4.96-.9 6.62-2.35l-3.23-2.5c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.58A10 10 0 0 0 12 22Z"
        opacity="0.85"
      />
      <path
        fill="currentColor"
        d="M6.4 13.99A6 6 0 0 1 6.08 12c0-.69.12-1.36.32-1.99V7.43H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.57l3.34-2.58Z"
        opacity="0.7"
      />
      <path
        fill="currentColor"
        d="M12 5.96c1.47 0 2.78.5 3.82 1.5l2.86-2.86C16.95 2.97 14.7 2 12 2A10 10 0 0 0 3.06 7.43l3.34 2.58C7.19 7.72 9.4 5.96 12 5.96Z"
        opacity="0.55"
      />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.2 3H20l-6.16 7.04L21 21h-5.5l-4.3-5.62L6.4 21H3.58l6.6-7.54L3 3h5.64l3.9 5.16L17.2 3Zm-1.02 16.2h1.53L7.9 4.7H6.26l9.92 14.5Z"
      />
    </svg>
  );
}

const ICONS: Record<string, () => React.JSX.Element> = {
  "grok-google": GoogleGlyph,
  "grok-x": XGlyph,
};

export function AuthForm({ callbackURL = "/boxes" }: { callbackURL?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onOauth(providerId: string) {
    setError(null);
    setBusy(true);
    try {
      await signIn(providerId, { callbackURL, errorCallbackURL: "/login" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setBusy(false);
    }
  }

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "cinder",
          callbackURL,
        });
        if (err) throw new Error(err.message ?? "Could not create account");
      } else {
        const { error: err } = await authClient.signIn.email({ email, password, callbackURL });
        if (err) throw new Error(err.message ?? "Could not sign in");
      }
      window.location.href = callbackURL;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue");
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {GROK_PROVIDERS.map((p) => {
        const Icon = ICONS[p.providerId];
        return (
          <Button
            key={p.providerId}
            type="button"
            variant="outline"
            className="h-12 justify-center"
            disabled={busy}
            onClick={() => void onOauth(p.providerId)}
          >
            {Icon ? <Icon /> : null}
            Continue with {p.label}
          </Button>
        );
      })}

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs tracking-wide text-muted-foreground uppercase">or email</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={(e) => void onEmail(e)} className="flex flex-col gap-3">
        {mode === "signup" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada"
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="h-12">
          {busy ? "Working…" : mode === "signup" ? "Create account" : "Continue with email"}
        </Button>
      </form>

      <button
        type="button"
        className="h-11 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
        }}
      >
        {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
