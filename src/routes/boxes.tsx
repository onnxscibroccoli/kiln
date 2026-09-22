import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";

export const Route = createFileRoute("/boxes")({
  component: BoxesPage,
});

function BoxesPage() {
  return <Dashboard />;
}
