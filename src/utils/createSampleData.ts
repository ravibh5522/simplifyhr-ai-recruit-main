import { supabase } from '@/integrations/supabase/client';

export const createSampleJobApplications = async () => {
  try {
    console.log('Creating sample job applications...');

    // First, let's get existing jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title')
      .limit(1);

    if (jobsError || !jobs || jobs.length === 0) {
      console.error('No jobs found. Please create a job first.');
      return;
    }

    const jobId = jobs[0].id;
    console.log('Using job:', jobs[0]);

    // Create sample profiles and candidates
    const sampleCandidates = [
      {
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe'
      },
      {
        email: 'jane.smith@example.com',
        first_name: 'Jane',
        last_name: 'Smith'
      },
      {
        email: 'bob.wilson@example.com',
        first_name: 'Bob',
        last_name: 'Wilson'
      }
    ];

    // Create profiles first (these would normally be created by user registration)
    const profilePromises = sampleCandidates.map(async (candidate) => {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', candidate.email)
        .single();

      if (existingProfile) {
        return existingProfile;
      }

      // For testing, we'll create profiles without auth users
      // In production, these would be created through auth.users
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          email: candidate.email,
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          role: 'candidate',
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      return profile;
    });

    const profiles = await Promise.all(profilePromises);
    const validProfiles = profiles.filter(p => p !== null);

    console.log('Created/found profiles:', validProfiles);

    // Create candidates
    const candidatePromises = validProfiles.map(async (profile) => {
      // Check if candidate already exists
      const { data: existingCandidate } = await supabase
        .from('candidates')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (existingCandidate) {
        return existingCandidate;
      }

      const { data: candidate, error } = await supabase
        .from('candidates')
        .insert({
          profile_id: profile.id,
          experience_years: Math.floor(Math.random() * 10) + 1,
          current_location: 'New York, NY',
          willing_to_relocate: true,
          expected_salary: 75000 + Math.floor(Math.random() * 50000),
          currency: 'USD',
          availability_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating candidate:', error);
        return null;
      }

      return candidate;
    });

    const candidates = await Promise.all(candidatePromises);
    const validCandidates = candidates.filter(c => c !== null);

    console.log('Created/found candidates:', validCandidates);

    // Create job applications
    const applicationPromises = validCandidates.map(async (candidate) => {
      // Check if application already exists
      const { data: existingApplication } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('candidate_id', candidate.id)
        .single();

      if (existingApplication) {
        return existingApplication;
      }

      const statuses = ['applied', 'screening', 'interview', 'selected'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      const { data: application, error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          candidate_id: candidate.id,
          status: randomStatus,
          screening_score: Math.floor(Math.random() * 40) + 60, // 60-100
          applied_at: new Date().toISOString(),
          cover_letter: `I am very interested in this position and believe my skills would be a great fit.`
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating job application:', error);
        return null;
      }

      return application;
    });

    const applications = await Promise.all(applicationPromises);
    const validApplications = applications.filter(a => a !== null);

    console.log('Created/found job applications:', validApplications);

    return {
      success: true,
      message: `Created ${validApplications.length} sample job applications`,
      data: validApplications
    };

  } catch (error) {
    console.error('Error creating sample data:', error);
    return {
      success: false,
      message: `Error creating sample data: ${error.message}`,
      data: null
    };
  }
};

export const createSampleInterviewRounds = async (jobId: string) => {
  try {
    console.log('Creating sample interview rounds for job:', jobId);

    const rounds = [
      {
        job_id: jobId,
        round_type: 'screening',
        round_number: 1,
        duration_minutes: 30,
        scoring_criteria: { communication: 10, technical_fit: 10 },
        interviewers_required: 1,
        is_ai_assisted: false,
        is_mandatory: true
      },
      {
        job_id: jobId,
        round_type: 'technical',
        round_number: 2,
        duration_minutes: 60,
        scoring_criteria: { coding: 20, problem_solving: 20, system_design: 15 },
        interviewers_required: 2,
        is_ai_assisted: false,
        is_mandatory: true
      },
      {
        job_id: jobId,
        round_type: 'behavioral',
        round_number: 3,
        duration_minutes: 45,
        scoring_criteria: { culture_fit: 15, leadership: 10, teamwork: 10 },
        interviewers_required: 1,
        is_ai_assisted: false,
        is_mandatory: true
      }
    ];

    const roundPromises = rounds.map(async (round) => {
      // Check if round already exists
      const { data: existingRound } = await supabase
        .from('interviews')
        .select('id')
        .eq('job_id', jobId)
        .eq('round_number', round.round_number)
        .single();

      if (existingRound) {
        return existingRound;
      }

      const { data, error } = await supabase
        .from('interviews')
        .insert(round)
        .select()
        .single();

      if (error) {
        console.error('Error creating interview round:', error);
        return null;
      }

      return data;
    });

    const createdRounds = await Promise.all(roundPromises);
    const validRounds = createdRounds.filter(r => r !== null);

    console.log('Created/found interview rounds:', validRounds);

    return {
      success: true,
      message: `Created ${validRounds.length} interview rounds`,
      data: validRounds
    };

  } catch (error) {
    console.error('Error creating interview rounds:', error);
    return {
      success: false,
      message: `Error creating interview rounds: ${error.message}`,
      data: null
    };
  }
};
