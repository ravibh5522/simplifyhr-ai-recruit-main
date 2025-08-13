// In MyInterviewsTable.tsx

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableBaseProps } from '../types';

export const MyInterviewsTable = ({ data }: TableBaseProps) => {
  // --- THIS IS THE FIX ---
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-muted-foreground">No interviews found.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job Title</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Scheduled For</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((interview: any) => (
          <TableRow key={interview.id}>
            {/* The optional chaining makes this crash-proof */}
            <TableCell>{interview.job_applications?.jobs?.title}</TableCell>
            <TableCell>{interview.job_applications?.jobs?.companies?.name}</TableCell>
            <TableCell><Badge>{interview.status}</Badge></TableCell>
            <TableCell>{new Date(interview.scheduled_at).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};