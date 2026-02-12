import { Layers, Dot, Grid2x2, Boxes } from 'lucide-react';
import type { GroupingMode } from '../hooks/useMarkerGroups';

const MODES: { mode: GroupingMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'off', label: 'Off', icon: <Dot size={14} /> },
  { mode: 'location', label: 'Location', icon: <Grid2x2 size={14} /> },
  { mode: 'location+proximity', label: 'Proximity', icon: <Layers size={14} /> },
  { mode: 'cluster', label: 'Cluster', icon: <Boxes size={14} /> },
];

interface DevGroupingToggleProps {
  mode: GroupingMode;
  onChange: (mode: GroupingMode) => void;
}

export function DevGroupingToggle({ mode, onChange }: DevGroupingToggleProps) {
  const currentIndex = MODES.findIndex(m => m.mode === mode);
  const current = MODES[currentIndex] || MODES[0];

  const handleClick = () => {
    const nextIndex = (currentIndex + 1) % MODES.length;
    onChange(MODES[nextIndex].mode);
  };

  return (
    <button
      onClick={handleClick}
      title={`Grouping: ${current.label} (click to cycle)`}
      style={{
        position: 'absolute',
        bottom: '110px',
        left: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'var(--glass-bg-dark)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border-light)',
        borderRadius: '20px',
        color: mode === 'off' ? 'var(--color-text-muted)' : 'var(--color-primary)',
        fontSize: '11px',
        fontWeight: 600,
        cursor: 'pointer',
        zIndex: 10,
        transition: 'all 0.15s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {current.icon}
      {current.label}
    </button>
  );
}
