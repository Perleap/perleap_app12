import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TeacherLayout } from "@/components/TeacherLayout";
import { ActivitiesManager } from "@/components/ActivitiesManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Calendar,
  Target,
  Settings,
  Edit,
  Trash2,
  Paperclip
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { FileUpload } from "@/components/FileUpload";

interface Course {
  id: string;
  title: string;
  subject: string;
  grade_level: string;
  description: string;
  created_at: string;
  status: string;
}

interface Student {
  user_id: string;
  full_name: string;
  email: string;
  enrolled_at: string;
}

export const TeacherCourseDetails = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [courseFiles, setCourseFiles] = useState<any[]>([]);
  const [activitiesRefreshKey, setActivitiesRefreshKey] = useState(0);
  const [editCourse, setEditCourse] = useState({
    title: "",
    subject: "",
    grade_level: "",
    description: ""
  });

  useEffect(() => {
    if (courseId && user) {
      fetchCourseDetails();
      fetchEnrolledStudents();
      fetchCourseFiles();
      ensureDefaultTeacherActivity();
    }
  }, [courseId, user]);

  const fetchCourseDetails = async () => {
    try {
      if (!courseId || !user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('teacher_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Course Not Found",
          description: "The course you're looking for doesn't exist or you don't have access to it.",
          variant: "destructive"
        });
        navigate('/teacher/classes');
        return;
      }
      
      setCourse(data);
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast({
        title: "Error",
        description: "Failed to load course details",
        variant: "destructive"
      });
      navigate('/teacher/classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      if (!courseId) return;

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          enrolled_at,
          profiles!inner (
            user_id,
            full_name,
            email
          )
        `)
        .eq('course_id', courseId);

      if (error) throw error;

      const studentsData = data.map(enrollment => ({
        user_id: enrollment.profiles.user_id,
        full_name: enrollment.profiles.full_name,
        email: enrollment.profiles.email,
        enrolled_at: enrollment.enrolled_at
      }));

      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
    }
  };

  const handleEditCourse = async () => {
    try {
      if (!course) return;

      const { error } = await supabase
        .from('courses')
        .update(editCourse)
        .eq('id', course.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course updated successfully"
      });

      setIsEditDialogOpen(false);
      fetchCourseDetails();
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update course",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm("Are you sure you want to delete this course? This will also delete all activities and assignments.")) {
      return;
    }

    try {
      if (!course) return;

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course deleted successfully"
      });

      navigate('/teacher/classes');
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete course",
        variant: "destructive"
      });
    }
  };

  const fetchCourseFiles = async () => {
    try {
      if (!courseId) return;

      const { data, error } = await supabase
        .from('course_files')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;
      setCourseFiles(data || []);
    } catch (error) {
      console.error('Error fetching course files:', error);
    }
  };

  const ensureDefaultTeacherActivity = async () => {
    try {
      if (!courseId || !user) return;

      // Check if a default teacher activity already exists
      const { data: existingActivities, error: checkError } = await supabase
        .from('activities')
        .select('*')
        .eq('course_id', courseId)
        .ilike('title', '%perleap');
        
      console.log('Checking for existing default activities:', { existingActivities, checkError });

      if (checkError) throw checkError;

      // If no default activity exists, create one
      if (!existingActivities || existingActivities.length === 0) {
        // Get teacher's profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', user.id)
          .maybeSingle();
        
        const teacherName = profileData?.full_name || 
                           profileData?.email?.split('@')[0] || 
                           'Teacher';

        const defaultActivity = {
          title: `${teacherName}'s Perleap`,
          component_name: 'Teacher Assistant',
          sub_component_name: 'AI Tutor',
          goal: `Chat with an AI version of ${teacherName} for personalized learning support and guidance.`,
          activity_content: `This is an AI-powered teaching assistant that represents ${teacherName}. Students can ask questions, get help with coursework, and receive personalized guidance based on the course curriculum.`,
          custom_focus: 'Personalized tutoring and course support',
          difficulty: 'auto',
          length: 'auto',
          course_id: courseId,
          type: 'Training',
          status: 'active'
        };

        const { data: createdActivity, error: createError } = await supabase
          .from('activities')
          .insert([defaultActivity])
          .select()
          .single();

        if (createError) {
          console.error('Error creating default teacher activity:', createError);
        } else {
          console.log('Default teacher activity created successfully:', createdActivity);
          // Trigger a refresh of the activities manager
          setActivitiesRefreshKey(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error ensuring default teacher activity:', error);
    }
  };

  const openEditDialog = () => {
    if (course) {
      setEditCourse({
        title: course.title,
        subject: course.subject,
        grade_level: course.grade_level,
        description: course.description
      });
      setIsEditDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <TeacherLayout title="Course Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading course details...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  if (!course) {
    return (
      <TeacherLayout title="Course Not Found">
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The course you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/teacher/classes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Classes
          </Button>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Course Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/teacher/classes')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Classes
            </Button>
            <h1 className="text-2xl font-bold text-primary">{course.title}</h1>
            <p className="text-muted-foreground">{course.subject} • Grade {course.grade_level}</p>
          </div>
        </div>

        {/* Course Summary Card */}
        <Card className="bg-gradient-card shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>Course Overview</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setIsFileDialogOpen(true)}>
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={openEditDialog}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDeleteCourse}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{course.description || "No description provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p className="text-sm">{format(new Date(course.created_at), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                  {course.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="activities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activities" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Activities</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Students ({students.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activities">
            <ActivitiesManager key={activitiesRefreshKey} courseId={course.id} courseName={course.title} />
          </TabsContent>

          <TabsContent value="students">
            <Card className="bg-gradient-card shadow-soft">
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-primary mb-2">No Students Enrolled</h3>
                    <p className="text-muted-foreground">
                      No students have been enrolled in this course yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {students.map((student) => (
                      <div key={student.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {(student.full_name && student.full_name.trim() !== '') 
                              ? student.full_name.trim() 
                              : student.email?.split('@')[0] || 'Unnamed Student'
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Enrolled {format(new Date(student.enrolled_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            View Progress
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Course Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Course Title</Label>
                <Input
                  id="edit-title"
                  value={editCourse.title}
                  onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                  placeholder="e.g., Advanced Mathematics"
                />
              </div>
              <div>
                <Label htmlFor="edit-subject">Subject</Label>
                <Input
                  id="edit-subject"
                  value={editCourse.subject}
                  onChange={(e) => setEditCourse({ ...editCourse, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <Label htmlFor="edit-grade_level">Grade Level</Label>
                <Select value={editCourse.grade_level} onValueChange={(value) => setEditCourse({ ...editCourse, grade_level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">Grade 6</SelectItem>
                    <SelectItem value="7">Grade 7</SelectItem>
                    <SelectItem value="8">Grade 8</SelectItem>
                    <SelectItem value="9">Grade 9</SelectItem>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editCourse.description}
                  onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
                  placeholder="Brief description of the course"
                />
              </div>
              <Button onClick={handleEditCourse} className="w-full">
                Update Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* File Upload Dialog */}
        <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Course Files</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Upload files that will be available to students in this course.
              </p>
              <FileUpload
                courseId={courseId}
                onFileUploaded={(file) => {
                  setCourseFiles(prev => [...prev, file]);
                  toast({
                    title: "File Uploaded",
                    description: `${file.name} has been added to the course.`
                  });
                }}
                existingFiles={courseFiles}
                onFileRemove={(fileId) => {
                  setCourseFiles(prev => prev.filter(f => f.id !== fileId));
                  toast({
                    title: "File Removed",
                    description: "File has been removed from the course."
                  });
                }}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif"
                maxSize={10}
                multiple={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TeacherLayout>
  );
};