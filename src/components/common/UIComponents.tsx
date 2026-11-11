import React from 'react';
import { X } from 'lucide-react';

// Reusable Card container following design system: #1E293B base, #334155 1px border, soft 4px/0.25rem radius
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#131b2e] border border-[#334155]/80 rounded p-4 text-[#dae2fd] shadow-sm transition-colors duration-150 ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`flex items-center justify-between pb-3 mb-3 border-b border-[#334155]/60 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-[#f8fafc]">{title}</h3>
        {subtitle && <p className="text-xs text-[#94a3b8] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

// Badges following design rules: strictly rounded-full for metadata pills
export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'bullish' | 'bearish' | 'neutral' | 'accent' | 'warning';
  className?: string;
}> = ({ children, variant = 'neutral', className = '' }) => {
  const variantStyles = {
    bullish: 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30',
    bearish: 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30',
    neutral: 'bg-[#334155]/60 text-[#94a3b8] border border-[#334155]',
    accent: 'bg-[#3b82f6]/15 text-[#93c5fd] border border-[#3b82f6]/30',
    warning: 'bg-[#eab308]/15 text-[#facc15] border border-[#eab308]/30',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded-full font-mono-numbers uppercase tracking-wider ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};

// Button following design system rules: soft 4px radius, #3b82f6 primary, #334155 ghost/secondary
export const Button: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  title?: string;
}> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  icon,
  title,
}) => {
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-xs font-semibold',
    lg: 'px-4 py-2 text-sm font-semibold',
  }[size];

  const variantStyles = {
    primary:
      'bg-[#3b82f6] text-white hover:bg-[#2563eb] active:bg-[#1d4ed8] focus:ring-2 focus:ring-[#3b82f6]/50 shadow-sm',
    secondary:
      'bg-[#1e293b] border border-[#334155] text-[#f8fafc] hover:bg-[#334155]/50 active:bg-[#334155]',
    danger:
      'bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#fca5a5] hover:bg-[#ef4444]/30 active:bg-[#ef4444]/40',
    ghost:
      'bg-transparent text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#334155]/30',
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 rounded transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${sizeStyles} ${variantStyles} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

// Input following design tokens: #0F172A background, #334155 border, focus #3b82f6 glow
export const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    isMono?: boolean;
    helper?: string;
  }
> = ({ label, isMono = false, helper, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full bg-[#0b1326] border border-[#334155] rounded px-3 py-1.5 text-xs text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors ${
          isMono ? 'font-mono-numbers' : ''
        } ${className}`}
      />
      {helper && <span className="text-[10px] text-[#64748b]">{helper}</span>}
    </div>
  );
};

export const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
  }
> = ({ label, children, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`w-full bg-[#0b1326] border border-[#334155] rounded px-3 py-1.5 text-xs text-[#f8fafc] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-colors ${className}`}
      >
        {children}
      </select>
    </div>
  );
};

// Modal with backdrop blur and hairline border
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full ${maxWidth} bg-[#131b2e] border border-[#334155] rounded shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#334155]/80 bg-[#171f33]">
          <div>
            <h3 className="text-sm font-bold text-[#f8fafc] tracking-tight uppercase">{title}</h3>
            {subtitle && <p className="text-xs text-[#94a3b8] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#334155]/50 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'secondary';
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar Exclusão',
  cancelText = 'Cancelar',
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#131b2e] border border-[#334155] rounded shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#334155]/80 bg-[#171f33]">
          <h3 className="text-sm font-bold text-[#f8fafc] tracking-tight uppercase">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#334155]/50 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-xs text-[#dae2fd] leading-relaxed">{description}</div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#334155]/60">
            <Button variant="secondary" size="sm" onClick={onClose}>
              {cancelText}
            </Button>
            <Button
              variant={variant}
              size="sm"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
