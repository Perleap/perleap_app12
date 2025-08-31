import { useState, useEffect } from "react";
import { TeacherLayout } from "@/components/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Database, Users, BookOpen, Activity, Filter, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface DatabaseStats {
  totalStudents: number;
  totalCourses: number;
  totalActivities: number;
  totalActivityRuns: number;
}

interface RecentActivity {
  id: string;
  student_name: string;
  course_title: string;
  activity_title: string;
  status: string;
  created_at: string;
}

export const TeacherDatabase = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [selectedActivity, setSelectedActivity] = useState<RecentActivity | null>(null);
  const [stats, setStats] = useState<DatabaseStats>({
    totalStudents: 0,
    totalCourses: 0,
    totalActivities: 0,
    totalActivityRuns: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDatabaseStats = async () => {
    try {
      // Get teacher's courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', (await supabase.auth.getUser()).data.user?.id);

      if (coursesError) throw coursesError;

      const courseIds = courses?.map(c => c.id) || [];

      // Get students count
      const { count: studentsCount } = await supabase
        .from('course_enrollments')
        .select('student_id', { count: 'exact' })
        .in('course_id', courseIds);

      // Get activities count
      const { count: activitiesCount } = await supabase
        .from('activities')
        .select('id', { count: 'exact' })
        .in('course_id', courseIds);

      // Get activity runs count
      const { count: activityRunsCount } = await supabase
        .from('activity_runs')
        .select('id', { count: 'exact' })
        .in('activity_id', 
          (await supabase
            .from('activities')
            .select('id')
            .in('course_id', courseIds)
          ).data?.map(a => a.id) || []
        );

      setStats({
        totalStudents: studentsCount || 0,
        totalCourses: courses?.length || 0,
        totalActivities: activitiesCount || 0,
        totalActivityRuns: activityRunsCount || 0
      });

      setCourses(courses || []);

      // Get recent activity runs
      const { data: activityRuns, error: runsError } = await supabase
        .from('activity_runs')
        .select(`
          id,
          status,
          started_at,
          student_id,
          activities (
            title,
            courses (
              title
            )
          )
        `)
        .in('activity_id', 
          (await supabase
            .from('activities')
            .select('id')
            .in('course_id', courseIds)
          ).data?.map(a => a.id) || []
        )
        .order('started_at', { ascending: false })
        .limit(10);

      if (runsError) throw runsError;

      // Get student profiles
      const studentIds = [...new Set(activityRuns?.map(run => run.student_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', studentIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      const formattedActivities: RecentActivity[] = activityRuns?.map(run => ({
        id: run.id,
        student_name: profileMap.get(run.student_id) || 'Unknown Student',
        course_title: (run.activities as any)?.courses?.title || 'Unknown Course',
        activity_title: (run.activities as any)?.title || 'Unknown Activity',
        status: run.status || 'unknown',
        created_at: run.started_at || new Date().toISOString()
      })) || [];

      setRecentActivities(formattedActivities);

    } catch (error) {
      console.error('Error fetching database stats:', error);
      toast({
        title: "Error",
        description: "Failed to load database information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleExport = () => {
    const csvData = filteredActivities.map(activity => ({
      Student: activity.student_name,
      Course: activity.course_title,
      Activity: activity.activity_title,
      Status: activity.status,
      Date: new Date(activity.created_at).toLocaleDateString()
    }));
    
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Activity data has been exported to CSV",
    });
  };

  const handleViewDetails = (activity: RecentActivity) => {
    setSelectedActivity(activity);
  };

  const filteredActivities = recentActivities.filter(activity => {
    const matchesSearch = activity.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.activity_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || activity.status === statusFilter;
    const matchesCourse = courseFilter === "all" || activity.course_title === courseFilter;
    
    return matchesSearch && matchesStatus && matchesCourse;
  });

  if (loading) {
    return (
      <TeacherLayout title="Database">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading database information...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Database">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary">Database Overview</h2>
        <p className="text-muted-foreground">Monitor and analyze your educational data</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-card shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats.totalStudents}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats.totalCourses}</div>
                <div className="text-sm text-muted-foreground">Active Courses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats.totalActivities}</div>
                <div className="text-sm text-muted-foreground">Total Activities</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats.totalActivityRuns}</div>
                <div className="text-sm text-muted-foreground">Activity Runs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="bg-gradient-card shadow-medium">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity Data</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Filter Activities</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Course</label>
                      <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Courses</SelectItem>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.title}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No activity data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.student_name}</TableCell>
                      <TableCell>{activity.course_title}</TableCell>
                      <TableCell>{activity.activity_title}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`text-white ${getStatusColor(activity.status)}`}
                        >
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(activity.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(activity)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Details Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Student</h4>
                  <p className="font-medium">{selectedActivity.student_name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Course</h4>
                  <p className="font-medium">{selectedActivity.course_title}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Activity</h4>
                  <p className="font-medium">{selectedActivity.activity_title}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                  <Badge 
                    variant="secondary" 
                    className={`text-white ${getStatusColor(selectedActivity.status)}`}
                  >
                    {selectedActivity.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Date Started</h4>
                  <p className="font-medium">{new Date(selectedActivity.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Activity ID</h4>
                  <p className="font-mono text-sm">{selectedActivity.id}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TeacherLayout>
  );
};