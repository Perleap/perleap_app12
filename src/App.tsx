
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { StudentDashboard } from "./pages/StudentDashboard";
import { StudentCourses } from "./pages/StudentCourses";
import { StudentCourseDetails } from "./pages/StudentCourseDetails";
import { StudentSettings } from "./pages/StudentSettings";
import { StudentChat } from "./pages/StudentChat";
import { StudentProgress } from "./pages/StudentProgress";
import { StudentProfile } from "./pages/StudentProfile";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { TeacherClasses } from "./pages/TeacherClasses";
import { TeacherStudents } from "./pages/TeacherStudents";
import { TeacherSettings } from "./pages/TeacherSettings";
import { TeacherDatabase } from "./pages/TeacherDatabase";
import { TeacherCalendar } from "./pages/TeacherCalendar";
import { TeacherAnalytics } from "./pages/TeacherAnalytics";
import { TeacherCourseDetails } from "./pages/TeacherCourseDetails";
import { CourseCreation } from "./pages/CourseCreation";
import { StudentAnalyticsDetail } from "./pages/StudentAnalyticsDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Student Routes */}
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/courses" element={<StudentCourses />} />
              <Route path="/student/courses/:id" element={<StudentCourseDetails />} />
              <Route path="/student/progress" element={<StudentProgress />} />
              <Route path="/student/profile" element={<StudentProfile />} />
              <Route path="/student/settings" element={<StudentSettings />} />
              <Route path="/student-chat" element={<StudentChat />} />
              
              {/* Teacher Routes */}
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/classes" element={<TeacherClasses />} />
              <Route path="/teacher/classes/:id" element={<TeacherCourseDetails />} />
              <Route path="/teacher/students" element={<TeacherStudents />} />
              <Route path="/teacher/settings" element={<TeacherSettings />} />
              <Route path="/teacher/database" element={<TeacherDatabase />} />
              <Route path="/teacher/calendar" element={<TeacherCalendar />} />
              <Route path="/teacher/analytics" element={<TeacherAnalytics />} />
              <Route path="/teacher/student-analytics/:courseId/:studentId" element={<StudentAnalyticsDetail />} />
              <Route path="/teacher/create-course" element={<CourseCreation />} />
              
              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
