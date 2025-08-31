import perleapLogo from "@/assets/perleap-logo-new.png";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";
import { BookOpen, Users, BarChart3, Settings, User, Database, Calendar, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface NavigationProps {
  userRole?: "teacher" | "student";
}

export const Navigation = ({ userRole }: NavigationProps) => {
  const location = useLocation();
  const { userRole: detectedRole, signOut } = useAuth();
  
  // Use detected role from auth context, fallback to prop
  const currentRole = userRole || detectedRole;
  
  const teacherNavItems = [
    { icon: Users, label: "Classes", path: "/teacher/classes" },
    { icon: Database, label: "Database", path: "/teacher/database" },
    { icon: Calendar, label: "Calendar", path: "/teacher/calendar" },
    { icon: BarChart3, label: "Analytics", path: "/teacher/analytics" },
    { icon: Settings, label: "Settings", path: "/teacher/settings" },
  ];

  const studentNavItems = [
    { icon: BookOpen, label: "My Perleaps", path: "/student/courses" },
    { icon: BarChart3, label: "Progress", path: "/student/progress" },
    { icon: User, label: "Profile", path: "/student/profile" },
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
          <span className="text-xl font-bold text-primary">Perleap</span>
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
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/${currentRole}/settings`} className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};