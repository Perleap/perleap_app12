import { Navigation } from "@/components/Navigation";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  Activity, 
  TrendingUp, 
  Plus,
  Brain,
  BarChart3,
  Clock,
  Star
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const TeacherDashboard = () => {
  const { profile } = useAuth();
  // Mock data
  const recentActivities = [
    { 
      student: "Emma Wilson", 
      course: "Mathematics", 
      activity: "Quadratic Functions Chat",
      sraScore: 82,
      craScore: 74,
      status: "completed",
      timestamp: "2 hours ago"
    },
    { 
      student: "Marcus Chen", 
      course: "Science", 
      activity: "Photosynthesis Assessment",
      sraScore: 91,
      craScore: 88,
      status: "in-progress",
      timestamp: "4 hours ago"
    },
    { 
      student: "Sofia Rodriguez", 
      course: "Literature", 
      activity: "Character Analysis Training",
      sraScore: 76,
      craScore: 82,
      status: "completed",
      timestamp: "1 day ago"
    }
  ];

  const courses = [
    { name: "Advanced Mathematics", students: 24, activities: 8, avgSRA: 78 },
    { name: "Physics Fundamentals", students: 18, activities: 12, avgSRA: 84 },
    { name: "Creative Writing", students: 31, activities: 6, avgSRA: 89 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Teacher Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.full_name || 'Teacher'}! Here's what's happening with your students.
            </p>
          </div>
          <Button className="bg-gradient-hero shadow-glow">
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Total Students"
            value="73"
            subtitle="Across all courses"
            icon={Users}
            trend="up"
            trendValue="+12%"
          />
          <DashboardCard
            title="Active Courses"
            value="3"
            subtitle="Currently running"
            icon={BookOpen}
            trend="neutral"
          />
          <DashboardCard
            title="Avg SRA Score"
            value="84"
            subtitle="Last 30 days"
            icon={Brain}
            trend="up"
            trendValue="+8%"
          />
          <DashboardCard
            title="Activities Created"
            value="26"
            subtitle="This month"
            icon={Activity}
            trend="up"
            trendValue="+18%"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <Card className="bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary" />
                <span>Recent Student Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-primary">{activity.student}</span>
                      <Badge variant={activity.status === "completed" ? "default" : "secondary"}>
                        {activity.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.course} • {activity.activity}</div>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <Brain className="w-3 h-3 text-education-secondary" />
                        <span className="text-xs">SRA: {activity.sraScore}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="w-3 h-3 text-education-primary" />
                        <span className="text-xs">CRA: {activity.craScore}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {activity.timestamp}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Course Overview */}
          <Card className="bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>Course Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {courses.map((course, index) => (
                <div key={index} className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-primary">{course.name}</h4>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-warning fill-current" />
                      <span className="text-sm font-medium">{course.avgSRA}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{course.students} students</span>
                    <span>{course.activities} activities</span>
                  </div>
                  <div className="mt-3">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};