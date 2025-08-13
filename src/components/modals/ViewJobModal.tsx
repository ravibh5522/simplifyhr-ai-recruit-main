// // src/components/modals/ViewJobModal.tsx

// import { useEffect, useState } from 'react';
// import { supabase } from '@/integrations/supabase/client';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Badge } from '@/components/ui/badge';
// import { Briefcase, Building, MapPin, DollarSign, Users } from 'lucide-react';

// // This interface defines the shape of a single job with its related company data
// interface Job {
//   id: string;
//   title: string;
//   description: string;
//   requirements: string;
//   employment_type: string;
//   location: string;
//   salary_min: number;
//   salary_max: number;
//   status: 'published' | 'draft' | 'closed';
//   created_at: string;
//   companies: { name: string } | null;
//   // You can add a join to count applications if needed
// }

// interface ViewJobModalProps {
//   jobId: string | null;
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
// }

// export const ViewJobModal = ({ jobId, open, onOpenChange }: ViewJobModalProps) => {
//   const [job, setJob] = useState<Job | null>(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchJobData = async () => {
//       if (!jobId || !open) return;
//       setLoading(true);
//       try {
//         const { data, error } = await supabase
//           .from('jobs')
//           .select('*, companies (name)') // Fetch job and its related company
//           .eq('id', jobId)
//           .single();
//         if (error) throw error;
//         setJob(data);
//       } catch (error) {
//         console.error("Failed to fetch job details:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchJobData();
//   }, [jobId, open]);

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>Job Details</DialogTitle>
//         </DialogHeader>
        
//         {loading && <div className="p-8 text-center">Loading...</div>}

//         {!loading && job && (
//           <div className="py-4 space-y-6">
//             <div>
//               <h2 className="text-2xl font-bold">{job.title}</h2>
//               <div className="flex items-center space-x-2 text-muted-foreground">
//                 <Building className="w-4 h-4" /> 
//                 <span>{job.companies?.name || 'N/A'}</span>
//                 <span className="text-gray-400">•</span>
//                 <MapPin className="w-4 h-4" /> 
//                 <span>{job.location}</span>
//               </div>
//             </div>
            
//             <div className="flex flex-wrap gap-2">
//               <Badge variant="secondary">{job.employment_type}</Badge>
//               <Badge variant={job.status === 'published' ? 'default' : 'outline'}>
//                 {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
//               </Badge>
//               <Badge variant="outline" className="flex items-center space-x-1">
//                 <DollarSign className="w-4 h-4" />
//                 <span>
//                   {job.salary_min && job.salary_max 
//                     ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
//                     : 'Not specified'}
//                 </span>
//               </Badge>
//             </div>
            
//             <div className="border-t pt-4 space-y-4">
//               <div>
//                 <h3 className="font-semibold mb-2">Job Description</h3>
//                 <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p>
//               </div>
//               <div>
//                 <h3 className="font-semibold mb-2">Requirements</h3>
//                 <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.requirements}</p>
//               </div>
//             </div>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };
// src/components/modals/ViewJobModal.tsx

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Building, MapPin, DollarSign, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// This interface defines the shape of a single job with its related company data
interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string | string[]; // Requirements can be a string OR an array of strings
  employment_type: string;
  location: string;
  salary_min: number;
  salary_max: number;
  status: 'published' | 'draft' | 'closed';
  created_at: string;
  companies: { name: string } | null;
}

interface ViewJobModalProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewJobModal = ({ jobId, open, onOpenChange }: ViewJobModalProps) => {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);

  // === START OF EDITED BLOCK 1: HELPER FUNCTION ===
  /**
   * Formats content for ReactMarkdown.
   * If content is an array, it converts it to a Markdown list.
   * If it's a string, it returns it as is.
   * Handles null/undefined cases gracefully.
   */
  const formatMarkdownInput = (content: string | string[] | null | undefined): string => {
    if (!content) {
      return ''; // Return empty string if content is null or undefined
    }
    if (Array.isArray(content)) {
      // If it's an array, map each item to a Markdown list item and join with newlines
      return content.map(item => `- ${item}`).join('\n');
    }
    // If it's already a string, just return it
    return content;
  };
  // === END OF EDITED BLOCK 1 ===

  useEffect(() => {
    const fetchJobData = async () => {
      if (!jobId || !open) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*, companies (name)')
          .eq('id', jobId)
          .single();
        if (error) throw error;
        setJob(data as Job);
      } catch (error) {
        console.error("Failed to fetch job details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobData();
  }, [jobId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job Details</DialogTitle>
        </DialogHeader>
        
        {loading && <div className="p-8 text-center">Loading...</div>}

        {!loading && job && (
          <div className="py-4 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">{job.title}</h2>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Building className="w-4 h-4" /> 
                <span>{job.companies?.name || 'N/A'}</span>
                <span className="text-gray-400">•</span>
                <MapPin className="w-4 h-4" /> 
                <span>{job.location}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{job.employment_type}</Badge>
              <Badge variant={job.status === 'published' ? 'default' : 'outline'}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>
                  {job.salary_min && job.salary_max 
                    ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                    : 'Not specified'}
                </span>
              </Badge>
            </div>
            
            <div className="border-t pt-4 space-y-4">
              {/* === START OF EDITED BLOCK 2: USING THE HELPER FUNCTION === */}
              <div>
                <h3 className="font-semibold mb-2">Job Description</h3>
                <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                  <ReactMarkdown>{formatMarkdownInput(job.description)}</ReactMarkdown>
                </article>
              </div>
              
              {job.requirements && (
                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                    <ReactMarkdown>{formatMarkdownInput(job.requirements)}</ReactMarkdown>
                  </article>
                </div>
              )}
              {/* === END OF EDITED BLOCK 2 === */}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};