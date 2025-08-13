import { DataType, FilterOption } from './types';

export const FILTER_OPTIONS: Record<DataType, FilterOption[]> = {
  users: [
    { value: 'all', label: 'All Roles' },
    { value: 'candidate', label: 'Candidates' },
    { value: 'client', label: 'Clients' },
    { value: 'vendor', label: 'Vendors' },
    { value: 'super_admin', label: 'Super Admins' }
  ],
  companies: [
    { value: 'all', label: 'All Companies' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ],
  vendors: [
    { value: 'all', label: 'All Vendors' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ],
  jobs: [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'closed', label: 'Closed' },
    { value: 'on_hold', label: 'On Hold' }
  ],
  activeJobs: [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'closed', label: 'Closed' },
    { value: 'on_hold', label: 'On Hold' }
  ],
  applications: [
    { value: 'all', label: 'All Status' },
    { value: 'applied', label: 'Applied' },
    { value: 'screening', label: 'Screening' },
    { value: 'interview', label: 'Interview' },
    { value: 'offer', label: 'Offer' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' }
  ],
  monthlyHires: [
    { value: 'all', label: 'All Status' },
    { value: 'applied', label: 'Applied' },
    { value: 'screening', label: 'Screening' },
    { value: 'interview', label: 'Interview' },
    { value: 'offer', label: 'Offer' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' }
  ],
  'my-applications': [
    { value: 'all', label: 'All Statuses' },
    { value: 'applied', label: 'Applied' },
    { value: 'screening', label: 'Screening' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'testing', label: 'Testing' },
    { value: 'offer', label: 'Offer' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' },
  ],
  'in-review': [
    { value: 'all', label: 'All Statuses' },
    { value: 'screening', label: 'Screening' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'testing', label: 'Testing' },
  ],
  
  // You can also define a separate list for interviews
  'my-interviews': [
    { value: 'all', label: 'All Statuses' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'missed', label: 'Missed' },
  ],
  
};

export const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  hired: 'bg-green-100 text-green-800',
  draft: 'bg-yellow-100 text-yellow-800',
  screening: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-blue-100 text-blue-800',
  offer: 'bg-blue-100 text-blue-800',
  closed: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-800'
};