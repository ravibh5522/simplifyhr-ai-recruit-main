import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download } from 'lucide-react';
import { DataType, FilterOption } from '../types';
import { FILTER_OPTIONS } from '../constants';

interface FilterControlsProps {
  searchTerm: string;
  filterValue: string;
  type: DataType;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  customFilterOptions?: FilterOption[];
}

export const FilterControls = ({
  searchTerm,
  filterValue,
  type,
  onSearchChange,
  onFilterChange,
  customFilterOptions
}: FilterControlsProps) => {
  // Only use custom options if explicitly provided (not undefined or null)
  const filterOptions = customFilterOptions !== null && customFilterOptions !== undefined 
    ? customFilterOptions 
    : FILTER_OPTIONS[type] || [];

  return (
    <div className="flex items-center space-x-4 py-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={filterValue} onValueChange={onFilterChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by..." />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option: FilterOption) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
    </div>
  );
};