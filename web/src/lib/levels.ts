import type { Level, Space, UsageTag } from '../types';
import { uid } from './format';

export type LevelKind = 'basement' | 'ground' | 'upper' | 'terrace' | 'outdoor' | 'custom';

export const nextFloorNumber = (levels: Level[]): number => {
  const floors = levels
    .map((level) => level.floorNo)
    .filter((value): value is number => value !== null && value >= 0);
  return floors.length ? Math.max(...floors) + 1 : 1;
};

const empty = (): Pick<Level, 'sharedFacilities' | 'spaces' | 'commonArea'> => ({
  sharedFacilities: [],
  spaces: [],
  commonArea: false,
});

export function buildLevels(options: {
  kind: LevelKind;
  count: number;
  usage: string;
  usageTag: UsageTag;
  name?: string;
  nextFloor: number;
}): Level[] {
  const { kind, count, usage, usageTag, name, nextFloor } = options;
  const safeCount = Math.min(24, Math.max(1, count));

  switch (kind) {
    case 'basement':
      return Array.from({ length: safeCount }, (_, index) => ({
        id: uid('lvl'),
        name: safeCount > 1 ? `Basement ${index + 1}` : 'Basement',
        badge: `B${index + 1}`,
        floorNo: -(index + 1),
        usage: usage || 'Parking',
        usageTag: usage ? usageTag : 'parking',
        ...empty(),
      }));
    case 'ground':
      return [
        {
          id: uid('lvl'),
          name: 'Ground floor',
          badge: 'G',
          floorNo: 0,
          usage,
          usageTag,
          ...empty(),
        },
      ];
    case 'upper':
      return Array.from({ length: safeCount }, (_, index) => {
        const floor = nextFloor + index;
        return {
          id: uid('lvl'),
          name: `Floor ${floor}`,
          badge: String(floor),
          floorNo: floor,
          usage,
          usageTag,
          ...empty(),
        };
      });
    case 'terrace':
      return [
        {
          id: uid('lvl'),
          name: 'Terrace',
          badge: 'T',
          floorNo: null,
          usage: 'Common area',
          usageTag: 'common',
          ...empty(),
          commonArea: true,
        },
      ];
    case 'outdoor':
      return [
        {
          id: uid('lvl'),
          name: name?.trim() || 'Outdoor area',
          badge: (name?.trim() || 'O').slice(0, 1).toUpperCase(),
          floorNo: null,
          usage: 'Common area',
          usageTag: 'common',
          ...empty(),
          commonArea: true,
        },
      ];
    default: {
      const label = name?.trim() || 'Custom area';
      return [
        {
          id: uid('lvl'),
          name: label,
          badge: label.slice(0, 1).toUpperCase(),
          floorNo: null,
          usage,
          usageTag,
          ...empty(),
        },
      ];
    }
  }
}

/** Numbers a space inside a floor: Floor 2 -> Room 201, basement -> P 01. */
export function spaceNumber(level: Level, index: number, start: number): number {
  if (level.floorNo !== null && level.floorNo > 0) return level.floorNo * 100 + index + 1;
  return start + index;
}

export function makeSpace(level: Level, name: string, beds?: number): Space {
  return {
    id: uid('sp'),
    name,
    kind: 'Room',
    beds,
    features: [],
    rent: null,
    occupied: false,
  };
}
