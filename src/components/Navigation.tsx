import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  GraduationCap, 
  Menu, 
  X, 
  User, 
  LogOut,
  BookOpen,
  Users,
  LogIn,
  UserPlus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavigationProps {
  userRole?: 'teacher' | 'student';
}

export const Navigation = ({ userRole }: NavigationProps = {}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const currentRole = profile?.role || userRole;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
            <GraduationCap className="w-8 h-8" />
            <span className="text-2xl font-bold">Perleap</span>
          </Link>
          
          {currentRole && (
            <nav className="hidden md:flex items-center space-x-6">
              {currentRole === 'teacher' ? (
                <>
                  <Link to="/teacher" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
                  <Link to="/teacher/courses" className="text-foreground hover:text-primary transition-colors">Courses</Link>
                  <Link to="/teacher/courses/new" className="text-foreground hover:text-primary transition-colors">Create Course</Link>
                </>
              ) : (
                <>
                  <Link to="/student" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
                  <Link to="/student/courses" className="text-foreground hover:text-primary transition-colors">My Courses</Link>
                </>
              )}
            </nav>
          )}

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{profile?.full_name || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/auth')}
                  className="flex items-center space-x-1"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-hero shadow-glow flex items-center space-x-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Register</span>
                </Button>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur">
          <div className="px-6 py-4 space-y-4">
            {currentRole ? (
              <>
                {currentRole === 'teacher' ? (
                  <>
                    <Link 
                      to="/teacher" 
                      className="block text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/teacher/courses" 
                      className="block text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Courses
                    </Link>
                    <Link 
                      to="/teacher/courses/new" 
                      className="block text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Create Course
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/student" 
                      className="block text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/student/courses" 
                      className="block text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Courses
                    </Link>
                  </>
                )}
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
                <Button 
                  className="w-full bg-gradient-hero shadow-glow"
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};