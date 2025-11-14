import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '../constants/colors';
import { saveTheme, loadTheme } from '../utils/storageUtils';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [colors, setColors] = useState(lightTheme);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await loadTheme();
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setTheme(savedTheme);
          setColors(savedTheme === 'light' ? lightTheme : darkTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    const newColors = newTheme === 'light' ? lightTheme : darkTheme;

    setTheme(newTheme);
    setColors(newColors);

    try {
      await saveTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setThemeMode = async (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') return;

    const newColors = newTheme === 'light' ? lightTheme : darkTheme;

    setTheme(newTheme);
    setColors(newColors);

    try {
      await saveTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const value = {
    theme,
    colors,
    isLoading,
    toggleTheme,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
