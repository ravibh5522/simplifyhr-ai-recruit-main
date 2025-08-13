import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AIInterviewChat from './AIInterviewChat';
import VideoAIInterview from './VideoAIInterview';
import { 
  Video, 
  Calendar, 
  Bot, 
  FileText, 
  Users, 
  Loader2,
  ExternalLink,
  MessageSquare,
  Zap,
  Camera
} from 'lucide-react';

interface MeetingIntegrationProps {
  interviewId: string;
  jobDescription?: string;
  resumeText?: string;
  trigger?: React.ReactNode;
}

const MeetingIntegration = ({ 
  interviewId, 
  jobDescription = '', 
  resumeText = '', 
  trigger 
}: MeetingIntegrationProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [meetingDetails, setMeetingDetails] = useState<any>(null);
  const [aiInterview, setAiInterview] = useState<any>(null);
  const [jobDesc, setJobDesc] = useState(jobDescription);
  const [resume, setResume] = useState(resumeText);

  const createMeeting = async (platform: string) => {
    setIsLoading(true);
    setCurrentAction(`Creating ${platform} meeting...`);

    try {
      const { data, error } = await supabase.functions.invoke('meeting-integration', {
        body: {
          action: 'create_meeting',
          interviewId,
          platform
        }
      });

      if (error) throw error;

      setMeetingDetails(data);
      toast({
        title: "Meeting Created",
        description: `${data.meetingInfo.platform} meeting created successfully`,
      });
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create meeting",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCurrentAction('');
    }
  };

  const startAIInterview = async () => {
    setIsLoading(true);
    setCurrentAction('Preparing AI interview...');

    try {
      const { data, error } = await supabase.functions.invoke('meeting-integration', {
        body: {
          action: 'start_ai_interview',
          interviewId,
          jobDescription: jobDesc,
          resumeText: resume
        }
      });

      if (error) throw error;

      setAiInterview(data);
      toast({
        title: "AI Interview Ready",
        description: data.message || "Advanced AI interviewer is ready to conduct the interview",
      });
    } catch (error: any) {
      console.error('Error starting AI interview:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to start AI interview",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setCurrentAction('');
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Video className="w-4 h-4 mr-2" />
      Meeting Setup
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Interview Meeting Integration
          </DialogTitle>
          <DialogDescription>
            Create meeting links and set up AI-powered interviews
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meeting Platform Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Create Meeting
              </CardTitle>
              <CardDescription>
                Generate meeting links for popular video conferencing platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => createMeeting('teams')}
                  disabled={isLoading}
                  className="h-20 flex flex-col gap-2"
                  variant="outline"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span>Microsoft Teams</span>
                </Button>

                <Button
                  onClick={() => createMeeting('zoom')}
                  disabled={isLoading}
                  className="h-20 flex flex-col gap-2"
                  variant="outline"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                  <span>Zoom</span>
                </Button>

                <Button
                  onClick={() => createMeeting('googlemeet')}
                  disabled={isLoading}
                  className="h-20 flex flex-col gap-2"
                  variant="outline"
                >
                  <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                  <span>Google Meet</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Meeting Details */}
          {meetingDetails && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Meeting Created Successfully</CardTitle>
                <CardDescription className="text-green-600">
                  {meetingDetails.meetingInfo.platform} meeting is ready
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Interview Details</Label>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><strong>Candidate:</strong> {meetingDetails.interviewDetails.candidate}</p>
                      <p><strong>Position:</strong> {meetingDetails.interviewDetails.position}</p>
                      <p><strong>Company:</strong> {meetingDetails.interviewDetails.company}</p>
                      <p><strong>Duration:</strong> {meetingDetails.interviewDetails.duration} minutes</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Meeting Info</Label>
                    <div className="mt-2 space-y-2">
                      <Button 
                        asChild 
                        size="sm" 
                        className="w-full"
                      >
                        <a href={meetingDetails.meetingUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Join Meeting
                        </a>
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {meetingDetails.meetingInfo.instructions}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Interview Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI Interview Setup
              </CardTitle>
              <CardDescription>
                Set up an advanced AI-powered interviewer with comprehensive evaluation capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobDescription">Job Description (Optional)</Label>
                  <Textarea
                    id="jobDescription"
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Job description will be auto-loaded from database..."
                    className="min-h-24"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use job description from database
                  </p>
                </div>
                <div>
                  <Label htmlFor="resume">Candidate Resume (Optional)</Label>
                  <Textarea
                    id="resume"
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                    placeholder="Resume will be auto-loaded from database..."
                    className="min-h-24"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use resume from database
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  onClick={startAIInterview}
                  disabled={isLoading}
                  className="flex-1"
                  variant="outline"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Basic AI Chat
                </Button>
                
                <AIInterviewChat 
                  interviewId={interviewId}
                  trigger={
                    <Button className="flex-1" variant="outline">
                      <Zap className="w-4 h-4 mr-2" />
                      Advanced Text Interview
                    </Button>
                  }
                />

                <VideoAIInterview 
                  interviewId={interviewId}
                  trigger={
                    <Button className="flex-1">
                      <Camera className="w-4 h-4 mr-2" />
                      Video AI Interview
                    </Button>
                  }
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Video AI Interview Features</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      • Real-time video communication with AI interviewer<br/>
                      • Natural conversation flow with voice interaction<br/>
                      • Visual assessment and body language analysis<br/>
                      • Professional video interview experience<br/>
                      • Automatic transcription and evaluation
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Interview Ready */}
          {aiInterview && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">AI Interviewer Ready</CardTitle>
                <CardDescription className="text-blue-600">
                  AI interviewer is prepared to conduct the interview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white rounded-lg border">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    AI Interviewer's Opening
                  </Label>
                  <p className="mt-2 text-sm leading-relaxed">{aiInterview.aiGreeting}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Interview Details</Label>
                    <div className="mt-1 space-y-1 text-muted-foreground">
                      <p><strong>Candidate:</strong> {aiInterview.interviewContext.candidate}</p>
                      <p><strong>Position:</strong> {aiInterview.interviewContext.position}</p>
                      <p><strong>Company:</strong> {aiInterview.interviewContext.company}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="font-medium">Next Steps</Label>
                    <div className="mt-1 space-y-1 text-muted-foreground">
                      <p>• Join the meeting using the link above</p>
                      <p>• The AI will conduct a structured interview</p>
                      <p>• Interview will be recorded for evaluation</p>
                      <p>• Feedback will be provided afterwards</p>
                    </div>
                  </div>
                </div>

                <Badge variant="secondary" className="w-fit">
                  Interview ID: {aiInterview.interviewContext.interviewId}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-yellow-600" />
                  <span className="text-yellow-800">{currentAction}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingIntegration;