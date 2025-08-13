export interface RecruitmentMetrics {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  hiredCandidates: number;
  averageTimeToHire: number;
  averageCostPerHire: number;
  conversionRate: number;
  pendingInterviews: number;
}

export interface TimeSeriesData {
  date: string;
  applications: number;
  hires: number;
  interviews: number;
}

export interface JobStatusData {
  status: string;
  count: number;
  percentage: number;
}

export interface ApplicationStatusData {
  status: string;
  count: number;
}

export interface AIMetrics {
  totalScreenings: number;
  averageScore: number;
  highPerformingCandidates: number;
  aiInterviewSessions: number;
  assessmentAccuracy: number;
  processingTime: number;
  automationRate: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface AIPerformanceData {
  date: string;
  averageScore: number;
  totalScreenings: number;
  accuracy: number;
}

export interface InterviewAnalysis {
  sessionId: string;
  candidateName: string;
  aiScore: number;
  humanScore: number;
  accuracy: number;
  date: string;
}

export interface CostMetrics {
  totalRecruitmentCost: number;
  averageCostPerHire: number;
  costPerApplication: number;
  vendorCommissions: number;
  monthlyROI: number;
  costSavings: number;
  budgetUtilization: number;
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface ROITrend {
  month: string;
  cost: number;
  hires: number;
  roi: number;
  savings: number;
}

export interface VendorCosts {
  vendor: string;
  totalCost: number;
  hires: number;
  costPerHire: number;
  performance: number;
}

export interface AnalyticsHookReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}