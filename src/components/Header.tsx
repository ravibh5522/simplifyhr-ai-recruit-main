import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Bot, Users, Building, UserCheck } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: "Features", href: "#features" },
    { name: "Dashboards", href: "#dashboards" },
    { name: "Jobs", href: "/jobs" },
    { name: "Pricing", href: "#pricing" },
    { name: "Compliance", href: "#compliance" },
  ];

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/9bf28cca-ee40-48d0-a419-8360a0879759.png" 
              alt="SimplifyHiring Logo" 
              className="w-8 h-8 rounded-lg"
            />
            <span className="text-xl font-bold text-gradient-primary">SimplifyHiring</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </a>
            ))}
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
            <Button variant="hero" size="sm" onClick={() => window.location.href = '/auth'}>
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="flex flex-col space-y-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
                  Sign In
                </Button>
                <Button variant="hero" size="sm" onClick={() => window.location.href = '/auth'}>
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;