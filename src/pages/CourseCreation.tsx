import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Calendar,
  Target,
  Settings,
  Edit,
  Trash2,
  Paperclip,
  Brain,
  CheckCircle,
  Plus,
  Sparkles,
  Upload,
  ArrowRight
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActivityForm } from "@/components/ActivityForm";
import { FileUpload } from "@/components/FileUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const CourseCreation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedCRA, setGeneratedCRA] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [courseFiles, setCourseFiles] = useState<any[]>([]);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [activityFormData, setActivityFormData] = useState({
    title: '',
    component_name: '',
    sub_component_name: '',
    goal: '',
    activity_content: '',
    custom_focus: '',
    difficulty: 'auto',
    length: 'auto'
  });
  
  // Form data state
  const [courseData, setCourseData] = useState({
    title: '',
    gradeLevel: '',
    subject: '',
    description: '',
    objectives: '',
    prerequisites: '',
    resources: ''
  });
  
  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const mockCRAData = [
    { area: "Algebra", ks: ["Variables", "Equations", "Functions"], initialCL: 75, initialAC: "Strong foundation needed" },
    { area: "Geometry", ks: ["Shapes", "Proofs", "Measurements"], initialCL: 68, initialAC: "Visual learning preferred" },
    { area: "Statistics", ks: ["Data Analysis", "Probability", "Graphs"], initialCL: 82, initialAC: "Excel at interpretation" }
  ];

  const handleGenerateCRA = () => {
    setGeneratedCRA(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setCourseData(prev => ({ ...prev, [field]: value }));
  };

  const handleActivityInputChange = (field: string, value: string) => {
    setActivityFormData(prev => ({ ...prev, [field]: value }));
  };

  const addActivity = async () => {
    if (!activityFormData.title.trim()) return;

    // If course hasn't been created yet, store activities temporarily
    if (!createdCourseId) {
      const tempActivity = {
        id: `temp-${Date.now()}`,
        ...activityFormData,
        temp: true
      };
      setActivities(prev => [...prev, tempActivity]);
      
      // Reset form
      setActivityFormData({
        title: '',
        component_name: '',
        sub_component_name: '',
        goal: '',
        activity_content: '',
        custom_focus: '',
        difficulty: 'auto',
        length: 'auto'
      });

      toast({
        title: "Activity Added",
        description: "Activity will be saved when you create the course."
      });
      return;
    }

    // If course exists, save to database
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([{
          ...activityFormData,
          course_id: createdCourseId,
          type: 'Training',
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      setActivities(prev => [...prev, data]);
      
      // Reset form
      setActivityFormData({
        title: '',
        component_name: '',
        sub_component_name: '',
        goal: '',
        activity_content: '',
        custom_focus: '',
        difficulty: 'auto',
        length: 'auto'
      });

      toast({
        title: "Success",
        description: "Activity added successfully!"
      });
    } catch (error) {
      console.error('Error creating activity:', error);
      toast({
        title: "Error",
        description: "Failed to create activity. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async () => {
    if (!user) return null;
    
    setLoading(true);
    try {
      // Get the teacher's name from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const teacherName = profileData?.full_name || 
                         profileData?.email?.split('@')[0] || 
                         'Unknown Teacher';

      const { data, error } = await supabase
        .from('courses')
        .insert([{
          title: courseData.title,
          subject: courseData.subject,
          grade_level: courseData.gradeLevel,
          description: courseData.description,
          teacher_id: user.id,
          teacher_name: teacherName,
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCreatedCourseId(data.id);
      
      // Create default teacher activity
      const defaultActivity = {
        title: `${teacherName}'s Perleap`,
        component_name: 'Teacher Assistant',
        sub_component_name: 'AI Tutor',
        goal: `Chat with an AI version of ${teacherName} for personalized learning support and guidance.`,
        activity_content: `This is an AI-powered teaching assistant that represents ${teacherName}. Students can ask questions, get help with coursework, and receive personalized guidance based on the course curriculum.`,
        custom_focus: 'Personalized tutoring and course support',
        difficulty: 'adaptive',
        length: 'auto',
        course_id: data.id,
        type: 'Training',
        status: 'active'
      };

      const { error: activityError } = await supabase
        .from('activities')
        .insert([defaultActivity]);

      if (activityError) {
        console.error('Error creating default activity:', activityError);
        // Don't fail the whole process if default activity creation fails
      }
      
      // Save any temporary activities to the database
      if (activities.length > 0) {
        const tempActivities = activities.filter(act => act.temp);
        if (tempActivities.length > 0) {
          const activitiesToInsert = tempActivities.map(act => ({
            title: act.title,
            component_name: act.component_name,
            sub_component_name: act.sub_component_name,
            goal: act.goal,
            activity_content: act.activity_content,
            custom_focus: act.custom_focus,
            difficulty: act.difficulty,
            length: act.length,
            course_id: data.id,
            type: 'Training',
            status: 'active'
          }));

          const { data: savedActivities, error: actError } = await supabase
            .from('activities')
            .insert(activitiesToInsert)
            .select();

          if (!actError && savedActivities) {
            // Replace temp activities with real ones
            setActivities(prev => [
              ...prev.filter(act => !act.temp),
              ...savedActivities
            ]);
          }
        }
      }

      toast({
        title: "Success",
        description: "Course created successfully with default teacher activity!"
      });
      
      return data.id;
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    // If moving from step 3 to 4, create the course first
    if (currentStep === 3 && !createdCourseId) {
      const courseId = await createCourse();
      if (!courseId) return; // Don't proceed if course creation failed
    }
    
    setCurrentStep(Math.min(totalSteps, currentStep + 1));
  };

  const handleFinish = () => {
    navigate('/teacher/classes');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">Basic Course Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseName">Course Name</Label>
                  <Input 
                    id="courseName" 
                    placeholder="e.g., Advanced Mathematics"
                    value={courseData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Select value={courseData.gradeLevel} onValueChange={(value) => handleInputChange('gradeLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">Grade 9</SelectItem>
                      <SelectItem value="10">Grade 10</SelectItem>
                      <SelectItem value="11">Grade 11</SelectItem>
                      <SelectItem value="12">Grade 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Area</Label>
                  <Select value={courseData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Course Duration</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semester">Semester</SelectItem>
                      <SelectItem value="year">Full Year</SelectItem>
                      <SelectItem value="quarter">Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Course Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe the course objectives, key topics, and learning outcomes..."
                className="min-h-[100px]"
                value={courseData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">Learning Objectives & Activities</h3>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="objectives">Course Objectives</Label>
                    <Textarea 
                      id="objectives" 
                      placeholder="List the main learning objectives for this course..."
                      className="min-h-[120px]"
                      value={courseData.objectives}
                      onChange={(e) => handleInputChange('objectives', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prerequisites">Prerequisites</Label>
                    <Textarea 
                      id="prerequisites" 
                      placeholder="What should students know before taking this course?"
                      className="min-h-[80px]"
                      value={courseData.prerequisites}
                      onChange={(e) => handleInputChange('prerequisites', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resources">Additional Resources</Label>
                    <Textarea 
                      id="resources" 
                      placeholder="List textbooks, websites, or other resources..."
                      className="min-h-[80px]"
                      value={courseData.resources}
                      onChange={(e) => handleInputChange('resources', e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {/* File Upload Section */}
                <div>
                  <h4 className="text-lg font-semibold text-primary mb-4 flex items-center space-x-2">
                    <Upload className="w-5 h-5" />
                    <span>Course Files</span>
                  </h4>
                  <p className="text-muted-foreground mb-4">
                    Upload files that will be available to students in this course.
                  </p>
                  
                  <FileUpload
                    courseId={createdCourseId || undefined}
                    onFileUploaded={(file) => {
                      setCourseFiles(prev => [...prev, file]);
                      toast({
                        title: "File Added",
                        description: `${file.name} will be available to students.`
                      });
                    }}
                    existingFiles={courseFiles}
                    onFileRemove={(fileId) => {
                      setCourseFiles(prev => prev.filter(f => f.id !== fileId));
                    }}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif"
                    maxSize={10}
                    multiple={true}
                  />
                </div>

                <Separator />

                {/* Activity Creation Section */}
                <div>
                  <h4 className="text-lg font-semibold text-primary mb-4">Add Course Activities</h4>
                  <p className="text-muted-foreground mb-4">
                    Create activities for your course. You can add multiple activities here.
                  </p>
                  
                  {/* Activity Creation Form */}
                  <Card className="bg-gradient-card shadow-soft mb-4">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Plus className="w-5 h-5 text-primary" />
                        <span>Create New Activity</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="activity_title">Activity Name *</Label>
                          <Input
                            id="activity_title"
                            value={activityFormData.title}
                            onChange={(e) => handleActivityInputChange('title', e.target.value)}
                            placeholder="Enter activity name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="activity_component">Component Name</Label>
                          <Input
                            id="activity_component"
                            value={activityFormData.component_name}
                            onChange={(e) => handleActivityInputChange('component_name', e.target.value)}
                            placeholder="e.g., Algebra"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="activity_sub_component">Sub Component Name</Label>
                          <Input
                            id="activity_sub_component"
                            value={activityFormData.sub_component_name}
                            onChange={(e) => handleActivityInputChange('sub_component_name', e.target.value)}
                            placeholder="e.g., Linear Equations"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="activity_focus">Custom Focus</Label>
                          <Input
                            id="activity_focus"
                            value={activityFormData.custom_focus}
                            onChange={(e) => handleActivityInputChange('custom_focus', e.target.value)}
                            placeholder="Specific learning focus"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="activity_goal">Activity Goal</Label>
                        <Textarea
                          id="activity_goal"
                          value={activityFormData.goal}
                          onChange={(e) => handleActivityInputChange('goal', e.target.value)}
                          placeholder="Describe the learning goal for this activity"
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="activity_content">Activity Content</Label>
                        <Textarea
                          id="activity_content"
                          value={activityFormData.activity_content}
                          onChange={(e) => handleActivityInputChange('activity_content', e.target.value)}
                          placeholder="Detailed content and instructions for the activity"
                          className="min-h-[120px]"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="activity_difficulty">Difficulty Level</Label>
                          <Select value={activityFormData.difficulty} onValueChange={(value) => handleActivityInputChange('difficulty', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                              <SelectItem value="auto">Auto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="activity_length">Activity Length</Label>
                          <Select value={activityFormData.length} onValueChange={(value) => handleActivityInputChange('length', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select length" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="short">Short</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="long">Long</SelectItem>
                              <SelectItem value="auto">Auto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button 
                          onClick={addActivity}
                          disabled={!activityFormData.title.trim() || loading}
                          className="bg-gradient-hero shadow-glow"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {loading ? 'Adding...' : 'Add Activity'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Created Activities List */}
                  {activities.length > 0 && (
                    <Card className="bg-gradient-card shadow-soft">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-primary" />
                          <span>Created Activities ({activities.length})</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {activities.map((activity) => (
                            <div key={activity.id} className="p-4 border rounded-lg bg-accent/20">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <h4 className="font-medium text-primary">{activity.title}</h4>
                                  {activity.component_name && (
                                    <p className="text-sm text-muted-foreground">
                                      Component: {activity.component_name}
                                      {activity.sub_component_name && ` > ${activity.sub_component_name}`}
                                    </p>
                                  )}
                                  {activity.goal && (
                                    <p className="text-sm text-muted-foreground">{activity.goal}</p>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <Badge variant="secondary">{activity.difficulty}</Badge>
                                  <Badge variant="outline">{activity.length}</Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">Generate CRA Table</h3>
              <p className="text-muted-foreground mb-6">
                Our AI will analyze your course information to generate a comprehensive Content-Related Abilities (CRA) table.
              </p>
              
              {!generatedCRA ? (
                <div className="bg-accent/30 p-6 rounded-lg border border-border">
                  <div className="text-center">
                    <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-primary mb-2">Ready to Generate CRA</h4>
                    <p className="text-muted-foreground mb-4">
                      Click below to let our AI create your personalized CRA table based on your course details.
                    </p>
                    <Button onClick={handleGenerateCRA} className="bg-gradient-hero shadow-glow">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate CRA Table
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="font-medium text-success">CRA Table Generated Successfully</span>
                  </div>
                  
                  {mockCRAData.map((area, index) => (
                    <Card key={index} className="bg-gradient-card shadow-soft">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-primary">{area.area}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Knowledge & Skills</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {area.ks.map((skill, skillIndex) => (
                                <Badge key={skillIndex} variant="secondary">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Initial CL Score</Label>
                              <div className="text-lg font-semibold text-primary">{area.initialCL}%</div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Assessment Context</Label>
                              <p className="text-sm text-muted-foreground">{area.initialAC}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">Add Course Activities</h3>
              <p className="text-muted-foreground mb-6">
                Create activities for your course. You can add multiple activities and continue adding more after the course is created.
              </p>
              
              <div className="space-y-6">
                {/* Activity Creation Form */}
                <Card className="bg-gradient-card shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Plus className="w-5 h-5 text-primary" />
                      <span>Create New Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="activity_title">Activity Name *</Label>
                        <Input
                          id="activity_title"
                          value={activityFormData.title}
                          onChange={(e) => handleActivityInputChange('title', e.target.value)}
                          placeholder="Enter activity name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="activity_component">Component Name</Label>
                        <Input
                          id="activity_component"
                          value={activityFormData.component_name}
                          onChange={(e) => handleActivityInputChange('component_name', e.target.value)}
                          placeholder="e.g., Algebra"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="activity_sub_component">Sub Component Name</Label>
                        <Input
                          id="activity_sub_component"
                          value={activityFormData.sub_component_name}
                          onChange={(e) => handleActivityInputChange('sub_component_name', e.target.value)}
                          placeholder="e.g., Linear Equations"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="activity_focus">Custom Focus</Label>
                        <Input
                          id="activity_focus"
                          value={activityFormData.custom_focus}
                          onChange={(e) => handleActivityInputChange('custom_focus', e.target.value)}
                          placeholder="Specific learning focus"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity_goal">Activity Goal</Label>
                      <Textarea
                        id="activity_goal"
                        value={activityFormData.goal}
                        onChange={(e) => handleActivityInputChange('goal', e.target.value)}
                        placeholder="Describe the learning goal for this activity"
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity_content">Activity Content</Label>
                      <Textarea
                        id="activity_content"
                        value={activityFormData.activity_content}
                        onChange={(e) => handleActivityInputChange('activity_content', e.target.value)}
                        placeholder="Detailed content and instructions for the activity"
                        className="min-h-[120px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="activity_difficulty">Difficulty Level</Label>
                        <Select value={activityFormData.difficulty} onValueChange={(value) => handleActivityInputChange('difficulty', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="activity_length">Activity Length</Label>
                        <Select value={activityFormData.length} onValueChange={(value) => handleActivityInputChange('length', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select length" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">Short</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="long">Long</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={addActivity}
                        disabled={!activityFormData.title.trim() || !createdCourseId || loading}
                        className="bg-gradient-hero shadow-glow"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {loading ? 'Adding...' : 'Add Activity'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Created Activities List */}
                {activities.length > 0 && (
                  <Card className="bg-gradient-card shadow-soft">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span>Created Activities ({activities.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {activities.map((activity, index) => (
                          <div key={activity.id} className="p-4 border rounded-lg bg-accent/20">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h4 className="font-medium text-primary">{activity.title}</h4>
                                {activity.component_name && (
                                  <p className="text-sm text-muted-foreground">
                                    Component: {activity.component_name}
                                    {activity.sub_component_name && ` > ${activity.sub_component_name}`}
                                  </p>
                                )}
                                {activity.goal && (
                                  <p className="text-sm text-muted-foreground">{activity.goal}</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Badge variant="secondary">{activity.difficulty}</Badge>
                                <Badge variant="outline">{activity.length}</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!createdCourseId && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-primary mb-2">Course Created Successfully</h4>
                    <p className="text-muted-foreground">
                      You can now add activities to your course using the form above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">Review & Create</h3>
              <p className="text-muted-foreground mb-6">
                Review your course setup before creating your Perleap course.
              </p>
              
              <div className="space-y-4">
                <Card className="bg-gradient-card shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span>Course Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Name:</span> {courseData.title || 'Not specified'}</div>
                      <div><span className="text-muted-foreground">Grade:</span> Grade {courseData.gradeLevel || 'Not specified'}</div>
                      <div><span className="text-muted-foreground">Subject:</span> {courseData.subject || 'Not specified'}</div>
                      <div><span className="text-muted-foreground">Status:</span> Ready to launch</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-card shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-primary" />
                      <span>CRA Areas Generated</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {mockCRAData.map((area, index) => (
                        <Badge key={index} className="bg-gradient-hero text-white">{area.area}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="bg-accent/30 p-6 rounded-lg border border-border">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-primary mb-2">Ready to Launch</h4>
                    <p className="text-muted-foreground mb-4">
                      Your Perleap course is ready! You can start inviting students and managing activities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="teacher" />
      
      <main className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Create New Perleap Course</h1>
          <p className="text-muted-foreground">Set up your AI-powered learning experience in just a few steps</p>
        </div>

        {/* Progress */}
        <Card className="mb-8 bg-gradient-card shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm font-medium text-primary">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-4 text-xs text-muted-foreground">
              <span>Basic Info</span>
              <span>Objectives</span>
              <span>CRA Generation</span>
              <span>Activities</span>
              <span>Review</span>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="mb-8 bg-gradient-card shadow-medium">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-4">
            {/* File attachment button - always visible */}
            <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Attach Files
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Course Files</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <FileUpload
                    courseId={createdCourseId || undefined}
                    onFileUploaded={(file) => {
                      setCourseFiles(prev => [...prev, file]);
                      toast({
                        title: "File Added",
                        description: `${file.name} will be available to students.`
                      });
                    }}
                    existingFiles={courseFiles}
                    onFileRemove={(fileId) => {
                      setCourseFiles(prev => prev.filter(f => f.id !== fileId));
                    }}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif"
                    maxSize={10}
                    multiple={true}
                  />
                </div>
              </DialogContent>
            </Dialog>

            {currentStep < totalSteps ? (
              <Button 
                onClick={handleNextStep}
                disabled={(currentStep === 3 && !generatedCRA) || loading}
                className="bg-gradient-hero shadow-glow"
              >
                {loading ? 'Creating Course...' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinish} className="bg-gradient-hero shadow-glow">
                <CheckCircle className="w-4 h-4 mr-2" />
                Finish & Go to Classes
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};