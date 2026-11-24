import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SiteLanguageCode } from '../i18n/siteTranslations';

export type ThemeMode = 'light' | 'dark';

export interface ThemeUiCopy {
  light: string;
  dark: string;
  themeLabel: string;
  switchToLight: string;
  switchToDark: string;
}

export const THEME_UI_COPY: Record<SiteLanguageCode, ThemeUiCopy> = {
  pt: {
    light: 'Claro',
    dark: 'Escuro',
    themeLabel: 'Aparência do Site',
    switchToLight: 'Mudar para Modo Claro',
    switchToDark: 'Mudar para Modo Escuro'
  },
  en: {
    light: 'Light',
    dark: 'Dark',
    themeLabel: 'Site Appearance',
    switchToLight: 'Switch to Light Mode',
    switchToDark: 'Switch to Dark Mode'
  },
  es: {
    light: 'Claro',
    dark: 'Oscuro',
    themeLabel: 'Apariencia del Sitio',
    switchToLight: 'Cambiar a Modo Claro',
    switchToDark: 'Cambiar a Modo Oscuro'
  },
  fr: {
    light: 'Clair',
    dark: 'Sombre',
    themeLabel: 'Apparence du Site',
    switchToLight: 'Passer en Mode Clair',
    switchToDark: 'Passer en Mode Sombre'
  },
  de: {
    light: 'Hell',
    dark: 'Dunkel',
    themeLabel: 'Design-Modus',
    switchToLight: 'Zum hellen Modus wechseln',
    switchToDark: 'Zum dunklen Modus wechseln'
  },
  it: {
    light: 'Chiaro',
    dark: 'Scuro',
    themeLabel: 'Aspetto del Sito',
    switchToLight: 'Passa alla Modalità Chiara',
    switchToDark: 'Passa alla Modalità Scura'
  }
};

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'site_theme_mode';

function resolveInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(resolveInitialTheme);

  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.toggle('dark', theme === 'dark');
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
      const metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', theme === 'dark' ? '#0B0F17' : '#f8fafc');
      }
    } catch {
      // ignore DOM errors
    }
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore storage errors
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
