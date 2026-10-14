import type { CSSProperties } from 'react';

type BrandVariant = 'default' | 'light';

interface BrandLogoProps {
  size?: number;
  variant?: BrandVariant;
  showText?: boolean;
  className?: string;
  alt?: string;
}

export function BrandLogo({
  size = 36,
  variant = 'default',
  showText = true,
  className = '',
  alt = 'Dianuvo',
}: BrandLogoProps) {
  const source = variant === 'light'
    ? '/brand/logo-symbol-light.svg'
    : '/brand/logo-symbol.svg';
  const style = { '--brand-logo-size': `${size}px` } as CSSProperties;

  return (
    <span
      className={`brand-logo brand-logo-${variant} ${className}`.trim()}
      style={style}
      role={showText ? 'img' : undefined}
      aria-label={showText ? alt : undefined}
    >
      <img className="brand-symbol" src={source} alt={showText ? '' : alt} aria-hidden={showText || undefined} />
      {showText && <span className="brand-wordmark" aria-hidden="true">Dianuvo</span>}
    </span>
  );
}
