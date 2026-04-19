import { FolderOpen, Layers, RefreshCw } from "lucide-react";

import { IconButton, Tooltip } from "@/components";
import { api, type LayerContent } from "@/lib/tauri";
import { formatBytes } from "@/utils";

import { ContentTree } from "./ContentTree";

interface ContentBrowserLayerSectionProps {
  projectPath: string;
  layer: LayerContent;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function ContentBrowserLayerSection({
  projectPath,
  layer,
  isRefreshing,
  onRefresh,
}: ContentBrowserLayerSectionProps) {
  async function handleOpenFolder() {
    await api.revealInExplorer(`${projectPath}/content/${layer.name}`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-surface-700/50 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Layers className="h-3.5 w-3.5 shrink-0 text-surface-400" />
          <span className="font-mono text-sm font-medium text-surface-200">{layer.name}</span>
          <span className="text-xs text-surface-400">
            {layer.fileCount} {layer.fileCount === 1 ? "file" : "files"}
            {layer.fileCount > 0 && ` · ${formatBytes(Number(layer.totalSizeBytes))}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content="Refresh">
            <IconButton
              icon={
                <RefreshCw className={isRefreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              }
              variant="ghost"
              size="xs"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh content listing"
            />
          </Tooltip>
          <Tooltip content="Open folder">
            <IconButton
              icon={<FolderOpen className="h-3.5 w-3.5" />}
              variant="ghost"
              size="xs"
              onClick={handleOpenFolder}
              aria-label={`Open folder for layer ${layer.name}`}
            />
          </Tooltip>
        </div>
      </div>

      {layer.entries.length === 0 ? (
        <LayerEmptyState />
      ) : (
        <ContentTree entries={layer.entries} projectPath={projectPath} layerName={layer.name} />
      )}
    </div>
  );
}

function LayerEmptyState() {
  return (
    <div className="px-3 py-5 text-center">
      <p className="text-xs text-surface-400">
        No files yet. Extract game files from an existing mod or the game client, then drop them
        into this folder.
      </p>
    </div>
  );
}
