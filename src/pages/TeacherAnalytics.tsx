
import { TeacherLayout } from "@/components/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CourseSubcategoryFilter } from "@/components/CourseSubcategoryFilter";
import { SOFTSkillsChart } from "@/components/SOFTSkillsChart";
import { 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Target, 
  Users, 
  BookOpen,
  ArrowRight,
  GraduationCap,
  ChevronLeft
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  subject: string;
  subcategory?: string;
}

interface StudentSOFTData {
  studentId: string;
  studentName: string;
  studentEmail: string;
  averageSOFT: {
    Cognitive: { developmental_stage: number; motivational_level: number; leap_probability: number };
    Emotional: { developmental_stage: number; motivational_level: number; leap_probability: number };
    Social: { developmental_stage: number; motivational_level: number; leap_probability: number };
    Motivational: { developmental_stage: number; motivational_level: number; leap_probability: number };
    Behavioral: { developmental_stage: number; motivational_level: number; leap_probability: number };
  };
  totalAssessments: number;
  lastAssessment: string | null;
}

export const TeacherAnalytics = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [courseSOFTData, setCourseSOFTData] = useState<any[]>([]);
  const [studentsSOFTData, setStudentsSOFTData] = useState<StudentSOFTData[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseAnalytics();
    }
  }, [selectedCourse, selectedSubcategory]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseAnalytics = async () => {
    if (!selectedCourse || !user) return;

    try {
      setLoading(true);

      // Get students enrolled in the course
      const { data: studentsData, error: studentsError } = await supabase
        .from('course_enrollments')
        .select(`
          student_id,
          profiles!course_enrollments_student_id_fkey (
            user_id,
            full_name,
            email
          )
        `)
        .eq('course_id', selectedCourse.id);

      if (studentsError) throw studentsError;

      if (!studentsData || studentsData.length === 0) {
        setCourseSOFTData([]);
        setStudentsSOFTData([]);
        return;
      }

      // Get activity assessments for all students in this course
      let assessmentsQuery = supabase
        .from('activity_assessments')
        .select('*')
        .eq('course_id', selectedCourse.id);

      // Filter by subcategory if selected
      if (selectedSubcategory) {
        // First get activities in the subcategory
        const { data: activitiesData } = await supabase
          .from('activities')
          .select('id')
          .eq('course_id', selectedCourse.id)
          .eq('sub_component_name', selectedSubcategory);

        if (activitiesData && activitiesData.length > 0) {
          const activityIds = activitiesData.map(a => a.id);
          // Get assessments for those activities
          const { data: activityRunsData } = await supabase
            .from('activity_runs')
            .select('id')
            .in('activity_id', activityIds);

          if (activityRunsData && activityRunsData.length > 0) {
            const runIds = activityRunsData.map(r => r.id);
            assessmentsQuery = assessmentsQuery.in('activity_run_id', runIds);
          } else {
            // No runs found for subcategory
            setCourseSOFTData([]);
            setStudentsSOFTData([]);
            return;
          }
        } else {
          // No activities found for subcategory
          setCourseSOFTData([]);
          setStudentsSOFTData([]);
          return;
        }
      }

      const { data: assessmentsData, error: assessmentsError } = await assessmentsQuery;

      if (assessmentsError) throw assessmentsError;

      if (!assessmentsData || assessmentsData.length === 0) {
        setCourseSOFTData([]);
        setStudentsSOFTData([]);
        return;
      }

      // Process SOFT skills data
      const dimensions = ['Cognitive', 'Emotional', 'Social', 'Motivational', 'Behavioral'];
      const courseSOFTAnalysis = dimensions.map(dimension => {
        const dimensionData = assessmentsData
          .map(assessment => assessment.soft_table?.[dimension])
          .filter(Boolean);

        if (dimensionData.length === 0) {
          return {
            dimension,
            averageDevStage: 0,
            averageMotivation: 0,
            averageLeapProb: 0,
            studentCount: 0
          };
        }

        return {
          dimension,
          averageDevStage: dimensionData.reduce((sum, d) => sum + (d.developmental_stage || 0), 0) / dimensionData.length,
          averageMotivation: dimensionData.reduce((sum, d) => sum + (d.motivational_level || 0), 0) / dimensionData.length,
          averageLeapProb: dimensionData.reduce((sum, d) => sum + (d.leap_probability || 0), 0) / dimensionData.length,
          studentCount: new Set(assessmentsData.map(a => a.student_id)).size
        };
      });

      setCourseSOFTData(courseSOFTAnalysis);

      // Process individual student SOFT data
      const studentsSOFT: StudentSOFTData[] = studentsData.map(enrollment => {
        const studentAssessments = assessmentsData.filter(a => a.student_id === enrollment.student_id);
        
        if (studentAssessments.length === 0) {
          return {
            studentId: enrollment.student_id,
            studentName: enrollment.profiles?.full_name || enrollment.profiles?.email?.split('@')[0] || 'Unknown',
            studentEmail: enrollment.profiles?.email || '',
            averageSOFT: {} as any,
            totalAssessments: 0,
            lastAssessment: null
          };
        }

        const averageSOFT: any = {};
        dimensions.forEach(dimension => {
          const dimensionData = studentAssessments
            .map(assessment => assessment.soft_table?.[dimension])
            .filter(Boolean);

          if (dimensionData.length > 0) {
            averageSOFT[dimension] = {
              developmental_stage: dimensionData.reduce((sum, d) => sum + (d.developmental_stage || 0), 0) / dimensionData.length,
              motivational_level: dimensionData.reduce((sum, d) => sum + (d.motivational_level || 0), 0) / dimensionData.length,
              leap_probability: dimensionData.reduce((sum, d) => sum + (d.leap_probability || 0), 0) / dimensionData.length
            };
          }
        });

        return {
          studentId: enrollment.student_id,
          studentName: enrollment.profiles?.full_name || enrollment.profiles?.email?.split('@')[0] || 'Unknown',
          studentEmail: enrollment.profiles?.email || '',
          averageSOFT,
          totalAssessments: studentAssessments.length,
          lastAssessment: studentAssessments.length > 0 
            ? studentAssessments.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0].completed_at
            : null
        };
      });

      setStudentsSOFTData(studentsSOFT);
    } catch (error) {
      console.error('Error fetching course analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load course analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (course: Course | null) => {
    setSelectedCourse(course);
    setSelectedSubcategory('');
  };

  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
  };

  const handleStudentClick = (student: StudentSOFTData) => {
    navigate(`/teacher/student-analytics/${selectedCourse?.id}/${student.studentId}`, {
      state: { 
        student: { 
          full_name: student.studentName,
          email: student.studentEmail,
          user_id: student.studentId
        },
        course: selectedCourse
      }
    });
  };

  return (
    <TeacherLayout title="Analytics">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">Analytics Dashboard</h2>
            <p className="text-muted-foreground">
              {selectedCourse 
                ? `${selectedCourse.title} - SOFT Skills Analysis` 
                : 'Select a course to view detailed SOFT skills analytics'
              }
            </p>
          </div>
          {selectedCourse && (
            <Button variant="outline" onClick={() => handleCourseChange(null)}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Course Selection
            </Button>
          )}
        </div>
      </div>

      {!selectedCourse ? (
        // Course Selection
        <Card className="bg-gradient-card shadow-medium">
          <CardHeader>
            <CardTitle>Select Course for Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <CourseSubcategoryFilter
                selectedCourse={selectedCourse}
                selectedSubcategory={selectedSubcategory}
                onCourseChange={handleCourseChange}
                onSubcategoryChange={handleSubcategoryChange}
                teacherId={user?.id}
                showSubcategory={false}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        // Course Analytics View
        <div className="space-y-6">
          {/* Course/Subcategory Filter */}
          <Card className="bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle>Filter Options</CardTitle>
            </CardHeader>
            <CardContent>
              <CourseSubcategoryFilter
                selectedCourse={selectedCourse}
                selectedSubcategory={selectedSubcategory}
                onCourseChange={handleCourseChange}
                onSubcategoryChange={handleSubcategoryChange}
                teacherId={user?.id}
                showSubcategory={true}
              />
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* SOFT Skills Chart */}
              <SOFTSkillsChart 
                data={courseSOFTData} 
                title={`Course Average SOFT Skills${selectedSubcategory ? ` - ${selectedSubcategory}` : ''}`}
              />

              {/* Students List */}
              <Card className="bg-gradient-card shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Students SOFT Skills Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {studentsSOFTData.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No student assessment data available for this course
                        {selectedSubcategory ? ` and subcategory "${selectedSubcategory}"` : ''}.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {studentsSOFTData.map((student) => (
                        <Card key={student.studentId} 
                              className="hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => handleStudentClick(student)}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium">
                                    {student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-medium text-primary">{student.studentName}</h3>
                                  <p className="text-sm text-muted-foreground">{student.studentEmail}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {student.totalAssessments} assessments
                                    {student.lastAssessment && 
                                      ` • Last: ${new Date(student.lastAssessment).toLocaleDateString()}`
                                    }
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-6">
                                {Object.entries(student.averageSOFT).slice(0, 3).map(([dimension, data]: [string, any]) => (
                                  <div key={dimension} className="text-center">
                                    <div className="text-sm font-medium text-primary">
                                      {data?.leap_probability?.toFixed(1) || '0'}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">{dimension}</div>
                                  </div>
                                ))}
                                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </TeacherLayout>
  );
};
