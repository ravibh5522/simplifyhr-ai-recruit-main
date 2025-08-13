import { Badge } from '@/components/ui/badge';
import { TableBaseProps } from '../types';

export const MyApplicationsTable = ({ data }: TableBaseProps) => (
  <table className="min-w-full divide-y divide-border">
    <thead className="bg-muted/50">
      <tr>
        <th className="table-header">Job Title</th>
        <th className="table-header">Company</th>
        <th className="table-header">Status</th>
        <th className="table-header">Applied On</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border">
      {data.map((app: any) => (
        <tr key={app.id}>
          <td className="table-cell">{app.jobs.title}</td>
          <td className="table-cell">{app.jobs.companies.name}</td>
          <td className="table-cell"><Badge>{app.status}</Badge></td>
          <td className="table-cell">{new Date(app.applied_at).toLocaleDateString()}</td>
        </tr>
      ))}
    </tbody>
  </table>
);