// Enum types matching database schema
export type WorkflowStepType = 
  | 'background_check'
  | 'generate_offer' 
  | 'hr_approval'
  | 'send_offer'
  | 'track_response';

export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';

export type BackgroundCheckStatus = 'not_required' | 'pending' | 'in_progress' | 'completed' | 'failed';

export type HRApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision_required';

export type CandidateResponse = 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'expired';

export interface OfferWorkflow {
  id: string;
  job_application_id: string; // Changed from application_id to match DB schema
  current_step: WorkflowStepType; // Using enum type
  status: WorkflowStatus; // Using enum type
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Background check fields
  background_check_status?: BackgroundCheckStatus; // Using enum type
  background_check_provider?: string;
  background_check_reference_id?: string;
  background_check_result?: any;
  background_check_completed_at?: string;
  
  // Offer generation fields
  offer_generated_at?: string;
  offer_template_id?: string;
  generated_offer_content?: string;
  offer_details?: any;
  
  // HR approval fields
  hr_approval_status?: HRApprovalStatus; // Using enum type
  hr_approved_by?: string;
  hr_approved_at?: string;
  hr_comments?: string;
  
  // Candidate communication fields
  sent_to_candidate_at?: string;
  candidate_notification_sent?: boolean;
  offer_letter_url?: string;
  
  // Candidate response fields
  candidate_response?: CandidateResponse; // Using enum type
  candidate_response_at?: string;
  candidate_comment?: string;
  
  // Financial fields
  final_offer_amount?: number;
  final_offer_currency?: string;
  
  // Workflow metadata
  workflow_completed_at?: string;
  notes?: string;
  logs?: any[];
  estimated_completion_date?: string;
  priority_level?: number;
  
  // Related data
  jobs?: { title: string } | null;
  candidates?: { 
    profiles: {
      first_name: string; 
      last_name: string; 
      email: string;
    }
  } | null;
}

export interface WorkflowStep {
  id: WorkflowStepType;
  name: string;
  icon: any;
  description?: string;
}

export interface WorkflowStepData {
  background_check_status?: BackgroundCheckStatus;
  background_check_result?: any;
  background_check_provider?: string;
  background_check_reference_id?: string;
  generated_offer_content?: string;
  offer_details?: any;
  offer_template_id?: string;
  hr_approval_status?: HRApprovalStatus;
  hr_comments?: string;
  hr_approved_by?: string;
  offer_letter_url?: string;
  sent_to_candidate_at?: string;
  candidate_notification_sent?: boolean;
  candidate_response?: CandidateResponse;
  candidate_comment?: string;
  final_offer_amount?: number;
  final_offer_currency?: string;
}