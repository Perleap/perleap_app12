import { TeacherLayout } from "@/components/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, 
  Brain, 
  Target, 
  TrendingUp,
  Calendar,
  MessageSquare,
  Award,
  User,
  BookOpen
} from "lucide-react";

interface Assessment {
  id: string;
  completed_at: string;
  chat_context: any;
  assessment_data: any;
  soft_table: any;
  cra_table: any;
  student_feedback: string;
  teacher_feedback: string;
  recommendations: any;
  activity_runs: {
    activities: {
      title: string;
      goal: string;
    };
  };
}

export const StudentAnalyticsDetail = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId, studentId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'activity'>('date');
  const [student, setStudent] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  useEffect(() => {
    // Get student and course data from location state
    if (location.state) {
      setStudent(location.state.student);
      setCourse(location.state.course);
      setSelectedSubcategory(location.state.selectedSubcategory || null);
    }
    
    if (courseId && studentId) {
      fetchAssessments();
    }
  }, [courseId, studentId, location.state]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      
      // Fetch assessments for this student in this course
      const { data: assessmentsData, error } = await supabase
        .from('activity_assessments')
        .select(`
          *,
          activity_runs (
            activities (
              title,
              goal
            )
          )
        `)
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      
      setAssessments(assessmentsData as Assessment[] || []);
      
      // Auto-select the most recent assessment
      if (assessmentsData && assessmentsData.length > 0) {
        setSelectedAssessment(assessmentsData[0] as Assessment);
      }
      
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: "Error",
        description: "Failed to load student assessments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sortedAssessments = [...assessments].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
    } else {
      return a.activity_runs?.activities?.title?.localeCompare(b.activity_runs?.activities?.title || '') || 0;
    }
  });

  const renderSoftTable = (softTable: any) => {
    if (!softTable) return <p className="text-muted-foreground">No soft skills data available.</p>;
    
    const dimensions = ['Cognitive', 'Emotional', 'Social', 'Motivational', 'Behavioral'];
    const colors = ['bg-white/10', 'bg-red-500/10', 'bg-blue-500/10', 'bg-green-500/10', 'bg-yellow-500/10'];
    
    return (
      <div className="space-y-3">
        {dimensions.map((dimension, index) => {
          const data = softTable[dimension];
          if (!data) return null;
          
          return (
            <div key={dimension} className={`p-3 rounded-lg ${colors[index]}`}>
              <div className="grid grid-cols-5 gap-3 text-sm">
                <div>
                  <span className="font-medium">{dimension}</span>
                </div>
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">D:</span> {data.developmental_stage || 'N/A'}
                </div>
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">M:</span> {data.motivational_level || 'N/A'}
                </div>
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">L:</span> {data.leap_probability || 'N/A'}%
                </div>
                <div className="text-center">
                  <Badge variant={data.mindset_phase === 'Up' ? 'default' : 'secondary'}>
                    {data.mindset_phase || 'N/A'}
                  </Badge>
                </div>
              </div>
              {data.context && (
                <p className="text-xs text-muted-foreground mt-2">{data.context}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderCRATable = (craTable: any) => {
    if (!craTable) return <p className="text-muted-foreground">No content assessment data available.</p>;
    
    return (
      <div className="space-y-3">
        {Object.entries(craTable).map(([area, data]: [string, any]) => (
          <div key={area} className="p-3 rounded-lg bg-muted/50">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="font-medium text-sm">
                  {area === 'Primary Subject' ? (course?.title || area) : area}
                </span>
                <p className="text-xs text-muted-foreground">
                  {selectedSubcategory || data.ks_component}
                </p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-primary">{data.current_level}%</span>
                <p className="text-xs text-muted-foreground">Current Level</p>
              </div>
              <div>
                <p className="text-sm">{data.actionable_challenges}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <TeacherLayout title="Student Analytics">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/analytics')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-primary">
                {student?.full_name || student?.email?.split('@')[0] || 'Student'} Analytics
              </h2>
              <p className="text-muted-foreground">
                {course?.title || 'Course'} • Assessment History & Performance
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'activity')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="activity">Sort by Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assessment List */}
        <Card className="bg-gradient-card shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Assessment History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading assessments...</p>
              </div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No assessments found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedAssessments.map((assessment) => (
                  <Card 
                    key={assessment.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedAssessment?.id === assessment.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedAssessment(assessment)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">
                          {assessment.activity_runs?.activities?.title || 'Activity'}
                        </h4>
                        <Badge variant="outline">
                          {new Date(assessment.completed_at).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {assessment.activity_runs?.activities?.goal || 'Learning activity'}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {Array.isArray(assessment.chat_context) ? assessment.chat_context.length : 0} messages
                        </span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(assessment.completed_at).toLocaleTimeString([], { 
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAssessment ? (
            <>
              {/* SOFT Table */}
              <Card className="bg-gradient-card shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5" />
                    <span>Soft Related Abilities (SOFT)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-3 text-xs font-medium text-muted-foreground mb-3">
                    <div>Dimension</div>
                    <div className="text-center">Dev. Stage</div>
                    <div className="text-center">Motivation</div>
                    <div className="text-center">Leap Prob.</div>
                    <div className="text-center">Mindset</div>
                  </div>
                  <Separator className="mb-3" />
                  {renderSoftTable(selectedAssessment.soft_table)}
                </CardContent>
              </Card>

              {/* CRA Table */}
              <Card className="bg-gradient-card shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Content Related Abilities (CRA)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 text-xs font-medium text-muted-foreground mb-3">
                    <div>Area/Domain</div>
                    <div className="text-center">Current Level</div>
                    <div>Actionable Challenges</div>
                  </div>
                  <Separator className="mb-3" />
                  {renderCRATable(selectedAssessment.cra_table)}
                </CardContent>
              </Card>

              {/* Feedback & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-card shadow-medium">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Student Feedback</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">
                      {selectedAssessment.student_feedback || 'No student feedback available.'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card shadow-medium">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5" />
                      <span>Teacher Insights</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">
                      {selectedAssessment.teacher_feedback || 'No teacher feedback available.'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card className="bg-gradient-card shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Recommendations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Soft Skills Development</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedAssessment.recommendations?.soft_recommendations || 
                         'Continue developing critical thinking and engagement skills.'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Content Mastery</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedAssessment.recommendations?.content_recommendations || 
                         'Practice more complex problem-solving scenarios.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-gradient-card shadow-medium">
              <CardContent className="py-12 text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-primary mb-2">Select an Assessment</h3>
                <p className="text-muted-foreground">
                  Choose an assessment from the list to view detailed analytics and feedback.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
};