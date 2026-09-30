import React from 'react';
import { Menu } from 'lucide-react';
import { useLayout } from '../../context/LayoutContext';

interface PageHeaderProps {
  breadcrumbs?: React.ReactNode;
  title?: string;
  subtitle?: React.ReactNode;
  centerControls?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumbs,
  title,
  subtitle,
  centerControls,
  actionButton,
}) => {
  const { toggleMobileSidebar } = useLayout();

  return (
    <header className="h-[56px] sm:h-[60px] flex-shrink-0 bg-white border-b border-border px-3.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 select-none z-20">
      {/* Left side: Mobile Hamburger + Breadcrumb or Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          aria-label="เปิดเมนูการนำทาง"
          className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <Menu className="w-5 h-5" />
        </button>
        {breadcrumbs ? (
          <div className="text-[14px] font-semibold text-text-primary flex items-center gap-1.5 truncate">
            {breadcrumbs}
          </div>
        ) : (
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-[18px] font-bold text-text-primary tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <span className="text-xs text-text-secondary font-normal">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Center Controls (Search, Filters) */}
      {centerControls && (
        <div className="flex-1 flex items-center justify-center max-w-xl">
          {centerControls}
        </div>
      )}

      {/* Right side: Primary Action Button */}
      {actionButton && (
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {actionButton}
        </div>
      )}
    </header>
  );
};
