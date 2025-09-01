import { useState, useEffect } from "react";
import { TeacherLayout } from "@/components/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, BookOpen, Activity, Search, UserPlus, Edit, Trash2, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FileUpload } from "@/components/FileUpload";

interface Course {
  id: string;
  title: string;
  subject: string;
  subcategory?: string;
  grade_level: string;
  description: string;
  student_count: number;
  activity_count: number;
  created_at: string;
}

interface Student {
  user_id: string;
  full_name: string;
  email: string;
}

export const TeacherClasses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [newCourse, setNewCourse] = useState({
    title: "",
    subject: "",
    grade_level: "",
    description: "",
    subcategory: ""
  });
  const [courseFiles, setCourseFiles] = useState<any[]>([]);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  const [editCourse, setEditCourse] = useState({
    title: "",
    subject: "",
    grade_level: "",
    description: "",
    subcategory: ""
  });

  useEffect(() => {
    if (user) {
      fetchCourses();
      fetchStudents();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      if (!user) return;

      const { data: coursesData, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          subject,
          subcategory,
          grade_level,
          description,
          created_at
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get student counts and activity counts for each course
      const coursesWithCounts = await Promise.all(
        (coursesData || []).map(async (course) => {
          // Get student count
          const { count: studentCount } = await supabase
            .from('course_enrollments')
            .select('student_id', { count: 'exact' })
            .eq('course_id', course.id);

          // Get activity count
          const { count: activityCount } = await supabase
            .from('activities')
            .select('id', { count: 'exact' })
            .eq('course_id', course.id);

          return {
            ...course,
            student_count: studentCount || 0,
            activity_count: activityCount || 0
          };
        })
      );

      setCourses(coursesWithCounts);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('role', 'student');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleCreateCourse = async () => {
    try {
      if (!user) return;

      // Get teacher's profile for default activity
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const teacherName = profileData?.full_name || 
                         profileData?.email?.split('@')[0] || 
                         'Teacher';

      const { data: courseData, error } = await supabase
        .from('courses')
        .insert([{
          ...newCourse,
          teacher_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      setCreatedCourseId(courseData.id);

      // Create default teacher activity immediately
      const defaultActivity = {
        title: `${teacherName}'s Perleap`,
        component_name: 'Teacher Assistant',
        sub_component_name: 'AI Tutor',
        goal: `Chat with an AI version of ${teacherName} for personalized learning support and guidance.`,
        activity_content: `This is an AI-powered teaching assistant that represents ${teacherName}. Students can ask questions, get help with coursework, and receive personalized guidance based on the course curriculum.`,
        custom_focus: 'Personalized tutoring and course support',
        difficulty: 'auto',
        length: 'auto',
        course_id: courseData.id,
        type: 'Training',
        status: 'active'
      };

      const { error: activityError } = await supabase
        .from('activities')
        .insert([defaultActivity]);

      if (activityError) {
        console.error('Error creating default activity:', activityError);
        // Don't fail the whole process
      }

      toast({
        title: "Success",
        description: "Course created successfully with default teacher activity!"
      });

      setIsCreateDialogOpen(false);
      setNewCourse({ title: "", subject: "", grade_level: "", description: "", subcategory: "" });
      setCourseFiles([]);
      setCreatedCourseId(null);
      fetchCourses();
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive"
      });
    }
  };

  const handleAssignStudent = async (studentId: string) => {
    try {
      if (!selectedCourse) return;

      const { error } = await supabase
        .from('course_enrollments')
        .insert([{
          course_id: selectedCourse.id,
          student_id: studentId
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student assigned to course successfully"
      });

      setIsAssignDialogOpen(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (error: any) {
      console.error('Error assigning student:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign student",
        variant: "destructive"
      });
    }
  };

  const handleEditCourse = async () => {
    try {
      if (!selectedCourse) return;

      const { error } = await supabase
        .from('courses')
        .update(editCourse)
        .eq('id', selectedCourse.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course updated successfully"
      });

      setIsEditDialogOpen(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update course",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This will also delete all activities and assignments.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course deleted successfully"
      });

      fetchCourses();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete course",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setEditCourse({
      title: course.title,
      subject: course.subject,
      grade_level: course.grade_level,
      description: course.description,
      subcategory: course.subcategory || ""
    });
    setIsEditDialogOpen(true);
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <TeacherLayout title="Classes">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading classes...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Classes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">My Classes</h2>
            <p className="text-muted-foreground">Manage your courses and student assignments</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-hero shadow-glow">
                <Plus className="w-4 h-4 mr-2" />
                Create New Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    placeholder="e.g., Advanced Mathematics"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newCourse.subject}
                    onChange={(e) => setNewCourse({ ...newCourse, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <Label htmlFor="grade_level">Grade Level</Label>
                  <Select value={newCourse.grade_level} onValueChange={(value) => setNewCourse({ ...newCourse, grade_level: value })}>
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
                  <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                  <Input
                    id="subcategory"
                    value={newCourse.subcategory}
                    onChange={(e) => setNewCourse({ ...newCourse, subcategory: e.target.value })}
                    placeholder="e.g., Geometry, Algebra"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    placeholder="Brief description of the course"
                  />
                </div>
                
                {/* File Upload Section */}
                <div>
                  <Label className="flex items-center space-x-2 mb-2">
                    <Paperclip className="w-4 h-4" />
                    <span>Course Files (Optional)</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
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
                
                <Button onClick={handleCreateCourse} className="w-full">
                  Create Course
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <Card className="bg-gradient-card shadow-medium">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">No Classes Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first class to start managing students and activities.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-hero shadow-glow">
                <Plus className="w-4 h-4 mr-2" />
                Create New Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="bg-gradient-card shadow-medium">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {course.subject} {course.subcategory && `• ${course.subcategory}`}
                      </p>
                    </div>
                    <Badge variant="secondary">Grade {course.grade_level}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {course.description || "No description provided"}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>{course.student_count} students</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span>{course.activity_count} activities</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedCourse(course);
                        setIsAssignDialogOpen(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Assign Student
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/teacher/classes/${course.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
                <Label htmlFor="edit-subcategory">Subcategory (Optional)</Label>
                <Input
                  id="edit-subcategory"
                  value={editCourse.subcategory}
                  onChange={(e) => setEditCourse({ ...editCourse, subcategory: e.target.value })}
                  placeholder="e.g., Geometry, Algebra"
                />
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

        {/* Assign Student Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Student to {selectedCourse?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {students.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No students available to assign
                </p>
              ) : (
                students.map((student) => (
                  <div key={student.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {(student.full_name && student.full_name.trim() !== '') 
                          ? student.full_name.trim() 
                          : student.email?.split('@')[0] || 'Unnamed Student'
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleAssignStudent(student.user_id)}
                    >
                      Assign
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TeacherLayout>
  );
};