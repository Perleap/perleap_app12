import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen,
  Brain, 
  Users,
  TrendingUp,
  MessageCircle,
  BarChart3,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect authenticated users to their dashboard
      if (profile.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    }
  }, [user, profile, loading, navigate]);
  const features = [
    {
      icon: Brain,
      title: "SRA Assessment",
      description: "Comprehensive evaluation of Vision, Values, Thinking, Connection, and Action abilities through AI-powered analysis."
    },
    {
      icon: BarChart3,
      title: "CRA Analytics", 
      description: "Deep insights into Content-Related Abilities with adaptive curriculum recommendations and progress tracking."
    },
    {
      icon: MessageCircle,
      title: "AI Chat Activities",
      description: "Engaging Socratic dialogues that guide students through personalized learning experiences."
    },
    {
      icon: Users,
      title: "Teacher Dashboard",
      description: "Comprehensive monitoring tools with real-time student progress and automated assessment workflows."
    },
    {
      icon: TrendingUp,
      title: "Smart Recommendations",
      description: "AI-powered suggestions for activities, resources, and learning pathways tailored to each student."
    },
    {
      icon: CheckCircle,
      title: "Automated Assessment",
      description: "Instant feedback and detailed analysis of student performance across all learning dimensions."
    }
  ];

  const benefits = [
    "Personalized learning pathways for every student",
    "Real-time progress monitoring and insights", 
    "AI-powered assessment of soft and hard skills",
    "Seamless teacher-student collaboration",
    "Evidence-based learning recommendations"
  ];

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      
      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Quantum Education Doctrine in Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the power of AI-driven education that adapts to each student's unique learning journey,
              assessing both soft-related and content-related abilities with unprecedented precision.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-card shadow-medium hover:shadow-strong transition-all group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-primary">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-accent/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">
              Transform Your Educational Impact
            </h2>
            <p className="text-lg text-muted-foreground">
              Join educators worldwide who are revolutionizing learning with Perleap's AI-powered platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-primary font-medium">{benefit}</span>
                </div>
              ))}
            </div>
            
            <Card className="bg-gradient-card shadow-strong border-border/50">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-primary mb-4">Ready to Begin?</h3>
                  <p className="text-muted-foreground mb-6">
                    Start your journey with Perleap and experience the future of personalized education.
                  </p>
                  <div className="space-y-3">
                    <Button 
                      size="lg" 
                      className="w-full bg-gradient-hero shadow-glow"
                      onClick={() => navigate('/auth')}
                    >
                      <BookOpen className="w-5 h-5 mr-2" />
                      Start Teaching
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/auth')}
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Join as Student
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-primary mb-6">
            Experience Quantum Learning Today
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of educators and students who are already transforming their learning experiences with Perleap's innovative AI platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-hero shadow-glow"
              onClick={() => navigate('/auth')}
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/auth')}
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
