import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { CannedResponse } from '../../types';

interface CannedResponseQuickBarProps {
  selectedCannedGroup: string;
  onSelectCannedGroup: (group: string) => void;
  chipCannedResponses: CannedResponse[];
  slashFilteredResponses: CannedResponse[];
  slashSearchQuery: string;
  isSlashMenuOpen: boolean;
  onCloseSlashMenu: () => void;
  onApplyCannedResponse: (item: CannedResponse) => void;
}

export const CannedResponseQuickBar: React.FC<CannedResponseQuickBarProps> = ({
  selectedCannedGroup,
  onSelectCannedGroup,
  chipCannedResponses,
  slashFilteredResponses,
  slashSearchQuery,
  isSlashMenuOpen,
  onCloseSlashMenu,
  onApplyCannedResponse,
}) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar pt-0.5 select-none">
        <div className="flex items-center gap-1">
          {(
            [
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'greeting', label: '👋 ทักทาย' },
              { id: 'question', label: '❓ คำถาม' },
              { id: 'answer', label: '💡 คำตอบ' },
            ] as const
          ).map((g) => (
            <button
              type="button"
              key={g.id}
              onClick={() => onSelectCannedGroup(g.id)}
              className={`text-[11px] px-2.5 py-0.5 rounded-md font-semibold transition-all whitespace-nowrap ${
                selectedCannedGroup === g.id
                  ? 'bg-brand text-white shadow-2xs'
                  : 'bg-bg-muted text-text-secondary hover:text-text-primary'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate('/canned-responses')}
          className="text-[11px] text-text-secondary hover:text-brand flex-shrink-0 px-2 py-0.5 rounded bg-bg-muted"
        >
          + เพิ่มเทมเพลต
        </button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5 select-none">
        {chipCannedResponses.slice(0, 8).map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => onApplyCannedResponse(item)}
            title={`${item.title}\n\n${item.content}`}
            className="text-[11px] px-2.5 py-1 rounded-lg border border-border bg-bg-subtle hover:bg-brand-tint/50 hover:border-brand/30 text-brand font-mono font-semibold flex-shrink-0 transition-all"
          >
            {item.shortcut}
          </button>
        ))}
      </div>

      {isSlashMenuOpen && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl border border-border shadow-modal z-40 max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
          <div className="flex items-center justify-between px-2 py-1 border-b border-divider text-xs font-semibold text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-brand" />
              <span>เลือกข้อความตอบกลับอัตโนมัติ</span>
            </span>
            <button type="button" onClick={onCloseSlashMenu} className="hover:text-text-primary">
              ✕
            </button>
          </div>
          {slashFilteredResponses.length === 0 ? (
            <div className="p-3 text-center text-xs text-text-secondary">
              ไม่พบ shortcut ที่ตรงกับ &quot;/{slashSearchQuery}&quot;
            </div>
          ) : (
            slashFilteredResponses.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => onApplyCannedResponse(item)}
                className="w-full text-left p-2 rounded-lg hover:bg-bg-subtle transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-brand group-hover:underline">
                      {item.shortcut}
                    </span>
                    <span className="text-[13px] font-semibold text-text-primary truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{item.content}</p>
                </div>
                <span className="text-[11px] text-text-secondary font-mono tabular-nums flex-shrink-0">
                  ใช้ {item.usageCount || 0} ครั้ง
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </>
  );
};
