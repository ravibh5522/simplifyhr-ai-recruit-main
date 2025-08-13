import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building, 
  Briefcase, 
  TrendingUp, 
  Calendar,
  Filter,
  Plus,
  MoreHorizontal,
  Search
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import AddCompanyModal from '@/components/forms/AddCompanyModal';
import AddVendorModal from '@/components/forms/AddVendorModal';
import AddUserModal from '@/components/forms/AddUserModal';
import DetailedViewModal from '@/components/modals/DetailedViewModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OfferTemplateManager from '@/components/forms/OfferTemplateManager';
import { OfferWorkflowManager } from '@/components/OfferWorkflowManager';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalVendors: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    monthlyHires: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [platformHealth, setPlatformHealth] = useState({
    dbStatus: 'healthy' as 'healthy' | 'warning' | 'error',
    apiResponseTime: 0,
    lastChecked: new Date()
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<{
    type: 'users' | 'companies' | 'vendors' | 'jobs' | 'applications' | 'activeJobs' | 'monthlyHires';
    open: boolean;
    title: string;
    customFilterOptions?: { value: string; label: string }[];
    defaultFilter?: string;
  }>({
    type: 'users',
    open: false,
    title: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      // Fetch basic stats in parallel
      const [profilesResult, companiesResult, vendorsResult, jobsResult, applicationsResult] = await Promise.all([
        supabase.from('profiles').select('id, created_at, role, first_name, last_name').order('created_at', { ascending: false }),
        supabase.from('companies').select('id, created_at, name').order('created_at', { ascending: false }),
        supabase.from('vendors').select('id, created_at').order('created_at', { ascending: false }),
        supabase.from('jobs').select('id, created_at, status, title').order('created_at', { ascending: false }),
        supabase.from('job_applications').select(`
          id, 
          applied_at, 
          status,
          jobs (title),
          candidates (first_name, last_name)
        `).order('applied_at', { ascending: false })
      ]);

      // Calculate stats
      const activeJobsCount = jobsResult.data?.filter(job => job.status === 'published').length || 0;
      const monthlyHires = applicationsResult.data?.filter(app => 
        app.status === 'hired' && 
        new Date(app.applied_at).getMonth() === new Date().getMonth()
      ).length || 0;

      setStats({
        totalUsers: profilesResult.data?.length || 0,
        totalCompanies: companiesResult.data?.length || 0,
        totalVendors: vendorsResult.data?.length || 0,
        totalJobs: jobsResult.data?.length || 0,
        activeJobs: activeJobsCount,
        totalApplications: applicationsResult.data?.length || 0,
        monthlyHires
      });

      // Set recent activity - limit to 10 items
      setRecentActivity((applicationsResult.data || []).slice(0, 10));
      
      // Update platform health
      const responseTime = Date.now() - startTime;
      setPlatformHealth({
        dbStatus: 'healthy',
        apiResponseTime: responseTime,
        lastChecked: new Date()
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setPlatformHealth({
        dbStatus: 'error',
        apiResponseTime: 0,
        lastChecked: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (type: 'users' | 'companies' | 'vendors' | 'jobs' | 'applications' | 'activeJobs' | 'monthlyHires', title: string) => {
    setDetailModal({ type, open: true, title });
  };

  const handleGlobalFilter = (value: string) => {
    setGlobalFilter(value);
    // For now, this just updates the search input
    // In a real implementation, you would filter the actual data
    console.log('Filtering by:', value);
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered platform users",
      color: "text-blue-600",
      type: 'users' as const
    },
    {
      title: "Companies",
      value: stats.totalCompanies,
      icon: Building,
      description: "Active companies",
      color: "text-green-600",
      type: 'companies' as const
    },
    {
      title: "Vendors",
      value: stats.totalVendors,
      icon: Users,
      description: "Recruitment vendors",
      color: "text-pink-600",
      type: 'vendors' as const
    },
    {
      title: "Total Jobs",
      value: stats.totalJobs,
      icon: Briefcase,
      description: "Jobs posted",
      color: "text-purple-600",
      type: 'jobs' as const
    },
    {
      title: "Active Jobs",
      value: stats.activeJobs,
      icon: Calendar,
      description: "Currently open positions",
      color: "text-orange-600",
      type: 'activeJobs' as const
    },
    {
      title: "Applications",
      value: stats.totalApplications,
      icon: Users,
      description: "Total applications received",
      color: "text-cyan-600",
      type: 'applications' as const
    },
    {
      title: "Monthly Hires",
      value: stats.monthlyHires,
      icon: TrendingUp,
      description: "Successful hires this month",
      color: "text-emerald-600",
      type: 'monthlyHires' as const
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'screening':
        return 'bg-yellow-100 text-yellow-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'hired':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const dashboardActions = (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search dashboard..."
          value={globalFilter}
          onChange={(e) => handleGlobalFilter(e.target.value)}
          className="pl-10 w-64"
        />
      </div>
      <Button variant="outline" size="sm" onClick={() => console.log('Filter clicked')}>
        <Filter className="w-4 h-4 mr-2" />
        Filter
      </Button>
      <AddUserModal onUserAdded={fetchDashboardData} />
      <AddVendorModal onVendorAdded={fetchDashboardData} />
      <AddCompanyModal onCompanyAdded={fetchDashboardData} />
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout title="Super Admin Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-4 w-4 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-32"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Super Admin Dashboard" actions={dashboardActions}>
      <div className="space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-8 text-white">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
            <p className="text-white/80 text-lg">Here's what's happening with your recruitment platform today.</p>
          </div>
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="offers">Offer Templates</TabsTrigger>
            <TabsTrigger value="workflows">Offer Workflows</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const gradientColors = [
              'from-white to-blue-50',
              'from-white to-green-50', 
              'from-white to-pink-50',
              'from-white to-purple-50',
              'from-white to-orange-50',
              'from-white to-cyan-50',
              'from-white to-emerald-50'
            ];
            return (
              <Card 
                key={index} 
                className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} animate-slide-up relative`}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => openDetailModal(stat.type, stat.title)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        {stat.title}
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                        {stat.value.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </div>
                    <div className={`icon-wrapper ${stat.color} bg-gradient-primary`}>
                      <Icon className="h-6 w-6 text-white relative z-10" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Recent Applications</h3>
                  <p className="text-muted-foreground">Latest job applications across all companies</p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-full hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity: any) => (
                    <div key={activity.id} className="table-row-hover p-4 rounded-lg border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {activity.candidates?.first_name || 'N/A'} {activity.candidates?.last_name || ''}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Applied for {activity.jobs?.title || 'Unknown Job'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.applied_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-muted-foreground">No recent applications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50">
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Platform Health</h3>
                <p className="text-muted-foreground">System status and performance metrics</p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
                  <span className="font-medium text-foreground">Database Status</span>
                  <Badge className={platformHealth.dbStatus === 'healthy' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>
                    {platformHealth.dbStatus === 'healthy' ? 'Healthy' : 'Error'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-accent/5 to-primary/5">
                  <span className="font-medium text-foreground">API Response Time</span>
                  <span className="font-mono text-sm font-semibold">
                    {platformHealth.apiResponseTime > 0 ? `${platformHealth.apiResponseTime}ms` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
                  <span className="font-medium text-foreground">System Status</span>
                  <Badge className={platformHealth.dbStatus === 'healthy' ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
                    {platformHealth.dbStatus === 'healthy' ? 'Online' : 'Issues Detected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-accent/5 to-primary/5">
                  <span className="font-medium text-foreground">Last Checked</span>
                  <span className="font-mono text-sm font-semibold">
                    {platformHealth.lastChecked.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

            </div>
          </TabsContent>

          <TabsContent value="users">
            <DetailedViewModal
              type="users"
              open={true}
              onOpenChange={() => {}}
              title="All Users"
            />
          </TabsContent>

          <TabsContent value="companies">
            <DetailedViewModal
              type="companies"
              open={true}
              onOpenChange={() => {}}
              title="All Companies"
            />
          </TabsContent>

          <TabsContent value="vendors">
            <DetailedViewModal
              type="vendors"
              open={true}
              onOpenChange={() => {}}
              title="All Vendors"
            />
          </TabsContent>

          <TabsContent value="jobs">
            <DetailedViewModal
              type="jobs"
              open={true}
              onOpenChange={() => {}}
              title="All Jobs"
            />
          </TabsContent>

          <TabsContent value="offers">
            <OfferTemplateManager />
          </TabsContent>

          <TabsContent value="workflows">
            <OfferWorkflowManager />
          </TabsContent>
        </Tabs>

        {/* Detailed View Modal */}
        <DetailedViewModal
          type={detailModal.type}
          open={detailModal.open}
          onOpenChange={(open) => setDetailModal({ ...detailModal, open })}
          title={detailModal.title}
        />
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;