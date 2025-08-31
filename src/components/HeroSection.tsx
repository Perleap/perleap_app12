import { Button } from "@/components/ui/button";      
import { ArrowRight, BookOpen, Brain, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-education.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="AI-powered education platform" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Transform Education with
            <span className="block bg-gradient-to-r from-primary-glow to-education-accent bg-clip-text text-transparent">
              Quantum Learning
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Perleap harnesses AI to assess and develop both soft and content-related abilities, 
            creating personalized learning experiences that adapt to every student's unique potential.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-strong">
            Start Teaching
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
            Learn More
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-gradient-assessment rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">SRA Assessment</h3>
            <p className="text-white/80">AI-powered evaluation of Vision, Values, Thinking, Connection, and Action abilities</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-gradient-assessment rounded-lg flex items-center justify-center mb-4 mx-auto">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">CRA Analytics</h3>
            <p className="text-white/80">Content-Related Abilities tracking with adaptive curriculum recommendations</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-gradient-assessment rounded-lg flex items-center justify-center mb-4 mx-auto">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Smart Insights</h3>
            <p className="text-white/80">Real-time progress monitoring with personalized learning pathways</p>
          </div>
        </div>
      </div>
    </section>
  );
};