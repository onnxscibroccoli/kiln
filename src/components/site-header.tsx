import { Link } from "@tanstack/react-router";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { KilnMark } from "@/components/kiln-mark";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const { user, isPending } = useCurrentUserState();

  return (
    <header className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
      <Link to="/" className="flex min-w-0 items-center gap-2 text-foreground no-underline">
        <KilnMark className="size-7" />
        <span className="font-display text-lg tracking-tight italic">kiln</span>
      </Link>
      <nav className="flex min-w-0 shrink-0 items-center gap-3 text-sm">
        {!compact && (
          <SignedIn>
            <Link
              to="/boxes"
              className="hidden h-11 items-center px-2 text-muted-foreground no-underline hover:text-foreground sm:inline-flex"
            >
              Boxes
            </Link>
          </SignedIn>
        )}
        {isPending ? (
          <Skeleton className="h-8 w-28 rounded-full" />
        ) : user ? (
          <UserButton />
        ) : (
          <SignedOut>
            <Link
              to="/login"
              className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground no-underline hover:opacity-90"
            >
              Sign in
            </Link>
          </SignedOut>
        )}
      </nav>
    </header>
  );
}
