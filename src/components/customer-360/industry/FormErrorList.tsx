import React from 'react';
import { AlertCircle } from 'lucide-react';
import { FieldError } from '../../../domain/industry/schemas';

export const FormErrorList: React.FC<{ errors: FieldError[] }> = ({ errors }) => {
  if (errors.length === 0) return null;
  return (
    <div className="p-2.5 rounded-lg border border-red-200 space-y-1">
      {errors.map((err, idx) => (
        <div key={`${err.path}-${idx}`} className="flex items-start gap-1.5 text-[11px] text-red-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{err.message}</span>
        </div>
      ))}
    </div>
  );
};

export const inputClass =
  'w-full px-2.5 py-1.5 rounded-lg border border-border text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand';
export const labelClass = 'block text-[11px] font-semibold text-text-secondary mb-1';
export const primaryButtonClass =
  'px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold disabled:opacity-50';
export const secondaryButtonClass =
  'px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-slate-50';
