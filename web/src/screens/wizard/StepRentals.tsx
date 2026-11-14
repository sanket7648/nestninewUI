import { useState } from 'react';
import { Check, Copy, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import {
  EmptyState,
  Meter,
  PreviewRow,
  SelectField,
  TextField,
} from '../../components/primitives';
import { Sheet } from '../../components/Sheet';
import type { Level, Rent } from '../../types';
import {
  floorColorStyle,
  totalPriced,
  totalUnits,
} from '../../lib/model';
import { inr, plural } from '../../lib/format';

const levelPriceLabel = (level: Level) => {
  const amounts = Array.from(
    new Set(level.spaces.filter((space) => space.rent).map((space) => space.rent!.amount)),
  );
  if (!amounts.length) return 'Not set';
  return amounts.length === 1
    ? inr(amounts[0])
    : `${inr(Math.min(...amounts))} – ${inr(Math.max(...amounts))}`;
};

export default function StepRentals() {
  const { draft, notify } = useApp();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [individualLevels, setIndividualLevels] = useState<Level[] | null>(null);

  if (!draft) return null;

  const units = totalUnits(draft.levels);
  const priced = totalPriced(draft.levels);
  const levels = draft.levels.filter((level) => !level.commonArea);

  return (
    <>
      <div className="page" style={{ paddingTop: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 9,
          }}
        >
          <div className="h2" style={{ fontSize: 17 }}>
            Set rent by space
          </div>
          <span className="num" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--teal)' }}>
            {priced} / {units} priced
          </span>
        </div>
        <Meter value={priced} total={units} left={`${Math.max(0, units - priced)} spaces unpriced`} />

        {levels.length === 0 ? (
          <div style={{ marginTop: 14 }}>
            <EmptyState
              icon={<SlidersHorizontal size={22} aria-hidden />}
              title="No rentable spaces yet"
              description="Add levels and generate spaces in the structure step, then set their rent here."
            />
          </div>
        ) : (
          <>
            <div className="list" style={{ marginTop: 13 }}>
              {levels.map((level) => {
                const color = floorColorStyle(draft.levels, level.id);
                const pricedSpaces = level.spaces.filter((space) => space.rent).length;
                return (
                  <button
                    key={level.id}
                    type="button"
                    className="row"
                    onClick={() => setIndividualLevels([level])}
                  >
                    <span
                      className="row-badge"
                      style={color}
                    >
                      {level.badge}
                    </span>
                    <span className="row-main">
                      <span className="row-title" style={{ display: 'block' }}>
                        {level.name}
                      </span>
                      <span className="row-sub" style={{ display: 'block' }}>
                        {pricedSpaces} / {level.spaces.length} spaces priced
                      </span>
                    </span>
                    <span className={`row-right ${pricedSpaces < level.spaces.length ? 'warn-text' : ''}`}>
                      {levelPriceLabel(level)}
                      <small>
                        {level.spaces.length - pricedSpaces} unpriced
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn-soft btn-block"
              style={{ marginTop: 12 }}
              onClick={() => setBulkOpen(true)}
            >
              <SlidersHorizontal size={15} aria-hidden />
              Set rent in bulk
            </button>
            <p className="muted" style={{ textAlign: 'center', margin: '9px 0 0' }}>
              Select a floor to set a different rent for each space.
            </p>
            <button
              type="button"
              className="btn-text"
              style={{ display: 'block', margin: '12px auto 0' }}
              onClick={() => notify('You can price each space later')}
            >
              I&apos;ll add rent details later
            </button>
          </>
        )}

        <div style={{ height: 24 }} />
      </div>

      {bulkOpen && <BulkRentSheet onClose={() => setBulkOpen(false)} />}
      {individualLevels && (
        <IndividualRentSheet
          levels={individualLevels}
          onClose={() => setIndividualLevels(null)}
        />
      )}
    </>
  );
}

function IndividualRentSheet({
  levels,
  onClose,
}: {
  levels: Level[];
  onClose: () => void;
}) {
  const { draft, updateSpace, notify } = useApp();
  const spaces = levels.flatMap((level) =>
    level.spaces.map((space) => ({ level, space })),
  );
  const color =
    levels[0] && draft ? floorColorStyle(draft.levels, levels[0].id) : undefined;
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      spaces.map(({ space }) => [
        space.id,
        {
          amount: space.rent ? String(space.rent.amount) : '',
          deposit: space.rent ? String(space.rent.deposit) : '',
          basis: space.rent?.basis ?? (space.beds ? 'per bed' : 'per month'),
          depositType: space.rent?.depositType ?? 'Refundable',
          billing: space.rent?.billing ?? 'Monthly',
        },
      ]),
    ),
  );

  const updateValue = (spaceId: string, key: 'amount' | 'deposit', value: string) =>
    setValues((current) => ({
      ...current,
      [spaceId]: { ...current[spaceId], [key]: value.replace(/\D/g, '') },
    }));

  const copyToFloor = (sourceSpaceId: string) => {
    const source = values[sourceSpaceId];
    if (!source?.amount) {
      notify('Enter a rent amount before copying it to this floor');
      return;
    }
    setValues(
      Object.fromEntries(
        spaces.map(({ space }) => [
          space.id,
          {
            amount: source.amount,
            deposit: source.deposit ?? '',
            basis: source.basis,
            depositType: source.depositType,
            billing: source.billing,
          },
        ]),
      ),
    );
    notify('Rent copied to all spaces on this floor');
  };

  const save = () => {
    spaces.forEach(({ level, space }) => {
      const value = values[space.id];
      if (!value) return;
      const rent: Rent | null = value.amount
        ? {
            amount: Number(value.amount),
            basis: value.basis,
            deposit: Number(value.deposit) || 0,
            depositType: value.depositType,
            billing: value.billing,
          }
        : null;
      updateSpace(level.id, space.id, { rent });
    });
    notify(`Rent saved for ${plural(spaces.length, 'space')}`);
    onClose();
  };

  return (
    <Sheet
      title="Set rent by space"
      onClose={onClose}
      fullHeight
      footer={
        <button type="button" className="btn btn-primary btn-block" onClick={save}>
          Save rent
        </button>
      }
    >
      <p className="muted" style={{ margin: '0 0 12px' }}>
        Enter a different amount for each room or space. Leave rent blank for a space you don’t want
        to price yet.
      </p>
      {levels.length === 1 && levels[0] && (
        <div className="rent-floor-heading">
          <span
            className="row-badge"
            style={color}
          >
            {levels[0].badge}
          </span>
          <span>
            <strong>{levels[0].name}</strong>
            <small>{plural(spaces.length, 'space')} on this floor</small>
          </span>
        </div>
      )}
      {spaces.map(({ level, space }) => {
        const value = values[space.id] ?? {
          amount: '',
          deposit: '',
          basis: space.beds ? 'per bed' : 'per month',
          depositType: 'Refundable',
          billing: 'Monthly',
        };
        return (
          <div
            key={`${level.id}:${space.id}`}
            style={{
              padding: '12px 0',
              borderBottom: '1px solid var(--hair)',
            }}
          >
            <div className="row-title" style={{ marginBottom: 8 }}>
              {space.name}
              {levels.length > 1 && (
                <span className="row-sub" style={{ marginLeft: 7 }}>
                  {level.name}
                </span>
              )}
              {space.beds && (
                <span className="row-sub" style={{ marginLeft: 7 }}>
                  · {plural(space.beds, 'bed')}
                </span>
              )}
            </div>
            <div className="field-grid" style={{ marginBottom: 0 }}>
              <TextField
                label={`Rent (₹${space.beds ? ' per bed' : ''})`}
                value={value.amount}
                inputMode="numeric"
                placeholder="Not set"
                onChange={(amount) => updateValue(space.id, 'amount', amount)}
              />
              <TextField
                label="Deposit (₹)"
                value={value.deposit}
                inputMode="numeric"
                placeholder="0"
                onChange={(deposit) => updateValue(space.id, 'deposit', deposit)}
              />
            </div>
            <button
              type="button"
              className="btn-text rent-copy"
              onClick={() => copyToFloor(space.id)}
            >
              <Copy size={14} aria-hidden />
              Copy this rent to the whole floor
            </button>
          </div>
        );
      })}
    </Sheet>
  );
}

function BulkRentSheet({ onClose }: { onClose: () => void }) {
  const { draft, applyRent, notify } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [onlyUnpriced, setOnlyUnpriced] = useState(true);
  const [amount, setAmount] = useState('');
  const [basis, setBasis] = useState('per month');
  const [deposit, setDeposit] = useState('');
  const [depositType, setDepositType] = useState('Refundable');
  const [billing, setBilling] = useState('Monthly');

  if (!draft) return null;

  const levels = draft.levels.filter((level) => !level.commonArea);

  const chosenLevels = draft.levels.filter(
    (level) => selected.includes(level.id) && !level.commonArea,
  );

  const affected = chosenLevels.reduce(
    (total, level) =>
      total +
      level.spaces.reduce(
        (count, space) => (onlyUnpriced && space.rent ? count : count + (space.beds ?? 1)),
        0,
      ),
    0,
  );

  const pricedInScope = chosenLevels.reduce(
    (total, level) =>
      total +
      level.spaces.reduce((count, space) => (space.rent ? count + (space.beds ?? 1) : count), 0),
    0,
  );

  const submit = () => {
    if (chosenLevels.length === 0) {
      notify('Choose at least one floor');
      return;
    }
    if (!amount) {
      notify('Enter a rent amount');
      return;
    }
    const count = applyRent(
      chosenLevels.map((level) => level.id),
      { amount: Number(amount), basis, deposit: Number(deposit) || 0, depositType, billing },
      onlyUnpriced,
    );
    notify(`Rent applied to ${plural(count, 'space')}`);
    onClose();
  };

  return (
    <Sheet
      title="Set rent in bulk"
      onClose={onClose}
      fullHeight
      footer={
        <button type="button" className="btn btn-primary btn-block" onClick={submit}>
          Apply to {plural(affected, 'space')}
        </button>
      }
    >
      <div className="sec-head">
        <span>Applies to</span>
        <span className="muted num">{plural(chosenLevels.length, 'floor')}</span>
      </div>
      <div className="list">
        {levels.map((level) => {
          const checked = selected.includes(level.id);
          const color = floorColorStyle(draft.levels, level.id);
          return (
            <button
              key={level.id}
              type="button"
              className="row"
              onClick={() =>
                setSelected((current) =>
                  checked
                    ? current.filter((id) => id !== level.id)
                    : [...new Set([...current, level.id])],
                )
              }
            >
              <span className={`cb ${checked ? 'is-on' : ''}`} aria-hidden>
                {checked && <Check size={12} />}
              </span>
              <span
                className="row-badge"
                style={color}
              >
                {level.badge}
              </span>
              <span className="row-main">
                <span className="row-title" style={{ display: 'block' }}>
                  {level.name}
                </span>
                <span className="row-sub" style={{ display: 'block' }}>
                  {plural(level.spaces.length, 'space')}
                </span>
              </span>
              <span className="row-right">{levelPriceLabel(level)}</span>
            </button>
          );
        })}
      </div>

      <div className="chips" style={{ margin: '12px 0' }}>
        <button
          type="button"
          className="chip"
          aria-pressed={onlyUnpriced}
          onClick={() => setOnlyUnpriced(true)}
        >
          Unpriced only
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={!onlyUnpriced}
          onClick={() => setOnlyUnpriced(false)}
        >
          All spaces
        </button>
      </div>

      <div className="field-grid">
        <TextField
          label="Rent (₹)"
          value={amount}
          inputMode="numeric"
          placeholder="6000"
          onChange={(value) => setAmount(value.replace(/\D/g, ''))}
        />
        <SelectField
          label="Rent basis"
          value={basis}
          options={['per month', 'per bed', 'per seat', 'per week'].map((value) => ({
            value,
            label: value,
          }))}
          onChange={setBasis}
        />
      </div>
      <div className="field-grid">
        <TextField
          label="Deposit (₹)"
          value={deposit}
          inputMode="numeric"
          placeholder="12000"
          onChange={(value) => setDeposit(value.replace(/\D/g, ''))}
        />
        <SelectField
          label="Deposit type"
          value={depositType}
          options={['Refundable', 'Non-refundable'].map((value) => ({ value, label: value }))}
          onChange={setDepositType}
        />
      </div>
      <SelectField
        label="Billing frequency"
        value={billing}
        options={['Monthly', 'Quarterly', 'Half-yearly'].map((value) => ({ value, label: value }))}
        onChange={setBilling}
      />

      <div className="preview-box">
        <PreviewRow label="Spaces affected" value={plural(affected, 'space')} />
        <PreviewRow
          label={onlyUnpriced ? 'Kept unchanged' : 'Overwritten'}
          value={plural(pricedInScope, 'space')}
        />
        <PreviewRow label="Rent after" value={amount ? `${inr(Number(amount))} ${basis}` : '—'} />
      </div>
    </Sheet>
  );
}
