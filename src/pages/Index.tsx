import { HeroSection } from "@/components/HeroSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MessageSquare, BarChart3, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-2xl text-primary">Perleap</div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <HeroSection />
      
      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              The Future of Educational Assessment
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Perleap combines advanced AI with educational expertise to provide comprehensive insights into student learning and development.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-elegant transition-smooth bg-gradient-card border-0 cursor-pointer" onClick={() => window.scrollTo({ top: document.getElementById('cta')?.offsetTop, behavior: 'smooth' })}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-smooth">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Conversational Assessment</h3>
                <p className="text-muted-foreground">
                  Engage students through natural conversations that reveal deep insights into their thinking processes and soft skills.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-elegant transition-smooth bg-gradient-card border-0 cursor-pointer" onClick={() => window.scrollTo({ top: document.getElementById('cta')?.offsetTop, behavior: 'smooth' })}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-smooth">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Real-time Analytics</h3>
                <p className="text-muted-foreground">
                  Track student progress with SRA (Student Response Analysis) and CRA (Content-Related Abilities) metrics.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-elegant transition-smooth bg-gradient-card border-0 cursor-pointer" onClick={() => window.scrollTo({ top: document.getElementById('cta')?.offsetTop, behavior: 'smooth' })}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-smooth">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">Adaptive Learning Paths</h3>
                <p className="text-muted-foreground">
                  Create personalized learning experiences that evolve based on each student's unique strengths and challenges.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-24 px-6 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Classroom?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Join thousands of educators who are already using Perleap to unlock their students' potential.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-4 transition-smooth"
              asChild
            >
              <Link to="/auth">
                Start as Teacher <ArrowRight className="ml-2 w-5 h-5" />
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

      {/* Footer */}
      <footer className="py-12 px-6 bg-card border-t">
        <div className="max-w-7xl mx-auto text-center">
          <div className="font-bold text-2xl text-primary mb-4">Perleap</div>
          <p className="text-muted-foreground">
            Empowering educators with AI-driven insights for better learning outcomes.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
