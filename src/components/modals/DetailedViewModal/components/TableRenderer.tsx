import { DataType } from '../types';
import { UsersTable } from '../tables/UsersTable';
import { CompaniesTable } from '../tables/CompaniesTable';
import { VendorsTable } from '../tables/VendorsTable';
import { JobsTable } from '../tables/JobsTable';
import { ApplicationsTable } from '../tables/ApplicationsTable';

import { MyApplicationsTable } from '../tables/MyApplicationsTable';
import { MyInterviewsTable } from '../tables/MyInterviewsTable';

interface TableRendererProps {
  type: DataType;
  data: any[];
  onEdit?: (id: string, entityType: string) => void;
  onView?: (id: string) => void; // <-- Add this
}

export const TableRenderer = ({ type, data, onEdit , onView }: TableRendererProps) => {
    console.log(`[TableRenderer] Rendering for type "${type}". The onView function is:`, onView);
  switch (type) {
    case 'users':
      return <UsersTable data={data} onEdit={onEdit} />;
    
    case 'companies':
      return <CompaniesTable data={data} onEdit={onEdit} />;
    
    case 'vendors':
      return <VendorsTable data={data} onEdit={onEdit} />;
    
    case 'jobs':
    case 'activeJobs':
      return <JobsTable data={data} onEdit={onEdit} onView={onView} />;
    
    case 'applications':
    case 'monthlyHires':
      return <ApplicationsTable data={data} onEdit={onEdit} />;
    // --- NEW CASES ---
    case 'my-applications':
    case 'in-review':
      // We can reuse the same table component for both
      return <ApplicationsTable data={data} onEdit={onEdit} hideCandidateColumn={true} />;

    case 'my-interviews':
      return <MyInterviewsTable data={data} />;

    default:
      return null;
  }
};