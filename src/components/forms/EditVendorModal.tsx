import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Building, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditVendorModalProps {
  vendorId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorUpdated?: () => void;
}

const EditVendorModal = ({ vendorId, open, onOpenChange, onVendorUpdated }: EditVendorModalProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    company_id: '',
    commission_rate: '',
    specialization: [] as string[],
    success_rate: '',
    average_time_to_fill: '',
    is_active: true
  });

  const [specializationInput, setSpecializationInput] = useState('');

  useEffect(() => {
    if (open) {
      fetchCompanies();
      if (vendorId) {
        fetchVendorData();
      }
    }
  }, [open, vendorId]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive"
      });
    }
  };

  const fetchVendorData = async () => {
    if (!vendorId) return;
    
    setFetchLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) throw error;

      setFormData({
        company_id: data.company_id || '',
        commission_rate: data.commission_rate?.toString() || '',
        specialization: data.specialization || [],
        success_rate: data.success_rate?.toString() || '',
        average_time_to_fill: data.average_time_to_fill?.toString() || '',
        is_active: data.is_active
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch vendor data",
        variant: "destructive"
      });
    } finally {
      setFetchLoading(false);
    }
  };

  const addSpecialization = () => {
    if (specializationInput.trim() && !formData.specialization.includes(specializationInput.trim())) {
      setFormData({
        ...formData,
        specialization: [...formData.specialization, specializationInput.trim()]
      });
      setSpecializationInput('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setFormData({
      ...formData,
      specialization: formData.specialization.filter(s => s !== spec)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) return;
    
    setLoading(true);

    try {
      const vendorData = {
        company_id: formData.company_id,
        commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) : null,
        specialization: formData.specialization.length > 0 ? formData.specialization : null,
        success_rate: formData.success_rate ? parseFloat(formData.success_rate) : null,
        average_time_to_fill: formData.average_time_to_fill ? parseInt(formData.average_time_to_fill) : null,
        is_active: formData.is_active
      };

      const { error } = await supabase
        .from('vendors')
        .update(vendorData)
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: "Vendor Updated",
        description: "Vendor has been successfully updated."
      });

      onOpenChange(false);
      onVendorUpdated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Edit Vendor</span>
          </DialogTitle>
          <DialogDescription>
            Update vendor information and settings.
          </DialogDescription>
        </DialogHeader>
        
        {fetchLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading vendor data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_id">Company *</Label>
              <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <span>{company.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                  placeholder="e.g., 15.5"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="success_rate">Success Rate (%)</Label>
                <Input
                  id="success_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.success_rate}
                  onChange={(e) => setFormData({ ...formData, success_rate: e.target.value })}
                  placeholder="e.g., 85.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="average_time_to_fill">Average Time to Fill (days)</Label>
              <Input
                id="average_time_to_fill"
                type="number"
                min="1"
                value={formData.average_time_to_fill}
                onChange={(e) => setFormData({ ...formData, average_time_to_fill: e.target.value })}
                placeholder="e.g., 30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <div className="flex space-x-2">
                <Input
                  id="specialization"
                  value={specializationInput}
                  onChange={(e) => setSpecializationInput(e.target.value)}
                  placeholder="e.g., React, Node.js, Python"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSpecialization();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addSpecialization}>
                  Add
                </Button>
              </div>
              
              {formData.specialization.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.specialization.map((spec) => (
                    <Badge key={spec} variant="secondary" className="flex items-center space-x-1">
                      <span>{spec}</span>
                      <button
                        type="button"
                        onClick={() => removeSpecialization(spec)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <Select value={formData.is_active.toString()} onValueChange={(value) => setFormData({ ...formData, is_active: value === 'true' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.company_id}>
                {loading ? 'Updating...' : 'Update Vendor'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditVendorModal;