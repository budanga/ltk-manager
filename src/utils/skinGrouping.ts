import { Role, ROLE_ORDER, getChampionRoles } from "@/data/championRoles";

export interface Skin {
  id: string;
  name: string;
  champion: string;
  installedAt: number;
  enabled: boolean;
}

export interface SkinGroup {
  id: string;
  label: string;
  skins: Skin[];
}

export function groupSkinsByChampion(skins: Skin[]): SkinGroup[] {
  const grouped = new Map<string, Skin[]>();

  for (const skin of skins) {
    const champion = skin.champion.toLowerCase();
    if (!grouped.has(champion)) {
      grouped.set(champion, []);
    }
    grouped.get(champion)!.push(skin);
  }

  return Array.from(grouped.entries())
    .sort(([champA], [champB]) => champA.localeCompare(champB))
    .map(([champion, championSkins]) => ({
      id: champion,
      label: champion.charAt(0).toUpperCase() + champion.slice(1),
      skins: championSkins,
    }));
}

export function groupSkinsByRole(skins: Skin[]): SkinGroup[] {
  const grouped: Record<Role, Skin[]> = {
    top: [],
    jg: [],
    mid: [],
    adc: [],
    sup: [],
  };

  for (const skin of skins) {
    const roles = getChampionRoles(skin.champion);
    const primaryRole = roles[0] as Role;

    if (primaryRole && grouped[primaryRole]) {
      grouped[primaryRole].push(skin);
    }
  }

  return ROLE_ORDER.map((role) => ({
    id: role,
    label: role.toUpperCase(),
    skins: grouped[role],
  })).filter((group) => group.skins.length > 0);
}
