import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: ModalMaxWidth;
}

const MAX_WIDTH_CLASSES: Record<ModalMaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSpacious = maxWidth === '2xl' || maxWidth === '3xl' || maxWidth === '4xl';
  const headerPadding = isSpacious ? 'px-6 py-4' : 'px-5 py-4';
  const bodyPadding = isSpacious ? 'px-6 py-5' : 'px-5 py-4';
  const footerPadding = isSpacious ? 'px-6 py-4' : 'px-5 py-3';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${MAX_WIDTH_CLASSES[maxWidth]} bg-white rounded-card shadow-modal border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-start justify-between gap-4 ${headerPadding} border-b border-border bg-white`}>
          <div>
            <h3 className={`${isSpacious ? 'text-lg' : 'text-[15px]'} font-bold text-text-primary`}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-bg-subtle transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className={isSpacious ? 'w-5 h-5' : 'w-4 h-4'} />
          </button>
        </div>

        <div className={`${bodyPadding} overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar`}>
          {children}
        </div>

        {footer && (
          <div className={`flex items-center justify-end gap-2.5 ${footerPadding} border-t border-border bg-bg-muted`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
