import { getChampionRoles, ROLE_LABELS, ROLE_ORDER } from "@/championRoles";
import type { InstalledMod, LibraryFolder } from "@/lib/tauri";
import type { SortConfig } from "@/stores/libraryFilter";

export interface ModGroup {
  label: string;
  mods: InstalledMod[];
}

export function sortMods(mods: InstalledMod[], sort: SortConfig): InstalledMod[] {
  if (sort.field === "priority") return mods;

  const sorted = [...mods];
  const dir = sort.direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    switch (sort.field) {
      case "name":
        return dir * a.displayName.localeCompare(b.displayName);
      case "installedAt":
        return dir * (new Date(a.installedAt).getTime() - new Date(b.installedAt).getTime());
      case "enabled":
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return a.displayName.localeCompare(b.displayName);
      default:
        return 0;
    }
  });

  return sorted;
}

export function sortFolders(folders: LibraryFolder[], sort: SortConfig): LibraryFolder[] {
  if (sort.field !== "name") return folders;

  const dir = sort.direction === "asc" ? 1 : -1;
  return [...folders].sort((a, b) => dir * a.name.localeCompare(b.name));
}

export function sortModsByFolder(
  modsByFolder: Map<string, InstalledMod[]>,
  sort: SortConfig,
): Map<string, InstalledMod[]> {
  if (sort.field === "priority") return modsByFolder;

  const sorted = new Map<string, InstalledMod[]>();
  for (const [fid, mods] of modsByFolder) {
    sorted.set(fid, sortMods(mods, sort));
  }
  return sorted;
}

/** Groups mods into one category per champion, sorted alphabetically. */
export function groupByChampion(mods: InstalledMod[]): ModGroup[] {
  const map = new Map<string, InstalledMod[]>();

  for (const mod of mods) {
    const champions = mod.champions.length > 0 ? mod.champions : ["Unknown"];
    for (const champion of champions) {
      const key = champion.trim();
      const list = map.get(key) ?? [];
      list.push(mod);
      map.set(key, list);
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, mods]) => ({ label, mods }));
}

/** Groups mods into the 5 role categories. A mod appears in every role its champion plays. */
export function groupByRole(mods: InstalledMod[]): ModGroup[] {
  const roleMap = new Map<string, InstalledMod[]>(ROLE_ORDER.map((r) => [r, []]));

  for (const mod of mods) {
    const championNames = mod.champions.length > 0 ? mod.champions : [];
    const rolesForMod = new Set<string>();

    for (const champion of championNames) {
      for (const role of getChampionRoles(champion)) {
        rolesForMod.add(role);
      }
    }

    for (const role of rolesForMod) {
      roleMap.get(role)?.push(mod);
    }
  }

  return ROLE_ORDER.filter((role) => (roleMap.get(role)?.length ?? 0) > 0).map((role) => ({
    label: ROLE_LABELS[role],
    mods: roleMap.get(role)!,
  }));
}
