
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../utils/translations';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  t: (key: keyof typeof translations.fr) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialiser depuis le localStorage ou par défaut
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('3dvers_lang') as Language) || 'fr';
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('3dvers_theme') as 'light' | 'dark') || 'light';
  });

  // Mettre à jour la langue et la direction (RTL/LTR)
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('3dvers_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  // Mettre à jour le thème et la classe HTML
  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('3dvers_theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Effet initial pour appliquer le thème et la langue au chargement
  useEffect(() => {
    setLanguage(language);
    setTheme(theme);
  }, []);

  // Fonction de traduction
  const t = (key: keyof typeof translations.fr) => {
    const dict = translations[language] || translations['fr'];
    return dict[key] || translations['fr'][key] || key;
  };

  return (
    <AppContext.Provider value={{ language, setLanguage, theme, toggleTheme, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
