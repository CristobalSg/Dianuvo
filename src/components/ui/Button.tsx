import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  full?: boolean;
}

export function Button({ children, variant = 'primary', full, className = '', ...props }: ButtonProps) {
  return (
    <button className={`button button-${variant} ${full ? 'button-full' : ''} ${className}`} {...props}>
      {children}
    </button>
  );
}
