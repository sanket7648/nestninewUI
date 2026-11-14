import { useState } from 'react';
import {
  Building2,
  Check,
  ChevronRight,
  Copy,
  Grid2x2,
  Layers,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import {
  Chips,
  EmptyState,
  Field,
  Pager,
  PreviewRow,
  SelectField,
  StatGrid,
  TextField,
} from '../../components/primitives';
import { Sheet } from '../../components/Sheet';
import {
  FACILITY_CATALOGUE,
  FLOOR_FACILITY_CATALOGUE,
  SPACE_FEATURE_CATALOGUE,
  SPACE_KINDS,
  USAGES,
  type Facility,
  type Level,
  type Space,
  type SpaceKind,
  type UsageTag,
} from '../../types';
import { facilitiesForLevel, floorColorStyle, levelSummary, totalUnits } from '../../lib/model';
import { inr, plural } from '../../lib/format';
import { buildLevels, nextFloorNumber, type LevelKind } from '../../lib/levels';
import {
  defaultPrefix,
  defaultStart,
  previewNumbers,
  type GenerateConfig,
} from '../../lib/generate';

const tagFor = (usage: string): UsageTag =>
  USAGES.find((item) => item.label === usage)?.tag ?? 'residential';

const guessKind = (level: Level): SpaceKind => {
  switch (level.usageTag) {
    case 'pg':
      return 'Room';
    case 'parking':
      return 'Parking slot';
    case 'commercial':
      return 'Shop';
    case 'coworking':
      return 'Workstation';
    case 'storage':
      return 'Storage unit';
    default:
      return 'Studio apartment';
  }
};

const BED_RENTAL_KINDS: SpaceKind[] = [
  'Room',
  'Bedroom',
  'Single room',
  'Double room',
  'Twin room',
  'Shared room',
  'Dormitory',
];

const supportsBedRental = (kind: SpaceKind) => BED_RENTAL_KINDS.includes(kind);

const normalizeFeatureCounts = (features: string[], counts: Record<string, number>) =>
  Object.fromEntries(
    features.map((feature) => [feature, Math.max(1, Math.floor(counts[feature] || 1))]),
  );

/* ------------------------------ overview ----------------------------- */

export default function StepStructure({
  onOpenFloor,
  onOpenRange,
  onOpenFacilities,
}: {
  onOpenFloor: (levelId: string) => void;
  onOpenRange: (levelIds: string[]) => void;
  onOpenFacilities: () => void;
}) {
  const { draft, addLevels, updateLevel, removeLevel, notify, loadExampleDraft } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [renamingLevelId, setRenamingLevelId] = useState<string | null>(null);
  const [levelName, setLevelName] = useState('');
  const [selectingLevels, setSelectingLevels] = useState(false);
  const [selectedLevelIds, setSelectedLevelIds] = useState<string[]>([]);

  if (!draft) return null;

  const units = totalUnits(draft.levels);
  const toggleLevelSelection = (levelId: string) =>
    setSelectedLevelIds((current) =>
      current.includes(levelId)
        ? current.filter((id) => id !== levelId)
        : [...current, levelId],
    );

  const deleteSelectedLevels = () => {
    if (!selectedLevelIds.length) return;
    if (!window.confirm(`Remove ${plural(selectedLevelIds.length, 'floor')} and their spaces?`)) {
      return;
    }
    selectedLevelIds.forEach(removeLevel);
    notify(`${plural(selectedLevelIds.length, 'floor')} removed`);
    setSelectedLevelIds([]);
    setSelectingLevels(false);
  };

  return (
    <>
      <div className="page" style={{ paddingTop: 16 }}>
        <div className="card" style={{ padding: 13, marginBottom: 14 }}>
          <div className="h3" style={{ fontSize: 16 }}>
            {draft.details.name || 'Property'}
          </div>
          <div className="row-sub" style={{ marginTop: 6 }}>
            {draft.details.type || 'Type not set'}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
            <span className="num" style={{ fontSize: 12, fontWeight: 700 }}>
              {draft.levels.length}
              <span className="muted" style={{ marginLeft: 4 }}>
                levels
              </span>
            </span>
            <span className="num" style={{ fontSize: 12, fontWeight: 700 }}>
              {units}
              <span className="muted" style={{ marginLeft: 4 }}>
                rental spaces
              </span>
            </span>
          </div>
        </div>

        <button
          type="button"
          className="row"
          style={{ padding: '11px 0' }}
          onClick={onOpenFacilities}
        >
          <span className="row-badge" style={{ color: 'var(--teal)' }}>
            <Building2 size={17} aria-hidden />
          </span>
          <span className="row-main">
            <span className="row-title" style={{ display: 'block' }}>
              Common facilities
            </span>
            <span className="row-sub" style={{ display: 'block' }}>
              {draft.facilities.length
                ? `${draft.facilities.length} configured for the property`
                : 'Lift, security, water supply'}
            </span>
          </span>
          <ChevronRight size={15} className="row-chevron" aria-hidden />
        </button>

        <div className="sec-head" style={{ marginTop: 14 }}>
          <span>Structure</span>
          {selectingLevels ? (
            <div className="row-inline">
              <button
                type="button"
                className="btn-text"
                onClick={() => {
                  setSelectingLevels(false);
                  setSelectedLevelIds([]);
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <div className="row-inline">
              {draft.levels.length > 1 && (
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => onOpenRange(draft.levels.map((level) => level.id))}
                >
                  Copy configuration
                </button>
              )}
              {draft.levels.length > 0 && (
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => {
                    setSelectedLevelIds([]);
                    setSelectingLevels(true);
                  }}
                >
                  Select
                </button>
              )}
              <button
                type="button"
                className="btn-text"
                onClick={() => setAddOpen(true)}
              >
                Add level
              </button>
            </div>
          )}
        </div>

        {selectingLevels && (
          <div className="bulk-selection-bar">
            <span className="muted">{plural(selectedLevelIds.length, 'floor')} selected</span>
            <button
              type="button"
              className="btn-danger-text"
              disabled={!selectedLevelIds.length}
              onClick={deleteSelectedLevels}
            >
              Delete selected
            </button>
          </div>
        )}

        {draft.levels.length === 0 ? (
          <EmptyState
            icon={<Layers size={22} aria-hidden />}
            title="No levels yet"
            description="Add a basement, floor, terrace or any other area. Each floor stays separate and can be edited on its own."
            action={
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}>
                  <Plus size={15} aria-hidden />
                  Add level
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    loadExampleDraft();
                    notify('Example building loaded');
                  }}
                >
                  Load example
                </button>
              </div>
            }
          />
        ) : (
          <div className="list">
            {draft.levels.map((level) => (
              <div className="row floor-row" key={level.id}>
                {renamingLevelId === level.id ? (
                  <>
                    <span className="row-badge" style={floorColorStyle(draft.levels, level.id)}>
                      {level.badge}
                    </span>
                    <span className="row-main floor-rename">
                      <input
                        className="input"
                        aria-label="Floor name"
                        value={levelName}
                        autoFocus
                        onChange={(event) => setLevelName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && levelName.trim()) {
                            updateLevel(level.id, { name: levelName.trim() });
                            setRenamingLevelId(null);
                            notify('Floor renamed');
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-text"
                        onClick={() => {
                          if (!levelName.trim()) return;
                          updateLevel(level.id, { name: levelName.trim() });
                          setRenamingLevelId(null);
                          notify('Floor renamed');
                        }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-text"
                        onClick={() => setRenamingLevelId(null)}
                      >
                        Cancel
                      </button>
                    </span>
                    <button
                      type="button"
                      className="icon-action is-danger"
                      aria-label={`Remove ${level.name}`}
                      title="Remove floor"
                      onClick={() => {
                        if (!window.confirm(`Remove ${level.name} and its spaces?`)) return;
                        removeLevel(level.id);
                        setRenamingLevelId(null);
                        notify('Floor removed');
                      }}
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="floor-row-main"
                      aria-label={`Open ${level.name}`}
                      aria-pressed={selectingLevels ? selectedLevelIds.includes(level.id) : undefined}
                      onClick={() =>
                        selectingLevels ? toggleLevelSelection(level.id) : onOpenFloor(level.id)
                      }
                    >
                      {selectingLevels && (
                        <span
                          className={`cb ${selectedLevelIds.includes(level.id) ? 'is-on' : ''}`}
                          aria-hidden
                        >
                          {selectedLevelIds.includes(level.id) && <Check size={12} />}
                        </span>
                      )}
                      <span className="row-badge" style={floorColorStyle(draft.levels, level.id)}>
                        {level.badge}
                      </span>
                      <span className="row-main">
                        <span className="row-title" style={{ display: 'block' }}>
                          {level.name}
                        </span>
                        <span className="row-sub" style={{ display: 'block' }}>
                          {level.usage} · {levelSummary(level)}
                        </span>
                      </span>
                      <ChevronRight size={15} className="row-chevron" aria-hidden />
                    </button>
                    {!selectingLevels && <div className="icon-actions">
                      <button
                        type="button"
                        className="icon-action"
                        aria-label={`Rename ${level.name}`}
                        title="Rename floor"
                        onClick={() => {
                          setRenamingLevelId(level.id);
                          setLevelName(level.name);
                        }}
                      >
                        <Pencil size={15} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="icon-action is-danger"
                        aria-label={`Remove ${level.name}`}
                        title="Remove floor"
                        onClick={() => {
                          if (!window.confirm(`Remove ${level.name} and its spaces?`)) return;
                          removeLevel(level.id);
                          notify('Floor removed');
                        }}
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </div>}
                  </>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              style={{
                width: 'calc(100% + 24px)',
                margin: '0 -12px',
                height: 46,
                border: 0,
                borderTop: '1px solid var(--hair)',
                background: '#f8fcfa',
                color: 'var(--teal)',
                fontSize: 12.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
              }}
            >
              <Plus size={14} aria-hidden />
              Add level or area
            </button>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      {addOpen && <AddLevelSheet onClose={() => setAddOpen(false)} onAdd={addLevels} />}
    </>
  );
}

/* ----------------------------- add levels ---------------------------- */

function AddLevelSheet({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (levels: Level[]) => void;
}) {
  const { draft } = useApp();
  const [kind, setKind] = useState<LevelKind>('upper');
  const [count, setCount] = useState('5');
  const [usage, setUsage] = useState('PG / Hostel');
  const [name, setName] = useState('');

  if (!draft) return null;

  const nextFloor = nextFloorNumber(draft.levels);
  const options: { value: LevelKind; label: string }[] = [
    { value: 'basement', label: 'Basement' },
    { value: 'ground', label: 'Ground floor' },
    { value: 'upper', label: 'Upper floors' },
    { value: 'terrace', label: 'Terrace' },
    { value: 'outdoor', label: 'Outdoor area' },
    { value: 'custom', label: 'Custom level' },
  ];

  const submit = () => {
    onAdd(
      buildLevels({
        kind,
        count: Number(count) || 1,
        usage,
        usageTag: tagFor(usage),
        name,
        nextFloor,
      }),
    );
    onClose();
  };

  return (
    <Sheet
      title="Add level or area"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-primary btn-block" onClick={submit}>
          Add {kind === 'upper' && Number(count) > 1 ? `${count} floors` : 'level'}
        </button>
      }
    >
      <Field label="What are you adding?">
        <Chips
          options={options.map((option) => option.label)}
          selected={options.find((option) => option.value === kind)?.label ?? ''}
          onSelect={(label) => {
            const found = options.find((option) => option.label === label);
            if (!found) return;
            setKind(found.value);
            if (found.value === 'basement') setUsage('Parking');
            if (found.value === 'ground') setUsage('Shopping');
            if (found.value === 'terrace' || found.value === 'outdoor') setUsage('Common area');
          }}
        />
      </Field>

      {(kind === 'upper' || kind === 'basement') && (
        <TextField
          label={kind === 'upper' ? 'How many floors?' : 'How many basements?'}
          value={count}
          inputMode="numeric"
          hint={kind === 'upper' ? `Starts at Floor ${nextFloor}` : undefined}
          onChange={(value) => setCount(value.replace(/\D/g, ''))}
        />
      )}

      {kind !== 'terrace' && (
        <SelectField
          label="Usage type"
          value={usage}
          options={USAGES.map((item) => ({ value: item.label, label: item.label }))}
          onChange={setUsage}
        />
      )}

      {(kind === 'custom' || kind === 'outdoor') && (
        <TextField
          label="Name"
          value={name}
          placeholder="Shop block, parking area, cabin row"
          onChange={setName}
        />
      )}
    </Sheet>
  );
}

/* --------------------------- floors in a range ------------------------ */

export function RangeScreen({
  levelIds,
  onDone,
}: {
  levelIds: string[];
  onDone: () => void;
}) {
  const { draft, copyConfiguration, notify } = useApp();
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  if (!draft) return null;

  const levels = draft.levels.filter((level) => levelIds.includes(level.id));
  const sourceLevels = levels.filter((level) => !selectedTargets.includes(level.id));
  const source = levels.find((level) => level.id === sourceId) ?? null;

  const handleCopy = () => {
    if (!source || selectedTargets.length === 0 || selectedTargets.includes(source.id)) return;
    const changed = copyConfiguration(source.id, selectedTargets);
    notify(`Configuration copied to ${plural(changed, 'floor')}`);
    onDone();
  };

  return (
    <div className="page" style={{ paddingTop: 16 }}>
      <div className="copy-step-label">Step {step} of 2</div>
      {step === 1 ? (
        <>
          <h2 className="h2">Choose floors to update</h2>
          <p className="muted copy-help">
            Select the destination floors that should receive a copy. Leave at least one floor
            unselected so it can be the source.
          </p>
          <p className="copy-warning">
            Copying replaces each selected floor&apos;s usage, spaces, rent, features, and floor
            facilities. Occupancy and tenant assignments are cleared.
          </p>
          <div className="list">
            {levels.map((level) => {
              const checked = selectedTargets.includes(level.id);
              return (
                <button
                  key={level.id}
                  type="button"
                  className="row"
                  aria-pressed={checked}
                  onClick={() => {
                    setSourceId(null);
                    setSelectedTargets((current) =>
                      checked
                        ? current.filter((id) => id !== level.id)
                        : [...current, level.id],
                    );
                  }}
                >
                  <span className={`cb ${checked ? 'is-on' : ''}`} aria-hidden>
                    {checked && <Check size={12} />}
                  </span>
                  <span className="row-badge" style={floorColorStyle(draft.levels, level.id)}>
                    {level.badge}
                  </span>
                  <span className="row-main">
                    <span className="row-title" style={{ display: 'block' }}>
                      {level.name}
                    </span>
                    <span className="row-sub" style={{ display: 'block' }}>
                      {level.usage} · {levelSummary(level)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            style={{ marginTop: 14 }}
            disabled={selectedTargets.length === 0 || selectedTargets.length === levels.length}
            onClick={() => setStep(2)}
          >
            Continue to choose source
          </button>
        </>
      ) : (
        <>
          <h2 className="h2">Choose the source floor</h2>
          <p className="muted copy-help">
            Configuration from this floor will be copied to {plural(selectedTargets.length, 'selected floor')}.
          </p>
          <div className="list">
            {sourceLevels.map((level) => {
              const checked = sourceId === level.id;
              return (
                <button
                  key={level.id}
                  type="button"
                  className="row"
                  aria-pressed={checked}
                  onClick={() => setSourceId(level.id)}
                >
                  <span className={`rad ${checked ? 'is-on' : ''}`} aria-hidden />
                  <span className="row-badge" style={floorColorStyle(draft.levels, level.id)}>
                    {level.badge}
                  </span>
                  <span className="row-main">
                    <span className="row-title" style={{ display: 'block' }}>
                      {level.name}
                    </span>
                    <span className="row-sub" style={{ display: 'block' }}>
                      {level.usage} · {levelSummary(level)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="copy-step-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!source}
              onClick={handleCopy}
            >
              <Copy size={15} aria-hidden />
              Copy configuration
            </button>
          </div>
        </>
      )}
      <div style={{ height: 24 }} />
    </div>
  );
}

/* ---------------------------- floor editor -------------------------- */

export function FloorEditorScreen({ levelId }: { levelId: string }) {
  const {
    draft,
    updateLevel,
    updateSpace,
    removeSpace,
    generateSpaces,
    notify,
  } = useApp();
  const [tab, setTab] = useState<'spaces' | 'facilities'>('spaces');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [renamingSpaceId, setRenamingSpaceId] = useState<string | null>(null);
  const [spaceName, setSpaceName] = useState('');
  const [selectingSpaces, setSelectingSpaces] = useState(false);
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([]);
  const [facilityAddOpen, setFacilityAddOpen] = useState(false);
  const [facilitySelection, setFacilitySelection] = useState<string[]>([]);
  const [customFacilityName, setCustomFacilityName] = useState('');
  const pageSize = 8;

  const level = draft?.levels.find((item) => item.id === levelId);

  if (!draft || !level) return null;

  const filtered = level.spaces.filter((space) =>
    space.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const visible = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const priced = level.spaces.filter((space) => space.rent).length;
  const space = level.spaces.find((item) => item.id === spaceId) ?? null;
  const levelFacilities = facilitiesForLevel(level, draft.facilities);
  const toggleSpaceSelection = (spaceId: string) =>
    setSelectedSpaceIds((current) =>
      current.includes(spaceId)
        ? current.filter((id) => id !== spaceId)
        : [...current, spaceId],
    );

  const deleteSelectedSpaces = () => {
    if (!selectedSpaceIds.length) return;
    if (!window.confirm(`Remove ${plural(selectedSpaceIds.length, 'space')}?`)) return;
    selectedSpaceIds.forEach((spaceId) => removeSpace(level.id, spaceId));
    notify(`${plural(selectedSpaceIds.length, 'space')} removed`);
    setSelectedSpaceIds([]);
    setSelectingSpaces(false);
    setPage(0);
  };

  return (
    <>
      <div className="page" style={{ paddingTop: 14 }}>
        <div className="floor-context">
          <span className="row-badge" style={floorColorStyle(draft.levels, level.id)}>
            {level.badge}
          </span>
          <span>
            <strong>{level.name}</strong>
            <small>{level.usage}</small>
          </span>
        </div>
        {level.copiedFromName && (
          <div
            style={{
              display: 'flex',
              gap: 9,
              alignItems: 'center',
              padding: '10px 12px',
              marginBottom: 10,
              borderRadius: 12,
              border: '1px solid var(--hair)',
              background: 'var(--surface-2)',
            }}
          >
            <Copy size={15} color="var(--teal)" aria-hidden />
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#3c5966' }}>
              From{' '}
              <b style={{ fontWeight: 800, color: 'var(--ink)' }}>{level.copiedFromName}</b>{' '}
              configuration
            </span>
            <button
              type="button"
              className="btn-text"
              style={{ fontSize: 11 }}
              onClick={() => updateLevel(level.id, { copiedFromName: undefined })}
            >
              Clear
            </button>
          </div>
        )}

        <div className="tabs" role="tablist" aria-label="Floor sections">
          {[
            { id: 'spaces', label: 'Spaces' },
            { id: 'facilities', label: 'Facilities' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              className="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id as typeof tab)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'spaces' && (
          <div style={{ marginTop: 12 }}>
            <StatGrid
              columns={3}
              items={[
                { value: level.spaces.length, label: 'spaces' },
                {
                  value: level.spaces.reduce((total, item) => total + (item.beds ?? 1), 0),
                  label: 'rent units',
                },
                { value: priced, label: 'rent set' },
              ]}
            />

            {level.spaces.length === 0 ? (
              <div style={{ marginTop: 12 }}>
                <EmptyState
                  icon={<Grid2x2 size={22} aria-hidden />}
                  title="No spaces on this floor"
                  description="Add one or more rooms, shops or slots in a single step."
                  action={
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setGenerateOpen(true)}
                    >
                      <Grid2x2 size={15} aria-hidden />
                      Add spaces
                    </button>
                  }
                />
              </div>
            ) : (
              <>
                <div className="space-tools">
                  <span className="muted">{plural(level.spaces.length, 'space')}</span>
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() => {
                      setSelectingSpaces((current) => !current);
                      setSelectedSpaceIds([]);
                    }}
                  >
                    {selectingSpaces ? 'Done' : 'Select'}
                  </button>
                </div>
                {selectingSpaces && (
                  <div className="bulk-selection-bar">
                    <span className="muted">
                      {plural(selectedSpaceIds.length, 'space')} selected
                    </span>
                    <button
                      type="button"
                      className="btn-danger-text"
                      disabled={!selectedSpaceIds.length}
                      onClick={deleteSelectedSpaces}
                    >
                      Delete selected
                    </button>
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  <div className="search" style={{ height: 42 }}>
                    <Search size={16} aria-hidden />
                    <input
                      value={query}
                      placeholder="Search spaces"
                      aria-label="Search spaces"
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setPage(0);
                      }}
                    />
                  </div>
                </div>
                <div className="list space-list" style={{ marginTop: 10 }}>
                  {visible.map((item) => (
                    <div className="row" key={item.id}>
                      <button
                        type="button"
                        className={`space-open row-main ${selectingSpaces ? 'is-selecting' : ''}`}
                        aria-pressed={
                          selectingSpaces ? selectedSpaceIds.includes(item.id) : undefined
                        }
                        onClick={() =>
                          selectingSpaces
                            ? toggleSpaceSelection(item.id)
                            : setSpaceId(item.id)
                        }
                      >
                        {selectingSpaces && (
                          <span
                            className={`cb ${selectedSpaceIds.includes(item.id) ? 'is-on' : ''}`}
                            aria-hidden
                          >
                            {selectedSpaceIds.includes(item.id) && <Check size={12} />}
                          </span>
                        )}
                        <span className="space-open-copy">
                          <span className="row-title">{item.name}</span>
                          <span className="row-sub">
                            {item.beds ? `${item.kind}, ${plural(item.beds, 'bed')}` : item.kind}
                          </span>
                        </span>
                      </button>
                      {!selectingSpaces && (
                        <>
                          <span className={`row-right ${!item.rent ? 'warn-text' : ''}`}>
                            {item.rent ? inr(item.rent.amount) : 'Not set'}
                            <small>{item.occupied ? 'Occupied' : 'Vacant'}</small>
                          </span>
                          <div className="icon-actions">
                            <button
                              type="button"
                              className="icon-action"
                              aria-label={`Rename ${item.name}`}
                              title="Rename space"
                              onClick={() => {
                                setRenamingSpaceId(item.id);
                                setSpaceName(item.name);
                              }}
                            >
                              <Pencil size={15} aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="icon-action is-danger"
                              aria-label={`Remove ${item.name}`}
                              title="Remove space"
                              onClick={() => {
                                if (!window.confirm(`Remove ${item.name}?`)) return;
                                removeSpace(level.id, item.id);
                                notify('Space removed');
                              }}
                            >
                              <Trash2 size={15} aria-hidden />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <Pager
                  page={page}
                  pageSize={pageSize}
                  total={filtered.length}
                  onPage={setPage}
                  unit="spaces"
                />
              </>
            )}

            {level.spaces.length > 0 && (
              <button
                type="button"
                className="btn btn-primary btn-block"
                style={{ marginTop: 14 }}
                onClick={() => setGenerateOpen(true)}
              >
                <Grid2x2 size={15} aria-hidden />
                Add spaces
              </button>
            )}
          </div>
        )}

        {tab === 'facilities' && (
          <div style={{ marginTop: 14 }}>
            <p className="muted" style={{ margin: '0 0 10px' }}>
              Facilities assigned to this floor appear here. Add floor-only items below; common
              facilities and their floor assignments are managed separately.
            </p>
            {levelFacilities.length ? (
              <div className="chips" style={{ marginBottom: 12 }}>
                {levelFacilities.map((facility) => (
                  <span className="pill" key={facility.id}>
                    {facility.name}
                    {facility.scope === 'property' && ` · ${facility.quantity}`}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ margin: '0 0 12px' }}>
                No facilities added to this floor yet.
              </p>
            )}
            <button
              type="button"
              className="btn btn-soft btn-block"
              onClick={() => {
                setFacilitySelection(level.sharedFacilities);
                setCustomFacilityName('');
                setFacilityAddOpen(true);
              }}
            >
              <Plus size={15} aria-hidden />
              Add facility
            </button>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      {generateOpen && (
        <GenerateSpacesSheet
          level={level}
          onClose={() => setGenerateOpen(false)}
          onGenerate={(config) => {
            const created = generateSpaces([level.id], config);
            notify(`${plural(created, 'space')} created`);
            setGenerateOpen(false);
          }}
        />
      )}

      {facilityAddOpen && (
        <Sheet
          title={`Facilities for ${level.name}`}
          onClose={() => setFacilityAddOpen(false)}
          fullHeight
          footer={
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => {
                updateLevel(level.id, { sharedFacilities: facilitySelection });
                setFacilityAddOpen(false);
                notify(`${plural(facilitySelection.length, 'facility')} saved for ${level.name}`);
              }}
            >
              Done
            </button>
          }
        >
          <p className="muted" style={{ margin: '0 0 12px' }}>
            Choose the facilities available on this floor.
          </p>
          <div className="chips">
            {[...new Set([...FLOOR_FACILITY_CATALOGUE, ...FACILITY_CATALOGUE])].map((name) => {
              const selected = facilitySelection.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  className="chip"
                  aria-pressed={selected}
                  onClick={() =>
                    setFacilitySelection((current) =>
                      selected ? current.filter((item) => item !== name) : [...current, name],
                    )
                  }
                >
                  {name}
                </button>
              );
            })}
          </div>
          <div
            className="field-grid"
            style={{ gridTemplateColumns: '1fr auto', alignItems: 'end', marginTop: 16 }}
          >
            <TextField
              label="Add your own facility"
              value={customFacilityName}
              placeholder="e.g. Room service"
              onChange={setCustomFacilityName}
            />
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginBottom: 12 }}
              disabled={!customFacilityName.trim()}
              onClick={() => {
                const name = customFacilityName.trim();
                if (
                  facilitySelection.some((item) => item.toLowerCase() === name.toLowerCase())
                ) {
                  notify(`${name} is already selected`);
                  return;
                }
                setFacilitySelection((current) => [...current, name]);
                setCustomFacilityName('');
              }}
            >
              <Plus size={15} aria-hidden />
              Add
            </button>
          </div>
        </Sheet>
      )}

      {space && (
        <SpaceSheet
          level={level}
          space={space}
          onClose={() => setSpaceId(null)}
          onSave={(patch) => {
            updateSpace(level.id, space.id, patch);
            setSpaceId(null);
            notify('Space updated');
          }}
        />
      )}
      {renamingSpaceId && level.spaces.some((item) => item.id === renamingSpaceId) && (
        <Sheet
          title="Rename space"
          onClose={() => setRenamingSpaceId(null)}
          footer={
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={!spaceName.trim()}
              onClick={() => {
                updateSpace(level.id, renamingSpaceId, { name: spaceName.trim() });
                setRenamingSpaceId(null);
                notify('Space renamed');
              }}
            >
              Save name
            </button>
          }
        >
          <TextField label="Space name" value={spaceName} onChange={setSpaceName} />
        </Sheet>
      )}
    </>
  );
}

function SpaceSheet({
  level,
  space,
  onClose,
  onSave,
}: {
  level: Level;
  space: Space;
  onClose: () => void;
  onSave: (patch: Partial<Space>) => void;
}) {
  const [kind, setKind] = useState<SpaceKind>(space.kind);
  const [beds, setBeds] = useState(space.beds ? String(space.beds) : '');
  const [rent, setRent] = useState(space.rent ? String(space.rent.amount) : '');
  const [deposit, setDeposit] = useState(space.rent ? String(space.rent.deposit) : '');
  const [features, setFeatures] = useState<string[]>(space.features);
  const [featureCounts, setFeatureCounts] = useState<Record<string, number>>(
    () => space.featureCounts ?? {},
  );
  const [occupied, setOccupied] = useState(Boolean(space.occupied));

  return (
    <Sheet
      title={space.name}
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() =>
            onSave({
              kind,
              beds: beds ? Number(beds) : undefined,
              features,
              featureCounts: normalizeFeatureCounts(features, featureCounts),
              occupied,
              rent: rent
                ? {
                    amount: Number(rent),
                    basis: space.rent?.basis ?? (beds ? 'per bed' : 'per month'),
                    deposit: deposit ? Number(deposit) : 0,
                    depositType: space.rent?.depositType ?? 'Refundable',
                    billing: space.rent?.billing ?? 'Monthly',
                  }
                : null,
            })
          }
        >
          Save space
        </button>
      }
    >
      <p className="muted" style={{ margin: '0 0 12px' }}>
        {level.name}, {space.kind}
      </p>
      <SelectField
        label="Space type"
        value={kind}
        options={SPACE_KINDS.map((value) => ({ value, label: value }))}
        onChange={(value) => setKind(value as SpaceKind)}
      />
      {(supportsBedRental(kind) || space.beds !== undefined) && (
        <TextField
          label="Beds in this space (optional)"
          value={beds}
          inputMode="numeric"
          hint="Leave blank to rent the entire space. Add a number to rent it bed by bed."
          onChange={(value) => setBeds(value.replace(/\D/g, ''))}
        />
      )}
      <div className="field-grid">
        <TextField
          label="Rent (₹)"
          value={rent}
          inputMode="numeric"
          placeholder="Not set"
          onChange={(value) => setRent(value.replace(/\D/g, ''))}
        />
        <TextField
          label="Deposit (₹)"
          value={deposit}
          inputMode="numeric"
          placeholder="0"
          onChange={(value) => setDeposit(value.replace(/\D/g, ''))}
        />
      </div>
      <FeaturePicker
        selected={features}
        counts={featureCounts}
        onChange={(nextFeatures, nextCounts) => {
          setFeatures(nextFeatures);
          setFeatureCounts(nextCounts);
        }}
      />
      <button
        type="button"
        className="opt-row"
        aria-pressed={occupied}
        onClick={() => setOccupied((value) => !value)}
      >
        <span className={`cb ${occupied ? 'is-on' : ''}`} aria-hidden>
          {occupied && <Check size={12} />}
        </span>
        <span className="opt-main opt-title">Marked as occupied</span>
      </button>
    </Sheet>
  );
}

function FeaturePicker({
  selected,
  counts,
  onChange,
}: {
  selected: string[];
  counts: Record<string, number>;
  onChange: (features: string[], counts: Record<string, number>) => void;
}) {
  const [query, setQuery] = useState('');
  const [customFeature, setCustomFeature] = useState('');
  const options = Array.from(new Set([...SPACE_FEATURE_CATALOGUE, ...selected]));
  const visibleOptions = options.filter((feature) =>
    feature.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const toggleFeature = (feature: string) => {
    if (selected.includes(feature)) {
      const { [feature]: removed, ...remainingCounts } = counts;
      onChange(
        selected.filter((item) => item !== feature),
        remainingCounts,
      );
      return;
    }
    onChange([...selected, feature], { ...counts, [feature]: counts[feature] || 1 });
  };

  const addCustomFeature = () => {
    const feature = customFeature.trim();
    if (!feature) return;
    if (!selected.includes(feature)) toggleFeature(feature);
    setCustomFeature('');
    setQuery('');
  };

  return (
    <Field label="Features" hint="Features come with the space they’re in. Add your own if needed.">
      <div className="search" style={{ height: 40, marginBottom: 8 }}>
        <Search size={16} aria-hidden />
        <input
          value={query}
          placeholder="Search features"
          aria-label="Search features"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 10 }}>
        <Chips
          options={visibleOptions}
          selected={selected}
          onSelect={toggleFeature}
          label="Available features"
        />
      </div>
      {selected.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div className="sec-head">
            <span>Quantity in this space</span>
          </div>
          <div className="feature-quantity-list">
            {selected.map((feature) => (
              <div className="feature-quantity-pill" key={feature}>
                <span className="feature-quantity-name">{feature}</span>
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  aria-label={`Quantity of ${feature}`}
                  value={counts[feature] || ''}
                  onChange={(event) => {
                    const quantity = event.target.value
                      ? Math.max(0, Math.floor(Number(event.target.value) || 0))
                      : 0;
                    onChange(selected, {
                      ...counts,
                      [feature]: quantity,
                    });
                  }}
                />
                <button
                  type="button"
                  className="feature-remove"
                  aria-label={`Remove ${feature}`}
                  title={`Remove ${feature}`}
                  onClick={() => toggleFeature(feature)}
                >
                  <X size={13} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="field-grid" style={{ gridTemplateColumns: '1fr auto', alignItems: 'end' }}>
        <TextField
          label="Add your own feature"
          value={customFeature}
          placeholder="e.g. Private entrance"
          onChange={setCustomFeature}
        />
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginBottom: 16 }}
          disabled={!customFeature.trim()}
          onClick={addCustomFeature}
        >
          <Plus size={15} aria-hidden />
          Add
        </button>
      </div>
    </Field>
  );
}

/* --------------------------- generate spaces ------------------------ */

export function GenerateSpacesSheet({
  level,
  onClose,
  onGenerate,
}: {
  level: Level;
  onClose: () => void;
  onGenerate: (config: GenerateConfig) => void;
}) {
  const initialKind = guessKind(level);
  const [kind, setKind] = useState<SpaceKind>(initialKind);
  const [count, setCount] = useState('20');
  const [rentByBed, setRentByBed] = useState(false);
  const [beds, setBeds] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featureCounts, setFeatureCounts] = useState<Record<string, number>>({});
  const [prefix, setPrefix] = useState(defaultPrefix[initialKind]);
  const [start, setStart] = useState(String(defaultStart[initialKind]));

  const parsedCount = Math.max(1, Math.min(500, Number(count) || 1));
  const parsedBeds =
    rentByBed && supportsBedRental(kind)
      ? Math.max(1, Math.min(10, Number(beds) || 1))
      : undefined;

  const config: GenerateConfig = {
    kind,
    count: parsedCount,
    beds: parsedBeds,
    features,
    featureCounts: normalizeFeatureCounts(features, featureCounts),
    prefix,
    start: Number(start) || 1,
  };

  const numbers = previewNumbers(
    kind === 'Parking slot' ? { ...level, floorNo: null } : level,
    config,
  );

  return (
    <Sheet
      title="Add spaces"
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => onGenerate(config)}
        >
          Create {plural(parsedCount, kind.toLowerCase())}
        </button>
      }
    >
      <div className="row" style={{ paddingTop: 0 }}>
        <span className="row-badge" style={floorColorStyle(draft.levels, level.id)}>
          {level.badge}
        </span>
        <span className="row-main">
          <span className="row-title" style={{ display: 'block' }}>
            {level.name}
          </span>
          <span className="row-sub" style={{ display: 'block' }}>
            {level.usage}
          </span>
        </span>
      </div>

      <SelectField
        label="Space type"
        value={kind}
        options={SPACE_KINDS.map((value) => ({ value, label: value }))}
        onChange={(value) => {
          const next = value as SpaceKind;
          setKind(next);
          setPrefix(defaultPrefix[next]);
          setStart(String(defaultStart[next]));
        }}
      />

      <div className="field-grid">
        <TextField
          label={`Number of ${kind.toLowerCase()}s`}
          value={count}
          inputMode="numeric"
          onChange={(value) => setCount(value.replace(/\D/g, ''))}
        />
        {supportsBedRental(kind) && (
          <button
            type="button"
            className="opt-row"
            aria-pressed={rentByBed}
            onClick={() => setRentByBed((current) => !current)}
          >
            <span className={`cb ${rentByBed ? 'is-on' : ''}`} aria-hidden>
              {rentByBed && <Check size={12} />}
            </span>
            <span className="opt-main opt-title">Rent by bed</span>
          </button>
        )}
        {supportsBedRental(kind) && rentByBed && (
          <TextField
            label="Beds in each space"
            value={beds}
            inputMode="numeric"
            hint="Turn off “Rent by bed” to rent each room as one space."
            onChange={(value) => setBeds(value.replace(/\D/g, ''))}
          />
        )}
      </div>

      <FeaturePicker
        selected={features}
        counts={featureCounts}
        onChange={(nextFeatures, nextCounts) => {
          setFeatures(nextFeatures);
          setFeatureCounts(nextCounts);
        }}
      />

      <div className="field-grid">
        <TextField label="Name prefix" value={prefix} onChange={setPrefix} />
        <TextField
          label="Start number"
          value={start}
          inputMode="numeric"
          onChange={(value) => setStart(value.replace(/\D/g, ''))}
        />
      </div>

      <div className="preview-box">
        <PreviewRow
          label="Numbers"
          value={numbers.length ? `${numbers[0]} → ${numbers[numbers.length - 1]}` : '—'}
        />
        <PreviewRow
          label="Creates"
          value={
            parsedBeds
              ? `${plural(parsedCount, kind.toLowerCase())}, ${plural(parsedCount * parsedBeds, 'bed')}`
              : plural(parsedCount, kind.toLowerCase())
          }
        />
      </div>
    </Sheet>
  );
}

/* ----------------------------- facilities --------------------------- */

export function FacilitiesScreen() {
  const { draft, addFacility, updateFacility, removeFacility, notify } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');

  if (!draft) return null;

  const facility: Facility | null = draft.facilities.find((item) => item.id === scopeId) ?? null;

  const scopeLabel = (item: Facility) => {
    if (item.scope === 'property') return 'Entire property';
    return item.levelIds.length ? plural(item.levelIds.length, 'floor') : 'No floors chosen';
  };

  return (
    <>
      <div className="page" style={{ paddingTop: 16 }}>
        <p className="muted" style={{ margin: '0 0 12px' }}>
          Facilities configured once for the whole property. Floor-level facilities live inside each
          floor.
        </p>

        {draft.facilities.length === 0 ? (
          <EmptyState
            icon={<Building2 size={22} aria-hidden />}
            title="No common facilities"
            description="Lift, service lift, CCTV, security, generator, water supply and Wi-Fi are configured once here."
            action={
              <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}>
                <Plus size={15} aria-hidden />
                Add facility
              </button>
            }
          />
        ) : (
          <>
            <div className="list">
              {draft.facilities.map((item) => {
                const quantity = item.quantity ?? 1;
                return (
                  <div className="row" key={item.id}>
                    <button
                      type="button"
                      className="facility-edit row-main"
                      onClick={() => setScopeId(item.id)}
                    >
                      <span className="row-title" style={{ display: 'block' }}>
                        {item.name}
                      </span>
                      <span className="row-sub" style={{ display: 'block' }}>
                        {scopeLabel(item)}
                      </span>
                    </button>
                    <div
                      className="facility-quantity"
                      role="group"
                      aria-label={`${item.name} quantity`}
                    >
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name} quantity`}
                        disabled={quantity <= 1}
                        onClick={() => updateFacility(item.id, { quantity: quantity - 1 })}
                      >
                        <Minus size={13} aria-hidden />
                      </button>
                      <span>{quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${item.name} quantity`}
                        onClick={() => updateFacility(item.id, { quantity: quantity + 1 })}
                      >
                        <Plus size={13} aria-hidden />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="icon-action is-danger"
                      aria-label={`Remove ${item.name}`}
                      title="Remove facility"
                      onClick={() => {
                        if (!window.confirm(`Remove ${item.name}?`)) return;
                        removeFacility(item.id);
                        notify(`${item.name} removed`);
                      }}
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ marginTop: 12 }}
              onClick={() => setAddOpen(true)}
            >
              <Plus size={15} aria-hidden />
              Add facility
            </button>
          </>
        )}
        <div style={{ height: 24 }} />
      </div>

      {addOpen && (
        <Sheet
          title="Add facility"
          onClose={() => setAddOpen(false)}
          footer={
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => {
                setAddOpen(false);
                notify('Facility list updated');
              }}
            >
              Done
            </button>
          }
        >
          <div className="chips">
            {FACILITY_CATALOGUE.map((name) => {
              const added = draft.facilities.some(
                (item) => item.name.toLowerCase() === name.toLowerCase(),
              );
              return (
                <button
                  key={name}
                  type="button"
                  className="chip"
                  aria-pressed={added}
                  onClick={() => {
                    if (added) {
                      notify(`${name} is already added`);
                      return;
                    }
                    addFacility(name);
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
          <div className="field-grid" style={{ gridTemplateColumns: '1fr auto', alignItems: 'end', marginTop: 16 }}>
            <TextField
              label="Add your own facility"
              value={customName}
              placeholder="e.g. Rooftop garden"
              onChange={setCustomName}
            />
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginBottom: 12 }}
              disabled={!customName.trim()}
              onClick={() => {
                const name = customName.trim();
                if (draft.facilities.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
                  notify(`${name} is already added`);
                  return;
                }
                addFacility(name);
                setCustomName('');
                notify(`${name} added`);
              }}
            >
              <Plus size={15} aria-hidden />
              Add
            </button>
          </div>
        </Sheet>
      )}

      {facility && (
        <Sheet
          title={facility.name}
          onClose={() => setScopeId(null)}
          fullHeight
          footer={
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => {
                setScopeId(null);
                notify('Facility settings saved');
              }}
            >
              Done
            </button>
          }
        >
          <Field label="Applies to">
            <div className="tabs">
              {[
                { value: 'property', label: 'Entire property' },
                { value: 'levels', label: 'Selected floors' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="tab"
                  aria-selected={facility.scope === option.value}
                  onClick={() =>
                    updateFacility(facility.id, { scope: option.value as Facility['scope'] })
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Field>

          {facility.scope === 'levels' && (
            <div className="list">
              {draft.levels.map((level) => {
                const checked = facility.levelIds.includes(level.id);
                return (
                  <button
                    key={level.id}
                    type="button"
                    className="row"
                    onClick={() =>
                      updateFacility(facility.id, {
                        levelIds: checked
                          ? facility.levelIds.filter((id) => id !== level.id)
                          : [...new Set([...facility.levelIds, level.id])],
                      })
                    }
                  >
                    <span className={`cb ${checked ? 'is-on' : ''}`} aria-hidden>
                      {checked && <Check size={12} />}
                    </span>
                    <span
                      className="row-badge"
                      style={floorColorStyle(draft.levels, level.id)}
                    >
                      {level.badge}
                    </span>
                    <span className="row-main">
                      <span className="row-title" style={{ display: 'block' }}>
                        {level.name}
                      </span>
                      <span className="row-sub" style={{ display: 'block' }}>
                        {level.usage}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

        </Sheet>
      )}
    </>
  );
}


