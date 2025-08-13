import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Building } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      icon: <Zap className="w-6 h-6" />,
      price: "$99",
      period: "per job",
      description: "Perfect for small teams starting with AI hiring",
      features: [
        "AI Job Description Generation",
        "Basic Resume Screening",
        "Up to 50 candidates per job",
        "Standard Support",
        "Basic Analytics",
        "Email Notifications"
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "Professional",
      icon: <Star className="w-6 h-6" />,
      price: "$299",
      period: "per hire",
      description: "Advanced features for growing companies",
      features: [
        "Everything in Starter",
        "AI Interview Scheduling",
        "Vendor Management",
        "Advanced Analytics",
        "Background Check Integration",
        "Custom Offer Templates",
        "Priority Support",
        "Multi-language Support"
      ],
      buttonText: "Request Demo",
      buttonVariant: "hero" as const,
      popular: true
    },
    {
      name: "Enterprise",
      icon: <Building className="w-6 h-6" />,
      price: "Custom",
      period: "pricing",
      description: "Full-scale solution for large enterprises",
      features: [
        "Everything in Professional",
        "Unlimited jobs & candidates",
        "Custom AI Training",
        "Advanced Compliance Tools",
        "Dedicated Account Manager",
        "24/7 Support",
        "Custom Integrations",
        "White-label Options"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "enterprise" as const,
      popular: false
    }
  ];

  const addOns = [
    { name: "AI Interview Module", price: "$29/interview" },
    { name: "Background Check", price: "$15/check" },
    { name: "Custom Integrations", price: "Starting at $2,500" },
    { name: "Training & Onboarding", price: "$1,500/session" }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Flexible Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Perfect Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Transparent pricing that scales with your hiring needs. No hidden fees, 
            cancel anytime, and get started with a free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative transition-all duration-300 ${
                plan.popular 
                  ? 'border-primary shadow-elegant scale-105 bg-primary/5' 
                  : 'hover:shadow-card bg-card/50'
              }`}
            >
              {plan.popular && (
                <Badge 
                  variant="default" 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary"
                >
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="text-primary">
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">{plan.period}</span>
                </div>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.buttonVariant} 
                  className="w-full"
                  size="lg"
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="bg-card rounded-2xl p-8 border border-border/50">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Add-on Services
            </h3>
            <p className="text-muted-foreground">
              Enhance your hiring process with optional premium features
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {addOns.map((addon, index) => (
              <div key={index} className="text-center p-4 bg-background rounded-lg border">
                <h4 className="font-medium text-foreground mb-1">{addon.name}</h4>
                <p className="text-sm text-primary font-semibold">{addon.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Need a custom solution? We'd love to hear from you.
          </p>
          <Button variant="outline" size="lg">
            Schedule a Consultation
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;