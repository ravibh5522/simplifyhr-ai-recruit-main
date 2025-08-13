// Test data creation utility for the offer workflow system
import { supabase } from '../integrations/supabase/client';

export const createTestData = async () => {
  console.log('🧪 Creating test data for offer workflow...');
  
  try {
    // 1. Get current user
    const { data: userResponse, error: userError } = await supabase.auth.getUser();
    if (userError || !userResponse.user) {
      console.error('❌ User not authenticated');
      return false;
    }
    
    const userId = userResponse.user.id;
    console.log('✅ Current user ID:', userId);

    // 2. Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      console.log('Creating user profile...');
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userResponse.user.email,
          first_name: 'Test',
          last_name: 'Recruiter',
          role: 'admin' as any
        });
      
      if (createProfileError) {
        console.error('❌ Failed to create profile:', createProfileError);
        return false;
      }
      console.log('✅ Profile created');
    } else {
      console.log('✅ Profile exists:', profile.email);
    }

    // 3. Check if company exists
    let companyId;
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (companyError) {
      console.error('❌ Company query error:', companyError);
      return false;
    }

    if (!companies || companies.length === 0) {
      console.log('Creating test company...');
      const { data: newCompany, error: createCompanyError } = await supabase
        .from('companies')
        .insert({
          name: 'Test Company',
          country: 'India',
          industry: 'Technology'
        })
        .select()
        .single();
      
      if (createCompanyError) {
        console.error('❌ Failed to create company:', createCompanyError);
        return false;
      }
      companyId = newCompany.id;
      console.log('✅ Company created:', companyId);
    } else {
      companyId = companies[0].id;
      console.log('✅ Using existing company:', companyId);
    }

    // 4. Create test job
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('created_by', userId)
      .limit(1);

    let jobId;
    if (!existingJobs || existingJobs.length === 0) {
      console.log('Creating test job...');
      const { data: newJob, error: createJobError } = await supabase
        .from('jobs')
        .insert({
          company_id: companyId,
          created_by: userId,
          title: 'Software Engineer',
          description: 'Test job for offer workflow',
          location: 'Mumbai, India',
          salary_min: 500000,
          salary_max: 1000000,
          currency: 'INR',
          status: 'active' as any
        })
        .select()
        .single();
      
      if (createJobError) {
        console.error('❌ Failed to create job:', createJobError);
        return false;
      }
      jobId = newJob.id;
      console.log('✅ Job created:', jobId);
    } else {
      jobId = existingJobs[0].id;
      console.log('✅ Using existing job:', jobId);
    }

    // 5. Create test candidate profile
    const candidateEmail = 'candidate@test.com';
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', candidateEmail)
      .single();

    let candidateProfileId;
    if (!existingProfile) {
      console.log('Creating candidate profile...');
      // Generate a random UUID for the candidate profile
      const candidateId = crypto.randomUUID();
      
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: candidateId,
          email: candidateEmail,
          first_name: 'John',
          last_name: 'Doe',
          role: 'candidate' as any
        })
        .select()
        .single();
      
      if (createProfileError) {
        console.error('❌ Failed to create candidate profile:', createProfileError);
        return false;
      }
      candidateProfileId = newProfile.id;
      console.log('✅ Candidate profile created:', candidateProfileId);
    } else {
      candidateProfileId = existingProfile.id;
      console.log('✅ Using existing candidate profile:', candidateProfileId);
    }

    // 6. Create candidate record
    const { data: existingCandidate } = await supabase
      .from('candidates')
      .select('*')
      .eq('profile_id', candidateProfileId)
      .single();

    let candidateId;
    if (!existingCandidate) {
      console.log('Creating candidate record...');
      const { data: newCandidate, error: createCandidateError } = await supabase
        .from('candidates')
        .insert({
          profile_id: candidateProfileId,
          experience_years: 3,
          expected_salary: 800000,
          currency: 'INR',
          current_location: 'Mumbai',
          skills: ['JavaScript', 'React', 'Node.js']
        })
        .select()
        .single();
      
      if (createCandidateError) {
        console.error('❌ Failed to create candidate:', createCandidateError);
        return false;
      }
      candidateId = newCandidate.id;
      console.log('✅ Candidate created:', candidateId);
    } else {
      candidateId = existingCandidate.id;
      console.log('✅ Using existing candidate:', candidateId);
    }

    // 7. Create job application with 'selected' status
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .eq('candidate_id', candidateId)
      .single();

    let applicationId;
    if (!existingApplication) {
      console.log('Creating job application...');
      const { data: newApplication, error: createApplicationError } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          candidate_id: candidateId,
          status: 'selected' as any,
          screening_score: 85,
          ai_screening_notes: 'Good candidate with relevant experience',
          company_id: companyId,
          final_score: 82
        })
        .select()
        .single();
      
      if (createApplicationError) {
        console.error('❌ Failed to create job application:', createApplicationError);
        return false;
      }
      applicationId = newApplication.id;
      console.log('✅ Job application created:', applicationId);
    } else {
      // Update existing application to selected status
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ 
          status: 'selected' as any, 
          screening_score: 85,
          ai_screening_notes: 'Good candidate with relevant experience',
          final_score: 82
        })
        .eq('id', existingApplication.id);
      
      if (updateError) {
        console.error('❌ Failed to update job application:', updateError);
        return false;
      }
      
      applicationId = existingApplication.id;
      console.log('✅ Job application updated to selected:', applicationId);
    }

    // 8. Create interview rounds for the job
    const { data: existingInterviews } = await supabase
      .from('interviews')
      .select('*')
      .eq('job_id', jobId);

    let interviewRoundId;
    if (!existingInterviews || existingInterviews.length === 0) {
      console.log('Creating interview round...');
      const { data: newInterview, error: createInterviewError } = await supabase
        .from('interviews')
        .insert({
          job_id: jobId,
          round_type: 'technical' as any,
          round_number: 1,
          duration_minutes: 60,
          scoring_criteria: {
            technical_skills: 40,
            communication: 30,
            problem_solving: 30
          },
          is_mandatory: true
        })
        .select()
        .single();
      
      if (createInterviewError) {
        console.error('❌ Failed to create interview round:', createInterviewError);
        return false;
      }
      interviewRoundId = newInterview.id;
      console.log('✅ Interview round created:', interviewRoundId);
    } else {
      interviewRoundId = existingInterviews[0].id;
      console.log('✅ Using existing interview round:', interviewRoundId);
    }

    // 9. Create completed interview schedule with good scores
    const { data: existingSchedule } = await supabase
      .from('interview_schedules')
      .select('*')
      .eq('job_application_id', applicationId);

    if (!existingSchedule || existingSchedule.length === 0) {
      console.log('Creating interview schedule...');
      const { data: newSchedule, error: createScheduleError } = await supabase
        .from('interview_schedules')
        .insert({
          interview_round_id: interviewRoundId,
          job_application_id: applicationId,
          interview_type: 'technical' as any,
          scheduled_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          duration_minutes: 60,
          status: 'completed' as any,
          ai_score: 85,
          interviewer_scores: {
            technical_score: 88,
            communication_score: 82,
            problem_solving_score: 86,
            overall_score: 85
          },
          final_recommendation: 'hire' as any,
          interviewer_notes: {
            strengths: ['Strong technical skills', 'Good problem-solving approach', 'Clear communication'],
            areas_for_improvement: ['Could improve system design skills'],
            overall_feedback: 'Excellent candidate, recommend for hire'
          },
          company_id: companyId,
          assigned_interviewers: [userId]
        })
        .select()
        .single();
      
      if (createScheduleError) {
        console.error('❌ Failed to create interview schedule:', createScheduleError);
        return false;
      }
      console.log('✅ Interview schedule created:', newSchedule.id);
    } else {
      console.log('✅ Interview schedule already exists');
    }

    console.log('🎉 Test data creation completed!');
    console.log('📋 Summary:');
    console.log(`   - Company ID: ${companyId}`);
    console.log(`   - Job ID: ${jobId}`);
    console.log(`   - Candidate ID: ${candidateId}`);
    console.log(`   - Application ID: ${applicationId}`);
    console.log('');
    
    // 10. Try to create workflow using database function
    console.log('🔄 Attempting to create workflow using database function...');
    try {
      const { data: workflowResult, error: workflowError } = await supabase.rpc(
        'create_simple_workflow',
        { p_job_application_id: applicationId }
      );
      
      if (workflowError) {
        console.error('❌ Workflow creation failed:', workflowError);
        console.log('⚠️  You may need to run the SQL functions in Supabase first');
      } else {
        console.log('✅ Workflow created via DB function:', workflowResult);
      }
    } catch (error) {
      console.error('❌ Workflow function error:', error);
      console.log('⚠️  Database function may not exist yet');
    }
    
    console.log('✨ You should now see a selected candidate in the UI with interview data!');
    
    return {
      companyId,
      jobId,
      candidateId,
      applicationId,
      success: true
    };

  } catch (error) {
    console.error('❌ Test data creation failed:', error);
    return false;
  }
};

export const checkTestData = async () => {
  console.log('🔍 Checking existing test data...');
  
  try {
    const { data: userResponse } = await supabase.auth.getUser();
    if (!userResponse.user) {
      console.log('❌ User not authenticated');
      return false;
    }
    
    const userId = userResponse.user.id;

    // Check for selected candidates
    const { data: applications, error } = await supabase
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

    if (error) {
      console.error('❌ Query error:', error);
      return false;
    }

    console.log(`✅ Found ${applications?.length || 0} selected candidates`);
    
    if (applications && applications.length > 0) {
      applications.forEach((app, index) => {
        console.log(`   ${index + 1}. ${app.candidates.profiles.first_name} ${app.candidates.profiles.last_name} - ${app.jobs.title}`);
        console.log(`      Screening Score: ${app.screening_score || 'N/A'}`);
      });
    }

    return applications?.length > 0;

  } catch (error) {
    console.error('❌ Check failed:', error);
    return false;
  }
};

export default { createTestData, checkTestData };
