// Database debugging utility to check workflow setup
import { supabase } from '@/integrations/supabase/client';

export const debugDatabase = async () => {
  console.log('🔍 Starting database debug...');
  
  try {
    // 1. Check current user
    const { data: userResponse, error: userError } = await supabase.auth.getUser();
    if (userError || !userResponse.user) {
      console.error('❌ User not authenticated:', userError);
      return false;
    }
    
    const userId = userResponse.user.id;
    console.log('✅ Current user ID:', userId);

    // 2. Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log('✅ User profile:', profile);
    }

    // 3. Check for jobs created by user
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('created_by', userId);
    
    if (jobsError) {
      console.error('❌ Jobs query error:', jobsError);
    } else {
      console.log(`✅ Found ${jobs?.length || 0} jobs created by user:`, jobs);
    }

    // 4. Check for job applications
    const { data: applications, error: appsError } = await supabase
      .from('job_applications')
      .select(`
        *,
        candidates!inner (
          profile_id,
          profiles!inner (first_name, last_name, email)
        ),
        jobs!inner (title, created_by)
      `)
      .eq('jobs.created_by', userId);
    
    if (appsError) {
      console.error('❌ Applications query error:', appsError);
    } else {
      console.log(`✅ Found ${applications?.length || 0} applications for user's jobs:`, applications);
    }

    // 5. Check selected candidates specifically
    const { data: selected, error: selectedError } = await supabase
      .from('job_applications')
      .select(`
        *,
        candidates!inner (
          profile_id,
          profiles!inner (first_name, last_name, email)
        ),
        jobs!inner (title, created_by)
      `)
      .eq('status', 'selected')
      .eq('jobs.created_by', userId);
    
    if (selectedError) {
      console.error('❌ Selected candidates query error:', selectedError);
    } else {
      console.log(`✅ Found ${selected?.length || 0} selected candidates:`, selected);
    }

    // 6. Check existing workflows
    const { data: workflows, error: workflowsError } = await supabase
      .from('offer_workflow')
      .select('*')
      .eq('created_by', userId);
    
    if (workflowsError) {
      console.error('❌ Workflows query error:', workflowsError);
    } else {
      console.log(`✅ Found ${workflows?.length || 0} existing workflows:`, workflows);
    }

    // 7. Test workflow creation permissions
    console.log('🧪 Testing workflow creation permissions...');
    
    if (selected && selected.length > 0) {
      const testApplicationId = selected[0].id;
      console.log('Testing with application ID:', testApplicationId);
      
      // Try to insert a test workflow (we'll rollback)
      const { data: testWorkflow, error: testError } = await supabase
        .from('offer_workflow')
        .insert({
          job_application_id: testApplicationId,
          created_by: userId,
          current_step: 'background_check',
          status: 'pending'
        })
        .select()
        .single();
      
      if (testError) {
        console.error('❌ Test workflow creation failed:', testError);
        console.log('This indicates RLS or permission issues');
      } else {
        console.log('✅ Test workflow creation successful:', testWorkflow);
        
        // Clean up test workflow
        await supabase
          .from('offer_workflow')
          .delete()
          .eq('id', testWorkflow.id);
        console.log('🧹 Test workflow cleaned up');
      }
    } else {
      console.log('⚠️  No selected candidates found to test workflow creation');
    }

    console.log('🎉 Database debug completed!');
    return true;

  } catch (error) {
    console.error('❌ Debug failed:', error);
    return false;
  }
};

export default debugDatabase;
