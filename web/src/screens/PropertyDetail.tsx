import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  FileText,
  Layers,
  Pencil,
  Receipt,
  Users,
  Wrench,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import {
  chargeSummary,
  facilitiesForLevel,
  floorColorStyle,
  levelSummary,
  totalOccupied,
  totalPriced,
  totalUnits,
} from '../lib/model';
import { inr, plural } from '../lib/format';
import { Sheet } from '../components/Sheet';
import { EmptyState, Meter, Pager, StatGrid } from '../components/primitives';
import type { Level, Property } from '../types';

const TABS = ['Overview', 'Structure', 'Tenants', 'Finance', 'Maintenance', 'Documents'] as const;
type Tab = (typeof TABS)[number];

const levelPriceLabel = (level: Level) => {
  const amounts = Array.from(
    new Set(level.spaces.filter((space) => space.rent).map((space) => space.rent!.amount)),
  );
  if (amounts.length === 0) return level.spaces.length ? 'Not set' : '—';
  if (amounts.length === 1) return inr(amounts[0]);
  return `${inr(Math.min(...amounts))} – ${inr(Math.max(...amounts))}`;
};

export default function PropertyDetail({ propertyId }: { propertyId: string }) {
  const { properties, openList, editProperty } = useApp();
  const property = properties.find((item) => item.id === propertyId);
  const [tab, setTab] = useState<Tab>('Overview');
  const [floorSheet, setFloorSheet] = useState<string | null>(null);
  const [spaceSheet, setSpaceSheet] = useState<{ levelId: string; spaceId: string } | null>(null);

  useEffect(() => {
    if (!property) openList();
  }, [property, openList]);

  if (!property) return null;

  const units = totalUnits(property.levels);
  const occupied = totalOccupied(property.levels);
  const priced = totalPriced(property.levels);
  return (
    <>
      <header className="topbar">
        <button type="button" className="iconbtn" onClick={openList} aria-label="Back to properties">
          <ArrowLeft size={19} aria-hidden />
        </button>
        <h1>{property.details.name}</h1>
        <button
          type="button"
          className="iconbtn"
          aria-label="Edit property"
          onClick={() => editProperty(property.id)}
        >
          <Pencil size={17} aria-hidden />
        </button>
      </header>

      {property.details.photos[0] ? (
        <img
          src={property.details.photos[0]}
          alt={`${property.details.name} exterior`}
          style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div
          style={{
            height: 140,
            background: 'linear-gradient(135deg,#dceee7,#eef7f3)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--teal)',
          }}
        >
          <Building2 size={30} aria-hidden />
        </div>
      )}

      <div className="page page-wide" style={{ paddingTop: 12 }}>
        <div className="h3" style={{ fontSize: 20 }}>
          {property.details.name}
        </div>
        <div className="row-sub" style={{ marginTop: 6 }}>
          {property.details.type || 'Property'}
        </div>
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            gap: 6,
            alignItems: 'flex-start',
            fontSize: 11.5,
            fontWeight: 600,
            color: 'var(--ink-2)',
          }}
        >
          {[
            property.details.address1,
            property.details.locality,
            property.details.city,
            property.details.pin,
          ]
            .filter(Boolean)
            .join(', ')}
        </div>

        <div className="tab-strip" role="tablist" aria-label="Property sections" style={{ marginTop: 14 }}>
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              className="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
            >
              {name}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          {tab === 'Overview' && (
            <div className="stack">
              <StatGrid
                items={[
                  { value: property.levels.length, label: 'levels' },
                  { value: units, label: 'rental spaces' },
                  { value: occupied, label: 'occupied' },
                  { value: Math.max(0, units - occupied), label: 'vacant' },
                ]}
              />

              <div>
                <div className="sec-head">
                  <span>Property facilities</span>
                  <span className="muted">{property.facilities.length}</span>
                </div>
                {property.facilities.length ? (
                  <div className="chips">
                    {property.facilities.map((facility) => (
                      <span className="pill" key={facility.id}>
                        <Check size={11} aria-hidden />
                        {facility.name} · {facility.quantity ?? 1}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="muted" style={{ margin: 0 }}>
                    No property-wide facilities recorded.
                  </p>
                )}
              </div>

              <div>
                <div className="sec-head">
                  <span>Rent configured</span>
                  <span className="muted num">
                    {priced} / {units}
                  </span>
                </div>
                <Meter
                  value={priced}
                  total={units}
                  left={`${priced} of ${units} spaces priced`}
                  right={`${Math.max(0, units - priced)} unpriced`}
                />
              </div>

              <div>
                <div className="sec-head">
                  <span>Charges</span>
                  <span className="muted">{property.charges.length}</span>
                </div>
                {property.charges.length ? (
                  <div className="list">
                    {property.charges.map((charge) => (
                      <div className="row" key={charge.id}>
                        <span className="row-main">
                          <span className="row-title" style={{ display: 'block' }}>
                            {charge.name}
                          </span>
                          <span className="row-sub" style={{ display: 'block' }}>
                            {charge.scope.type === 'property'
                              ? 'Entire property'
                              : `${charge.scope.levelIds.length} levels`}
                          </span>
                        </span>
                        <span className="row-right">{chargeSummary(charge)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted" style={{ margin: 0 }}>
                    No charges recorded.
                  </p>
                )}
              </div>
            </div>
          )}

          {tab === 'Structure' && (
            <div className="stack">
              <div className="sec-head">
                <span>Levels and areas</span>
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => editProperty(property.id)}
                >
                  Edit structure
                </button>
              </div>

              {property.levels.length === 0 ? (
                <EmptyState
                  icon={<Layers size={22} aria-hidden />}
                  title="No levels yet"
                  description="Add levels and areas from the Add Property flow."
                />
              ) : (
                <div className="list">
                  {property.levels.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      className="row"
                      onClick={() => setFloorSheet(level.id)}
                    >
                      <span
                        className="row-badge"
                        style={floorColorStyle(property.levels, level.id)}
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
                      <span className="row-right">
                        {levelSummary(level)}
                        <small>{levelPriceLabel(level)}</small>
                      </span>
                      <ChevronRight size={15} className="row-chevron" aria-hidden />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'Tenants' && (
            <EmptyState
              icon={<Users size={22} aria-hidden />}
              title="No tenant records"
              description="Tenants are assigned per space once leases are created. Spaces here are ready for assignment."
            />
          )}

          {tab === 'Finance' && (
            <EmptyState
              icon={<Receipt size={22} aria-hidden />}
              title="No invoices yet"
              description="Rent and charges from this property will appear here once they are billed."
            />
          )}

          {tab === 'Maintenance' && (
            <EmptyState
              icon={<Wrench size={22} aria-hidden />}
              title="No maintenance requests"
              description="Requests raised by tenants will appear here."
            />
          )}

          {tab === 'Documents' && (
            <EmptyState
              icon={<FileText size={22} aria-hidden />}
              title="No documents"
              description="Agreements and property papers you upload will be listed here."
            />
          )}
        </div>

        <div style={{ height: 28 }} />
      </div>

      {floorSheet && (
        <FloorSheet
          property={property}
          levelId={floorSheet}
          onClose={() => setFloorSheet(null)}
          onOpenSpace={(spaceId) => setSpaceSheet({ levelId: floorSheet, spaceId })}
        />
      )}

      {spaceSheet && (
        <SpaceSheet
          property={property}
          levelId={spaceSheet.levelId}
          spaceId={spaceSheet.spaceId}
          onClose={() => setSpaceSheet(null)}
        />
      )}
    </>
  );
}

function FloorSheet({
  property,
  levelId,
  onClose,
  onOpenSpace,
}: {
  property: Property;
  levelId: string;
  onClose: () => void;
  onOpenSpace: (spaceId: string) => void;
}) {
  const level = property.levels.find((item) => item.id === levelId);
  const [page, setPage] = useState(0);
  const pageSize = 8;

  if (!level) return null;

  const visible = level.spaces.slice(page * pageSize, page * pageSize + pageSize);
  const levelFacilities = facilitiesForLevel(level, property.facilities);

  return (
    <Sheet title={level.name} onClose={onClose} fullHeight>
      <div className="floor-context">
        <span className="row-badge" style={floorColorStyle(property.levels, level.id)}>
          {level.badge}
        </span>
        <span>
          <strong>{level.name}</strong>
          <small>{level.usage}</small>
        </span>
      </div>
      <p className="muted" style={{ margin: '0 0 10px' }}>
        {level.usage} · {levelSummary(level)}
      </p>
      {levelFacilities.length > 0 && (
        <div className="chips" style={{ marginBottom: 12 }}>
          {levelFacilities.map((facility) => (
            <span className="pill" key={facility.id}>
              {facility.name}
              {facility.scope === 'property' && ` · ${facility.quantity}`}
            </span>
          ))}
        </div>
      )}
      <div className="list">
        {visible.map((space) => (
          <button
            key={space.id}
            type="button"
            className="row"
            onClick={() => onOpenSpace(space.id)}
          >
            <span className="row-main">
              <span className="row-title" style={{ display: 'block' }}>
                {space.name}
              </span>
              <span className="row-sub" style={{ display: 'block' }}>
                {space.beds ? `${space.kind}, ${plural(space.beds, 'bed')}` : space.kind}
              </span>
            </span>
            <span className="row-right">
              {space.rent ? inr(space.rent.amount) : 'Not set'}
              <small>{space.occupied ? (space.tenant ?? 'Occupied') : 'Vacant'}</small>
            </span>
            <ChevronRight size={15} className="row-chevron" aria-hidden />
          </button>
        ))}
      </div>
      <Pager page={page} pageSize={pageSize} total={level.spaces.length} onPage={setPage} unit="spaces" />
    </Sheet>
  );
}

function SpaceSheet({
  property,
  levelId,
  spaceId,
  onClose,
}: {
  property: Property;
  levelId: string;
  spaceId: string;
  onClose: () => void;
}) {
  const level = property.levels.find((item) => item.id === levelId);
  const space = level?.spaces.find((item) => item.id === spaceId);

  if (!level || !space) return null;

  const applicableCharges = property.charges.filter(
    (charge) => charge.scope.type === 'property' || charge.scope.levelIds.includes(level.id),
  );

  return (
    <Sheet title={space.name} onClose={onClose}>
      <div className="row-inline" style={{ marginBottom: 12 }}>
        <span className="pill">
          <Check size={11} aria-hidden />
          {space.occupied ? (space.tenant ?? 'Occupied') : 'Vacant'}
        </span>
        <span className="row-badge" style={floorColorStyle(property.levels, level.id)}>
          {level.badge}
        </span>
        <span className="muted">{level.name} · {level.usage}</span>
      </div>

      <StatGrid
        columns={3}
        items={[
          { value: space.beds ?? 1, label: space.beds ? 'beds' : 'unit' },
          { value: space.rent ? inr(space.rent.amount) : '—', label: space.rent?.basis ?? 'rent' },
          { value: space.rent ? inr(space.rent.deposit) : '—', label: 'deposit' },
        ]}
      />

      <div className="sec-head" style={{ marginTop: 16 }}>
        <span>Features</span>
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
        <span>Charges that apply</span>
      </div>
      {applicableCharges.length ? (
        <div className="list">
          {applicableCharges.map((charge) => (
            <div className="row" key={charge.id}>
              <span className="row-main">
                <span className="row-title" style={{ display: 'block' }}>
                  {charge.name}
                </span>
              </span>
              <span className="row-right">{chargeSummary(charge)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          No charges configured.
        </p>
      )}
    </Sheet>
  );
}
