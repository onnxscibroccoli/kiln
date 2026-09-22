import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { authEnabled } from "@/lib/auth/client";
import { AuthForm } from "@/components/auth-form";
import { KilnMark } from "@/components/kiln-mark";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <Skeleton className="h-80 w-full max-w-sm rounded-xl" />
      </main>
    );
  }

  if (user) return <Navigate to="/boxes" />;

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center gap-2 text-foreground no-underline">
          <KilnMark className="size-8" />
          <span className="font-display text-2xl italic tracking-tight">kiln</span>
        </Link>
        <h1 className="font-display text-3xl tracking-tight">Continue</h1>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">
          Google, X, or email. Existing sessions resume on this account.
        </p>
        {authEnabled ? (
          <AuthForm callbackURL="/boxes" />
        ) : (
          <p className="text-sm text-muted-foreground">Sign-in is disabled.</p>
        )}
      </div>
    </main>
  );
}
