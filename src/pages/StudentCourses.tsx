import { StudentLayout } from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Users, 
  Calendar,
  Loader2,
  GraduationCap
} from "lucide-react";

export const StudentCourses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      setUser(currentUser);

      // Fetch user's enrolled courses with detailed information including teacher profile
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          enrolled_at,
          courses (
            id,
            title,
            description,
            subject,
            grade_level,
            status,
            created_at,
            teacher_id,
            teacher_name
          )
        `)
        .eq('student_id', currentUser.id);

      if (enrollmentsError) throw enrollmentsError;

      const userCourses = enrollments?.map(enrollment => ({
        ...enrollment.courses,
        enrolled_at: enrollment.enrolled_at
      })).filter(Boolean) || [];

      // Fetch teacher profiles for courses that don't have teacher_name
      const coursesWithTeachers = await Promise.all(
        userCourses.map(async (course) => {
          if (!course.teacher_name && course.teacher_id) {
            const { data: teacherProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', course.teacher_id)
              .single();
            
            return {
              ...course,
              teacher_name: teacherProfile?.full_name || 'Unknown Teacher',
              teacher_full_name: teacherProfile?.full_name || 'Unknown Teacher'
            };
          }
          return {
            ...course,
            teacher_full_name: course.teacher_name || 'Unknown Teacher'
          };
        })
      );

      // For each course, get activity statistics
      const coursesWithStats = await Promise.all(
        coursesWithTeachers.map(async (course) => {
          // Get total activities in course
          const { data: activities } = await supabase
            .from('activities')
            .select('id, status')
            .eq('course_id', course.id);

          // Get user's activity runs for this course
          const { data: runs } = await supabase
            .from('activity_runs')
            .select('activity_id, status')
            .eq('student_id', currentUser.id)
            .in('activity_id', activities?.map(a => a.id) || []);

          // Get assigned activities for this course
          const { data: assignments } = await supabase
            .from('activity_assignments')
            .select('id, status')
            .eq('student_id', currentUser.id)
            .in('activity_id', activities?.map(a => a.id) || []);

          const totalActivities = activities?.length || 0;
          const completedActivities = runs?.filter(r => r.status === 'completed').length || 0;
          const assignedActivities = assignments?.length || 0;
          const progress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

          return {
            ...course,
            totalActivities,
            completedActivities,
            assignedActivities,
            progress
          };
        })
      );

      setCourses(coursesWithStats);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <StudentLayout title="My Courses">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="My Courses">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary">My Courses</h2>
          <p className="text-muted-foreground">Track your progress across all enrolled courses</p>
        </div>
      </div>

      <div className="grid gap-6">
        {courses.length === 0 ? (
          <Card className="bg-gradient-card shadow-medium">
            <CardContent className="p-12 text-center">
              <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">No Courses Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't been enrolled in any courses yet. Contact your teacher to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => (
            <Card 
              key={course.id} 
              className="bg-gradient-card shadow-medium hover:shadow-elegant transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/student/courses/${course.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl text-primary mb-2">{course.title}</CardTitle>
                    <p className="text-muted-foreground">{course.description}</p>
                  </div>
                  <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Course Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{course.subject}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Grade {course.grade_level}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Enrolled {formatDate(course.enrolled_at)}</span>
                  </div>
                </div>

                {/* Teacher Info */}
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Teacher: {course.teacher_name || course.teacher_full_name || 'Unknown Teacher'}
                  </span>
                </div>

                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Course Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {course.completedActivities}/{course.totalActivities} activities completed
                    </span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{course.totalActivities}</div>
                    <div className="text-xs text-muted-foreground">Total Activities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{course.completedActivities}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">{course.assignedActivities}</div>
                    <div className="text-xs text-muted-foreground">Assigned</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </StudentLayout>
  );
};