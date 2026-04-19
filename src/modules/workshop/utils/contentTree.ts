import type { ContentEntry } from "@/lib/tauri";

export type ContentTreeNode = DirNode | FileNode;

export interface DirNode {
  readonly type: "dir";
  readonly name: string;
  /** Path relative to the layer root, POSIX-style, no trailing slash. */
  readonly path: string;
  readonly children: ContentTreeNode[];
}

export interface FileNode {
  readonly type: "file";
  readonly name: string;
  readonly entry: ContentEntry;
}

/**
 * Group a layer's flat file entries into a nested directory/file tree.
 *
 * Entries keep the order they were given within each directory — the backend
 * already sorts by relative path, so the tree inherits that ordering. Within a
 * single directory, children are then sorted directories-first, each group
 * alphabetically, to match typical file-tree expectations.
 */
export function buildContentTree(entries: readonly ContentEntry[]): ContentTreeNode[] {
  const root: DirNode = { type: "dir", name: "", path: "", children: [] };

  for (const entry of entries) {
    const segments = entry.relativePath.split("/").filter((s) => s.length > 0);
    if (segments.length === 0) continue;

    let cursor: DirNode = root;
    for (let i = 0; i < segments.length - 1; i += 1) {
      const segment = segments[i]!;
      const childPath = cursor.path ? `${cursor.path}/${segment}` : segment;

      let next = cursor.children.find((c): c is DirNode => c.type === "dir" && c.name === segment);
      if (!next) {
        next = { type: "dir", name: segment, path: childPath, children: [] };
        (cursor.children as ContentTreeNode[]).push(next);
      }
      cursor = next;
    }

    const fileName = segments[segments.length - 1]!;
    (cursor.children as ContentTreeNode[]).push({
      type: "file",
      name: fileName,
      entry,
    });
  }

  sortRecursive(root);
  return root.children;
}

function sortRecursive(dir: DirNode): void {
  (dir.children as ContentTreeNode[]).sort(compareNodes);
  for (const child of dir.children) {
    if (child.type === "dir") sortRecursive(child);
  }
}

function compareNodes(a: ContentTreeNode, b: ContentTreeNode): number {
  if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
  return a.name.localeCompare(b.name);
}

export interface FlatTreeRow {
  readonly node: ContentTreeNode;
  readonly depth: number;
}

/**
 * Walk a tree and produce the linear list of rows that should currently be
 * rendered, respecting expand/collapse state. A directory is always included;
 * its children are only included when its path is in `expanded`.
 *
 * Feeds `@tanstack/react-virtual` so we only render what's visible regardless
 * of how many files the project contains.
 */
export function flattenTree(
  tree: readonly ContentTreeNode[],
  expanded: ReadonlySet<string>,
): FlatTreeRow[] {
  const out: FlatTreeRow[] = [];
  const walk = (nodes: readonly ContentTreeNode[], depth: number): void => {
    for (const node of nodes) {
      out.push({ node, depth });
      if (node.type === "dir" && expanded.has(node.path)) {
        walk(node.children, depth + 1);
      }
    }
  };
  walk(tree, 0);
  return out;
}

/**
 * Collect the paths of every directory node in a tree — useful for seeding
 * the expanded-set so the tree renders fully expanded by default.
 */
export function allDirPaths(tree: readonly ContentTreeNode[]): Set<string> {
  const set = new Set<string>();
  const walk = (nodes: readonly ContentTreeNode[]): void => {
    for (const node of nodes) {
      if (node.type === "dir") {
        set.add(node.path);
        walk(node.children);
      }
    }
  };
  walk(tree);
  return set;
}

/**
 * Precompute the recursive file count for every directory. Rendered rows read
 * this in O(1) instead of re-walking the subtree on every paint.
 */
export function buildDirFileCounts(tree: readonly ContentTreeNode[]): Map<string, number> {
  const counts = new Map<string, number>();
  const walk = (nodes: readonly ContentTreeNode[]): number => {
    let total = 0;
    for (const node of nodes) {
      if (node.type === "file") {
        total += 1;
      } else {
        const subCount = walk(node.children);
        counts.set(node.path, subCount);
        total += subCount;
      }
    }
    return total;
  };
  walk(tree);
  return counts;
}
