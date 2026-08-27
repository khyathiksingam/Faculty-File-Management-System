import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Always maintain clean, consistent modern institutional theme
  React.useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('ffms_theme', 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
