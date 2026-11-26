import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Headset,
  Wrench,
  Stethoscope,
  Truck,
  Car,
  Building2,
  ChevronDown,
  Check,
  Lock,
} from 'lucide-react';
import { BusinessTemplatePreset } from '../../types';
import { useBusinessTemplate } from '../../hooks/useBusinessTemplate';

interface DemoBusinessSwitcherProps {
  isCollapsed?: boolean;
}

export const renderBusinessIcon = (
  iconName: BusinessTemplatePreset['iconName'],
  className = 'w-4 h-4'
) => {
  switch (iconName) {
    case 'smartphone':
      return <Smartphone className={`${className} text-rose-600`} />;
    case 'headset':
      return <Headset className={`${className} text-cyan-600`} />;
    case 'wrench':
      return <Wrench className={`${className} text-sky-600`} />;
    case 'hospital':
      return <Stethoscope className={`${className} text-emerald-600`} />;
    case 'truck':
      return <Truck className={`${className} text-blue-600`} />;
    case 'car':
      return <Car className={`${className} text-amber-600`} />;
    default:
      return <Building2 className={`${className} text-purple-600`} />;
  }
};

export const DemoBusinessSwitcher: React.FC<DemoBusinessSwitcherProps> = ({
  isCollapsed = false,
}) => {
  const navigate = useNavigate();
  const { templates, activeTemplateId, isLocked, isSysAdmin, quickSwitchBusiness } =
    useBusinessTemplate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Hidden completely when Production Lock is enabled ("Set once for real deployment")
  if (isLocked) return null;

  const activePreset = templates.find((t) => t.id === activeTemplateId) ?? templates[0];

  return (
    <div ref={containerRef} className="relative px-0.5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={`โหมด Demo: ${activePreset.name} (${activePreset.thaiTitle})`}
        className={`w-full flex items-center rounded-xl bg-white/80 hover:bg-white border border-sidebar-border/80 transition-all text-left shadow-2xs cursor-pointer ${
          isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-2'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg border border-border bg-slate-50 flex items-center justify-center shrink-0">
            {renderBusinessIcon(activePreset.iconName)}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>DEMO BUSINESS</span>
                </span>
              </div>
              <div className="text-xs font-bold text-text-primary truncate">
                {activePreset.name}
              </div>
            </div>
          )}
        </div>
        {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-text-secondary shrink-0" />}
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 bg-white border border-border rounded-xl shadow-modal p-2 z-50 space-y-1 ${
            isCollapsed ? 'left-0 w-[260px]' : 'left-0 right-0'
          }`}
        >
          <div className="px-2 py-1 text-[11px] font-semibold text-text-secondary border-b border-divider">
            สลับประเภทธุรกิจ (เปลี่ยนชุดข้อความ & Keyword)
          </div>
          <div className="space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar pt-0.5">
            {templates.map((tpl) => {
              const current = tpl.id === activeTemplateId;
              return (
                <button
                  type="button"
                  key={tpl.id}
                  onClick={() => {
                    quickSwitchBusiness(tpl.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    current ? 'bg-brand-tint text-brand' : 'hover:bg-bg-subtle text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {renderBusinessIcon(tpl.iconName, 'w-3.5 h-3.5 shrink-0')}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{tpl.name}</div>
                      <div className="text-[10px] text-text-secondary truncate">{tpl.thaiTitle}</div>
                    </div>
                  </div>
                  {current && <Check className="w-3.5 h-3.5 text-brand shrink-0" />}
                </button>
              );
            })}
          </div>
          {isSysAdmin && (
            <div className="pt-1.5 border-t border-divider">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/settings?tab=templates');
                }}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-text-secondary hover:text-brand hover:bg-bg-subtle cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>ไปหน้าล็อกธุรกิจใช้งานจริง (Set ครั้งเดียว)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
