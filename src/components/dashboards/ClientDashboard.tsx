import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  TrendingUp,
  UserCheck,
  Plus,
  Filter,
  Eye,
  Edit,
  MoreHorizontal,
  Bot
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AddVendorModal from '@/components/forms/AddVendorModal';
import AddUserModal from '@/components/forms/AddUserModal';
import DetailedViewModal from '@/components/modals/DetailedViewModal';
import CreateJobModal from '@/components/forms/CreateJobModal';
import InterviewSchedulerChat from '@/components/InterviewSchedulerChat';
import MeetingIntegration from '@/components/MeetingIntegration';
import OfferTemplateManager from '@/components/forms/OfferTemplateManager';
import { SelectedCandidatesManager } from '@/components/SelectedCandidatesManager';
import { OfferWorkflowManager } from '@/components/OfferWorkflowManager';
import AdvancedAnalyticsDashboard from '@/components/analytics/AdvancedAnalyticsDashboard';
import InterviewSchedulingModal from '@/components/scheduling/InterviewSchedulingModal';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ViewJobModal } from '@/components/modals/ViewJobModal';

const ClientDashboard = () => {
  const hasDataFetched = useRef(false);
  const currentProfileId = useRef<string | null>(null);

  const [applications, setApplications] = useState([]);
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);

  console.log(`[ClientDashboard] Current viewingJobId is:`, viewingJobId);
  const { profile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    shortlistedCandidates: 0,
    selectedCandidates: 0,
    scheduledInterviews: 0
  });
  
  const [activeTab, setActiveTab] = useState('jobs');
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<{
    type: 'users' | 'companies' | 'jobs' | 'applications' | 'activeJobs' | 'monthlyHires';
    open: boolean;
    title: string;
    customFilterOptions?: { value: string; label: string }[];
    defaultFilter?: string;
  }>({
    type: 'jobs',
    open: false,
    title: '',
    customFilterOptions: undefined,
    defaultFilter: undefined
  });
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    // Only fetch data if profile ID is different or data hasn't been fetched yet
    if (profile?.id && (currentProfileId.current !== profile.id || !hasDataFetched.current)) {
      console.log('Fetching dashboard data for profile:', profile.id);
      currentProfileId.current = profile.id;
      hasDataFetched.current = true;
      fetchDashboardData();
    } else if (profile?.id && hasDataFetched.current) {
      console.log('Dashboard data already fetched, skipping');
    }
  }, [profile?.id]); // Only re-run if profile ID actually changes


const fetchDashboardData = async () => {
  if (!profile?.id) {
    setLoading(false);
    return;
  }
  console.log("--- STARTING ISOLATION TEST: APPLICATIONS TABLE ---");

  setLoading(true);
  try {
    // This is the single, powerful query that fetches everything.
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs') // We start from 'jobs' to build the main dashboard view.
      .select(`
        *,
        companies (name),
        job_applications (
          *,
          interview_schedules (*),
            candidates!inner (
              profiles!inner (
                first_name,
                last_name,
                email
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (jobsError) throw jobsError;

    // The data is now correctly shaped. `jobsData` is an array of jobs,
    // and each job has a `job_applications` array.
    // Each application within that array now has a `candidates.profiles` object.
    if (jobsData) {
      console.log("SUCCESS: Fetched all job data:", jobsData);
      // Your existing statistics logic will now work perfectly.
      const activeJobs = jobsData.filter(job => job.status === 'published').length;
      const totalApplications = jobsData.reduce((acc, job) => acc + (job.job_applications?.length || 0), 0);
      const shortlistedCandidates = jobsData.reduce((acc, job) =>
          acc + (job.job_applications?.filter((app: any) => 
            ['screening', 'interview'].includes(app.status)
          ).length || 0), 0
      );
      const selectedCandidates = jobsData.reduce((acc, job) =>
          acc + (job.job_applications?.filter((app: any) => app.status === 'selected').length || 0), 0
      );
      // Note: `interview_schedules` is not in this query for simplicity.
       const scheduledInterviews = jobsData.reduce((jobAcc, job) => {
        const interviewCountForJob = job.job_applications.reduce((appAcc: any, app: any) => {
          return appAcc + (app.interview_schedules?.length || 0);
        }, 0);
        return jobAcc + interviewCountForJob;
      }, 0);
      // We can add it if needed, but this solves the current error.

      console.log("SUCCESS: Fetched all data. Total applications found:", totalApplications);
      
      setStats({
          activeJobs,
          totalApplications,
          shortlistedCandidates,
          selectedCandidates,
          scheduledInterviews // Keep old value for now
      });

      // This also correctly populates your list of jobs.
      setRecentJobs(jobsData);
    }

  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    toast({
      title: "Failed to load dashboard data",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openDetailModal = (type: 'users' | 'companies' | 'jobs' | 'applications' | 'activeJobs' | 'monthlyHires', title: string) => {
    if (title === 'Shortlisted Candidates') {
      setDetailModal({
        type,
        open: true,
        title,
        customFilterOptions: [
          { value: 'interview', label: 'Interview' },
          { value: 'screening', label: 'Screening' }
        ],
        defaultFilter: 'interview'
      });
    } else if (title === 'Total Applications') {
      setDetailModal({
        type,
        open: true,
        title,
        customFilterOptions: null,
        defaultFilter: 'all'
      });
    } else {
      setDetailModal({
        type,
        open: true,
        title
      });
    }
  };

  const handleGlobalFilter = (value: string) => {
    setGlobalFilter(value);
  };

  const assessApplication = async (applicationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('assess-application', {
        body: { applicationId }
      });

      if (error) throw error;

      toast({
        title: "Assessment complete",
        description: `Application scored ${data.score}/100`,
      });

      // Refresh data to show updated scores
      fetchDashboardData();
    } catch (error) {
      console.error('Error assessing application:', error);
      toast({
        title: "Assessment failed",
        description: "Could not assess the application automatically.",
        variant: "destructive",
      });
    }
  };

  const assessAllApplications = async (jobId: string, applications: any[]) => {
    try {
      const unassessedApps = applications.filter(app => !app.screening_score);
      
      if (unassessedApps.length === 0) {
        toast({
          title: "All applications assessed",
          description: "All applications for this job have already been assessed.",
        });
        return;
      }

      toast({
        title: "Assessing applications",
        description: `Processing ${unassessedApps.length} applications...`,
      });

      // Assess applications in parallel
      await Promise.all(
        unassessedApps.map(app => assessApplication(app.id))
      );

    } catch (error) {
      console.error('Error assessing applications:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const markCandidateAsSelected = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'selected' })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Candidate selected",
        description: "Candidate has been marked as selected and can now proceed to offer workflow.",
      });

      await fetchDashboardData();
    } catch (error) {
      console.error('Error selecting candidate:', error);
      toast({
        title: "Error",
        description: "Failed to select candidate",
        variant: "destructive",
      });
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
      <Button variant="outline" size="sm">
        <Filter className="w-4 h-4 mr-2" />
        Filter
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={fetchDashboardData}
        title="Refresh dashboard data"
      >
        🔄 Refresh
      </Button>
      <AddUserModal onUserAdded={fetchDashboardData} />
      <AddVendorModal onVendorAdded={fetchDashboardData} />
      <OfferTemplateManager onTemplateUploaded={fetchDashboardData} />
      <CreateJobModal onJobCreated={fetchDashboardData} />
      <InterviewSchedulingModal onScheduled={fetchDashboardData} />
    </div>
  );

  // Return loading state if data is being fetched
  if (loading) {
    return (
      <DashboardLayout title="Client Dashboard">
        <div className="space-y-8">
          {/* Enhanced Loading Hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8 text-white">
            <div className="relative z-10 flex items-center">
              <div className="animate-pulse flex-1">
                <div className="h-8 bg-white/20 rounded-lg w-96 mb-4"></div>
                <div className="h-4 bg-white/10 rounded w-80"></div>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full animate-spin"></div>
            </div>
          </div>

          {/* Enhanced Loading Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-20"></div>
                      <div className="h-8 bg-muted rounded w-16"></div>
                      <div className="h-2 bg-muted rounded w-24"></div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full"></div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Enhanced Loading Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 animate-pulse border-0 shadow-lg">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-32"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg"></div>
                ))}
              </CardContent>
            </Card>
            <Card className="animate-pulse border-0 shadow-lg">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-28"></div>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-muted rounded-lg"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Return main dashboard content
  return (
    <DashboardLayout title="Client Dashboard" actions={dashboardActions}>
      <div className="space-y-6 animate-fade-in">
        {/* Enhanced Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 text-white shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  Welcome back, {profile?.first_name}! 
                  <div className="animate-bounce">🚀</div>
                </h1>
                <p className="text-white/80 text-sm leading-relaxed max-w-2xl">
                  Manage your job postings, track candidate applications, and streamline your hiring process with powerful AI-driven insights.
                </p>
              </div>
              <div className="hidden lg:flex items-center justify-center w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm">
                <Bot className="w-10 h-10 text-white/90 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-repeat" 
                 style={{ 
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M30 30c0-11.046 8.954-20 20-20v20H30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
                 }}>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card 
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50"
            onClick={() => openDetailModal('activeJobs', 'Active Jobs')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    Active Jobs
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                    {stats.activeJobs}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently published
                  </p>
                  <div className="mt-3 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-green-50 animate-slide-up relative"
            style={{ animationDelay: '100ms' }}
            onClick={() => openDetailModal('applications', 'Total Applications')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Total Applications
                  </div>
                  <div className="text-3xl font-bold text-gradient-primary mb-1">
                    {stats.totalApplications}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all jobs
                  </p>
                </div>
                <div className="icon-wrapper text-green-600 bg-gradient-primary">
                  <Users className="h-6 w-6 text-white relative z-10" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            </CardContent>
          </Card>

          <Card 
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50 animate-slide-up relative"
            style={{ animationDelay: '200ms' }}
            onClick={() => openDetailModal('applications', 'Shortlisted Candidates')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Shortlisted
                  </div>
                  <div className="text-3xl font-bold text-gradient-primary mb-1">
                    {stats.shortlistedCandidates}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ready for interview
                  </p>
                </div>
                <div className="icon-wrapper text-purple-600 bg-gradient-primary">
                  <TrendingUp className="h-6 w-6 text-white relative z-10" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            </CardContent>
          </Card>

          <Card 
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-orange-50 animate-slide-up relative"
            style={{ animationDelay: '300ms' }}
            onClick={() => openDetailModal('applications', 'Scheduled Interviews')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Interviews
                  </div>
                  <div className="text-3xl font-bold text-gradient-primary mb-1">
                    {stats.scheduledInterviews}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This week
                  </p>
                </div>
                <div className="icon-wrapper text-orange-600 bg-gradient-primary">
                  <Calendar className="h-6 w-6 text-white relative z-10" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            </CardContent>
          </Card>

          <Card 
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-emerald-50 animate-slide-up relative"
            style={{ animationDelay: '400ms' }}
            onClick={() => setActiveTab('selected')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Selected
                  </div>
                  <div className="text-3xl font-bold text-gradient-primary mb-1">
                    {stats.selectedCandidates}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ready for offers
                  </p>
                </div>
                <div className="icon-wrapper text-emerald-600 bg-gradient-primary">
                  <UserCheck className="h-6 w-6 text-white relative z-10" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="jobs">Jobs & Applications</TabsTrigger>
            <TabsTrigger value="selected">Selected Candidates</TabsTrigger>
            <TabsTrigger value="offers">Offer Workflows</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-6">
            <Card className="card-premium border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Your Jobs</h3>
                    <p className="text-muted-foreground">Manage your job postings and applications</p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  {recentJobs.length > 0 ? (
                    recentJobs.map((job: any) => (
                      <div key={job.id} className="group p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-white to-slate-50/50">
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {job.companies?.name} • {job.location || 'Remote'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Posted {new Date(job.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2">
                                <div className="text-sm font-semibold text-blue-700">
                                  {job.job_applications?.length || 0}
                                </div>
                                <div className="text-xs text-blue-600">Applications</div>
                              </div>
                              
                              <Badge className={`${getJobStatusColor(job.status)} font-medium`}>
                                {job.status}
                              </Badge>
                              
                              <div className="flex items-center space-x-1">
                                <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200" onClick={() => setViewingJobId(job.id)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="hover:bg-green-50 hover:text-green-600 transition-all duration-200">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {job.job_applications && job.job_applications.length > 0 && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="hover:bg-purple-50 hover:text-purple-600 transition-all duration-200"
                                      onClick={() => assessAllApplications(job.id, job.job_applications)}
                                      title="Assess All Applications with AI"
                                    >
                                      <Bot className="w-4 h-4" />
                                    </Button>
                                    <InterviewSchedulerChat 
                                      jobId={job.id}
                                      applicationId={job.job_applications[0].id}
                                      trigger={
                                        <Button variant="ghost" size="sm" className="hover:bg-orange-50 hover:text-orange-600 transition-all duration-200" title="Schedule Interview">
                                          <Calendar className="w-4 h-4" />
                                        </Button>
                                      }
                                    />
                                    <MeetingIntegration 
                                      interviewId={job.job_applications[0].interviews?.[0]?.id || job.job_applications[0].id} 
                                      jobDescription={job.description || job.title}
                                      resumeText={job.job_applications[0].candidates?.resume_text || ""}
                                      trigger={
                                        <Button variant="ghost" size="sm" className="hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200" title="Setup Meeting & AI Interview">
                                          <Bot className="w-4 h-4" />
                                        </Button>
                                      }
                                    />
                                  </>
                                )}
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Applications List with AI Scores */}
                          {job.job_applications && job.job_applications.length > 0 && (
                            <div className="border-t pt-3">
                              <h4 className="text-sm font-medium text-muted-foreground mb-3">Applications ({job.job_applications.length})</h4>
                              <div className="space-y-2">
                                {job.job_applications.map((application: any) => (
                                  <div key={application.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3">
                                        <div>
                                          <p className="text-sm font-medium">
                                            {application.candidates?.profiles?.first_name} {application.candidates?.profiles?.last_name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {application.candidates?.profiles?.email}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                     <div className="flex items-center space-x-3">
                                       {application.screening_score ? (
                                         <TooltipProvider>
                                           <Tooltip>
                                             <TooltipTrigger asChild>
                                               <div className="flex items-center space-x-2 cursor-help">
                                                 <Badge className={getScoreBadgeColor(application.screening_score)}>
                                                   {application.screening_score}%
                                                 </Badge>
                                                 <div className="w-16">
                                                   <Progress 
                                                     value={application.screening_score} 
                                                     className="h-2"
                                                   />
                                                 </div>
                                               </div>
                                             </TooltipTrigger>
                                             <TooltipContent className="max-w-xs">
                                               <div className="space-y-2">
                                                 <p className="font-semibold">AI Assessment</p>
                                                 <p className="text-sm">{application.ai_screening_notes || 'No detailed assessment available'}</p>
                                               </div>
                                             </TooltipContent>
                                           </Tooltip>
                                         </TooltipProvider>
                                       ) : (
                                         <Button 
                                           variant="outline" 
                                           size="sm"
                                           onClick={() => assessApplication(application.id)}
                                         >
                                           <Bot className="w-3 h-3 mr-1" />
                                           Assess
                                         </Button>
                                       )}
                                      
                                       {application.status !== 'selected' && application.screening_score && application.screening_score >= 70 && (
                                         <Button 
                                           variant="outline" 
                                           size="sm"
                                           onClick={() => markCandidateAsSelected(application.id)}
                                           className="text-green-600 border-green-200 hover:bg-green-50"
                                         >
                                           Select
                                         </Button>
                                       )}
                                       
                                       <Badge variant="outline" className={
                                         application.status === 'selected' ? 'bg-green-100 text-green-800' : ''
                                       }>
                                         {application.status}
                                       </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                        <Briefcase className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-muted-foreground mb-4">No jobs posted yet</p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Start by creating your first job posting or use our AI Job Generator
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <CreateJobModal onJobCreated={fetchDashboardData} />
                        <InterviewSchedulerChat 
                          jobId="demo"
                          applicationId="demo"
                          trigger={
                            <Button variant="outline" size="sm">
                              <Bot className="w-4 h-4 mr-2" />
                              Try AI Interview Scheduler
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="selected" className="space-y-6">
            <SelectedCandidatesManager />
          </TabsContent>

          <TabsContent value="offers" className="space-y-6">
            <OfferWorkflowManager />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalyticsDashboard />
          </TabsContent>
        </Tabs>

        {/* Detailed View Modal */}
        <DetailedViewModal
          type={detailModal.type}
          open={detailModal.open}
          onOpenChange={(open) => setDetailModal({ ...detailModal, open })}
          title={detailModal.title}
          customFilterOptions={detailModal.customFilterOptions}
          defaultFilter={detailModal.defaultFilter}
          // initialData={recentJobs}
          onViewJob={(id) => {
            console.log(`[ClientDashboard] onViewJob called with ID: ${id}. Setting state...`);
            setViewingJobId(id);
          }}
        />
        <ViewJobModal
        jobId={viewingJobId}
        open={!!viewingJobId} // The modal is open if viewingJobId is not null
        onOpenChange={() => setViewingJobId(null)} // Close the modal by resetting the ID
      />
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;