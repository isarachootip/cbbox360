import React, { Suspense } from 'react';
import {
  clientModuleRegistry,
  ExtensionSlotName,
  ModuleSlotProps,
} from './clientModuleRegistry';
import { useEntitlement } from '../hooks/useEntitlement';

interface ExtensionSlotProps extends ModuleSlotProps {
  name: Exclude<ExtensionSlotName, 'contact.detail.tabs'>;
  fallback?: React.ReactNode;
}

/**
 * Named UI Extension Slot Host.
 * Renders components contributed by entitled modules without Core knowing any module or industry.
 */
export const ExtensionSlot: React.FC<ExtensionSlotProps> = ({
  name,
  fallback = null,
  ...slotProps
}) => {
  const { isEntitled } = useEntitlement();
  const matches = clientModuleRegistry.getSlotComponents(name, isEntitled);

  if (matches.length === 0) {
    return <>{fallback}</>;
  }

  return (
    <Suspense fallback={<div className="text-xs text-text-muted py-2">กำลังโหลดโมดูล...</div>}>
      {matches.map(({ moduleId, Component }) => (
        <Component key={`${name}:${moduleId}`} {...slotProps} />
      ))}
    </Suspense>
  );
};
