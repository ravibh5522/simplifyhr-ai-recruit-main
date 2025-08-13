import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, FileText, Mail, UserCheck, AlertCircle, Eye, Download, Upload, Send } from 'lucide-react';
import OfferLetterApiService, { formatCandidateDataForOffer, generateOfferEmailContent } from '@/services/offerLetterApi';

interface OfferWorkflow {
  id: string;
  job_application_id: string;
  current_step: string; // enum: background_check, generate_offer, hr_approval, send_offer, track_response
  status: string; // enum: pending, in_progress, completed, cancelled
  background_check_status?: string;
  hr_approval_status?: string;
  candidate_response?: string;
  offer_details?: any;
  created_at: string;
  updated_at: string;
  job_applications?: {
    id: string;
    candidates?: {
      profile_id: string;
      profiles?: {
        first_name: string;
        last_name: string;
        email: string;
      };
    };
    jobs?: {
      title: string;
      salary_min?: number;
      salary_max?: number;
      currency?: string;
      location?: string;
    };
  };
}

const WORKFLOW_STEPS = [
  { id: 'background_check', name: 'Background Check', icon: UserCheck, step: 1 },
  { id: 'generate_offer', name: 'Generate Offer', icon: FileText, step: 2 },
  { id: 'hr_approval', name: 'HR Approval', icon: CheckCircle, step: 3 },
  { id: 'send_offer', name: 'Send to Candidate', icon: Mail, step: 4 },
  { id: 'track_response', name: 'Track Response', icon: Clock, step: 5 },
];

export function OfferWorkflowManager() {
  const [workflows, setWorkflows] = useState<OfferWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<OfferWorkflow | null>(null);
  const [hrComments, setHrComments] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [generatedOfferUrl, setGeneratedOfferUrl] = useState<string | null>(null);
  const [emailRequestId, setEmailRequestId] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<any>(null);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const offerApiService = new OfferLetterApiService();
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('offer_workflow')
        .select(`
          *,
          job_applications!inner (
            id,
            job_id,
            candidate_id,
            jobs (title, salary_min, salary_max, currency, location),
            candidates!inner (
              profile_id,
              profiles!inner (first_name, last_name, email)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setWorkflows(data as any || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast({
        title: "Error",
        description: "Failed to fetch offer workflows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const advanceWorkflow = async (workflowId: string, stepData: any = {}) => {
    setActionLoading(workflowId);
    try {
      // Get current workflow to determine next step
      const { data: currentWorkflow, error: fetchError } = await supabase
        .from('offer_workflow')
        .select('current_step')
        .eq('id', workflowId)
        .single();

      if (fetchError) throw fetchError;

      // Determine next step
      const currentStepObj = WORKFLOW_STEPS.find(s => s.id === String(currentWorkflow.current_step));
      const currentStepNumber = currentStepObj ? currentStepObj.step : 1;
      const nextStep = WORKFLOW_STEPS.find(s => s.step === currentStepNumber + 1);

      const updateData = {
        ...stepData,
        updated_at: new Date().toISOString()
      };

      // If there's a next step, update current_step
      if (nextStep) {
        updateData.current_step = nextStep.id;
      }

      // Update the workflow
      const { error } = await supabase
        .from('offer_workflow')
        .update(updateData)
        .eq('id', workflowId);

      if (error) throw error;

      await fetchWorkflows();
      toast({
        title: "Success",
        description: "Workflow step completed successfully",
      });
    } catch (error) {
      console.error('Error advancing workflow:', error);
      toast({
        title: "Error",
        description: "Failed to advance workflow step",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const runBackgroundCheck = async (workflow: OfferWorkflow) => {
    try {
      const candidate = workflow.job_applications?.candidates?.profiles;
      if (!candidate) throw new Error('Candidate not found');

      const { data, error } = await supabase.functions.invoke('background-check', {
        body: {
          candidateId: workflow.job_application_id,
          firstName: candidate.first_name,
          lastName: candidate.last_name,
          email: candidate.email
        }
      });

      if (error) throw error;

      await advanceWorkflow(workflow.id, {
        background_check_status: 'completed',
        background_check_result: data.result,
        background_check_completed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error running background check:', error);
      toast({
        title: "Error",
        description: "Failed to run background check",
        variant: "destructive",
      });
    }
  };

  const generateOffer = async (workflow: OfferWorkflow) => {
    if (!templateFile) {
      toast({
        title: "Template Required",
        description: "Please upload a template file first.",
        variant: "destructive"
      });
      setShowOfferDialog(true);
      return;
    }

    setActionLoading(workflow.id);
    
    try {
      // Get candidate and job data
      const candidate = workflow.job_applications?.candidates?.profiles;
      const job = workflow.job_applications?.jobs;

      if (!candidate || !job) {
        throw new Error('Missing candidate or job data');
      }

      // Prepare candidate data for offer generation
      const candidateData = formatCandidateDataForOffer(candidate, job);

      // Add custom offer amount if provided
      if (offerAmount) {
        candidateData.salary = offerAmount;
      }

      // Generate offer letter using API
      const response = await offerApiService.generateOfferLetter({
        template_file: templateFile,
        data: candidateData,
        output_format: 'both'
      });

      if (response.success) {
        // Store the generated files URLs
        setGeneratedOfferUrl(response.files?.pdf || null);
        
        // Update workflow in database
        await advanceWorkflow(workflow.id, {
          generated_offer_content: JSON.stringify(candidateData),
          offer_details: {
            position: job.title,
            salary: candidateData.salary,
            pdf_file_id: response.files?.pdf,
            docx_file_id: response.files?.docx,
            request_id: response.request_id
          },
          offer_generated_at: new Date().toISOString()
        });

        toast({
          title: "Offer Generated",
          description: "Offer letter has been generated successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to generate offer');
      }
    } catch (error) {
      console.error('Error generating offer:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate offer letter.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const approveOffer = async (workflow: OfferWorkflow) => {
    await advanceWorkflow(workflow.id, {
      hr_comments: hrComments
    });
  };

  const sendToCandidate = async (workflow: OfferWorkflow) => {
    if (!generatedOfferUrl && !workflow.offer_details?.pdf_file_id) {
      toast({
        title: "No Offer Letter",
        description: "Please generate an offer letter first.",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(workflow.id);
    
    try {
      const candidate = workflow.job_applications?.candidates?.profiles;
      const job = workflow.job_applications?.jobs;

      if (!candidate || !job) {
        throw new Error('Missing candidate or job data');
      }

      // Get the PDF file for sending
      let pdfBlob: Blob;
      
      if (workflow.offer_details?.pdf_file_id) {
        // Download from API service
        pdfBlob = await offerApiService.downloadFile(workflow.offer_details.pdf_file_id);
      } else if (generatedOfferUrl) {
        // Fetch from URL
        const response = await fetch(generatedOfferUrl);
        pdfBlob = await response.blob();
      } else {
        throw new Error('No offer letter available');
      }

      // Convert blob to file
      const pdfFile = new File([pdfBlob], `offer_letter_${candidate.first_name}_${candidate.last_name}.pdf`, {
        type: 'application/pdf'
      });

      // Generate email content
      const emailContent = generateOfferEmailContent(
        `${candidate.first_name} ${candidate.last_name}`,
        job.title || 'the position'
      );

      // Send via API
      const response = await offerApiService.sendOfferLetter({
        pdf_file: pdfFile,
        email_data: {
          emails: [candidate.email || ''],
          subject: `Job Offer - ${job.title}`,
          html_content: emailContent
        }
      });

      // Store request ID for status tracking
      setEmailRequestId(response.request_id);
      
      // Update workflow
      await advanceWorkflow(workflow.id, {
        offer_letter_url: workflow.offer_details?.pdf_file_id || generatedOfferUrl,
        email_request_id: response.request_id,
        sent_to_candidate_at: new Date().toISOString(),
        candidate_notification_sent: true
      });

      toast({
        title: "Offer Sent",
        description: "Offer letter has been sent to the candidate.",
      });

      // Show email tracking dialog
      setShowEmailDialog(true);
      
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Send Failed",
        description: error instanceof Error ? error.message : "Failed to send offer to candidate",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const checkEmailStatus = async (requestId: string) => {
    try {
      const status = await offerApiService.getEmailStatus(requestId);
      setEmailStatus(status);
      return status;
    } catch (error) {
      console.error('Error checking email status:', error);
      toast({
        title: "Status Check Failed",
        description: "Could not check email delivery status",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          file.name.endsWith('.docx')) {
        setTemplateFile(file);
        toast({
          title: "Template Uploaded",
          description: `Template "${file.name}" has been uploaded successfully.`,
        });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a .docx file",
          variant: "destructive"
        });
      }
    }
  };

  const downloadGeneratedOffer = async (fileId: string) => {
    try {
      const blob = await offerApiService.downloadFile(fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `offer_letter_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: "Could not download the file",
        variant: "destructive"
      });
    }
  };

  const getStepAction = (workflow: OfferWorkflow) => {
    const step = workflow.current_step;
    const isLoading = actionLoading === workflow.id;
    const candidate = workflow.job_applications?.candidates?.profiles;

    switch (step) {
      case 'background_check':
        return (
          <Button 
            onClick={() => runBackgroundCheck(workflow)}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Running...' : 'Run Background Check'}
          </Button>
        );
      case 'generate_offer':
        return (
          <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => {
                setSelectedWorkflow(workflow);
                setShowOfferDialog(true);
              }}>
                Generate Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Generate Offer</DialogTitle>
                <DialogDescription>
                  Create offer letter for {candidate?.first_name} {candidate?.last_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-upload">Upload Template (DOCX)</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      ref={fileInputRef}
                      id="template-upload"
                      type="file"
                      accept=".docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{templateFile ? templateFile.name : 'Select Template'}</span>
                    </Button>
                  </div>
                  {templateFile && (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ Template uploaded: {templateFile.name}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="amount">Offer Amount ($)</Label>
                  <Input
                    id="amount"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="75000"
                  />
                </div>
                {workflow.offer_details?.pdf_file_id && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadGeneratedOffer(workflow.offer_details.pdf_file_id)}
                      className="flex items-center space-x-1"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </Button>
                    {workflow.offer_details?.docx_file_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadGeneratedOffer(workflow.offer_details.docx_file_id)}
                        className="flex items-center space-x-1"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download DOCX</span>
                      </Button>
                    )}
                  </div>
                )}
                <Button 
                  onClick={() => {
                    generateOffer(workflow);
                    setShowOfferDialog(false);
                  }}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Generating...' : 'Generate Offer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      case 'hr_approval':
        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setSelectedWorkflow(workflow)}>
                Review & Approve
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>HR Approval</DialogTitle>
                <DialogDescription>
                  Review and approve offer for {candidate?.first_name} {candidate?.last_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="comments">HR Comments</Label>
                  <Textarea
                    id="comments"
                    value={hrComments}
                    onChange={(e) => setHrComments(e.target.value)}
                    placeholder="Add any comments or notes..."
                  />
                </div>
                <Button 
                  onClick={() => approveOffer(workflow)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Approving...' : 'Approve Offer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      case 'send_offer':
        return (
          <Button 
            onClick={() => sendToCandidate(workflow)}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Sending...' : 'Send to Candidate'}
          </Button>
        );
      case 'track_response':
        return (
          <Badge variant="secondary">
            {workflow.candidate_response || 'Awaiting Response'}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">Unknown Step</Badge>
        );
    }
  };

  const getStepIndex = (step: string) => {
    const stepObj = WORKFLOW_STEPS.find(s => s.id === step);
    return stepObj ? stepObj.step : 1;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'negotiating': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) {
    return <div className="p-6">Loading offer workflows...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Offer Management Workflow</h2>
      </div>

      <div className="grid gap-6">
        {workflows.map((workflow) => {
          const candidate = workflow.job_applications?.candidates?.profiles;
          const job = workflow.job_applications?.jobs;
          
          return (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {job?.title} - {candidate?.first_name} {candidate?.last_name}
                    </CardTitle>
                    <CardDescription>
                      Started {new Date(workflow.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(workflow.status)}>
                    {workflow.status}
                  </Badge>
                </div>
              </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>Step {getStepIndex(workflow.current_step)} of 5</span>
                  </div>
                  <Progress value={(getStepIndex(workflow.current_step) / 5) * 100} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-4">
                    {WORKFLOW_STEPS.map((step) => {
                      const Icon = step.icon;
                      const currentStepIndex = getStepIndex(workflow.current_step);
                      const stepIndex = step.step;
                      const isCompleted = stepIndex < currentStepIndex;
                      const isCurrent = stepIndex === currentStepIndex;
                      
                      return (
                        <div key={step.id} className="flex items-center space-x-2">
                          <div className={`p-2 rounded-full ${
                            isCompleted ? 'bg-green-100 text-green-600' :
                            isCurrent ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-sm ${
                            isCompleted ? 'text-green-600' :
                            isCurrent ? 'text-blue-600' :
                            'text-gray-400'
                          }`}>
                            {step.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="ml-4">
                    {workflow.status !== 'completed' && workflow.status !== 'rejected' && (
                      getStepAction(workflow)
                    )}
                  </div>
                </div>

                {workflow.status === 'completed' && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Offer accepted by candidate</span>
                  </div>
                )}

                {workflow.status === 'rejected' && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Offer rejected by candidate</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          );
        })}

        {workflows.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No offer workflows found</p>
                <p className="text-sm">Workflows will appear here when candidates are selected for offers</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Email Status Tracking Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Delivery Status</DialogTitle>
            <DialogDescription>
              Track the delivery status of your offer letter email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {emailRequestId && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Request ID:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{emailRequestId}</code>
                </div>
                
                {emailStatus && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <Badge variant={
                        emailStatus.status === 'completed' ? 'default' : 
                        emailStatus.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {emailStatus.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{emailStatus.progress_percentage}%</span>
                      </div>
                      <Progress value={emailStatus.progress_percentage} className="w-full" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-green-600">{emailStatus.sent_count}</div>
                        <div className="text-muted-foreground">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-yellow-600">{emailStatus.pending_count}</div>
                        <div className="text-muted-foreground">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">{emailStatus.failed_count}</div>
                        <div className="text-muted-foreground">Failed</div>
                      </div>
                    </div>
                    
                    {emailStatus.errors && emailStatus.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Errors:</h4>
                        <ScrollArea className="h-20">
                          <div className="space-y-1">
                            {emailStatus.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                {error}
                              </p>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </>
                )}
                
                <Button 
                  onClick={() => emailRequestId && checkEmailStatus(emailRequestId)}
                  variant="outline"
                  className="w-full"
                >
                  Refresh Status
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}