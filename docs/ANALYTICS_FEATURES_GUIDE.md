# Analytics Features Guide

## Overview
This document provides a comprehensive guide to the analytics features implemented in the recruitment platform, including data sources, metrics, visualizations, and usage patterns.

## Table of Contents
1. [Analytics Dashboard Overview](#analytics-dashboard-overview)
2. [Recruitment Performance Analytics](#recruitment-performance-analytics)
3. [AI Performance Analytics](#ai-performance-analytics)
4. [Cost & ROI Analytics](#cost--roi-analytics)
5. [Data Sources & Integration](#data-sources--integration)
6. [Real-time Updates](#real-time-updates)
7. [Export & Reporting](#export--reporting)
8. [Implementation Details](#implementation-details)

## Analytics Dashboard Overview

### Main Dashboard Components
The analytics dashboard is organized into three main sections:

1. **Recruitment Performance** - Job posting and hiring metrics
2. **AI Performance** - AI system effectiveness and accuracy
3. **Cost & ROI** - Financial metrics and return on investment

### Access Control
- **Super Admin**: Full access to all analytics across all clients
- **Client**: Access to their own recruitment data and metrics
- **Vendor**: Limited access to performance metrics for assigned jobs
- **Candidate**: No access to analytics dashboard

### Navigation Structure
```
Analytics Dashboard
├── Recruitment Performance
│   ├── Key Metrics Overview
│   ├── Time Series Analysis
│   ├── Job Status Distribution
│   └── Application Flow Analysis
├── AI Performance
│   ├── Screening Accuracy
│   ├── Score Distribution
│   ├── Interview Analysis
│   └── Performance Trends
└── Cost & ROI
    ├── Cost Breakdown
    ├── ROI Trends
    ├── Vendor Performance
    └── Budget Utilization
```

## Recruitment Performance Analytics

### Key Metrics

#### Primary KPIs
```typescript
interface RecruitmentMetrics {
  totalJobs: number;           // Total jobs posted
  activeJobs: number;          // Currently active job postings
  totalApplications: number;   // Total applications received
  hiredCandidates: number;     // Successfully hired candidates
  averageTimeToHire: number;   // Days from job posting to hire
  averageCostPerHire: number;  // Financial cost per successful hire
  conversionRate: number;      // Applications to hires percentage
  pendingInterviews: number;   // Scheduled interviews awaiting completion
}
```

#### Calculation Methods
```typescript
// Conversion Rate Calculation
const conversionRate = totalApplications > 0 
  ? (hiredCandidates / totalApplications) * 100 
  : 0;

// Average Time to Hire
const averageTimeToHire = completedOffers.length > 0 
  ? completedOffers.reduce((sum, offer) => {
      const application = applications.find(app => app.id === offer.application_id);
      if (application) {
        const hireTime = new Date(offer.updated_at).getTime();
        const applyTime = new Date(application.applied_at).getTime();
        return sum + (hireTime - applyTime) / (1000 * 60 * 60 * 24);
      }
      return sum;
    }, 0) / completedOffers.length
  : 0;
```

### Visualizations

#### Time Series Analysis
- **Applications Trend**: Daily application volume over time
- **Hiring Trend**: Successful hires by date
- **Interview Activity**: Interview scheduling patterns

```typescript
interface TimeSeriesData {
  date: string;
  applications: number;
  hires: number;
  interviews: number;
}
```

#### Job Status Distribution
```typescript
interface JobStatusData {
  status: string;      // 'draft', 'published', 'closed', 'expired'
  count: number;       // Number of jobs in this status
  percentage: number;  // Percentage of total jobs
}
```

#### Application Status Flow
```typescript
interface ApplicationStatusData {
  status: string;  // 'applied', 'screening', 'interview', 'selected', 'rejected'
  count: number;   // Number of applications in this status
}
```

### Data Sources
- `jobs` table: Job posting information and status
- `job_applications` table: Application submissions and status changes
- `interviews` table: Interview scheduling and outcomes
- `offers` table: Job offers and acceptances

## AI Performance Analytics

### AI Metrics

#### Core AI Performance Indicators
```typescript
interface AIMetrics {
  totalScreenings: number;        // Total AI resume screenings performed
  averageScore: number;           // Average AI screening score
  highPerformingCandidates: number; // Candidates with score >= 80
  aiInterviewSessions: number;    // AI-conducted interview sessions
  assessmentAccuracy: number;     // AI vs human score correlation
  processingTime: number;         // Average AI processing time
  automationRate: number;         // Percentage of automated processes
}
```

#### Assessment Accuracy Calculation
```typescript
// Compare AI scores with human interviewer scores
const assessmentAccuracy = interviewsWithBothScores.length > 0
  ? interviewsWithBothScores.reduce((sum, interview) => {
      const aiScore = interview.ai_score || 0;
      const humanScore = interview.interviewer_score || 0;
      const accuracy = 100 - Math.abs(aiScore - humanScore);
      return sum + Math.max(0, accuracy);
    }, 0) / interviewsWithBothScores.length
  : 0;
```

### AI Score Distribution

#### Score Range Analysis
```typescript
interface ScoreDistribution {
  range: string;     // '0-20', '21-40', '41-60', '61-80', '81-100'
  count: number;     // Number of candidates in this range
  percentage: number; // Percentage of total screenings
}
```

#### AI vs Human Scoring Correlation
```typescript
interface InterviewAnalysis {
  sessionId: string;
  candidateName: string;
  aiScore: number;
  humanScore: number;
  accuracy: number;
  date: string;
}
```

### AI Performance Trends
- **Daily Performance**: AI accuracy and processing metrics over time
- **Score Reliability**: Consistency of AI scoring
- **Processing Efficiency**: Speed improvements and optimizations

### Data Sources
- `job_applications` table: AI screening scores and notes
- `interviews` table: AI vs human scoring comparisons
- `ai_interview_sessions` table: AI interview performance data

## Cost & ROI Analytics

### Financial Metrics

#### Core Cost Indicators
```typescript
interface CostMetrics {
  totalRecruitmentCost: number;   // Total platform and recruitment costs
  averageCostPerHire: number;     // Cost divided by successful hires
  costPerApplication: number;     // Cost per application processed
  vendorCommissions: number;      // Total vendor commission payments
  monthlyROI: number;            // Return on investment percentage
  costSavings: number;           // Savings vs traditional recruitment
  budgetUtilization: number;     // Percentage of budget used
}
```

#### Cost Calculation Components
```typescript
// Vendor Commissions
const vendorCommissions = totalSalaryPaid * (avgVendorCommission / 100);

// Platform Costs (estimated)
const platformCosts = totalHires * 500000; // IDR 500k per hire

// Total Recruitment Cost
const totalRecruitmentCost = vendorCommissions + platformCosts;

// ROI Calculation
const estimatedValuePerHire = 5000000; // IDR 5M per hire
const totalValue = totalHires * estimatedValuePerHire;
const monthlyROI = totalRecruitmentCost > 0 
  ? ((totalValue - totalRecruitmentCost) / totalRecruitmentCost) * 100 
  : 0;
```

### Cost Breakdown Analysis
```typescript
interface CostBreakdown {
  category: string;    // 'Vendor Commissions', 'Platform Costs', 'AI Processing', 'Other'
  amount: number;      // Cost amount in IDR
  percentage: number;  // Percentage of total cost
}
```

### ROI Trends
```typescript
interface ROITrend {
  month: string;
  cost: number;
  hires: number;
  roi: number;
  savings: number;
}
```

### Vendor Performance Analysis
```typescript
interface VendorCosts {
  vendor: string;
  totalCost: number;
  hires: number;
  costPerHire: number;
  performance: number;  // Success rate percentage
}
```

### Data Sources
- `offers` table: Salary and compensation data
- `vendors` table: Commission rates and performance metrics
- `jobs` table: Budget information and requirements

## Data Sources & Integration

### Primary Data Tables
1. **jobs**: Job postings, budgets, and requirements
2. **job_applications**: Application submissions and AI scores
3. **candidates**: Candidate profiles and skills
4. **interviews**: Interview scheduling and outcomes
5. **offers**: Job offers and acceptance rates
6. **offer_workflow**: Hiring process stages
7. **vendors**: Vendor performance and costs

### Data Refresh Strategy
```typescript
// Real-time data fetching hook
const useAnalyticsData = () => {
  const [loading, setLoading] = useState(true);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Parallel data fetching for performance
      const [jobsResult, applicationsResult, interviewsResult, offersResult] = 
        await Promise.all([
          supabase.from('jobs').select('*'),
          supabase.from('job_applications').select('*'),
          supabase.from('interviews').select('*'),
          supabase.from('offers').select('*')
        ]);
      
      // Process and calculate metrics
      calculateMetrics(jobsResult.data, applicationsResult.data, /* ... */);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, refetch: fetchData };
};
```

### Caching Strategy
- **Client-side caching**: React Query for data caching
- **Computation caching**: Memoized expensive calculations
- **Incremental updates**: Only recalculate changed data

## Real-time Updates

### Subscription Setup
```typescript
// Real-time analytics updates
useEffect(() => {
  const channel = supabase
    .channel('analytics-updates')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'job_applications' 
    }, (payload) => {
      // Update application metrics in real-time
      updateApplicationMetrics(payload.new);
    })
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'offers' 
    }, (payload) => {
      // Update hiring metrics when offers are accepted
      if (payload.new.status === 'accepted') {
        updateHiringMetrics(payload.new);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### Live Data Indicators
- **Last Updated**: Timestamp of most recent data refresh
- **Live Indicators**: Visual indicators for real-time updates
- **Auto-refresh**: Configurable automatic data refresh intervals

## Export & Reporting

### Export Formats
1. **CSV Export**: Raw data for external analysis
2. **PDF Reports**: Formatted reports for presentations
3. **Excel Workbooks**: Multi-sheet analysis files
4. **JSON Data**: API-friendly data format

### Report Generation
```typescript
const generateAnalyticsReport = async (dateRange: DateRange, format: ExportFormat) => {
  const data = await fetchAnalyticsData(dateRange);
  
  switch (format) {
    case 'pdf':
      return generatePDFReport(data);
    case 'csv':
      return generateCSVExport(data);
    case 'excel':
      return generateExcelWorkbook(data);
    default:
      return data;
  }
};
```

### Scheduled Reports
- **Daily Summaries**: Key metrics sent via email
- **Weekly Reports**: Comprehensive performance analysis
- **Monthly Reviews**: Detailed ROI and cost analysis
- **Custom Reports**: User-defined metrics and timeframes

## Implementation Details

### Component Architecture
```
AdvancedAnalyticsDashboard
├── RecruitmentAnalytics
│   ├── useRecruitmentAnalytics (hook)
│   ├── MetricsCards
│   ├── TimeSeriesChart
│   └── StatusDistribution
├── AIPerformanceAnalytics
│   ├── useAIAnalytics (hook)
│   ├── PerformanceMetrics
│   ├── ScoreDistribution
│   └── AccuracyCorrelation
└── CostROIAnalytics
    ├── useCostAnalytics (hook)
    ├── CostBreakdown
    ├── ROITrends
    └── VendorAnalysis
```

### Custom Hooks
```typescript
// Reusable analytics hooks
export const useRecruitmentAnalytics = () => {
  // Data fetching and processing logic
  return { data, loading, error, refetch };
};

export const useAIAnalytics = () => {
  // AI performance calculations
  return { metrics, trends, accuracy, loading };
};

export const useCostAnalytics = () => {
  // Financial metrics and ROI calculations
  return { costs, roi, savings, utilization, loading };
};
```

### Chart Components
```typescript
// Reusable chart containers
const ChartContainer = ({ title, children, height = 300 }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </CardContent>
  </Card>
);
```

### Performance Optimizations
1. **Lazy Loading**: Charts load only when visible
2. **Data Pagination**: Large datasets split into pages
3. **Memoization**: Expensive calculations cached
4. **Virtual Scrolling**: Efficient rendering of large lists
5. **Debounced Updates**: Reduced API calls during rapid changes

### Error Handling
```typescript
const AnalyticsErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <Card>
        <CardContent className="text-center p-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Analytics Unavailable</h3>
          <p className="text-muted-foreground mb-4">
            Unable to load analytics data. Please try refreshing the page.
          </p>
          <Button onClick={() => setHasError(false)}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return children;
};
```

## Usage Guidelines

### Best Practices
1. **Regular Monitoring**: Check analytics daily for trends
2. **Comparative Analysis**: Compare periods for insights
3. **Action-Oriented**: Use data to drive recruitment decisions
4. **Stakeholder Sharing**: Share relevant metrics with team members
5. **Continuous Improvement**: Adjust strategies based on analytics

### Common Use Cases
1. **Performance Review**: Monthly/quarterly performance analysis
2. **Budget Planning**: Cost analysis for budget allocation
3. **Process Optimization**: Identify bottlenecks in hiring process
4. **Vendor Evaluation**: Assess vendor performance and ROI
5. **AI Tuning**: Improve AI algorithms based on accuracy metrics

### Troubleshooting
1. **Data Discrepancies**: Check data refresh timestamps
2. **Loading Issues**: Verify network connectivity
3. **Permission Errors**: Confirm user role and access rights
4. **Chart Rendering**: Check browser compatibility
5. **Export Problems**: Validate data format and size limits