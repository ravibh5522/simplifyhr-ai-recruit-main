# API Integration Guide

## Overview
This guide covers all API integrations in the recruitment platform, including internal Supabase APIs, external service integrations, and usage patterns.

## Table of Contents
1. [Supabase API Integration](#supabase-api-integration)
2. [Edge Functions API](#edge-functions-api)
3. [Authentication API](#authentication-api)
4. [Real-time API](#real-time-api)
5. [External Integrations](#external-integrations)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Testing APIs](#testing-apis)

## Supabase API Integration

### Client Setup
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = "https://nwohehoountzfudzygqg.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### Database Operations

#### Basic CRUD Operations
```typescript
// SELECT
const { data, error } = await supabase
  .from('jobs')
  .select('*')
  .eq('status', 'published')
  .order('created_at', { ascending: false });

// INSERT
const { data, error } = await supabase
  .from('job_applications')
  .insert({
    job_id: jobId,
    candidate_id: candidateId,
    status: 'applied'
  })
  .select()
  .single();

// UPDATE
const { data, error } = await supabase
  .from('jobs')
  .update({ status: 'published' })
  .eq('id', jobId)
  .select();

// DELETE
const { data, error } = await supabase
  .from('jobs')
  .delete()
  .eq('id', jobId);
```

#### Complex Queries with Joins
```typescript
// Fetch applications with candidate and job details
const { data, error } = await supabase
  .from('job_applications')
  .select(`
    *,
    candidates (
      first_name,
      last_name,
      email,
      skills,
      experience_years
    ),
    jobs (
      title,
      company_id,
      salary_min,
      salary_max,
      companies (
        name,
        logo_url
      )
    )
  `)
  .eq('status', 'selected')
  .order('updated_at', { ascending: false });
```

#### RPC Function Calls
```typescript
// Call stored procedure
const { data, error } = await supabase.rpc('advance_offer_workflow_step', {
  workflow_id: workflowId,
  step_data: {
    background_check_status: 'completed',
    background_check_result: checkResult
  }
});
```

### Real-time Subscriptions
```typescript
// Subscribe to table changes
useEffect(() => {
  const channel = supabase
    .channel('job-applications-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'job_applications'
      },
      (payload) => {
        console.log('New application:', payload);
        // Update local state
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'job_applications',
        filter: `job_id=eq.${jobId}`
      },
      (payload) => {
        console.log('Application updated:', payload);
        // Update specific application
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [jobId]);
```

## Edge Functions API

### Function Invocation
```typescript
// Basic function call
const { data, error } = await supabase.functions.invoke('analyze-resume', {
  body: {
    resumeText: candidateResume,
    jobDescription: jobDesc
  }
});

// Function with custom headers
const { data, error } = await supabase.functions.invoke('ai-interviewer', {
  body: {
    interviewId: interview.id,
    candidateResponse: userMessage
  },
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

### Error Handling for Functions
```typescript
const callAIFunction = async (functionName: string, payload: any) => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });

    if (error) {
      console.error(`Function ${functionName} error:`, error);
      throw new Error(`Function call failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error(`Function ${functionName} exception:`, error);
    throw error;
  }
};
```

### Streaming Responses
```typescript
// For streaming functions like job description generation
const streamJobDescription = async (jobData: any) => {
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-job-description-stream`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jobData)
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        
        try {
          const parsed = JSON.parse(data);
          // Handle streamed data
          onProgress(parsed);
        } catch (e) {
          console.error('Failed to parse chunk:', e);
        }
      }
    }
  }
};
```

## Authentication API

### User Authentication
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      first_name: firstName,
      last_name: lastName,
      role: userRole
    }
  }
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

// Sign out
const { error } = await supabase.auth.signOut();

// Get current user
const { data: { user }, error } = await supabase.auth.getUser();
```

### Session Management
```typescript
// Listen for auth changes
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user);
        setUser(session?.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);

// Refresh session
const { data, error } = await supabase.auth.refreshSession();
```

### Role-Based Access
```typescript
// Check user role
const getUserRole = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user?.id)
    .single();

  return data?.role;
};

// Conditional rendering based on role
const RoleBasedComponent = () => {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getUserRole().then(setUserRole);
    }
  }, [user]);

  if (userRole === 'super_admin') {
    return <AdminDashboard />;
  } else if (userRole === 'client') {
    return <ClientDashboard />;
  } else {
    return <CandidateDashboard />;
  }
};
```

## Real-time API

### Channel Management
```typescript
// Create and manage channels
const createRealtimeChannel = (channelName: string) => {
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: true }
    }
  });

  // Subscribe to channel
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`Connected to ${channelName}`);
    }
  });

  return channel;
};

// Broadcast messages
const broadcastUpdate = (channel: any, event: string, payload: any) => {
  channel.send({
    type: 'broadcast',
    event: event,
    payload: payload
  });
};
```

### Real-time Interview System
```typescript
// Real-time interview chat
const useInterviewChat = (interviewId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    const interviewChannel = supabase.channel(`interview-${interviewId}`);

    interviewChannel
      .on('broadcast', { event: 'new-message' }, (payload) => {
        setMessages(prev => [...prev, payload.payload]);
      })
      .on('broadcast', { event: 'interviewer-joined' }, (payload) => {
        console.log('Interviewer joined:', payload);
      })
      .subscribe();

    setChannel(interviewChannel);

    return () => {
      supabase.removeChannel(interviewChannel);
    };
  }, [interviewId]);

  const sendMessage = (message: string) => {
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'new-message',
        payload: {
          id: generateId(),
          text: message,
          sender: user?.id,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  return { messages, sendMessage };
};
```

## External Integrations

### OpenAI API Integration
```typescript
// Through Edge Functions
const useAIAnalysis = () => {
  const analyzeResume = async (resumeText: string, jobDescription: string) => {
    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: {
        resumeText,
        jobDescription
      }
    });

    if (error) throw error;
    return data;
  };

  const generateJobDescription = async (jobDetails: any) => {
    const { data, error } = await supabase.functions.invoke('generate-job-description', {
      body: jobDetails
    });

    if (error) throw error;
    return data;
  };

  return { analyzeResume, generateJobDescription };
};
```

### Email Service Integration
```typescript
// Send emails through Edge Function
const useEmailService = () => {
  const sendOfferEmail = async (offerData: any) => {
    const { data, error } = await supabase.functions.invoke('send-offer-email', {
      body: {
        to: offerData.candidateEmail,
        subject: `Job Offer - ${offerData.position}`,
        html: generateOfferTemplate(offerData),
        type: 'offer_sent'
      }
    });

    if (error) throw error;
    return data;
  };

  const sendInterviewReminder = async (interviewData: any) => {
    const { data, error } = await supabase.functions.invoke('send-offer-email', {
      body: {
        to: interviewData.candidateEmail,
        subject: 'Interview Reminder',
        html: generateInterviewTemplate(interviewData),
        type: 'interview_scheduled'
      }
    });

    if (error) throw error;
    return data;
  };

  return { sendOfferEmail, sendInterviewReminder };
};
```

### Video Conference Integration
```typescript
// Meeting integration
const useMeetingIntegration = () => {
  const createMeeting = async (interviewData: any) => {
    const { data, error } = await supabase.functions.invoke('meeting-integration', {
      body: {
        action: 'create',
        interviewId: interviewData.id,
        scheduledAt: interviewData.scheduledAt,
        duration: interviewData.duration,
        participants: [
          interviewData.candidateEmail,
          interviewData.interviewerEmail
        ]
      }
    });

    if (error) throw error;
    return data;
  };

  return { createMeeting };
};
```

## Error Handling

### Centralized Error Handler
```typescript
interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

const handleApiError = (error: any): ApiError => {
  // Supabase errors
  if (error.code) {
    return {
      message: error.message,
      code: error.code,
      details: error.details
    };
  }

  // Network errors
  if (error.name === 'NetworkError') {
    return {
      message: 'Network connection error. Please check your internet connection.',
      code: 'NETWORK_ERROR'
    };
  }

  // Generic errors
  return {
    message: error.message || 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  };
};

// Usage in components
const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const makeApiCall = async (apiFunction: () => Promise<any>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction();
      return result;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  return { makeApiCall, loading, error };
};
```

### Retry Logic
```typescript
const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`API call failed, attempt ${attempt}/${maxRetries}:`, error);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw new Error('Max retries exceeded');
};
```

## Rate Limiting

### Client-side Rate Limiting
```typescript
class RateLimiter {
  private calls: Map<string, number[]> = new Map();

  canMakeCall(key: string, maxCalls: number, windowMs: number): boolean {
    const now = Date.now();
    const calls = this.calls.get(key) || [];
    
    // Remove calls outside the window
    const validCalls = calls.filter(time => now - time < windowMs);
    
    if (validCalls.length < maxCalls) {
      validCalls.push(now);
      this.calls.set(key, validCalls);
      return true;
    }
    
    return false;
  }
}

const rateLimiter = new RateLimiter();

const useRateLimitedApi = () => {
  const makeAICall = async (functionName: string, payload: any) => {
    const canCall = rateLimiter.canMakeCall(
      `ai-${functionName}`,
      10, // 10 calls
      60000 // per minute
    );

    if (!canCall) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    return await supabase.functions.invoke(functionName, { body: payload });
  };

  return { makeAICall };
};
```

## Testing APIs

### Unit Testing
```typescript
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for testing
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => Promise.resolve({ data: [], error: null })),
    insert: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    update: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    delete: jest.fn(() => Promise.resolve({ data: {}, error: null }))
  })),
  functions: {
    invoke: jest.fn(() => Promise.resolve({ data: {}, error: null }))
  },
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null }))
  }
};

// Test API functions
describe('API Integration', () => {
  test('fetches jobs successfully', async () => {
    const mockData = [{ id: '1', title: 'Software Engineer' }];
    mockSupabase.from().select.mockResolvedValue({ data: mockData, error: null });

    const result = await fetchJobs();
    expect(result).toEqual(mockData);
  });

  test('handles API errors', async () => {
    const mockError = { message: 'Database error', code: 'DB_ERROR' };
    mockSupabase.from().select.mockResolvedValue({ data: null, error: mockError });

    await expect(fetchJobs()).rejects.toThrow('Database error');
  });
});
```

### Integration Testing
```typescript
// Test with actual Supabase instance
describe('Integration Tests', () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createClient(
      process.env.TEST_SUPABASE_URL!,
      process.env.TEST_SUPABASE_ANON_KEY!
    );
  });

  test('creates and retrieves job application', async () => {
    // Create test job
    const { data: job } = await supabase
      .from('jobs')
      .insert({ title: 'Test Job', status: 'published' })
      .select()
      .single();

    // Create test application
    const { data: application } = await supabase
      .from('job_applications')
      .insert({
        job_id: job.id,
        candidate_id: 'test-candidate-id',
        status: 'applied'
      })
      .select()
      .single();

    expect(application.job_id).toBe(job.id);
    expect(application.status).toBe('applied');

    // Cleanup
    await supabase.from('job_applications').delete().eq('id', application.id);
    await supabase.from('jobs').delete().eq('id', job.id);
  });
});
```

## Performance Best Practices

1. **Connection Pooling**: Reuse Supabase client instances
2. **Query Optimization**: Use selective queries with proper indexes
3. **Caching**: Implement response caching for frequently accessed data
4. **Pagination**: Use limit/offset for large datasets
5. **Real-time Optimization**: Subscribe only to necessary changes
6. **Error Recovery**: Implement exponential backoff for retries
7. **Monitoring**: Track API performance and error rates

## Security Considerations

1. **Authentication**: Always verify user authentication
2. **Authorization**: Check user permissions before API calls
3. **Input Validation**: Validate all inputs before sending to APIs
4. **Error Messages**: Don't expose sensitive information in errors
5. **Rate Limiting**: Implement client and server-side rate limiting
6. **HTTPS Only**: All API calls over secure connections
7. **Token Management**: Secure handling of authentication tokens