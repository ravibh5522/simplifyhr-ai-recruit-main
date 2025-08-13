import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import MarkdownPreview from '@/components/ui/MarkdownPreview'; // <-- ADD THIS IMPORT

import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Building2,
  Search,
  Filter,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// At the top of your Jobs.tsx file, outside the component

// This function takes a markdown string and returns clean text
const stripMarkdown = (markdown: string): string => {
  if (!markdown) return '';
  // This regular expression finds and replaces common markdown syntax
  return markdown
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
    .replace(/(\*|_)(.*?)\1/g, '$2')   // Italic
    .replace(/#+\s/g, '')              // Headers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Code
    .replace(/(\r\n|\n|\r)/gm, " ")     // Line breaks
    .replace(/\s+/g, ' ')               // Multiple spaces
    .trim();
};


const Jobs = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
   const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchPublishedJobs();
  }, []);

  useEffect(() => {
    const filtered = jobs.filter(job => 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companies?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredJobs(filtered);
  }, [jobs, searchTerm]);

  const fetchPublishedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            id,
            name,
            logo_url,
            industry
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error loading jobs",
        description: "Could not fetch available jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // const handleApply = async (jobId: string) => {
  //   if (!profile?.id) {
  //     toast({
  //       title: "Authentication required",
  //       description: "Please log in to apply for jobs",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   try {
  //     // First, get the candidate ID from the candidates table
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

  //     // Check if user already applied
  //     const { data: existingApplication } = await supabase
  //       .from('job_applications')
  //       .select('id')
  //       .eq('job_id', jobId)
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

  //     // Create job application
  //     const { error } = await supabase
  //       .from('job_applications')
  //       .insert({
  //         job_id: jobId,
  //         candidate_id: candidateData.id,
  //         status: 'applied'
  //       });

  //     if (error) throw error;

  //     toast({
  //       title: "Application submitted!",
  //       description: "Your application has been sent successfully",
  //     });
  //   } catch (error) {
  //     console.error('Error applying for job:', error);
  //     toast({
  //       title: "Application failed",
  //       description: "Could not submit your application",
  //       variant: "destructive",
  //     });
  //   }
  // };


  const handleApply = async (jobId: string) => {
  if (!profile?.id) {
    toast({ title: "Authentication required" });
    return;
  }

  console.log("--- Starting Application Process ---");
  console.log("User profile ID:", profile.id);
  console.log("Applying for Job ID:", jobId);

  setApplying(true); // Assuming you have this state
  try {
    // --- STEP 1: Get Candidate ID ---
    console.log("Step 1: Fetching candidate record...");
    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .select('id')
      .eq('profile_id', profile.id)
      .single();

    if (candidateError) {
      console.error("ERROR in Step 1 (Fetching Candidate):", candidateError);
      throw new Error("Could not find your candidate profile. Please complete it first.");
    }
    if (!candidateData) {
      throw new Error("No candidate record found for your profile.");
    }
    
    const candidateId = candidateData.id;
    console.log("Step 1 SUCCESS. Found Candidate ID:", candidateId);

    // --- STEP 2: Check for Existing Application ---
    console.log("Step 2: Checking for existing application...");
    // const { data: existingApplication, error: checkError } = await supabase
    //   .from('job_applications')
    //   .select('id')
    //   .eq('job_id', jobId)
    //   .eq('candidate_id', candidateId)
    //   .maybeSingle(); // Use maybeSingle() to handle no result gracefully

          const { data: existingApplication, error: checkError } = await supabase.rpc('check_if_already_applied', {
          p_job_id: jobId
        });
        
    if (checkError) {
      console.error("ERROR in Step 2 (Checking Application):", checkError);
      throw new Error("Could not check for existing applications.");
    }

    if (existingApplication) {
      console.log("Step 2 COMPLETE. Application already exists.");
      toast({ title: "Already Applied", description: "You have already applied for this job." });
      setApplying(false); // Make sure to stop loading
      return;
    }
    console.log("Step 2 SUCCESS. No existing application found.");

    // --- STEP 3: Insert New Application ---
    console.log("Step 3: Inserting new application...");
    const { error: insertError } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        candidate_id: candidateId,
        status: 'applied'
      });

    if (insertError) {
      console.error("ERROR in Step 3 (Inserting Application):", insertError);
      throw insertError;
    }

    console.log("Step 3 SUCCESS. Application submitted!");
    toast({ title: "Application Submitted!" });

  } catch (error: any) {
    console.error('--- APPLICATION PROCESS FAILED ---', error);
    toast({
      title: "Application Failed",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setApplying(false);
  }
};

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
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
              <div className="animate-pulse absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-primary/40 mx-auto"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Jobs</h2>
            <p className="text-muted-foreground">Discovering the best opportunities for you...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Available Jobs
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Discover your next career opportunity</p>
              <div className="flex items-center mt-3 text-sm text-gray-500">
                <Building2 className="w-4 h-4 mr-1" />
                {filteredJobs.length} {filteredJobs.length === 1 ? 'position' : 'positions'} available
              </div>
            </div>
            <div className="flex items-center space-x-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title, company, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full lg:w-80 h-11 border-gray-200 focus:border-primary focus:ring-primary"
                />
              </div>
              <Button variant="outline" size="lg" className="h-11 px-6">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="max-w-6xl mx-auto p-6">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No jobs found</h3>
            <p className="text-gray-600 text-lg mb-6">
              {searchTerm ? 'Try adjusting your search terms or browse all positions' : 'No jobs are currently published'}
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                View All Jobs
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="group hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-md hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                        {job.title}
                      </CardTitle>
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center mr-3">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{job.companies?.name || 'Company'}</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {job.location}
                          {job.remote_allowed && (
                            <Badge variant="secondary" className="ml-3 text-xs bg-green-100 text-green-700 hover:bg-green-100">
                              🏠 Remote OK
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                    {/* Salary with enhanced styling */}
                    <div className="flex items-center text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-lg">
                      <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                      {formatSalary(job.salary_min, job.salary_max, job.currency || 'IDR')}
                    </div>

                    {/* Employment Type & Experience with better badges */}
                    <div className="flex items-center gap-2 text-sm">
                      {job.employment_type && (
                        <Badge variant="outline" className="capitalize bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                          {job.employment_type.replace('_', ' ')}
                        </Badge>
                      )}
                      {job.experience_level && (
                        <Badge variant="outline" className="capitalize bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50">
                          {job.experience_level} Level
                        </Badge>
                      )}
                    </div>

                    {/* Posted Date with enhanced styling */}
                    <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                      <Clock className="w-3 h-3 mr-2" />
                      Posted {new Date(job.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>

                    {/* Skills with improved styling */}
                    {job.skills_required && job.skills_required.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Required Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {job.skills_required.slice(0, 3).map((skill: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                              {skill}
                            </Badge>
                          ))}
                          {job.skills_required.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-100">
                              +{job.skills_required.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description Preview with better typography */}
                    {job.description && (
                      <div className="text-sm text-gray-600 leading-relaxed border-l-2 border-gray-100 pl-4">
                        <MarkdownPreview content={job.description} truncate={120} />
                      </div>
                    )}

                    {/* Action Buttons with enhanced styling */}
                    <div className="pt-4 flex gap-3">
                      <Button 
                        onClick={() => handleApply(job.id)} 
                        className="flex-1 h-11 font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200"
                        disabled={!profile?.id || applying}
                      >
                        {applying ? 'Applying...' : 'Apply Now'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                        className="h-11 px-4 border-gray-200 hover:border-primary hover:text-primary"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>

                    {!profile?.id && (
                      <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-700 font-medium">
                          Please log in to apply for jobs
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;