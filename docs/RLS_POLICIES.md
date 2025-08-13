# Row Level Security (RLS) Policies Documentation

## Overview
This document details all Row Level Security policies implemented in the recruitment platform database. RLS ensures data isolation and proper access control based on user roles and ownership.

## Policy Categories

### 1. User Profile Policies

#### `profiles` Table
```sql
-- Users can only view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own profile during registration
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Note: DELETE is disabled for profiles
```

### 2. Candidate Management Policies

#### `candidates` Table
```sql
-- All authenticated users can view candidates (for job matching)
CREATE POLICY "Allow authenticated users to view candidates" 
ON public.candidates 
FOR SELECT 
USING (true);

-- Users can create candidate profiles linked to their account
CREATE POLICY "Allow authenticated users to create candidate profiles" 
ON public.candidates 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Users can manage their own candidate profile
CREATE POLICY "Users can manage their own candidate profile" 
ON public.candidates 
FOR ALL 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());
```

### 3. Company & Vendor Policies

#### `companies` Table
```sql
-- Super admins can manage all companies
CREATE POLICY "Super admins can manage all companies" 
ON public.companies 
FOR ALL 
USING (get_current_user_role() = 'super_admin');

-- All authenticated users can view companies for job applications
CREATE POLICY "Users can view companies they interact with" 
ON public.companies 
FOR SELECT 
USING (
  (get_current_user_role() = 'super_admin') OR 
  (EXISTS (
    SELECT 1 FROM jobs j 
    WHERE j.company_id = companies.id AND j.created_by = auth.uid()
  )) OR 
  (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() AND p.company_name ILIKE companies.name
  )) OR 
  (auth.uid() IS NOT NULL)
);

-- Clients can create companies
CREATE POLICY "Clients can create companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = ANY(ARRAY['client'::user_role, 'super_admin'::user_role])
  )) OR 
  ((auth.uid() IS NOT NULL) AND (NOT (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid()
  ))))
);

-- Job creators can update their companies
CREATE POLICY "Job creators can update their companies" 
ON public.companies 
FOR UPDATE 
USING (
  (get_current_user_role() = 'super_admin') OR 
  (EXISTS (
    SELECT 1 FROM jobs j 
    WHERE j.company_id = companies.id AND j.created_by = auth.uid()
  ))
);
```

#### `vendors` Table
```sql
-- Super admins and clients can manage vendors
CREATE POLICY "Super admins and clients can manage vendors" 
ON public.vendors 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['super_admin'::text, 'client'::text])) 
WITH CHECK (get_current_user_role() = ANY(ARRAY['super_admin'::text, 'client'::text]));

-- Allow authenticated super admins to insert vendors
CREATE POLICY "Allow authenticated super admins to insert vendors" 
ON public.vendors 
FOR INSERT 
WITH CHECK (true);
```

### 4. Job Management Policies

#### `jobs` Table
```sql
-- Anyone can view published jobs
CREATE POLICY "Anyone can view published jobs" 
ON public.jobs 
FOR SELECT 
USING (
  (status = 'published'::text) OR 
  (created_by = auth.uid()) OR 
  (get_current_user_role() = 'super_admin'::text)
);

-- Role-based viewing for drafts and internal jobs
CREATE POLICY "Authenticated users can view jobs based on role" 
ON public.jobs 
FOR SELECT 
USING (
  (get_current_user_role() = ANY(ARRAY['super_admin'::text, 'client'::text, 'vendor'::text])) OR 
  ((status = 'published'::text) AND (auth.uid() IS NOT NULL))
);

-- Clients and super admins can create jobs
CREATE POLICY "Clients and super admins can manage jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = ANY(ARRAY['super_admin'::user_role, 'client'::user_role])
  )
);

-- Users can update their own jobs
CREATE POLICY "Users can update their own jobs" 
ON public.jobs 
FOR UPDATE 
USING (
  (created_by = auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'super_admin'::user_role
  ))
) 
WITH CHECK (
  (created_by = auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'super_admin'::user_role
  ))
);

-- Users can delete their own jobs
CREATE POLICY "Users can delete their own jobs" 
ON public.jobs 
FOR DELETE 
USING (
  (created_by = auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'super_admin'::user_role
  ))
);
```

### 5. Application & Interview Policies

#### `job_applications` Table
```sql
-- Role-based access to applications
CREATE POLICY "Users can manage job applications based on role" 
ON public.job_applications 
FOR ALL 
USING (
  (get_current_user_role() = 'super_admin'::text) OR 
  (EXISTS (
    SELECT 1 FROM candidates c 
    WHERE c.id = job_applications.candidate_id AND c.user_id = auth.uid()
  )) OR 
  (EXISTS (
    SELECT 1 FROM jobs j 
    WHERE j.id = job_applications.job_id AND j.created_by = auth.uid()
  ))
) 
WITH CHECK (
  (get_current_user_role() = 'super_admin'::text) OR 
  (EXISTS (
    SELECT 1 FROM candidates c 
    WHERE c.id = job_applications.candidate_id AND c.user_id = auth.uid()
  )) OR 
  (EXISTS (
    SELECT 1 FROM jobs j 
    WHERE j.id = job_applications.job_id AND j.created_by = auth.uid()
  ))
);
```

#### `interviews` Table
```sql
-- Super admins can manage all interviews
CREATE POLICY "Super admins can manage all interviews" 
ON public.interviews 
FOR ALL 
USING (get_current_user_role() = 'super_admin'::text) 
WITH CHECK (get_current_user_role() = 'super_admin'::text);

-- Job creators can manage interviews for their jobs
CREATE POLICY "Job creators can manage interviews for their jobs" 
ON public.interviews 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM job_applications ja 
    JOIN jobs j ON j.id = ja.job_id 
    WHERE ja.id = interviews.application_id AND j.created_by = auth.uid()
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM job_applications ja 
    JOIN jobs j ON j.id = ja.job_id 
    WHERE ja.id = interviews.application_id AND j.created_by = auth.uid()
  )
);

-- Interviewers can manage assigned interviews
CREATE POLICY "Interviewers can manage assigned interviews" 
ON public.interviews 
FOR ALL 
USING (interviewer_id = auth.uid()) 
WITH CHECK (interviewer_id = auth.uid());

-- Candidates can view their own interviews
CREATE POLICY "Candidates can view their own interviews" 
ON public.interviews 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM job_applications ja 
    JOIN candidates c ON c.id = ja.candidate_id 
    WHERE ja.id = interviews.application_id AND c.user_id = auth.uid()
  )
);
```

#### `ai_interview_sessions` Table
```sql
-- Access tied to interview permissions
CREATE POLICY "Users can manage AI interview sessions for their interviews" 
ON public.ai_interview_sessions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM interviews i 
    JOIN job_applications ja ON ja.id = i.application_id 
    JOIN jobs j ON j.id = ja.job_id 
    WHERE i.id = ai_interview_sessions.interview_id 
    AND (
      j.created_by = auth.uid() OR 
      i.interviewer_id = auth.uid() OR 
      get_current_user_role() = 'super_admin'::text
    )
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM interviews i 
    JOIN job_applications ja ON ja.id = i.application_id 
    JOIN jobs j ON j.id = ja.job_id 
    WHERE i.id = ai_interview_sessions.interview_id 
    AND (
      j.created_by = auth.uid() OR 
      i.interviewer_id = auth.uid() OR 
      get_current_user_role() = 'super_admin'::text
    )
  )
);
```

### 6. Offer Management Policies

#### `offers` Table
```sql
-- Role-based access to offers
CREATE POLICY "Users can manage offers based on role" 
ON public.offers 
FOR ALL 
USING (
  (get_current_user_role() = 'super_admin'::text) OR 
  (EXISTS (
    SELECT 1 FROM job_applications ja 
    JOIN jobs j ON j.id = ja.job_id 
    WHERE ja.id = offers.application_id AND j.created_by = auth.uid()
  )) OR 
  (EXISTS (
    SELECT 1 FROM job_applications ja 
    JOIN candidates c ON c.id = ja.candidate_id 
    WHERE ja.id = offers.application_id AND c.user_id = auth.uid()
  ))
) 
WITH CHECK (
  (get_current_user_role() = 'super_admin'::text) OR 
  (EXISTS (
    SELECT 1 FROM job_applications ja 
    JOIN jobs j ON j.id = ja.job_id 
    WHERE ja.id = offers.application_id AND j.created_by = auth.uid()
  )) OR 
  (EXISTS (
    SELECT 1 FROM job_applications ja 
    JOIN candidates c ON c.id = ja.candidate_id 
    WHERE ja.id = offers.application_id AND c.user_id = auth.uid()
  ))
);
```

#### `offer_workflow` Table
```sql
-- Similar role-based access as offers
CREATE POLICY "Users can manage offer workflows based on role" 
ON public.offer_workflow 
FOR ALL 
USING (
  (get_current_user_role() = 'super_admin'::text) OR 
  (EXISTS (
    SELECT 1 FROM job_applications ja 
    JOIN jobs j ON j.id = ja.job_id 
    WHERE ja.id = offer_workflow.application_id AND j.created_by = auth.uid()
  )) OR 
  (EXISTS (
    SELECT 1 FROM job_applications ja 
    JOIN candidates c ON c.id = ja.candidate_id 
    WHERE ja.id = offer_workflow.application_id AND c.user_id = auth.uid()
  ))
) 
WITH CHECK (
  (get_current_user_role() = 'super_admin'::text) OR 
  (EXISTS (
    SELECT 1 FROM job_applications ja 
    JOIN jobs j ON j.id = ja.job_id 
    WHERE ja.id = offer_workflow.application_id AND j.created_by = auth.uid()
  )) OR 
  (EXISTS (
    SELECT 1 FROM job_applications ja 
    JOIN candidates c ON c.id = ja.candidate_id 
    WHERE ja.id = offer_workflow.application_id AND c.user_id = auth.uid()
  ))
);
```

#### `offer_templates` Table
```sql
-- Users can manage their own templates
CREATE POLICY "Users can manage their own offer templates" 
ON public.offer_templates 
FOR ALL 
USING (created_by = auth.uid()) 
WITH CHECK (created_by = auth.uid());
```

### 7. Skills & HR Management Policies

#### `skills_master` Table
```sql
-- Authenticated users can view skills
CREATE POLICY "Authenticated users can view skills" 
ON public.skills_master 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- HR managers can manage skills
CREATE POLICY "HR managers can manage skills" 
ON public.skills_master 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['super_admin'::text, 'hr_manager'::text])) 
WITH CHECK (get_current_user_role() = ANY(ARRAY['super_admin'::text, 'hr_manager'::text]));
```

#### `employees` Table
```sql
-- Public read access for counts
CREATE POLICY "Allow public read access for employee counts" 
ON public.employees 
FOR SELECT 
USING (true);

-- HR managers and super admins can manage employees
CREATE POLICY "HR managers and super admins can manage employees" 
ON public.employees 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['super_admin'::text, 'hr_manager'::text])) 
WITH CHECK (get_current_user_role() = ANY(ARRAY['super_admin'::text, 'hr_manager'::text]));
```

## Security Definer Functions

### `get_current_user_role()`
```sql
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(role::text, 'candidate') 
  FROM public.profiles 
  WHERE user_id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path TO 'public';
```

**Purpose**: Prevents RLS recursion when checking user roles in policies.

## Best Practices Implemented

1. **Principle of Least Privilege**: Users only access data they need
2. **Role-Based Access Control**: Different permissions for different user types
3. **Data Ownership**: Users control their own data
4. **Security Definer Functions**: Prevent recursive RLS issues
5. **Granular Permissions**: Separate policies for SELECT, INSERT, UPDATE, DELETE
6. **Multi-tenancy**: Data isolation between companies and users

## Testing RLS Policies

To test policies, connect as different users and verify:

```sql
-- Test as candidate
SELECT * FROM jobs WHERE status = 'published'; -- Should work
SELECT * FROM jobs WHERE status = 'draft'; -- Should be empty

-- Test as client
SELECT * FROM job_applications WHERE job_id IN (
  SELECT id FROM jobs WHERE created_by = auth.uid()
); -- Should see own applications

-- Test as super_admin
SELECT * FROM users; -- Should see all data
```

## Common RLS Patterns Used

1. **Owner-only access**: `USING (created_by = auth.uid())`
2. **Role-based access**: `USING (get_current_user_role() = 'admin')`
3. **Public read**: `USING (true)` for SELECT
4. **Relationship-based**: JOIN clauses to check ownership through relationships
5. **Status-based**: `USING (status = 'published')` for public content