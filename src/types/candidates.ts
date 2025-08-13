export interface SelectedCandidate {
  id: string;
  candidate_id: string;
  job_id: string;
  company_id: string;
  status: string;
  screening_score: number; // Changed from ai_screening_score to match DB schema
  ai_screening_notes: string;
  final_score?: number;
  candidates: {
    profile_id: string;
    profiles: {
      first_name: string;
      last_name: string;
      email: string;
    };
    experience_years?: number;
    expected_salary?: number;
    currency?: string;
    current_location?: string;
    skills?: string[];
    ai_score?: number;
    ai_summary?: string;
  };
  jobs: {
    title: string;
    location: string;
    salary_min: number;
    salary_max: number;
    currency: string;
    created_by: string;
    is_urgent?: boolean;
  };
  offer_workflow?: {
    id: string;
    status: string;
    current_step: string; // Changed from number to string to match DB enum
    priority_level?: number;
    final_offer_amount?: number;
    final_offer_currency?: string;
    notes?: string;
    offer_details?: any;
  }[];
}

export interface CandidateWorkflowStatus {
  status: 'not_started' | 'in_progress' | 'completed' | 'rejected' | 'pending';
  label: string;
  color: string;
}