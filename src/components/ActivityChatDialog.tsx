import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Send, Bot, User, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ActivityChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityTitle: string;
  activityContent?: string;
  activityId: string;
  activityGoal?: string;
}

export const ActivityChatDialog = ({ open, onOpenChange, activityTitle, activityContent, activityId, activityGoal }: ActivityChatDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize with activity introduction and reset when dialog opens
  useEffect(() => {
    console.log('ActivityChatDialog useEffect triggered:', { open, activityTitle, currentMessagesLength: messages.length });
    
    if (open && activityGoal) {
      const welcomeMessage: Message = {
        id: 'welcome-1',
        content: `Welcome to the "${activityTitle || 'Learning Activity'}" activity!\n\nI'm Agent Perleap, your pedagogical assistant expert in the Quantum Education Doctrine. I'm here to guide you through this learning journey step by step.`,
        role: 'assistant',
        timestamp: new Date()
      };
      console.log('Setting welcome message:', welcomeMessage);
      setMessages([welcomeMessage]);
      
      // Send the activity goal to OpenAI and get the initial response
      sendActivityGoalToAI(activityGoal);
    } else if (open) {
      const welcomeMessage: Message = {
        id: 'welcome-1',
        content: `Welcome to the "${activityTitle || 'Learning Activity'}" activity!\n\nI'm Agent Perleap, your pedagogical assistant expert in the Quantum Education Doctrine. I'm here to guide you through this learning journey step by step.\n\nLet's begin this activity together! What would you like to explore first?`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    } else {
      // Reset messages when dialog closes
      setMessages([]);
    }
  }, [open, activityTitle, activityGoal]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendActivityGoalToAI = async (goal: string) => {
    // Show the welcome message immediately with a loading indicator for the goal response
    const thinkingMessage: Message = {
      id: 'thinking-message',
      content: 'Let me prepare this activity for you...',
      role: 'assistant',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, thinkingMessage]);
    setIsLoading(true);

    try {
      // Get the current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please log in again.');
      }

      console.log('Sending activity goal to AI:', goal);

      // Call the edge function with the activity goal
      const { data, error } = await supabase.functions.invoke('activity-chat', {
        body: {
          activityId,
          message: goal,
          conversationHistory: []
        }
      });

      console.log('Edge function raw response for goal:', { data, error });
      
      if (error) {
        console.error('Supabase function invocation error:', error);
        throw new Error(`Connection error: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from edge function');
        throw new Error('No response from AI service');
      }

      if (!data.success) {
        console.error('AI service returned error:', data.error);
        throw new Error(data.error || 'AI service error');
      }

      // Replace the thinking message with the actual AI response
      const aiResponse: Message = {
        id: 'ai-goal-response',
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === 'thinking-message' ? aiResponse : msg
      ));
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending activity goal to AI:', error);
      
      // Replace thinking message with fallback
      const fallbackMessage: Message = {
        id: 'goal-fallback',
        content: goal,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === 'thinking-message' ? fallbackMessage : msg
      ));
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get the current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please log in again.');
      }

      console.log('Sending request to activity-chat with activityId:', activityId);

      // Call the edge function with detailed logging
      const { data, error } = await supabase.functions.invoke('activity-chat', {
        body: {
          activityId,
          message: userMessage.content,
          conversationHistory: messages.filter(msg => msg.id !== '1')
        }
      });

      console.log('Edge function raw response:', { data, error });
      
      // More detailed error handling
      if (error) {
        console.error('Supabase function invocation error:', error);
        console.error('Error details:', {
          message: error.message,
          context: error.context,
          code: error.code
        });
        throw new Error(`Connection error: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from edge function');
        throw new Error('No response from AI service');
      }

      console.log('Edge function returned data:', data);

      if (!data.success) {
        console.error('AI service returned error:', data.error);
        throw new Error(data.error || 'AI service error');
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      let errorMessage = "Failed to get response from AI assistant. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('authentication') || error.message.includes('Authentication')) {
          errorMessage = "Authentication error. Please refresh the page and try again.";
        } else if (error.message.includes('OpenAI')) {
          errorMessage = "AI service temporarily unavailable. Please try again in a moment.";
        } else if (error.message.includes('Activity')) {
          errorMessage = "Activity not found. Please try refreshing the page.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndActivity = async () => {
    if (!activityId) return;
    
    setIsLoading(true);
    
    // Close dialog immediately to prevent any interference
    onOpenChange(false);
    
    try {
      // Create a temporary activity run for this dialog session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First create an activity run for this session
      const { data: runData, error: runError } = await supabase
        .from('activity_runs')
        .insert([{
          activity_id: activityId,
          student_id: user.id,
          status: 'completed',
          completed_at: new Date().toISOString(),
          messages: messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            type: msg.role === 'user' ? 'student' : 'assistant',
            timestamp: msg.timestamp.toISOString()
          }))
        }])
        .select(`
          *,
          activities (
            title,
            goal,
            course_id,
            courses (
              subject,
              grade_level
            )
          )
        `)
        .single();

      if (runError) throw runError;

      // Generate assessment
      const { error: assessmentError } = await supabase.functions.invoke('assessment', {
        body: {
          runId: runData.id,
          chatMessages: messages.map(msg => ({
            content: msg.content,
            type: msg.role === 'user' ? 'student' : 'assistant',
            timestamp: msg.timestamp
          })),
          activityData: {
            title: runData.activities?.title || 'Activity',
            goal: runData.activities?.goal || 'Learning goal',
            subject: runData.activities?.courses?.subject || 'General',
            grade_level: runData.activities?.courses?.grade_level || 'Unknown'
          }
        }
      });

      if (assessmentError) {
        console.error('Assessment error:', assessmentError);
        toast({
          title: "Activity Completed",
          description: "Activity completed, but assessment generation failed.",
        });
      } else {
        toast({
          title: "Activity Completed!",
          description: "Your work has been assessed and saved. Great job!",
        });
      }

    } catch (error) {
      console.error('Error ending activity:', error);
      toast({
        title: "Error",
        description: "Failed to complete activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-[100vw] h-[100vh] sm:max-w-[95vw] sm:max-h-[95vh] sm:w-[95vw] sm:h-[95vh] md:max-w-[90vw] md:max-h-[90vh] md:w-[90vw] md:h-[90vh] lg:max-w-[85vw] lg:max-h-[85vh] lg:w-[85vw] lg:h-[85vh] flex flex-col p-0 sm:p-6">
        <DialogHeader className="px-4 pt-4 sm:px-0 sm:pt-0">
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-primary" />
            <span>Activity Chat: {activityTitle}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0 h-full px-4 pb-4 sm:px-0 sm:pb-0">
          <div className="flex-1 p-4 border rounded-lg overflow-y-auto" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message about this activity..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleEndActivity}
              variant="outline"
              disabled={isLoading}
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              End Activity
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};