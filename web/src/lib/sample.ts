import type { Charge, Draft, Facility, Level, Property, Rent, Space, SpaceKind } from '../types';
import { uid } from './format';

const rent = (
  amount: number,
  basis = 'per month',
  deposit = 0,
  depositType = 'Refundable',
): Rent => ({ amount, basis, deposit, depositType, billing: 'Monthly' });

const level = (data: Partial<Level> & Pick<Level, 'name' | 'badge' | 'usage' | 'usageTag'>): Level => ({
  id: uid('lvl'),
  floorNo: null,
  sharedFacilities: [],
  spaces: [],
  commonArea: false,
  ...data,
});

const space = (
  name: string,
  kind: SpaceKind,
  amount: number | null,
  extra: Partial<Space> = {},
): Space => ({
  id: uid('sp'),
  name,
  kind,
  features: [],
  rent: amount === null ? null : rent(amount),
  occupied: false,
  ...extra,
});

const photo = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&q=80`;

export const PHOTO_CHOICES = [
  { url: photo(31977613), label: 'Contemporary building' },
  { url: photo(33827336), label: 'Facade detail' },
  { url: photo(14419157), label: 'Shopfronts' },
  { url: photo(103598), label: 'Basement parking' },
  { url: photo(27459248), label: 'Apartment floors' },
  { url: photo(3839430), label: 'Office block' },
];

/* ------------------------------- seeds ------------------------------- */

function sunriseApartments(): Property {
  const levels: Level[] = [];
  for (let f = 1; f <= 6; f += 1) {
    const spaces: Space[] = Array.from({ length: 4 }, (_, i) => {
      const n = f * 100 + i + 1;
      const amounts = [22000, 24000, 26000, 28000];
      const idx = (f - 1) * 4 + i;
      return space(`Flat ${n}`, 'Unit', amounts[i], {
        features: i % 2 === 0 ? ['Furnished', 'Balcony'] : ['Balcony'],
        occupied: idx < 21,
        tenant: idx < 21 ? ['A. Sharma', 'R. Iyer', 'P. Nair', 'K. Desai'][idx % 4] : undefined,
      });
    });
    levels.push(
      level({ name: `Floor ${f}`, badge: String(f), floorNo: f, usage: 'Residential', usageTag: 'residential', spaces }),
    );
  }

  const facilities: Facility[] = [
    { id: uid('fac'), name: 'Lift', scope: 'property', levelIds: [] },
    { id: uid('fac'), name: 'CCTV', scope: 'property', levelIds: [] },
    { id: uid('fac'), name: 'Security', scope: 'property', levelIds: [] },
  ];

  const charges: Charge[] = [
    {
      id: uid('chg'),
      name: 'Maintenance',
      method: 'fixed',
      amount: 1800,
      unit: '',
      baseCharge: null,
      billing: 'Monthly',
      scope: { type: 'property', levelIds: [] },
    },
    {
      id: uid('chg'),
      name: 'Water',
      method: 'included',
      amount: null,
      unit: '',
      baseCharge: null,
      billing: 'Monthly',
      scope: { type: 'property', levelIds: [] },
    },
  ];

  return {
    id: uid('prop'),
    details: {
      name: 'Sunrise Apartments',
      type: 'Apartment',
      address1: 'Survey 42, Kothrud Road',
      address2: '',
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      locality: 'Kothrud',
      pin: '411038',
      description: 'Six floors of two and three bedroom apartments with covered parking.',
      photos: [photo(27459248)],
      apartmentType: '2BHK, 3BHK',
      bedrooms: '2',
      accommodationType: '',
      capacity: '',
      commercialCategory: '',
    },
    levels,
    facilities,
    charges,
    createdAt: new Date(Date.now() - 86400000 * 42).toISOString(),
  };
}

function greenLeafPg(): Property {
  const levels: Level[] = [];
  for (let f = 1; f <= 4; f += 1) {
    const spaces: Space[] = Array.from({ length: 5 }, (_, i) => {
      const idx = (f - 1) * 5 + i;
      return space(`Room ${f}0${i + 1}`, 'Room', 5500, {
        beds: 2,
        features: ['Attached bathroom', 'Wardrobe'],
        occupied: idx < 18,
        tenant: idx < 18 ? 'Occupied' : undefined,
      });
    });
    levels.push(
      level({
        name: `Floor ${f}`,
        badge: String(f),
        floorNo: f,
        usage: 'PG / Hostel',
        usageTag: 'pg',
        spaces,
        sharedFacilities: ['Water purifier', 'Common bathroom'],
      }),
    );
  }

  return {
    id: uid('prop'),
    details: {
      name: 'Green Leaf PG',
      type: 'PG / Hostel',
      address1: 'Lane 5, Wakad',
      address2: '',
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      locality: 'Wakad',
      pin: '411057',
      description: 'Twin sharing rooms for working professionals.',
      photos: [photo(33827336)],
      apartmentType: '',
      bedrooms: '',
      accommodationType: 'Co-living',
      capacity: '40',
      commercialCategory: '',
    },
    levels,
    facilities: [{ id: uid('fac'), name: 'Wi-Fi', scope: 'property', levelIds: [] }],
    charges: [
      {
        id: uid('chg'),
        name: 'Electricity',
        method: 'meter',
        amount: 9,
        unit: 'kWh',
        baseCharge: 100,
        billing: 'Monthly',
        scope: { type: 'property', levelIds: [] },
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 18).toISOString(),
  };
}

function banerBusinessPark(): Property {
  const levels: Level[] = [];
  for (let f = 1; f <= 3; f += 1) {
    const spaces: Space[] = Array.from({ length: 20 }, (_, i) => {
      const idx = (f - 1) * 20 + i;
      return space(`Desk ${f}${String(i + 1).padStart(2, '0')}`, 'Workstation', 7500, {
        occupied: idx < 44,
        tenant: idx < 44 ? 'Occupied' : undefined,
      });
    });
    levels.push(
      level({
        name: `Floor ${f}`,
        badge: String(f),
        floorNo: f,
        usage: 'Co-working',
        usageTag: 'coworking',
        spaces,
        sharedFacilities: ['Shared kitchen', 'Water cooler'],
      }),
    );
  }

  return {
    id: uid('prop'),
    details: {
      name: 'Baner Business Park',
      type: 'Co-working',
      address1: 'Baner Business Park, Baner',
      address2: '',
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      locality: 'Baner',
      pin: '411045',
      description: 'Three floors of open workstations and meeting cabins.',
      photos: [photo(3839430)],
      apartmentType: '',
      bedrooms: '',
      accommodationType: '',
      capacity: '',
      commercialCategory: 'Office',
    },
    levels,
    facilities: [
      { id: uid('fac'), name: 'Lift', scope: 'property', levelIds: [] },
      { id: uid('fac'), name: 'Wi-Fi', scope: 'property', levelIds: [] },
      { id: uid('fac'), name: 'CCTV', scope: 'property', levelIds: [] },
    ],
    charges: [],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  };
}

export const seedProperties = () => [sunriseApartments(), greenLeafPg(), banerBusinessPark()];

/* --------------------------- example draft --------------------------- */

/** The mixed-use building from the approved designs, so the flow can be tested instantly. */
export function exampleDraft(): Draft {
  const levels: Level[] = [];

  levels.push(
    level({
      name: 'Basement',
      badge: 'B1',
      floorNo: -1,
      usage: 'Parking',
      usageTag: 'parking',
      spaces: Array.from({ length: 50 }, (_, i) =>
        space(`P ${String(i + 1).padStart(2, '0')}`, 'Parking slot', i < 40 ? 2000 : 800, {
          features: [i < 40 ? 'Car' : 'Two-wheeler'],
        }),
      ),
    }),
  );

  levels.push(
    level({
      name: 'Ground floor',
      badge: 'G',
      floorNo: 0,
      usage: 'Shopping',
      usageTag: 'commercial',
      spaces: Array.from({ length: 10 }, (_, i) =>
        space(`Shop ${101 + i}`, 'Shop', i < 4 ? 25000 : 30000),
      ),
    }),
  );

  for (let f = 1; f <= 5; f += 1) {
    const rooms: Space[] = Array.from({ length: 20 }, (_, i) =>
      space(`Room ${f}${String(i + 1).padStart(2, '0')}`, 'Room', f <= 3 ? 6000 : f === 4 ? 7000 : null, {
        beds: 3,
        features: ['Attached bathroom', 'Wardrobe'],
      }),
    );
    levels.push(
      level({
        name: `Floor ${f}`,
        badge: String(f),
        floorNo: f,
        usage: 'PG / Hostel',
        usageTag: 'pg',
        spaces: rooms,
        sharedFacilities: ['Washing machine', 'Water purifier', 'Common bathroom'],
      }),
    );
  }

  for (let f = 6; f <= 10; f += 1) {
    const studios: Space[] = Array.from({ length: 5 }, (_, i) =>
      space(`Studio ${f}0${i + 1}`, 'Studio apartment', f === 10 && i < 3 ? 16500 : 15000, {
        features: ['AC', 'Attached bathroom', 'Balcony'],
      }),
    );
    levels.push(
      level({ name: `Floor ${f}`, badge: String(f), floorNo: f, usage: 'Residential', usageTag: 'residential', spaces: studios }),
    );
  }

  levels.push(
    level({
      name: 'Terrace',
      badge: 'T',
      usage: 'Common area',
      usageTag: 'common',
      commonArea: true,
      sharedFacilities: [],
    }),
  );

  const pgIds = levels.filter((l) => l.usageTag === 'pg').map((l) => l.id);
  const shopIds = levels.filter((l) => l.usageTag === 'commercial').map((l) => l.id);

  const facilities: Facility[] = [
    'Lift',
    'Service lift',
    'CCTV',
    'Security',
    'Generator',
    'Water supply',
    'Wi-Fi',
  ].map((name) => ({ id: uid('fac'), name, scope: 'property', levelIds: [] }));

  const charges: Charge[] = [
    {
      id: uid('chg'),
      name: 'Electricity',
      method: 'meter',
      amount: 8,
      unit: 'kWh',
      baseCharge: 100,
      billing: 'Monthly',
      scope: { type: 'levels', levelIds: pgIds },
    },
    {
      id: uid('chg'),
      name: 'Water',
      method: 'included',
      amount: null,
      unit: '',
      baseCharge: null,
      billing: 'Monthly',
      scope: { type: 'property', levelIds: [] },
    },
    {
      id: uid('chg'),
      name: 'Maintenance',
      method: 'fixed',
      amount: 500,
      unit: '',
      baseCharge: null,
      billing: 'Monthly',
      scope: { type: 'property', levelIds: [] },
    },
    {
      id: uid('chg'),
      name: 'Internet',
      method: 'fixed',
      amount: 300,
      unit: '',
      baseCharge: null,
      billing: 'Monthly',
      scope: { type: 'levels', levelIds: pgIds },
    },
    {
      id: uid('chg'),
      name: 'Gas',
      method: 'fixed',
      amount: 200,
      unit: '',
      baseCharge: null,
      billing: 'Monthly',
      scope: { type: 'levels', levelIds: pgIds },
    },
    {
      id: uid('chg'),
      name: 'Housekeeping',
      method: 'tenant',
      amount: null,
      unit: '',
      baseCharge: null,
      billing: 'Monthly',
      scope: { type: 'levels', levelIds: shopIds },
    },
  ];

  return {
    step: 2,
    details: {
      name: 'Sai Heights',
      type: 'Mixed use',
      address1: 'Plot 14, Baner Road',
      address2: 'Near Baner Gaon bus stop',
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      locality: 'Baner',
      pin: '411045',
      description:
        'Ten-floor building with basement parking, ten shops on the ground floor, five PG floors and five floors of studio apartments.',
      photos: [photo(31977613), photo(33827336)],
      apartmentType: '',
      bedrooms: '',
      accommodationType: '',
      capacity: '',
      commercialCategory: '',
    },
    levels,
    facilities,
    charges,
  };
}
