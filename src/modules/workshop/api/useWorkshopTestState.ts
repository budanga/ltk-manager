import { useMemo } from "react";

import type { WorkshopProject } from "@/lib/tauri";
import { usePatcherStatus } from "@/modules/patcher";
import { usePatcherSessionStore } from "@/stores";

export type WorkshopTestState =
  | { kind: "idle" }
  | { kind: "building-this" }
  | { kind: "running-this" }
  | { kind: "building-other"; otherLabel: string }
  | { kind: "running-other"; otherLabel: string }
  | { kind: "building-library" }
  | { kind: "running-library" };

export function useWorkshopTestState(project?: WorkshopProject): WorkshopTestState {
  const { data: status } = usePatcherStatus();
  const testingProjects = usePatcherSessionStore((s) => s.testingProjects);

  return useMemo<WorkshopTestState>(() => {
    const running = status?.running ?? false;
    const building = status?.phase === "building";
    const pendingTest = !running && !building && testingProjects.length > 0;

    if (!running && !building && !pendingTest) return { kind: "idle" };

    const inBuildPhase = building || pendingTest;

    const isThis = project ? testingProjects.some((p) => p.path === project.path) : false;
    if (isThis) {
      return inBuildPhase ? { kind: "building-this" } : { kind: "running-this" };
    }

    if (testingProjects.length > 0) {
      const otherLabel =
        testingProjects.length === 1
          ? testingProjects[0].displayName
          : `${testingProjects.length} projects`;
      return inBuildPhase
        ? { kind: "building-other", otherLabel }
        : { kind: "running-other", otherLabel };
    }

    return inBuildPhase ? { kind: "building-library" } : { kind: "running-library" };
  }, [status, project, testingProjects]);
}
