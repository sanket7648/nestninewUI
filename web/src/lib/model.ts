import type { Facility, Level, Space, UsageTag } from '../types';
import { inr, plural } from './format';

/** A space with an optional bed count contributes beds; every other space counts once. */
export const spaceUnits = (space: Space) => space.beds ?? 1;

export const levelUnits = (level: Level) => level.spaces.reduce((n, s) => n + (s.beds ?? 1), 0);

export const levelPricedUnits = (level: Level) =>
  level.spaces.reduce((n, s) => (s.rent ? n + (s.beds ?? 1) : n), 0);

export const levelOccupied = (level: Level) =>
  level.spaces.reduce((n, s) => (s.occupied ? n + (s.beds ?? 1) : n), 0);

export const totalUnits = (levels: Level[]) => levels.reduce((n, l) => n + levelUnits(l), 0);
export const totalPriced = (levels: Level[]) => levels.reduce((n, l) => n + pricedUnits(l), 0);
export const totalOccupied = (levels: Level[]) =>
  levels.reduce((n, l) => n + levelOccupied(l), 0);

export function floorColorStyle(levels: Level[], levelId: string) {
  const index = Math.max(0, levels.findIndex((level) => level.id === levelId));
  const hue = (index * 360) / Math.max(1, levels.length);
  return {
    background: `hsl(${hue} 70% 94%)`,
    borderColor: `hsl(${hue} 45% 82%)`,
    color: `hsl(${hue} 55% 30%)`,
  };
}

export function facilitiesForLevel(level: Level, facilities: Facility[]) {
  const scopedFacilities = facilities.filter(
    (facility) => facility.scope === 'levels' && facility.levelIds.includes(level.id),
  );
  const scopedNames = new Set(scopedFacilities.map((facility) => facility.name.toLowerCase()));
  const floorFacilities = [...new Set(level.sharedFacilities)]
    .filter((name) => !scopedNames.has(name.toLowerCase()))
    .map((name) => ({
      id: `floor:${level.id}:${name}`,
      name,
      quantity: 1,
      scope: 'floor' as const,
    }));

  return [
    ...scopedFacilities.map((facility) => ({
      id: facility.id,
      name: facility.name,
      quantity: facility.quantity ?? 1,
      scope: 'property' as const,
    })),
    ...floorFacilities,
  ];
}

export const pricedUnits = levelPricedUnits;

export function levelSummary(level: Level): string {
  const n = level.spaces.length;
  if (n === 0) return level.commonArea ? 'Common area' : 'No spaces yet';
  const units = levelUnits(level);
  const beds = level.spaces.reduce((total, space) => total + (space.beds ?? 0), 0);
  switch (level.spaces[0].kind) {
    case 'Room':
      return beds > 0
        ? `${plural(n, 'room')}, ${plural(beds, 'bed')}`
        : plural(n, 'room');
    case 'Shop':
      return plural(units, 'shop');
    case 'Studio apartment':
      return plural(units, 'studio');
    case 'Parking slot':
      return plural(units, 'slot');
    case 'Workstation':
      return plural(units, 'seat');
    case 'Storage unit':
      return plural(units, 'unit');
    case 'Plot':
      return plural(units, 'plot');
    default:
      return plural(n, level.spaces[0].kind.toLowerCase());
  }
}

export interface LevelGroup {
  id: string;
  levels: Level[];
  isRange: boolean;
  badge: string;
  title: string;
  usage: string;
  usageTag: UsageTag;
  commonArea: boolean;
}

const sameShape = (a: Level, b: Level) =>
  a.usage === b.usage &&
  a.usageTag === b.usageTag &&
  a.commonArea === b.commonArea &&
  a.spaces.length === b.spaces.length &&
  (a.spaces[0]?.kind ?? '') === (b.spaces[0]?.kind ?? '') &&
  (a.spaces[0]?.beds ?? 0) === (b.spaces[0]?.beds ?? 0);

/**
 * Floors are stored individually. The level list collapses consecutive floors
 * that share the same configuration into a display range only.
 */
export function groupLevels(levels: Level[]): LevelGroup[] {
  const ordered = [...levels].sort((a, b) => (a.floorNo ?? 99) - (b.floorNo ?? 99));
  const groups: LevelGroup[] = [];

  for (const level of ordered) {
    const last = groups[groups.length - 1];
    const lastLevel = last?.levels[last.levels.length - 1];
    const consecutive =
      lastLevel &&
      lastLevel.floorNo !== null &&
      level.floorNo !== null &&
      level.floorNo === lastLevel.floorNo + 1;

    if (last && consecutive && sameShape(lastLevel!, level)) {
      last.levels.push(level);
      last.isRange = true;
      last.badge = `${last.levels[0].floorNo}–${level.floorNo}`;
      last.title = `Floors ${last.levels[0].floorNo}–${level.floorNo}`;
      continue;
    }

    groups.push({
      id: level.id,
      levels: [level],
      isRange: false,
      badge: level.badge,
      title: level.name,
      usage: level.usage,
      usageTag: level.usageTag,
      commonArea: level.commonArea,
    });
  }

  return groups;
}

export function groupUnits(group: LevelGroup) {
  return group.levels.reduce((n, l) => n + levelUnits(l), 0);
}

export function groupPriced(group: LevelGroup) {
  return group.levels.reduce((n, l) => n + levelPricedUnits(l), 0);
}

export function groupOccupied(group: LevelGroup) {
  return group.levels.reduce((n, l) => n + levelOccupied(l), 0);
}

export interface PriceBand {
  min: number;
  max: number;
  count: number;
}

export function groupSummary(group: LevelGroup): string {
  const first = group.levels[0];
  if (!first) return 'No spaces yet';
  if (!first.spaces.length) return first.commonArea ? 'Common area' : 'No spaces yet';
  const rooms = group.levels.reduce((n, l) => n + l.spaces.length, 0);
  const units = groupUnits(group);
  const beds = group.levels.reduce(
    (total, level) => total + level.spaces.reduce((sum, space) => sum + (space.beds ?? 0), 0),
    0,
  );
  switch (first.spaces[0].kind) {
    case 'Room':
      return beds > 0
        ? `${plural(rooms, 'room')}, ${plural(beds, 'bed')}`
        : plural(rooms, 'room');
    case 'Shop':
      return plural(units, 'shop');
    case 'Studio apartment':
      return plural(units, 'studio');
    case 'Parking slot':
      return plural(units, 'slot');
    case 'Workstation':
      return plural(units, 'seat');
    case 'Storage unit':
      return plural(units, 'unit');
    case 'Plot':
      return plural(units, 'plot');
    default:
      return plural(rooms, first.spaces[0].kind.toLowerCase());
  }
}

export function priceBand(group: LevelGroup): PriceBand | null {
  const amounts = group.levels.flatMap((l) =>
    l.spaces.filter((s) => s.rent).map((s) => s.rent!.amount),
  );
  if (!amounts.length) return null;
  const unique = Array.from(new Set(amounts));
  return { min: Math.min(...unique), max: Math.max(...unique), count: unique.length };
}

export function priceBandLabel(band: PriceBand | null): string {
  if (!band) return 'Not set';
  return band.min === band.max
    ? inr(band.min)
    : `${inr(band.min)} – ${inr(band.max)}`;
}

export function chargeSummary(charge: {
  method: string;
  amount: number | null;
  unit: string;
  billing: string;
}): string {
  switch (charge.method) {
    case 'included':
      return 'Included';
    case 'tenant':
      return 'Tenant pays';
    case 'meter':
      return charge.amount ? `${inr(charge.amount)} / ${charge.unit || 'unit'}` : 'By meter';
    default:
      return charge.amount ? `${inr(charge.amount)} / month` : 'Fixed monthly';
  }
}

export function chargeMethodLabel(method: string): string {
  switch (method) {
    case 'meter':
      return 'By meter';
    case 'included':
      return 'Included in rent';
    case 'tenant':
      return 'Tenant pays directly';
    default:
      return 'Fixed monthly';
  }
}

/** Deterministic numbering used by bulk generation, e.g. Floor 2 -> Room 201. */
export function numberingFor(level: Level, prefix: string, start: number, count: number): string[] {
  const floorBase = level.floorNo !== null && level.floorNo > 0 ? level.floorNo * 100 : null;
  return Array.from({ length: count }, (_, i) => {
    const n = floorBase ? floorBase + i + 1 : start + i;
    const label = floorBase ? String(n) : String(n).padStart(2, '0');
    return prefix ? `${prefix} ${label}` : label;
  });
}

export { inr, plural };
