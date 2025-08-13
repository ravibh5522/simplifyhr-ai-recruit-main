// In src/components/modals/ApplicationDetailModal.tsx

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface ApplicationDetailModalProps {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ApplicationDetailModal = ({ applicationId, open, onOpenChange }: ApplicationDetailModalProps) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!applicationId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_application_details', {
          p_application_id: applicationId,
        });
        if (error) throw error;
        setDetails(data);
      } catch (error: any) {
        console.error("Failed to fetch application details:", error);
      } finally {
        setLoading(false);
      }
    };
    if (open) {
      fetchDetails();
    }
  }, [applicationId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
        </DialogHeader>
        {loading && <p>Loading details...</p>}
        {!loading && details && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{details.jobs?.title}</h3>
              <p className="text-sm text-muted-foreground">{details.companies?.name}</p>
            </div>
            <div>
              <p><strong>Status:</strong> <Badge>{details.status}</Badge></p>
              <p><strong>Applied On:</strong> {new Date(details.applied_at).toLocaleDateString()}</p>
            </div>
            {/* You can add more sections here to show interview schedules, etc. */}
            <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};