# Edge Functions Documentation

## Overview
This document details all Supabase Edge Functions implemented in the recruitment platform. Edge Functions handle server-side logic, API integrations, and AI processing.

## Function Directory Structure
```
supabase/functions/
├── ai-interviewer/
│   └── index.ts
├── analyze-resume/
│   └── index.ts
├── assess-application/
│   └── index.ts
├── background-check/
│   └── index.ts
├── generate-job-description/
│   └── index.ts
├── generate-job-description-stream/
│   └── index.ts
├── interview-scheduler-chat/
│   └── index.ts
├── meeting-integration/
│   └── index.ts
├── realtime-chat/
│   └── index.ts
├── realtime-video-interview/
│   └── index.ts
├── recommend-jobs/
│   └── index.ts
└── send-offer-email/
    └── index.ts
```

## Function Details

### 1. AI-Powered Functions

#### `ai-interviewer`
**Purpose**: Conducts AI-powered interviews with candidates
**Authentication**: Required (JWT)
**Method**: POST

**Request Body**:
```typescript
{
  interviewId: string;
  candidateResponse?: string;
  sessionData?: object;
}
```

**Response**:
```typescript
{
  question: string;
  sessionData: object;
  isComplete: boolean;
  assessment?: object;
}
```

**Key Features**:
- Dynamic question generation based on job requirements
- Real-time conversation management
- AI-powered candidate assessment
- Session state management

#### `analyze-resume`
**Purpose**: Extracts and analyzes resume content using AI
**Authentication**: Required (JWT)
**Method**: POST

**Request Body**:
```typescript
{
  resumeText: string;
  jobDescription?: string;
}
```

**Response**:
```typescript
{
  skills: string[];
  experience: number;
  summary: string;
  score: number;
  recommendations: string[];
}
```

**Key Features**:
- Skills extraction from resume text
- Experience calculation
- Job-resume matching score
- Improvement recommendations

#### `assess-application`
**Purpose**: AI assessment of job applications
**Authentication**: Required (JWT)
**Method**: POST

**Request Body**:
```typescript
{
  applicationId: string;
  jobId: string;
  candidateId: string;
}
```

**Response**:
```typescript
{
  score: number;
  notes: string;
  strengths: string[];
  concerns: string[];
  recommendation: 'proceed' | 'review' | 'reject';
}
```

### 2. Job Management Functions

#### `generate-job-description`
**Purpose**: AI-generated job descriptions
**Authentication**: Required (JWT)
**Method**: POST

**Request Body**:
```typescript
{
  jobTitle: string;
  company: string;
  requirements?: string[];
  skills?: string[];
  experienceLevel?: string;
}
```

**Response**:
```typescript
{
  description: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
}
```

#### `generate-job-description-stream`
**Purpose**: Streaming job description generation
**Authentication**: Required (JWT)
**Method**: POST
**Response Type**: Server-Sent Events (SSE)

**Features**:
- Real-time text generation
- Progressive content updates
- Streaming response for better UX

#### `recommend-jobs`
**Purpose**: Job recommendations for candidates
**Authentication**: Required (JWT)
**Method**: POST

**Request Body**:
```typescript
{
  candidateId: string;
  location?: string;
  skills?: string[];
  experienceLevel?: string;
}
```

**Response**:
```typescript
{
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    matchScore: number;
    reasons: string[];
  }>;
}
```

### 3. Communication Functions

#### `send-offer-email`
**Purpose**: Sends offer letters and notifications via email
**Authentication**: Required (JWT)
**Method**: POST

**Request Body**:
```typescript
{
  to: string;
  subject: string;
  html: string;
  type: 'offer_sent' | 'interview_scheduled' | 'application_update';
  attachments?: Array<{
    filename: string;
    content: string;
    encoding: string;
  }>;
}
```

**Response**:
```typescript
{
  success: boolean;
  messageId?: string;
  error?: string;
}
```

#### `interview-scheduler-chat`
**Purpose**: AI-powered interview scheduling assistant
**Authentication**: Required (JWT)
**Method**: POST

**Request Body**:
```typescript
{
  message: string;
  context: {
    candidateId: string;
    jobId: string;
    availableSlots?: string[];
  };
}
```

**Response**:
```typescript
{
  response: string;
  suggestedActions?: Array<{
    type: 'schedule' | 'reschedule' | 'cancel';
    data: object;
  }>;
}
```

### 4. Integration Functions

#### `meeting-integration`
**Purpose**: Integrates with video conferencing platforms
**Authentication**: Required (JWT)
**Method**: POST

**Request Body**:
```typescript
{
  action: 'create' | 'update' | 'delete';
  interviewId: string;
  scheduledAt: string;
  duration: number;
  participants: string[];
}
```

**Response**:
```typescript
{
  meetingUrl: string;
  meetingId: string;
  joinUrl: string;
  moderatorUrl: string;
}
```

#### `background-check`
**Purpose**: Initiates background check processes
**Authentication**: Required (JWT)
**Method**: POST

**Request Body**:
```typescript
{
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string;
}
```

**Response**:
```typescript
{
  status: 'passed' | 'failed' | 'pending';
  result: {
    criminal_record: string;
    employment_history: string;
    education: string;
    identity: string;
    credit_check: string;
  };
  score: number;
  provider: string;
  reference_id: string;
}
```

### 5. Real-time Functions

#### `realtime-chat`
**Purpose**: Real-time chat functionality
**Authentication**: Required (JWT)
**Method**: POST

**Request Body**:
```typescript
{
  roomId: string;
  message: string;
  type: 'text' | 'file' | 'system';
}
```

**Response**:
```typescript
{
  messageId: string;
  timestamp: string;
  delivered: boolean;
}
```

#### `realtime-video-interview`
**Purpose**: Real-time video interview management
**Authentication**: Required (JWT)
**Method**: POST

**Request Body**:
```typescript
{
  action: 'start' | 'join' | 'end';
  interviewId: string;
  participantId: string;
}
```

**Response**:
```typescript
{
  sessionId: string;
  connectionDetails: object;
  status: string;
}
```

## Configuration

### Environment Variables
All functions require these environment variables:
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

### CORS Configuration
All functions include CORS headers for web app compatibility:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### JWT Verification
By default, all functions require JWT authentication. To make a function public:
```toml
# supabase/config.toml
[functions.function-name]
verify_jwt = false
```

## Deployment

Functions are automatically deployed when code is pushed. No manual deployment required.

### Local Development
```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve

# Test a function
curl -X POST "http://localhost:54321/functions/v1/function-name" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

## Error Handling

All functions implement consistent error handling:
```typescript
try {
  // Function logic
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
} catch (error) {
  console.error('Function error:', error);
  return new Response(JSON.stringify({
    error: error.message,
    details: 'Additional error context'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 500,
  });
}
```

## Security Best Practices

1. **Input Validation**: All inputs are validated before processing
2. **Rate Limiting**: Implemented for AI functions to prevent abuse
3. **Error Sanitization**: Sensitive information never exposed in errors
4. **JWT Verification**: Authentication required unless explicitly disabled
5. **HTTPS Only**: All functions served over HTTPS
6. **Secret Management**: API keys stored as Supabase secrets

## Monitoring & Logging

### Function Logs
Access logs via Supabase Dashboard:
- Function execution logs
- Error tracking
- Performance metrics
- Usage analytics

### Custom Logging
```typescript
console.log('Info: Operation completed');
console.warn('Warning: Unusual condition detected');
console.error('Error: Operation failed', error);
```

## Usage Examples

### Client-side Function Calls
```typescript
// Using Supabase client
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { key: 'value' }
});

// Handle response
if (error) {
  console.error('Function error:', error);
} else {
  console.log('Function result:', data);
}
```

### React Hook Integration
```typescript
const useAIAnalysis = () => {
  const [loading, setLoading] = useState(false);
  
  const analyzeResume = async (resumeText: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { resumeText }
      });
      return data;
    } finally {
      setLoading(false);
    }
  };
  
  return { analyzeResume, loading };
};
```

## Performance Optimization

1. **Cold Start Mitigation**: Functions warmed up automatically
2. **Connection Pooling**: Database connections reused
3. **Caching**: Response caching where appropriate
4. **Async Processing**: Long-running tasks handled asynchronously
5. **Resource Limits**: Memory and timeout limits configured

## Testing

### Unit Testing
```typescript
// Test function locally
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

Deno.test('Function test', async () => {
  const request = new Request('http://localhost:8000', {
    method: 'POST',
    body: JSON.stringify({ test: 'data' })
  });
  
  const response = await handler(request);
  const result = await response.json();
  
  assertEquals(response.status, 200);
  assertEquals(result.success, true);
});
```

### Integration Testing
Functions tested with actual Supabase instance to ensure:
- Database operations work correctly
- Authentication functions properly
- External API integrations succeed
- Real-time features operate as expected