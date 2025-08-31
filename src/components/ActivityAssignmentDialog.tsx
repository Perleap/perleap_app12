import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, BookOpen } from "lucide-react";

interface ActivityAssignmentDialogProps {
  courseId: string;
  trigger: React.ReactNode;
}

export const ActivityAssignmentDialog = ({ courseId, trigger }: ActivityAssignmentDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, courseId]);

  const fetchData = async () => {
    try {
      // Fetch activities for this course
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('course_id', courseId)
        .eq('status', 'published');

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);

      // Fetch enrolled students for this course
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          student_id,
          profiles (
            user_id,
            full_name,
            email
          )
        `)
        .eq('course_id', courseId);

      if (enrollmentsError) throw enrollmentsError;
      setStudents(enrollmentsData?.map(e => e.profiles).filter(Boolean) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  };

  const handleAssignActivity = async () => {
    if (!selectedActivity || selectedStudents.length === 0) {
      toast({
        title: "Incomplete Selection",
        description: "Please select an activity and at least one student",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create assignments for selected students
      const assignments = selectedStudents.map(studentId => ({
        activity_id: selectedActivity,
        student_id: studentId,
        assigned_by: user.id,
        status: 'assigned'
      }));

      const { error } = await supabase
        .from('activity_assignments')
        .insert(assignments);

      if (error) throw error;

      toast({
        title: "Activities Assigned",
        description: `Successfully assigned activity to ${selectedStudents.length} student(s)`,
      });

      setOpen(false);
      setSelectedActivity("");
      setSelectedStudents([]);
    } catch (error) {
      console.error('Error assigning activity:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Assign Activity to Students
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Activity Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Select Activity
            </label>
            <Select value={selectedActivity} onValueChange={setSelectedActivity}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an activity to assign" />
              </SelectTrigger>
              <SelectContent>
                {activities.map(activity => (
                  <SelectItem key={activity.id} value={activity.id}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{activity.title}</span>
                      <Badge variant="secondary" className="ml-2">
                        {activity.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Select Students ({selectedStudents.length} selected)
            </label>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {students.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No students enrolled in this course
                </p>
              ) : (
                students.map(student => (
                  <Card 
                    key={student.user_id}
                    className={`cursor-pointer transition-colors ${
                      selectedStudents.includes(student.user_id) 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => toggleStudentSelection(student.user_id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {student.full_name || student.email?.split('@')[0] || 'Student'}
                          </p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        {selectedStudents.includes(student.user_id) && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignActivity}
              disabled={loading || !selectedActivity || selectedStudents.length === 0}
            >
              {loading ? "Assigning..." : `Assign to ${selectedStudents.length} Student(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};