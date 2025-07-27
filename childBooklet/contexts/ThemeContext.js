import React, { createContext, useContext, useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme definitions
const lightTheme = {
  // Background colors
  backgroundColor: '#F8F9FA',
  cardBackground: '#f7f7f7ff',
  modalBackground: '#FFFFFF',
  headerBackground: '#FFFFFF',
  
  // Text colors
  primaryText: '#000000ff',
  secondaryText: '#000000ff',
  lightText: '#000000ff',
  whiteText: '#ffffffff',
  
  // Brand colors
  primary: '#37aee2ff',
  primaryLight: '#E6F0E6',
  primaryDark: '#2D5016',
  
  // Accent colors
  accent: '#F7A250',
  accentSecondary: '#727CDC',
  
  // Status colors
  success: '#4CAF50',
  error: '#FF4444',
  warning: '#FFA726',
  info: '#2196F3',
  
  // Border and separator colors
  border: '#ffffffff',
  separator: '#000000ff',
  
  // Shadow colors
  shadow: '#000000',
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Tab and button colors
  tabBackground: '#ffffffff',
  buttonBackground: '#070707ff',
  
  // Status bar
  statusBarStyle: 'dark-content',
  statusBarBackground: '#FFFFFF',
};

const darkTheme = {
  // Background colors
  backgroundColor: '#121212',
  cardBackground: '#1E1E1E',
  modalBackground: '#2D2D2D',
  headerBackground: '#1E1E1E',
  
  // Text colors
  primaryText: '#FFFFFF',
  secondaryText: '#fcfcfcff',
  lightText: '#ffffffff',
  whiteText: '#FFFFFF',
  
  // Brand colors (adjusted for dark mode)
  primary: '#5A8C69',
  primaryLight: '#2A4A32',
  primaryDark: '#4A7C59',
  
  // Accent colors (slightly adjusted)
  accent: '#F7A250',
  accentSecondary: '#8A9BEC',
  
  // Status colors (adjusted for dark mode)
  success: '#66BB6A',
  error: '#EF5350',
  warning: '#FFCA28',
  info: '#42A5F5',
  
  // Border and separator colors
  border: '#404040',
  separator: '#333333',
  
  // Shadow colors
  shadow: '#000000',
  shadowLight: 'rgba(0, 0, 0, 0.3)',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  
  // Tab and button colors
  tabBackground: '#2A2A2A',
  buttonBackground: '#5A8C69',
  
  // Status bar
  statusBarStyle: 'light-content',
  statusBarBackground: '#1E1E1E',
};

// Create theme context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update status bar when theme changes
  useEffect(() => {
    const currentTheme = isDarkMode ? darkTheme : lightTheme;
    StatusBar.setBarStyle(currentTheme.statusBarStyle, true);
    
    // For Android
    if (StatusBar.setBackgroundColor) {
      StatusBar.setBackgroundColor(currentTheme.statusBarBackground, true);
    }
  }, [isDarkMode]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme_preference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const contextValue = {
    theme,
    isDarkMode,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { lightTheme, darkTheme };
