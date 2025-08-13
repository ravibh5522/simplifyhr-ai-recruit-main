import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Building, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddVendorModalProps {
  onVendorAdded?: () => void;
}

const AddVendorModal = ({ onVendorAdded }: AddVendorModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    vendor_name: '',
    spoc_name: '',
    spoc_email: '',
    spoc_phone: '',
    company_id: '',
    commission_rate: '',
    specialization: [] as string[],
    success_rate: '',
    average_time_to_fill: ''
  });

  const [specializationInput, setSpecializationInput] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

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

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);

  //   try {
  //     // Check current session before attempting insert
  //     const { data: sessionData } = await supabase.auth.getSession();
  //     console.log('Current session:', sessionData);
      
  //     // Try to refresh session if needed
  //     if (!sessionData.session) {
  //       console.log('No session found, attempting to refresh...');
  //       const { data: refreshData } = await supabase.auth.refreshSession();
  //       console.log('Refresh result:', refreshData);
  //     }

  //     const vendorData = {
  //       vendor_name: formData.vendor_name,
  //       spoc_name: formData.spoc_name,
  //       spoc_email: formData.spoc_email,
  //       spoc_phone: formData.spoc_phone || null,
  //       company_id: formData.company_id || null,
  //       commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) : null,
  //       specialization: formData.specialization.length > 0 ? formData.specialization : null,
  //       success_rate: formData.success_rate ? parseFloat(formData.success_rate) : null,
  //       average_time_to_fill: formData.average_time_to_fill ? parseInt(formData.average_time_to_fill) : null
  //     };

  //     console.log('Attempting to add vendor:', vendorData);
      
  //     const { error } = await supabase
  //       .from('vendors')
  //       .insert([vendorData]);

  //     if (error) {
  //       console.error('Vendor insertion error:', error);
  //       throw error;
  //     }

  //     toast({
  //       title: "Vendor Added",
  //       description: "Vendor has been successfully added to the platform."
  //     });

  //     // Reset form
  //     setFormData({
  //       vendor_name: '',
  //       spoc_name: '',
  //       spoc_email: '',
  //       spoc_phone: '',
  //       company_id: '',
  //       commission_rate: '',
  //       specialization: [],
  //       success_rate: '',
  //       average_time_to_fill: ''
  //     });

  //     setOpen(false);
  //     onVendorAdded?.();
  //   } catch (error: any) {
  //     toast({
  //       title: "Error",
  //       description: error.message,
  //       variant: "destructive"
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // In your AddVendorModal.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1. Prepare the data payload for the function.
    // The keys here must exactly match the parameter names in the SQL function.
    const vendorData = {
      p_vendor_name: formData.vendor_name,
      p_company_id: formData.company_id, // From your company dropdown
      p_spoc_name: formData.spoc_name,
      p_spoc_email: formData.spoc_email,
      p_spoc_phone: formData.spoc_phone,
      p_specialization: formData.specialization, // e.g., ['AI Engineer']
      p_success_rate: formData.success_rate,
      p_commission_rate: formData.commission_rate
    };

    console.log("Attempting to add vendor via RPC:", vendorData);

    // 2. Call the RPC function.
    const { error } = await supabase.rpc('register_new_vendor', vendorData);

    if (error) {
      // The error message will be much clearer now if something goes wrong
      console.error('Vendor insertion error:', error);
      throw error;
    }

    toast({
      title: "Vendor Registered",
      description: "The vendor record has been created successfully.",
    });
    // Close modal, refresh data, etc.
       // Reset form
      setFormData({
        vendor_name: '',
        spoc_name: '',
        spoc_email: '',
        spoc_phone: '',
        company_id: '',
        commission_rate: '',
        specialization: [],
        success_rate: '',
        average_time_to_fill: ''
      });

      setOpen(false);
      onVendorAdded?.();

  } catch (error: any) {
    toast({
      title: "Failed to Register Vendor",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Add New Vendor</span>
          </DialogTitle>
          <DialogDescription>
            Add a new vendor to the platform. Vendors are recruitment agencies that help companies find candidates.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor_name">Vendor Name *</Label>
            <Input
              id="vendor_name"
              value={formData.vendor_name}
              onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
              placeholder="Enter vendor/agency name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spoc_name">SPOC Name *</Label>
              <Input
                id="spoc_name"
                value={formData.spoc_name}
                onChange={(e) => setFormData({ ...formData, spoc_name: e.target.value })}
                placeholder="Contact person name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="spoc_email">SPOC Email *</Label>
              <Input
                id="spoc_email"
                type="email"
                value={formData.spoc_email}
                onChange={(e) => setFormData({ ...formData, spoc_email: e.target.value })}
                placeholder="contact@vendor.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spoc_phone">SPOC Phone</Label>
              <Input
                id="spoc_phone"
                value={formData.spoc_phone}
                onChange={(e) => setFormData({ ...formData, spoc_phone: e.target.value })}
                placeholder="+62 xxx xxx xxx"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company_id">Associated Company</Label>
              <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {companies
                    .filter(company => company.id && company.name) // Filter out invalid data
                    .map((company) => (
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.vendor_name || !formData.spoc_name || !formData.spoc_email}>
              {loading ? 'Adding...' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVendorModal;