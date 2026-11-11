import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  PanelPreferences,
  loadPanelPreferences,
  savePanelPreferences,
} from '../domain/layout/panelPreferences';

interface LayoutContextType {
  isMobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  openMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  isInboxRightPanelOpen: boolean;
  toggleInboxRightPanel: () => void;
  isServiceRightPanelOpen: boolean;
  toggleServiceRightPanel: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [panelPrefs, setPanelPrefs] = useState<PanelPreferences>(() => loadPanelPreferences());
  const location = useLocation();

  // Automatically close sidebar when navigating to a new page on mobile
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const updatePrefs = useCallback((updater: (prev: PanelPreferences) => PanelPreferences) => {
    setPanelPrefs((prev) => {
      const next = updater(prev);
      savePanelPreferences(next);
      return next;
    });
  }, []);

  const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  const openMobileSidebar = () => setIsMobileSidebarOpen(true);

  const toggleSidebarCollapsed = useCallback(() => {
    updatePrefs((prev) => ({ ...prev, isSidebarCollapsed: !prev.isSidebarCollapsed }));
  }, [updatePrefs]);

  const toggleInboxRightPanel = useCallback(() => {
    updatePrefs((prev) => ({ ...prev, isInboxRightPanelOpen: !prev.isInboxRightPanelOpen }));
  }, [updatePrefs]);

  const toggleServiceRightPanel = useCallback(() => {
    updatePrefs((prev) => ({ ...prev, isServiceRightPanelOpen: !prev.isServiceRightPanelOpen }));
  }, [updatePrefs]);

  return (
    <LayoutContext.Provider
      value={{
        isMobileSidebarOpen,
        toggleMobileSidebar,
        closeMobileSidebar,
        openMobileSidebar,
        isSidebarCollapsed: panelPrefs.isSidebarCollapsed,
        toggleSidebarCollapsed,
        isInboxRightPanelOpen: panelPrefs.isInboxRightPanelOpen,
        toggleInboxRightPanel,
        isServiceRightPanelOpen: panelPrefs.isServiceRightPanelOpen,
        toggleServiceRightPanel,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
