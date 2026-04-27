import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from '../translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem('app-language');
        if (saved && translations[saved]) setLanguage(saved);
      } catch (error) {
        console.warn('Failed to load language', error);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (lng) => {
    if (!translations[lng]) return;
    setLanguage(lng);
    await AsyncStorage.setItem('app-language', lng);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);