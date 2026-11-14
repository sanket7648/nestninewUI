import { describe, expect, it } from 'vitest';
import type { Facility, Level } from '../types';
import { facilitiesForLevel, floorColorStyle } from './model';

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
      scope: 'property',
    });
    expect(facilitiesForLevel(levels[2], facilities)).toEqual([]);
  });
});
