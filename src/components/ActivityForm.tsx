import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  title: string;
  component_name?: string;
  sub_component_name?: string;
  goal?: string;
  activity_content?: string;
  custom_focus?: string;
  difficulty: string;
  length: string;
  type: string;
  status: string;
  created_at: string;
}

interface ActivityFormProps {
  courseId: string;
  onActivityAdded?: () => void;
  trigger?: React.ReactNode;
  editActivity?: Activity;
  onClose?: () => void;
}

export const ActivityForm = ({ courseId, onActivityAdded, trigger, editActivity, onClose }: ActivityFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courseSubcategories, setCourseSubcategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: editActivity?.title || '',
    component_name: editActivity?.component_name || '',
    sub_component_name: editActivity?.sub_component_name || '',
    goal: editActivity?.goal || '',
    activity_content: editActivity?.activity_content || '',
    custom_focus: editActivity?.custom_focus || '',
    difficulty: editActivity?.difficulty || 'auto',
    length: editActivity?.length || 'auto',
    type: editActivity?.type || 'learning'
  });

  const { toast } = useToast();

  React.useEffect(() => {
    if (editActivity) {
      setOpen(true);
    }
  }, [editActivity]);

  React.useEffect(() => {
    fetchCourseSubcategories();
  }, [courseId]);

  const fetchCourseSubcategories = async () => {
    try {
      const { data: courseData, error } = await supabase
        .from('courses')
        .select('subcategory')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      
      if (courseData?.subcategory) {
        const subcategories = courseData.subcategory.split(', ').filter(Boolean);
        setCourseSubcategories(subcategories);
      }
    } catch (error) {
      console.error('Error fetching course subcategories:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let error;
      
      if (editActivity) {
        // Update existing activity
        const { error: updateError } = await supabase
          .from('activities')
          .update({
            ...formData,
            type: 'Training',
            status: 'active'
          })
          .eq('id', editActivity.id);
        error = updateError;
      } else {
        // Create new activity
        const { error: insertError } = await supabase
          .from('activities')
          .insert([{
            ...formData,
            course_id: courseId,
            type: 'Training',
            status: 'active'
          }]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: editActivity ? "Activity updated successfully!" : "Activity created successfully!"
      });

      if (!editActivity) {
        setFormData({
          title: '',
          component_name: '',
          sub_component_name: '',
          goal: '',
          activity_content: '',
          custom_focus: '',
          difficulty: 'auto',
          length: 'auto',
          type: 'learning'
        });
      }

      setOpen(false);
      onActivityAdded?.();
      onClose?.();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: "Error",
        description: `Failed to ${editActivity ? 'update' : 'create'} activity. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button className="bg-gradient-hero shadow-glow">
      <Plus className="w-4 h-4 mr-2" />
      Add Activity
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) onClose?.();
    }}>
      {!editActivity && (
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editActivity ? 'Edit Activity' : 'Create New Activity'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Activity Name *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter activity name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="component_name">Component Name</Label>
              <Select value={formData.component_name} onValueChange={(value) => handleInputChange('component_name', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select component name" />
                </SelectTrigger>
                <SelectContent>
                  {courseSubcategories.map((subcategory) => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sub_component_name">Sub Component Name</Label>
              <Input
                id="sub_component_name"
                value={formData.sub_component_name}
                onChange={(e) => handleInputChange('sub_component_name', e.target.value)}
                placeholder="e.g., Linear Equations"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custom_focus">Custom Focus</Label>
              <Input
                id="custom_focus"
                value={formData.custom_focus}
                onChange={(e) => handleInputChange('custom_focus', e.target.value)}
                placeholder="Specific learning focus"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Activity Goal</Label>
            <Textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => handleInputChange('goal', e.target.value)}
              placeholder="Describe the learning goal for this activity"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity_content">Activity Content</Label>
            <Textarea
              id="activity_content"
              value={formData.activity_content}
              onChange={(e) => handleInputChange('activity_content', e.target.value)}
              placeholder="Detailed content and instructions for the activity"
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
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
              <Label htmlFor="length">Activity Length</Label>
              <Select value={formData.length} onValueChange={(value) => handleInputChange('length', value)}>
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

          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setOpen(false);
                onClose?.();
              }}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="bg-gradient-hero shadow-glow"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading 
                ? (editActivity ? 'Updating...' : 'Creating...') 
                : (editActivity ? 'Update Activity' : 'Create Activity')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};