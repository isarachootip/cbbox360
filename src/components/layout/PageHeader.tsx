import React from 'react';

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
  return (
    <header className="h-[60px] flex-shrink-0 bg-white border-b border-border px-6 flex items-center justify-between gap-4 select-none z-20">
      {/* Left side: Breadcrumb or Title */}
      <div className="flex items-center gap-3 min-w-0">
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
