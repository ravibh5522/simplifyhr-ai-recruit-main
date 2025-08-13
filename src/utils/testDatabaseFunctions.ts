// Utility to test database functions and workflow creation
import { supabase } from '@/integrations/supabase/client';

export const testDatabaseFunctions = async () => {
  console.log('🧪 Testing database functions...');
  
  try {
    // Test 1: Check if functions exist
    console.log('1. Checking if database functions exist...');
    
    // Test calculate_final_interview_score function
    const { data: scoreTest, error: scoreError } = await supabase.rpc(
      'calculate_final_interview_score',
      { p_job_application_id: '00000000-0000-0000-0000-000000000000' }
    );
    
    if (scoreError && !scoreError.message.includes('Job application not found')) {
      console.log('❌ calculate_final_interview_score function not found:', scoreError.message);
    } else {
      console.log('✅ calculate_final_interview_score function exists');
    }

    // Test 2: Check create_offer_workflow_with_data function
    const { data: workflowTest, error: workflowError } = await supabase.rpc(
      'create_offer_workflow_with_data',
      { p_job_application_id: '00000000-0000-0000-0000-000000000000' }
    );
    
    if (workflowError && !workflowError.message.includes('Job application not found')) {
      console.log('❌ create_offer_workflow_with_data function not found:', workflowError.message);
    } else {
      console.log('✅ create_offer_workflow_with_data function exists');
    }

    // Test 3: Check create_workflow_for_selected_candidates function
    const { data: batchTest, error: batchError } = await supabase.rpc(
      'create_workflow_for_selected_candidates'
    );
    
    if (batchError && !batchError.message.includes('function')) {
      console.log('❌ create_workflow_for_selected_candidates function error:', batchError.message);
    } else {
      console.log('✅ create_workflow_for_selected_candidates function exists');
      console.log('   Result:', batchTest);
    }

    return true;
  } catch (error) {
    console.error('❌ Function test failed:', error);
    return false;
  }
};

export const createWorkflowsForAllSelected = async () => {
  console.log('🚀 Creating workflows for all selected candidates...');
  
  try {
    const { data: results, error } = await supabase.rpc(
      'create_workflow_for_selected_candidates'
    );
    
    if (error) {
      console.error('❌ Batch workflow creation failed:', error);
      return false;
    }
    
    console.log('✅ Batch workflow creation results:');
    results?.forEach((result: any, index: number) => {
      console.log(`   ${index + 1}. ${result.candidate_name} (${result.job_title})`);
      console.log(`      Status: ${result.status}`);
      if (result.workflow_id) {
        console.log(`      Workflow ID: ${result.workflow_id}`);
        console.log(`      Final Score: ${result.final_score}`);
      }
    });
    
    return results;
  } catch (error) {
    console.error('❌ Batch workflow creation error:', error);
    return false;
  }
};

export const testWorkflowCreation = async (applicationId: string) => {
  console.log('🧪 Testing workflow creation for application:', applicationId);
  
  try {
    // Method 1: Try the comprehensive function
    const { data: workflowId, error: workflowError } = await supabase.rpc(
      'create_offer_workflow_with_data',
      { p_job_application_id: applicationId }
    );
    
    if (workflowError) {
      console.error('❌ Comprehensive workflow creation failed:', workflowError);
      
      // Method 2: Try the simple function as fallback
      const { data: simpleWorkflowId, error: simpleError } = await supabase.rpc(
        'create_simple_workflow',
        { p_job_application_id: applicationId }
      );
      
      if (simpleError) {
        console.error('❌ Simple workflow creation also failed:', simpleError);
        return false;
      } else {
        console.log('✅ Simple workflow created:', simpleWorkflowId);
        return simpleWorkflowId;
      }
    } else {
      console.log('✅ Comprehensive workflow created:', workflowId);
      return workflowId;
    }
  } catch (error) {
    console.error('❌ Workflow creation test failed:', error);
    return false;
  }
};

export const checkWorkflowData = async (workflowId: string) => {
  console.log('🔍 Checking workflow data for ID:', workflowId);
  
  try {
    const { data: workflow, error } = await supabase
      .from('offer_workflow')
      .select(`
        *,
        job_applications!inner (
          *,
          candidates!inner (
            profiles!inner (first_name, last_name, email)
          ),
          jobs!inner (title, company_id)
        )
      `)
      .eq('id', workflowId)
      .single();
    
    if (error) {
      console.error('❌ Workflow data fetch failed:', error);
      return false;
    }
    
    console.log('✅ Workflow data:');
    console.log('   ID:', workflow.id);
    console.log('   Current Step:', workflow.current_step);
    console.log('   Status:', workflow.status);
    console.log('   Priority Level:', workflow.priority_level);
    console.log('   Offer Amount:', workflow.final_offer_amount, workflow.final_offer_currency);
    console.log('   Candidate:', workflow.job_applications.candidates.profiles.first_name, 
                workflow.job_applications.candidates.profiles.last_name);
    console.log('   Job:', workflow.job_applications.jobs.title);
    console.log('   Notes:', workflow.notes);
    console.log('   Offer Details:', JSON.stringify(workflow.offer_details, null, 2));
    
    return workflow;
  } catch (error) {
    console.error('❌ Workflow data check failed:', error);
    return false;
  }
};

export default {
  testDatabaseFunctions,
  createWorkflowsForAllSelected,
  testWorkflowCreation,
  checkWorkflowData
};
