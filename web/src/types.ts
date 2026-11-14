export type PropertyType =
  | 'Apartment'
  | 'PG / Hostel'
  | 'Villa'
  | 'House'
  | 'Building'
  | 'Mixed use'
  | 'Shopping center'
  | 'Co-working'
  | 'Parking'
  | 'Storage'
  | 'Industrial'
  | 'Land plot';

export const PROPERTY_TYPES: PropertyType[] = [
  'Apartment',
  'PG / Hostel',
  'Villa',
  'House',
  'Building',
  'Mixed use',
  'Shopping center',
  'Co-working',
  'Parking',
  'Storage',
  'Industrial',
  'Land plot',
];

export type SpaceKind =
  | 'Room'
  | 'Kitchen'
  | 'Living room'
  | 'Bathroom'
  | 'Balcony'
  | 'Bedroom'
  | 'Single room'
  | 'Double room'
  | 'Twin room'
  | 'Shared room'
  | 'Dormitory'
  | 'Dining room'
  | 'Utility room'
  | 'Store room'
  | 'Bed'
  | 'Bunk bed'
  | 'Double bed'
  | 'Single bed'
  | 'Lower bunk'
  | 'Upper bunk'
  | 'Shop'
  | 'Studio apartment'
  | 'Parking slot'
  | 'Storage unit'
  | 'Workstation'
  | 'Plot'
  | 'Unit';

export const SPACE_KINDS: SpaceKind[] = [
  'Room',
  'Kitchen',
  'Living room',
  'Bathroom',
  'Balcony',
  'Bedroom',
  'Single room',
  'Double room',
  'Twin room',
  'Shared room',
  'Dormitory',
  'Dining room',
  'Utility room',
  'Store room',
  'Bed',
  'Bunk bed',
  'Double bed',
  'Single bed',
  'Lower bunk',
  'Upper bunk',
  'Shop',
  'Studio apartment',
  'Parking slot',
  'Storage unit',
  'Workstation',
  'Plot',
  'Unit',
];

export type UsageTag =
  | 'pg'
  | 'residential'
  | 'commercial'
  | 'parking'
  | 'coworking'
  | 'storage'
  | 'industrial'
  | 'common';

export const USAGES: { label: string; tag: UsageTag }[] = [
  { label: 'PG / Hostel', tag: 'pg' },
  { label: 'Residential', tag: 'residential' },
  { label: 'Commercial', tag: 'commercial' },
  { label: 'Shopping', tag: 'commercial' },
  { label: 'Office', tag: 'commercial' },
  { label: 'Co-working', tag: 'coworking' },
  { label: 'Parking', tag: 'parking' },
  { label: 'Storage', tag: 'storage' },
  { label: 'Industrial', tag: 'industrial' },
  { label: 'Common area', tag: 'common' },
];

export interface Rent {
  amount: number;
  basis: string;
  deposit: number;
  depositType: string;
  billing: string;
}

export interface Space {
  id: string;
  name: string;
  kind: SpaceKind;
  /** Optional bed-by-bed rental count. Unset means the space is rented as one unit. */
  beds?: number;
  features: string[];
  /** Quantity per selected feature. Missing entries default to one for older saved data. */
  featureCounts?: Record<string, number>;
  rent: Rent | null;
  occupied?: boolean;
  tenant?: string;
}

export interface Level {
  id: string;
  name: string;
  badge: string;
  /** -1 basement, 0 ground, 1..n floors, null for terrace / outdoor areas. */
  floorNo: number | null;
  usage: string;
  usageTag: UsageTag;
  sharedFacilities: string[];
  spaces: Space[];
  commonArea: boolean;
  /** Set when spaces were copied from another floor, used for provenance. */
  copiedFromName?: string;
}

export type ScopeType = 'property' | 'levels';

export interface Facility {
  id: string;
  name: string;
  quantity?: number;
  scope: ScopeType;
  levelIds: string[];
}

export const FACILITY_CATALOGUE = [
  'Lift',
  'Service lift',
  'CCTV',
  'Security',
  'Generator',
  'Water supply',
  'Wi-Fi',
  'Terrace access',
  'Parking access',
];

export const FLOOR_FACILITY_CATALOGUE = [
  'Washing machine',
  'Water purifier',
  'Common bathroom',
  'Shared kitchen',
  'Water cooler',
];

export const SPACE_FEATURE_CATALOGUE = [
  'Bathroom',
  'Kitchen',
  'Balcony',
  'Parking',
  'Garden',
  'Room',
  'Bed',
  'Single bed',
  'Double bed',
  'Queen-size bed',
  'King-size bed',
  'Bunk bed',
  'Loft bed',
  'Trundle bed',
  'Sofa bed',
  'Storage bed',
  'Mattress',
  'Pillow',
  'Bedsheet',
  'Blanket',
  'Bedside table',
  'Wardrobe',
  'Locker',
  'Cupboard',
  'Shelf',
  'Shoe rack',
  'Study desk',
  'Chair',
  'Office chair',
  'Study lamp',
  'Sofa',
  'Armchair',
  'Coffee table',
  'Dining table',
  'Dining chair',
  'Curtains',
  'Window blinds',
  'Mirror',
  'Mosquito mesh',
  'Ceiling fan',
  'Exhaust fan',
  'Air conditioner',
  'Air cooler',
  'Room heater',
  'Geyser',
  'Solar water heater',
  'Attached bathroom',
  'Shared bathroom',
  'Western toilet',
  'Indian toilet',
  'Washbasin',
  'Shower',
  'Bathtub',
  'Hand shower',
  'Grab rail',
  'Kitchenette',
  'Pantry',
  'Kitchen sink',
  'Gas stove',
  'Induction hob',
  'Kitchen chimney',
  'Gas connection',
  'Refrigerator',
  'Freezer',
  'Microwave',
  'Oven',
  'Dishwasher',
  'Water purifier',
  'Drinking-water dispenser',
  'Electric kettle',
  'Cookware',
  'Crockery',
  'Washing machine',
  'Clothes dryer',
  'Clothes drying rack',
  'Iron',
  'Ironing board',
  'Laundry area',
  'Television',
  'Wi-Fi',
  'Ethernet connection',
  'Power socket',
  'USB charging socket',
  'Light fitting',
  'Inverter',
  'Generator',
  'Solar panel',
  'Water tank',
  'Borewell',
  'Rainwater harvesting',
  'Lift',
  'Service lift',
  'Wheelchair ramp',
  'Accessible toilet',
  'Staircase',
  'CCTV camera',
  'Intercom',
  'Smart lock',
  'Door lock',
  'Access-control reader',
  'Security cabin',
  'Fire extinguisher',
  'Smoke alarm',
  'Fire sprinkler',
  'Fire exit',
  'Emergency light',
  'Covered parking',
  'Open parking',
  'Two-wheeler parking',
  'Bicycle rack',
  'EV charger',
  'Boom barrier',
  'Garage',
  'Terrace',
  'Patio',
  'Courtyard',
  'Gym',
  'Swimming pool',
  'Play area',
  'Common lounge',
  'Prayer room',
  'Printer',
  'Whiteboard',
  'Projector',
  'Conference screen',
  'Phone booth',
  'Server rack',
  'Storage rack',
  'Pallet rack',
  'Loading ramp',
  'Dock leveller',
  'Ventilation system',
  'Cold-storage equipment',
  'Three-phase power connection',
  'Boundary fencing',
  'Entrance gate',
  'Access road',
  'Drainage',
  'AC',
  'Furniture',
];

export type ChargeMethod = 'fixed' | 'meter' | 'included' | 'tenant';

export interface Charge {
  id: string;
  name: string;
  method: ChargeMethod;
  amount: number | null;
  unit: string;
  baseCharge: number | null;
  billing: string;
  scope: { type: ScopeType; levelIds: string[] };
}

export interface PropertyDetails {
  name: string;
  type: PropertyType | '';
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  locality: string;
  pin: string;
  description: string;
  photos: string[];
  apartmentType: string;
  bedrooms: string;
  accommodationType: string;
  capacity: string;
  commercialCategory: string;
}

export interface Property {
  id: string;
  details: PropertyDetails;
  levels: Level[];
  facilities: Facility[];
  charges: Charge[];
  createdAt: string;
}

export interface Draft {
  step: number;
  details: PropertyDetails;
  levels: Level[];
  facilities: Facility[];
  charges: Charge[];
  /** Set when the draft came from an existing property, so saving updates it in place. */
  editingId?: string;
}
