// Test utilities for the offer workflow system
import { supabase } from '@/integrations/supabase/client';

export interface TestCandidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface TestJob {
  id: string;
  title: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  location: string;
}

export const createTestApplication = async (candidateId: string, jobId: string) => {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        candidate_id: candidateId,
        job_id: jobId,
        status: 'selected',
        applied_at: new Date().toISOString(),
        selection_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating test application:', error);
    throw error;
  }
};

export const verifyOfferWorkflowCreation = async (applicationId: string) => {
  try {
    const { data, error } = await supabase
      .from('offer_workflow')
      .select(`
        *,
        job_applications!inner(
          id,
          candidates(first_name, last_name, email),
          jobs(title, salary_min, salary_max, currency, location)
        )
      `)
      .eq('application_id', applicationId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error verifying workflow creation:', error);
    throw error;
  }
};

export const testOfferWorkflowSystem = async () => {
  console.log('🧪 Testing Offer Workflow System...');
  
  try {
    // 1. Check if we have any selected candidates
    const { data: applications, error: appError } = await supabase
      .from('job_applications')
      .select(`
        id,
        candidates(first_name, last_name, email),
        jobs(title, salary_min, salary_max, currency, location)
      `)
      .eq('status', 'selected')
      .limit(1);

    if (appError) throw appError;
    
    if (!applications || applications.length === 0) {
      console.log('❌ No selected candidates found. The workflow system needs candidates with status "selected".');
      return false;
    }

    console.log('✅ Found selected candidates:', applications.length);

    // 2. Check if offer workflows can be created
    const testApp = applications[0];
    
    // Check if workflow already exists for this application
    const { data: existingWorkflow } = await supabase
      .from('offer_workflow')
      .select('id')
      .eq('application_id', testApp.id)
      .single();

    if (!existingWorkflow) {
      console.log('🔧 Creating test workflow...');
      
      const currentUser = await supabase.auth.getUser();
      const { data: newWorkflow, error: workflowError } = await supabase
        .from('offer_workflow')
        .insert({
          application_id: testApp.id,
          created_by: currentUser.data.user?.id,
          current_step: 1,
          status: 'pending'
        })
        .select()
        .single();

      if (workflowError) throw workflowError;
      console.log('✅ Test workflow created successfully');
    } else {
      console.log('✅ Workflow already exists for test candidate');
    }

    // 3. Test workflow data fetching
    console.log('🔍 Testing workflow data fetching...');
    const { data: workflows, error: fetchError } = await supabase
      .from('offer_workflow')
      .select(`
        *,
        job_applications!inner(
          id,
          candidates(first_name, last_name, email),
          jobs(title, salary_min, salary_max, currency, location)
        )
      `)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;
    
    console.log('✅ Workflow data fetching successful. Found workflows:', workflows.length);
    
    // 4. Validate data structure
    if (workflows.length > 0) {
      const workflow = workflows[0];
      const hasCandidate = workflow.job_applications?.candidates;
      const hasJob = workflow.job_applications?.jobs;
      
      if (hasCandidate && hasJob) {
        console.log('✅ Data structure is correct');
        console.log(`   - Candidate: ${workflow.job_applications.candidates.first_name} ${workflow.job_applications.candidates.last_name}`);
        console.log(`   - Job: ${workflow.job_applications.jobs.title}`);
        console.log(`   - Step: ${workflow.current_step}/5`);
        console.log(`   - Status: ${workflow.status}`);
      } else {
        console.log('❌ Data structure issue - missing candidate or job data');
        return false;
      }
    }

    console.log('🎉 Offer Workflow System test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Offer Workflow System test failed:', error);
    return false;
  }
};

// Helper to check API service health
export const testOfferApiService = async () => {
  try {
    console.log('🔍 Testing Offer API Service connection...');
    
    // This would test the actual API service if it's running
    const response = await fetch('http://localhost:8000/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Offer API Service is healthy:', data);
      return true;
    } else {
      console.log('⚠️  Offer API Service not available (this is expected if not running locally)');
      console.log('   To test full functionality, start the FastAPI server at http://localhost:8000');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Offer API Service not available (this is expected if not running locally)');
    console.log('   To test full functionality, start the FastAPI server at http://localhost:8000');
    return false;
  }
};

export default { testOfferWorkflowSystem, testOfferApiService };
