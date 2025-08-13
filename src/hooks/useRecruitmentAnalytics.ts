import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  RecruitmentMetrics, 
  TimeSeriesData, 
  JobStatusData, 
  ApplicationStatusData,
  AnalyticsHookReturn 
} from '@/types/analytics';

interface RecruitmentAnalyticsData {
  metrics: RecruitmentMetrics;
  timeSeriesData: TimeSeriesData[];
  jobStatusData: JobStatusData[];
  applicationStatusData: ApplicationStatusData[];
}

export const useRecruitmentAnalytics = (): AnalyticsHookReturn<RecruitmentAnalyticsData> => {
  const [data, setData] = useState<RecruitmentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all required data
      const [jobsResult, applicationsResult, interviewsResult, offersResult] = await Promise.all([
        supabase.from('jobs').select('*'),
        supabase.from('job_applications').select('*'),
        supabase.from('interviews').select('*'),
        supabase.from('offers').select('*')
      ]);

      if (jobsResult.error) throw jobsResult.error;
      if (applicationsResult.error) throw applicationsResult.error;
      if (interviewsResult.error) throw interviewsResult.error;
      if (offersResult.error) throw offersResult.error;

      const jobs = jobsResult.data || [];
      const applications = applicationsResult.data || [];
      const interviews = interviewsResult.data || [];
      const offers = offersResult.data || [];

      // Calculate metrics
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter(job => job.status === 'published').length;
      const totalApplications = applications.length;
      const hiredCandidates = offers.filter(offer => offer.status === 'accepted').length;
      const pendingInterviews = interviews.filter(interview => interview.status === 'scheduled').length;

      // Calculate average time to hire
      const completedOffers = offers.filter(offer => offer.status === 'accepted');
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

      // Calculate average cost per hire
      const averageCostPerHire = completedOffers.length > 0
        ? completedOffers.reduce((sum, offer) => sum + (offer.salary_amount || 0), 0) / completedOffers.length
        : 0;

      // Calculate conversion rate
      const conversionRate = totalApplications > 0 ? (hiredCandidates / totalApplications) * 100 : 0;

      const metrics: RecruitmentMetrics = {
        totalJobs,
        activeJobs,
        totalApplications,
        hiredCandidates,
        averageTimeToHire: Math.round(averageTimeToHire),
        averageCostPerHire,
        conversionRate,
        pendingInterviews
      };

      // Generate time series data
      const timeSeriesMap = new Map<string, { applications: number; hires: number; interviews: number }>();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        timeSeriesMap.set(dateStr, { applications: 0, hires: 0, interviews: 0 });
      }

      applications.forEach(app => {
        const date = new Date(app.applied_at).toISOString().split('T')[0];
        if (timeSeriesMap.has(date)) {
          timeSeriesMap.get(date)!.applications++;
        }
      });

      offers.filter(offer => offer.status === 'accepted').forEach(offer => {
        const date = new Date(offer.updated_at).toISOString().split('T')[0];
        if (timeSeriesMap.has(date)) {
          timeSeriesMap.get(date)!.hires++;
        }
      });

      interviews.forEach(interview => {
        if (interview.scheduled_at) {
          const date = new Date(interview.scheduled_at).toISOString().split('T')[0];
          if (timeSeriesMap.has(date)) {
            timeSeriesMap.get(date)!.interviews++;
          }
        }
      });

      const timeSeriesData = Array.from(timeSeriesMap.entries()).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString(),
        ...data
      }));

      // Job status distribution
      const statusCounts = jobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const jobStatusData = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: Math.round((count / totalJobs) * 100)
      }));

      // Application status distribution
      const appStatusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const applicationStatusData = Object.entries(appStatusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }));

      setData({
        metrics,
        timeSeriesData,
        jobStatusData,
        applicationStatusData
      });

    } catch (error) {
      console.error('Error fetching recruitment analytics:', error);
      const errorMessage = 'Failed to load recruitment analytics';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};