
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, Shield, Globe } from "lucide-react";

const Footer = () => {
  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "Dashboards", href: "#dashboards" },
        { name: "Pricing", href: "#pricing" },
        { name: "API Documentation", href: "#" },
        { name: "Integrations", href: "#" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Press", href: "#" },
        { name: "Partners", href: "#" },
        { name: "Contact", href: "#" }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Blog", href: "#" },
        { name: "Case Studies", href: "#" },
        { name: "Help Center", href: "#" },
        { name: "Community", href: "#" },
        { name: "Webinars", href: "#" }
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "#" },
        { name: "Terms of Service", href: "#" },
        { name: "GDPR Compliance", href: "#" },
        { name: "Data Processing", href: "#" },
        { name: "Security", href: "#" }
      ]
    }
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-4">
              <div className="flex items-center space-x-2 mb-6">
                <img 
                  src="/lovable-uploads/9bf28cca-ee40-48d0-a419-8360a0879759.png" 
                  alt="SimplifyHiring Logo" 
                  className="w-8 h-8 rounded-lg"
                />
                <span className="text-xl font-bold">SimplifyHiring</span>
              </div>
              
              <p className="text-primary-foreground/80 mb-6 max-w-md">
                Revolutionizing recruitment with AI-powered automation for enterprises 
                in Indonesia and India. Compliant, scalable, and intelligent.
              </p>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-accent" />
                  <span className="text-sm">contact@simplifyhiring.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-accent" />
                  <span className="text-sm">+62 21 1234 5678</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="text-sm">Jakarta, Indonesia</span>
                </div>
              </div>

              {/* Compliance Badges */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center space-x-1 bg-primary-foreground/10 rounded px-2 py-1">
                  <Shield className="w-3 h-3" />
                  <span className="text-xs">SOC 2</span>
                </div>
                <div className="flex items-center space-x-1 bg-primary-foreground/10 rounded px-2 py-1">
                  <Globe className="w-3 h-3" />
                  <span className="text-xs">GDPR</span>
                </div>
                <div className="flex items-center space-x-1 bg-primary-foreground/10 rounded px-2 py-1">
                  <Shield className="w-3 h-3" />
                  <span className="text-xs">PDP Law</span>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-8">
              {footerSections.map((section, index) => (
                <div key={index}>
                  <h3 className="font-semibold mb-4">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <a 
                          href={link.href}
                          className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold mb-4">Stay Updated</h3>
              <p className="text-sm text-primary-foreground/70 mb-4">
                Get the latest HR tech insights and product updates.
              </p>
              <div className="space-y-3">
                <Input 
                  placeholder="Enter your email" 
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                />
                <Button variant="accent" size="sm" className="w-full">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-primary-foreground/70">
              © 2024 SimplifyHiring. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-primary-foreground/70">
              <span>Made with ❤️ for better hiring</span>
              <div className="flex items-center space-x-1">
                <Globe className="w-3 h-3" />
                <span>Indonesia & India</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
