import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  FontScale,
  TypographyPreferences,
  getUserFontScale,
  loadTypographyPreferences,
  saveTypographyPreferences,
  setUserFontScale,
} from '../domain/layout/typographyPreferences';

interface TypographyContextType {
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
}

const TypographyContext = createContext<TypographyContextType | undefined>(undefined);

export const TypographyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [prefs, setPrefs] = useState<TypographyPreferences>(() => loadTypographyPreferences());

  const activeUsername = currentUser?.username;
  const fontScale = getUserFontScale(prefs, activeUsername);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.fontScale = fontScale;
    }
  }, [fontScale]);

  const setFontScale = useCallback(
    (scale: FontScale) => {
      setPrefs((prev) => {
        const next = setUserFontScale(prev, scale, activeUsername);
        saveTypographyPreferences(next);
        return next;
      });
    },
    [activeUsername]
  );

  return (
    <TypographyContext.Provider value={{ fontScale, setFontScale }}>
      {children}
    </TypographyContext.Provider>
  );
};

export const useTypography = (): TypographyContextType => {
  const context = useContext(TypographyContext);
  if (!context) {
    throw new Error('useTypography must be used within a TypographyProvider');
  }
  return context;
};
