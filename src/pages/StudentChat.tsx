import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Send,
  Brain,
  Target,
  Clock,
  CheckCircle,
  User,
  Bot,
  ArrowLeft,
  TrendingUp
} from "lucide-react";
import { useState } from "react";

export const StudentChat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "system",
      content: "Welcome to your Polynomial Functions exploration! I'm here to guide you through understanding these important mathematical concepts.",
      timestamp: "10:30 AM"
    },
    {
      id: 2,
      type: "assistant",
      content: "Let's start with a simple question: Can you think of a real-world situation where you might see a curve that goes up, then down, then up again?",
      timestamp: "10:30 AM"
    },
    {
      id: 3,
      type: "student",
      content: "Maybe like a roller coaster? It goes up and down in different curves.",
      timestamp: "10:32 AM"
    },
    {
      id: 4,
      type: "assistant", 
      content: "Excellent observation! A roller coaster is a perfect example. The path of a roller coaster can often be described by polynomial functions. Now, what do you think makes the curve go up and down like that?",
      timestamp: "10:33 AM"
    }
  ]);

  const activity = {
    name: "Polynomial Functions Chat",
    course: "Advanced Mathematics",
    step: 2,
    totalSteps: 5,
    progress: 40,
    goal: "Guide the student to understand polynomial functions through real-world examples"
  };

  const sraTracking = [
    { dimension: "Vision", current: 78, change: "+3" },
    { dimension: "Thinking", current: 85, change: "+5" },
    { dimension: "Connection", current: 72, change: "+2" }
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: messages.length + 1,
      type: "student",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setMessage("");
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: "assistant",
        content: "That's a thoughtful response! Let me help you explore this concept further. Can you describe what happens to the steepness of the curve at different points?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "student":
        return <User className="w-4 h-4" />;
      case "assistant":
        return <Bot className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case "student":
        return "bg-primary text-primary-foreground ml-8";
      case "assistant":
        return "bg-accent text-accent-foreground mr-8";
      case "system":
        return "bg-muted text-muted-foreground mx-8 text-center";
      default:
        return "bg-card text-card-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="student" />
      
      <main className="flex h-[calc(100vh-80px)]">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Activity Header */}
          <Card className="m-4 mb-0 bg-gradient-card shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg text-primary">{activity.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{activity.course}</p>
                  </div>
                </div>
                <Badge className="bg-gradient-hero text-white">Step {activity.step}/{activity.totalSteps}</Badge>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium text-primary">{activity.progress}%</span>
                </div>
                <Progress value={activity.progress} className="h-2" />
              </div>
            </CardHeader>
          </Card>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'student' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${getMessageStyle(msg.type)}`}>
                  <div className="flex items-start space-x-2">
                    {msg.type !== 'system' && (
                      <div className="mt-1">
                        {getMessageIcon(msg.type)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <Card className="m-4 mt-0 bg-gradient-card shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your response..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} className="bg-gradient-hero shadow-glow">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-border bg-accent/20">
          <div className="p-4 space-y-4">
            {/* Activity Goal */}
            <Card className="bg-gradient-card shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span>Learning Goal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{activity.goal}</p>
              </CardContent>
            </Card>

            {/* Real-time SRA Tracking */}
            <Card className="bg-gradient-card shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span>SRA Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sraTracking.map((dimension, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">{dimension.dimension}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-bold">{dimension.current}</span>
                        <span className="text-xs text-success">{dimension.change}</span>
                      </div>
                    </div>
                    <Progress value={dimension.current} className="h-1" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Activity Tips */}
            <Card className="bg-gradient-card shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>• Take your time to think before responding</p>
                  <p>• Ask questions if something isn't clear</p>
                  <p>• Connect concepts to your own experiences</p>
                  <p>• Don't worry about making mistakes - they help you learn!</p>
                </div>
              </CardContent>
            </Card>

            {/* Session Info */}
            <Card className="bg-gradient-card shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Session Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Started:</span>
                  <span>10:30 AM</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>15 mins</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages:</span>
                  <span>{messages.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};