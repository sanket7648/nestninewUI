import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import {
  chargeSummary,
  facilitiesForLevel,
  floorColorStyle,
  totalPriced,
  totalUnits,
} from '../../lib/model';
import { inr, plural } from '../../lib/format';
import { Sheet } from '../../components/Sheet';
import { PreviewRow } from '../../components/primitives';
import type { Charge, Facility, Level, Space } from '../../types';

export default function StepReview() {
  const { draft, setStep } = useApp();
  const [openLevels, setOpenLevels] = useState<string[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<{ levelId: string; spaceId: string } | null>(
    null,
  );

  if (!draft) return null;

  const units = totalUnits(draft.levels);
  const priced = totalPriced(draft.levels);
  const pricedLevels = draft.levels.filter((level) =>
    level.spaces.some((space) => space.rent),
  );
  const details = draft.details;
  const selectedLevel = draft.levels.find((level) => level.id === selectedSpace?.levelId);
  const selectedUnit = selectedLevel?.spaces.find((space) => space.id === selectedSpace?.spaceId);

  return (
    <div className="page" style={{ paddingTop: 16 }}>
      <div
        style={{
          display: 'flex',
          gap: 11,
          alignItems: 'center',
          paddingBottom: 12,
          borderBottom: '1px solid var(--hair)',
          marginBottom: 14,
        }}
      >
        <span
          className="row-badge"
          style={{ width: 50, height: 50, flex: '0 0 50px', color: 'var(--teal)' }}
        >
          {details.name.slice(0, 1).toUpperCase() || 'P'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row-title" style={{ fontSize: 16.5, fontWeight: 800 }}>
            {details.name || 'Untitled property'}
          </div>
          <div className="row-sub">
            {[details.type, plural(draft.levels.length, 'level'), plural(units, 'space')]
              .filter(Boolean)
              .join(', ')}
          </div>
        </div>
        <button type="button" className="btn-text" onClick={() => setStep(1)}>
          Edit
        </button>
      </div>

      <div className="sec-head">
        <span>Structure</span>
        <button type="button" className="btn-text" onClick={() => setStep(2)}>
          Edit
        </button>
      </div>

      {draft.levels.length === 0 ? (
        <p className="muted" style={{ margin: '0 0 14px' }}>
          No levels added yet.
        </p>
      ) : (
        <div className="list" style={{ marginBottom: 14 }}>
          {draft.levels.map((level) => {
            const isOpen = openLevels.includes(level.id);
            const amounts = Array.from(
              new Set(
                level.spaces.filter((space) => space.rent).map((space) => space.rent!.amount),
              ),
            );
            const rentLabel = amounts.length
              ? amounts.length === 1
                ? inr(amounts[0])
                : `${inr(Math.min(...amounts))} – ${inr(Math.max(...amounts))}`
              : level.spaces.length
                ? 'Not set'
                : '—';
            return (
              <div key={level.id} style={{ borderBottom: '1px solid var(--hair)' }}>
                <button
                  type="button"
                  className="row"
                  style={{ borderBottom: 0 }}
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenLevels((current) =>
                      current.includes(level.id)
                        ? current.filter((id) => id !== level.id)
                        : [...current, level.id],
                    )
                  }
                >
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
                  <span className="row-right">
                    {plural(level.spaces.length, 'space')}
                    <small>
                      {level.commonArea ? 'Not rentable' : rentLabel}
                    </small>
                  </span>
                  {isOpen ? (
                    <ChevronUp size={15} className="row-chevron" aria-hidden />
                  ) : (
                    <ChevronDown size={15} className="row-chevron" aria-hidden />
                  )}
                </button>
                <div
                  className={`accordion-panel ${isOpen ? 'is-open' : ''}`}
                  aria-hidden={!isOpen}
                  inert={!isOpen}
                >
                  <div className="accordion-panel-inner">
                    <div style={{ paddingLeft: 42 }}>
                      {level.spaces.length ? (
                        <div style={{ paddingLeft: 10 }}>
                          {level.spaces.map((space) => (
                            <button
                              key={space.id}
                              type="button"
                              className="row"
                              style={{ padding: '8px 0', borderBottom: 0 }}
                              onClick={() =>
                                setSelectedSpace({ levelId: level.id, spaceId: space.id })
                              }
                            >
                              <span className="row-main">
                                <span className="row-title" style={{ display: 'block' }}>
                                  {space.name}
                                </span>
                                <span className="row-sub" style={{ display: 'block' }}>
                                  {space.kind}
                                  {space.beds ? ` · ${plural(space.beds, 'bed')}` : ''}
                                  {space.features.length
                                    ? ` · ${plural(space.features.length, 'feature')}`
                                    : ''}
                                </span>
                              </span>
                              <span className="row-right">
                                {space.rent ? inr(space.rent.amount) : 'Not set'}
                                <small>View details</small>
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="muted" style={{ margin: '4px 0 10px' }}>
                          No spaces on this level.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="sec-head">
        <span>Charges</span>
        <button type="button" className="btn-text" onClick={() => setStep(3)}>
          Edit
        </button>
      </div>
      {draft.charges.length === 0 ? (
        <p className="muted" style={{ margin: '0 0 14px' }}>
          No charges configured.
        </p>
      ) : (
        <div className="list" style={{ marginBottom: 14 }}>
          {draft.charges.map((charge) => (
            <div className="row" key={charge.id}>
              <span className="row-main">
                <span className="row-title" style={{ display: 'block' }}>
                  {charge.name}
                </span>
                <span className="row-sub" style={{ display: 'block' }}>
                  {charge.scope.type === 'property'
                    ? 'Entire property'
                    : `${plural(charge.scope.levelIds.length, 'floor')}`}
                </span>
              </span>
              <span className="row-right">{chargeSummary(charge)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="sec-head">
        <span>Rent</span>
        <button type="button" className="btn-text" onClick={() => setStep(4)}>
          Edit
        </button>
      </div>
      <div className="list">
        <div className="row">
          <span className="row-main">
            <span className="row-title" style={{ display: 'block' }}>
              Priced spaces
            </span>
          </span>
          <span className="row-right num">
            {priced} of {units}
          </span>
        </div>
        <div className="row">
          <span className="row-main">
            <span className="row-title" style={{ display: 'block' }}>
              Not priced
            </span>
          </span>
          <span className={`row-right num ${units - priced > 0 ? 'warn-text' : ''}`}>
            {plural(Math.max(0, units - priced), 'space')}
          </span>
        </div>
        {pricedLevels.slice(0, 4).map((level) => {
          const amounts = Array.from(
            new Set(level.spaces.filter((space) => space.rent).map((space) => space.rent!.amount)),
          );
          const label =
            amounts.length === 1
              ? inr(amounts[0])
              : `${inr(Math.min(...amounts))} – ${inr(Math.max(...amounts))}`;
          return (
            <div className="row" key={level.id}>
              <span className="row-badge" style={floorColorStyle(draft.levels, level.id)}>
                {level.badge}
              </span>
              <span className="row-main">
                <span className="row-title" style={{ display: 'block', fontWeight: 600 }}>
                  {level.name}
                </span>
              </span>
              <span className="row-right num">{label}</span>
            </div>
          );
        })}
      </div>

      <p className="field-hint" style={{ marginTop: 14 }}>
        Saving stores the property with its levels, spaces, charges and rents on this device.
      </p>

      <div style={{ height: 12 }} />
      {selectedLevel && selectedUnit && (
        <SpaceReviewSheet
          propertyName={details.name}
          propertyType={details.type || 'Property'}
          propertyAddress={[
            details.address1,
            details.locality,
            details.city,
            details.pin,
          ]
            .filter(Boolean)
            .join(', ')}
          level={selectedLevel}
          levels={draft.levels}
          facilities={draft.facilities}
          space={selectedUnit}
          charges={draft.charges}
          onClose={() => setSelectedSpace(null)}
        />
      )}
    </div>
  );
}

function SpaceReviewSheet({
  propertyName,
  propertyType,
  propertyAddress,
  level,
  levels,
  facilities,
  space,
  charges,
  onClose,
}: {
  propertyName: string;
  propertyType: string;
  propertyAddress: string;
  level: Level;
  levels: Level[];
  facilities: Facility[];
  space: Space;
  charges: Charge[];
  onClose: () => void;
}) {
  const applicableCharges = charges.filter(
    (charge) => charge.scope.type === 'property' || charge.scope.levelIds.includes(level.id),
  );
  const levelFacilities = facilitiesForLevel(level, facilities);

  return (
    <Sheet title={space.name} onClose={onClose} fullHeight>
      <div className="sec-head">
        <span>Property structure</span>
      </div>
      <div className="preview-box">
        <div className="floor-context">
          <span className="row-badge" style={floorColorStyle(levels, level.id)}>
            {level.badge}
          </span>
          <span>
            <strong>{level.name}</strong>
            <small>{level.usage}</small>
          </span>
        </div>
        <PreviewRow label="Property" value={propertyName || 'Untitled property'} />
        <PreviewRow label="Property type" value={propertyType} />
        <PreviewRow label="Address" value={propertyAddress || 'Not set'} />
        <PreviewRow label="Level" value={`${level.name} · ${level.usage}`} />
        <PreviewRow label="Space" value={`${space.name} · ${space.kind}`} />
        <PreviewRow
          label="Rentable units"
          value={space.beds ? plural(space.beds, 'bed') : 'Entire space'}
        />
        <PreviewRow
          label="Rent"
          value={space.rent ? `${inr(space.rent.amount)} ${space.rent.basis}` : 'Not set'}
        />
        <PreviewRow
          label="Deposit"
          value={space.rent ? `${inr(space.rent.deposit)} · ${space.rent.depositType}` : 'Not set'}
        />
        <PreviewRow
          label="Availability"
          value={space.occupied ? space.tenant || 'Occupied' : 'Vacant'}
        />
      </div>

      <div className="sec-head" style={{ marginTop: 16 }}>
        <span>Features in this space</span>
        <span className="muted">{space.features.length}</span>
      </div>
      {space.features.length ? (
        <div className="chips">
          {space.features.map((feature) => (
            <span className="pill" key={feature}>
              {space.featureCounts?.[feature] ?? 1} × {feature}
            </span>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          No features recorded.
        </p>
      )}

      <div className="sec-head" style={{ marginTop: 16 }}>
        <span>Facilities on this level</span>
        <span className="muted">{levelFacilities.length}</span>
      </div>
      {levelFacilities.length ? (
        <div className="chips">
          {levelFacilities.map((facility) => (
            <span className="pill" key={facility.id}>
              {facility.name} · {facility.quantity}
            </span>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          No shared facilities recorded.
        </p>
      )}

      <div className="sec-head" style={{ marginTop: 16 }}>
        <span>Applicable charges</span>
        <span className="muted">{applicableCharges.length}</span>
      </div>
      {applicableCharges.length ? (
        <div className="list">
          {applicableCharges.map((charge) => (
            <div className="row" key={charge.id}>
              <span className="row-main">{charge.name}</span>
              <span className="row-right">{chargeSummary(charge)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          No charges apply.
        </p>
      )}
    </Sheet>
  );
}
