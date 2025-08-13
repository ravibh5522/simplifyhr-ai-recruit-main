-- Simple function to manually create workflow with aggregated data
-- This can be called directly or used for testing

CREATE OR REPLACE FUNCTION create_simple_workflow(p_job_application_id UUID)
RETURNS UUID AS $$
DECLARE
    v_workflow_id UUID;
    v_candidate_name TEXT;
    v_job_title TEXT;
    v_screening_score NUMERIC;
    v_expected_salary NUMERIC;
    v_job_salary_max NUMERIC;
    v_job_creator UUID;
    v_offer_amount NUMERIC;
BEGIN
    -- Get basic data for workflow
    SELECT 
        p.first_name || ' ' || p.last_name,
        j.title,
        ja.screening_score,
        c.expected_salary,
        j.salary_max,
        j.created_by
    INTO 
        v_candidate_name,
        v_job_title,
        v_screening_score,
        v_expected_salary,
        v_job_salary_max,
        v_job_creator
    FROM job_applications ja
    JOIN candidates c ON c.id = ja.candidate_id
    JOIN profiles p ON p.id = c.profile_id
    JOIN jobs j ON j.id = ja.job_id
    WHERE ja.id = p_job_application_id;

    -- Calculate offer amount
    v_offer_amount := COALESCE(
        CASE 
            WHEN v_expected_salary IS NOT NULL AND v_expected_salary <= v_job_salary_max
            THEN v_expected_salary
            ELSE v_job_salary_max * 0.85
        END,
        v_job_salary_max * 0.8
    );

    -- Create workflow
    INSERT INTO offer_workflow (
        job_application_id,
        current_step,
        status,
        created_by,
        final_offer_amount,
        final_offer_currency,
        notes,
        offer_details,
        priority_level
    ) VALUES (
        p_job_application_id,
        'background_check',
        'pending',
        v_job_creator,
        v_offer_amount,
        'INR',
        format('Workflow for %s - %s (Score: %s)', v_candidate_name, v_job_title, v_screening_score),
        jsonb_build_object(
            'candidate_name', v_candidate_name,
            'job_title', v_job_title,
            'screening_score', v_screening_score,
            'auto_generated', true
        ),
        3
    ) RETURNING id INTO v_workflow_id;

    -- Update application status
    UPDATE job_applications 
    SET status = 'selected', updated_at = NOW()
    WHERE id = p_job_application_id;

    RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to create workflow for all selected candidates without workflows
CREATE OR REPLACE FUNCTION create_missing_workflows()
RETURNS TEXT AS $$
DECLARE
    rec RECORD;
    v_count INTEGER := 0;
    v_result TEXT := '';
BEGIN
    FOR rec IN 
        SELECT ja.id
        FROM job_applications ja
        LEFT JOIN offer_workflow ow ON ow.job_application_id = ja.id
        WHERE ja.status = 'selected' AND ow.id IS NULL
    LOOP
        PERFORM create_simple_workflow(rec.id);
        v_count := v_count + 1;
    END LOOP;
    
    v_result := format('Created %s workflows for selected candidates', v_count);
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
