import {
  Building2,
  FileText,
  Home,
  LayoutGrid,
  Receipt,
  Settings2,
  Users,
  Wrench,
} from 'lucide-react';
import { useApp } from '../state/AppContext';

const ITEMS = [
  { label: 'Dashboard', icon: LayoutGrid },
  { label: 'Properties', icon: Building2, current: true },
  { label: 'Tenants', icon: Users },
  { label: 'Leases', icon: FileText },
  { label: 'Finance', icon: Receipt },
  { label: 'Maintenance', icon: Wrench },
];

export function Sidebar() {
  const { openList } = useApp();

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand">
        <span className="brand-mark" aria-hidden>
          <Home size={16} />
        </span>
        <span className="brand-name">nestni</span>
      </div>
      <nav className="nav">
        {ITEMS.map(({ label, icon: Icon, current }) => (
          <button
            key={label}
            type="button"
            className="nav-item"
            aria-current={current ? 'page' : undefined}
            onClick={current ? openList : undefined}
            disabled={!current}
            title={current ? undefined : 'Not part of this prototype'}
          >
            <Icon size={17} aria-hidden />
            {label}
          </button>
        ))}
      </nav>
      <div className="nav-group">Workspace</div>
      <nav className="nav">
        <button type="button" className="nav-item" disabled title="Not part of this prototype">
          <Settings2 size={17} aria-hidden />
          Settings
        </button>
      </nav>
      <div className="nav-user">
        <img src="https://i.pravatar.cc/56?u=rajesh.kulkarni" alt="" />
        <div>
          <b style={{ display: 'block', fontSize: 12.5, fontWeight: 700 }}>Rajesh Kulkarni</b>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)' }}>
            Owner account
          </span>
        </div>
      </div>
    </aside>
  );
}
