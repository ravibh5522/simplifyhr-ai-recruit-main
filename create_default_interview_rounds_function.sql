-- Function to create default interview rounds for a job
CREATE OR REPLACE FUNCTION create_default_interview_rounds(job_uuid UUID)
RETURNS TABLE (
  id UUID,
  job_id UUID,
  round_type interview_round_type,
  round_number INTEGER,
  duration_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert HR round
  INSERT INTO interviews (
    job_id,
    round_type,
    round_number,
    duration_minutes,
    scoring_criteria,
    interviewers_required,
    interviewer_profiles,
    is_ai_assisted,
    is_mandatory
  ) VALUES (
    job_uuid,
    'hr'::interview_round_type,
    1,
    60,
    '{"round_specific": ["Communication skills", "Cultural fit", "Motivation"]}',
    1,
    '[]',
    false,
    true
  );

  -- Insert Technical round
  INSERT INTO interviews (
    job_id,
    round_type,
    round_number,
    duration_minutes,
    scoring_criteria,
    interviewers_required,
    interviewer_profiles,
    is_ai_assisted,
    is_mandatory
  ) VALUES (
    job_uuid,
    'technical'::interview_round_type,
    2,
    90,
    '{"round_specific": ["Technical expertise", "Problem solving", "Code quality"]}',
    2,
    '[]',
    false,
    true
  );

  -- Return the created rounds
  RETURN QUERY
  SELECT 
    i.id,
    i.job_id,
    i.round_type,
    i.round_number,
    i.duration_minutes
  FROM interviews i
  WHERE i.job_id = job_uuid
  ORDER BY i.round_number ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_default_interview_rounds(UUID) TO authenticated;
