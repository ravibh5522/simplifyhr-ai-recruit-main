import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Building2, 
  Store, 
  User, 
  BarChart3, 
  Users, 
  FileText, 
  Calendar,
  DollarSign,
  TrendingUp
} from "lucide-react";

const Dashboards = () => {
  const dashboardRoles = [
    {
      id: "super-admin",
      label: "Super Admin",
      icon: <Settings className="w-4 h-4" />,
      title: "Platform Management",
      description: "Complete control over clients, vendors, pricing, and analytics",
      features: [
        "Client & vendor onboarding",
        "Pricing model configuration", 
        "Multi-tenant analytics",
        "Template management",
        "Budget trend analysis"
      ],
      metrics: [
        { label: "Active Clients", value: "150+", icon: <Building2 className="w-4 h-4" /> },
        { label: "Total Vendors", value: "500+", icon: <Store className="w-4 h-4" /> },
        { label: "Monthly Revenue", value: "$250K", icon: <DollarSign className="w-4 h-4" /> }
      ]
    },
    {
      id: "client",
      label: "Client",
      icon: <Building2 className="w-4 h-4" />,
      title: "Hiring Operations",
      description: "End-to-end recruitment management with AI automation",
      features: [
        "AI job description creation",
        "Resume screening & ranking",
        "Interview scheduling",
        "Vendor management",
        "Offer letter generation"
      ],
      metrics: [
        { label: "Active Jobs", value: "25", icon: <FileText className="w-4 h-4" /> },
        { label: "Interviews Today", value: "12", icon: <Calendar className="w-4 h-4" /> },
        { label: "Offers Sent", value: "8", icon: <Users className="w-4 h-4" /> }
      ]
    },
    {
      id: "vendor",
      label: "Vendor",
      icon: <Store className="w-4 h-4" />,
      title: "Candidate Submissions",
      description: "Streamlined candidate management and performance tracking",
      features: [
        "Bulk resume submissions",
        "Real-time status tracking",
        "Budget compliance alerts",
        "Performance analytics",
        "Client feedback access"
      ],
      metrics: [
        { label: "Submissions", value: "156", icon: <Users className="w-4 h-4" /> },
        { label: "Success Rate", value: "23%", icon: <TrendingUp className="w-4 h-4" /> },
        { label: "Active Jobs", value: "18", icon: <FileText className="w-4 h-4" /> }
      ]
    },
    {
      id: "candidate",
      label: "Candidate",
      icon: <User className="w-4 h-4" />,
      title: "Application Journey",
      description: "Transparent application tracking and interview management",
      features: [
        "Job browsing & application",
        "Application status tracking",
        "Interview scheduling",
        "Digital offer acceptance",
        "Feedback submission"
      ],
      metrics: [
        { label: "Applications", value: "7", icon: <FileText className="w-4 h-4" /> },
        { label: "Interviews", value: "3", icon: <Calendar className="w-4 h-4" /> },
        { label: "Offers", value: "1", icon: <BarChart3 className="w-4 h-4" /> }
      ]
    }
  ];

  return (
    <section id="dashboards" className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <BarChart3 className="w-4 h-4 mr-2" />
            Role-Based Interfaces
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tailored Dashboards for Every Role
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Each stakeholder gets a specialized interface designed for their specific workflow 
            and responsibilities in the hiring process.
          </p>
        </div>

        <Tabs defaultValue="super-admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
            {dashboardRoles.map((role) => (
              <TabsTrigger 
                key={role.id} 
                value={role.id}
                className="flex items-center space-x-2 text-sm"
              >
                {role.icon}
                <span className="hidden sm:inline">{role.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {dashboardRoles.map((role) => (
            <TabsContent key={role.id} value={role.id} className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-primary">
                      {role.icon}
                    </div>
                    <CardTitle className="text-2xl">{role.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Features */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-4">Key Features</h4>
                      <ul className="space-y-2">
                        {role.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full mr-3"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Metrics */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-4">Dashboard Metrics</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {role.metrics.map((metric, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                            <div className="flex items-center space-x-2">
                              <div className="text-muted-foreground">
                                {metric.icon}
                              </div>
                              <span className="text-sm text-muted-foreground">{metric.label}</span>
                            </div>
                            <span className="font-semibold text-foreground">{metric.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default Dashboards;