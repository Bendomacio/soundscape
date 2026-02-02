import { User } from 'lucide-react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  size?: number;
  bgColor?: string;
  showFallbackIcon?: boolean;
}

/**
 * Reusable user avatar component.
 * Shows avatar image, or falls back to initial letter or user icon.
 */
export function UserAvatar({
  avatarUrl,
  displayName,
  email,
  size = 32,
  bgColor = 'var(--color-primary)',
  showFallbackIcon = false
}: UserAvatarProps) {
  const initial = (displayName || email)?.charAt(0).toUpperCase();

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden'
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : showFallbackIcon ? (
        <User size={size * 0.5} style={{ color: 'var(--color-text-muted)' }} />
      ) : initial ? (
        <span style={{ fontSize: `${size * 0.45}px`, fontWeight: 600 }}>
          {initial}
        </span>
      ) : (
        <User size={size * 0.5} style={{ color: 'var(--color-text-muted)' }} />
      )}
    </div>
  );
}
