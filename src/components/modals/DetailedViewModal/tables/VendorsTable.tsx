import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit } from 'lucide-react';
import { TableBaseProps } from '../types';
import { getStatusColor } from '../utils';

interface VendorsTableProps extends TableBaseProps {}

export const VendorsTable = ({ data, onEdit }: VendorsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Commission Rate</TableHead>
          <TableHead>Success Rate</TableHead>
          <TableHead>Avg. Time to Fill</TableHead>
          <TableHead>Specializations</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((vendor) => (
          <TableRow key={vendor.id}>
            <TableCell className="font-medium">{vendor.companies?.name}</TableCell>
            <TableCell>{vendor.commission_rate ? `${vendor.commission_rate}%` : '-'}</TableCell>
            <TableCell>{vendor.success_rate ? `${vendor.success_rate}%` : '-'}</TableCell>
            <TableCell>{vendor.average_time_to_fill ? `${vendor.average_time_to_fill} days` : '-'}</TableCell>
            <TableCell>
              {vendor.specialization?.length ? (
                <div className="flex flex-wrap gap-1">
                  {vendor.specialization.slice(0, 2).map((spec: string) => (
                    <Badge key={spec} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                  {vendor.specialization.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{vendor.specialization.length - 2}
                    </Badge>
                  )}
                </div>
              ) : '-'}
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(vendor.is_active ? 'active' : 'inactive')}>
                {vendor.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEdit?.(vendor.id, 'vendor')}
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