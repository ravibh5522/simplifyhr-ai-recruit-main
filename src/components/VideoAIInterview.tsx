import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VideoRealtimeChat } from '@/utils/VideoRealtimeChat';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Bot, 
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Phone,
  PhoneOff
} from 'lucide-react';

interface VideoAIInterviewProps {
  interviewId: string;
  trigger?: React.ReactNode;
}

interface InterviewMessage {
  type: string;
  content?: string;
  timestamp: string;
}

const VideoAIInterview = ({ interviewId, trigger }: VideoAIInterviewProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const chatRef = useRef<VideoRealtimeChat | null>(null);

  // Debug logging
  console.log('VideoAIInterview render - interviewStarted:', interviewStarted, 'connectionState:', connectionState, 'isLoading:', isLoading);

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      console.log('Dialog opened - resetting state');
      setInterviewStarted(false);
      setConnectionState('disconnected');
      setIsLoading(false);
      setIsSpeaking(false);
      setMessages([]);
    }
  }, [open]);

  const handleMessage = (event: any) => {
    console.log('Received message:', event);
    
    const message: InterviewMessage = {
      type: event.type,
      content: event.content || event.delta || '',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);

    // Handle different event types
    if (event.type === 'response.audio.delta') {
      setIsSpeaking(true);
    } else if (event.type === 'response.audio.done') {
      setIsSpeaking(false);
    } else if (event.type === 'session.created') {
      console.log('Session created successfully');
    } else if (event.type === 'session.updated') {
      console.log('Session updated successfully');
    }
  };

  const startVideoInterview = async () => {
    setIsLoading(true);
    setConnectionState('connecting');
    
    try {
      console.log('Starting video AI interview...');
      console.log('Interview ID:', interviewId);
      
      // Get ephemeral token from Supabase function with retry logic
      console.log('Calling realtime-video-interview function...');
      
      let data, error;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const response = await supabase.functions.invoke('realtime-video-interview', {
            body: { interviewId }
          });
          
          data = response.data;
          error = response.error;
          
          if (!error) break; // Success, exit retry loop
          
        } catch (fetchError) {
          console.error(`Attempt ${retryCount + 1} failed:`, fetchError);
          error = fetchError;
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Retrying in ${retryCount * 1000}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        }
      }

      console.log('Function response data:', data);
      console.log('Function response error:', error);

      if (error) {
        console.error('Supabase function error after retries:', error);
        throw error;
      }

      console.log('Edge function response:', data);

      if (!data.clientSecret?.value) {
        console.error('Missing client secret in response:', data);
        throw new Error('Failed to get ephemeral token');
      }

      // Initialize video chat with improved connection handling
      chatRef.current = new VideoRealtimeChat(
        handleMessage,
        setConnectionState
      );

      // Add a small delay to ensure proper initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await chatRef.current.init(data.clientSecret.value, localVideoRef.current || undefined);
      
      setInterviewStarted(true);
      
      toast({
        title: "Video Interview Started",
        description: "AI interviewer is ready to conduct the video interview",
      });

    } catch (error: any) {
      console.error('Error starting video interview:', error);
      setConnectionState('disconnected');
      setInterviewStarted(false); // Reset interview state on error
      toast({
        title: "Error",
        description: error.message || 'Failed to start video interview',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetInterview = () => {
    chatRef.current?.disconnect();
    setInterviewStarted(false);
    setConnectionState('disconnected');
    setIsSpeaking(false);
    setMessages([]);
    setIsLoading(false);
  };

  const endInterview = () => {
    chatRef.current?.disconnect();
    setInterviewStarted(false);
    setConnectionState('disconnected');
    setIsSpeaking(false);
    
    toast({
      title: "Interview Ended",
      description: "Video interview has been completed",
    });
  };

  const toggleVideo = () => {
    const videoTrack = chatRef.current?.getLocalVideoStream()?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    const audioTrack = chatRef.current?.getLocalVideoStream()?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const getConnectionStatusColor = (state: string) => {
    switch (state) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const defaultTrigger = (
    <Button variant="default" size="sm">
      <Video className="w-4 h-4 mr-2" />
      Video AI Interview
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Video AI Interview
          </DialogTitle>
          <DialogDescription>
            Conduct a comprehensive video interview with AI interviewer
          </DialogDescription>
        </DialogHeader>

        {/* Connection Status */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionState === 'connected' ? 'bg-green-500' : 
                  connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className={`text-sm font-medium ${getConnectionStatusColor(connectionState)}`}>
                  {connectionState === 'connected' ? 'Connected' : 
                   connectionState === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
              
              {isSpeaking && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  AI Speaking...
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Video Interface */}
        <div className="flex-1 flex gap-4">
          {/* Local Video */}
          <Card className="w-1/2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Your Video</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <VideoOff className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Interview Status */}
          <Card className="w-1/2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Interviewer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 aspect-video flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">AI Interviewer</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {isSpeaking ? 'Speaking...' : 'Listening...'}
                </p>
                {isSpeaking && (
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mt-4">
          <CardContent className="p-4">
            {(() => {
              console.log('Button render logic - interviewStarted:', interviewStarted);
              return !interviewStarted ? (
                <div className="text-center">
                  <Button
                    onClick={startVideoInterview}
                    disabled={isLoading}
                    size="lg"
                    className="px-8"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Start Video Interview
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click to begin your AI-powered video interview
                  </p>
                </div>
              ) : (
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant={isVideoEnabled ? "default" : "secondary"}
                    size="sm"
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant={isAudioEnabled ? "default" : "secondary"}
                    size="sm"
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                  
                  {/* Show reset button if disconnected */}
                  {connectionState === 'disconnected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetInterview}
                    >
                      Reset
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {/* Show retry button if disconnected */}
                  {connectionState === 'disconnected' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={startVideoInterview}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4" /> : 'Retry'}
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={endInterview}
                  >
                    <PhoneOff className="w-4 h-4 mr-2" />
                    End Interview
                  </Button>
                </div>
              </div>
            );
            })()}
          </CardContent>
        </Card>

        {/* Interview Messages */}
        {messages.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Interview Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-32 overflow-y-auto">
              <div className="space-y-2">
                {messages.slice(-5).map((message, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    <span className="font-medium">{message.type}:</span> {message.content}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VideoAIInterview;