# Database Schema Documentation

## Overview
This document provides a comprehensive overview of the database schema for the AI-powered recruitment platform built on Supabase.

## Database Tables

### Core User Management

#### `profiles`
**Purpose**: Stores additional user information beyond Supabase Auth
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'candidate',
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Key Features**:
- Links to Supabase Auth users via `user_id`
- Role-based access control with enum: `super_admin`, `client`, `vendor`, `candidate`
- RLS enabled for user privacy

#### `candidates`
**Purpose**: Detailed candidate information and resume data
```sql
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  resume_text TEXT,
  skills TEXT[],
  experience_years INTEGER,
  current_location TEXT,
  willing_to_relocate BOOLEAN DEFAULT false,
  expected_salary INTEGER,
  availability_date DATE,
  currency TEXT DEFAULT 'IDR',
  ai_score NUMERIC,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Key Features**:
- Stores resume content and extracted skills
- AI-generated scores and summaries
- Salary expectations with currency support
- Geographic preferences

### Company & Vendor Management

#### `companies`
**Purpose**: Client companies posting jobs
```sql
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  size_range TEXT,
  website TEXT,
  logo_url TEXT,
  address TEXT,
  country TEXT NOT NULL DEFAULT 'Indonesia',
  commission_rate NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `vendors`
**Purpose**: External recruitment vendors/agencies
```sql
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  vendor_name TEXT,
  spoc_name TEXT,
  spoc_email TEXT,
  spoc_phone TEXT,
  specialization TEXT[],
  success_rate NUMERIC,
  average_time_to_fill INTEGER,
  commission_rate NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### Job Management

#### `jobs`
**Purpose**: Job postings and requirements
```sql
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ai_generated_description TEXT,
  requirements TEXT[],
  skills_required TEXT[],
  experience_level TEXT,
  employment_type TEXT,
  location TEXT,
  remote_allowed BOOLEAN DEFAULT false,
  salary_min INTEGER,
  salary_max INTEGER,
  currency TEXT DEFAULT 'IDR',
  budget_range_min INTEGER,
  budget_range_max INTEGER,
  budget_auto_suggested BOOLEAN DEFAULT false,
  budget_recommendation JSONB,
  total_positions INTEGER DEFAULT 1,
  filled_positions INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  expires_at TIMESTAMP WITH TIME ZONE,
  interview_rounds INTEGER DEFAULT 1,
  interview_types JSONB,
  publish_to_linkedin BOOLEAN DEFAULT false,
  publish_to_website BOOLEAN DEFAULT false,
  publish_to_vendors BOOLEAN DEFAULT false,
  assigned_vendors UUID[],
  offer_template_id UUID,
  min_assessment_score INTEGER DEFAULT 70,
  scoring_criteria TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Key Features**:
- AI-generated job descriptions
- Multi-channel publishing options
- Budget recommendations
- Vendor assignment capabilities
- Interview configuration

### Application & Interview Process

#### `job_applications`
**Purpose**: Candidate applications to jobs
```sql
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied',
  cover_letter TEXT,
  ai_screening_score NUMERIC,
  ai_screening_notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Statuses**: `applied`, `screening`, `interview`, `selected`, `rejected`, `withdrawn`

#### `interviews`
**Purpose**: Interview scheduling and management
```sql
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  interviewer_id UUID,
  type TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 60,
  meeting_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  ai_interview_enabled BOOLEAN DEFAULT false,
  ai_score NUMERIC,
  ai_evaluation_score NUMERIC,
  ai_evaluation_summary TEXT,
  interviewer_score NUMERIC,
  notes TEXT,
  feedback TEXT,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `ai_interview_sessions`
**Purpose**: AI-powered interview sessions
```sql
CREATE TABLE public.ai_interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL,
  session_data JSONB NOT NULL DEFAULT '{}',
  conversation_history JSONB NOT NULL DEFAULT '[]',
  ai_prompt TEXT,
  current_question TEXT,
  ai_assessment JSONB,
  evaluation_notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### Offer Management

#### `offers`
**Purpose**: Job offers to candidates
```sql
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  salary_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  benefits TEXT[],
  start_date DATE,
  offer_letter_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `offer_workflow`
**Purpose**: Multi-step offer approval process
```sql
CREATE TABLE public.offer_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  
  -- Background Check (Step 1)
  background_check_status TEXT DEFAULT 'pending',
  background_check_provider TEXT,
  background_check_reference_id TEXT,
  background_check_result JSONB,
  background_check_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Offer Generation (Step 2)
  offer_template_id UUID,
  generated_offer_content TEXT,
  offer_details JSONB,
  offer_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- HR Approval (Step 3)
  hr_approval_status TEXT DEFAULT 'pending',
  hr_approved_by UUID,
  hr_approved_at TIMESTAMP WITH TIME ZONE,
  hr_comments TEXT,
  
  -- Send to Candidate (Step 4)
  sent_to_candidate_at TIMESTAMP WITH TIME ZONE,
  candidate_notification_sent BOOLEAN DEFAULT false,
  offer_letter_url TEXT,
  
  -- Track Response (Step 5)
  candidate_response TEXT,
  candidate_response_at TIMESTAMP WITH TIME ZONE,
  candidate_comments TEXT,
  final_offer_amount INTEGER,
  final_offer_currency TEXT DEFAULT 'IDR',
  workflow_completed_at TIMESTAMP WITH TIME ZONE,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `offer_templates`
**Purpose**: Reusable offer letter templates
```sql
CREATE TABLE public.offer_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_content TEXT NOT NULL,
  job_role TEXT,
  country TEXT NOT NULL DEFAULT 'Indonesia',
  created_by UUID NOT NULL,
  is_validated BOOLEAN DEFAULT false,
  validation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### Skills & HR Management

#### `skills_master`
**Purpose**: Centralized skills database
```sql
CREATE TABLE public.skills_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### `employees`
**Purpose**: Internal employee management
```sql
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  position TEXT NOT NULL,
  department TEXT,
  company TEXT,
  role TEXT NOT NULL,
  manager_id UUID,
  hire_date DATE,
  salary NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

## Enums

### `user_role`
```sql
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'client', 
  'vendor',
  'candidate'
);
```

## Key Relationships

1. **User → Profile**: One-to-one relationship via `user_id`
2. **Profile → Candidate**: One-to-one for candidate users
3. **Company → Jobs**: One-to-many relationship
4. **Jobs → Applications**: One-to-many relationship
5. **Applications → Interviews**: One-to-many relationship
6. **Applications → Offers**: One-to-one relationship
7. **Applications → Offer Workflow**: One-to-one relationship
8. **Interviews → AI Sessions**: One-to-one for AI interviews

## Database Functions

### `advance_offer_workflow_step(workflow_id, step_data)`
**Purpose**: Advances offer workflow to next step with validation
**Returns**: JSON with success status and current step

### `get_current_user_role()`
**Purpose**: Security definer function to get user role (prevents RLS recursion)
**Returns**: TEXT role of current authenticated user

### `handle_new_user()`
**Purpose**: Trigger function to create profile when user signs up
**Trigger**: AFTER INSERT on auth.users

### `update_updated_at_column()`
**Purpose**: Automatically updates `updated_at` timestamp
**Trigger**: BEFORE UPDATE on most tables

## Indexes & Performance

Key indexes are automatically created for:
- Primary keys (UUID fields)
- Foreign key relationships
- Frequently queried columns (status, created_at, etc.)
- Full-text search on job descriptions and candidate skills

## Security Considerations

1. **Row Level Security (RLS)** enabled on all tables
2. **Role-based access control** through user_role enum
3. **Security definer functions** prevent RLS recursion
4. **JWT verification** required for most operations
5. **Data isolation** by user roles and ownership