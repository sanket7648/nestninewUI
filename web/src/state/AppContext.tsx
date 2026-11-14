import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type {
  Charge,
  Draft,
  Facility,
  Level,
  Property,
  PropertyDetails,
  Rent,
  Space,
} from '../types';
import { uid } from '../lib/format';
import { loadStore, saveStore, type Persisted } from '../lib/storage';
import { exampleDraft, seedProperties } from '../lib/sample';
import { buildSpacesForLevel, type GenerateConfig } from '../lib/generate';

export type View =
  | { name: 'list' }
  | { name: 'wizard' }
  | { name: 'property'; propertyId: string };

export const emptyDetails = (): PropertyDetails => ({
  name: '',
  type: '',
  address1: '',
  address2: '',
  country: 'India',
  state: '',
  city: '',
  locality: '',
  pin: '',
  description: '',
  photos: [],
  apartmentType: '',
  bedrooms: '',
  accommodationType: '',
  capacity: '',
  commercialCategory: '',
});

export const emptyDraft = (): Draft => ({
  step: 1,
  details: emptyDetails(),
  levels: [],
  facilities: [],
  charges: [],
});

interface AppApi {
  properties: Property[];
  draft: Draft | null;
  view: View;
  toast: string | null;
  notify: (message: string) => void;
  startNewProperty: () => void;
  resumeDraft: () => void;
  loadExampleDraft: () => void;
  openList: () => void;
  openProperty: (id: string) => void;
  editProperty: (id: string) => void;
  deleteProperty: (id: string) => void;
  setStep: (step: number) => void;
  updateDetails: (patch: Partial<PropertyDetails>) => void;
  addLevels: (levels: Level[]) => void;
  updateLevel: (id: string, patch: Partial<Level>) => void;
  removeLevel: (id: string) => void;
  addSpace: (levelId: string, space: Space) => void;
  updateSpace: (levelId: string, spaceId: string, patch: Partial<Space>) => void;
  removeSpace: (levelId: string, spaceId: string) => void;
  generateSpaces: (levelIds: string[], cfg: GenerateConfig) => number;
  copyConfiguration: (fromLevelId: string, toLevelIds: string[]) => number;
  addFacility: (name: string) => void;
  updateFacility: (id: string, patch: Partial<Facility>) => void;
  removeFacility: (id: string) => void;
  upsertCharge: (charge: Charge) => void;
  removeCharge: (id: string) => void;
  applyRent: (levelIds: string[], values: Partial<Rent>, onlyUnpriced: boolean) => number;
  createProperty: () => string | null;
}

const AppCtx = createContext<AppApi | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [initial] = useState<Persisted>(
    () => loadStore() ?? { properties: seedProperties(), draft: null },
  );
  const [properties, setProperties] = useState<Property[]>(initial.properties);
  const [draft, setDraft] = useState<Draft | null>(initial.draft);
  // An unfinished draft survives a reload, so the wizard resumes instead of orphaning it.
  const [view, setView] = useState<View>(() =>
    initial.draft ? { name: 'wizard' } : { name: 'list' },
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    saveStore({ properties, draft });
  }, [properties, draft]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message: string) => setToast(message), []);

  const patchDraft = useCallback((fn: (current: Draft) => Draft) => {
    setDraft((current) => (current ? fn(current) : current));
  }, []);

  const startNewProperty = useCallback(() => {
    setDraft(emptyDraft());
    setView({ name: 'wizard' });
  }, []);

  const resumeDraft = useCallback(() => setView({ name: 'wizard' }), []);

  const loadExampleDraft = useCallback(() => {
    setDraft((current) => {
      const example = exampleDraft();
      if (!current) return example;
      return {
        ...example,
        step: current.step,
        // Keep anything the owner already typed in step 1.
        details: current.details.name.trim() ? current.details : example.details,
      };
    });
  }, []);

  const openList = useCallback(() => setView({ name: 'list' }), []);
  const openProperty = useCallback((id: string) => setView({ name: 'property', propertyId: id }), []);

  const editProperty = useCallback(
    (id: string) => {
      const property = properties.find((p) => p.id === id);
      if (!property) return;
      setDraft({
        step: 1,
        details: { ...property.details },
        levels: structuredClone(property.levels),
        facilities: structuredClone(property.facilities),
        charges: structuredClone(property.charges),
        editingId: property.id,
      });
      setView({ name: 'wizard' });
    },
    [properties],
  );

  const deleteProperty = useCallback(
    (id: string) => {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setView({ name: 'list' });
      notify('Property deleted');
    },
    [notify],
  );

  const setStep = useCallback((step: number) => patchDraft((d) => ({ ...d, step })), [patchDraft]);

  const updateDetails = useCallback(
    (patch: Partial<PropertyDetails>) =>
      patchDraft((d) => ({ ...d, details: { ...d.details, ...patch } })),
    [patchDraft],
  );

  const addLevels = useCallback(
    (levels: Level[]) => patchDraft((d) => ({ ...d, levels: [...d.levels, ...levels] })),
    [patchDraft],
  );

  const updateLevel = useCallback(
    (id: string, patch: Partial<Level>) =>
      patchDraft((d) => ({
        ...d,
        levels: d.levels.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      })),
    [patchDraft],
  );

  const removeLevel = useCallback(
    (id: string) =>
      patchDraft((d) => ({
        ...d,
        levels: d.levels.filter((l) => l.id !== id),
        facilities: d.facilities.map((f) => ({
          ...f,
          levelIds: f.levelIds.filter((lid) => lid !== id),
        })),
      })),
    [patchDraft],
  );

  const addSpace = useCallback(
    (levelId: string, space: Space) =>
      patchDraft((d) => ({
        ...d,
        levels: d.levels.map((l) =>
          l.id === levelId ? { ...l, spaces: [...l.spaces, space] } : l,
        ),
      })),
    [patchDraft],
  );

  const updateSpace = useCallback(
    (levelId: string, spaceId: string, patch: Partial<Space>) =>
      patchDraft((d) => ({
        ...d,
        levels: d.levels.map((l) =>
          l.id === levelId
            ? {
                ...l,
                spaces: l.spaces.map((s) => (s.id === spaceId ? { ...s, ...patch } : s)),
              }
            : l,
        ),
      })),
    [patchDraft],
  );

  const removeSpace = useCallback(
    (levelId: string, spaceId: string) =>
      patchDraft((d) => ({
        ...d,
        levels: d.levels.map((l) =>
          l.id === levelId ? { ...l, spaces: l.spaces.filter((s) => s.id !== spaceId) } : l,
        ),
      })),
    [patchDraft],
  );

  const generateSpaces = useCallback(
    (levelIds: string[], cfg: GenerateConfig) => {
      let created = 0;
      patchDraft((d) => ({
        ...d,
        levels: d.levels.map((l) => {
          if (!levelIds.includes(l.id)) return l;
          const spaces = buildSpacesForLevel(l, cfg);
          created += spaces.length;
          return { ...l, spaces: [...l.spaces, ...spaces] };
        }),
      }));
      return created;
    },
    [patchDraft],
  );

  const copyConfiguration = useCallback(
    (fromLevelId: string, toLevelIds: string[]) => {
      let copied = 0;
      patchDraft((d) => {
        const source = d.levels.find((l) => l.id === fromLevelId);
        if (!source) return d;
        return {
          ...d,
          levels: d.levels.map((l) => {
            if (!toLevelIds.includes(l.id) || l.id === fromLevelId) return l;
            copied += 1;
            return {
              ...l,
              usage: source.usage,
              usageTag: source.usageTag,
              sharedFacilities: [...source.sharedFacilities],
              sharedFacilityCounts: source.sharedFacilityCounts
                ? { ...source.sharedFacilityCounts }
                : undefined,
              copiedFromName: source.name,
              spaces: source.spaces.map((s) => ({
                ...s,
                id: uid('sp'),
                features: [...s.features],
                featureCounts: s.featureCounts ? { ...s.featureCounts } : undefined,
                rent: s.rent ? { ...s.rent } : null,
                occupied: false,
                tenant: undefined,
              })),
            };
          }),
        };
      });
      return copied;
    },
    [patchDraft],
  );

  const addFacility = useCallback(
    (name: string) =>
      patchDraft((d) =>
        d.facilities.some((f) => f.name === name)
          ? d
          : {
              ...d,
              facilities: [
                ...d.facilities,
                { id: uid('fac'), name, quantity: 1, scope: 'property', levelIds: [] },
              ],
            },
      ),
    [patchDraft],
  );

  const updateFacility = useCallback(
    (id: string, patch: Partial<Facility>) =>
      patchDraft((d) => ({
        ...d,
        facilities: d.facilities.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      })),
    [patchDraft],
  );

  const removeFacility = useCallback(
    (id: string) =>
      patchDraft((d) => ({ ...d, facilities: d.facilities.filter((f) => f.id !== id) })),
    [patchDraft],
  );

  const upsertCharge = useCallback(
    (charge: Charge) =>
      patchDraft((d) => {
        const exists = d.charges.some((c) => c.id === charge.id);
        return {
          ...d,
          charges: exists
            ? d.charges.map((c) => (c.id === charge.id ? charge : c))
            : [...d.charges, charge],
        };
      }),
    [patchDraft],
  );

  const removeCharge = useCallback(
    (id: string) => patchDraft((d) => ({ ...d, charges: d.charges.filter((c) => c.id !== id) })),
    [patchDraft],
  );

  const applyRent = useCallback(
    (levelIds: string[], values: Partial<Rent>, onlyUnpriced: boolean) => {
      let units = 0;
      patchDraft((d) => ({
        ...d,
        levels: d.levels.map((l) => {
          if (!levelIds.includes(l.id)) return l;
          return {
            ...l,
            spaces: l.spaces.map((s) => {
              if (onlyUnpriced && s.rent) return s;
              const amount = values.amount ?? s.rent?.amount ?? 0;
              if (!amount) return s;
              units += s.beds ?? 1;
              return {
                ...s,
                rent: {
                  amount,
                  basis: values.basis ?? s.rent?.basis ?? 'per month',
                  deposit: values.deposit ?? s.rent?.deposit ?? 0,
                  depositType: values.depositType ?? s.rent?.depositType ?? 'Refundable',
                  billing: values.billing ?? s.rent?.billing ?? 'Monthly',
                },
              };
            }),
          };
        }),
      }));
      return units;
    },
    [patchDraft],
  );

  const createProperty = useCallback(() => {
    if (!draft || !draft.details.name.trim() || !draft.details.type) return null;

    if (draft.editingId) {
      const editingId = draft.editingId;
      setProperties((prev) =>
        prev.map((existing) =>
          existing.id === editingId
            ? {
                ...existing,
                details: { ...draft.details },
                levels: draft.levels,
                facilities: draft.facilities,
                charges: draft.charges,
              }
            : existing,
        ),
      );
      setDraft(null);
      return editingId;
    }

    const property: Property = {
      id: uid('prop'),
      details: { ...draft.details },
      levels: draft.levels,
      facilities: draft.facilities,
      charges: draft.charges,
      createdAt: new Date().toISOString(),
    };
    setProperties((prev) => [property, ...prev]);
    setDraft(null);
    return property.id;
  }, [draft]);

  const value = useMemo<AppApi>(
    () => ({
      properties,
      draft,
      view,
      toast,
      notify,
      startNewProperty,
      resumeDraft,
      loadExampleDraft,
      openList,
      openProperty,
      editProperty,
      deleteProperty,
      setStep,
      updateDetails,
      addLevels,
      updateLevel,
      removeLevel,
      addSpace,
      updateSpace,
      removeSpace,
      generateSpaces,
      copyConfiguration,
      addFacility,
      updateFacility,
      removeFacility,
      upsertCharge,
      removeCharge,
      applyRent,
      createProperty,
    }),
    [
      properties,
      draft,
      view,
      toast,
      notify,
      startNewProperty,
      resumeDraft,
      loadExampleDraft,
      openList,
      openProperty,
      editProperty,
      deleteProperty,
      setStep,
      updateDetails,
      addLevels,
      updateLevel,
      removeLevel,
      addSpace,
      updateSpace,
      removeSpace,
      generateSpaces,
      copyConfiguration,
      addFacility,
      updateFacility,
      removeFacility,
      upsertCharge,
      removeCharge,
      applyRent,
      createProperty,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
