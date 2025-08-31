import { TeacherLayout } from "@/components/TeacherLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityAssignmentDialog } from "@/components/ActivityAssignmentDialog";
import { Users, Mail, Calendar, BookOpen, Loader2, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const TeacherStudents = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      // Get current user to find their courses
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get teacher's courses
      const { data: teacherCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('teacher_id', user.id);

      if (coursesError) throw coursesError;
      setCourses(teacherCourses || []);
      
      // Get all users with role="student"
      const { data: studentProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          email,
          created_at,
          course_enrollments!course_enrollments_student_id_fkey(
            course_id,
            enrolled_at,
            courses!course_enrollments_course_id_fkey(
              title
            )
          )
        `)
        .eq('role', 'student');

      if (profilesError) {
        throw profilesError;
      }

      // Transform data to match UI expectations
      const transformedStudents = studentProfiles?.map(student => ({
        user_id: student.user_id,
        name: (student.full_name && student.full_name.trim() !== '') ? student.full_name.trim() : student.email?.split('@')[0] || 'Student',
        email: student.email,
        enrolledCourses: student.course_enrollments?.map((enrollment: any) => 
          enrollment.courses?.title
        ).filter(Boolean) || [],
        lastActive: getTimeAgo(student.created_at),
        avgSRA: Math.floor(Math.random() * 40) + 60 // Placeholder until we have real SRA data
      })) || [];

      setStudents(transformedStudents);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <TeacherLayout title="Students">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title="Students">
        <Card className="p-6 text-center">
          <p className="text-red-600">Error loading students: {error}</p>
          <Button onClick={fetchStudents} className="mt-4">
            Try Again
          </Button>
        </Card>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Students">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary">Students</h2>
          <p className="text-muted-foreground">Manage and monitor your students' progress</p>
        </div>
        <div className="flex gap-2">
          {courses.length > 0 && (
            <ActivityAssignmentDialog 
              courseId={courses[0].id}
              trigger={
                <Button className="bg-gradient-hero shadow-glow">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Activity
                </Button>
              }
            />
          )}
          <Button variant="outline" className="bg-gradient-hero shadow-glow">
            <Mail className="w-4 h-4 mr-2" />
            Invite Students
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {students.length === 0 ? (
          <Card className="bg-gradient-card shadow-medium">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">No Students Yet</h3>
              <p className="text-muted-foreground mb-6">
                Students will appear here once they register and enroll in your courses.
              </p>
              <Button className="bg-gradient-hero shadow-glow">
                <Mail className="w-4 h-4 mr-2" />
                Invite Students
              </Button>
            </CardContent>
          </Card>
        ) : (
          students.map((student, index) => (
            <Card key={index} className="bg-gradient-card shadow-medium">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-primary">{student.name}</h3>
                      <p className="text-muted-foreground">{student.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Last active: {student.lastActive}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary mb-1">{student.avgSRA}</div>
                    <div className="text-sm text-muted-foreground">Avg SRA Score</div>
                    {student.enrolledCourses.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {student.enrolledCourses.map((course, courseIndex) => (
                          <Badge key={courseIndex} variant="secondary">{course}</Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground mt-2">
                        No courses enrolled
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </TeacherLayout>
  );
};