import { describe, expect, it } from "vitest";

import type { ContentEntry } from "@/lib/tauri";

import {
  allDirPaths,
  buildContentTree,
  buildDirFileCounts,
  type DirNode,
  type FileNode,
  flattenTree,
} from "../contentTree";

function entry(relativePath: string, sizeBytes = 0): ContentEntry {
  return {
    relativePath,
    sizeBytes: BigInt(sizeBytes),
    kind: "unknown",
  };
}

describe("buildContentTree", () => {
  it("returns an empty array for no entries", () => {
    expect(buildContentTree([])).toEqual([]);
  });

  it("places a single file at the root", () => {
    const tree = buildContentTree([entry("readme.md")]);
    expect(tree).toHaveLength(1);
    expect(tree[0]!.type).toBe("file");
    expect(tree[0]!.name).toBe("readme.md");
  });

  it("nests files under intermediate directories", () => {
    const tree = buildContentTree([entry("assets/textures/skin.dds")]);
    expect(tree).toHaveLength(1);

    const assets = tree[0] as DirNode;
    expect(assets.type).toBe("dir");
    expect(assets.name).toBe("assets");
    expect(assets.path).toBe("assets");

    const textures = assets.children[0] as DirNode;
    expect(textures.type).toBe("dir");
    expect(textures.path).toBe("assets/textures");

    const skin = textures.children[0] as FileNode;
    expect(skin.type).toBe("file");
    expect(skin.name).toBe("skin.dds");
    expect(skin.entry.relativePath).toBe("assets/textures/skin.dds");
  });

  it("merges sibling files into the same directory node", () => {
    const tree = buildContentTree([
      entry("assets/a.bin"),
      entry("assets/b.bin"),
      entry("assets/sub/c.bin"),
    ]);
    expect(tree).toHaveLength(1);
    const assets = tree[0] as DirNode;
    expect(assets.children).toHaveLength(3);
    const names = assets.children.map((c) => c.name);
    expect(names).toEqual(["sub", "a.bin", "b.bin"]);
  });

  it("sorts directories before files within a directory, each group alphabetically", () => {
    const tree = buildContentTree([
      entry("z-file.bin"),
      entry("a-file.bin"),
      entry("m-dir/x.bin"),
      entry("a-dir/x.bin"),
    ]);
    const names = tree.map((c) => c.name);
    expect(names).toEqual(["a-dir", "m-dir", "a-file.bin", "z-file.bin"]);
  });

  it("ignores leading or duplicate slashes defensively", () => {
    const tree = buildContentTree([entry("//odd///path.bin")]);
    const odd = tree[0] as DirNode;
    expect(odd.name).toBe("odd");
    const file = odd.children[0] as FileNode;
    expect(file.name).toBe("path.bin");
  });
});

describe("flattenTree", () => {
  it("returns only top-level rows when nothing is expanded", () => {
    const tree = buildContentTree([entry("a/file.bin"), entry("b/nested/x.bin"), entry("c.bin")]);
    const rows = flattenTree(tree, new Set());
    expect(rows.map((r) => r.node.name)).toEqual(["a", "b", "c.bin"]);
    expect(rows.every((r) => r.depth === 0)).toBe(true);
  });

  it("includes children of expanded directories and carries depth", () => {
    const tree = buildContentTree([entry("a/file.bin"), entry("a/sub/deep.bin")]);
    const expanded = allDirPaths(tree); // fully expanded
    const rows = flattenTree(tree, expanded);
    expect(rows.map((r) => `${r.depth}:${r.node.name}`)).toEqual([
      "0:a",
      "1:sub",
      "2:deep.bin",
      "1:file.bin",
    ]);
  });

  it("stops descending past collapsed directories", () => {
    const tree = buildContentTree([entry("a/sub/deep.bin"), entry("a/top.bin")]);
    // expand only `a`, not `a/sub`
    const rows = flattenTree(tree, new Set(["a"]));
    expect(rows.map((r) => `${r.depth}:${r.node.name}`)).toEqual(["0:a", "1:sub", "1:top.bin"]);
  });
});

describe("allDirPaths", () => {
  it("collects every directory path", () => {
    const tree = buildContentTree([entry("a/x.bin"), entry("b/nested/y.bin"), entry("c.bin")]);
    const paths = allDirPaths(tree);
    expect(paths).toEqual(new Set(["a", "b", "b/nested"]));
  });
});

describe("buildDirFileCounts", () => {
  it("counts files recursively per directory", () => {
    const tree = buildContentTree([
      entry("a/x.bin"),
      entry("a/y.bin"),
      entry("a/sub/z.bin"),
      entry("a/sub/deep/q.bin"),
      entry("b/top.bin"),
    ]);
    const counts = buildDirFileCounts(tree);
    expect(counts.get("a")).toBe(4);
    expect(counts.get("a/sub")).toBe(2);
    expect(counts.get("a/sub/deep")).toBe(1);
    expect(counts.get("b")).toBe(1);
  });

  it("returns an empty map for an empty tree", () => {
    expect(buildDirFileCounts([])).toEqual(new Map());
  });
});
