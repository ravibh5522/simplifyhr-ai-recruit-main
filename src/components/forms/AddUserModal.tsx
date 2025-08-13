import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, User, Mail, Phone, Building, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddUserModalProps {
  onUserAdded?: () => void;
}

const AddUserModal = ({ onUserAdded }: AddUserModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'candidate',
    associationType: 'company', // 'company', 'vendor', or 'simplifyhiring'
    associatedId: '', // company_id or vendor_id
    companyName: '' // for manual entry when needed
  });

  useEffect(() => {
    if (open) {
      fetchCompaniesAndVendors();
    }
  }, [open]);

  const fetchCompaniesAndVendors = async () => {
    try {
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (companiesError) throw companiesError;

      // First, let's do a simple count of vendors
      const { count: vendorCount, error: countError } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });

      console.log('Total vendors in database:', vendorCount);
      console.log('Count error:', countError);

      // Now fetch vendors without join first to see if that works
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select(`
          id, 
          vendor_name,
          company_id,
          is_active
        `)
        .eq('is_active', true)
        .order('vendor_name');

      if (vendorsError) {
        console.error('Vendors fetch error:', vendorsError);
        console.log('Vendors error details:', JSON.stringify(vendorsError, null, 2));
        // Don't throw error, just log it and continue
      }

      console.log('Raw vendors data:', vendorsData);
      
      // If we have vendors, enrich them with company names
      let enrichedVendors = vendorsData || [];
      if (vendorsData && vendorsData.length > 0) {
        enrichedVendors = vendorsData.map(vendor => {
          const company = companiesData?.find(c => c.id === vendor.company_id);
          return {
            ...vendor,
            companies: company ? { id: company.id, name: company.name } : null
          };
        });
      }
      
      setCompanies(companiesData || []);
      setVendors(enrichedVendors);
      
      console.log('Fetched companies:', companiesData?.length);
      console.log('Fetched vendors:', enrichedVendors?.length);
      console.log('Enriched vendors:', enrichedVendors);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies and vendors",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match",
          variant: "destructive"
        });
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 6 characters long",
          variant: "destructive"
        });
        return;
      }

      // Map UI role to DB role
      let dbRole = formData.role;
      if (formData.role === 'client') dbRole = 'admin';

      const userData: any = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        role: dbRole
      };

      // Set association based on type
      if (formData.associationType === 'company' && formData.associatedId) {
        const selectedCompany = companies.find(c => c.id === formData.associatedId);
        userData.company_name = selectedCompany?.name;
        // For admin roles, they'll be associated via the admin table
      } else if (formData.associationType === 'vendor' && formData.associatedId) {
        const selectedVendor = vendors.find(v => v.id === formData.associatedId);
        userData.company_name = selectedVendor?.vendor_name || 'Unknown Vendor';
        userData.vendor_id = formData.associatedId; // This is the key fix!
        userData.role = 'vendor'; // Force role to vendor when associated with vendor
      } else if (formData.associationType === 'simplifyhiring') {
        userData.company_name = 'SimplifyHiring';
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      });

      console.log('Attempting to create user with data:', userData);
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: "Account Already Exists",
            description: "An account with this email already exists.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      // If user was created successfully and we have vendor association, update the profile
      if (authData.user && formData.associationType === 'vendor' && formData.associatedId) {
        try {
          // Wait a moment for the profile trigger to create the initial profile
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update the profile with vendor_id
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              vendor_id: formData.associatedId,
              role: 'vendor'
            })
            .eq('id', authData.user.id);

          if (updateError) {
            console.error('Error updating profile with vendor_id:', updateError);
            // Don't throw error here as user is already created, just log the issue
          } else {
            console.log('Successfully updated profile with vendor_id:', formData.associatedId);
          }
        } catch (updateErr) {
          console.error('Error in post-signup profile update:', updateErr);
        }
      }

      toast({
        title: "User Added",
        description: "User has been successfully added to the platform. They will receive an email to verify their account."
      });

      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'candidate',
        associationType: 'company',
        associatedId: '',
        companyName: ''
      });

      setOpen(false);
      onUserAdded?.();

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Add New User</span>
              <p className="text-sm font-normal text-gray-600 mt-1">Create user accounts with role-based access</p>
            </div>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Add a new user to the platform. Users must be associated with a company, vendor, or SimplifyHiring directly.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First name"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="associationType">Association Type *</Label>
            <Select value={formData.associationType} onValueChange={(value) => {
              setFormData({ 
                ...formData, 
                associationType: value, 
                associatedId: '',
                role: value === 'simplifyhiring' ? 'super_admin' : 'candidate'
              });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select association type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4" />
                    <span>Company</span>
                  </div>
                </SelectItem>
                <SelectItem value="vendor">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Vendor</span>
                  </div>
                </SelectItem>
                <SelectItem value="simplifyhiring">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4" />
                    <span>SimplifyHiring (Direct)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company/Vendor Selection */}
          {formData.associationType === 'company' && (
            <div className="space-y-2">
              <Label htmlFor="associatedId">Select Company *</Label>
              {companies.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No companies available. Please add a company first before creating users.
                  </p>
                </div>
              )}
              <Select value={formData.associatedId} onValueChange={(value) => setFormData({ ...formData, associatedId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.length === 0 ? (
                    <SelectItem value="no-companies" disabled>
                      No companies available - Add a company first
                    </SelectItem>
                  ) : (
                    companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4" />
                          <span>{company.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.associationType === 'vendor' && (
            <div className="space-y-2">
              <Label htmlFor="associatedId">Select Vendor *</Label>
              {vendors.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No vendors available. Please add a vendor first before creating users.
                  </p>
                </div>
              )}
              <Select value={formData.associatedId} onValueChange={(value) => setFormData({ ...formData, associatedId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.length === 0 ? (
                    <SelectItem value="no-vendors" disabled>
                      No vendors available - Add a vendor first
                    </SelectItem>
                  ) : (
                     vendors.map((vendor) => (
                       <SelectItem key={vendor.id} value={vendor.id}>
                         <div className="flex items-center space-x-2">
                           <Users className="w-4 h-4" />
                           <span>{vendor.vendor_name || vendor.companies?.name || 'Unknown Vendor'}</span>
                         </div>
                       </SelectItem>
                     ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">User Role *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select user role" />
              </SelectTrigger>
              <SelectContent>
                {formData.associationType === 'simplifyhiring' ? (
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                ) : (
                  <>
                    <SelectItem value="candidate">Candidate</SelectItem>
                    <SelectItem value="client">Client (Hiring Manager)</SelectItem>
                    <SelectItem value="vendor">Vendor (Recruitment Agency)</SelectItem>
                    <SelectItem value="interviewer">Interviewer</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Show selected association info */}
          {formData.associatedId && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Selected Association:</p>
              <p className="text-sm text-muted-foreground">
                {formData.associationType === 'company' && 
                  companies.find(c => c.id === formData.associatedId)?.name
                }
                {formData.associationType === 'vendor' && 
                  (vendors.find(v => v.id === formData.associatedId)?.vendor_name || 
                   vendors.find(v => v.id === formData.associatedId)?.companies?.name || 'Unknown Vendor')
                }
                {formData.associationType === 'simplifyhiring' && 'SimplifyHiring (Direct Employee)'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm password"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || 
              (formData.associationType !== 'simplifyhiring' && !formData.associatedId)
            }>
              {loading ? 'Adding...' : 'Add User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;