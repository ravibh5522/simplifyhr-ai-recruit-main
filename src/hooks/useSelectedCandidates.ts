import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SelectedCandidate, CandidateWorkflowStatus } from '@/types/candidates';

export const useSelectedCandidates = () => {
  const [candidates, setCandidates] = useState<SelectedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiatingWorkflow, setInitiatingWorkflow] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSelectedCandidates = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          candidates (
            first_name,
            last_name, 
            email,
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
        .eq('jobs.created_by', (await supabase.auth.getUser()).data.user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setCandidates((data || []) as any);
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
  }, [toast]);

  const initiateOfferWorkflow = useCallback(async (applicationId: string) => {
    setInitiatingWorkflow(applicationId);
    try {
      const { data, error } = await supabase
        .from('offer_workflow')
        .insert({
          application_id: applicationId,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          current_step: 1,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Offer workflow initiated",
        description: "Background check process has started",
      });

      await fetchSelectedCandidates();
    } catch (error) {
      console.error('Error initiating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to initiate offer workflow",
        variant: "destructive",
      });
    } finally {
      setInitiatingWorkflow(null);
    }
  }, [fetchSelectedCandidates, toast]);

  const getWorkflowStatus = useCallback((candidate: SelectedCandidate): CandidateWorkflowStatus => {
    if (!candidate.offer_workflow || candidate.offer_workflow.length === 0) {
      return { status: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' };
    }

    const workflow = candidate.offer_workflow[0];
    switch (workflow.status) {
      case 'pending':
        return { status: 'in_progress', label: `Step ${workflow.current_step}/5`, color: 'bg-blue-100 text-blue-800' };
      case 'completed':
        return { status: 'completed', label: 'Offer Accepted', color: 'bg-green-100 text-green-800' };
      case 'rejected':
        return { status: 'rejected', label: 'Offer Rejected', color: 'bg-red-100 text-red-800' };
      default:
        return { status: 'pending', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' };
    }
  }, []);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  useEffect(() => {
    fetchSelectedCandidates();
  }, [fetchSelectedCandidates]);

  return {
    candidates,
    loading,
    initiatingWorkflow,
    fetchSelectedCandidates,
    initiateOfferWorkflow,
    getWorkflowStatus,
    getScoreColor
  };
};