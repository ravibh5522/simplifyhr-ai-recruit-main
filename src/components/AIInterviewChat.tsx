import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Bot, 
  Send, 
  User, 
  MessageSquare,
  Loader2,
  Video,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from 'lucide-react';

interface AIInterviewChatProps {
  interviewId: string;
  trigger?: React.ReactNode;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  questionNumber?: number;
}

interface InterviewSession {
  id: string;
  status: 'active' | 'paused' | 'completed';
  progress: number;
  questionsAsked: number;
  totalQuestions: number;
}

const AIInterviewChat = ({ interviewId, trigger }: AIInterviewChatProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startInterview = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-interviewer', {
        body: {
          action: 'start_interview',
          interviewId
        }
      });

      if (error) throw error;

      setSession({
        id: data.sessionId,
        status: 'active',
        progress: 0,
        questionsAsked: 0,
        totalQuestions: 12
      });

      setMessages([{
        role: 'assistant',
        content: data.aiGreeting,
        timestamp: new Date().toISOString()
      }]);

      setInterviewStarted(true);
      
      toast({
        title: "Interview Started",
        description: "AI interviewer is ready to conduct the interview",
      });

    } catch (error: any) {
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start interview",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !session) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`Sending message (attempt ${retryCount + 1}/${maxRetries}):`, inputMessage);

        const { data, error } = await supabase.functions.invoke('ai-interviewer', {
          body: {
            action: 'send_message',
            sessionId: session.id,
            message: userMessage.content,
            interviewId
          }
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }

        console.log('AI response received:', data);

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.aiResponse,
          timestamp: new Date().toISOString(),
          questionNumber: data.questionNumber
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        setSession(prev => prev ? {
          ...prev,
          progress: data.progress,
          questionsAsked: data.questionNumber
        } : null);

        // Success - break out of retry loop
        break;

      } catch (error: any) {
        console.error(`Error sending message (attempt ${retryCount + 1}):`, error);
        retryCount++;

        if (retryCount < maxRetries) {
          console.log(`Retrying in ${retryCount * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        } else {
          // Final attempt failed
          const errorMessage: Message = {
            role: 'assistant',
            content: 'I apologize, but I\'m experiencing technical difficulties. Please try sending your message again, or we can continue the interview in a moment.',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, errorMessage]);
          
          toast({
            title: "Connection Issue",
            description: "Having trouble connecting. Please try again.",
            variant: "destructive",
          });
        }
      }
    }

    setIsLoading(false);
    setIsTyping(false);
  };

  const endInterview = async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-interviewer', {
        body: {
          action: 'end_interview',
          sessionId: session.id
        }
      });

      if (error) throw error;

      setSession(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null);
      
      toast({
        title: "Interview Completed",
        description: `Interview finished. Duration: ${data.sessionSummary.duration} minutes`,
      });

    } catch (error: any) {
      console.error('Error ending interview:', error);
      toast({
        title: "Error",
        description: "Failed to end interview properly",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Bot className="w-4 h-4 mr-2" />
      AI Interview
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            AI Interview Session
          </DialogTitle>
          <DialogDescription>
            Conduct a comprehensive AI-powered interview
          </DialogDescription>
        </DialogHeader>

        {/* Interview Status */}
        {session && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Interview Progress
                </CardTitle>
                <Badge 
                  variant={session.status === 'active' ? 'default' : session.status === 'completed' ? 'secondary' : 'outline'}
                  className="flex items-center gap-1"
                >
                  {session.status === 'active' && <Play className="w-3 h-3" />}
                  {session.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                  {session.status === 'paused' && <Pause className="w-3 h-3" />}
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Questions: {session.questionsAsked}/{session.totalQuestions}</span>
                <span>{Math.round(session.progress)}% Complete</span>
              </div>
              <Progress value={session.progress} className="h-2" />
              {session.status === 'active' && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={endInterview}
                    disabled={isLoading}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    End Interview
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Start Interview */}
        {!interviewStarted && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Start AI Interview
              </CardTitle>
              <CardDescription>
                Begin a comprehensive AI-powered interview session. The AI will ask structured questions
                based on the job requirements and candidate profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={startInterview} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting Interview...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Start AI Interview
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        {interviewStarted && (
          <>
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                        <span className="text-xs font-medium">
                          {message.role === 'user' ? 'You' : 'AI Interviewer'}
                        </span>
                        {message.questionNumber && (
                          <Badge variant="outline" className="text-xs">
                            Q{message.questionNumber}
                          </Badge>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      <div className="text-xs mt-2 opacity-60">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-muted-foreground rounded-lg px-4 py-3 max-w-[85%]">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="w-4 h-4" />
                        <span className="text-xs font-medium">AI Interviewer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Analyzing your response...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            {session?.status === 'active' && (
              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your answer here..."
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
                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Take your time to provide thoughtful, detailed answers. The AI will ask follow-up questions based on your responses.
                </div>
              </div>
            )}
          </>
        )}

        {/* Completed Interview */}
        {session?.status === 'completed' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Interview Completed
              </CardTitle>
              <CardDescription className="text-green-600">
                The AI interview has been completed successfully. The evaluation and feedback
                have been saved and will be available for review.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AIInterviewChat;