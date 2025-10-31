import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('p2p_theme');
    if (saved) {
      return saved === 'dark';
    }
    // Default to dark theme or system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('p2p_theme', isDark ? 'dark' : 'light');

    // Update CSS custom properties for better theme integration
    const root = document.documentElement;
    if (isDark) {
      root.style.setProperty('--toast-bg', '#374151');
      root.style.setProperty('--toast-color', '#ffffff');
      root.style.setProperty('--toast-border', '#4b5563');
    } else {
      root.style.setProperty('--toast-bg', '#ffffff');
      root.style.setProperty('--toast-color', '#1f2937');
      root.style.setProperty('--toast-border', '#e5e7eb');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const setTheme = (theme) => {
    setIsDark(theme === 'dark');
  };

  const value = {
    isDark,
    theme: isDark ? 'dark' : 'light',
    toggleTheme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};