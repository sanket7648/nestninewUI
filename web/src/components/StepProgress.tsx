export const STEP_LABELS = ['Details', 'Structure', 'Charges', 'Rental', 'Review'];

export function StepProgress({ step }: { step: number }) {
  return (
    <div className="progress">
      <div className="progress-head">
        <b>{STEP_LABELS[step - 1]}</b>
        <span className="num">
          Step {step} of {STEP_LABELS.length}
        </span>
      </div>
      <div className="progress-bars" role="presentation">
        {STEP_LABELS.map((label, index) => {
          const position = index + 1;
          const className =
            position === step ? 'is-current' : position < step ? 'is-done' : undefined;
          return <i key={label} className={className} />;
        })}
      </div>
    </div>
  );
}
