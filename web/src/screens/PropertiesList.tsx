import { useMemo, useState } from 'react';
import { Building2, FilePenLine, ListFilter, MoreHorizontal, Plus, Search } from 'lucide-react';
import { useApp } from '../state/AppContext';
import type { Property } from '../types';
import { PROPERTY_TYPES } from '../types';
import { totalOccupied, totalUnits } from '../lib/model';
import { plural } from '../lib/format';
import { Sheet } from '../components/Sheet';
import { EmptyState } from '../components/primitives';

const metrics = (property: Property) => {
  const units = totalUnits(property.levels);
  const occupied = totalOccupied(property.levels);
  return {
    levels: property.levels.length,
    units,
    occupied,
    vacant: Math.max(0, units - occupied),
  };
};

export default function PropertiesList() {
  const {
    properties,
    draft,
    resumeDraft,
    startNewProperty,
    openProperty,
    editProperty,
    deleteProperty,
    notify,
  } = useApp();

  const [query, setQuery] = useState('');
  const [actionsFor, setActionsFor] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState<Property | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [occupancy, setOccupancy] = useState('All');
  const [sort, setSort] = useState('Recently added');

  const totals = useMemo(() => {
    return properties.reduce(
      (acc, property) => {
        const m = metrics(property);
        return {
          units: acc.units + m.units,
          occupied: acc.occupied + m.occupied,
          vacant: acc.vacant + m.vacant,
        };
      },
      { units: 0, occupied: 0, vacant: 0 },
    );
  }, [properties]);

  const visible = useMemo(() => {
    let list = properties.filter((property) => {
      const haystack = `${property.details.name} ${property.details.type} ${property.details.locality} ${property.details.city}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });

    if (typeFilter !== 'All') list = list.filter((p) => p.details.type === typeFilter);

    if (occupancy !== 'All') {
      list = list.filter((property) => {
        const m = metrics(property);
        return occupancy === 'Has vacancy' ? m.vacant > 0 : m.vacant === 0;
      });
    }

    return [...list].sort((a, b) => {
      if (sort === 'Name') return a.details.name.localeCompare(b.details.name);
      if (sort === 'Vacant spaces') return metrics(b).vacant - metrics(a).vacant;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [properties, query, typeFilter, occupancy, sort]);

  return (
    <>
      <header
        className="properties-header"
      >
        <h1 className="h1">Properties</h1>
        <button
          type="button"
          className="btn btn-primary"
          style={{ height: 36, padding: '0 13px', fontSize: 12.5 }}
          onClick={startNewProperty}
        >
          <Plus size={14} aria-hidden />
          Add
        </button>
      </header>

      <section className="page page-wide" aria-label="Saved properties">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div className="search" style={{ flex: 1 }}>
            <Search size={16} aria-hidden />
            <input
              type="search"
              value={query}
              placeholder="Search properties"
              aria-label="Search properties"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: 44, height: 44, padding: 0 }}
            aria-label="Filter properties"
            onClick={() => setFilterOpen(true)}
          >
            <ListFilter size={17} aria-hidden />
          </button>
        </div>

        <div className="card" style={{ display: 'flex', marginBottom: 13 }}>
          {[
            { value: properties.length, label: 'properties' },
            { value: totals.units, label: 'spaces' },
            { value: totals.occupied, label: 'occupied' },
            { value: totals.vacant, label: 'vacant' },
          ].map((item, index) => (
            <div
              key={item.label}
              style={{
                flex: 1,
                padding: '9px 10px',
                borderLeft: index === 0 ? undefined : '1px solid var(--hair)',
              }}
            >
              <b
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {item.value}
              </b>
              <span
                style={{ display: 'block', marginTop: 5, fontSize: 9.5, fontWeight: 600, color: 'var(--ink-3)' }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {draft && (
          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 11,
              marginBottom: 12,
              borderColor: 'var(--teal-line)',
              background: '#f4faf8',
            }}
          >
            <span className="row-badge" style={{ color: 'var(--teal)' }}>
              <FilePenLine size={16} aria-hidden />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="row-title" style={{ display: 'block' }}>
                Unfinished property
              </span>
              <span className="row-sub" style={{ display: 'block' }}>
                {draft.details.name || 'Untitled'}, step {draft.step} of 5
              </span>
            </span>
            <button
              type="button"
              className="btn btn-soft"
              style={{ height: 36, padding: '0 12px', fontSize: 12.5 }}
              onClick={resumeDraft}
            >
              Continue
            </button>
          </div>
        )}

        {visible.length === 0 ? (
          <EmptyState
            icon={<Building2 size={22} aria-hidden />}
            title={properties.length === 0 ? 'No properties yet' : 'No properties match'}
            description={
              properties.length === 0
                ? 'Add a property, describe its levels, and Nestni builds the rental spaces for you.'
                : 'Clear the search or filters to see your properties again.'
            }
            action={
              properties.length === 0 ? (
                <button type="button" className="btn btn-primary" onClick={startNewProperty}>
                  <Plus size={15} aria-hidden />
                  Add property
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setQuery('');
                    setTypeFilter('All');
                    setOccupancy('All');
                  }}
                >
                  Clear filters
                </button>
              )
            }
          />
        ) : (
          <div className="stack-sm">
            {visible.map((property) => {
              const m = metrics(property);
              return (
                <article
                  key={property.id}
                  className="card"
                  style={{ position: 'relative', padding: 11, paddingRight: 40 }}
                >
                  <button
                    type="button"
                    onClick={() => openProperty(property.id)}
                    style={{
                      all: 'unset',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                  >
                    {property.details.photos[0] ? (
                      <img
                        src={property.details.photos[0]}
                        alt=""
                        style={{ width: 56, height: 56, borderRadius: 11, objectFit: 'cover', flex: '0 0 56px' }}
                      />
                    ) : (
                      <span
                        className="row-badge"
                        style={{ width: 56, height: 56, flex: '0 0 56px', color: 'var(--teal)' }}
                      >
                        <Building2 size={20} aria-hidden />
                      </span>
                    )}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="row-title" style={{ display: 'block', fontSize: 14, fontWeight: 800 }}>
                        {property.details.name}
                      </span>
                      <span className="row-sub" style={{ display: 'block' }}>
                        {[property.details.type, property.details.locality, property.details.city]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                      <span
                        className="row-sub num"
                        style={{ display: 'block', color: '#3c5966' }}
                      >
                        {plural(m.levels, 'level')}, {plural(m.units, 'space')}, {m.occupied} occupied,{' '}
                        {m.vacant} vacant
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="iconbtn"
                    style={{ position: 'absolute', top: 6, right: 4, width: 32, height: 32 }}
                    aria-label={`Actions for ${property.details.name}`}
                    onClick={() => setActionsFor(property)}
                  >
                    <MoreHorizontal size={18} aria-hidden />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {actionsFor && (
        <Sheet title={actionsFor.details.name} onClose={() => setActionsFor(null)}>
          <button
            type="button"
            className="action-row"
            onClick={() => {
              openProperty(actionsFor.id);
              setActionsFor(null);
            }}
          >
            <Building2 size={18} className="action-icon" aria-hidden />
            <span>View property</span>
          </button>
          <button
            type="button"
            className="action-row"
            onClick={() => {
              editProperty(actionsFor.id);
              setActionsFor(null);
            }}
          >
            <MoreHorizontal size={18} className="action-icon" aria-hidden />
            <span>Edit property</span>
          </button>
          <button
            type="button"
            className="action-row"
            onClick={() => notify('Tenant management is not built in this prototype')}
          >
            <span>Manage tenants</span>
          </button>
          <button
            type="button"
            className="action-row"
            onClick={() => notify('Lease management is not built in this prototype')}
          >
            <span>Manage leases</span>
          </button>
          <button
            type="button"
            className="action-row"
            onClick={() => notify('Finances are not built in this prototype')}
          >
            <span>View finances</span>
          </button>
          <button
            type="button"
            className="action-row is-danger"
            onClick={() => {
              setDeleting(actionsFor);
              setActionsFor(null);
            }}
          >
            <span>Delete property</span>
          </button>
        </Sheet>
      )}

      {deleting && (
        <Sheet
          title="Delete property?"
          onClose={() => setDeleting(null)}
          footer={
            <div style={{ display: 'flex', gap: 9 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, background: 'var(--danger)' }}
                onClick={() => {
                  deleteProperty(deleting.id);
                  setDeleting(null);
                }}
              >
                Delete
              </button>
            </div>
          }
        >
          <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
            {deleting.details.name} and every level, space and rent setting in it will be removed from
            this browser.
          </p>
        </Sheet>
      )}

      {filterOpen && (
        <Sheet
          title="Filter"
          onClose={() => setFilterOpen(false)}
          footer={
            <div style={{ display: 'flex', gap: 9 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: '0 0 86px' }}
                onClick={() => {
                  setTypeFilter('All');
                  setOccupancy('All');
                  setSort('Recently added');
                }}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => setFilterOpen(false)}
              >
                Show {visible.length} {visible.length === 1 ? 'property' : 'properties'}
              </button>
            </div>
          }
        >
          <div className="label" style={{ marginTop: 10 }}>
            Property type
          </div>
          <div className="chips">
            {['All', ...PROPERTY_TYPES].map((type) => (
              <button
                key={type}
                type="button"
                className="chip"
                aria-pressed={typeFilter === type}
                onClick={() => setTypeFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="label" style={{ marginTop: 16 }}>
            Occupancy
          </div>
          <div className="tabs">
            {['All', 'Has vacancy', 'Fully occupied'].map((option) => (
              <button
                key={option}
                type="button"
                className="tab"
                aria-selected={occupancy === option}
                onClick={() => setOccupancy(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="label" style={{ marginTop: 16 }}>
            Sort by
          </div>
          {['Recently added', 'Name', 'Vacant spaces'].map((option) => (
            <button
              key={option}
              type="button"
              className="opt-row"
              onClick={() => setSort(option)}
              aria-pressed={sort === option}
            >
              <span className="opt-main opt-title">{option}</span>
              <span className={`rad ${sort === option ? 'is-on' : ''}`} aria-hidden />
            </button>
          ))}
        </Sheet>
      )}
    </>
  );
}
