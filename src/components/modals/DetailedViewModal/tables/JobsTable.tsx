import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit } from 'lucide-react';
import { TableBaseProps } from '../types';
import { formatDate, getStatusColor } from '../utils';

interface JobsTableProps extends TableBaseProps {
   onView?: (id: string) => void; // <-- Add this
}

export const JobsTable = ({ data, onEdit, onView }: JobsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job Title</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Applications</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="font-medium">{job.title}</TableCell>
            <TableCell>{job.companies?.name}</TableCell>
            <TableCell>{job.location || 'Remote'}</TableCell>
            <TableCell>{job.job_applications?.length || 0}</TableCell>
            <TableCell>
              <Badge className={getStatusColor(job.status)}>
                {job.status}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(job.created_at)}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm"  onClick={() => {
    // --- CHECKPOINT 1 ---
    console.log(`[JobsTable] Eye icon clicked for job ID: ${job.id}`);
    if (onView) {
      onView(job.id);
    }
  }}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};