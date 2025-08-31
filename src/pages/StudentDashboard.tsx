import { StudentLayout } from "@/components/StudentLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Brain, 
  TrendingUp, 
  Play,
  CheckCircle,
  Target,
  Award,
  MessageCircle
} from "lucide-react";

export const StudentDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityRuns, setActivityRuns] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sraSnapshots, setSraSnapshots] = useState<any[]>([]);
  const [assignedActivities, setAssignedActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      setUser(currentUser);

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();
      
      setProfile(profileData);

      // Fetch user's enrolled courses with teacher info
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          course_id,
          courses (
            id,
            title,
            subject,
            grade_level,
            teacher_id
          )
        `)
        .eq('student_id', currentUser.id);

      if (enrollmentsError) throw enrollmentsError;

      const userCourses = enrollments?.map(e => e.courses).filter(Boolean) || [];
      
      // Fetch teacher data for each course separately
      const coursesWithTeachers = await Promise.all(
        userCourses.map(async (course) => {
          const { data: teacherData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', course.teacher_id)
            .single();
          
          return {
            ...course,
            teacher: teacherData || { full_name: 'Unknown Teacher', email: '' }
          };
        })
      );
      
      setCourses(coursesWithTeachers);

      // Fetch activities from enrolled courses
      if (userCourses.length > 0) {
        const courseIds = userCourses.map(c => c.id);
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .in('course_id', courseIds)
          .eq('status', 'published');

        if (activitiesError) throw activitiesError;
        setActivities(activitiesData || []);

        // Fetch activity runs for this student
        const { data: runsData, error: runsError } = await supabase
          .from('activity_runs')
          .select('*')
          .eq('student_id', currentUser.id);

        if (runsError) throw runsError;
        setActivityRuns(runsData || []);

        // Fetch SRA snapshots
        const { data: sraData, error: sraError } = await supabase
          .from('sra_snapshots')
          .select('*')
          .eq('student_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (sraError) throw sraError;
        setSraSnapshots(sraData || []);
      }

      // Fetch assigned activities with teacher info
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('activity_assignments')
        .select(`
          *,
          activities (
            id,
            title,
            type,
            course_id,
            courses (
              title,
              teacher_id
            )
          )
        `)
        .eq('student_id', currentUser.id)
        .eq('status', 'assigned');

      if (assignmentsError) throw assignmentsError;
      
      // Fetch teacher data for each assignment separately
      const assignmentsWithTeachers = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          const teacherId = assignment.activities?.courses?.teacher_id;
          let teacherData = null;
          
          if (teacherId) {
            const { data } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('user_id', teacherId)
              .single();
            teacherData = data;
          }
          
          return {
            ...assignment,
            activities: {
              ...assignment.activities,
              courses: {
                ...assignment.activities?.courses,
                teacher: teacherData || { full_name: 'Unknown Teacher', email: '' }
              }
            }
          };
        })
      );
      
      setAssignedActivities(assignmentsWithTeachers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startNewChatActivity = async () => {
    try {
      const chatActivities = activities.filter(a => a.type === 'Student-Chat');
      
      if (chatActivities.length === 0) {
        toast({
          title: "No Chat Activities Available",
          description: "Ask your teacher to create chat activities for your courses.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('activity_runs')
        .insert({
          student_id: user?.id,
          activity_id: chatActivities[0].id,
          status: 'in_progress',
          messages: []
        })
        .select()
        .single();

      if (error) throw error;

      navigate('/student-chat', { state: { runId: data.id, activityId: chatActivities[0].id } });
      
      toast({
        title: "Chat Started",
        description: "Starting your new chat activity...",
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat activity",
        variant: "destructive",
      });
    }
  };

  const takeAssessment = () => {
    const assessmentActivities = activities.filter(a => a.type === 'Assessment');
    
    if (assessmentActivities.length === 0) {
      toast({
        title: "No Assessments Available",
        description: "Ask your teacher to create assessments for your courses.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Assessment Feature",
      description: "Assessment functionality coming soon!",
    });
  };

  const viewFullProgress = () => {
    toast({
      title: "Progress View",
      description: "Full progress view coming soon!",
    });
  };

  const getActivityProgress = (activityId: string) => {
    const run = activityRuns.find(r => r.activity_id === activityId);
    if (!run) return 0;
    
    if (run.status === 'completed') return 100;
    if (run.status === 'in_progress') return Math.min(50 + (run.messages?.length || 0) * 10, 90);
    return 0;
  };

  const getAverageSRAScore = () => {
    if (sraSnapshots.length === 0) return 0;
    const latestScores = sraSnapshots.slice(0, 5);
    const average = latestScores.reduce((sum, snap) => sum + snap.d_score, 0) / latestScores.length;
    return Math.round(average);
  };

  const getSRAProgress = () => {
    const dimensions = ['Vision', 'Values', 'Thinking', 'Connection', 'Action'];
    return dimensions.map(dimension => {
      const snapshots = sraSnapshots.filter(s => s.dimension === dimension).slice(0, 2);
      const current = snapshots[0]?.d_score || 0;
      const previous = snapshots[1]?.d_score || current;
      const change = current - previous;
      
      return {
        dimension,
        score: current,
        change: change > 0 ? `+${change}` : change === 0 ? '0' : `${change}`
      };
    });
  };

  return (
    <StudentLayout title="Dashboard">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Welcome back {profile?.full_name || user?.email?.split('@')[0] || 'Student'}!
            </h1>
            <p className="text-muted-foreground">Continue your personalized learning experience</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Active Perleaps"
            value={loading ? "..." : assignedActivities.length.toString()}
            subtitle="Assigned"
            icon={BookOpen}
            trend="neutral"
          />
          <DashboardCard
            title="Avg SRA Score"
            value={loading ? "..." : getAverageSRAScore().toString()}
            subtitle="All dimensions"
            icon={Brain}
            trend="up"
            trendValue="+7%"
          />
          <DashboardCard
            title="Activities Completed"
            value={loading ? "..." : activityRuns.filter(r => r.status === 'completed').length.toString()}
            subtitle="Total"
            icon={CheckCircle}
            trend="up"
            trendValue={`+${activityRuns.filter(r => r.status === 'completed').length}`}
          />
          <DashboardCard
            title="Enrolled Courses"
            value={loading ? "..." : courses.length.toString()}
            subtitle="Active"
            icon={Award}
            trend="neutral"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Perleaps */}
          <Card className="bg-gradient-card shadow-medium lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span>My Active Perleaps</span>
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/student/courses')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading assigned activities...</p>
                  </div>
                ) : assignedActivities.filter(a => a.activities?.type !== 'perleap').length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No active perleaps assigned yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">Your teacher will assign activities soon!</p>
                  </div>
                ) : (
                  assignedActivities
                    .filter(a => a.activities?.type !== 'perleap')
                    .slice(0, 3)
                    .map((assignment, index) => {
                      const activity = assignment.activities;
                      const course = activity?.courses;
                      const teacher = course?.teacher;
                      const run = activityRuns.find(r => r.activity_id === activity?.id);
                      const progress = getActivityProgress(activity?.id);
                      
                      return (
                        <div key={assignment.id} className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-primary">{activity?.title}</h4>
                              <p className="text-sm text-muted-foreground">{course?.title || "Unknown Course"}</p>
                               <p className="text-xs text-muted-foreground">
                                 Teacher: {teacher?.full_name || teacher?.email?.split('@')[0] || 'Unknown Teacher'}
                               </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={run?.status === "completed" ? "default" : "secondary"} className="mb-2">
                                {activity?.type}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {assignment.due_date && new Date(assignment.due_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Progress</span>
                              <span className="text-xs font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>

                          <div className="flex items-center justify-between">
                            {run?.status === "completed" ? (
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-success" />
                                <span className="text-sm text-success font-medium">Completed</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {run ? "In progress" : "Ready to start"}
                              </span>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <Brain className="w-4 h-4 text-education-secondary" />
                              <span className="text-xs font-medium text-success">SRA</span>
                              {(!run || run.status !== "completed") && (
                                <Button 
                                  size="sm" 
                                  className="ml-2"
                                  onClick={async () => {
                                    if (activity?.type === 'Student-Chat') {
                                      try {
                                        const { data, error } = await supabase
                                          .from('activity_runs')
                                          .insert({
                                            student_id: user?.id,
                                            activity_id: activity.id,
                                            status: 'in_progress',
                                            messages: []
                                          })
                                          .select()
                                          .single();

                                        if (error) throw error;

                                        await supabase
                                          .from('activity_assignments')
                                          .update({ status: 'started' })
                                          .eq('id', assignment.id);

                                        navigate('/student-chat', { state: { runId: data.id, activityId: activity.id } });
                                        
                                        toast({
                                          title: "Activity Started",
                                          description: "Starting your assigned activity...",
                                        });
                                      } catch (error) {
                                        console.error('Error starting activity:', error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to start activity",
                                          variant: "destructive",
                                        });
                                      }
                                    } else {
                                      takeAssessment();
                                    }
                                  }}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  {run ? "Continue" : "Start"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
            </CardContent>
          </Card>

          {/* Quick Actions & SRA Progress */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-gradient-card shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="w-5 h-5 text-primary" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => navigate('/student/courses')} 
                  variant="default"
                  className="w-full justify-start"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  View All Courses
                </Button>
                
                <Button 
                  onClick={() => navigate('/student/progress')} 
                  variant="outline"
                  className="w-full justify-start"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Track Progress
                </Button>

                <Button 
                  onClick={() => navigate('/student/profile')} 
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* SRA Progress */}
            <Card className="bg-gradient-card shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Current SRA Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">Loading SRA data...</p>
                  </div>
                ) : sraSnapshots.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">No SRA data available yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Complete activities to see your progress</p>
                  </div>
                ) : (
                  getSRAProgress().map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <span className="text-sm font-medium">{item.dimension}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-primary">{item.score}</span>
                          <span className={`text-xs font-medium ${
                            item.change.startsWith('+') ? 'text-success' : 
                            item.change === '0' ? 'text-muted-foreground' : 'text-destructive'
                          }`}>
                            {item.change}
                          </span>
                        </div>
                      </div>
                      <Progress value={Math.min(item.score, 100)} className="h-1" />
                    </div>
                  ))
                )}
                {sraSnapshots.length > 0 && (
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate('/student/progress')}
                    >
                      View Detailed Progress
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Courses */}
        <Card className="mt-8 bg-gradient-card shadow-medium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>My Courses</span>
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/student/courses')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">No courses enrolled yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Ask your teacher to enroll you in a course!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.slice(0, 6).map((course) => (
                  <div 
                    key={course.id} 
                    className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/student/courses/${course.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{course.subject}</Badge>
                      <Badge variant="secondary">{course.grade_level}</Badge>
                    </div>
                    <h4 className="font-medium text-primary mb-1">{course.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Teacher: {course.teacher?.full_name || 'Unknown Teacher'}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Activities: {activities.filter(a => a.course_id === course.id).length}
                      </span>
                      <span className="text-xs text-success font-medium">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
    </StudentLayout>
  );
};
