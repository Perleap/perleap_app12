import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ActivityForm } from "./ActivityForm";
import { 
  BookOpen, 
  Calendar, 
  Target, 
  Clock, 
  BarChart3,
  Plus,
  Settings,
  Edit,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

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

interface ActivitiesManagerProps {
  courseId: string;
  courseName: string;
}

interface EditActivityState {
  isOpen: boolean;
  activity: Activity | null;
}

export const ActivitiesManager = ({ courseId, courseName }: ActivitiesManagerProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editActivity, setEditActivity] = useState<EditActivityState>({ isOpen: false, activity: null });
  const { toast } = useToast();

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [courseId]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'auto': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getLengthColor = (length: string) => {
    switch (length) {
      case 'short': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'long': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'auto': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'archived': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditActivity({ isOpen: true, activity });
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Are you sure you want to delete this activity? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity deleted successfully"
      });

      fetchActivities();
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete activity",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card shadow-soft">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Activities</h2>
          <p className="text-muted-foreground">Manage activities for {courseName}</p>
        </div>
        <ActivityForm courseId={courseId} onActivityAdded={fetchActivities} />
      </div>

      {activities.length === 0 ? (
        <Card className="bg-gradient-card shadow-soft">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">No Activities Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first activity to get started with this course.
            </p>
            <ActivityForm 
              courseId={courseId} 
              onActivityAdded={fetchActivities}
              trigger={
                <Button className="bg-gradient-hero shadow-glow">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Activity
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {activities.map((activity) => (
            <Card key={activity.id} className="bg-gradient-card shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg text-primary">{activity.title}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(activity.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditActivity(activity)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteActivity(activity.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(activity.component_name || activity.sub_component_name) && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Components</p>
                      <div className="flex flex-wrap gap-2">
                        {activity.component_name && (
                          <Badge variant="secondary">{activity.component_name}</Badge>
                        )}
                        {activity.sub_component_name && (
                          <Badge variant="outline">{activity.sub_component_name}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {activity.goal && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center">
                        <Target className="w-3 h-3 mr-1" />
                        Goal
                      </p>
                      <p className="text-sm">{activity.goal}</p>
                    </div>
                  )}

                  {activity.activity_content && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Content</p>
                      <p className="text-sm line-clamp-2">{activity.activity_content}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        <Badge className={getDifficultyColor(activity.difficulty)}>
                          {activity.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Badge className={getLengthColor(activity.length)}>
                          {activity.length}
                        </Badge>
                      </div>
                    </div>
                    {activity.custom_focus && (
                      <Badge variant="outline" className="text-xs">
                        Focus: {activity.custom_focus}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Activity Dialog */}
      {editActivity.isOpen && editActivity.activity && (
        <ActivityForm 
          courseId={courseId}
          editActivity={editActivity.activity}
          onActivityAdded={() => {
            fetchActivities();
            setEditActivity({ isOpen: false, activity: null });
          }}
          onClose={() => setEditActivity({ isOpen: false, activity: null })}
        />
      )}
    </div>
  );
};