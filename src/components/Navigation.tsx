import perleapLogo from "@/assets/perleap-logo-new.png";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";
import { BookOpen, Users, BarChart3, Settings, User, Database, Calendar, LogOut, LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface NavigationProps {
  userRole?: "teacher" | "student";
}

export const Navigation = ({ userRole }: NavigationProps) => {
  const location = useLocation();
  const { user, userRole: detectedRole, signOut } = useAuth();
  const { t } = useLanguage();
  
  // Use detected role from auth context, fallback to prop
  const currentRole = userRole || detectedRole;
  
  const teacherNavItems = [
    { icon: Users, label: t('nav.classes'), path: "/teacher/classes" },
    { icon: Database, label: t('nav.database'), path: "/teacher/database" },
    { icon: Calendar, label: t('nav.calendar'), path: "/teacher/calendar" },
    { icon: BarChart3, label: t('nav.analytics'), path: "/teacher/analytics" },
    { icon: Settings, label: t('nav.settings'), path: "/teacher/settings" },
  ];

  const studentNavItems = [
    { icon: BookOpen, label: t('nav.courses'), path: "/student/courses" },
    { icon: BarChart3, label: t('nav.progress'), path: "/student/progress" },
    { icon: User, label: t('nav.profile'), path: "/student/profile" },
  ];

  const navItems = currentRole === "teacher" ? teacherNavItems : studentNavItems;

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gradient-card border-b border-border shadow-soft">
      <div className="flex items-center space-x-8">
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <img 
            src={perleapLogo} 
            alt="Perleap Logo" 
            className="w-10 h-10 rounded-lg object-contain"
          />
          <span className="text-xl font-bold text-primary">{t('common.perleap')}</span>
        </Link>
        
        <div className="flex items-center space-x-1">
          {navItems.map(({ icon: Icon, label, path }) => (
            <Button
              key={path}
              variant={location.pathname === path ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex items-center space-x-2",
                location.pathname === path && "bg-primary text-primary-foreground shadow-glow"
              )}
              asChild
            >
              <Link to={path}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <LanguageToggle />
        <ThemeToggle />
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                {t('nav.profile')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/${currentRole}/settings`} className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  {t('nav.settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">
                <LogIn className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t('nav.login')}</span>
              </Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link to="/auth">
                <UserPlus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t('nav.register')}</span>
              </Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  );
};