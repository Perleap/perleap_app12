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
    
    // Student Data Table
    'table.recentActivity': 'Recent Student Activity',
    'table.students': 'Students',
    'table.student': 'Student',
    'table.course': 'Course',
    'table.lastActivity': 'Last Activity',
    'table.status': 'Status',
    'table.latest': 'Latest',
    'table.loading': 'Loading...',
    'table.noData': 'No student activity data available.',
    
    // Status Labels
    'status.completed': 'Completed',
    'status.inProgress': 'In Progress',
    'status.notStarted': 'Not Started',
    'status.unknown': 'Unknown',
    
    // Sidebar Navigation
    'sidebar.dashboard': 'Dashboard',
    'sidebar.classes': 'Classes',
    'sidebar.database': 'Database',
    'sidebar.calendar': 'Calendar',
    'sidebar.analytics': 'Analytics',
    'sidebar.settings': 'Settings',
    
    // Charts
    'chart.completedActivitiesByCourse': 'Completed Activities by Course',
    'chart.overallProgress': 'Overall Progress',
    'chart.completed': 'Completed',
    'chart.remaining': 'Remaining',
    'chart.loadingStats': 'Loading statistics...',
    'chart.noActivityData': 'No activity data available',
    
    // Notifications
    'notifications.recentNotifications': 'Recent Notifications',
    'notifications.noNotifications': 'No notifications available.',
    'notifications.loading': 'Loading...',
    
    // Calendar
    'calendar.january': 'January',
    'calendar.february': 'February',
    'calendar.march': 'March',
    'calendar.april': 'April',
    'calendar.may': 'May',
    'calendar.june': 'June',
    'calendar.july': 'July',
    'calendar.august': 'August',
    'calendar.september': 'September',
    'calendar.october': 'October',
    'calendar.november': 'November',
    'calendar.december': 'December',
    'calendar.sun': 'Sun',
    'calendar.mon': 'Mon',
    'calendar.tue': 'Tue',
    'calendar.wed': 'Wed',
    'calendar.thu': 'Thu',
    'calendar.fri': 'Fri',
    'calendar.sat': 'Sat',
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
    
    // Student Data Table
    'table.recentActivity': 'פעילות תלמידים אחרונה',
    'table.students': 'תלמידים',
    'table.student': 'תלמיד',
    'table.course': 'קורס',
    'table.lastActivity': 'פעילות אחרונה',
    'table.status': 'סטטוס',
    'table.latest': 'אחרון',
    'table.loading': 'טוען...',
    'table.noData': 'אין נתוני פעילות תלמידים זמינים.',
    
    // Status Labels
    'status.completed': 'הושלם',
    'status.inProgress': 'בתהליך',
    'status.notStarted': 'לא התחיל',
    'status.unknown': 'לא ידוע',
    
    // Sidebar Navigation
    'sidebar.dashboard': 'לוח בקרה',
    'sidebar.classes': 'כיתות',
    'sidebar.database': 'מסד נתונים',
    'sidebar.calendar': 'לוח שנה',
    'sidebar.analytics': 'ניתוחים',
    'sidebar.settings': 'הגדרות',
    
    // Charts
    'chart.completedActivitiesByCourse': 'פעילויות שהושלמו לפי קורס',
    'chart.overallProgress': 'התקדמות כללית',
    'chart.completed': 'הושלם',
    'chart.remaining': 'נותר',
    'chart.loadingStats': 'טוען סטטיסטיקות...',
    'chart.noActivityData': 'אין נתוני פעילות זמינים',
    
    // Notifications
    'notifications.recentNotifications': 'התראות אחרונות',
    'notifications.noNotifications': 'אין התראות זמינות.',
    'notifications.loading': 'טוען...',
    
    // Calendar
    'calendar.january': 'ינואר',
    'calendar.february': 'פברואר',
    'calendar.march': 'מרץ',
    'calendar.april': 'אפריל',
    'calendar.may': 'מאי',
    'calendar.june': 'יוני',
    'calendar.july': 'יולי',
    'calendar.august': 'אוגוסט',
    'calendar.september': 'ספטמבר',
    'calendar.october': 'אוקטובר',
    'calendar.november': 'נובמבר',
    'calendar.december': 'דצמבר',
    'calendar.sun': 'א\'',
    'calendar.mon': 'ב\'',
    'calendar.tue': 'ג\'',
    'calendar.wed': 'ד\'',
    'calendar.thu': 'ה\'',
    'calendar.fri': 'ו\'',
    'calendar.sat': 'ש\'',
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