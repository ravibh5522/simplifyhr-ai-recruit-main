import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Users, Clock, Target, DollarSign } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecruitmentMetrics {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  hiredCandidates: number;
  averageTimeToHire: number;
  averageCostPerHire: number;
  conversionRate: number;
  pendingInterviews: number;
}

interface TimeSeriesData {
  date: string;
  applications: number;
  hires: number;
  interviews: number;
}

interface JobStatusData {
  status: string;
  count: number;
  percentage: number;
}

interface ApplicationStatusData {
  status: string;
  count: number;
}

const RecruitmentAnalytics = () => {
  const [metrics, setMetrics] = useState<RecruitmentMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [jobStatusData, setJobStatusData] = useState<JobStatusData[]>([]);
  const [applicationStatusData, setApplicationStatusData] = useState<ApplicationStatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch basic metrics
      const [jobsQuery, applicationsQuery, interviewsQuery] = await Promise.all([
        supabase.from('jobs').select('*'),
        supabase.from('job_applications').select('*'),
        supabase.from('interviews').select('*'),
      ]);

      if (jobsQuery.error) throw jobsQuery.error;
      if (applicationsQuery.error) throw applicationsQuery.error;
      if (interviewsQuery.error) throw interviewsQuery.error;

      const jobs = jobsQuery.data || [];
      const applications = applicationsQuery.data || [];
      const interviews = interviewsQuery.data || [];

      // Calculate metrics
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter((job: any) => job.status === 'published').length;
      const totalApplications = applications.length;
      const hiredCandidates = applications.filter((app: any) => app.status === 'hired').length;
      const pendingInterviews = interviews.filter((interview: any) => interview.status === 'scheduled').length;

      // Calculate average time to hire (simplified - using applications with 'hired' status)
      const hiredApplications = applications.filter((app: any) => app.status === 'hired');
      const averageTimeToHire = hiredApplications.length > 0 
        ? hiredApplications.reduce((sum: number, app: any) => {
            const hireTime = new Date(app.updated_at).getTime();
            const applyTime = new Date(app.applied_at).getTime();
            return sum + (hireTime - applyTime);
          }, 0) / hiredApplications.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // Calculate average cost per hire (estimated based on job salary ranges)
      const averageCostPerHire = hiredApplications.length > 0
        ? hiredApplications.reduce((sum: number, app: any) => {
            // Try to get salary from related job or use estimated value
            const estimatedSalary = app.jobs?.salary_max || app.jobs?.salary_min || 50000;
            return sum + estimatedSalary;
          }, 0) / hiredApplications.length
        : 0;

      // Calculate conversion rate
      const conversionRate = totalApplications > 0 ? (hiredCandidates / totalApplications) * 100 : 0;

      const metricsData: RecruitmentMetrics = {
        totalJobs,
        activeJobs,
        totalApplications,
        hiredCandidates,
        averageTimeToHire: Math.round(averageTimeToHire),
        averageCostPerHire,
        conversionRate,
        pendingInterviews
      };

      setMetrics(metricsData);

      // Generate time series data (last 30 days)
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

      // offers.filter(offer => offer.status === 'accepted').forEach(offer => {
      //   const date = new Date(offer.updated_at).toISOString().split('T')[0];
      //   if (timeSeriesMap.has(date)) {
      //     timeSeriesMap.get(date)!.hires++;
      //   }
      // });

      interviews.forEach(interview => {
        if ((interview as any).scheduled_at) {
          const date = new Date((interview as any).scheduled_at).toISOString().split('T')[0];
          if (timeSeriesMap.has(date)) {
            timeSeriesMap.get(date)!.interviews++;
          }
        }
      });

      const timeSeriesArray = Array.from(timeSeriesMap.entries()).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString(),
        ...data
      }));

      setTimeSeriesData(timeSeriesArray);

      // Job status distribution
      const statusCounts = jobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const jobStatusArray = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: Math.round((count / totalJobs) * 100)
      }));

      setJobStatusData(jobStatusArray);

      // Application status distribution
      const appStatusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const appStatusArray = Object.entries(appStatusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }));

      setApplicationStatusData(appStatusArray);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{metrics.totalJobs}</p>
              </div>
              <div className="icon-wrapper text-blue-600 bg-gradient-primary">
                <Target className="h-6 w-6 text-white relative z-10" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                {metrics.activeJobs} Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applications</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{metrics.totalApplications}</p>
              </div>
              <div className="icon-wrapper text-green-600 bg-gradient-primary">
                <Users className="h-6 w-6 text-white relative z-10" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">{metrics.conversionRate.toFixed(1)}%</span>
              <span className="text-muted-foreground ml-1">conversion</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hired</p>
                <p className="text-2xl font-bold">{metrics.hiredCandidates}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-muted-foreground">{metrics.averageTimeToHire} days avg</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Cost/Hire</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(metrics.averageCostPerHire)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Clock className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-muted-foreground">{metrics.pendingInterviews} pending interviews</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Recruitment Activity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="applications" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Applications"
                />
                <Line 
                  type="monotone" 
                  dataKey="interviews" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Interviews"
                />
                <Line 
                  type="monotone" 
                  dataKey="hires" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  name="Hires"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Job Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={jobStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {jobStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Application Status */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={applicationStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="status" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Conversion Rate</span>
              <span className="text-sm font-bold">{metrics.conversionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Time to Hire</span>
              <span className="text-sm font-bold">{metrics.averageTimeToHire} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active Jobs</span>
              <span className="text-sm font-bold">{metrics.activeJobs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Pending Interviews</span>
              <span className="text-sm font-bold">{metrics.pendingInterviews}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecruitmentAnalytics;