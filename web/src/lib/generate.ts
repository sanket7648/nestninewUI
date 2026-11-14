import type { Level, Space, SpaceKind } from '../types';
import { uid } from './format';
import { numberingFor } from './model';

export interface GenerateConfig {
  kind: SpaceKind;
  count: number;
  beds?: number;
  features: string[];
  featureCounts: Record<string, number>;
  prefix: string;
  start: number;
}

export const defaultPrefix: Record<SpaceKind, string> = {
  Room: 'Room',
  Kitchen: 'Kitchen',
  'Living room': 'Living room',
  Bathroom: 'Bathroom',
  Balcony: 'Balcony',
  Bedroom: 'Bedroom',
  'Single room': 'Room',
  'Double room': 'Room',
  'Twin room': 'Room',
  'Shared room': 'Room',
  Dormitory: 'Dormitory',
  'Dining room': 'Dining room',
  'Utility room': 'Utility room',
  'Store room': 'Store room',
  Bed: 'Bed',
  'Bunk bed': 'Bunk',
  'Double bed': 'Bed',
  'Single bed': 'Bed',
  'Lower bunk': 'Bunk',
  'Upper bunk': 'Bunk',
  Shop: 'Shop',
  'Studio apartment': 'Studio',
  'Parking slot': 'P',
  'Storage unit': 'Unit',
  Workstation: 'Desk',
  Plot: 'Plot',
  Unit: 'Unit',
};

export const defaultStart: Record<SpaceKind, number> = {
  Room: 1,
  Kitchen: 1,
  'Living room': 1,
  Bathroom: 1,
  Balcony: 1,
  Bedroom: 1,
  'Single room': 1,
  'Double room': 1,
  'Twin room': 1,
  'Shared room': 1,
  Dormitory: 1,
  'Dining room': 1,
  'Utility room': 1,
  'Store room': 1,
  Bed: 1,
  'Bunk bed': 1,
  'Double bed': 1,
  'Single bed': 1,
  'Lower bunk': 1,
  'Upper bunk': 1,
  Shop: 1,
  'Studio apartment': 1,
  'Parking slot': 1,
  'Storage unit': 1,
  Workstation: 1,
  Plot: 1,
  Unit: 1,
};

export function previewNumbers(level: Level, cfg: GenerateConfig): string[] {
  return numberingFor(level, cfg.prefix, cfg.start, cfg.count);
}

export function buildSpacesForLevel(level: Level, cfg: GenerateConfig): Space[] {
  return numberingFor(level, cfg.prefix, cfg.start, cfg.count).map((name) => ({
    id: uid('sp'),
    name,
    kind: cfg.kind,
    beds: cfg.beds,
    features: [...cfg.features],
    featureCounts: { ...cfg.featureCounts },
    rent: null,
    occupied: false,
  }));
}
