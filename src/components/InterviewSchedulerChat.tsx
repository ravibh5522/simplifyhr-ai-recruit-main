import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Bot, 
  Send, 
  Calendar, 
  Clock, 
  User, 
  MessageSquare,
  Loader2,
  CalendarCheck,
  Briefcase
} from 'lucide-react';

interface InterviewSchedulerChatProps {
  jobId: string;
  applicationId: string;
  trigger?: React.ReactNode;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionCall?: {
    name: string;
    arguments: any;
    result: string;
  };
}

const InterviewSchedulerChat = ({ jobId, applicationId, trigger }: InterviewSchedulerChatProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [applicationData, setApplicationData] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetchInitialData();
    }
  }, [open]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchInitialData = async () => {
    try {
      // Get job details
      const { data: job } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (name, industry),
          interview_rounds (*)
        `)
        .eq('id', jobId)
        .single();

      // Get application details
      const { data: application } = await supabase
        .from('job_applications')
        .select(`
          *,
          candidates (first_name, last_name, email, phone)
        `)
        .eq('id', applicationId)
        .single();

      setJobData(job);
      setApplicationData(application);

      // Add initial greeting message
      if (messages.length === 0) {
        const greetingMessage: Message = {
          id: 'greeting',
          role: 'assistant',
          content: `Hello! I'm your AI interview scheduling assistant. I can help you schedule interviews for ${application?.candidates?.first_name} ${application?.candidates?.last_name} for the ${job?.title} position at ${job?.companies?.name}.

What would you like to do today?
• Schedule an interview
• Check availability
• Send calendar invites
• View interview rounds
• Get interview preparation info`,
          timestamp: new Date()
        };
        setMessages([greetingMessage]);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load interview data",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`Sending interview scheduler message (attempt ${retryCount + 1}/${maxRetries}):`, messageToSend);

        const { data, error } = await supabase.functions.invoke('interview-scheduler-chat', {
          body: {
            message: messageToSend,
            jobId,
            applicationId,
            context: messages.map(m => `${m.role}: ${m.content}`).join('\n')
          }
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }

        console.log('Interview scheduler response received:', data);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
          functionCall: data.functionCall
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Show success toast for function calls
        if (data.functionCall) {
          toast({
            title: "Action Completed",
            description: data.functionCall.result,
          });
        }

        // Success - break out of retry loop
        break;

      } catch (error: any) {
        console.error(`Error sending interview scheduler message (attempt ${retryCount + 1}):`, error);
        retryCount++;

        if (retryCount < maxRetries) {
          console.log(`Retrying in ${retryCount * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        } else {
          // Final attempt failed
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'I apologize, but I\'m experiencing technical difficulties with the interview scheduling system. Please try your request again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          
          toast({
            title: "Connection Issue",
            description: "Unable to connect to interview scheduler. Please try again.",
            variant: "destructive",
          });
        }
      }
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Calendar className="w-4 h-4 mr-2" />
      Schedule Interview
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Interview Scheduler AI
          </DialogTitle>
          <DialogDescription>
            Schedule and manage interviews with AI assistance
          </DialogDescription>
        </DialogHeader>

        {/* Job & Candidate Info */}
        {jobData && applicationData && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Interview Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                <span className="font-medium">
                  {applicationData.candidates?.first_name} {applicationData.candidates?.last_name}
                </span>
                <span className="text-muted-foreground">
                  ({applicationData.candidates?.email})
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4" />
                <span>{jobData.title} at {jobData.companies?.name}</span>
              </div>
              <div className="flex gap-2">
                {jobData.interview_rounds?.map((round: any) => (
                  <Badge key={round.id} variant="outline" className="text-xs">
                    Round {round.round_number}: {round.round_type}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  
                  {message.functionCall && (
                    <div className="mt-2 pt-2 border-t border-border/20">
                      <div className="flex items-center gap-2 text-xs">
                        <CalendarCheck className="w-3 h-3" />
                        <span className="font-medium">Action: {message.functionCall.name}</span>
                      </div>
                      <div className="text-xs mt-1 opacity-80">
                        {message.functionCall.result}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs mt-1 opacity-60">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (e.g., 'Schedule interview for next Tuesday at 2 PM')"
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            I can help you schedule interviews, check availability, send calendar invites, and more.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewSchedulerChat;