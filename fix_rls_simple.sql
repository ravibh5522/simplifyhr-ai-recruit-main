-- Simple RLS fix for offer_workflow table
-- Run this directly in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Companies can manage offer workflows" ON public.offer_workflow;
DROP POLICY IF EXISTS "Candidates can view their offer workflows" ON public.offer_workflow;

-- Create a simple policy that allows authenticated users to manage workflows for their own jobs
CREATE POLICY "Users can manage workflows for their jobs" ON public.offer_workflow
FOR ALL 
USING (
  -- Allow if user created the workflow
  created_by = auth.uid()
  OR
  -- Allow if user owns the job that this workflow is for
  EXISTS (
    SELECT 1 
    FROM public.job_applications ja
    JOIN public.jobs j ON j.id = ja.job_id
    WHERE ja.id = offer_workflow.job_application_id 
    AND j.created_by = auth.uid()
  )
);

-- Create policy for candidates to view their workflows
CREATE POLICY "Candidates can view their workflows" ON public.offer_workflow
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.job_applications ja
    JOIN public.candidates c ON c.id = ja.candidate_id
    WHERE ja.id = offer_workflow.job_application_id 
    AND c.profile_id = auth.uid()
  )
);
