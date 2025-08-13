import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Globe, Shield } from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.jpg";

const Hero = () => {
  return (
    <section className="pt-20 pb-16 bg-gradient-hero relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 right-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-glow/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            <Badge variant="secondary" className="mb-6 animate-fade-in">
              <Globe className="w-4 h-4 mr-2" />
              Trusted in Indonesia & India
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-slide-up">
              AI-Powered Hiring
              <span className="block text-accent-glow">Automation Platform</span>
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl animate-slide-up">
              SimplifyHiring revolutionizes recruitment with Generative AI. Automate job descriptions, 
              intelligent resume screening, and interview orchestration for enterprises.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-up">
              <Button variant="accent" size="lg" className="text-lg px-8" onClick={() => window.location.href = '/auth'}>
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => window.location.href = '/jobs'}>
                Browse Jobs
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-primary-foreground/70 animate-slide-up">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-accent-glow" />
                99.9% Uptime SLA
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-accent-glow" />
                SOC 2 Compliant
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-accent-glow" />
                Multi-language Support
              </div>
            </div>
          </div>

          {/* Right content - Dashboard preview */}
          <div className="relative animate-glow-pulse">
            <div className="relative rounded-2xl overflow-hidden shadow-glow">
              <img 
                src={heroDashboard} 
                alt="SimplifyHiring Dashboard Preview" 
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20"></div>
            </div>
            
            {/* Floating stats */}
            <div className="absolute -top-6 -right-6 bg-card rounded-lg p-4 shadow-card border">
              <div className="text-2xl font-bold text-primary">10,000+</div>
              <div className="text-sm text-muted-foreground">Resumes Processed</div>
            </div>
            
            <div className="absolute -bottom-6 -left-6 bg-card rounded-lg p-4 shadow-card border">
              <div className="text-2xl font-bold text-accent">85%</div>
              <div className="text-sm text-muted-foreground">Time Saved</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;