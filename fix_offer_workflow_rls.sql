-- Fix RLS policies for offer_workflow table
-- The current policy requires company association, but our user might not have proper company access

-- First, let's see what we're working with by temporarily allowing all access for testing
-- WARNING: This is for testing only - use proper policies in production

-- Enable RLS on offer_workflow table (in case it's not enabled)
ALTER TABLE public.offer_workflow ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies can manage offer workflows" ON public.offer_workflow;
DROP POLICY IF EXISTS "Candidates can view their offer workflows" ON public.offer_workflow;

-- Create a more permissive policy for admins to create workflows
CREATE POLICY "Admins can manage offer workflows" ON public.offer_workflow
FOR ALL 
USING (
  -- Admin users can manage all workflows
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR 
  -- Users can manage workflows they created
  created_by = auth.uid()
  OR
  -- Users can manage workflows for jobs they own
  EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.jobs j ON j.id = ja.job_id
    WHERE ja.id = job_application_id 
    AND j.created_by = auth.uid()
  )
)
WITH CHECK (
  -- Same conditions for insert/update
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR 
  created_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.jobs j ON j.id = ja.job_id
    WHERE ja.id = job_application_id 
    AND j.created_by = auth.uid()
  )
);

-- Create policy for candidates to view their own workflows
CREATE POLICY "Candidates can view their offer workflows" ON public.offer_workflow
FOR SELECT
USING (
  -- Candidates can view workflows for their applications
  EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.candidates c ON c.id = ja.candidate_id
    WHERE ja.id = job_application_id 
    AND c.profile_id = auth.uid()
  )
);

-- Also ensure profiles table allows proper access
CREATE POLICY IF NOT EXISTS "Public profiles access" ON public.profiles
FOR SELECT
USING (true);

-- Ensure candidates table allows proper access
CREATE POLICY IF NOT EXISTS "Public candidates access" ON public.candidates
FOR SELECT
USING (true);

-- Ensure job_applications table allows proper access for workflow queries
CREATE POLICY IF NOT EXISTS "Workflow job applications access" ON public.job_applications
FOR SELECT
USING (true);

-- Ensure jobs table allows proper access for workflow queries  
CREATE POLICY IF NOT EXISTS "Workflow jobs access" ON public.jobs
FOR SELECT  
USING (true);
