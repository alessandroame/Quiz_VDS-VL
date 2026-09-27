import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeMode } from '../types/database';
import { getSetting, setSetting } from '../db';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'dark'
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('vds_theme') as ThemeMode) || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Carica impostazione salvata da Dexie se presente
    getSetting<ThemeMode>('theme', 'system').then(saved => {
      if (saved && saved !== theme) {
        setThemeState(saved);
      }
    });
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

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
