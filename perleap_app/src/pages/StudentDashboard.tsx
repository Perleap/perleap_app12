import { Navigation } from "@/components/Navigation";
import { DashboardCard } from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Brain, 
  TrendingUp, 
  Play,
  CheckCircle,
  Target,
  Award,
  MessageCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const StudentDashboard = () => {
  const { profile } = useAuth();
  // Mock data
  const myPerleaps = [
    { 
      course: "Advanced Mathematics", 
      activity: "Polynomial Functions Chat",
      type: "Student-Chat",
      progress: 75,
      sraGain: "+12",
      status: "in-progress",
      nextStep: "Complete reflection questions"
    },
    { 
      course: "Physics", 
      activity: "Wave Properties Assessment",
      type: "Assessment",
      progress: 100,
      sraGain: "+8",
      status: "completed",
      score: 94
    },
    { 
      course: "Literature", 
      activity: "Character Development Training",
      type: "Training",
      progress: 45,
      sraGain: "+5",
      status: "in-progress",
      nextStep: "Analyze protagonist motivations"
    }
  ];

  const sraProgress = [
    { dimension: "Vision", score: 82, change: "+5" },
    { dimension: "Values", score: 78, change: "+3" },
    { dimension: "Thinking", score: 91, change: "+8" },
    { dimension: "Connection", score: 74, change: "+2" },
    { dimension: "Action", score: 86, change: "+6" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">My Learning Journey</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.full_name || 'Student'}! Continue your personalized learning experience.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Active Perleaps"
            value="3"
            subtitle="In progress"
            icon={BookOpen}
            trend="neutral"
          />
          <DashboardCard
            title="Avg SRA Score"
            value="82"
            subtitle="All dimensions"
            icon={Brain}
            trend="up"
            trendValue="+7%"
          />
          <DashboardCard
            title="Activities Completed"
            value="24"
            subtitle="This month"
            icon={CheckCircle}
            trend="up"
            trendValue="+12"
          />
          <DashboardCard
            title="Learning Streak"
            value="12"
            subtitle="Days active"
            icon={Award}
            trend="up"
            trendValue="New record!"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Perleaps */}
          <Card className="bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary" />
                <span>My Active Perleaps</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {myPerleaps.map((perleap, index) => (
                <div key={index} className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-primary">{perleap.course}</h4>
                      <p className="text-sm text-muted-foreground">{perleap.activity}</p>
                    </div>
                    <Badge variant={perleap.status === "completed" ? "default" : "secondary"}>
                      {perleap.type}
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium">{perleap.progress}%</span>
                    </div>
                    <Progress value={perleap.progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    {perleap.status === "completed" ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-sm text-success font-medium">Score: {perleap.score}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{perleap.nextStep}</span>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-education-secondary" />
                      <span className="text-xs font-medium text-success">{perleap.sraGain}</span>
                      {perleap.status === "in-progress" && (
                        <Button size="sm" className="ml-2">
                          <Play className="w-3 h-3 mr-1" />
                          Continue
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* SRA Progress */}
          <Card className="bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-primary" />
                <span>SRA Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sraProgress.map((dimension, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">{dimension.dimension}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold">{dimension.score}</span>
                      <span className="text-xs text-success font-medium">{dimension.change}</span>
                    </div>
                  </div>
                  <Progress value={dimension.score} className="h-2" />
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-gradient-assessment rounded-lg">
                <h4 className="font-medium text-white mb-2">Your Learning Insights</h4>
                <p className="text-white/90 text-sm">
                  Great progress in <strong>Thinking</strong> abilities! Your analytical skills are improving rapidly. 
                  Consider focusing on <strong>Connection</strong> to enhance collaborative learning.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8 bg-gradient-card shadow-medium">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="flex items-center justify-center space-x-2 h-16">
                <MessageCircle className="w-5 h-5" />
                <span>Start New Chat Activity</span>
              </Button>
              <Button variant="outline" className="flex items-center justify-center space-x-2 h-16">
                <Target className="w-5 h-5" />
                <span>Take Assessment</span>
              </Button>
              <Button variant="outline" className="flex items-center justify-center space-x-2 h-16">
                <TrendingUp className="w-5 h-5" />
                <span>View Full Progress</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};