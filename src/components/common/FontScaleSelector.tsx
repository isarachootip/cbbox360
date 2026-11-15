import React from 'react';
import { FontScale } from '../../domain/layout/typographyPreferences';
import { useTypography } from '../../context/TypographyContext';

interface ScaleOption {
  value: FontScale;
  shortGlyph: string;
  label: string;
  percent: string;
}

const SCALE_OPTIONS: ScaleOption[] = [
  { value: 'standard', shortGlyph: 'ก', label: 'มาตรฐาน', percent: '100%' },
  { value: 'comfortable', shortGlyph: 'ก+', label: 'สบายตา', percent: '105%' },
  { value: 'large', shortGlyph: 'ก++', label: 'ใหญ่', percent: '112%' },
];

interface FontScaleSelectorProps {
  compact?: boolean;
  onChangeScale?: (scale: FontScale) => void;
}

export const FontScaleSelector: React.FC<FontScaleSelectorProps> = ({
  compact = false,
  onChangeScale,
}) => {
  const { fontScale, setFontScale } = useTypography();

  const handleSelect = (next: FontScale) => {
    setFontScale(next);
    if (onChangeScale) {
      onChangeScale(next);
    }
  };

  return (
    <div
      role="group"
      aria-label="ปรับขนาดตัวอักษรหน้าจอ"
      className={`grid grid-cols-3 gap-1 rounded-lg bg-bg-muted border border-border/80 ${
        compact ? 'p-0.5' : 'p-1'
      }`}
    >
      {SCALE_OPTIONS.map((opt) => {
        const isActive = fontScale === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => handleSelect(opt.value)}
            className={`rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer select-none ${
              compact ? 'py-1 px-1.5 text-2xs' : 'py-1.5 px-3 text-xs'
            } ${
              isActive
                ? 'bg-white text-brand font-semibold shadow-xs ring-1 ring-brand/15'
                : 'text-text-secondary hover:text-text-primary font-medium'
            }`}
          >
            <span className="font-semibold">{opt.shortGlyph}</span>
            <span>{opt.label}</span>
            {!compact && (
              <span className="text-2xs text-text-muted tabular-nums hidden sm:inline">
                ({opt.percent})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
