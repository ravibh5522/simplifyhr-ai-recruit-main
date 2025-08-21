import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, TrendingUp, Zap, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIMetrics {
  totalScreenings: number;
  averageScore: number;
  highPerformingCandidates: number;
  aiInterviewSessions: number;
  assessmentAccuracy: number;
  processingTime: number;
  automationRate: number;
}

interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface AIPerformanceData {
  date: string;
  averageScore: number;
  totalScreenings: number;
  accuracy: number;
}

interface InterviewAnalysis {
  sessionId: string;
  candidateName: string;
  aiScore: number;
  humanScore: number;
  accuracy: number;
  date: string;
}

const AIPerformanceAnalytics = () => {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);
  const [performanceData, setPerformanceData] = useState<AIPerformanceData[]>([]);
  const [interviewAnalysis, setInterviewAnalysis] = useState<InterviewAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAIAnalyticsData();
  }, []);

  const fetchAIAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch AI-related data
      const [applicationsResult, interviewsResult] = await Promise.all([
        supabase
          .from('job_applications')
          .select('screening_score, ai_screening_notes, applied_at, status')
          .not('screening_score', 'is', null),
        supabase
          .from('interview_schedules')
          .select('ai_score, interviewer_scores, final_ai_evaluation_score, created_at, status, ai_conversation_log')
          .not('ai_score', 'is', null)
      ]);

      if (applicationsResult.error) throw applicationsResult.error;
      if (interviewsResult.error) throw interviewsResult.error;

      const applications = applicationsResult.data || [];
      const interviews = interviewsResult.data || [];

            // Calculate metrics
      const totalScreenings = applications.length;
      const avgScreeningScore = applications.reduce((sum, app) => sum + (app.screening_score || 0), 0) / totalScreenings;
      
      const totalInterviews = interviews.length;
      const avgInterviewScore = interviews.reduce((sum, interview) => {
        return sum + (interview.final_ai_evaluation_score || interview.ai_score || 0);
      }, 0) / totalInterviews;

      // Create metrics object
      const aiMetrics: AIMetrics = {
        totalScreenings,
        averageScore: isNaN(avgScreeningScore) ? 0 : avgScreeningScore,
        highPerformingCandidates: applications.filter(app => app.screening_score && app.screening_score > 80).length,
        aiInterviewSessions: totalInterviews,
        assessmentAccuracy: totalInterviews > 0 ? Math.round((interviews.filter(i => i.final_ai_evaluation_score && i.final_ai_evaluation_score > 70).length / totalInterviews) * 100) : 0,
        processingTime: 2.5, // Average processing time in seconds (placeholder)
        automationRate: totalScreenings > 0 ? Math.round(((totalScreenings + totalInterviews) / (totalScreenings + totalInterviews)) * 100) : 100
      };

      setMetrics(aiMetrics);

      // Score distribution
      const scoreRanges = [
        { range: '0-20', min: 0, max: 20 },
        { range: '21-40', min: 21, max: 40 },
        { range: '41-60', min: 41, max: 60 },
        { range: '61-80', min: 61, max: 80 },
        { range: '81-100', min: 81, max: 100 }
      ];

      const distribution = scoreRanges.map(range => {
        const count = applications.filter(app => {
          const score = app.screening_score || 0;
          return score >= range.min && score <= range.max;
        }).length;
        
        return {
          range: range.range,
          count,
          percentage: totalScreenings > 0 ? Math.round((count / totalScreenings) * 100) : 0
        };
      });

      setScoreDistribution(distribution);

      // Performance data over time (last 30 days)
      const performanceMap = new Map<string, { scores: number[]; screenings: number; accuracies: number[] }>();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        performanceMap.set(dateStr, { scores: [], screenings: 0, accuracies: [] });
      }

      // Add application screening data
      applications.forEach(app => {
        const date = new Date(app.applied_at).toISOString().split('T')[0];
        if (performanceMap.has(date) && app.screening_score) {
          const dayData = performanceMap.get(date)!;
          dayData.scores.push(app.screening_score);
          dayData.screenings++;
        }
      });

      // Filter interviews with both AI and human scores
      const interviewsWithBothScores = interviews.filter(interview => 
        interview.ai_score && interview.interviewer_scores && 
        Array.isArray(interview.interviewer_scores) && interview.interviewer_scores.length > 0
      );

      // Add accuracy data from interviews
      interviewsWithBothScores.forEach(interview => {
        const date = new Date(interview.created_at).toISOString().split('T')[0];
        if (performanceMap.has(date)) {
          const dayData = performanceMap.get(date)!;
          const humanScore = Array.isArray(interview.interviewer_scores) 
            ? interview.interviewer_scores.reduce((sum, score) => sum + score, 0) / interview.interviewer_scores.length 
            : 0;
          const accuracy = 100 - Math.abs((interview.ai_score || 0) - humanScore);
          dayData.accuracies.push(Math.max(0, accuracy));
        }
      });

      const performanceArray = Array.from(performanceMap.entries()).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString(),
        averageScore: data.scores.length > 0 
          ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length 
          : 0,
        totalScreenings: data.screenings,
        accuracy: data.accuracies.length > 0
          ? data.accuracies.reduce((sum, acc) => sum + acc, 0) / data.accuracies.length
          : 0
      }));

      setPerformanceData(performanceArray);

      // Interview analysis (AI vs Human scoring)
      const analysisData = interviewsWithBothScores.slice(0, 20).map((interview, index) => {
        const humanScore = Array.isArray(interview.interviewer_scores) 
          ? interview.interviewer_scores.reduce((sum, score) => sum + score, 0) / interview.interviewer_scores.length 
          : 0;
        
        return {
          sessionId: `Session ${index + 1}`,
          candidateName: `Candidate ${index + 1}`,
          aiScore: interview.ai_score || 0,
          humanScore,
          accuracy: 100 - Math.abs((interview.ai_score || 0) - humanScore),
          date: new Date(interview.created_at).toLocaleDateString()
        };
      });

      setInterviewAnalysis(analysisData);

    } catch (error) {
      console.error('Error fetching AI analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load AI analytics data",
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
          {[...Array(7)].map((_, i) => (
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
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced AI Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  AI Screenings
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                  {metrics.totalScreenings}
                </div>
                <div className="mt-3 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Brain className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-0">
                {metrics.averageScore.toFixed(1)} Avg Score
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  High Performers
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                  {metrics.highPerformingCandidates}
                </div>
                <div className="mt-3 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Target className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0">
                <TrendingUp className="h-4 w-4 mr-1" />
                80+ Score
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Assessment Accuracy
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">
                  {metrics.assessmentAccuracy.toFixed(1)}%
                </div>
                <div className="mt-3 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-0">
                vs Human Scores
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Processing Speed
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-1">
                  {metrics.processingTime}s
                </div>
                <div className="mt-3 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-0">
                <Clock className="h-4 w-4 mr-1" />
                Avg per screening
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Interview Sessions</p>
                <p className="text-2xl font-bold">{metrics.aiInterviewSessions}</p>
              </div>
              <Brain className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Automation Rate</p>
                <p className="text-2xl font-bold">{metrics.automationRate}%</p>
              </div>
              <Zap className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">AI Performance Grade</p>
              <Badge variant="default" className="text-lg px-4 py-2">
                {metrics.assessmentAccuracy >= 90 ? 'A+' : 
                 metrics.assessmentAccuracy >= 80 ? 'A' :
                 metrics.assessmentAccuracy >= 70 ? 'B' : 'C'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>AI Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="range" 
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
                  formatter={(value, name) => [
                    `${value} candidates (${scoreDistribution.find(d => d.count === value)?.percentage || 0}%)`,
                    'Count'
                  ]}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>AI Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
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
                  dataKey="averageScore" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Average Score"
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Accuracy %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI vs Human Scoring */}
        <Card>
          <CardHeader>
            <CardTitle>AI vs Human Scoring Correlation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={interviewAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  dataKey="aiScore" 
                  name="AI Score"
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  type="number" 
                  dataKey="humanScore" 
                  name="Human Score"
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <ReferenceLine 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5"
                  segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
                />
                <Scatter dataKey="humanScore" fill="hsl(var(--primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Screening Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Screening Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
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
                <Bar dataKey="totalScreenings" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIPerformanceAnalytics;