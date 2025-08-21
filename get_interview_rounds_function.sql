-- Function to get interview rounds for a specific job
CREATE OR REPLACE FUNCTION get_interview_rounds(job_uuid UUID)
RETURNS TABLE (
  id UUID,
  job_id UUID,
  round_type interview_round_type,
  round_number INTEGER,
  duration_minutes INTEGER,
  interviewers_required INTEGER,
  interviewer_profiles JSONB,
  is_mandatory BOOLEAN,
  is_ai_assisted BOOLEAN,
  scoring_criteria JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.job_id,
    i.round_type,
    i.round_number,
    i.duration_minutes,
    i.interviewers_required,
    i.interviewer_profiles,
    i.is_mandatory,
    i.is_ai_assisted,
    i.scoring_criteria,
    i.created_at,
    i.updated_at
  FROM interviews i
  WHERE i.job_id = job_uuid
  ORDER BY i.round_number ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_interview_rounds(UUID) TO authenticated;
