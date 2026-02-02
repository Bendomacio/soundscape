import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable loading spinner component.
 * Wraps the Lucide Loader2 icon with consistent animation.
 */
export function LoadingSpinner({ size = 24, className = '', style }: LoadingSpinnerProps) {
  return (
    <Loader2
      size={size}
      className={`animate-spin ${className}`}
      style={style}
    />
  );
}
