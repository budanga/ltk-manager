import { CHAMPION_ROLES, getChampionRoles, ROLE_LABELS, ROLE_ORDER } from "@/data/championRoles";
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

/**
 * Canonical display name for each unique champion, built from CHAMPION_ROLES keys.
 * Maps alphanumeric-only lowercase key → title-cased display name.
 * Multi-alias champions (e.g. "bel'veth" / "belveth") resolve to a single display name
 * by preferring the key that contains spaces/apostrophes (more human-readable).
 */
const CANONICAL_CHAMPION_DISPLAY: Map<string, string> = (() => {
  const seen = new Map<string, string>();
  for (const key of Object.keys(CHAMPION_ROLES)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
    const existing = seen.get(normalizedKey);
    // Prefer key with spaces/punctuation (more readable: "aurelion sol" > "aurelionsol")
    if (!existing || key.includes(" ") || key.includes("'")) {
      const display = key
        .split(/[\s]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      seen.set(normalizedKey, display);
    }
  }
  return seen;
})();

/**
 * Try to infer champion names from a mod's displayName when no explicit champion
 * metadata is present. Scans the name for any champion known in CHAMPION_ROLES.
 * Returns an empty array if no match is found.
 */
function inferChampionsFromName(displayName: string): string[] {
  const nameLower = displayName.toLowerCase().replace(/[^a-z\s]/g, " ");
  const found: string[] = [];

  for (const [key, display] of CANONICAL_CHAMPION_DISPLAY) {
    // key is the alphanumeric-only lowercase version; build a regex-friendly version
    const pattern = new RegExp(`(?:^|\\s)${key}(?:\\s|$)`);
    if (pattern.test(nameLower.replace(/[^a-z\s]/g, " "))) {
      found.push(display);
    }
  }

  return found;
}

/** Returns the effective champion list for a mod, falling back to WAD files and then name inference. */
export function getEffectiveChampions(
  mod: InstalledMod,
  wadReport?: import("@/lib/tauri").ModWadReport,
): string[] {
  if (mod.champions.length > 0) return mod.champions;

  // Infer from WAD file names if available
  if (wadReport && wadReport.affectedWads && wadReport.affectedWads.length > 0) {
    const foundFromWads: string[] = [];
    for (const wadPath of wadReport.affectedWads) {
      // WAD paths usually look like "data/characters/vayne/vayne.wad.client"
      // or "vayne.wad.client"
      const match = wadPath.match(/([a-zA-Z]+)\.wad\.client$/i);
      if (match) {
        const champKey = match[1].toLowerCase();
        // Also check if the extracted name is a known champion
        const display = CANONICAL_CHAMPION_DISPLAY.get(champKey);
        if (display && !foundFromWads.includes(display)) {
          foundFromWads.push(display);
        }
      }
    }
    if (foundFromWads.length > 0) return foundFromWads;
  }

  return inferChampionsFromName(mod.displayName);
}

/** Groups mods into one category per champion, sorted alphabetically. */
export function groupByChampion(
  mods: InstalledMod[],
  wadReports?: Record<string, import("@/lib/tauri").ModWadReport>,
): ModGroup[] {
  const map = new Map<string, InstalledMod[]>();

  for (const mod of mods) {
    const report = wadReports ? wadReports[mod.id] : undefined;
    const champions = getEffectiveChampions(mod, report);
    const keys = champions.length > 0 ? champions : ["Other"];
    for (const champion of keys) {
      const key = champion.trim();
      const list = map.get(key) ?? [];
      list.push(mod);
      map.set(key, list);
    }
  }

  // Sort alphabetically but always put "Other" at the end
  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    })
    .map(([label, mods]) => ({ label, mods }));
}

/** Groups mods into the 5 role categories. A mod appears in every role its champion plays.
 *  Mods with no champion assignment are collected into an "Other" group at the end. */
export function groupByRole(
  mods: InstalledMod[],
  wadReports?: Record<string, import("@/lib/tauri").ModWadReport>,
): ModGroup[] {
  const roleMap = new Map<string, InstalledMod[]>(ROLE_ORDER.map((r) => [r, []]));
  const uncategorized: InstalledMod[] = [];

  for (const mod of mods) {
    const report = wadReports ? wadReports[mod.id] : undefined;
    const championNames = getEffectiveChampions(mod, report);
    const rolesForMod = new Set<string>();

    for (const champion of championNames) {
      for (const role of getChampionRoles(champion)) {
        rolesForMod.add(role);
      }
    }

    if (rolesForMod.size === 0) {
      uncategorized.push(mod);
    } else {
      for (const role of rolesForMod) {
        roleMap.get(role)?.push(mod);
      }
    }
  }

  const groups = ROLE_ORDER.filter((role) => (roleMap.get(role)?.length ?? 0) > 0).map((role) => ({
    label: ROLE_LABELS[role],
    mods: roleMap.get(role)!,
  }));

  if (uncategorized.length > 0) {
    groups.push({ label: "Other", mods: uncategorized });
  }

  return groups;
}
