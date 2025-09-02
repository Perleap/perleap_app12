import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Course {
  id: string;
  title: string;
  subject: string;
  subcategory?: string;
}

interface CourseSubcategoryFilterProps {
  selectedCourse?: Course | null;
  selectedSubcategory?: string;
  onCourseChange: (course: Course | null) => void;
  onSubcategoryChange: (subcategory: string) => void;
  teacherId?: string;
  showSubcategory?: boolean;
}

export const CourseSubcategoryFilter = ({
  selectedCourse,
  selectedSubcategory,
  onCourseChange,
  onSubcategoryChange,
  teacherId,
  showSubcategory = true
}: CourseSubcategoryFilterProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, [teacherId]);

  useEffect(() => {
    if (selectedCourse) {
      fetchSubcategories(selectedCourse.subject);
    } else {
      setSubcategories([]);
      onSubcategoryChange('');
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      const query = supabase
        .from('courses')
        .select('id, title, subject, subcategory')
        .eq('status', 'active')
        .order('title');
      
      if (teacherId) {
        query.eq('teacher_id', teacherId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async (subject: string) => {
    try {
      const query = supabase
        .from('courses')
        .select('subcategory')
        .eq('subject', subject)
        .eq('status', 'active')
        .not('subcategory', 'is', null);
      
      if (teacherId) {
        query.eq('teacher_id', teacherId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const uniqueSubcategories = [...new Set(
        data?.map(item => item.subcategory).filter(Boolean) || []
      )];
      
      setSubcategories(uniqueSubcategories);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId) || null;
    onCourseChange(course);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="course" className="text-lg font-medium text-primary mb-2 block">Course</Label>
        <Select
          value={selectedCourse?.id || ''}
          onValueChange={handleCourseChange}
          disabled={loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50 max-h-[200px] overflow-y-auto">
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title} ({course.subject})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showSubcategory && selectedCourse && subcategories.length > 0 && (
        <div>
          <Label htmlFor="category" className="text-lg font-medium text-primary mb-2 block">Category</Label>
          <Select
            value={selectedSubcategory}
            onValueChange={onSubcategoryChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All categories (view course average)" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50 max-h-[200px] overflow-y-auto">
              <SelectItem value="">All categories</SelectItem>
              {subcategories.map((subcategory) => (
                <SelectItem key={subcategory} value={subcategory}>
                  {subcategory}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};