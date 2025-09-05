import { TeacherLayout } from "@/components/TeacherLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { StatsChart } from "@/components/StatsChart";
import { StudentDataTable } from "@/components/StudentDataTable";
import { NoticeBoard } from "@/components/NoticeBoard";
import { DashboardCalendar } from "@/components/DashboardCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Building2,
  Search,
  Bell,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export const TeacherDashboard = () => {
  const { t } = useLanguage();
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalActivities: 0,
    completedAssignments: 0
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get teacher's courses
        const { data: courses } = await supabase
          .from('courses')
          .select('id')
          .eq('teacher_id', user.id);

        const courseIds = courses?.map(c => c.id) || [];

        // Get enrolled students count
        const { count: studentsCount } = await supabase
          .from('course_enrollments')
          .select('student_id', { count: 'exact' })
          .in('course_id', courseIds);

        // Get activities count
        const { count: activitiesCount } = await supabase
          .from('activities')
          .select('id', { count: 'exact' })
          .in('course_id', courseIds);

        // Get total and completed assignments count
        let totalAssignments = 0;
        let completedCount = 0;

        if (courseIds.length > 0) {
          const { data: activities } = await supabase
            .from('activities')
            .select('id')
            .in('course_id', courseIds);

          const activityIds = activities?.map(a => a.id) || [];

          if (activityIds.length > 0) {
            // Get total activity runs
            const { count: totalRuns } = await supabase
              .from('activity_runs')
              .select('id', { count: 'exact' })
              .in('activity_id', activityIds);

            // Get completed activity runs
            const { count: completed } = await supabase
              .from('activity_runs')
              .select('id', { count: 'exact' })
              .eq('status', 'completed')
              .in('activity_id', activityIds);

            totalAssignments = totalRuns || 0;
            completedCount = completed || 0;
          }
        }

        const completionRate = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0;

        setDashboardStats({
          totalStudents: studentsCount || 0,
          totalCourses: courses?.length || 0,
          totalActivities: activitiesCount || 0,
          completedAssignments: completionRate
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <TeacherLayout title={t('common.dashboard')}>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <DashboardCard
              title={t('stats.totalStudents')}
              value={dashboardStats.totalStudents}
              icon={Users}
              className="bg-blue-500/10 border-blue-500/20"
            />
            <DashboardCard
              title={t('stats.myCourses')}
              value={dashboardStats.totalCourses}
              icon={BookOpen}
              className="bg-green-500/10 border-green-500/20"
            />
            <DashboardCard
              title={t('stats.activities')}
              value={dashboardStats.totalActivities}
              icon={GraduationCap}
              className="bg-blue-600/10 border-blue-600/20"
            />
            <DashboardCard
              title={t('stats.completionRate')}
              value={`${dashboardStats.completedAssignments}%`}
              icon={Building2}
              className="bg-orange-500/10 border-orange-500/20"
            />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Charts Section */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <StatsChart />
                </CardContent>
              </Card>
            </div>

            {/* Student Database */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <StudentDataTable />
                </CardContent>
              </Card>
            </div>

            {/* Right Panel */}
            <div className="lg:col-span-1 space-y-6">
              {/* Calendar */}
              <DashboardCalendar />
              
              {/* Notice Board */}
              <Card>
                <CardContent className="p-6">
                  <NoticeBoard />
                </CardContent>
              </Card>
            </div>
          </div>
    </TeacherLayout>
  );
};