import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, FolderTree, Globe, Package } from "lucide-react";

import { Button, NavTabs } from "@/components";
import {
  DeleteConfirmDialog,
  LoadingState,
  PackDialog,
  ProjectHeader,
  ProjectProvider,
  useWorkshopProjects,
} from "@/modules/workshop";

export const Route = createFileRoute("/workshop/$projectName")({
  component: ProjectDetailLayout,
});

function ProjectDetailLayout() {
  const { projectName } = Route.useParams();

  const { data: projects, isLoading } = useWorkshopProjects();
  const project = projects?.find((p) => p.name === projectName);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-surface-400">Project not found: {projectName}</p>
        <Link to="/workshop">
          <Button variant="outline" left={<ArrowLeft className="h-4 w-4" />}>
            Back to Workshop
          </Button>
        </Link>
      </div>
    );
  }

  const tabIconClass = "h-3.5 w-3.5";
  const tabs = [
    {
      to: "/workshop/$projectName",
      params: { projectName },
      label: "Overview",
      icon: <Package className={tabIconClass} />,
      exact: true,
    },
    {
      to: "/workshop/$projectName/content",
      params: { projectName },
      label: "Content",
      icon: <FolderTree className={tabIconClass} />,
    },
    {
      to: "/workshop/$projectName/strings",
      params: { projectName },
      label: "Strings",
      icon: <Globe className={tabIconClass} />,
    },
  ];

  return (
    <ProjectProvider project={project}>
      <div className="flex h-full flex-col">
        <ProjectHeader project={project} />

        <NavTabs tabs={tabs} />

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>

      <PackDialog />
      <DeleteConfirmDialog />
    </ProjectProvider>
  );
}
