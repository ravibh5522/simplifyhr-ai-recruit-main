import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  DollarSign,
  Search,
  Filter,
  Clock,
  CheckCircle
} from 'lucide-react';
import AddUserModal from '@/components/forms/AddUserModal';

const VendorDashboard = () => {
  const dashboardActions = (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
        <Filter className="w-4 h-4 mr-2" />
        Filter
      </Button>
      <AddUserModal onUserAdded={() => {}} />
      <Button variant="hero" size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
        <Search className="w-4 h-4 mr-2" />
        Browse Jobs
      </Button>
    </div>
  );

  return (
    <DashboardLayout title="Vendor Dashboard" actions={dashboardActions}>
      <div className="space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Welcome to your workspace! 🎯</h1>
            <p className="text-white/80 text-lg">Manage your recruitment assignments and track your success.</p>
          </div>
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50 animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Assignments
              </CardTitle>
              <div className="icon-wrapper text-blue-600 bg-gradient-primary">
                <Briefcase className="h-4 w-4 text-white relative z-10" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">12</div>
              <p className="text-xs text-muted-foreground">Jobs you're working on</p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          </Card>

          <Card className="hover:shadow-card transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Candidates Submitted
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">85</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

                    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-green-50 animate-slide-up relative" style={{ animationDelay: '100ms' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Candidates Sourced
              </CardTitle>
              <div className="icon-wrapper text-green-600 bg-gradient-primary">
                <Users className="h-4 w-4 text-white relative z-10" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">85</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50 animate-slide-up relative" style={{ animationDelay: '200ms' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
              <div className="icon-wrapper text-purple-600 bg-gradient-primary">
                <TrendingUp className="h-4 w-4 text-white relative z-10" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">73%</div>
              <p className="text-xs text-muted-foreground">Placements/submissions</p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-emerald-50 animate-slide-up relative" style={{ animationDelay: '300ms' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Earnings
              </CardTitle>
              <div className="icon-wrapper text-emerald-600 bg-gradient-primary">
                <DollarSign className="h-4 w-4 text-white relative z-10" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">$24,500</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Assignments */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Active Assignments</CardTitle>
                  <CardDescription>Jobs you're currently working on</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "Senior React Developer",
                    company: "TechCorp Indonesia",
                    deadline: "2024-02-15",
                    status: "In Progress",
                    candidates: 5
                  },
                  {
                    title: "Product Manager",
                    company: "StartupXYZ",
                    deadline: "2024-02-20",
                    status: "In Progress",
                    candidates: 3
                  },
                  {
                    title: "DevOps Engineer",
                    company: "CloudTech Ltd",
                    deadline: "2024-02-25",
                    status: "Pending",
                    candidates: 0
                  }
                ].map((assignment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{assignment.title}</h4>
                      <p className="text-sm text-muted-foreground">{assignment.company}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Due {new Date(assignment.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">{assignment.candidates}</div>
                      <div className="text-xs text-muted-foreground">Candidates</div>
                    </div>
                    <Badge variant={assignment.status === 'In Progress' ? 'default' : 'secondary'}>
                      {assignment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Your recruitment performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Time to Fill</span>
                  <span className="text-sm font-medium">18 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Client Satisfaction</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">4.8/5</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-xs ${i < 5 ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Placements</span>
                  <span className="text-sm font-medium">147</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Since</span>
                  <span className="text-sm font-medium">March 2023</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-foreground mb-3">Recent Achievements</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-muted-foreground">Top performer badge earned</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-muted-foreground">50+ successful placements milestone</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-muted-foreground">Client referral bonus earned</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Jobs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Available Jobs</CardTitle>
                <CardDescription>New opportunities matching your expertise</CardDescription>
              </div>
              <Button variant="hero">Browse All Jobs</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: "Full Stack Developer",
                  company: "InnovateTech",
                  location: "Jakarta",
                  budget: "$5,000 - $8,000",
                  posted: "2 hours ago",
                  applicants: 12
                },
                {
                  title: "Data Scientist",
                  company: "DataDriven Corp",
                  location: "Remote",
                  budget: "$6,000 - $10,000",
                  posted: "1 day ago",
                  applicants: 8
                },
                {
                  title: "UI/UX Designer",
                  company: "CreativeStudio",
                  location: "Bali",
                  budget: "$3,000 - $5,000",
                  posted: "2 days ago",
                  applicants: 15
                }
              ].map((job, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-muted-foreground">Budget: {job.budget}</span>
                      <span className="text-xs text-muted-foreground">Posted {job.posted}</span>
                    </div>
                  </div>
                  <div className="text-center mr-4">
                    <div className="text-sm font-medium text-foreground">{job.applicants}</div>
                    <div className="text-xs text-muted-foreground">Applicants</div>
                  </div>
                  <Button variant="outline" size="sm">Apply</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VendorDashboard;