import { MapPin, Target } from 'lucide-react';

interface RadiusSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  songCount: number;
}

export function RadiusSlider({ value, min, max, onChange, songCount }: RadiusSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div 
      style={{
        position: 'absolute',
        top: '80px',
        left: '16px',
        width: '280px',
        background: 'var(--color-dark-card)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid var(--color-dark-lighter)',
        zIndex: 20
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Target size={18} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>Discovery Radius</h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, whiteSpace: 'nowrap' }}>
              {songCount} {songCount === 1 ? 'song' : 'songs'} nearby
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>{value}</span>
          <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}> km</span>
        </div>
      </div>

      {/* Slider */}
      <div style={{ position: 'relative', marginTop: '16px', height: '20px' }}>
        {/* Track background */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '6px',
          transform: 'translateY(-50%)',
          background: 'var(--color-dark-lighter)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          {/* Track fill */}
          <div style={{
            height: '100%',
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
            borderRadius: '3px',
            transition: 'width 150ms ease'
          }} />
        </div>
        
        {/* Hidden range input */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0
          }}
        />
        
        {/* Thumb */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: `${percentage}%`,
          width: '18px',
          height: '18px',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          border: '3px solid var(--color-primary)',
          pointerEvents: 'none',
          transition: 'left 150ms ease'
        }} />
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={12} /> Nearby
        </span>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>City-wide</span>
      </div>
    </div>
  );
}
