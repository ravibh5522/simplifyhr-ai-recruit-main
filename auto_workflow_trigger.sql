-- Database function to automatically create offer workflow after candidate passes interviews
-- This function aggregates data from multiple tables and creates a workflow entry

-- First, create a function to calculate final interview score
CREATE OR REPLACE FUNCTION calculate_final_interview_score(p_job_application_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_final_score NUMERIC := 0;
    v_total_interviews INTEGER := 0;
    v_completed_interviews INTEGER := 0;
    v_avg_ai_score NUMERIC := 0;
    v_avg_interviewer_score NUMERIC := 0;
BEGIN
    -- Count total interviews for this application
    SELECT COUNT(*)
    INTO v_total_interviews
    FROM interview_schedules isch
    JOIN interviews ir ON ir.id = isch.interview_round_id
    JOIN job_applications ja ON ja.job_id = ir.job_id
    WHERE ja.id = p_job_application_id;

    -- Count completed interviews with scores
    SELECT COUNT(*)
    INTO v_completed_interviews
    FROM interview_schedules isch
    JOIN interviews ir ON ir.id = isch.interview_round_id
    JOIN job_applications ja ON ja.job_id = ir.job_id
    WHERE ja.id = p_job_application_id
      AND isch.status = 'completed'
      AND (isch.ai_score IS NOT NULL OR isch.interviewer_scores IS NOT NULL);

    -- Calculate average AI scores
    SELECT COALESCE(AVG(isch.ai_score), 0)
    INTO v_avg_ai_score
    FROM interview_schedules isch
    JOIN interviews ir ON ir.id = isch.interview_round_id
    JOIN job_applications ja ON ja.job_id = ir.job_id
    WHERE ja.id = p_job_application_id
      AND isch.status = 'completed'
      AND isch.ai_score IS NOT NULL;

    -- Calculate average interviewer scores (assuming JSON structure with numeric scores)
    SELECT COALESCE(AVG(
        CASE 
            WHEN jsonb_typeof(isch.interviewer_scores) = 'object' 
            THEN COALESCE((isch.interviewer_scores->>'overall_score')::NUMERIC, 
                         (isch.interviewer_scores->>'technical_score')::NUMERIC, 
                         (isch.interviewer_scores->>'communication_score')::NUMERIC, 0)
            ELSE 0
        END
    ), 0)
    INTO v_avg_interviewer_score
    FROM interview_schedules isch
    JOIN interviews ir ON ir.id = isch.interview_round_id
    JOIN job_applications ja ON ja.job_id = ir.job_id
    WHERE ja.id = p_job_application_id
      AND isch.status = 'completed'
      AND isch.interviewer_scores IS NOT NULL;

    -- Calculate final weighted score
    -- 30% screening + 40% AI interview + 30% human interview
    SELECT COALESCE(
        (ja.screening_score * 0.3) + 
        (v_avg_ai_score * 0.4) + 
        (v_avg_interviewer_score * 0.3), 
        ja.screening_score
    )
    INTO v_final_score
    FROM job_applications ja
    WHERE ja.id = p_job_application_id;

    RETURN COALESCE(v_final_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Main function to create offer workflow with aggregated data
CREATE OR REPLACE FUNCTION create_offer_workflow_with_data(p_job_application_id UUID)
RETURNS UUID AS $$
DECLARE
    v_workflow_id UUID;
    v_candidate_data RECORD;
    v_job_data RECORD;
    v_interview_summary JSONB := '{}';
    v_final_score NUMERIC;
    v_offer_amount NUMERIC;
    v_workflow_notes TEXT := '';
    v_priority_level INTEGER := 3;
BEGIN
    -- Get comprehensive candidate and job data
    SELECT 
        ja.id as application_id,
        ja.candidate_id,
        ja.job_id,
        ja.company_id,
        ja.screening_score,
        ja.ai_screening_notes,
        ja.status,
        c.profile_id as candidate_profile_id,
        p.first_name,
        p.last_name,
        p.email,
        c.experience_years,
        c.expected_salary,
        c.currency as candidate_currency,
        c.current_location,
        c.skills,
        j.title as job_title,
        j.salary_min,
        j.salary_max,
        j.currency as job_currency,
        j.created_by as job_creator,
        j.is_urgent,
        comp.name as company_name
    INTO v_candidate_data
    FROM job_applications ja
    JOIN candidates c ON c.id = ja.candidate_id
    JOIN profiles p ON p.id = c.profile_id
    JOIN jobs j ON j.id = ja.job_id
    JOIN companies comp ON comp.id = ja.company_id
    WHERE ja.id = p_job_application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job application not found: %', p_job_application_id;
    END IF;

    -- Calculate final interview score
    v_final_score := calculate_final_interview_score(p_job_application_id);

    -- Aggregate interview data
    SELECT jsonb_agg(
        jsonb_build_object(
            'interview_id', isch.id,
            'round_type', ir.round_type,
            'round_number', ir.round_number,
            'scheduled_at', isch.scheduled_at,
            'status', isch.status,
            'ai_score', isch.ai_score,
            'interviewer_scores', isch.interviewer_scores,
            'final_recommendation', isch.final_recommendation,
            'interviewer_notes', isch.interviewer_notes,
            'duration_minutes', isch.duration_minutes
        )
    )
    INTO v_interview_summary
    FROM interview_schedules isch
    JOIN interviews ir ON ir.id = isch.interview_round_id
    WHERE isch.job_application_id = p_job_application_id;

    -- Calculate recommended offer amount
    -- Use job salary range and candidate expectations
    v_offer_amount := CASE 
        WHEN v_candidate_data.expected_salary IS NOT NULL 
             AND v_candidate_data.expected_salary BETWEEN v_candidate_data.salary_min AND v_candidate_data.salary_max
        THEN v_candidate_data.expected_salary
        
        WHEN v_final_score >= 85 THEN 
            -- High performers get upper range
            v_candidate_data.salary_max * 0.9
            
        WHEN v_final_score >= 70 THEN 
            -- Good performers get mid-range
            (v_candidate_data.salary_min + v_candidate_data.salary_max) / 2
            
        ELSE 
            -- Lower performers get lower range
            v_candidate_data.salary_min * 1.1
    END;

    -- Set priority based on urgency and score
    v_priority_level := CASE 
        WHEN v_candidate_data.is_urgent AND v_final_score >= 80 THEN 1
        WHEN v_candidate_data.is_urgent OR v_final_score >= 85 THEN 2
        WHEN v_final_score >= 70 THEN 3
        ELSE 4
    END;

    -- Build workflow notes
    v_workflow_notes := format(
        'Auto-generated workflow for %s %s applying for %s at %s. ' ||
        'Final interview score: %s. Expected salary: %s %s. ' ||
        'Recommended offer: %s %s. Experience: %s years.',
        v_candidate_data.first_name,
        v_candidate_data.last_name,
        v_candidate_data.job_title,
        v_candidate_data.company_name,
        ROUND(v_final_score, 2),
        COALESCE(v_candidate_data.expected_salary::TEXT, 'Not specified'),
        COALESCE(v_candidate_data.candidate_currency, 'USD'),
        ROUND(v_offer_amount, 2),
        v_candidate_data.job_currency,
        COALESCE(v_candidate_data.experience_years, 0)
    );

    -- Create the offer workflow with all aggregated data
    INSERT INTO offer_workflow (
        job_application_id,
        current_step,
        status,
        created_by,
        priority_level,
        final_offer_amount,
        final_offer_currency,
        notes,
        offer_details,
        estimated_completion_date,
        logs
    ) VALUES (
        p_job_application_id,
        'background_check',  -- Start with background check
        'pending',
        v_candidate_data.job_creator,
        v_priority_level,
        v_offer_amount,
        v_candidate_data.job_currency,
        v_workflow_notes,
        jsonb_build_object(
            'candidate_info', jsonb_build_object(
                'name', v_candidate_data.first_name || ' ' || v_candidate_data.last_name,
                'email', v_candidate_data.email,
                'experience_years', v_candidate_data.experience_years,
                'current_location', v_candidate_data.current_location,
                'skills', v_candidate_data.skills,
                'expected_salary', v_candidate_data.expected_salary,
                'expected_currency', v_candidate_data.candidate_currency
            ),
            'job_info', jsonb_build_object(
                'title', v_candidate_data.job_title,
                'company', v_candidate_data.company_name,
                'salary_range', jsonb_build_object(
                    'min', v_candidate_data.salary_min,
                    'max', v_candidate_data.salary_max,
                    'currency', v_candidate_data.job_currency
                )
            ),
            'screening_info', jsonb_build_object(
                'screening_score', v_candidate_data.screening_score,
                'ai_notes', v_candidate_data.ai_screening_notes
            ),
            'interview_summary', v_interview_summary,
            'final_score', v_final_score,
            'recommended_offer', jsonb_build_object(
                'amount', v_offer_amount,
                'currency', v_candidate_data.job_currency,
                'reasoning', 'Based on interview performance and salary expectations'
            ),
            'auto_generated', true,
            'created_at', NOW()
        ),
        CURRENT_DATE + INTERVAL '14 days',  -- 2 weeks estimated completion
        jsonb_build_array(
            jsonb_build_object(
                'timestamp', NOW(),
                'action', 'workflow_created',
                'details', 'Auto-generated workflow after successful interview completion',
                'final_score', v_final_score,
                'created_by', 'system'
            )
        )
    ) RETURNING id INTO v_workflow_id;

    -- Update job application status to 'selected' and final score
    UPDATE job_applications 
    SET 
        status = 'selected',
        final_score = v_final_score,
        updated_at = NOW(),
        logs = logs || jsonb_build_array(
            jsonb_build_object(
                'timestamp', NOW(),
                'action', 'auto_selected',
                'details', 'Automatically moved to selected status after interview completion',
                'final_score', v_final_score,
                'workflow_id', v_workflow_id
            )
        )
    WHERE id = p_job_application_id;

    -- Log the workflow creation
    INSERT INTO offer_workflow (id, logs) 
    VALUES (v_workflow_id, logs || jsonb_build_array(
        jsonb_build_object(
            'timestamp', NOW(),
            'action', 'data_aggregated',
            'details', 'Successfully aggregated data from candidate, job, and interview tables'
        )
    ))
    ON CONFLICT (id) DO UPDATE SET 
        logs = offer_workflow.logs || EXCLUDED.logs;

    RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically create workflow when all interviews are completed
CREATE OR REPLACE FUNCTION trigger_auto_workflow()
RETURNS TRIGGER AS $$
DECLARE
    v_total_rounds INTEGER;
    v_completed_rounds INTEGER;
    v_passed_rounds INTEGER;
    v_application_id UUID;
    v_existing_workflow UUID;
BEGIN
    -- Get the job application ID
    v_application_id := NEW.job_application_id;

    -- Check if workflow already exists
    SELECT id INTO v_existing_workflow
    FROM offer_workflow
    WHERE job_application_id = v_application_id;

    -- Skip if workflow already exists
    IF v_existing_workflow IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Only proceed if interview is completed
    IF NEW.status != 'completed' THEN
        RETURN NEW;
    END IF;

    -- Count total interview rounds for this job application
    SELECT COUNT(*)
    INTO v_total_rounds
    FROM interviews ir
    JOIN job_applications ja ON ja.job_id = ir.job_id
    WHERE ja.id = v_application_id;

    -- Count completed interview rounds
    SELECT COUNT(*)
    INTO v_completed_rounds
    FROM interview_schedules isch
    JOIN interviews ir ON ir.id = isch.interview_round_id
    WHERE isch.job_application_id = v_application_id
      AND isch.status = 'completed';

    -- Count passed interview rounds (hire recommendations)
    SELECT COUNT(*)
    INTO v_passed_rounds
    FROM interview_schedules isch
    WHERE isch.job_application_id = v_application_id
      AND isch.status = 'completed'
      AND isch.final_recommendation IN ('hire', 'strong_hire');

    -- Create workflow if all interviews completed and majority passed
    IF v_completed_rounds >= v_total_rounds AND v_passed_rounds >= (v_total_rounds / 2) THEN
        PERFORM create_offer_workflow_with_data(v_application_id);
        
        -- Add log entry about auto-workflow creation
        RAISE NOTICE 'Auto-created offer workflow for application: %', v_application_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_workflow_trigger ON interview_schedules;
CREATE TRIGGER auto_workflow_trigger
    AFTER UPDATE ON interview_schedules
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
    EXECUTE FUNCTION trigger_auto_workflow();

-- Manual function to create workflow for existing candidates
CREATE OR REPLACE FUNCTION create_workflow_for_selected_candidates()
RETURNS TABLE (
    application_id UUID,
    workflow_id UUID,
    candidate_name TEXT,
    job_title TEXT,
    final_score NUMERIC,
    status TEXT
) AS $$
DECLARE
    rec RECORD;
    v_workflow_id UUID;
BEGIN
    -- Find all selected candidates without workflows
    FOR rec IN 
        SELECT DISTINCT ja.id as app_id,
               p.first_name || ' ' || p.last_name as name,
               j.title
        FROM job_applications ja
        JOIN candidates c ON c.id = ja.candidate_id
        JOIN profiles p ON p.id = c.profile_id
        JOIN jobs j ON j.id = ja.job_id
        LEFT JOIN offer_workflow ow ON ow.job_application_id = ja.id
        WHERE ja.status = 'selected'
          AND ow.id IS NULL
    LOOP
        BEGIN
            v_workflow_id := create_offer_workflow_with_data(rec.app_id);
            
            RETURN QUERY SELECT 
                rec.app_id,
                v_workflow_id,
                rec.name,
                rec.title,
                calculate_final_interview_score(rec.app_id),
                'created'::TEXT;
                
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                rec.app_id,
                NULL::UUID,
                rec.name,
                rec.title,
                NULL::NUMERIC,
                ('error: ' || SQLERRM)::TEXT;
        END;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to update existing workflows with missing data
CREATE OR REPLACE FUNCTION update_workflow_data(p_workflow_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_application_id UUID;
    v_final_score NUMERIC;
    v_updated_details JSONB;
BEGIN
    -- Get application ID
    SELECT job_application_id INTO v_application_id
    FROM offer_workflow
    WHERE id = p_workflow_id;

    IF v_application_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Calculate fresh final score
    v_final_score := calculate_final_interview_score(v_application_id);

    -- Update workflow with fresh data
    UPDATE offer_workflow
    SET 
        final_offer_amount = CASE 
            WHEN final_offer_amount IS NULL THEN
                (SELECT 
                    CASE 
                        WHEN c.expected_salary BETWEEN j.salary_min AND j.salary_max
                        THEN c.expected_salary
                        WHEN v_final_score >= 85 THEN j.salary_max * 0.9
                        WHEN v_final_score >= 70 THEN (j.salary_min + j.salary_max) / 2
                        ELSE j.salary_min * 1.1
                    END
                FROM job_applications ja
                JOIN candidates c ON c.id = ja.candidate_id
                JOIN jobs j ON j.id = ja.job_id
                WHERE ja.id = v_application_id)
            ELSE final_offer_amount
        END,
        offer_details = offer_details || jsonb_build_object(
            'updated_final_score', v_final_score,
            'last_data_update', NOW()
        ),
        logs = logs || jsonb_build_array(
            jsonb_build_object(
                'timestamp', NOW(),
                'action', 'data_updated',
                'details', 'Refreshed workflow data',
                'final_score', v_final_score
            )
        ),
        updated_at = NOW()
    WHERE id = p_workflow_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
