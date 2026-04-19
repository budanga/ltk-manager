import { createFileRoute } from "@tanstack/react-router";

import { ContentBrowser, useProjectContext } from "@/modules/workshop";

export const Route = createFileRoute("/workshop/$projectName/content")({
  component: ProjectContent,
});

function ProjectContent() {
  const project = useProjectContext();

  return (
    <div className="h-full">
      <ContentBrowser project={project} />
    </div>
  );
}
