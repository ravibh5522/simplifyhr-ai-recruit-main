// src/components/modals/InterviewDetailModal.tsx
import { InterviewFeedbackForm } from '@/components/interviewer/InterviewFeedbackForm';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Briefcase, FileText, Link as LinkIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { AIAnalysisDisplay } from '@/components/interviewer/AIAnalysisDisplay';

interface InterviewDetailModalProps {
  interviewId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewJob: (jobId: string) => void; // <-- Add this prop
}

// Define the shape of the detailed data we will fetch
interface DetailedInterview {
  id: string;
  status: string;
  scheduled_at: string;
  meeting_url: string;
  candidate_name: string;
  candidate_email: string;
  resume_url: string;
  job_title: string;
  job_description: string;
  job_location: string | null; // Add this
  job_employment_type: string | null; // Add this
  scoring_criteria: string[];
  ai_interview_enabled: boolean;
  ai_summary: string | null;
  transcript: any | null; // JSONB can be any object/array
  strengths: any | null;
  weaknesses: any | null;
  raw_scheduled_at: string; 
  has_passed: boolean; // Add this line
}

export const InterviewDetailModal = ({ interviewId, open, onOpenChange, onViewJob }: InterviewDetailModalProps) => {
  const [interviewData, setInterviewData] = useState<DetailedInterview | null>(null);
  const [loading, setLoading] = useState(false);


const handleFeedbackSubmitted = () => {
  // For now, we just close the modal.
  // In a more advanced setup, you would also trigger a refetch of the dashboard list.
  onOpenChange(false);
};


  useEffect(() => {
    const fetchInterviewDetails = async () => {
      if (!interviewId) return;
      setLoading(true);

      // --- THIS IS THE CORRECTED, COMPLETE QUERY ---
      const { data, error } = await supabase
        .from('interview_participants')
        .select(`
          id,
          status,
          scheduled_at,
          meeting_url,
           ai_interview_enabled,
          ai_summary,
          transcript,
          strengths,
          weaknesses,
          job_applications (
            jobs ( id, title, description, location, employment_type ),
            candidates ( first_name, last_name, email, phone, resume_url )
          ),
          interview_rounds ( scoring_criteria )
        `)
        .eq('id', interviewId)
        .single(); // We expect only one record

      if (error) {
        console.error('Error fetching interview details:', error);
        setInterviewData(null);
      } else if (data) {
        // This now formats all the data correctly
        const formattedData = {
          id: data.id,
          status: data.status,
          scheduled_at: new Date(data.scheduled_at).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }),
          raw_scheduled_at: data.scheduled_at,
          meeting_url: data.meeting_url,
          //  has_passed: data.has_passed, 
          candidate_name: `${data.job_applications?.candidates?.first_name || ''} ${data.job_applications?.candidates?.last_name || ''}`.trim(),
          candidate_email: data.job_applications?.candidates?.email,
          candidate_phone: data.job_applications?.candidates?.phone,
          resume_url: data.job_applications?.candidates?.resume_url, // Now correctly fetched
          resume_text: data.job_applications?.candidates?.resume_text, // Now correctly fetched
          job_id: data.job_applications?.jobs?.id, // We'll need this for the "View full job description" button
          job_title: data.job_applications?.jobs?.title,
          job_description: data.job_applications?.jobs?.description,
          job_location: data.job_applications?.jobs?.location,
          job_employment_type: data.job_applications?.jobs?.employment_type,
          scoring_criteria: data.interview_rounds?.scoring_criteria || [],
          ai_interview_enabled: data.ai_interview_enabled,
          ai_summary: data.ai_summary,
          transcript: data.transcript,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
        };
        setInterviewData(formattedData);
      }
      setLoading(false);
    };

    if (open) {
      fetchInterviewDetails();
    }
  }, [interviewId, open]);

 // We check if interviewData and its scheduled_at property exist first for safety.

  const interviewTimeHasPassed = interviewData?.scheduled_at 
    ? new Date(interviewData.scheduled_at) < new Date() 
    : false;

     if (interviewData) {
    console.log("--- INTERVIEW TIME CHECK ---", {
      status: interviewData.status,
      scheduled_at_raw_string: interviewData.raw_scheduled_at,
      currentTime_local: new Date(),
      scheduledTime_as_Date_object: new Date(interviewData.raw_scheduled_at),
      isTimeInThePast: interviewTimeHasPassed
    });
  }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-2xl">Interview Details</DialogTitle>
//           <DialogDescription>
//             Review all necessary information for the upcoming interview.
//           </DialogDescription>
//         </DialogHeader>

//         {loading && <p>Loading details...</p>}

//         {!loading && interviewData && (
//           <div className="space-y-6 mt-4">
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
//               {/* --- LEFT COLUMN --- */}
//               <div className="space-y-6">
                
//                 {/* --- THIS IS THE CORRECTED CANDIDATE CARD --- */}
//                 <div className="p-4 border rounded-lg space-y-2">
//                   <h3 className="font-semibold flex items-center mb-2"><User className="w-5 h-5 mr-2" /> Candidate Information</h3>
//                   <p><strong>Name:</strong> {interviewData.candidate_name}</p>
//                   <p><strong>Email:</strong> {interviewData.candidate_email}</p>
//                   <p><strong>Phone:</strong> {interviewData.candidate_phone || 'N/A'}</p>
//                   {interviewData.resume_url && (
//                     <Button asChild variant="outline" size="sm" className="mt-1">
//                       <a href={interviewData.resume_url} target="_blank" rel="noopener noreferrer">
//                         <FileText className="w-4 h-4 mr-2" /> View Resume File
//                       </a>
//                     </Button>
//                   )}
//                   {/* The scrollable resume text box is now back
//                   {interviewData.resume_text && (
//                     <div className="pt-2">
//                       <Label>Resume Content</Label>
//                       <div className="mt-1 p-2 border rounded-md h-32 overflow-y-auto bg-muted/50 text-sm">
//                         <p className="whitespace-pre-wrap">{interviewData.resume_text}</p>
//                       </div>
//                     </div>
//                   )} */}
//                 </div>

//                 {/* --- THIS IS THE CORRECTED JOB CARD --- */}
//                 <div className="p-4 border rounded-lg space-y-2">
//                   <h3 className="font-semibold flex items-center mb-2"><Briefcase className="w-5 h-5 mr-2" /> Job Information</h3>
//                   <p><strong>Title:</strong> {interviewData.job_title}</p>
//                   <p><strong>Location:</strong> {interviewData.job_location || 'N/A'}</p>
//                   <p><strong>Type:</strong> {interviewData.job_employment_type || 'N/A'}</p>
//                   {/* The link is now a button that can trigger another modal */}
//                   <Button 
//                     variant="link" 
//                     className="p-0 h-auto text-blue-500"
//                     // In the future, this onClick can open another modal with the full job description
//                     onClick={() => onViewJob(interviewData.job_id)}
//                   >
//                     View full job description
//                   </Button>
//                 </div>
//               </div>

//               {/* --- RIGHT COLUMN --- */}
//               <div className="space-y-6">
//                 <div className="p-4 border rounded-lg">
//                   <h3 className="font-semibold mb-3">Scoring Criteria</h3>
//                   {interviewData.scoring_criteria.length > 0 ? (
//                     <ul className="list-disc list-inside space-y-1 text-sm">
//                       {interviewData.scoring_criteria.map((criterion, index) => (
//                         <li key={index}>{criterion}</li>
//                       ))}
//                     </ul>
//                   ) : (
//                     <p className="text-sm text-muted-foreground">No specific scoring criteria defined for this round.</p>
//                   )}
//                 </div>
                
//                 <Button asChild size="lg" className="w-full">
//                   <a href={interviewData.meeting_url} target="_blank" rel="noopener noreferrer">
//                     <LinkIcon className="w-4 h-4 mr-2" /> Join Interview Meeting
//                   </a>
//                 </Button>
//               </div>
//             </div>

//         {/* AI Analysis Section */}
//             {/* Show this section if AI was enabled and the summary exists */}
//             {interviewData.ai_interview_enabled && interviewData.ai_summary && (
//               <AIAnalysisDisplay 
//                 summary={interviewData.ai_summary}
//                 strengths={interviewData.strengths}
//                 weaknesses={interviewData.weaknesses}
//                 transcript={interviewData.transcript}
//               />
//             )}
            
//             {/* Feedback Form Section */}
//             {/* Show the form if the interview is NOT completed */}
//             {interviewData.status !== 'completed' ? (
//               <InterviewFeedbackForm 
//                 interviewId={interviewData.id}
//                 onFeedbackSubmitted={handleFeedbackSubmitted}
//               />
//             ) : (
//               // Show a confirmation message if feedback is already submitted
//               <div className="text-center p-6 border-t mt-6">
//                 <h3 className="text-lg font-semibold text-green-600">Feedback Submitted</h3>
//                 <p className="text-muted-foreground">Your evaluation for this interview has been recorded.</p>
//               </div>
//             )}
//             </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Interview Details</DialogTitle>
          <DialogDescription>
            Review all necessary information for the upcoming interview.
          </DialogDescription>
        </DialogHeader>

        {loading && <div className="text-center p-8">Loading details...</div>}

        {!loading && interviewData && (
          <div className="space-y-6 mt-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* --- LEFT COLUMN (No changes here) --- */}
              <div className="space-y-6">
                
                <div className="p-4 border rounded-lg space-y-2">
                  <h3 className="font-semibold flex items-center mb-2"><User className="w-5 h-5 mr-2" /> Candidate Information</h3>
                  <p><strong>Name:</strong> {interviewData.candidate_name}</p>
                  <p><strong>Email:</strong> {interviewData.candidate_email}</p>
                  <p><strong>Phone:</strong> {interviewData.candidate_phone || 'N/A'}</p>
                  {interviewData.resume_url && (
                    <Button asChild variant="outline" size="sm" className="mt-1">
                      <a href={interviewData.resume_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" /> View Resume File
                      </a>
                    </Button>
                  )}
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <h3 className="font-semibold flex items-center mb-2"><Briefcase className="w-5 h-5 mr-2" /> Job Information</h3>
                  <p><strong>Title:</strong> {interviewData.job_title}</p>
                  <p><strong>Location:</strong> {interviewData.job_location || 'N/A'}</p>
                  <p><strong>Type:</strong> {interviewData.job_employment_type || 'N/A'}</p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-blue-500"
                    onClick={() => {
                      if (interviewData.job_id) {
                        onViewJob(interviewData.job_id);
                        onOpenChange(false);
                      }
                    }}
                  >
                    View full job description
                  </Button>
                </div>
              </div>

              {/* --- RIGHT COLUMN (No changes here) --- */}
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-3">Scoring Criteria</h3>
                  {interviewData.scoring_criteria.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {interviewData.scoring_criteria.map((criterion, index) => (
                        <li key={index}>{criterion}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific scoring criteria defined for this round.</p>
                  )}
                </div>
                
                {(() => {
                  const now = new Date();
                  const scheduledTime = new Date(interviewData.raw_scheduled_at);
                  const thirtyMinutesBefore = new Date(scheduledTime.getTime() - 30 * 60000);
                  const oneHourAfter = new Date(scheduledTime.getTime() + 60 * 60000);
                  const showButton = now >= thirtyMinutesBefore && now <= oneHourAfter;

                  return showButton && (
                    <Button asChild size="lg" className="w-full">
                      <a href={interviewData.meeting_url} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="w-4 h-4 mr-2" /> Join Interview Meeting
                      </a>
                    </Button>
                  );
                })()}
              </div>
            </div>

            {/* AI Analysis Section (No changes here) */}
            {interviewData.ai_interview_enabled && interviewData.ai_summary && (
              <AIAnalysisDisplay 
                summary={interviewData.ai_summary}
                strengths={interviewData.strengths}
                weaknesses={interviewData.weaknesses}
                transcript={interviewData.transcript}
              />
            )}
            
            {/* ========================================================== */}
            {/* --- THIS IS THE ONLY SECTION THAT HAS BEEN CHANGED --- */}
            {/* ========================================================== */}
            <div>
              {(() => {
                // State 1: Feedback is already completed.
                if (interviewData.status === 'completed') {
                  return (
                    <div className="text-center p-6 border-t mt-6">
                      <h3 className="text-lg font-semibold text-green-600">Feedback Submitted</h3>
                    </div>
                  );
                }

                // State 2: Interview is marked as 'awaiting_feedback' (The "Yes" path was chosen).
                if (interviewData.status === 'awaiting_feedback') {
                  return (
                    <InterviewFeedbackForm 
                      interviewId={interviewData.id}
                      onFeedbackSubmitted={handleFeedbackSubmitted}
                    />
                  );
                }

                // State 3: Interview was marked as missed.
                 if (interviewData.status === 'missed') {
                   return (
                    <div className="text-center p-6 border-t mt-6">
                      <h3 className="text-lg font-semibold text-orange-600">Interview Marked as Missed</h3>
                      <p className="text-muted-foreground">No further action is required.</p>
                    </div>
                  );
                }
                
                // State 4: Interview is still 'scheduled'. Check the time.
                if (interviewTimeHasPassed) {
                  // If time has passed, show the new confirmation choice.
                  return (
                    <div className="text-center p-6 border-t mt-6">
                      <h3 className="text-lg font-semibold">Action Required</h3>
                      <p className="text-muted-foreground mt-2">
                        Please confirm if this interview took place as scheduled.
                      </p>
                      <div className="flex justify-center space-x-4 mt-4">
                        <Button
                          variant="outline"
                          onClick={async () => {
                            // The "NO" button logic
                            await supabase
                              .from('interview_participants')
                              .update({ status: 'missed' })
                              .eq('id', interviewData.id);
                            onOpenChange(false); // Close modal and refetch data
                          }}
                        >
                          No, it was missed
                        </Button>
                        <Button
                          onClick={async () => {
                            // The "YES" button logic
                            await supabase
                              .from('interview_participants')
                              .update({ status: 'awaiting_feedback' })
                              .eq('id', interviewData.id);
                            // To see the change immediately, we should refetch the data.
                            // The simplest way is to close and let the user reopen.
                            onOpenChange(false);
                          }}
                        >
                          Yes, unlock feedback form
                        </Button>
                      </div>
                    </div>
                  );
                } else {
                  // If time has NOT passed, show the original locked message.
                  return (
                    <div className="text-center p-6 border-t mt-6">
                      <h3 className="text-lg font-semibold">Feedback Form Locked</h3>
                      <p className="text-muted-foreground mt-2">
                        This form will be available after the interview concludes.
                      </p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

//  return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-2xl">Interview Details</DialogTitle>
//           <DialogDescription>
//             Review all necessary information for the upcoming interview.
//           </DialogDescription>
//         </DialogHeader>

//         {loading && <div className="text-center p-8">Loading details...</div>}

//         {!loading && interviewData && (
//           <div className="space-y-6 mt-4">
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
//               {/* --- LEFT COLUMN --- */}
//               <div className="space-y-6">
                
//                 <div className="p-4 border rounded-lg space-y-2">
//                   <h3 className="font-semibold flex items-center mb-2"><User className="w-5 h-5 mr-2" /> Candidate Information</h3>
//                   <p><strong>Name:</strong> {interviewData.candidate_name}</p>
//                   <p><strong>Email:</strong> {interviewData.candidate_email}</p>
//                   <p><strong>Phone:</strong> {interviewData.candidate_phone || 'N/A'}</p>
//                   {interviewData.resume_url && (
//                     <Button asChild variant="outline" size="sm" className="mt-1">
//                       <a href={interviewData.resume_url} target="_blank" rel="noopener noreferrer">
//                         <FileText className="w-4 h-4 mr-2" /> View Resume File
//                       </a>
//                     </Button>
//                   )}
//                 </div>

//                 <div className="p-4 border rounded-lg space-y-2">
//                   <h3 className="font-semibold flex items-center mb-2"><Briefcase className="w-5 h-5 mr-2" /> Job Information</h3>
//                   <p><strong>Title:</strong> {interviewData.job_title}</p>
//                   <p><strong>Location:</strong> {interviewData.job_location || 'N/A'}</p>
//                   <p><strong>Type:</strong> {interviewData.job_employment_type || 'N/A'}</p>
//                   <Button 
//                     variant="link" 
//                     className="p-0 h-auto text-blue-500"
//                     onClick={() => {
//                       if (interviewData.job_id) {
//                         onViewJob(interviewData.job_id);
//                         onOpenChange(false);
//                       }
//                     }}
//                   >
//                     View full job description
//                   </Button>
//                 </div>
//               </div>

//               {/* --- RIGHT COLUMN --- */}
//               <div className="space-y-6">
//                 <div className="p-4 border rounded-lg">
//                   <h3 className="font-semibold mb-3">Scoring Criteria</h3>
//                   {interviewData.scoring_criteria.length > 0 ? (
//                     <ul className="list-disc list-inside space-y-1 text-sm">
//                       {interviewData.scoring_criteria.map((criterion, index) => (
//                         <li key={index}>{criterion}</li>
//                       ))}
//                     </ul>
//                   ) : (
//                     <p className="text-sm text-muted-foreground">No specific scoring criteria defined for this round.</p>
//                   )}
//                 </div>
                
//         {/* We use the same 'isJoinable' logic as the list item */}
//                 {(() => {
//                   const now = new Date();
//                   const scheduledTime = new Date(interviewData.raw_scheduled_at);
//                   const thirtyMinutesBefore = new Date(scheduledTime.getTime() - 30 * 60000);
//                   const oneHourAfter = new Date(scheduledTime.getTime() + 60 * 60000);
//                   const showButton = now >= thirtyMinutesBefore && now <= oneHourAfter;

//                   return showButton && (
//                 <Button asChild size="lg" className="w-full">
//                   <a href={interviewData.meeting_url} target="_blank" rel="noopener noreferrer">
//                     <LinkIcon className="w-4 h-4 mr-2" /> Join Interview Meeting
//                   </a>
//                 </Button>
//                   );
//                 })()}
//               </div>
//             </div>

//                        {/* AI Analysis Section */}
//             {/* Show this section ONLY if AI was enabled AND the summary data actually exists */}
//             {interviewData.ai_interview_enabled && interviewData.ai_summary && (
//               <AIAnalysisDisplay 
//                 summary={interviewData.ai_summary}
//                 strengths={interviewData.strengths}
//                 weaknesses={interviewData.weaknesses}
//                 transcript={interviewData.transcript}
//               />
//             )}

//             {/* AI Processing Message */}
//             {/* Show this ONLY if the interview is done, AI was on, but the summary is not yet ready */}
//             {interviewData.ai_interview_enabled && !interviewData.ai_summary && interviewTimeHasPassed && interviewData.status !== 'completed' && (
//                 <div className="text-center p-6 border rounded-lg bg-muted/50 mt-6">
//                     <h3 className="text-lg font-semibold">AI Analysis Processing</h3>
//                     <p className="text-muted-foreground mt-2">
//                         The AI scribe is analyzing the interview. This may take a few minutes. The results will appear here once ready.
//                     </p>
//                 </div>
//             )}
            
//             {/* Feedback Form Section */}
//             <div>
//               {interviewData.status === 'completed' ? (
//                 // If feedback is already submitted, show confirmation.
//                 <div className="text-center p-6 border-t mt-6">
//                   <h3 className="text-lg font-semibold text-green-600">Feedback Submitted</h3>
//                   <p className="text-muted-foreground">Your evaluation for this interview has been recorded.</p>
//                 </div>
//               ) : (
//                 // If feedback is NOT submitted, check if the interview time has passed.
//                 interviewTimeHasPassed ? (
//                   // If time has passed, show the form.
//                   <InterviewFeedbackForm 
//                     interviewId={interviewData.id}
//                     onFeedbackSubmitted={handleFeedbackSubmitted}
//                   />
//                 ) : (
//                   // If time has NOT passed, show the locked message.
//                   <div className="text-center p-6 border-t mt-6">
//                     <h3 className="text-lg font-semibold">Feedback Form Locked</h3>
//                     <p className="text-muted-foreground mt-2">
//                       This form will become available after the interview the interview concludes.
//                     </p>
//                   </div>
//                 )
//               )}
//             </div>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );

};