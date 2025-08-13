import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit } from 'lucide-react';
import { TableBaseProps } from '../types';
import { formatDate, getStatusColor, getAIScoreVariant } from '../utils';
import { profile } from 'console';

interface ApplicationsTableProps extends TableBaseProps {
  hideCandidateColumn?: boolean;
}

export const ApplicationsTable = ({ data, onEdit, hideCandidateColumn }: ApplicationsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {!hideCandidateColumn && <TableHead>Candidate</TableHead>}
          <TableHead>Job</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>AI Score</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Applied</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((application) => (
          <TableRow key={application.id}>
            {!hideCandidateColumn && (
              <TableCell className="font-medium">
                {application.candidates?.profiles?.first_name} {application.candidates?.profiles?.last_name}
                <div className="text-xs text-muted-foreground">{application.candidates?.profiles?.email}</div>
              </TableCell>
            )}
            <TableCell>{application.jobs?.title}</TableCell>
            <TableCell>{application.jobs?.companies?.name}</TableCell>
            <TableCell>
              {application.screening_score ? (
                <Badge 
                  className={getAIScoreVariant(application.screening_score)}
                >
                  {Math.round(application.screening_score)}/100
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">Not assessed</span>
              )}
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(application.status)}>
                {application.status}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(application.applied_at)}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm">
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