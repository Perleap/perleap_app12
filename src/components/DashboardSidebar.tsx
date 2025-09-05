import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Database, 
  Calendar, 
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from "lucide-react";
import perleapLogo from "@/assets/perleap-logo-new.png";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const DashboardSidebar = ({ collapsed, onToggle }: DashboardSidebarProps) => {
  const { t } = useLanguage();
  
  const sidebarItems = [
    { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: "/teacher/dashboard" },
    { icon: BookOpen, label: t('sidebar.classes'), path: "/teacher/classes" },
    { icon: Database, label: t('sidebar.database'), path: "/teacher/database" },
    { icon: Calendar, label: t('sidebar.calendar'), path: "/teacher/calendar" },
    { icon: BarChart3, label: t('sidebar.analytics'), path: "/teacher/analytics" },
    { icon: Settings, label: t('sidebar.settings'), path: "/teacher/settings" },
  ];
  return (
    <div className={cn(
      "h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <img 
                src={perleapLogo} 
                alt="Perleap Logo" 
                className="w-8 h-8 rounded-lg object-contain"
              />
              <span className="font-bold text-primary">{t('common.perleap')}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1 h-8 w-8"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
            {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 rounded-lg transition-colors group",
                  "hover:bg-primary/10 hover:text-primary",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground",
                  collapsed && "justify-center"
                )
              }
            >
              <item.icon className={cn("w-5 h-5", !collapsed && "mr-3")} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};