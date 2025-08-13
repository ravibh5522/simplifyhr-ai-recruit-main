import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { ApplicationDetailModal } from '@/components/modals/ApplicationDetailModal';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DetailedViewModal from '@/components/modals/DetailedViewModal';
import { 
  Search, 
  Briefcase, 
  Calendar, 
  FileText,
  Filter,
  Clock,
  MapPin,
  Building,
  Star,
  Upload,
  MoreHorizontal,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const CandidateDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
// const [viewingAppId, setViewingAppId] = useState<string | null>(null);

 const [detailModal, setDetailModal] = useState<{
    type: 'my-applications' | 'in-review' | 'my-interviews';
    open: boolean;
    title: string;
  }>({
    type: 'my-applications',
    open: false,
    title: ''
  });

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    applications: 0,
    inReview: 0,
    interviews: 0,
    profileViews: 0
  });
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.id) {
      fetchCandidateData();
    }
  }, [profile]);

// TO THIS (Functional update form)
const openDetailModal = (type: 'my-applications' | 'in-review' | 'my-interviews', title: string) => {
  console.log("Requesting modal state update to:", { type, open: true, title });
  // setDetailModal(prevState => ({ ...prevState, type, open: true, title }));
   setDetailModal({ type, open: true, title });
};

  // const fetchCandidateData = async () => {
  //   try {
  //     console.log('Fetching candidate data for user:', profile?.id);
      
  //     // First get the candidate record for this user
  //     const { data: candidateData, error: candidateError } = await supabase
  //       .from('candidates')
  //       .select('id')
  //       .eq('user_id', profile?.id)
  //       .single();

  //     if (candidateError || !candidateData) {
  //       console.error('No candidate profile found:', candidateError);
  //       setLoading(false);
  //       return;
  //     }

  //     // Get candidate's applications using the candidate ID
  //     const { data: applicationsData, error: appsError } = await supabase
  //       .from('job_applications')
  //       .select(`
  //         *,
  //         jobs (
  //           id,
  //           title,
  //           location,
  //           salary_min,
  //           salary_max,
  //           currency,
  //           companies (name)
  //         )
  //       `)
  //       .eq('candidate_id', candidateData.id)
  //       .order('applied_at', { ascending: false });

  //     if (appsError) {
  //       console.error('Error fetching applications:', appsError);
  //     } else {
  //       setApplications(applicationsData || []);
        
  //       // Calculate stats
  //       const totalApps = applicationsData?.length || 0;
  //       const inReview = applicationsData?.filter(app => app.status === 'screening' || app.status === 'reviewing').length || 0;
  //       const interviews = applicationsData?.filter(app => app.status === 'interview').length || 0;
        
  //       setStats({
  //         applications: totalApps,
  //         inReview,
  //         interviews,
  //         profileViews: 24 // Mock for now
  //       });
  //     }

  //     // Get AI-powered job recommendations
  //     const { data: recommendedJobs, error: recommendError } = await supabase.functions.invoke('recommend-jobs', {
  //       body: { userId: profile.id }
  //     });

  //     if (recommendError) {
  //       console.error('Error fetching AI recommendations:', recommendError);
  //       // Fallback to regular job fetching
  //       const { data: fallbackJobs, error: fallbackError } = await supabase
  //         .from('jobs')
  //         .select(`
  //           *,
  //           companies (name, logo_url)
  //         `)
  //         .eq('status', 'published')
  //         .order('created_at', { ascending: false })
  //         .limit(6);

  //       if (!fallbackError) {
  //         setRecommendedJobs(fallbackJobs || []);
  //       }
  //     } else {
  //       setRecommendedJobs(recommendedJobs || []);
  //     }

  //   } catch (error) {
  //     console.error('Error fetching candidate data:', error);
  //     toast({
  //       title: "Failed to load dashboard data",
  //       description: "Could not fetch your applications and job recommendations.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  //   const fetchCandidateData = async () => {

  //      if (!profile?.id) {
  //       setLoading(false);
  //       return;
  //   }
  //    setLoading(true);
  //   try {
  //     console.log('Fetching candidate data for user:', profile.id);
      
  //     // First get the candidate record for this user
  //     const { data: candidateData, error: candidateError } = await supabase
  //       .from('candidates')
  //       .select('id')
  //       .eq('profile_id', profile.id)
  //       .single();

  //     if (candidateError || !candidateData) {
  //       console.error('No candidate profile found:', candidateError);
  //       setLoading(false);
  //       return;
  //     }
  //     const candidateId = candidateData.id;
  //     // Get candidate's applications using the candidate ID
  //     const { data: applicationsData, error: appsError } = await supabase
  //       .from('job_applications')
  //       .select(`
  //         *,
  //         jobs (
  //           id,
  //           title,
  //           location,
  //           salary_min,
  //           salary_max,
  //           currency,
  //           companies (name)
  //         )
  //       `)
  //       .eq('candidate_id', candidateId)
  //       .order('applied_at', { ascending: false });

  //     if (appsError) {
  //       console.error('Error fetching applications:', appsError);
  //     } else {
  //       setApplications(applicationsData || []);
        
  //       // Calculate stats
  //       const totalApps = applicationsData?.length || 0;
  //      const inReview = applicationsData?.filter(app => ['applied', 'screening', 'reviewing'].includes(app.status)).length || 0;
  //           const interviews = applicationsData?.filter(app => app.status === 'interview').length || 0;
            
  //       setStats({
  //         applications: totalApps,
  //         inReview,
  //         interviews,
  //         profileViews: 24 // Mock for now
  //       });
  //     }

  //     // Get AI-powered job recommendations
  //     const { data: recommendedJobs, error: recommendError } = await supabase.functions.invoke('recommend-jobs', {
  //       body: { userId: profile.id }
  //     });

  //     if (recommendError) {
  //       console.error('Error fetching AI recommendations:', recommendError);
  //       // Fallback to regular job fetching
  //       const { data: fallbackJobs, error: fallbackError } = await supabase
  //         .from('jobs')
  //         .select(`
  //           *,
  //           companies (name, logo_url)
  //         `)
  //         .eq('status', 'published')
  //         .order('created_at', { ascending: false })
  //         .limit(6);

  //       if (!fallbackError) {
  //         setRecommendedJobs(fallbackJobs || []);
  //       }
  //     } else {
  //       setRecommendedJobs(recommendedJobs || []);
  //     }

  //   } catch (error) {
  //     console.error('Error fetching candidate data:', error);
  //     toast({
  //       title: "Failed to load dashboard data",
  //       description: "Could not fetch your applications and job recommendations.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // In CandidateDashboard.tsx
// diagnostic function to fetch candidate data
// const fetchCandidateData = async () => {
//     if (!profile?.id) {
//         setLoading(false);
//         console.log("--- ABORTING FETCH: Profile not yet loaded. ---");
//         return;
//     }
//     setLoading(true);
//     console.log(`--- STARTING DASHBOARD FETCH for Candidate Profile ID: ${profile.id} ---`);

//     try {
//         // --- STEP 1: Fetch the candidate's own internal ID ---
//         console.log("Step 1: Fetching ID from 'candidates' table...");
//         const { data: candidateData, error: candidateError, status: candidateStatus } = await supabase
//             .from('candidates')
//             .select('id')
//             .eq('profile_id', profile.id)
//             .single();

//         console.log("Step 1 Response Status:", candidateStatus);
//         if (candidateError || !candidateData) {
//             console.error(">>> FAILURE at Step 1: Could not find candidate record.", candidateError);
//             throw new Error("Your candidate record could not be found. This might be an RLS issue on the 'candidates' table.");
//         }
//         const candidateId = candidateData.id;
//         console.log("Step 1 SUCCESS. Found Candidate ID:", candidateId);

//         // --- STEP 2: Fetch the candidate's applications using their ID ---
//         console.log(`Step 2: Fetching applications from 'job_applications' where candidate_id = ${candidateId}...`);
//         const { data: applicationsData, error: appsError, status: appsStatus } = await supabase
//             .from('job_applications')
//             .select(`
//                 *,
//                 jobs (
//                     id, title, location,
//                     companies (name)
//                 )
//             `)
//             .eq('candidate_id', candidateId)
//             .order('applied_at', { ascending: false });

//         console.log("Step 2 Response Status:", appsStatus);
//         if (appsError) {
//             console.error(">>> FAILURE at Step 2: Error fetching applications.", appsError);
//             throw appsError;
//         }
//         console.log("Step 2 SUCCESS. Raw application data received:", applicationsData);

//         // --- STEP 3: Process the data ---
//         if (applicationsData) {
//             setApplications(applicationsData);
//             const totalApps = applicationsData.length;
//             const inReview = applicationsData.filter(app => ['applied', 'screening', 'reviewing'].includes(app.status)).length;
//             const interviews = applicationsData.filter(app => app.status === 'interview').length;
            
//             console.log(`Step 3 SUCCESS. Calculated Stats: Total=${totalApps}, In Review=${inReview}, Interviews=${interviews}`);
//             setStats({
//                 applications: totalApps,
//                 inReview,
//                 interviews,
//                 profileViews: 24 // Mock
//             });
//         }

//     } catch (error: any) {
//         console.error("--- CATCH BLOCK: Fetch process failed. ---", error);
//         toast({
//             title: "Failed to load dashboard data",
//             description: error.message,
//             variant: "destructive",
//         });
//     } finally {
//         setLoading(false);
//     }
// };


// In CandidateDashboard.tsx

const fetchCandidateData = async () => {
    if (!profile?.id) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
        console.log(`Fetching candidate applications for user ${profile.id} via RPC...`);

        // --- THIS IS THE FINAL FIX ---
        // We now call our single, powerful RPC function.
        const { data: applicationsData, error } = await supabase.rpc('get_my_applications');

        if (error) {
            console.error("Error calling RPC get_my_applications:", error);
            throw error;
        }

        console.log('Successfully fetched application data via RPC:', applicationsData);

        if (applicationsData) {
            setApplications(applicationsData);
            
            // Your stats calculation will now work perfectly with the RPC data.
            const totalApps = applicationsData.length;
            const inReview = applicationsData.filter(app => ['applied', 'screening', 'reviewing'].includes(app.status)).length;
            const interviews = applicationsData.filter(app => app.status === 'interview').length;
            
            setStats({
                applications: totalApps,
                inReview,
                interviews,
                profileViews: 24 // Mock
            });
        }

        // ... (your AI recommendation logic can remain the same)
     // Get AI-powered job recommendations
      const { data: recommendedJobs, error: recommendError } = await supabase.functions.invoke('recommend-jobs', {
        body: { userId: profile.id }
      });

      if (recommendError) {
        console.error('Error fetching AI recommendations:', recommendError);
        // Fallback to regular job fetching
        const { data: fallbackJobs, error: fallbackError } = await supabase
          .from('jobs')
          .select(`
            *,
            companies (name, logo_url)
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(6);

        if (!fallbackError) {
          setRecommendedJobs(fallbackJobs || []);
        }
      } else {
        setRecommendedJobs(recommendedJobs || []);
      }

    } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast({
            title: "Failed to load your applications",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
};

  const dashboardActions = (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm">
        <Filter className="w-4 h-4 mr-2" />
        Filter
      </Button>
      <Button 
        variant="hero" 
        size="sm"
        onClick={() => navigate('/jobs')}
      >
        <Search className="w-4 h-4 mr-2" />
        Find Jobs
      </Button>
    </div>
  );

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
    <DashboardLayout title="Candidate Dashboard" actions={dashboardActions}>
      <div className="space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-8 text-white">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Welcome to your Candidate Dashboard! 🎯</h1>
            <p className="text-white/80 text-lg">Track your applications, prepare for interviews, and find your dream job.</p>
          </div>
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="stat-card group animate-slide-up"  onClick={() => {
    // --- THIS IS THE TEST ---
    console.log("Applications card CLICKED!"); 
    openDetailModal('my-applications', 'My Submitted Applications');
  }} >
            <div className="flex items-center justify-between p-6">
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Applications
                </div>
                <div className="text-3xl font-bold text-gradient-primary mb-1">
                  {stats.applications}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total submitted
                </p>
              </div>
              <div className="icon-wrapper text-blue-600 bg-gradient-primary">
                <FileText className="h-6 w-6 text-white relative z-10" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          </div>

          <div className="stat-card group animate-slide-up" style={{ animationDelay: '100ms' }} onClick={() => openDetailModal('in-review', 'Applications In Review')}  >
            <div className="flex items-center justify-between p-6">
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  In Review
                </div>
                <div className="text-3xl font-bold text-gradient-primary mb-1">
                  {stats.inReview}
                </div>
                <p className="text-xs text-muted-foreground">
                  Under consideration
                </p>
              </div>
              <div className="icon-wrapper text-yellow-600 bg-gradient-primary">
                <Clock className="h-6 w-6 text-white relative z-10" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          </div>

          <div className="stat-card group animate-slide-up" style={{ animationDelay: '200ms' }} onClick={() => openDetailModal('my-interviews', 'My Scheduled Interviews')} >
            <div className="flex items-center justify-between p-6">
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Interviews
                </div>
                <div className="text-3xl font-bold text-gradient-primary mb-1">
                  {stats.interviews}
                </div>
                <p className="text-xs text-muted-foreground">
                  Scheduled
                </p>
              </div>
              <div className="icon-wrapper text-purple-600 bg-gradient-primary">
                <Calendar className="h-6 w-6 text-white relative z-10" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          </div>

          <div className="stat-card group animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between p-6">
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Profile Views
                </div>
                <div className="text-3xl font-bold text-gradient-primary mb-1">
                  {stats.profileViews}
                </div>
                <p className="text-xs text-muted-foreground">
                  This week
                </p>
              </div>
              <div className="icon-wrapper text-emerald-600 bg-gradient-primary">
                <Star className="h-6 w-6 text-white relative z-10" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Status */}
          <div className="lg:col-span-2">
            <div className="card-premium">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gradient-primary">My Applications</h3>
                    <p className="text-muted-foreground">Track your job application progress</p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  {applications.length > 0 ? (
                    applications.map((application, index) => (
                      <div key={application.id} className="table-row-hover p-4 rounded-lg border border-border/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">{application.jobs?.title}</h4>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                              <Building className="w-3 h-3" />
                              <span>{application.jobs?.companies?.name}</span>
                              <span>•</span>
                              <MapPin className="w-3 h-3" />
                              <span>{application.jobs?.location || 'Remote'}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                              <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
                              {application.jobs?.salary_min && application.jobs?.salary_max && (
                                <span>Salary: {application.jobs.salary_min.toLocaleString()} - {application.jobs.salary_max.toLocaleString()} {application.jobs.currency}</span>
                              )}
                            </div>
                          </div>
                          <Badge className={getApplicationStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground mb-4">No applications yet</p>
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/jobs')}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Browse Jobs
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile & Quick Actions */}
          <div className="space-y-6">
            {/* Profile Completion */}
            <div className="card-premium">
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gradient-primary">Profile Completion</h3>
                  <p className="text-muted-foreground">Complete your profile to get better matches</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
                    <span className="text-sm font-medium text-foreground">Basic Info</span>
                    <Badge className="bg-success text-success-foreground">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-accent/5 to-primary/5">
                    <span className="text-sm font-medium text-foreground">Resume</span>
                    <Badge className="bg-success text-success-foreground">Uploaded</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
                    <span className="text-sm font-medium text-foreground">Skills</span>
                    <Badge className="bg-warning text-warning-foreground">Partial</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-accent/5 to-primary/5">
                    <span className="text-sm font-medium text-foreground">Portfolio</span>
                    <Badge className="bg-destructive text-destructive-foreground">Missing</Badge>
                  </div>
                  
                  <div className="pt-4">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">75% Complete</p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/profile')}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Update Profile
                  </Button>
                </div>
              </div>
            </div>

            {/* Upcoming Interviews */}
            <div className="card-premium">
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gradient-primary">Upcoming Interviews</h3>
                  <p className="text-muted-foreground">Don't miss your scheduled interviews</p>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-border/50">
                    <h4 className="font-medium text-foreground text-sm">Senior Frontend Developer</h4>
                    <p className="text-xs text-muted-foreground">TechInnovate</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Tomorrow, 2:00 PM</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Join Interview
                    </Button>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gradient-to-r from-accent/5 to-primary/5 border border-border/50">
                    <h4 className="font-medium text-foreground text-sm">React Developer</h4>
                    <p className="text-xs text-muted-foreground">StartupHub</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Jan 25, 10:00 AM</span>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full mt-2">
                      Pending Confirmation
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Jobs */}
        <div className="card-premium">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gradient-primary">AI-Powered Recommendations</h3>
                <p className="text-muted-foreground">Jobs matched to your skills and experience</p>
              </div>
              <Button 
                variant="hero"
                onClick={() => navigate('/jobs')}
              >
                View All Jobs
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedJobs.length > 0 ? (
                  recommendedJobs.map((job, index) => (
                    <div key={job.id} className="table-row-hover p-4 rounded-lg border border-border/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{job.title}</h4>
                          {job.ai_score && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {job.ai_score}% Match
                              </Badge>
                              {job.ai_reason && (
                                <span className="text-xs text-muted-foreground">
                                  {job.ai_reason}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {job.ai_score ? 'AI Matched' : 'New'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Building className="w-3 h-3" />
                          <span>{job.companies?.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3 h-3" />
                          <span>{job.location || 'Remote'}</span>
                        </div>
                        {job.salary_min && job.salary_max && (
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-3 h-3" />
                            <span className="font-medium text-foreground">
                              {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} {job.currency}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs">{job.employment_type || 'Full-time'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-muted-foreground">
                          Posted {new Date(job.created_at).toLocaleDateString()}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate('/jobs')}
                        >
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">No job recommendations available</p>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/jobs')}
                    >
                      Browse All Jobs
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
     {/* --- THIS IS THE CRUCIAL PART THAT WAS MISSING --- */}
      {/* It renders the modal, which listens for the 'open' state to change. */}
      <DetailedViewModal
        type={detailModal.type}
        open={detailModal.open}
        onOpenChange={(open) => setDetailModal(prevState => ({ ...prevState, open }))}
        title={detailModal.title}

        initialData={
    // If the modal is for 'my-applications', give it the full 'applications' array
    detailModal.type === 'my-applications' 
      ? applications 
    
    // If the modal is for 'in-review', give it a pre-filtered version of the 'applications' array
    : detailModal.type === 'in-review' 
      ? applications.filter(app => ['applied','screening', 'interviewing', 'testing'].includes(app.status))
    
    // For 'my-interviews', we don't have the data yet, so we pass nothing.
    // The modal will then perform its own fetch for this case.
    : undefined 
  }
      />
    </>
  );
};

export default CandidateDashboard;