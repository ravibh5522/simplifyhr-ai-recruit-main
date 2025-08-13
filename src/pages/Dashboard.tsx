import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';
import ClientDashboard from '@/components/dashboards/ClientDashboard';
import VendorDashboard from '@/components/dashboards/VendorDashboard';
import CandidateDashboard from '@/components/dashboards/CandidateDashboard';
import InterviewerDashboard from '@/components/dashboards/InterviewerDashboard';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Loader2, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary animate-pulse" />
              <Loader2 className="w-6 h-6 ml-2 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Loading Dashboard...</h1>
            <p className="text-muted-foreground">Please wait while we prepare your workspace</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-96 rounded-lg lg:col-span-2" />
              <Skeleton className="h-96 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/60 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary-foreground animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Setting up your profile...</h2>
              <p className="text-muted-foreground mb-4">Please wait while we complete your account setup.</p>
              <div className="flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  switch (profile.role) {
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <ClientDashboard />;
    case 'vendor':
      return <VendorDashboard />;
    case 'interviewer':
      return <InterviewerDashboard />;
    case 'candidate':
      return <CandidateDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-6">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-destructive to-destructive/60 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-destructive-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Invalid Role</h2>
                <p className="text-muted-foreground mb-4">Your account role "{profile.role}" is not recognized. Please contact support for assistance.</p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Role: <span className="font-mono text-foreground">{profile.role}</span></p>
                  <p className="text-sm text-muted-foreground">Email: <span className="font-mono text-foreground">{profile.email}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
  }
};

export default Dashboard;