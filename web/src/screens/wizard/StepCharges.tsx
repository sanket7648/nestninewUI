import { useState } from 'react';
import type { ComponentType } from 'react';
import {
  Check,
  Droplets,
  Flame,
  Gauge,
  Layers,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  User,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { EmptyState, Field, PreviewRow, SelectField, TextField } from '../../components/primitives';
import { Sheet } from '../../components/Sheet';
import { chargeSummary, chargeMethodLabel, floorColorStyle } from '../../lib/model';
import { inr, uid } from '../../lib/format';
import type { Charge, ChargeMethod } from '../../types';

type IconType = ComponentType<{ size?: number; color?: string }>;

const iconFor = (name: string): IconType => {
  const key = name.toLowerCase();
  if (key.includes('electric')) return Zap;
  if (key.includes('water')) return Droplets;
  if (key.includes('maint')) return Wrench;
  if (key.includes('internet') || key.includes('wi')) return Wifi;
  if (key.includes('gas')) return Flame;
  if (key.includes('house') || key.includes('clean')) return Sparkles;
  return Receipt;
};

const METHODS: { value: ChargeMethod; label: string; icon: IconType }[] = [
  { value: 'fixed', label: 'Fixed monthly', icon: Receipt },
  { value: 'meter', label: 'By meter', icon: Gauge },
  { value: 'included', label: 'Included in rent', icon: Layers },
  { value: 'tenant', label: 'Tenant pays directly', icon: User },
];

const newCharge = (): Charge => ({
  id: uid('chg'),
  name: '',
  method: 'fixed',
  amount: null,
  unit: '',
  baseCharge: null,
  billing: 'Monthly',
  scope: { type: 'property', levelIds: [] },
});

export default function StepCharges() {
  const { draft, upsertCharge, removeCharge, notify } = useApp();
  const [editing, setEditing] = useState<Charge | null>(null);

  if (!draft) return null;

  const scopeLabel = (charge: Charge) => {
    if (charge.scope.type === 'property') return 'Entire property';
    const levels = draft.levels.filter((level) => charge.scope.levelIds.includes(level.id));
    if (levels.length === 0) return 'No levels chosen';
    return (
      <span className="floor-labels">
        {levels.slice(0, 3).map((level) => (
          <span
            key={level.id}
            className="floor-label"
            style={floorColorStyle(draft.levels, level.id)}
          >
            {level.badge} {level.name}
          </span>
        ))}
        {levels.length > 3 && <span>+{levels.length - 3}</span>}
      </span>
    );
  };

  return (
    <>
      <div className="page" style={{ paddingTop: 16 }}>
        <div className="h2" style={{ marginBottom: 13 }}>
          Charges besides rent
        </div>

        {draft.charges.length === 0 ? (
          <EmptyState
            icon={<Receipt size={22} aria-hidden />}
            title="No charges yet"
            description="Add electricity, water, maintenance and anything else billed on top of rent."
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setEditing(newCharge())}
              >
                <Plus size={15} aria-hidden />
                Add charge
              </button>
            }
          />
        ) : (
          <div className="list">
            {draft.charges.map((charge) => {
              const Icon = iconFor(charge.name);
              return (
                <button
                  key={charge.id}
                  type="button"
                  className="row"
                  onClick={() => setEditing(charge)}
                >
                  <span className="row-main">
                    <span className="row-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Icon size={15} color="var(--teal)" />
                      {charge.name || 'Untitled charge'}
                    </span>
                    <span
                      className="row-sub"
                      style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}
                    >
                      <span>{chargeMethodLabel(charge.method)}</span>
                      <span style={{ color: '#5e7b86' }}>{scopeLabel(charge)}</span>
                    </span>
                  </span>
                  <span className="row-right">{chargeSummary(charge)}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setEditing(newCharge())}
              style={{
                width: 'calc(100% + 24px)',
                margin: '0 -12px',
                height: 50,
                border: 0,
                borderTop: '1px solid var(--hair)',
                background: '#f8fcfa',
                color: 'var(--teal)',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
              }}
            >
              <Plus size={14} aria-hidden />
              Add another charge
            </button>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      {editing && (
        <ChargeEditorSheet
          charge={editing}
          onClose={() => setEditing(null)}
          onSave={(charge) => {
            upsertCharge(charge);
            setEditing(null);
            notify(`${charge.name || 'Charge'} saved`);
          }}
          onDelete={() => {
            removeCharge(editing.id);
            setEditing(null);
            notify('Charge removed');
          }}
        />
      )}
    </>
  );
}

function ChargeEditorSheet({
  charge,
  onClose,
  onSave,
  onDelete,
}: {
  charge: Charge;
  onClose: () => void;
  onSave: (charge: Charge) => void;
  onDelete: () => void;
}) {
  const { draft } = useApp();
  const [name, setName] = useState(charge.name);
  const [method, setMethod] = useState<ChargeMethod>(charge.method);
  const [amount, setAmount] = useState(charge.amount ? String(charge.amount) : '');
  const [unit, setUnit] = useState(charge.unit || 'kWh');
  const [baseCharge, setBaseCharge] = useState(
    charge.baseCharge ? String(charge.baseCharge) : '',
  );
  const [scope, setScope] = useState(charge.scope);

  if (!draft) return null;

  const existing = draft.charges.some((item) => item.id === charge.id);

  const toggleLevels = (ids: string[], checked: boolean) => {
    setScope({
      type: 'levels',
      levelIds: checked
        ? [...new Set([...scope.levelIds, ...ids])]
        : scope.levelIds.filter((id) => !ids.includes(id)),
    });
  };

  return (
    <Sheet
      title={existing ? charge.name || 'Charge' : 'New charge'}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 9 }}>
          {existing && (
            <button type="button" className="btn btn-ghost" style={{ flex: '0 0 96px' }} onClick={onDelete}>
              Delete
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() =>
              onSave({
                ...charge,
                name: name.trim() || 'Charge',
                method,
                amount: amount ? Number(amount) : null,
                unit,
                baseCharge: baseCharge ? Number(baseCharge) : null,
                scope,
              })
            }
          >
            Save charge
          </button>
        </div>
      }
    >
      <TextField
        label="Charge name"
        value={name}
        placeholder="Electricity"
        onChange={setName}
      />

      <Field label="Payment method">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {METHODS.map(({ value, label, icon: Icon }) => {
            const active = method === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setMethod(value)}
                style={{
                  minHeight: 66,
                  borderRadius: 12,
                  border: `1px solid ${active ? 'var(--teal)' : 'var(--line)'}`,
                  background: active ? 'var(--teal-tint)' : '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '0 12px',
                  textAlign: 'left',
                }}
              >
                <Icon size={17} color={active ? 'var(--teal-dark)' : '#5e7b86'} />
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: active ? 700 : 600,
                    color: active ? 'var(--teal-dark)' : 'var(--ink-2)',
                    lineHeight: 1.25,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      {method === 'meter' && (
        <>
          <div className="field-grid">
            <TextField
              label="Rate (₹)"
              value={amount}
              inputMode="numeric"
              placeholder="8"
              onChange={(value) => setAmount(value.replace(/\D/g, ''))}
            />
            <SelectField
              label="Unit"
              value={unit}
              options={['kWh', 'KL', 'litre', 'unit', 'hour'].map((value) => ({ value, label: value }))}
              onChange={setUnit}
            />
          </div>
          <TextField
            label="Base charge (₹)"
            value={baseCharge}
            inputMode="numeric"
            placeholder="Optional"
            onChange={(value) => setBaseCharge(value.replace(/\D/g, ''))}
          />
        </>
      )}

      {method === 'fixed' && (
        <div className="field-grid">
          <TextField
            label="Amount (₹)"
            value={amount}
            inputMode="numeric"
            placeholder="500"
            onChange={(value) => setAmount(value.replace(/\D/g, ''))}
          />
          <SelectField
            label="Billing"
            value="Monthly"
            options={['Monthly', 'Quarterly', 'Half-yearly'].map((value) => ({ value, label: value }))}
            onChange={() => undefined}
          />
        </div>
      )}

      {(method === 'included' || method === 'tenant') && (
        <div className="preview-box" style={{ marginBottom: 12 }}>
          <PreviewRow
            label="Billing"
            value={method === 'included' ? 'No extra charge' : 'Paid to the provider'}
          />
        </div>
      )}

      <Field label="Applies to">
        <div style={{ display: 'grid', gap: 6 }}>
          <button
            type="button"
            className="opt-row"
            aria-pressed={scope.type === 'property'}
            onClick={() => setScope({ type: 'property', levelIds: [] })}
          >
            <span className={`rad ${scope.type === 'property' ? 'is-on' : ''}`} aria-hidden />
            <span className="opt-main">
              <span className="opt-title" style={{ display: 'block' }}>
                Entire property
              </span>
            </span>
          </button>
          <button
            type="button"
            className="opt-row"
            aria-pressed={scope.type === 'levels'}
            onClick={() => setScope({ ...scope, type: 'levels' })}
          >
            <span className={`rad ${scope.type === 'levels' ? 'is-on' : ''}`} aria-hidden />
            <span className="opt-main">
              <span className="opt-title" style={{ display: 'block' }}>
                Selected levels
              </span>
              <span className="opt-sub" style={{ display: 'block' }}>
                {scope.levelIds.length} levels chosen
              </span>
            </span>
          </button>
        </div>
      </Field>

      {scope.type === 'levels' && (
        <div className="list">
          {draft.levels.map((level) => {
            const ids = [level.id];
            const checked = scope.levelIds.includes(level.id);
            return (
              <div className="row" key={level.id}>
                <button
                  type="button"
                  className={`cb ${checked ? 'is-on' : ''}`}
                  aria-pressed={checked}
                  aria-label={`Apply to ${level.name}`}
                  onClick={() => toggleLevels(ids, !checked)}
                >
                  {checked && <Check size={12} aria-hidden />}
                </button>
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
            );
          })}
        </div>
      )}
    </Sheet>
  );
}


