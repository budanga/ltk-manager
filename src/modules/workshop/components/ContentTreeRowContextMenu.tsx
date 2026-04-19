import { Copy, FolderInput, FolderOpen } from "lucide-react";

import { ContextMenu, useToast } from "@/components";
import { api } from "@/lib/tauri";

import type { ContentTreeNode } from "../utils/contentTree";

interface ContentTreeRowContextMenuProps {
  node: ContentTreeNode;
  projectPath: string;
  layerName: string;
  children: React.ReactNode;
}

export function ContentTreeRowContextMenu({
  node,
  projectPath,
  layerName,
  children,
}: ContentTreeRowContextMenuProps) {
  const toast = useToast();

  const relativePath = node.type === "dir" ? node.path : node.entry.relativePath;
  const absolutePath = `${projectPath}/content/${layerName}/${relativePath}`;

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.toast({ title: `Copied ${label}`, type: "success", timeout: 1500 });
    } catch {
      toast.toast({
        title: `Couldn't copy ${label} to clipboard`,
        type: "error",
        timeout: 2500,
      });
    }
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup className="w-52">
            <ContextMenu.Item
              icon={<Copy className="h-4 w-4" />}
              onClick={() => copy(node.name, "name")}
            >
              Copy Name
            </ContextMenu.Item>
            <ContextMenu.Item
              icon={<FolderInput className="h-4 w-4" />}
              onClick={() => copy(relativePath, "path")}
            >
              Copy Relative Path
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item
              icon={<FolderOpen className="h-4 w-4" />}
              onClick={() => {
                void api.revealInExplorer(absolutePath);
              }}
            >
              Reveal in Explorer
            </ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
