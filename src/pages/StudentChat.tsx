import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
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
import { useState, useEffect } from "react";

export const StudentChat = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activity, setActivity] = useState<any>(null);
  const [run, setRun] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);

  useEffect(() => {
    const runId = location.state?.runId;
    const activityId = location.state?.activityId;
    
    if (!runId || !activityId) {
      toast({
        title: "Error",
        description: "Invalid chat session",
        variant: "destructive",
      });
      navigate('/student');
      return;
    }

    fetchChatData(runId);
  }, [location.state]);

  const fetchChatData = async (runId: string) => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch activity run with activity details
      const { data: runData, error: runError } = await supabase
        .from('activity_runs')
        .select(`
          *,
          activities (
            id,
            title,
            type,
            goal,
            course_id,
            steps,
            config
          )
        `)
        .eq('id', runId)
        .eq('student_id', user.id)
        .single();

      if (runError || !runData) {
        toast({
          title: "Error",
          description: "Chat session not found",
          variant: "destructive",
        });
        navigate('/student');
        return;
      }

      setRun(runData);
      setActivity(runData.activities);
      const messagesData = Array.isArray(runData.messages) ? runData.messages : [];
      setMessages(messagesData);

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', runData.activities.course_id)
        .single();

      if (courseError) {
        console.error('Error fetching course:', courseError);
      } else {
        setCourse(courseData);
      }

      // Add welcome message if no messages exist
      const existingMessages = Array.isArray(runData.messages) ? runData.messages : [];
      if (existingMessages.length === 0) {
        const welcomeMessage = {
          id: 1,
          type: "system",
          content: `Welcome to ${runData.activities.title}! I'm here to help you learn through our conversation.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        const initialMessage = {
          id: 2,
          type: "assistant",
          content: `I'm Agent Perleap, your pedagogical assistant expert in the Quantum Education Doctrine. I'm here to guide you through this learning journey step by step.\n\n${runData.activities.goal || "Let's start exploring this topic together. What would you like to know?"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const initialMessages = [welcomeMessage, initialMessage];
        setMessages(initialMessages);

        // Update the run with initial messages
        await supabase
          .from('activity_runs')
          .update({ messages: initialMessages })
          .eq('id', runId);
      }

    } catch (error) {
      console.error('Error fetching chat data:', error);
      toast({
        title: "Error",
        description: "Failed to load chat session",
        variant: "destructive",
      });
      navigate('/student');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sending || !run) return;
    
    setSending(true);
    const messageText = message;
    setMessage("");

    try {
      // Call the chat edge function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          runId: run.id,
          message: messageText
        }
      });

      if (error) {
        console.error('Chat function error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to send message",
          variant: "destructive",
        });
        
        // Add user message back to input on error
        setMessage(messageText);
        return;
      }

      // Update messages with the response
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        
        if (data.aiResponse) {
          // Add AI response after a short delay for better UX
          setTimeout(() => {
            setMessages(prev => [...prev, data.aiResponse]);
          }, 500);
        } else if (data.warning) {
          toast({
            title: "Notice",
            description: data.warning,
            variant: "destructive",
          });
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      
      // Add user message back to input on error
      setMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleEndActivity = async () => {
    if (!run || !activity) return;
    
    setLoading(true);
    try {
      // Update the activity run status to completed
      const { error: updateError } = await supabase
        .from('activity_runs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id);

      if (updateError) throw updateError;

      // Generate assessment using the assessment edge function
      const { error: assessmentError } = await supabase.functions.invoke('assessment', {
        body: {
          runId: run.id,
          chatMessages: messages,
          activityData: {
            title: activity.title,
            goal: activity.goal,
            subject: course?.subject || 'General',
            grade_level: course?.grade_level || 'Unknown'
          }
        }
      });

      if (assessmentError) {
        console.error('Assessment error:', assessmentError);
        // Don't fail the whole process if assessment fails
        toast({
          title: "Activity Completed",
          description: "Activity completed, but assessment generation failed. Your teacher can still review your work.",
          variant: "default",
        });
      } else {
        toast({
          title: "Activity Completed!",
          description: "Your work has been assessed and saved. Great job!",
        });
      }

      // Navigate back to dashboard
      setTimeout(() => {
        navigate('/student');
      }, 2000);

    } catch (error) {
      console.error('Error ending activity:', error);
      toast({
        title: "Error",
        description: "Failed to complete activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
                  <Button variant="ghost" size="sm" onClick={() => navigate('/student')}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg text-primary">
                      {loading ? "Loading..." : activity?.title || "Chat Activity"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {loading ? "..." : course?.title || "Course"}
                    </p>
                  </div>
                </div>
                <Badge className="bg-gradient-hero text-white">
                  {loading ? "..." : `Step ${Math.min(Math.floor((messages.length || 0) / 4) + 1, 5)}/5`}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium text-primary">
                    {loading ? "..." : `${Math.min((messages.length || 0) * 10, 100)}%`}
                  </span>
                </div>
                <Progress value={loading ? 0 : Math.min((messages.length || 0) * 10, 100)} className="h-2" />
              </div>
            </CardHeader>
          </Card>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading chat...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
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
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg bg-accent text-accent-foreground mr-8">
                  <div className="flex items-start space-x-2">
                    <div className="mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">Thinking...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <Card className="m-4 mt-0 bg-gradient-card shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your response..."
                    onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                    className="flex-1"
                    disabled={sending || loading}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    className="bg-gradient-hero shadow-glow"
                    disabled={sending || loading || !message.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={handleEndActivity}
                    variant="outline"
                    disabled={loading || sending}
                    className="border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    End Activity
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
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {loading ? "Loading..." : activity?.goal || "Engage in educational conversation"}
                </p>
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
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">
                    SRA tracking will be available during active learning sessions
                  </p>
                </div>
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
                  <span>{run?.started_at ? new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{run?.started_at ? Math.floor((Date.now() - new Date(run.started_at).getTime()) / 60000) : 0} mins</span>
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