import { useState, useEffect } from 'react';

import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Building2,
  ArrowLeft,
  Users,
  Calendar,
  Briefcase
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetail();
    }
  }, [id]);

  const fetchJobDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            id,
            name,
            logo_url,
            industry,
            description
          )
        `)
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
      toast({
        title: "Error loading job",
        description: "Could not fetch job details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // const handleApply = async () => {
  //   if (!profile?.id) {
  //     toast({
  //       title: "Authentication required",
  //       description: "Please log in to apply for jobs",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setApplying(true);
  //   try {
  //     // Get candidate ID
  //     const { data: candidateData, error: candidateError } = await supabase
  //       .from('candidates')
  //       .select('id')
  //       .eq('user_id', profile.id)
  //       .single();

  //     if (candidateError || !candidateData) {
  //       toast({
  //         title: "Profile required",
  //         description: "Please complete your candidate profile first",
  //         variant: "destructive",
  //       });
  //       return;
  //     }

  //     // Check if already applied
  //     const { data: existingApplication } = await supabase
  //       .from('job_applications')
  //       .select('id')
  //       .eq('job_id', id)
  //       .eq('candidate_id', candidateData.id)
  //       .single();

  //     if (existingApplication) {
  //       toast({
  //         title: "Already applied",
  //         description: "You have already applied for this job",
  //         variant: "destructive",
  //       });
  //       return;
  //     }

  //     // Submit application
  //     const { error } = await supabase
  //       .from('job_applications')
  //       .insert({
  //         job_id: id,
  //         candidate_id: candidateData.id,
  //         status: 'applied'
  //       });

  //     if (error) throw error;

  //     toast({
  //       title: "Application submitted!",
  //       description: "Your application has been sent successfully",
  //     });
      
  //     // Navigate back to jobs or dashboard
  //     navigate('/dashboard');
  //   } catch (error) {
  //     console.error('Error applying for job:', error);
  //     toast({
  //       title: "Application failed",
  //       description: "Could not submit your application",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setApplying(false);
  //   }
  // };

  // In BOTH Jobs.tsx and JobDetail.tsx

// const handleApply = async (jobId: string) => {
//   if (!profile?.id) {
//     toast({ title: "Authentication required" });
//     return;
//   }

//   console.log("--- Starting Application Process ---");
//   console.log("User profile ID:", profile.id);
//   console.log("Applying for Job ID:", jobId);

//   setApplying(true); // Assuming you have this state
//   try {
//     // --- STEP 1: Get Candidate ID ---
//     console.log("Step 1: Fetching candidate record...");
//     const { data: candidateData, error: candidateError } = await supabase
//       .from('candidates')
//       .select('id')
//       .eq('profile_id', profile.id)
//       .single();

//     if (candidateError) {
//       console.error("ERROR in Step 1 (Fetching Candidate):", candidateError);
//       throw new Error("Could not find your candidate profile. Please complete it first.");
//     }
//     if (!candidateData) {
//       throw new Error("No candidate record found for your profile.");
//     }
    
//     const candidateId = candidateData.id;
//     console.log("Step 1 SUCCESS. Found Candidate ID:", candidateId);

//     // --- STEP 2: Check for Existing Application ---
//     console.log("Step 2: Checking for existing application...");
//     const { data: existingApplication, error: checkError } = await supabase
//       .from('job_applications')
//       .select('id')
//       .eq('job_id', jobId)
//       .eq('candidate_id', candidateId)
//       .maybeSingle(); // Use maybeSingle() to handle no result gracefully

//     if (checkError) {
//       console.error("ERROR in Step 2 (Checking Application):", checkError);
//       throw new Error("Could not check for existing applications.");
//     }

//     if (existingApplication) {
//       console.log("Step 2 COMPLETE. Application already exists.");
//       toast({ title: "Already Applied", description: "You have already applied for this job." });
//       setApplying(false); // Make sure to stop loading
//       return;
//     }
//     console.log("Step 2 SUCCESS. No existing application found.");

//     // --- STEP 3: Insert New Application ---
//     console.log("Step 3: Inserting new application...");
//     const { error: insertError } = await supabase
//       .from('job_applications')
//       .insert({
//         job_id: jobId,
//         candidate_id: candidateId,
//         status: 'applied'
//       });

//     if (insertError) {
//       console.error("ERROR in Step 3 (Inserting Application):", insertError);
//       throw insertError;
//     }

//     console.log("Step 3 SUCCESS. Application submitted!");
//     toast({ title: "Application Submitted!" });

//   } catch (error: any) {
//     console.error('--- APPLICATION PROCESS FAILED ---', error);
//     toast({
//       title: "Application Failed",
//       description: error.message,
//       variant: "destructive",
//     });
//   } finally {
//     setApplying(false);
//   }
// };

// This is the correct function. Place it back in your Jobs.tsx or JobDetail.tsx
// This is the final, correct version for both Jobs.tsx and JobDetail.tsx.
// It assumes you have `profile` from a useAuth() hook and a state variable like:
// const [applying, setApplying] = useState(false);

const handleApply = async (jobId: string) => {
  // 1. Guard Clause: Ensure a user is logged in.
  if (!profile?.id) {
    toast({
      title: "Authentication Required",
      description: "Please log in to apply for jobs.",
      variant: "warning",
    });
    return;
  }

  setApplying(true);
  try {
    // 2. Fetch the Candidate's ID from the `candidates` table.
    // This step is REQUIRED by the database foreign key on `job_applications`.
    // It is PERMITTED by "Policy #2: Candidates can view their own candidate profile".
    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (candidateError || !candidateData) {
      // This is a critical failure, as the user lacks a candidate-specific record.
      throw new Error("Your candidate record could not be found. Please complete your profile first.");
    }
    const candidateId = candidateData.id;

    // 3. Prevent Duplicate Applications.
    // This is a simple check to improve user experience.
    // const { data: existingApplication, error: checkError } = await supabase
    //   .from('job_applications')
    //   .select('id')
    //   .eq('job_id', jobId)
    //   .eq('candidate_id', candidateId)
    //   .maybeSingle(); 
        const { data: existingApplication, error: checkError } = await supabase.rpc('check_if_already_applied', {
      p_job_id: jobId
    });
    
    if (checkError) throw checkError; // If this check fails, something is wrong.

    if (existingApplication) {
      toast({ title: "Already Applied", description: "You have already applied for this job." });
      return; // Stop the function here.
    }

    // 4. Insert the New Application.
    // This is the final step that was previously failing.
    // It will now SUCCEED because it satisfies all conditions of "Policy #3".
    const { error: insertError } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        candidate_id: candidateId, // Satisfies the foreign key and the RLS subquery.
        status: 'applied'
      });

    // If an error exists after the insert attempt, throw it to the catch block.
    if (insertError) throw insertError;

    // 5. Success!
    toast({
      title: "Application Submitted!",
      description: "Your application has been sent successfully.",
    });

  } catch (error: any) {
    // This single catch block handles any error from the steps above.
    console.error('Error during the application process:', error);
    toast({
        title: "Application Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
    });
  } finally {
    // Ensure the loading state is always turned off, even if there's an error.
    setApplying(false);
  }
};

// This is the final diagnostic version for BOTH Jobs.tsx and JobDetail.tsx

// const handleApply = async (jobId: string) => {
//   // 1. Guard Clause: Ensure a user is logged in.
//   if (!profile?.id) {
//     toast({
//       title: "Authentication Required",
//       description: "Please log in to apply for jobs.",
//       variant: "warning",
//     });
//     return;
//   }

//   setApplying(true);
//   console.log(`--- APPLYING FOR JOB: ${jobId} ---`);
//   console.log(`User Profile ID: ${profile.id}`);

//   try {
//     // 2. Fetch the Candidate's ID from the `candidates` table.
//     console.log("Step 1: Fetching candidate ID from 'candidates' table...");
//     const { data: candidateData, error: candidateError } = await supabase
//       .from('candidates')
//       .select('id')
//       .eq('profile_id', profile.id)
//       .single();

//     if (candidateError) {
//       console.error(">>> FAILURE at Step 1: Error fetching candidate record.", candidateError);
//       throw candidateError;
//     }
//     if (!candidateData) {
//       console.error(">>> FAILURE at Step 1: No candidate record found for this profile.");
//       throw new Error("Your candidate record could not be found. Please complete your profile first.");
//     }
//     const candidateId = candidateData.id;
//     console.log("Step 1 SUCCESS. Found Candidate ID:", candidateId);


//     // 3. Prevent Duplicate Applications.
//     console.log(`Step 2: Checking if application exists for job ${jobId} and candidate ${candidateId}...`);
//     const { data: existingApplication, error: checkError, status: checkStatus } = await supabase
//       .from('job_applications')
//       .select('id')
//       .eq('job_id', jobId)
//       .eq('candidate_id', candidateId)
//       .maybeSingle(); 

//     console.log("Step 2 Response Status:", checkStatus);
//     if (checkError) {
//         console.error(">>> FAILURE at Step 2: Error during duplicate check.", checkError);
//         throw checkError;
//     }
//     console.log("Step 2 Data Received:", existingApplication);


//     if (existingApplication) {
//       console.log("Step 2 CONCLUSION: Duplicate application found. Halting process.");
//       toast({ title: "Already Applied", description: "You have already applied for this job." });
//       setApplying(false); // Make sure to stop loading
//       return; // Stop the function here.
//     }
//     console.log("Step 2 CONCLUSION: No duplicate found. Proceeding to insert.");


//     // 4. Insert the New Application.
//     console.log("Step 3: Inserting new application...");
//     const { error: insertError, status: insertStatus } = await supabase
//       .from('job_applications')
//       .insert({
//         job_id: jobId,
//         candidate_id: candidateId,
//         status: 'applied'
//       });
    
//     console.log("Step 3 Response Status:", insertStatus);
//     if (insertError) {
//         console.error(">>> FAILURE at Step 3: Error during insert.", insertError);
//         throw insertError;
//     }


//     // 5. Success!
//     console.log("--- APPLICATION PROCESS SUCCESSFUL ---");
//     toast({
//       title: "Application Submitted!",
//       description: "Your application has been sent successfully.",
//     });

//   } catch (error: any) {
//     // This single catch block handles any error from the steps above.
//     console.error('--- CATCH BLOCK: An error occurred during the application process ---', error);
//     toast({
//         title: "Application Failed",
//         description: error.message || "An unexpected error occurred. Please try again.",
//         variant: "destructive",
//     });
//   } finally {
//     // Ensure the loading state is always turned off, even if there's an error.
//     setApplying(false);
//   }
// };

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
    if (min) return `From ${min.toLocaleString()} ${currency}`;
    if (max) return `Up to ${max.toLocaleString()} ${currency}`;
    return 'Competitive salary';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-6"></div>
              <div className="animate-pulse absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-primary/40 mx-auto"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Job Details</h2>
            <p className="text-muted-foreground">Please wait while we fetch the job information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Job Not Found</h3>
            <p className="text-gray-600 text-lg mb-8">The job you're looking for doesn't exist or is no longer available</p>
            <Button onClick={() => navigate('/jobs')} size="lg" className="h-12 px-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse All Jobs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate('/jobs')} size="lg" className="h-11">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                {job.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
                <div className="flex items-center bg-blue-50 px-4 py-2 rounded-full">
                  <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="font-medium">{job.companies?.name}</span>
                </div>
                {job.location && (
                  <div className="flex items-center bg-green-50 px-4 py-2 rounded-full">
                    <MapPin className="w-5 h-5 mr-2 text-green-600" />
                    <span className="font-medium">{job.location}</span>
                    {job.remote_allowed && (
                      <Badge variant="secondary" className="ml-3 bg-green-100 text-green-700 hover:bg-green-100">
                        🏠 Remote OK
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                  <Clock className="w-4 h-4 mr-2" />
                  Posted {new Date(job.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                  <Users className="w-4 h-4 mr-2" />
                  {job.total_positions} position{job.total_positions !== 1 ? 's' : ''}
                </div>
                {job.is_urgent && (
                  <div className="flex items-center bg-red-50 px-3 py-2 rounded-lg">
                    <span className="text-red-600 font-medium">🚨 Urgent Hiring</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right lg:text-left">
              <Button 
                onClick={() => handleApply(job.id)} 
                disabled={!profile?.id || applying}
                size="lg"
                className="h-14 px-10 mb-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg text-lg font-semibold"
              >
                {applying ? 'Applying...' : 'Apply Now'}
              </Button>
              {!profile?.id && (
                <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-700 font-medium">Please log in to apply for this job</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Job Details */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enhanced Job Description */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-2xl font-semibold text-gray-900">Job Description</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="prose max-w-none prose-blue">
                  {job.description ? (
                    <MarkdownRenderer content={job.description} /> 
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-lg">No description provided</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <ul className="space-y-4">
                    {job.requirements.map((req: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Skills */}
            {job.skills_required && job.skills_required.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                  <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    Required Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {job.skills_required.map((skill: string, index: number) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-sm py-2 px-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-indigo-100"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-8">
            {/* Enhanced Job Summary */}
            <Card className="shadow-lg sticky top-6">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-teal-500 rounded-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  Job Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <DollarSign className="w-6 h-6 mr-3 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Salary</p>
                    <p className="text-sm text-green-700">
                      {formatSalary(job.salary_min, job.salary_max, job.currency || 'IDR')}
                    </p>
                  </div>
                </div>
                
                {job.employment_type && (
                  <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <Briefcase className="w-6 h-6 mr-3 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Employment Type</p>
                      <p className="text-sm text-blue-700 capitalize">{job.employment_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                )}
                
                {job.experience_level && (
                  <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
                    <Calendar className="w-6 h-6 mr-3 text-purple-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Experience Level</p>
                      <p className="text-sm text-purple-700 capitalize">{job.experience_level} Level</p>
                    </div>
                  </div>
                )}

                {job.expires_at && (
                  <div className="flex items-center p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl">
                    <Clock className="w-6 h-6 mr-3 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Application Deadline</p>
                      <p className="text-sm text-amber-700">
                        {new Date(job.expires_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Apply Button in Sidebar */}
                <div className="pt-4 border-t border-gray-100">
                  <Button 
                    onClick={() => handleApply(job.id)} 
                    disabled={!profile?.id || applying}
                    size="lg"
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
                  >
                    {applying ? 'Applying...' : 'Apply Now'}
                  </Button>
                  {!profile?.id && (
                    <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                      <p className="text-sm text-amber-700 font-medium">Please log in to apply</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Company Info */}
            {job.companies && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    About the Company
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      {job.companies.logo_url ? (
                        <img 
                          src={job.companies.logo_url} 
                          alt={job.companies.name}
                          className="w-16 h-16 mx-auto rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-xl text-center text-gray-900">{job.companies.name}</h4>
                    {job.companies.industry && (
                      <div className="text-center">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          {job.companies.industry}
                        </Badge>
                      </div>
                    )}
                    {job.companies.description && (
                      <p className="text-gray-700 leading-relaxed text-center">{job.companies.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;