// Offer Letter API Integration Service
interface OfferLetterData {
  candidate_name: string;
  position: string;
  salary: string;
  start_date: string;
  company_name: string;
  [key: string]: any;
}

interface GenerateOfferRequest {
  template_file: File;
  data: OfferLetterData;
  output_format?: 'docx' | 'pdf' | 'both';
}

interface SendOfferRequest {
  pdf_file: File;
  email_data: {
    emails: string[];
    subject: string;
    html_content: string;
  };
}

interface OfferApiResponse {
  success: boolean;
  request_id: string;
  message: string;
  files?: {
    docx?: string;
    pdf?: string;
  };
  processing_time?: number;
  metadata?: any;
}

interface EmailStatusResponse {
  request_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percentage: number;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  pending_count: number;
  errors: string[];
  started_at?: string;
  completed_at?: string;
  duration?: number;
}

export class OfferLetterApiService {
  private baseUrl: string;
  
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async generateOfferLetter(request: GenerateOfferRequest): Promise<OfferApiResponse> {
    const formData = new FormData();
    formData.append('template_file', request.template_file);
    formData.append('data_file', new Blob([JSON.stringify(request.data)], { 
      type: 'application/json' 
    }), 'candidate_data.json');
    formData.append('output_format', request.output_format || 'both');

    const response = await fetch(`${this.baseUrl}/api/v1/generate-offer`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to generate offer letter: ${response.statusText}`);
    }

    return response.json();
  }

  async sendOfferLetter(request: SendOfferRequest): Promise<{ request_id: string; status: string }> {
    const formData = new FormData();
    formData.append('pdf_file', request.pdf_file);
    formData.append('email_data', JSON.stringify(request.email_data));

    const response = await fetch(`${this.baseUrl}/api/v1/send-offer`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to send offer letter: ${response.statusText}`);
    }

    return response.json();
  }

  async getEmailStatus(requestId: string): Promise<EmailStatusResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/email-status/${requestId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get email status: ${response.statusText}`);
    }

    return response.json();
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/v1/download/${fileId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return response.blob();
  }

  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Utility functions for the UI components
export const formatCandidateDataForOffer = (candidate: any, job: any) => {
  return {
    candidate_name: `${candidate.first_name} ${candidate.last_name}`,
    position: job.title,
    salary: `${job.currency} ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}`,
    start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 30 days from now
    company_name: 'Your Company Name', // This should come from company settings
    candidate_email: candidate.email,
    job_location: job.location,
    expected_salary: candidate.expected_salary?.toLocaleString() || 'Negotiable',
    experience_years: candidate.experience_years || 0,
    current_location: candidate.current_location || 'Not specified',
  };
};

export const generateOfferEmailContent = (candidateName: string, position: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb; margin-bottom: 20px;">Congratulations ${candidateName}!</h1>
      
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
        We are delighted to extend an offer for the position of <strong>${position}</strong> at our company.
      </p>
      
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
        Please find your detailed offer letter attached to this email. The offer contains:
      </p>
      
      <ul style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        <li>Complete compensation details</li>
        <li>Job responsibilities and expectations</li>
        <li>Benefits and perks</li>
        <li>Start date and other important information</li>
      </ul>
      
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
        Please review the offer carefully and respond within <strong>5 business days</strong>. 
        If you have any questions, please don't hesitate to reach out.
      </p>
      
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
        We look forward to welcoming you to our team!
      </p>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
        <p style="font-size: 14px; color: #6b7280; margin: 0;">
          Best regards,<br>
          HR Team<br>
          Your Company Name
        </p>
      </div>
    </div>
  `;
};

export default OfferLetterApiService;
