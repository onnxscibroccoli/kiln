import { createFileRoute } from "@tanstack/react-router";
import { WorkstationView } from "@/components/workstation-view";

export const Route = createFileRoute("/box/$id")({
  component: BoxPage,
});

function BoxPage() {
  const { id } = Route.useParams();
  return <WorkstationView id={id} />;
}
