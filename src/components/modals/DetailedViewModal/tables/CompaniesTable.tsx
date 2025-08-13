import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit } from 'lucide-react';
import { TableBaseProps } from '../types';
import { formatDate, getStatusColor } from '../utils';

interface CompaniesTableProps extends TableBaseProps {}

export const CompaniesTable = ({ data, onEdit }: CompaniesTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Industry</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((company) => (
          <TableRow key={company.id}>
            <TableCell className="font-medium">{company.name}</TableCell>
            <TableCell>{company.industry || '-'}</TableCell>
            <TableCell>{company.size_range || '-'}</TableCell>
            <TableCell>{company.country}</TableCell>
            <TableCell>
              <Badge className={getStatusColor(company.is_active ? 'active' : 'inactive')}>
                {company.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(company.created_at)}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEdit?.(company.id, 'company')}
                >
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