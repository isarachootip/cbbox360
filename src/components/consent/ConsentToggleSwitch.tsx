import React from 'react';

interface ConsentToggleSwitchProps {
  checked: boolean;
  label: string;
  accent?: 'emerald' | 'brand' | 'purple';
  onToggle: () => void;
}

export const ConsentToggleSwitch: React.FC<ConsentToggleSwitchProps> = ({
  checked,
  label,
  accent = 'emerald',
  onToggle,
}) => {
  const activeTrack =
    accent === 'purple'
      ? 'bg-purple-600'
      : accent === 'brand'
        ? 'bg-brand'
        : 'bg-emerald-600';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${label}: ${checked ? 'ยินยอม' : 'ไม่ยินยอม'}`}
      onClick={onToggle}
      className="inline-flex flex-col items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-bg-subtle transition-colors cursor-pointer group"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ${
          checked ? activeTrack : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-150 mt-0.5 ${
            checked ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
          }`}
        />
      </span>
      <span
        className={`text-[11px] font-medium leading-none ${
          checked ? 'text-text-primary' : 'text-text-muted'
        }`}
      >
        {label}
      </span>
    </button>
  );
};
