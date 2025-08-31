
import { TeacherLayout } from "@/components/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Target, 
  Users, 
  BookOpen,
  ArrowRight,
  GraduationCap
} from "lucide-react";

export const TeacherAnalytics = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseStudents(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      setUser(currentUser);

      // Fetch teacher's courses with student count
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          course_enrollments (count),
          activities (count)
        `)
        .eq('teacher_id', currentUser.id)
        .eq('status', 'active');

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStudents = async (courseId: string) => {
    try {
      // Fetch students enrolled in the course with their activity data
      const { data: studentsData, error } = await supabase
        .from('course_enrollments')
        .select(`
          student_id,
          enrolled_at,
          profiles!course_enrollments_student_id_fkey (
            user_id,
            full_name,
            email
          )
        `)
        .eq('course_id', courseId);

      if (error) throw error;

      // For each student, get their activity runs and SRA snapshots
      const studentsWithData = await Promise.all(
        (studentsData || []).map(async (enrollment) => {
          const studentId = enrollment.student_id;
          
          // Get activity runs for this course
          const { data: runs } = await supabase
            .from('activity_runs')
            .select(`
              *,
              activities!activity_runs_activity_id_fkey (
                course_id,
                type
              )
            `)
            .eq('student_id', studentId);

          // Filter runs for this specific course
          const courseRuns = (runs || []).filter(run => 
            run.activities?.course_id === courseId
          );

          // Get SRA snapshots for this course
          const { data: sraData } = await supabase
            .from('sra_snapshots')
            .select('*')
            .eq('student_id', studentId)
            .eq('course_id', courseId)
            .order('created_at', { ascending: false })
            .limit(10);

          // Calculate student metrics
          const completedRuns = courseRuns.filter(run => run.status === 'completed');
          const averageSRA = sraData && sraData.length > 0 
            ? Math.round(sraData.reduce((sum, snap) => sum + snap.d_score, 0) / sraData.length)
            : 0;

          return {
            ...enrollment,
            studentProfile: enrollment.profiles,
            totalActivities: courseRuns.length,
            completedActivities: completedRuns.length,
            averageSRAScore: averageSRA,
            lastActivity: courseRuns.length > 0 
              ? new Date(Math.max(...courseRuns.map(r => new Date(r.started_at).getTime())))
              : null,
            sraSnapshots: sraData || []
          };
        })
      );

      setCourseStudents(studentsWithData);
    } catch (error) {
      console.error('Error fetching course students:', error);
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive",
      });
    }
  };

  const getOverallMetrics = () => {
    const totalStudents = courses.reduce((sum, course) => sum + (course.course_enrollments?.[0]?.count || 0), 0);
    const totalActivities = courses.reduce((sum, course) => sum + (course.activities?.[0]?.count || 0), 0);
    const averageEnrollment = courses.length > 0 ? Math.round(totalStudents / courses.length) : 0;
    
    return {
      totalStudents,
      totalActivities,
      averageEnrollment,
      activeCourses: courses.length
    };
  };

  const handleStudentClick = (student: any) => {
    navigate(`/teacher/student-analytics/${selectedCourse?.id}/${student.student_id}`, {
      state: { 
        student: student.studentProfile,
        course: selectedCourse,
        studentData: student
      }
    });
  };

  const metrics = getOverallMetrics();

  return (
    <TeacherLayout title="Analytics">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">Analytics Dashboard</h2>
            <p className="text-muted-foreground">
              {selectedCourse ? `Course: ${selectedCourse.title}` : 'Overview of all your courses and student performance'}
            </p>
          </div>
          {selectedCourse && (
            <Button variant="outline" onClick={() => setSelectedCourse(null)}>
              Back to Overview
            </Button>
          )}
        </div>
      </div>

      {!selectedCourse ? (
        // Course Overview
        <>
          {/* Overall Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-card shadow-medium">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{metrics.activeCourses}</div>
                    <div className="text-sm text-muted-foreground">Active Courses</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-medium">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{metrics.totalStudents}</div>
                    <div className="text-sm text-muted-foreground">Total Students</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-medium">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{metrics.totalActivities}</div>
                    <div className="text-sm text-muted-foreground">Total Activities</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-medium">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{metrics.averageEnrollment}</div>
                    <div className="text-sm text-muted-foreground">Avg Students/Course</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Courses List */}
          <Card className="bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle>Your Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No courses found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => {
                    const studentCount = course.course_enrollments?.[0]?.count || 0;
                    const activityCount = course.activities?.[0]?.count || 0;
                    
                    return (
                      <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer" 
                            onClick={() => setSelectedCourse(course)}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-primary mb-1">{course.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{course.subject} • Grade {course.grade_level}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground ml-2" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-primary">{studentCount}</div>
                              <div className="text-xs text-muted-foreground">Students</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-primary">{activityCount}</div>
                              <div className="text-xs text-muted-foreground">Activities</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        // Course Students View
        <Card className="bg-gradient-card shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5" />
              <span>Students in {selectedCourse.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courseStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No students enrolled in this course.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {courseStudents.map((student) => (
                  <Card key={student.student_id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleStudentClick(student)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {student.studentProfile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'S'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-primary">
                              {student.studentProfile?.full_name || student.studentProfile?.email?.split('@')[0] || 'Unknown Student'}
                            </h3>
                            <p className="text-sm text-muted-foreground">{student.studentProfile?.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Enrolled: {new Date(student.enrolled_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{student.completedActivities}</div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{student.totalActivities}</div>
                            <div className="text-xs text-muted-foreground">Total Activities</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{student.averageSRAScore}</div>
                            <div className="text-xs text-muted-foreground">Avg SRA</div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                      
                      {student.totalActivities > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="text-sm font-medium">
                              {Math.round((student.completedActivities / student.totalActivities) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={(student.completedActivities / student.totalActivities) * 100} 
                            className="h-2" 
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </TeacherLayout>
  );
};
