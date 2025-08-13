export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_interview_sessions: {
        Row: {
          ai_assessment: Json | null
          ai_prompt: string | null
          conversation_history: Json
          created_at: string
          current_question: string | null
          evaluation_notes: string | null
          id: string
          interview_id: string
          session_data: Json
          status: string
          updated_at: string
        }
        Insert: {
          ai_assessment?: Json | null
          ai_prompt?: string | null
          conversation_history?: Json
          created_at?: string
          current_question?: string | null
          evaluation_notes?: string | null
          id?: string
          interview_id: string
          session_data?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          ai_assessment?: Json | null
          ai_prompt?: string | null
          conversation_history?: Json
          created_at?: string
          current_question?: string | null
          evaluation_notes?: string | null
          id?: string
          interview_id?: string
          session_data?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_sessions_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          ai_score: number | null
          ai_summary: string | null
          availability_date: string | null
          created_at: string
          currency: string | null
          current_location: string | null
          email: string
          expected_salary: number | null
          experience_years: number | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          resume_text: string | null
          resume_url: string | null
          skills: string[] | null
          updated_at: string
          user_id: string | null
          willing_to_relocate: boolean | null
        }
        Insert: {
          ai_score?: number | null
          ai_summary?: string | null
          availability_date?: string | null
          created_at?: string
          currency?: string | null
          current_location?: string | null
          email: string
          expected_salary?: number | null
          experience_years?: number | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string | null
          willing_to_relocate?: boolean | null
        }
        Update: {
          ai_score?: number | null
          ai_summary?: string | null
          availability_date?: string | null
          created_at?: string
          currency?: string | null
          current_location?: string | null
          email?: string
          expected_salary?: number | null
          experience_years?: number | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          resume_text?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string | null
          willing_to_relocate?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          commission_rate: number | null
          country: string
          created_at: string
          description: string | null
          id: string
          industry: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          size_range: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          commission_rate?: number | null
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          size_range?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          commission_rate?: number | null
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          size_range?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      employee_certifications: {
        Row: {
          certificate_url: string | null
          certification_name: string
          created_at: string
          employee_id: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_authority: string | null
        }
        Insert: {
          certificate_url?: string | null
          certification_name: string
          created_at?: string
          employee_id: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
        }
        Update: {
          certificate_url?: string | null
          certification_name?: string
          created_at?: string
          employee_id?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_skills: {
        Row: {
          ai_assessed_level: number | null
          created_at: string
          employee_id: string
          id: string
          input_level: number | null
          last_assessment_date: string | null
          skill_id: string
          updated_at: string
        }
        Insert: {
          ai_assessed_level?: number | null
          created_at?: string
          employee_id: string
          id?: string
          input_level?: number | null
          last_assessment_date?: string | null
          skill_id: string
          updated_at?: string
        }
        Update: {
          ai_assessed_level?: number | null
          created_at?: string
          employee_id?: string
          id?: string
          input_level?: number | null
          last_assessment_date?: string | null
          skill_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_skills_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills_master"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_trainings: {
        Row: {
          certificate_url: string | null
          completion_date: string | null
          created_at: string
          duration_hours: number | null
          employee_id: string
          id: string
          training_name: string
          training_provider: string | null
        }
        Insert: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string
          duration_hours?: number | null
          employee_id: string
          id?: string
          training_name: string
          training_provider?: string | null
        }
        Update: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string
          duration_hours?: number | null
          employee_id?: string
          id?: string
          training_name?: string
          training_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_trainings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          created_by: string
          department: string | null
          email: string
          employee_number: string
          first_name: string
          hire_date: string | null
          id: string
          is_active: boolean
          last_name: string
          manager_id: string | null
          phone: string | null
          position: string
          role: string
          salary: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          created_by: string
          department?: string | null
          email: string
          employee_number: string
          first_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          last_name: string
          manager_id?: string | null
          phone?: string | null
          position: string
          role: string
          salary?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          created_by?: string
          department?: string | null
          email?: string
          employee_number?: string
          first_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          manager_id?: string | null
          phone?: string | null
          position?: string
          role?: string
          salary?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_rounds: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          job_id: string
          round_number: number
          round_type: string
          scoring_criteria: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          job_id: string
          round_number: number
          round_type: string
          scoring_criteria?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          job_id?: string
          round_number?: number
          round_type?: string
          scoring_criteria?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_rounds_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          ai_evaluation_score: number | null
          ai_evaluation_summary: string | null
          ai_interview_enabled: boolean | null
          ai_score: number | null
          application_id: string
          created_at: string
          duration_minutes: number | null
          feedback: string | null
          id: string
          interviewer_id: string | null
          interviewer_score: number | null
          meeting_url: string | null
          notes: string | null
          recording_url: string | null
          scheduled_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          ai_evaluation_score?: number | null
          ai_evaluation_summary?: string | null
          ai_interview_enabled?: boolean | null
          ai_score?: number | null
          application_id: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interviewer_id?: string | null
          interviewer_score?: number | null
          meeting_url?: string | null
          notes?: string | null
          recording_url?: string | null
          scheduled_at?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          ai_evaluation_score?: number | null
          ai_evaluation_summary?: string | null
          ai_interview_enabled?: boolean | null
          ai_score?: number | null
          application_id?: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interviewer_id?: string | null
          interviewer_score?: number | null
          meeting_url?: string | null
          notes?: string | null
          recording_url?: string | null
          scheduled_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_applications: {
        Row: {
          ai_screening_notes: string | null
          ai_screening_score: number | null
          applied_at: string
          candidate_id: string
          cover_letter: string | null
          id: string
          job_id: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_screening_notes?: string | null
          ai_screening_score?: number | null
          applied_at?: string
          candidate_id: string
          cover_letter?: string | null
          id?: string
          job_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          ai_screening_notes?: string | null
          ai_screening_score?: number | null
          applied_at?: string
          candidate_id?: string
          cover_letter?: string | null
          id?: string
          job_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_descriptions: {
        Row: {
          ai_generated: boolean | null
          created_at: string
          created_by: string
          description: string
          id: string
          position: string
          preferred_skills: Json | null
          qualifications: string[] | null
          required_skills: Json | null
          responsibilities: string[] | null
          role: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          position: string
          preferred_skills?: Json | null
          qualifications?: string[] | null
          required_skills?: Json | null
          responsibilities?: string[] | null
          role: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          position?: string
          preferred_skills?: Json | null
          qualifications?: string[] | null
          required_skills?: Json | null
          responsibilities?: string[] | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          ai_generated_description: string | null
          assigned_vendors: string[] | null
          budget_auto_suggested: boolean | null
          budget_range_max: number | null
          budget_range_min: number | null
          budget_recommendation: Json | null
          company_id: string
          created_at: string
          created_by: string
          currency: string | null
          description: string | null
          employment_type: string | null
          experience_level: string | null
          expires_at: string | null
          filled_positions: number | null
          id: string
          interview_rounds: number | null
          interview_types: Json | null
          location: string | null
          min_assessment_score: number | null
          offer_template_id: string | null
          publish_to_linkedin: boolean | null
          publish_to_vendors: boolean | null
          publish_to_website: boolean | null
          remote_allowed: boolean | null
          requirements: string[] | null
          salary_max: number | null
          salary_min: number | null
          scoring_criteria: string[] | null
          skills_required: string[] | null
          status: string
          title: string
          total_positions: number | null
          updated_at: string
        }
        Insert: {
          ai_generated_description?: string | null
          assigned_vendors?: string[] | null
          budget_auto_suggested?: boolean | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          budget_recommendation?: Json | null
          company_id: string
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string | null
          employment_type?: string | null
          experience_level?: string | null
          expires_at?: string | null
          filled_positions?: number | null
          id?: string
          interview_rounds?: number | null
          interview_types?: Json | null
          location?: string | null
          min_assessment_score?: number | null
          offer_template_id?: string | null
          publish_to_linkedin?: boolean | null
          publish_to_vendors?: boolean | null
          publish_to_website?: boolean | null
          remote_allowed?: boolean | null
          requirements?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          scoring_criteria?: string[] | null
          skills_required?: string[] | null
          status?: string
          title: string
          total_positions?: number | null
          updated_at?: string
        }
        Update: {
          ai_generated_description?: string | null
          assigned_vendors?: string[] | null
          budget_auto_suggested?: boolean | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          budget_recommendation?: Json | null
          company_id?: string
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string | null
          employment_type?: string | null
          experience_level?: string | null
          expires_at?: string | null
          filled_positions?: number | null
          id?: string
          interview_rounds?: number | null
          interview_types?: Json | null
          location?: string | null
          min_assessment_score?: number | null
          offer_template_id?: string | null
          publish_to_linkedin?: boolean | null
          publish_to_vendors?: boolean | null
          publish_to_website?: boolean | null
          remote_allowed?: boolean | null
          requirements?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          scoring_criteria?: string[] | null
          skills_required?: string[] | null
          status?: string
          title?: string
          total_positions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      offer_templates: {
        Row: {
          country: string
          created_at: string
          created_by: string
          id: string
          is_validated: boolean | null
          job_role: string | null
          template_content: string
          template_name: string
          updated_at: string
          validation_notes: string | null
        }
        Insert: {
          country?: string
          created_at?: string
          created_by: string
          id?: string
          is_validated?: boolean | null
          job_role?: string | null
          template_content: string
          template_name: string
          updated_at?: string
          validation_notes?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          created_by?: string
          id?: string
          is_validated?: boolean | null
          job_role?: string | null
          template_content?: string
          template_name?: string
          updated_at?: string
          validation_notes?: string | null
        }
        Relationships: []
      }
      offer_workflow: {
        Row: {
          application_id: string
          background_check_completed_at: string | null
          background_check_provider: string | null
          background_check_reference_id: string | null
          background_check_result: Json | null
          background_check_status: string | null
          candidate_comments: string | null
          candidate_notification_sent: boolean | null
          candidate_response: string | null
          candidate_response_at: string | null
          created_at: string
          created_by: string
          current_step: number
          final_offer_amount: number | null
          final_offer_currency: string | null
          generated_offer_content: string | null
          hr_approval_status: string | null
          hr_approved_at: string | null
          hr_approved_by: string | null
          hr_comments: string | null
          id: string
          notes: string | null
          offer_details: Json | null
          offer_generated_at: string | null
          offer_letter_url: string | null
          offer_template_id: string | null
          sent_to_candidate_at: string | null
          status: string
          updated_at: string
          workflow_completed_at: string | null
        }
        Insert: {
          application_id: string
          background_check_completed_at?: string | null
          background_check_provider?: string | null
          background_check_reference_id?: string | null
          background_check_result?: Json | null
          background_check_status?: string | null
          candidate_comments?: string | null
          candidate_notification_sent?: boolean | null
          candidate_response?: string | null
          candidate_response_at?: string | null
          created_at?: string
          created_by: string
          current_step?: number
          final_offer_amount?: number | null
          final_offer_currency?: string | null
          generated_offer_content?: string | null
          hr_approval_status?: string | null
          hr_approved_at?: string | null
          hr_approved_by?: string | null
          hr_comments?: string | null
          id?: string
          notes?: string | null
          offer_details?: Json | null
          offer_generated_at?: string | null
          offer_letter_url?: string | null
          offer_template_id?: string | null
          sent_to_candidate_at?: string | null
          status?: string
          updated_at?: string
          workflow_completed_at?: string | null
        }
        Update: {
          application_id?: string
          background_check_completed_at?: string | null
          background_check_provider?: string | null
          background_check_reference_id?: string | null
          background_check_result?: Json | null
          background_check_status?: string | null
          candidate_comments?: string | null
          candidate_notification_sent?: boolean | null
          candidate_response?: string | null
          candidate_response_at?: string | null
          created_at?: string
          created_by?: string
          current_step?: number
          final_offer_amount?: number | null
          final_offer_currency?: string | null
          generated_offer_content?: string | null
          hr_approval_status?: string | null
          hr_approved_at?: string | null
          hr_approved_by?: string | null
          hr_comments?: string | null
          id?: string
          notes?: string | null
          offer_details?: Json | null
          offer_generated_at?: string | null
          offer_letter_url?: string | null
          offer_template_id?: string | null
          sent_to_candidate_at?: string | null
          status?: string
          updated_at?: string
          workflow_completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_workflow_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_workflow_offer_template_id_fkey"
            columns: ["offer_template_id"]
            isOneToOne: false
            referencedRelation: "offer_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          application_id: string
          benefits: string[] | null
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          offer_letter_url: string | null
          responded_at: string | null
          salary_amount: number
          sent_at: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          benefits?: string[] | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          offer_letter_url?: string | null
          responded_at?: string | null
          salary_amount: number
          sent_at?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          benefits?: string[] | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          offer_letter_url?: string | null
          responded_at?: string | null
          salary_amount?: number
          sent_at?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skill_gap_analysis: {
        Row: {
          ai_recommendations: string | null
          analysis_date: string
          created_by: string
          development_roadmap: string | null
          employee_id: string
          id: string
          job_description_id: string
          overall_match_percentage: number | null
          skill_gaps: Json | null
        }
        Insert: {
          ai_recommendations?: string | null
          analysis_date?: string
          created_by: string
          development_roadmap?: string | null
          employee_id: string
          id?: string
          job_description_id: string
          overall_match_percentage?: number | null
          skill_gaps?: Json | null
        }
        Update: {
          ai_recommendations?: string | null
          analysis_date?: string
          created_by?: string
          development_roadmap?: string | null
          employee_id?: string
          id?: string
          job_description_id?: string
          overall_match_percentage?: number | null
          skill_gaps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_gap_analysis_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_gap_analysis_job_description_id_fkey"
            columns: ["job_description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      skills_master: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          average_time_to_fill: number | null
          commission_rate: number | null
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean
          specialization: string[] | null
          spoc_email: string | null
          spoc_name: string | null
          spoc_phone: string | null
          success_rate: number | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          average_time_to_fill?: number | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          specialization?: string[] | null
          spoc_email?: string | null
          spoc_name?: string | null
          spoc_phone?: string | null
          success_rate?: number | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          average_time_to_fill?: number | null
          commission_rate?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          specialization?: string[] | null
          spoc_email?: string | null
          spoc_name?: string | null
          spoc_phone?: string | null
          success_rate?: number | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_offer_workflow_step: {
        Args: { workflow_id: string; step_data?: Json }
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      user_role:
        | "super_admin"
        | "client"
        | "vendor"
        | "candidate"
        | "hr_manager"
        | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: [
        "super_admin",
        "client",
        "vendor",
        "candidate",
        "hr_manager",
        "employee",
      ],
    },
  },
} as const
