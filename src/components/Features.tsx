import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  FileText, 
  Users, 
  Calendar, 
  DollarSign, 
  Shield, 
  Globe, 
  TrendingUp 
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: "AI Job Description Generator",
      description: "Generate comprehensive JDs from just a job title using advanced GenAI technology",
      badge: "Core Feature"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Intelligent Resume Screening",
      description: "AI-powered parsing, scoring, and ranking of candidates against job requirements",
      badge: "AI-Powered"
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Interview Orchestration",
      description: "Automated scheduling with AI, human, or hybrid interview modes and scoring",
      badge: "Automated"
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Budget Recommendations",
      description: "AI-driven salary benchmarking and budget alignment for each position",
      badge: "Smart Insights"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Offer Letter Generation",
      description: "Automated offer creation with compliance validation for Indonesia and India",
      badge: "Compliant"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Multi-Role Dashboards",
      description: "Specialized interfaces for Super Admin, Client, Vendor, and Candidate roles",
      badge: "Role-Based"
    }
  ];

  const complianceFeatures = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Data Protection",
      description: "GDPR, Indonesia PDP Law, India IT Act compliant"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Multi-Language",
      description: "Full support for Bahasa Indonesia and English"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Powered by Generative AI
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Complete Hiring Automation Suite
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Transform your recruitment process with AI-driven automation that handles everything 
            from job posting to offer acceptance.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-card transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/50"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-primary group-hover:text-accent transition-colors">
                    {feature.icon}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Compliance Section */}
        <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Enterprise-Grade Compliance
            </h3>
            <p className="text-muted-foreground">
              Built for regulated environments with multi-region compliance
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {complianceFeatures.map((item, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="text-primary mt-1">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;