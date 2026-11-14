import { useEffect, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { StepProgress, STEP_LABELS } from '../../components/StepProgress';
import StepDetails from './StepDetails';
import StepStructure, {
  FacilitiesScreen,
  FloorEditorScreen,
  RangeScreen,
} from './StepStructure';
import StepCharges from './StepCharges';
import StepRentals from './StepRentals';
import StepReview from './StepReview';
import { totalPriced, totalUnits } from '../../lib/model';

type Sub =
  | { kind: 'floor'; levelId: string; title: string }
  | { kind: 'range'; levelIds: string[]; title: string }
  | { kind: 'facilities' };

export default function Wizard() {
  const { draft, setStep, openList, openProperty, notify, createProperty } = useApp();
  const [sub, setSub] = useState<Sub | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const step = draft?.step ?? 1;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, sub]);

  if (createdId) return <CreatedScreen propertyId={createdId} />;
  if (!draft) return <RedirectToList />;

  const levelTitle = (levelId: string) =>
    draft.levels.find((level) => level.id === levelId)?.name ?? 'Floor';

  /** Footer "Back" walks the wizard; the top arrow leaves the flow (the draft is kept). */
  const goBack = () => {
    if (sub) {
      setSub(null);
      return;
    }
    if (step > 1) {
      setStep(step - 1);
      return;
    }
    openList();
  };

  const saveEditingProperty = () => {
    const id = createProperty();
    if (!id) {
      notify('Add a property name and type before saving');
      return;
    }
    notify('Property updated');
    openProperty(id);
  };

  const handleContinue = () => {
    if (step === 1) {
      if (!draft.details.name.trim() || !draft.details.type) {
        setShowErrors(true);
        notify('Add a property name and type to continue');
        return;
      }
    }
    if (step === 2 && draft.levels.length === 0) {
      notify('Add at least one level or area');
      return;
    }
    if (step === 5) {
      if (draft.editingId) {
        saveEditingProperty();
        return;
      }
      const id = createProperty();
      if (!id) {
        notify('Add a property name and type before saving');
        return;
      }
      setCreatedId(id);
      return;
    }
    setStep(step + 1);
  };

  const title = sub
    ? sub.kind === 'floor'
      ? levelTitle(sub.levelId)
      : sub.kind === 'range'
        ? sub.title
        : 'Common facilities'
    : 'Add property';

  return (
    <>
      <header className="topbar">
        <button
          type="button"
          className="iconbtn"
          onClick={() => (sub ? setSub(null) : openList())}
          aria-label={sub ? 'Back' : 'Close add property'}
        >
          <ArrowLeft size={19} aria-hidden />
        </button>
        <h1>{title}</h1>
        {(!sub || draft.editingId) && (
          <button
            type="button"
            className="topbar-action"
            onClick={() =>
              draft.editingId
                ? saveEditingProperty()
                : notify('Draft saved on this device')
            }
          >
            {draft.editingId ? 'Save changes' : 'Save draft'}
          </button>
        )}
      </header>

      {!sub && <StepProgress step={step} />}

      <div style={{ flex: 1 }}>
        {sub?.kind === 'floor' && <FloorEditorScreen levelId={sub.levelId} />}

        {sub?.kind === 'range' && (
          <RangeScreen
            levelIds={sub.levelIds}
            onDone={() => setSub(null)}
          />
        )}

        {sub?.kind === 'facilities' && <FacilitiesScreen />}

        {!sub && step === 1 && <StepDetails showErrors={showErrors} />}
        {!sub && step === 2 && (
          <StepStructure
            onOpenFloor={(levelId) => setSub({ kind: 'floor', levelId, title: levelTitle(levelId) })}
            onOpenRange={(levelIds) =>
              setSub({ kind: 'range', levelIds, title: 'Copy floor configuration' })
            }
            onOpenFacilities={() => setSub({ kind: 'facilities' })}
          />
        )}
        {!sub && step === 3 && <StepCharges />}
        {!sub && step === 4 && <StepRentals />}
        {!sub && step === 5 && <StepReview />}
      </div>

      {!sub && (
        <div className="cta-bar">
          <button type="button" className="btn btn-ghost" onClick={goBack}>
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleContinue}>
            {step === 5
              ? draft.editingId
                ? 'Save changes'
                : 'Save & create property'
              : 'Continue'}
          </button>
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        Step {step} of {STEP_LABELS.length}: {STEP_LABELS[step - 1]}
      </span>
    </>
  );
}

function RedirectToList() {
  const { openList } = useApp();
  useEffect(() => {
    openList();
  }, [openList]);
  return null;
}

function CreatedScreen({ propertyId }: { propertyId: string }) {
  const { properties, openList, openProperty } = useApp();
  const property = properties.find((item) => item.id === propertyId);

  if (!property) return <RedirectToList />;

  const units = totalUnits(property.levels);
  const priced = totalPriced(property.levels);

  return (
    <>
      <div
        className="page"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          minHeight: '66dvh',
          paddingTop: 32,
        }}
      >
        <span
          style={{
            width: 74,
            height: 74,
            borderRadius: '50%',
            background: 'var(--teal-tint)',
            color: 'var(--teal-dark)',
            display: 'grid',
            placeItems: 'center',
            marginBottom: 22,
          }}
        >
          <Check size={34} aria-hidden />
        </span>
        <div className="h1">Property created</div>
        <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: 'var(--teal-dark)' }}>
          {property.details.name}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 26,
            marginTop: 26,
            paddingTop: 20,
            borderTop: '1px solid var(--hair)',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          {[
            { value: property.levels.length, label: 'levels' },
            { value: units, label: 'spaces' },
            { value: priced, label: 'priced' },
          ].map((item) => (
            <div key={item.label}>
              <b style={{ fontSize: 17, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                {item.value}
              </b>
              <span
                style={{
                  display: 'block',
                  marginTop: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--ink-3)',
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 22, maxWidth: 280 }}>
          Saved on this device. It now appears in Properties with its full structure.
        </p>
      </div>
      <div className="cta-bar">
        <button type="button" className="btn btn-ghost" onClick={openList}>
          Properties
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => openProperty(property.id)}
        >
          View property
        </button>
      </div>
    </>
  );
}
