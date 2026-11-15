import { describe, expect, it } from 'vitest';
import type { Facility, Level } from '../types';
import { copiedSpaceName, facilitiesForLevel, floorColorStyle, levelSummary } from './model';

const levels: Level[] = [
  {
    id: 'basement',
    badge: 'B',
    name: 'Basement',
    floorNo: -1,
    usage: 'Residential',
    usageTag: 'residential',
    sharedFacilities: [],
    spaces: [],
    commonArea: false,
  },
  {
    id: 'ground',
    badge: 'G',
    name: 'Ground floor',
    floorNo: 0,
    usage: 'Residential',
    usageTag: 'residential',
    sharedFacilities: [],
    spaces: [],
    commonArea: false,
  },
  {
    id: 'first',
    badge: '1',
    name: 'First floor',
    floorNo: 1,
    usage: 'Residential',
    usageTag: 'residential',
    sharedFacilities: [],
    spaces: [],
    commonArea: false,
  },
];

describe('floorColorStyle', () => {
  it('assigns a distinct color to every floor', () => {
    const backgrounds = levels.map((level) => floorColorStyle(levels, level.id).background);

    expect(new Set(backgrounds).size).toBe(levels.length);
  });

});

describe('levelSummary', () => {
  it('summarizes each space kind on the floor instead of inferring one kind for all', () => {
    const level: Level = {
      ...levels[1],
      spaces: [
        ...Array.from({ length: 5 }, (_, index) => ({
          id: `shop-${index}`,
          name: `Shop ${index + 1}`,
          kind: 'Shop' as const,
          features: [],
          rent: null,
        })),
        ...Array.from({ length: 5 }, (_, index) => ({
          id: `room-${index}`,
          name: `Room ${index + 1}`,
          kind: 'Room' as const,
          features: [],
          rent: null,
        })),
      ],
    };

    expect(levelSummary(level)).toBe('5 shops · 5 rooms');
  });
});

describe('copiedSpaceName', () => {
  it('renumbers copied spaces using the destination floor number', () => {
    const room = {
      id: 'room-1',
      name: 'Room 101',
      kind: 'Room' as const,
      features: [],
      rent: null,
    };

    expect(copiedSpaceName(room, { ...levels[2], floorNo: 2 }, 0)).toBe('Room 201');
  });
});

describe('facilitiesForLevel', () => {
  const facilities: Facility[] = [
    {
      id: 'wifi',
      name: 'Wi-Fi',
      quantity: 2,
      scope: 'levels',
      levelIds: ['ground'],
    },
  ];

  it('includes a common facility on each selected floor with its quantity', () => {
    expect(facilitiesForLevel(levels[1], facilities)).toContainEqual({
      id: 'wifi',
      name: 'Wi-Fi',
      quantity: 2,
      scope: 'common',
    });
    expect(facilitiesForLevel(levels[2], facilities)).toEqual([]);
  });

  it('includes a whole-property facility on every floor', () => {
    const wholePropertyFacility: Facility = {
      id: 'security',
      name: 'Security',
      quantity: 1,
      scope: 'property',
      levelIds: [],
    };

    expect(facilitiesForLevel(levels[0], [wholePropertyFacility])).toContainEqual({
      id: 'security',
      name: 'Security',
      quantity: 1,
      scope: 'common',
    });
    expect(facilitiesForLevel(levels[2], [wholePropertyFacility])).toContainEqual({
      id: 'security',
      name: 'Security',
      quantity: 1,
      scope: 'common',
    });
  });

  it('uses the saved quantity for a floor-only facility', () => {
    const level = {
      ...levels[1],
      sharedFacilities: ['Laundry'],
      sharedFacilityCounts: { Laundry: 3 },
    };

    expect(facilitiesForLevel(level, [])).toContainEqual({
      id: 'floor:ground:Laundry',
      name: 'Laundry',
      quantity: 3,
      scope: 'floor',
    });
  });
});
