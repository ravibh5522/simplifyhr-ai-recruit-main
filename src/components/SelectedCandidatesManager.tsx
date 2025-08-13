import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, AlertCircle, FileText, Star, MapPin, DollarSign, Calendar, TestTube, Bug, Zap } from 'lucide-react';
import { createTestData, checkTestData } from '@/utils/createTestData';
import debugDatabase from '@/utils/debugDatabase';
import { testDatabaseFunctions, createWorkflowsForAllSelected, testWorkflowCreation } from '@/utils/testDatabaseFunctions';

interface SelectedCandidate {
  id: string;
  status: string;
  screening_score: number; // Changed from ai_screening_score
  candidates: {
    profile_id: string;
    profiles: {
      first_name: string;
      last_name: string;
      email: string;
    };
    experience_years?: number;
    expected_salary?: number;
    current_location?: string;
    skills?: string[];
  };
  jobs: {
    title: string;
    location: string;
    salary_min: number;
    salary_max: number;
    currency: string;
  };
  offer_workflow?: {
    id: string;
    status: string;
    current_step: string;
  }[];
}

export function SelectedCandidatesManager() {
  const [selectedCandidates, setSelectedCandidates] = useState<SelectedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiatingWorkflow, setInitiatingWorkflow] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSelectedCandidates();
  }, []);

  const fetchSelectedCandidates = async () => {
    try {
      // Get current user first
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        console.error('User not authenticated');
        return;
      }
      
      console.log('Fetching selected candidates for user:', currentUser.data.user.id);

      // Get job applications with status 'selected' for jobs created by current user
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          candidates!inner (
            profile_id,
            profiles!inner (
              first_name,
              last_name, 
              email
            ),
            experience_years,
            expected_salary,
            current_location,
            skills
          ),
          jobs!inner (
            title,
            location,
            salary_min,
            salary_max,
            currency,
            created_by
          ),
          offer_workflow (
            id,
            status,
            current_step
          )
        `)
        .eq('status', 'selected')
        .eq('jobs.created_by', currentUser.data.user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Database query error:', error);
        throw error;
      }
      
      console.log('Fetched data:', data);
      console.log('Number of selected candidates:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('Sample candidate data:', data[0]);
      }
      
      setSelectedCandidates((data || []) as any);
    } catch (error) {
      console.error('Error fetching selected candidates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch selected candidates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateOfferWorkflow = async (applicationId: string) => {
    setInitiatingWorkflow(applicationId);
    try {
      console.log('Starting offer workflow for application:', applicationId);
      
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        throw new Error('User not authenticated');
      }
      
      console.log('Current user ID:', currentUser.data.user.id);

      // First, try to use the database function for workflow creation
      console.log('Attempting to create workflow using database function...');
      const dbFunctionResult = await testWorkflowCreation(applicationId);
      
      if (dbFunctionResult) {
        console.log('✅ Workflow created via database function:', dbFunctionResult);
        toast({
          title: "Offer workflow initiated",
          description: "Background check process has started (via DB function)",
        });
        await fetchSelectedCandidates();
        return;
      }

      // Fallback to manual creation if database function fails
      console.log('Database function failed, falling back to manual creation...');

      // First, get the job application to retrieve company_id
      const { data: applicationData, error: appError } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs!inner (
            company_id,
            created_by
          )
        `)
        .eq('id', applicationId)
        .single();

      if (appError) {
        console.error('Failed to get application data:', appError);
        throw appError;
      }

      console.log('Application data:', applicationData);

      // Check if current user owns this job
      if (applicationData.jobs.created_by !== currentUser.data.user.id) {
        throw new Error('You can only create workflows for your own jobs');
      }

      const { data, error } = await supabase
        .from('offer_workflow')
        .insert({
          job_application_id: applicationId,
          created_by: currentUser.data.user.id,
          current_step: 'background_check' as any,
          status: 'pending'
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Manual workflow created successfully:', data);

      toast({
        title: "Offer workflow initiated",
        description: "Background check process has started (manual creation)",
      });

      await fetchSelectedCandidates();
    } catch (error) {
      console.error('Error initiating workflow:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate offer workflow",
        variant: "destructive",
      });
    } finally {
      setInitiatingWorkflow(null);
    }
  };

  const handleCreateTestData = async () => {
    setLoading(true);
    try {
      const result = await createTestData();
      if (result) {
        toast({
          title: "Test data created!",
          description: "Test candidate and job data has been created successfully.",
        });
        await fetchSelectedCandidates();
      } else {
        toast({
          title: "Failed to create test data",
          description: "Please check the console for error details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Test data creation error:', error);
      toast({
        title: "Error creating test data",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckTestData = async () => {
    try {
      const hasData = await checkTestData();
      toast({
        title: hasData ? "Test data found!" : "No test data found",
        description: hasData ? "Check console for details" : "You may need to create test data first.",
      });
    } catch (error) {
      console.error('Test data check error:', error);
      toast({
        title: "Error checking test data",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDebugDatabase = async () => {
    console.log('🔍 Starting comprehensive database debug...');
    await debugDatabase();
  };

  const handleTestDatabaseFunctions = async () => {
    console.log('🧪 Testing database functions...');
    const result = await testDatabaseFunctions();
    if (result) {
      toast({
        title: "Database functions tested",
        description: "Check console for detailed results",
      });
    } else {
      toast({
        title: "Database function test failed",
        description: "Some functions may be missing. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAllWorkflows = async () => {
    console.log('🚀 Creating workflows for all selected candidates...');
    const results = await createWorkflowsForAllSelected();
    if (results) {
      toast({
        title: "Batch workflow creation completed",
        description: `Processed ${Array.isArray(results) ? results.length : 0} candidates. Check console for details.`,
      });
      await fetchSelectedCandidates(); // Refresh the list
    } else {
      toast({
        title: "Batch workflow creation failed",
        description: "Check console for error details.",
        variant: "destructive",
      });
    }
  };

  const getWorkflowStatus = (candidate: SelectedCandidate) => {
    // Check if offer_workflow exists and has items
    if (!candidate.offer_workflow || !Array.isArray(candidate.offer_workflow) || candidate.offer_workflow.length === 0) {
      return { status: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' };
    }

    const workflow = candidate.offer_workflow[0];
    
    // Check if workflow object exists and has the required properties
    if (!workflow || typeof workflow !== 'object') {
      return { status: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' };
    }

    // Safe access to workflow status
    const workflowStatus = workflow.status || 'pending';
    
    switch (workflowStatus) {
      case 'pending':
        const currentStep = workflow.current_step || 'background_check';
        return { status: 'in_progress', label: `${currentStep.replace('_', ' ')}`, color: 'bg-blue-100 text-blue-800' };
      case 'completed':
        return { status: 'completed', label: 'Offer Accepted', color: 'bg-green-100 text-green-800' };
      case 'rejected':
        return { status: 'rejected', label: 'Offer Rejected', color: 'bg-red-100 text-red-800' };
      default:
        return { status: 'pending', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Selected Candidates</h2>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-48"></div>
                <div className="h-4 bg-muted rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Selected Candidates</h2>
          <p className="text-muted-foreground">Candidates ready for offer workflow</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleTestDatabaseFunctions}>
            <Zap className="h-4 w-4 mr-2" />
            Test DB Functions
          </Button>
          <Button variant="outline" size="sm" onClick={handleCreateAllWorkflows}>
            <Zap className="h-4 w-4 mr-2" />
            Create All Workflows
          </Button>
          <Button variant="outline" size="sm" onClick={handleDebugDatabase}>
            <Bug className="h-4 w-4 mr-2" />
            Debug DB
          </Button>
          <Button variant="outline" size="sm" onClick={handleCheckTestData}>
            <TestTube className="h-4 w-4 mr-2" />
            Check Test Data
          </Button>
          <Button variant="outline" size="sm" onClick={handleCreateTestData}>
            <TestTube className="h-4 w-4 mr-2" />
            Create Test Data
          </Button>
          <Button variant="outline" onClick={fetchSelectedCandidates}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {selectedCandidates.map((candidate) => {
          // Add error handling for workflow status
          let workflowStatus;
          let hasActiveWorkflow;
          
          try {
            workflowStatus = getWorkflowStatus(candidate);
            hasActiveWorkflow = candidate.offer_workflow && 
                               Array.isArray(candidate.offer_workflow) && 
                               candidate.offer_workflow.length > 0;
          } catch (error) {
            console.error('Error getting workflow status for candidate:', candidate.id, error);
            workflowStatus = { status: 'error', label: 'Error', color: 'bg-red-100 text-red-800' };
            hasActiveWorkflow = false;
          }

          return (
            <Card key={candidate.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {candidate.candidates.profiles.first_name[0]}{candidate.candidates.profiles.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {candidate.candidates.profiles.first_name} {candidate.candidates.profiles.last_name}
                      </CardTitle>
                      <CardDescription>
                        Applied for {candidate.jobs.title}
                      </CardDescription>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{candidate.candidates.current_location || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{candidate.candidates.experience_years || 0}y exp</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3" />
                          <span>{candidate.candidates.expected_salary?.toLocaleString() || 'Not specified'} {candidate.jobs.currency}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className={`font-medium ${getScoreColor(candidate.screening_score || 0)}`}>
                        {candidate.screening_score || 0}/100
                      </span>
                    </div>
                    <Badge className={workflowStatus.color}>
                      {workflowStatus.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Skills */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {candidate.candidates.skills?.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.candidates.skills?.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{candidate.candidates.skills.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Job Match */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium">{candidate.jobs.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {candidate.jobs.salary_min?.toLocaleString()} - {candidate.jobs.salary_max?.toLocaleString()} {candidate.jobs.currency}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Job Location</div>
                        <div className="text-sm font-medium">{candidate.jobs.location}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center space-x-2">
                      {hasActiveWorkflow ? (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4" />
                          <span>Workflow in progress</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Ready for offer workflow</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {!hasActiveWorkflow ? (
                        <Button 
                          onClick={() => initiateOfferWorkflow(candidate.id)}
                          disabled={initiatingWorkflow === candidate.id}
                          size="sm"
                        >
                          {initiatingWorkflow === candidate.id ? (
                            'Starting...'
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-2" />
                              Start Offer Process
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          View Workflow
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {selectedCandidates.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No selected candidates yet</p>
                <p className="text-sm">Candidates will appear here when their application status is set to "selected"</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}