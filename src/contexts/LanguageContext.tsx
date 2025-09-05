import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'he';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations = {
  en: {
    // Navigation
    'nav.classes': 'Classes',
    'nav.database': 'Database', 
    'nav.calendar': 'Calendar',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.courses': 'My Perleaps',
    'nav.progress': 'Progress',
    'nav.profile': 'Profile',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    
    // Dashboard
    'dashboard.totalStudents': 'Total Students',
    'dashboard.myCourses': 'My Courses',
    'dashboard.activities': 'Activities',
    'dashboard.completionRate': 'Completion Rate',
    'dashboard.search': 'Search...',
    'dashboard.notifications': 'No new notifications',
    
    // Common
    'common.perleap': 'Perleap',
    'common.teacher': 'Teacher',
    'common.student': 'Student',
    'common.dashboard': 'Dashboard',
    
    // Dashboard Stats
    'stats.totalStudents': 'Total Students',
    'stats.myCourses': 'My Courses',
    'stats.activities': 'Activities',
    'stats.completionRate': 'Completion Rate',
  },
  he: {
    // Navigation
    'nav.classes': 'כיתות',
    'nav.database': 'מסד נתונים',
    'nav.calendar': 'לוח שנה',
    'nav.analytics': 'ניתוחים',
    'nav.settings': 'הגדרות',
    'nav.courses': 'הפרליפים שלי',
    'nav.progress': 'התקדמות',
    'nav.profile': 'פרופיל',
    'nav.login': 'התחברות',
    'nav.register': 'הרשמה',
    'nav.logout': 'התנתקות',
    
    // Dashboard
    'dashboard.totalStudents': 'סה״כ תלמידים',
    'dashboard.myCourses': 'הקורסים שלי',
    'dashboard.activities': 'פעילויות',
    'dashboard.completionRate': 'אחוז השלמה',
    'dashboard.search': 'חיפוש...',
    'dashboard.notifications': 'אין התראות חדשות',
    
    // Common
    'common.perleap': 'פרליפ',
    'common.teacher': 'מורה',
    'common.student': 'תלמיד',
    'common.dashboard': 'לוח בקרה',
    
    // Dashboard Stats
    'stats.totalStudents': 'סה״כ תלמידים',
    'stats.myCourses': 'הקורסים שלי',
    'stats.activities': 'פעילויות',
    'stats.completionRate': 'אחוז השלמה',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'he' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  // Apply RTL/LTR direction to document
  React.useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};