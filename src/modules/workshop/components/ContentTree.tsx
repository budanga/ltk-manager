import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useMemo, useRef, useState } from "react";

import type { ContentEntry } from "@/lib/tauri";

import { useContentTreeNav } from "../hooks";
import {
  allDirPaths,
  buildContentTree,
  buildDirFileCounts,
  type ContentTreeNode,
  flattenTree,
} from "../utils/contentTree";
import { TreeRow } from "./ContentTreeRow";
import { ContentTreeRowContextMenu } from "./ContentTreeRowContextMenu";

/** Fixed row height (px). Used by the virtualizer so we can precompute row
 * positions without per-row measurement. */
const ROW_HEIGHT = 24;

interface ContentTreeProps {
  entries: readonly ContentEntry[];
  projectPath: string;
  layerName: string;
}

export function ContentTree({ entries, projectPath, layerName }: ContentTreeProps) {
  const tree = useMemo(() => buildContentTree(entries), [entries]);
  const dirFileCounts = useMemo(() => buildDirFileCounts(tree), [tree]);
  const [expanded, setExpanded] = useState<Set<string>>(() => allDirPaths(tree));
  const rows = useMemo(() => flattenTree(tree, expanded), [tree, expanded]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    getItemKey: (index) => nodeKey(rows[index]!.node),
  });

  const toggle = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const { focusedIndex, setFocusedIndex, handleKeyDown } = useContentTreeNav({
    rows,
    expanded,
    onToggle: toggle,
    virtualizer,
    scrollElementRef: scrollRef,
  });

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-auto py-1 text-sm outline-none"
      role="tree"
      aria-label="Layer files"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <div
        role="presentation"
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index]!;
          const isSelected = virtualRow.index === focusedIndex;
          return (
            <div
              key={virtualRow.key}
              role="presentation"
              className="absolute inset-x-0"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <ContentTreeRowContextMenu
                node={row.node}
                projectPath={projectPath}
                layerName={layerName}
              >
                <TreeRow
                  node={row.node}
                  depth={row.depth}
                  isExpanded={row.node.type === "dir" && expanded.has(row.node.path)}
                  isSelected={isSelected}
                  dirFileCount={
                    row.node.type === "dir" ? (dirFileCounts.get(row.node.path) ?? 0) : 0
                  }
                  onToggle={toggle}
                  onSelect={() => setFocusedIndex(virtualRow.index)}
                  height={ROW_HEIGHT}
                  rowIndex={virtualRow.index}
                  tabIndex={isSelected ? 0 : -1}
                />
              </ContentTreeRowContextMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function nodeKey(node: ContentTreeNode): string {
  return node.type === "dir" ? `d:${node.path}` : `f:${node.entry.relativePath}`;
}
