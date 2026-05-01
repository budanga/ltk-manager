import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import type { InstalledMod } from "@/lib/tauri";
import type { ModGroup } from "@/modules/library/utils";

import { gridClass } from "./UnifiedDndGrid";
import { ModCard } from "./ModCard";

interface GroupedModListProps {
  groups: ModGroup[];
  viewMode: "grid" | "list";
  onViewDetails?: (mod: InstalledMod) => void;
}

export function GroupedModList({ groups, viewMode, onViewDetails }: GroupedModListProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggle(label: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ label, mods }) => {
        const isCollapsed = collapsed.has(label);
        return (
          <section key={label}>
            <button
              type="button"
              onClick={() => toggle(label)}
              className="group mb-3 flex w-full items-center gap-2 text-left"
            >
              <span className="text-accent-400">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
              <h3 className="text-sm font-semibold text-surface-100 group-hover:text-surface-50 transition-colors">
                {label}
              </h3>
              <span className="ml-1 rounded-full bg-surface-800 px-2 py-0.5 text-xs text-surface-400">
                {mods.length}
              </span>
            </button>

            {!isCollapsed && (
              <div className={`${gridClass(viewMode)} stagger-enter`}>
                {mods.map((mod) => (
                  <ModCard
                    key={mod.id}
                    mod={mod}
                    viewMode={viewMode}
                    onViewDetails={onViewDetails}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
