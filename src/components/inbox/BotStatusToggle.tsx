import React from 'react';

interface BotStatusToggleProps {
  isBotActive: boolean;
  onToggle: (nextState: boolean) => void;
  disabled?: boolean;
}

/**
 * BotStatusToggle — Per-Conversation Bot Active / Paused Indicator
 * Strictly complies with CusBox360 Clean UI Guidelines:
 * Transparent background + Dot indicator (●) + Colored text
 */
export const BotStatusToggle: React.FC<BotStatusToggleProps> = ({
  isBotActive,
  onToggle,
  disabled = false,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      onToggle(!isBotActive);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`text-[11px] font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-bg-app transition-all cursor-pointer ${
        isBotActive ? 'text-emerald-600' : 'text-amber-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={
        isBotActive
          ? 'บอทกำลังทำงานอัตโนมัติ (คลิกเพื่อหยุดบอทในห้องนี้)'
          : 'บอทถูกหยุดชั่วคราวเนื่องจากแอดมินกำลังคุย (คลิกเพื่อเปิดบอทกลับมา)'
      }
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isBotActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
        }`}
      />
      <span>{isBotActive ? '● Bot Active' : '● Bot Paused (แอดมินดูแล)'}</span>
    </button>
  );
};
