import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  iconSize?: number;
}

/**
 * Reusable empty state component.
 * Shows an icon and message when there's no content to display.
 */
export function EmptyState({ icon: Icon, message, iconSize = 32 }: EmptyStateProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '24px',
        color: 'var(--color-text-muted)',
        fontSize: '14px'
      }}
    >
      <Icon size={iconSize} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
      <p>{message}</p>
    </div>
  );
}
