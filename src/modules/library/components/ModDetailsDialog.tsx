import { invoke } from "@tauri-apps/api/core";
import { LuCalendar, LuFolderOpen, LuLayers, LuUser } from "react-icons/lu";

import { Button, Dialog } from "@/components";
import type { InstalledMod } from "@/lib/tauri";
import { useModThumbnail } from "@/modules/library/api/useModThumbnail";

interface ModDetailsDialogProps {
  open: boolean;
  mod: InstalledMod | null;
  onClose: () => void;
}

export function ModDetailsDialog({ open, mod, onClose }: ModDetailsDialogProps) {
  if (!mod) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Overlay size="md">
          <Dialog.Header>
            <Dialog.Title>{mod.displayName}</Dialog.Title>
            <Dialog.Close />
          </Dialog.Header>

          <Dialog.Body className="space-y-5">
            <ModDetailsContent mod={mod} />
          </Dialog.Body>

          <Dialog.Footer>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="filled"
              left={<LuFolderOpen className="h-4 w-4" />}
              onClick={async () => {
                try {
                  await invoke("reveal_in_explorer", { path: mod.modDir });
                } catch (error) {
                  console.error("Failed to open location:", error);
                }
              }}
            >
              Open Location
            </Button>
          </Dialog.Footer>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ModDetailsContent({ mod }: { mod: InstalledMod }) {
  const { data: thumbnailUrl } = useModThumbnail(mod.id);

  const installedDate = new Date(mod.installedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Thumbnail + basic info */}
      <div className="flex gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-surface-700 to-surface-800">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-surface-500">
              {mod.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm text-surface-400">v{mod.version}</p>
          <div className="flex items-center gap-1.5 text-sm text-surface-400">
            <LuUser className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{mod.authors.join(", ") || "Unknown author"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-surface-400">
            <LuCalendar className="h-3.5 w-3.5 shrink-0" />
            <span>Installed {installedDate}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {mod.description && (
        <div>
          <h4 className="mb-1 text-xs font-medium tracking-wide text-surface-500 uppercase">
            Description
          </h4>
          <p className="text-sm leading-relaxed text-surface-300">{mod.description}</p>
        </div>
      )}

      {/* Layers */}
      {mod.layers.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-surface-500 uppercase">
            <LuLayers className="h-3.5 w-3.5" />
            Layers ({mod.layers.length})
          </h4>
          <div className="space-y-1.5">
            {mod.layers.map((layer) => (
              <div
                key={layer.name}
                className="flex items-center justify-between rounded-md border border-surface-700 bg-surface-800/50 px-3 py-2 text-sm"
              >
                <span className="text-surface-200">{layer.name}</span>
                <div className="flex items-center gap-3 text-xs text-surface-500">
                  <span>Priority {layer.priority}</span>
                  <span className={layer.enabled ? "text-green-400" : "text-surface-500"}>
                    {layer.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File path */}
      <div>
        <h4 className="mb-1 text-xs font-medium tracking-wide text-surface-500 uppercase">
          Location
        </h4>
        <p className="text-xs break-all text-surface-400">{mod.modDir}</p>
      </div>
    </>
  );
}
