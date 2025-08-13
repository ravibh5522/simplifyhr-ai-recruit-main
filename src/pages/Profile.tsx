import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Building, Phone, Loader2, Upload, FileText, Star } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { profile, updateProfile, updateRoleSpecificProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    company_name: profile?.company_name || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await updateProfile(formData);
      
      if (error) throw error;

      toast({
        title: "Profile updated successfully",
        description: "Your profile information has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // In pages/Profile.tsx

const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file || !profile?.id) return;

  // ... (Your file type and size checks are perfect)

  setUploading(true);
  try {
    // 1. Upload the file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}/resume.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);

    // 2. Decide what to do next based on the file type
    if (file.type === 'text/plain') {
      // If it's a text file, pass it to the AI analyzer.
      // The AI analyzer will be responsible for the database update.
      const fileText = await file.text();
      await analyzeResumeWithAI(fileText, publicUrl);
    } else {
      // If it's any other allowed file type (PDF, DOCX),
      // just update the database with the file's URL.
      const { error } = await updateRoleSpecificProfile({ resume_url: publicUrl });
      if (error) throw error;
      
      toast({
        title: "Resume Uploaded!",
        description: "Your new resume has been saved to your profile.",
      });
    }
  } catch (error: any) {
    console.error('Error uploading resume:', error);
    toast({
      title: "Upload Failed",
      description: error.message || "An unexpected error occurred.",
      variant: "destructive",
    });
  } finally {
    setUploading(false);
  }
};


const analyzeResumeWithAI = async (resumeText: string, resumeUrl: string) => {
  setAnalyzing(true);
  try {
    const { data, error: functionError } = await supabase.functions.invoke('analyze-resume', {
      body: { resumeText }
    });

    if (functionError) throw functionError;

    // Prepare a single object with ALL the updates
    const updates = {
      resume_url: resumeUrl, // The URL from the upload
      resume_text: resumeText, // The text content
      skills: data.skills, // AI data
      experience_years: data.experience_years, // AI data
      ai_summary: data.summary, // AI data
      ai_score: data.score // AI data
    };

    // Make ONE database call to save everything
    const { error: updateError } = await updateRoleSpecificProfile(updates);
    if (updateError) throw updateError;

    toast({
      title: "Resume Analyzed & Saved!",
      description: `Your profile has been updated with AI insights. Score: ${data.score}/100`,
    });
  } catch (error: any) {
    console.error('Error analyzing resume:', error);
    toast({
      title: "Analysis Failed",
      description: error.message || "The AI analysis could not be completed.",
      variant: "destructive",
    });
  } finally {
    setAnalyzing(false);
  }
};

  // const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file || !profile?.id) return;

  //   // Check file type
  //   const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  //   if (!allowedTypes.includes(file.type)) {
  //     toast({
  //       title: "Invalid file type",
  //       description: "Please upload a PDF, DOC, DOCX, or TXT file",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   // Check file size (max 10MB)
  //   if (file.size > 10 * 1024 * 1024) {
  //     toast({
  //       title: "File too large",
  //       description: "Please upload a file smaller than 10MB",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setUploading(true);
  //   try {
  //     // Upload file to storage
  //     const fileExt = file.name.split('.').pop();
  //     const fileName = `${profile.id}/resume.${fileExt}`;
      
  //     const { error: uploadError } = await supabase.storage
  //       .from('resumes')
  //       .upload(fileName, file, {
  //         upsert: true
  //       });

  //     if (uploadError) throw uploadError;

  //     // Get the file URL
  //     const { data: { publicUrl } } = supabase.storage
  //       .from('resumes')
  //       .getPublicUrl(fileName);

  //        const { error } = await updateRoleSpecificProfile({ resume_url: publicUrl });


  //     // If it's a text file, read content for AI analysis
  //     if (file.type === 'text/plain') {
  //       const fileText = await file.text();
  //       // The AI function will handle the database update.
  //       await analyzeResumeWithAI(fileText, publicUrl);
  //     } else {
  //       // For non-text files, just update the URL.
  //       const { error } = await updateRoleSpecificProfile({ resume_url: publicUrl });
  //       if (error) throw error;
  //       toast({ title: "Resume uploaded successfully" });
  //     }
  //   } catch (error: any) {
  //     console.error('Error uploading resume:', error);
  //     toast({
  //       title: "Upload failed",
  //       description: error.message || "Failed to upload resume",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  // const analyzeResumeWithAI = async (resumeText: string, resumeUrl?: string) => {
  //   setAnalyzing(true);
  //   try {
  //     const { data, error } = await supabase.functions.invoke('analyze-resume', {
  //       body: { resumeText }
  //     });

  //     if (error) throw error;

  //     // Update candidate profile with AI analysis
  //     const updates: any = {
  //       resume_text: resumeText,
  //       skills: data.skills,
  //       experience_years: data.experience_years,
  //       ai_summary: data.summary,
  //       ai_score: data.score
  //     };

  //     if (resumeUrl) {
  //       updates.resume_url = resumeUrl;
  //     }

  //     const { error: updateError } = await updateRoleSpecificProfile(updates);
  //     if (updateError) throw updateError;

  //     toast({
  //       title: "Resume analyzed successfully",
  //       description: `Your profile has been updated with AI insights. Score: ${data.score}/100`,
  //     });
  //   } catch (error: any) {
  //     console.error('Error analyzing resume:', error);
  //     toast({
  //       title: "Analysis failed",
  //       description: error.message || "Failed to analyze resume with AI",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setAnalyzing(false);
  //   }
  // };

  // const updateCandidateProfile = async (updates: any) => {
  //   if (!profile?.user_id) return;

  //   const { error } = await supabase
  //     .from('candidates')
  //     .upsert({
  //       user_id: profile.user_id,
  //       email: profile.email,
  //       first_name: profile.first_name || '',
  //       last_name: profile.last_name || '',
  //       ...updates
  //     });

  //   if (error) throw error;
  // };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'client':
        return 'Client';
      case 'vendor':
        return 'Vendor';
      case 'candidate':
        return 'Candidate';
      default:
        return role;
    }
  };

  return (
    <DashboardLayout title="Profile">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Enhanced Profile Header */}
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <CardHeader className="relative -mt-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg bg-white">
                <AvatarImage src={profile?.avatar_url} alt={profile?.first_name} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                  {getInitials(profile?.first_name, profile?.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-3 flex-1">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {profile?.first_name} {profile?.last_name}
                  </h1>
                  <p className="text-muted-foreground text-lg flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {profile?.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm px-3 py-1 bg-gradient-to-r from-primary/10 to-primary/20 text-primary">
                    <User className="w-4 h-4 mr-1" />
                    {getRoleDisplayName(profile?.role)}
                  </Badge>
                  {profile?.company_name && (
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      <Building className="w-4 h-4 mr-1" />
                      {profile.company_name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Enhanced Profile Form */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              Personal Information
            </CardTitle>
            <CardDescription className="text-base">
              Keep your personal details and contact information up to date
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      placeholder="Enter your first name"
                      className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                    Last Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      placeholder="Enter your last name"
                      className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Enter your email address"
                    className="h-12 border-gray-200 focus:border-primary focus:ring-primary"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    className="h-12 border-gray-200 focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="company_name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Company Name
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="Enter your company name"
                  className="h-12 border-gray-200 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="px-8 h-12"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="px-8 h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Enhanced Resume Upload Section */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              Resume & AI Analysis
            </CardTitle>
            <CardDescription className="text-base">
              Upload your resume for AI-powered profile enhancement and skill extraction
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="border-2 border-dashed border-primary/20 rounded-xl p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all duration-300">
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleResumeUpload}
                  className="hidden"
                  disabled={uploading || analyzing}
                />
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer flex flex-col items-center space-y-4"
                >
                  <div className="p-4 bg-white rounded-full shadow-lg">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-gray-800">
                      {uploading ? 'Uploading Resume...' : analyzing ? 'Analyzing Resume...' : 'Upload Your Resume'}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      PDF, DOC, DOCX, or TXT files (max 10MB)
                    </p>
                  </div>
                </label>
              </div>

              {(uploading || analyzing) && (
                <div className="flex items-center justify-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    {uploading ? 'Uploading resume to secure storage...' : 'AI is analyzing your resume...'}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-blue-500 rounded-full">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-blue-900">Skills Extraction</h3>
                    <p className="text-sm text-blue-700">AI identifies and categorizes your technical and soft skills</p>
                  </div>
                </div>
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-green-500 rounded-full">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-green-900">Experience Analysis</h3>
                    <p className="text-sm text-green-700">Automatically calculates experience years and career level</p>
                  </div>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-purple-500 rounded-full">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-purple-900">Profile Scoring</h3>
                    <p className="text-sm text-purple-700">Gets an AI-powered compatibility score for better matching</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;