// src/components/interviewer/AIAnalysisDisplay.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, ThumbsUp, ThumbsDown, FileText } from 'lucide-react';

interface AIAnalysisDisplayProps {
  summary: string | null;
  strengths: any | null;
  weaknesses: any | null;
  transcript: any | null;
}

export const AIAnalysisDisplay = ({ summary, strengths, weaknesses, transcript }: AIAnalysisDisplayProps) => {
  // Helper to render lists from JSONB data (assuming a simple {notes: "..."} or {points: ["..."]} structure)
  const renderList = (data: any) => {
    if (!data) return <p className="text-sm text-muted-foreground">Not available.</p>;
    if (data.points && Array.isArray(data.points)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {data.points.map((point: string, index: number) => <li key={index} className="text-sm">{point}</li>)}
        </ul>
      );
    }
    if (data.notes) {
      return <p className="text-sm whitespace-pre-wrap">{data.notes}</p>;
    }
    return <p className="text-sm text-muted-foreground">Could not display data.</p>;
  };

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="flex items-center text-primary">
          <Bot className="w-6 h-6 mr-3" />
          AI Interview Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Summary */}
        <div>
          <h4 className="font-semibold mb-2">AI Summary</h4>
          <p className="text-sm text-muted-foreground">{summary || 'No summary generated.'}</p>
        </div>

        {/* Strengths */}
        <div>
          <h4 className="font-semibold flex items-center mb-2"><ThumbsUp className="w-4 h-4 mr-2 text-green-500" /> Key Strengths</h4>
          {renderList(strengths)}
        </div>

        {/* Weaknesses */}
        <div>
          <h4 className="font-semibold flex items-center mb-2"><ThumbsDown className="w-4 h-4 mr-2 text-red-500" /> Areas for Improvement</h4>
          {renderList(weaknesses)}
        </div>
        
        {/* Transcript (optional, could be in an accordion/collapsible) */}
        {transcript && (
          <div>
            <h4 className="font-semibold flex items-center mb-2"><FileText className="w-4 h-4 mr-2" /> Full Transcript</h4>
            <div className="p-2 border rounded-md h-48 overflow-y-auto bg-background text-xs">
              <p className="whitespace-pre-wrap">{/* Logic to display transcript, e.g., JSON.stringify(transcript, null, 2) or a custom renderer */}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};