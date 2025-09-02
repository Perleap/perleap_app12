import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityData {
  name: string;
  value: number;
}

interface CourseProgress {
  name: string;
  value: number;
  color: string;
}

export const StatsChart = () => {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get teacher's courses
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title')
          .eq('teacher_id', user.id);

        if (!courses || courses.length === 0) {
          setActivityData([]);
          setCourseProgress([
            { name: 'No Courses', value: 100, color: '#E5E7EB' }
          ]);
          return;
        }

        const courseIds = courses.map(c => c.id);

        // Get activity runs data for the last 6 courses
        const activityDataPromises = courses.slice(0, 6).map(async (course) => {
          const { count } = await supabase
            .from('activity_runs')
            .select('id', { count: 'exact' })
            .eq('status', 'completed')
            .in('activity_id', 
              (await supabase
                .from('activities')
                .select('id')
                .eq('course_id', course.id)
              ).data?.map(a => a.id) || []
            );
          
          return {
            name: course.title.slice(0, 8),
            value: count || 0
          };
        });

        const resolvedActivityData = await Promise.all(activityDataPromises);
        setActivityData(resolvedActivityData);

        // Calculate overall progress (completed vs total activities)
        const { count: totalActivities } = await supabase
          .from('activities')
          .select('id', { count: 'exact' })
          .in('course_id', courseIds);

        const { count: completedRuns } = await supabase
          .from('activity_runs')
          .select('id', { count: 'exact' })
          .eq('status', 'completed')
          .in('activity_id', 
            (await supabase
              .from('activities')
              .select('id')
              .in('course_id', courseIds)
            ).data?.map(a => a.id) || []
          );

        const completedPercentage = totalActivities && totalActivities > 0 
          ? Math.round((completedRuns || 0) / totalActivities * 100)
          : 0;

        setCourseProgress([
          { name: 'Completed', value: completedPercentage, color: '#3B82F6' },
          { name: 'Remaining', value: 100 - completedPercentage, color: '#E5E7EB' }
        ]);

      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-sm text-muted-foreground">Loading statistics...</div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Completed Activities by Course</h3>
        {activityData.length === 0 ? (
          <div className="text-sm text-muted-foreground">No activity data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activityData}>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                className="drop-shadow-sm"
                style={{
                  filter: 'drop-shadow(0 1px 2px hsl(var(--primary) / 0.3))'
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie Chart */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Overall Progress</h3>
          <span className="text-2xl font-bold text-primary">{courseProgress[0]?.value || 0}%</span>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie
              data={courseProgress}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              {courseProgress.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center space-x-4 mt-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-muted"></div>
            <span className="text-xs text-muted-foreground">Remaining</span>
          </div>
        </div>
      </div>
    </div>
  );
};