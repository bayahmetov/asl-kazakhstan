import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'ru' | 'kz';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.courses': 'Courses',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.signIn': 'Sign In',
    'nav.skipToMain': 'Skip to main content',
    'nav.openMenu': 'Open menu',
    'nav.closeMenu': 'Close menu',
    'nav.homeLabel': 'RSL Kazakhstan Home',
    
    // Brand
    'brand.name': 'RSL Kazakhstan',
    'brand.tagline': 'Learn with Heart',
    'brand.mission': 'Empowering the deaf and hard-of-hearing community in Kazakhstan through accessible, high-quality Russian sign language education.',
    
    // Common
    'common.learnMore': 'Learn More',
    'common.getStarted': 'Get Started',
    'common.contact': 'Contact',
    'common.email': 'Email',
    'common.phone': 'Phone',
    'common.location': 'Location',
  },
  ru: {
    // Navigation
    'nav.home': 'Главная',
    'nav.courses': 'Курсы',
    'nav.about': 'О нас',
    'nav.contact': 'Контакты',
    'nav.signIn': 'Войти',
    'nav.skipToMain': 'Перейти к основному содержанию',
    'nav.openMenu': 'Открыть меню',
    'nav.closeMenu': 'Закрыть меню',
    'nav.homeLabel': 'РЖЯ Казахстан Главная',
    
    // Brand
    'brand.name': 'РЖЯ Казахстан',
    'brand.tagline': 'Учись с душой',
    'brand.mission': 'Расширение возможностей глухих и слабослышащих в Казахстане через доступное, высококачественное образование русского жестового языка.',
    
    // Common
    'common.learnMore': 'Узнать больше',
    'common.getStarted': 'Начать',
    'common.contact': 'Контакты',
    'common.email': 'Эл. почта',
    'common.phone': 'Телефон',
    'common.location': 'Местоположение',
  },
  kz: {
    // Navigation
    'nav.home': 'Басты бет',
    'nav.courses': 'Курстар',
    'nav.about': 'Біз туралы',
    'nav.contact': 'Байланыс',
    'nav.signIn': 'Кіру',
    'nav.skipToMain': 'Негізгі мазмұнға өту',
    'nav.openMenu': 'Мәзірді ашу',
    'nav.closeMenu': 'Мәзірді жабу',
    'nav.homeLabel': 'ОИТ Қазақстан Басты бет',
    
    // Brand
    'brand.name': 'ОИТ Қазақстан',
    'brand.tagline': 'Жүрекпен үйрен',
    'brand.mission': 'Қазақстандағы саңырау және есту қабілеті нашар адамдарға қол жетімді, сапалы орыс ым тілін үйретудің арқасында мүмкіндіктерін кеңейту.',
    
    // Common
    'common.learnMore': 'Толығырақ',
    'common.getStarted': 'Бастау',
    'common.contact': 'Байланыс',
    'common.email': 'Эл. пошта',
    'common.phone': 'Телефон',
    'common.location': 'Орналасқан жері',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};