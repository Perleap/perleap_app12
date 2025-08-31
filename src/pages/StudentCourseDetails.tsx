import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StudentLayout } from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ActivityChatDialog } from "@/components/ActivityChatDialog";
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar,
  Target,
  Play,
  CheckCircle,
  Clock,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface Course {
  id: string;
  title: string;
  subject: string;
  grade_level: string;
  description: string;
  created_at: string;
  status: string;
  teacher: {
    full_name: string;
    email: string;
  };
}

interface Activity {
  id: string;
  title: string;
  component_name: string;
  sub_component_name: string;
  goal: string;
  activity_content: string;
  difficulty: string;
  length: string;
  type: string;
  status: string;
  created_at: string;
  isAssigned: boolean;
  isCompleted: boolean;
  assignedAt?: string;
  completedAt?: string;
}

export const StudentCourseDetails = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseAndActivities();
    } else {
      setLoading(false);
    }
  }, [courseId, user]);

  const fetchCourseAndActivities = async () => {
    try {
      if (!courseId || !user) {
        setLoading(false);
        return;
      }

      // Fetch course details with teacher information
      const { data: courseData, error: courseError } = await supabase
        .from('course_enrollments')
        .select(`
          courses (
            id,
            title,
            subject,
            grade_level,
            description,
            created_at,
            status,
            teacher_id
          )
        `)
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .maybeSingle();

      if (courseError) throw courseError;
      
      if (!courseData?.courses) {
        toast({
          title: "Access Denied",
          description: "You don't have access to this course",
          variant: "destructive"
        });
        navigate('/student/courses');
        return;
      }

      // Fetch teacher profile separately
      const { data: teacherData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', courseData.courses.teacher_id)
        .maybeSingle();

      setCourse({
        ...courseData.courses,
        teacher: teacherData || { full_name: 'Unknown Teacher', email: '' }
      });

      // Fetch activities with assignment and completion status
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('course_id', courseId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (activitiesError) throw activitiesError;

      // Get assignments for this student
      const { data: assignments } = await supabase
        .from('activity_assignments')
        .select('activity_id, assigned_at, status')
        .eq('student_id', user.id)
        .in('activity_id', activitiesData?.map(a => a.id) || []);

      // Get completed runs for this student
      const { data: runs } = await supabase
        .from('activity_runs')
        .select('activity_id, completed_at, status')
        .eq('student_id', user.id)
        .eq('status', 'completed')
        .in('activity_id', activitiesData?.map(a => a.id) || []);

      // Combine activities with assignment and completion status
      const enrichedActivities = activitiesData?.map(activity => {
        const assignment = assignments?.find(a => a.activity_id === activity.id);
        const run = runs?.find(r => r.activity_id === activity.id);
        
        return {
          ...activity,
          isAssigned: !!assignment,
          isCompleted: !!run,
          assignedAt: assignment?.assigned_at,
          completedAt: run?.completed_at
        };
      }) || [];

      // Sort activities to put teacher's default activity (Perleap) first
      enrichedActivities.sort((a, b) => {
        // Teacher's perleap activities (containing "Perleap" in title) come first
        const aIsPerleap = a.title.toLowerCase().includes('perleap');
        const bIsPerleap = b.title.toLowerCase().includes('perleap');
        
        if (aIsPerleap && !bIsPerleap) return -1;
        if (bIsPerleap && !aIsPerleap) return 1;
        // Then by creation date
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      setActivities(enrichedActivities);
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast({
        title: "Error",
        description: "Failed to load course details",
        variant: "destructive"
      });
      navigate('/student/courses');
    } finally {
      setLoading(false);
    }
  };

  const startActivity = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      setSelectedActivity(activity);
      setChatOpen(true);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Assessment': return 'bg-purple-100 text-purple-800';
      case 'Training': return 'bg-blue-100 text-blue-800';
      case 'Student-Chat': return 'bg-green-100 text-green-800';
      case 'Collaboration': return 'bg-orange-100 text-orange-800';
      case 'Innovation': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <StudentLayout title="Course Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading course details...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!course) {
    return (
      <StudentLayout title="Course Not Found">
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The course you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/student/courses')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Courses
          </Button>
        </div>
      </StudentLayout>
    );
  }

  const assignedActivities = activities.filter(a => a.isAssigned);
  const availableActivities = activities.filter(a => !a.isAssigned);
  const completedCount = activities.filter(a => a.isCompleted).length;
  const totalCount = activities.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <StudentLayout title="Course Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/student/courses')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">{course.title}</h1>
              <p className="text-muted-foreground">{course.subject} • Grade {course.grade_level}</p>
            </div>
          </div>
        </div>

        {/* Course Overview */}
        <Card className="bg-gradient-card shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>Course Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{course.description || "No description provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Teacher</p>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <p className="text-sm">{course.teacher?.full_name || course.teacher?.email?.split('@')[0] || 'Unknown'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Progress</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{completedCount}/{totalCount} completed</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Activities */}
        {assignedActivities.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-primary mb-4">Assigned Activities</h2>
            <div className="grid gap-4">
              {assignedActivities.map((activity) => (
                <Card key={activity.id} className="bg-gradient-card shadow-soft border-l-4 border-l-warning">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-primary mb-1">{activity.title}</h3>
                            {(activity.component_name || activity.sub_component_name) && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {activity.component_name}
                                {activity.component_name && activity.sub_component_name && ' > '}
                                {activity.sub_component_name}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Badge className={getDifficultyColor(activity.difficulty)}>
                              {activity.difficulty}
                            </Badge>
                            <Badge className={getTypeColor(activity.type)}>
                              {activity.type}
                            </Badge>
                          </div>
                        </div>
                        
                        {activity.goal && (
                          <div className="mb-3">
                            <p className="text-sm text-muted-foreground mb-1">Goal:</p>
                            <p className="text-sm">{activity.goal}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{activity.length} length</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Assigned {format(new Date(activity.assignedAt!), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {activity.isCompleted ? (
                              <div className="flex items-center space-x-2 text-success">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">Completed {format(new Date(activity.completedAt!), 'MMM d, yyyy')}</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-warning border-warning">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          
                          <Button 
                            onClick={() => startActivity(activity.id)}
                            disabled={activity.isCompleted}
                            className="bg-gradient-hero shadow-glow"
                          >
                            {activity.isCompleted ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Completed
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Start Activity
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Activities */}
        {availableActivities.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-primary mb-4">Available Activities</h2>
            <div className="grid gap-4">
              {availableActivities.map((activity) => (
                <Card key={activity.id} className="bg-gradient-card shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-primary mb-1">{activity.title}</h3>
                            {(activity.component_name || activity.sub_component_name) && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {activity.component_name}
                                {activity.component_name && activity.sub_component_name && ' > '}
                                {activity.sub_component_name}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Badge className={getDifficultyColor(activity.difficulty)}>
                              {activity.difficulty}
                            </Badge>
                            <Badge className={getTypeColor(activity.type)}>
                              {activity.type}
                            </Badge>
                          </div>
                        </div>
                        
                        {activity.goal && (
                          <div className="mb-3">
                            <p className="text-sm text-muted-foreground mb-1">Goal:</p>
                            <p className="text-sm">{activity.goal}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{activity.length} length</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {activity.isCompleted ? (
                              <div className="flex items-center space-x-2 text-success">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">Completed</span>
                              </div>
                            ) : (
                              <Badge variant="outline">
                                <Target className="w-3 h-3 mr-1" />
                                Available
                              </Badge>
                            )}
                          </div>
                          
                          <Button 
                            onClick={() => startActivity(activity.id)}
                            variant="outline"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Activity
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Activities */}
        {activities.length === 0 && (
          <Card className="bg-gradient-card shadow-soft">
            <CardContent className="p-12 text-center">
              <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">No Activities Yet</h3>
              <p className="text-muted-foreground">
                Your teacher hasn't added any activities to this course yet. Check back later!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Activity Chat Dialog */}
        <ActivityChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          activityTitle={selectedActivity?.title || ''}
          activityContent={selectedActivity?.activity_content}
          activityId={selectedActivity?.id || ''}
          activityGoal={selectedActivity?.goal}
        />
      </div>
    </StudentLayout>
  );
};