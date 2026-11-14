import { useId } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

/* ------------------------------ fields ------------------------------ */

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function Field({ label, required, hint, error, htmlFor, children }: FieldProps) {
  return (
    <div className="field">
      <label className="label" htmlFor={htmlFor}>
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {children}
      {hint && !error && <div className="field-hint">{hint}</div>}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'decimal';
  type?: string;
  maxLength?: number;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  hint,
  inputMode = 'text',
  type = 'text',
  maxLength,
}: TextFieldProps) {
  const id = useId();
  return (
    <Field label={label} required={required} error={error} hint={hint} htmlFor={id}>
      <input
        id={id}
        className="input"
        type={type}
        inputMode={inputMode}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
}

export function SelectField({ label, value, onChange, options, required, error }: SelectFieldProps) {
  const id = useId();
  return (
    <Field label={label} required={required} error={error} htmlFor={id}>
      <select
        id={id}
        className="select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  hint?: string;
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  hint,
}: TextAreaFieldProps) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <textarea
        id={id}
        className="textarea"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

/* ------------------------------- chips ------------------------------ */

interface ChipsProps {
  options: string[];
  selected: string | string[];
  onSelect: (value: string) => void;
  label?: string;
}

export function Chips({ options, selected, onSelect, label }: ChipsProps) {
  const isOn = (option: string) =>
    Array.isArray(selected) ? selected.includes(option) : selected === option;

  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="chip"
          aria-pressed={isOn(option)}
          onClick={() => onSelect(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- rows ------------------------------- */

interface ListRowProps {
  badge?: string;
  title: string;
  sub?: string;
  right?: ReactNode;
  rightSub?: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  subtle?: boolean;
}

export function ListRow({
  badge,
  title,
  sub,
  right,
  rightSub,
  onClick,
  chevron = true,
  subtle,
}: ListRowProps) {
  const body = (
    <>
      {badge && <span className="row-badge">{badge}</span>}
      <span className="row-main">
        <span className="row-title" style={{ display: 'block' }}>
          {title}
        </span>
        {sub && (
          <span className="row-sub" style={{ display: 'block' }}>
            {sub}
          </span>
        )}
      </span>
      {(right || rightSub) && (
        <span className="row-right" style={subtle ? { color: 'var(--ink-4)', fontWeight: 600 } : undefined}>
          {right}
          {rightSub && <small>{rightSub}</small>}
        </span>
      )}
      {chevron && onClick && <ChevronRight size={15} className="row-chevron" aria-hidden />}
    </>
  );

  if (!onClick) return <div className="row">{body}</div>;

  return (
    <button type="button" className="row" onClick={onClick}>
      {body}
    </button>
  );
}

/* ------------------------------ stats ------------------------------- */

export function StatGrid({
  items,
  columns = 2,
}: {
  items: { value: ReactNode; label: string }[];
  columns?: number;
}) {
  return (
    <div className="stat-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {items.map((item) => (
        <div className="stat" key={item.label}>
          <b>{item.value}</b>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Meter({
  value,
  total,
  left,
  right,
}: {
  value: number;
  total: number;
  left: string;
  right?: string;
}) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((value / total) * 100));
  return (
    <div>
      <div className="meter">
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="meter-line">
        <span>{left}</span>
        {right && <span>{right}</span>}
      </div>
    </div>
  );
}

/* ---------------------------- search, pager -------------------------- */

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="search">
      <Search size={16} aria-hidden />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function Pager({
  page,
  pageSize,
  total,
  onPage,
  unit,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  unit: string;
}) {
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pager">
      <span>
        {from}–{to} of {total} {unit}
      </span>
      <span className="pager-btns">
        <button
          type="button"
          className="pager-btn"
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} aria-hidden />
        </button>
        <button
          type="button"
          className="pager-btn"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages - 1}
          aria-label="Next page"
        >
          <ChevronRight size={14} aria-hidden />
        </button>
      </span>
    </div>
  );
}

/* ------------------------------ misc -------------------------------- */

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="toggle"
      onClick={() => onChange(!checked)}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon}</span>
      <div className="h3" style={{ fontSize: 15 }}>
        {title}
      </div>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function PreviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="preview-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
