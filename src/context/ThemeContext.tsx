import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeMode } from '../types/database';
import { db, setSetting } from '../db';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  cycleTheme: () => void;
  resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  cycleTheme: () => {},
  resolvedTheme: 'dark'
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('vds_theme') as ThemeMode) || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Carica impostazione salvata da Dexie solo se effettivamente presente nel DB
    db.settings.get('theme').then(entry => {
      if (entry && entry.value && entry.value !== theme) {
        setThemeState(entry.value as ThemeMode);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const updateResolved = () => {
      let isDark = true;
      if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = theme === 'dark';
      }

      const active = isDark ? 'dark' : 'light';
      setResolvedTheme(active);

      root.classList.remove('dark', 'light');
      root.classList.add(active);

      const metaTheme = document.querySelector("meta[name='theme-color']");
      if (metaTheme) {
        metaTheme.setAttribute('content', isDark ? '#090d16' : '#f8fafc');
      }
    };

    updateResolved();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') updateResolved();
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('vds_theme', mode);
    setSetting('theme', mode);
  };

  const cycleTheme = () => {
    setThemeState(prev => {
      let next: ThemeMode;
      if (prev === 'system') {
        // Al primo click da 'system', passa immediatamente alla modalità opposta a quella attuale
        next = resolvedTheme === 'dark' ? 'light' : 'dark';
      } else if (prev === 'light') {
        next = 'dark';
      } else {
        // prev === 'dark'
        next = 'system';
      }
      localStorage.setItem('vds_theme', next);
      setSetting('theme', next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
