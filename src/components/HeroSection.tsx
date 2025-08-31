import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Users, Target, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-education.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with fluid gradient overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="AI-powered education platform showing students engaging with technology" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary-glow" />
            <span className="text-white text-sm font-medium">Revolutionizing Education with AI</span>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-bold text-white mb-6 leading-tight tracking-tight">
            Perleap
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 max-w-4xl mx-auto leading-relaxed font-light mb-8">
            Intelligent assessment that adapts to every student's unique learning journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-primary-glow" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Assessment</h3>
            <p className="text-white/80 text-sm">Evaluate soft skills and academic abilities through natural conversations</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-primary-glow" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Personalized Learning</h3>
            <p className="text-white/80 text-sm">Create adaptive learning paths that grow with your students</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary-glow" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Teacher Insights</h3>
            <p className="text-white/80 text-sm">Get detailed analytics and recommendations for every student</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 shadow-elegant text-lg px-8 py-4 transition-smooth"
            asChild
          >
            <Link to="/auth">
              Start Teaching
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline-light" 
            className="text-lg px-8 py-4 transition-smooth"
            asChild
          >
            <Link to="/auth">Join as Student</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};