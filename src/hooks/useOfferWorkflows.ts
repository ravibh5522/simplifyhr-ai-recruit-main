import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { OfferWorkflow, WorkflowStepData } from '@/types/workflows';

export const useOfferWorkflows = () => {
  const [workflows, setWorkflows] = useState<OfferWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('offer_workflow')
        .select(`
          *,
          job_applications!inner (
            id,
            jobs (title),
            candidates (first_name, last_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map(workflow => ({
        ...workflow,
        jobs: workflow.job_applications?.jobs,
        candidates: workflow.job_applications?.candidates
      }));
      
      setWorkflows(transformedData as any);
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
  }, [toast]);

  const advanceWorkflow = useCallback(async (workflowId: string, stepData: any = {}) => {
    setActionLoading(workflowId);
    try {
      const { data, error } = await supabase.rpc('advance_offer_workflow_step', {
        workflow_id: workflowId,
        step_data: stepData
      });

      if (error) throw error;

      const result = data as { success: boolean; message?: string };
      if (result.success) {
        await fetchWorkflows();
        toast({
          title: "Success",
          description: "Workflow step completed successfully",
        });
      } else {
        throw new Error(result.message || 'Unknown error');
      }
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
  }, [fetchWorkflows, toast]);

  const runBackgroundCheck = useCallback(async (workflow: OfferWorkflow) => {
    try {
      const candidate = workflow.candidates;
      if (!candidate) throw new Error('Candidate not found');

      const { data, error } = await supabase.functions.invoke('background-check', {
        body: {
          candidateId: workflow.application_id,
          firstName: candidate.first_name,
          lastName: candidate.last_name,
          email: candidate.email
        }
      });

      if (error) throw error;

      await advanceWorkflow(workflow.id, {
        background_check_status: data.status,
        background_check_result: data.result
      });
    } catch (error) {
      console.error('Error running background check:', error);
      toast({
        title: "Error",
        description: "Failed to run background check",
        variant: "destructive",
      });
    }
  }, [advanceWorkflow, toast]);

  const generateOffer = useCallback(async (workflow: OfferWorkflow, offerAmount: string) => {
    const offerContent = `
      <h2>Job Offer - ${workflow.jobs?.title}</h2>
      <p>Dear ${workflow.candidates?.first_name} ${workflow.candidates?.last_name},</p>
      <p>We are pleased to offer you the position of ${workflow.jobs?.title}.</p>
      <p>Salary: $${offerAmount || '75,000'}</p>
      <p>Please review and respond within 5 business days.</p>
    `;

    await advanceWorkflow(workflow.id, {
      generated_offer_content: offerContent,
      offer_details: {
        position: workflow.jobs?.title,
        salary: offerAmount || '75000'
      }
    });
  }, [advanceWorkflow]);

  const approveOffer = useCallback(async (workflow: OfferWorkflow, hrComments: string) => {
    await advanceWorkflow(workflow.id, {
      hr_comments: hrComments
    });
  }, [advanceWorkflow]);

  const sendToCandidate = useCallback(async (workflow: OfferWorkflow) => {
    try {
      const { error } = await supabase.functions.invoke('send-offer-email', {
        body: {
          to: workflow.candidates?.email,
          subject: `Job Offer - ${workflow.jobs?.title}`,
          html: `
            <h2>Job Offer</h2>
            <p>Dear ${workflow.candidates?.first_name},</p>
            <p>We are pleased to offer you the position of ${workflow.jobs?.title}.</p>
            <p>Please review the attached offer letter and respond within 5 business days.</p>
          `,
          type: 'offer_sent'
        }
      });

      if (error) throw error;

      await advanceWorkflow(workflow.id, {
        offer_letter_url: 'dummy-offer-letter-url.pdf'
      });
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer to candidate",
        variant: "destructive",
      });
    }
  }, [advanceWorkflow, toast]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'negotiating': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows,
    loading,
    actionLoading,
    fetchWorkflows,
    runBackgroundCheck,
    generateOffer,
    approveOffer,
    sendToCandidate,
    getStatusColor
  };
};