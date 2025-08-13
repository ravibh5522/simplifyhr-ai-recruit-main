import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Bot, 
  Plus, 
  Loader2, 
  Sparkles, 
  Users, 
  DollarSign, 
  FileText,
  Settings,
  Target,
  Share,
  X,
  User
} from 'lucide-react';

interface CreateJobModalProps {
  onJobCreated?: () => void;
  trigger?: React.ReactNode;
}

interface InterviewRound {
  round: number;
  type: 'ai' | 'human' | 'ai_human';
  criteria: string;
  duration: number;
  aiGeneratedCriteria?: string; // Store AI-generated criteria separately
  interviewerName?: string;
  interviewerEmail?: string;
  interviewerPhone?: string;
}

const CreateJobModal = ({ onJobCreated, trigger }: CreateJobModalProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');

  // Form state
  const [jobTitle, setJobTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aiGeneratedDescription, setAiGeneratedDescription] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [remoteAllowed, setRemoteAllowed] = useState(false);
  const [salaryMin, setSalaryMin] = useState<number | undefined>();
  const [salaryMax, setSalaryMax] = useState<number | undefined>();
  const [currency, setCurrency] = useState('IDR');
  const [budgetRangeMin, setBudgetRangeMin] = useState<number | undefined>();
  const [budgetRangeMax, setBudgetRangeMax] = useState<number | undefined>();
  const [budgetAutoSuggested, setBudgetAutoSuggested] = useState(false);
  const [totalPositions, setTotalPositions] = useState(1);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [skillsRequired, setSkillsRequired] = useState<string[]>([]);
  const [scoringCriteria, setScoringCriteria] = useState<string[]>([]);
  const [minAssessmentScore, setMinAssessmentScore] = useState(70);
  const [interviewRounds, setInterviewRounds] = useState<InterviewRound[]>([
    { round: 1, type: 'human', criteria: '', duration: 60, aiGeneratedCriteria: '', interviewerName: '', interviewerEmail: '', interviewerPhone: '' }
  ]);

  // Publishing options
  const [publishToLinkedin, setPublishToLinkedin] = useState(false);
  const [publishToWebsite, setPublishToWebsite] = useState(true);
  const [publishToVendors, setPublishToVendors] = useState(false);
  const [publishToSimplifyHiring, setPublishToSimplifyHiring] = useState(true);
  const [assignedVendors, setAssignedVendors] = useState<string[]>([]);

  // Data
  const [clientCompanyId, setClientCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [vendors, setVendors] = useState<any[]>([]);
  const [offerTemplates, setOfferTemplates] = useState<any[]>([]);
  const [selectedOfferTemplate, setSelectedOfferTemplate] = useState('');
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [budgetRecommendation, setBudgetRecommendation] = useState<any>(null);
  const [budgetOverridden, setBudgetOverridden] = useState(false);

  // Input helpers
  const [requirementInput, setRequirementInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [criteriaInput, setCriteriaInput] = useState('');

  useEffect(() => {
    if (open) {
      fetchData();
      // Reset any previous state when modal opens
      setBudgetOverridden(false);
      setBudgetRecommendation(null);
      // Set company name from profile or empty string
      setCompanyName(profile?.company_name || '');
    }
  }, [open, profile]);

  const fetchData = async () => {
    try {
      // Find or create company for the client
      await findOrCreateClientCompany();

      // Fetch vendors
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('vendor_name');

      // Fetch offer templates
      const { data: templatesData } = await supabase
        .from('offer_templates')
        .select('*')
        .eq('created_by', profile?.user_id)
        .order('template_name');

      setVendors(vendorsData || []);
      setOfferTemplates(templatesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const findOrCreateClientCompany = async () => {
    // Check if we have company name from profile or manual input
    const companyNameToUse = profile?.company_name || 'Default Company';
    
    if (!companyNameToUse || companyNameToUse === 'Default Company') {
      console.log('No company name in profile, will use default or prompt user');
    }

    try {
      // First, try to find existing company
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', companyNameToUse)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (existingCompany) {
        setClientCompanyId(existingCompany.id);
        console.log('Found existing company:', existingCompany.id);
        return;
      }

      // If not found, create a new company
      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({
          name: companyNameToUse,
          is_active: true,
          country: 'Indonesia' // Default country
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating company:', error);
        throw error;
      }

      if (newCompany) {
        setClientCompanyId(newCompany.id);
        console.log('Created new company:', newCompany.id);
        
        // Update user profile with company name if it wasn't set
        if (!profile?.company_name) {
          await supabase
            .from('profiles')
            .update({ company_name: companyNameToUse })
            .eq('user_id', profile?.user_id);
        }
      }
    } catch (error) {
      console.error('Error finding/creating company:', error);
      toast({
        title: "Company setup failed",
        description: "Could not set up company information. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to create company with provided name
  const findOrCreateClientCompanyWithName = async (companyNameToUse: string) => {
    try {
      // First, try to find existing company that the user can access
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', companyNameToUse)
        .limit(1)
        .maybeSingle();

      if (existingCompany) {
        setClientCompanyId(existingCompany.id);
        console.log('Found existing company:', existingCompany.id);
        return;
      }

      // Ensure the user has a profile before creating a company
      if (profile?.user_id) {
        // Check if profile exists in database
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', profile.user_id)
          .maybeSingle();

        if (!profileData) {
          console.log('Profile not found, creating one...');
          // Create profile if it doesn't exist
          await supabase
            .from('profiles')
            .insert({
              user_id: profile.user_id,
              email: profile.email,
              first_name: profile.first_name,
              last_name: profile.last_name,
              role: 'client',
              company_name: companyNameToUse
            });
        }
      }

      // If not found, create a new company
      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({
          name: companyNameToUse,
          is_active: true,
          country: 'Indonesia'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating company:', error);
        throw error;
      }

      if (newCompany) {
        setClientCompanyId(newCompany.id);
        console.log('Created new company:', newCompany.id);
        
        // Update user profile with company name
        if (profile?.user_id) {
          await supabase
            .from('profiles')
            .update({ company_name: companyNameToUse })
            .eq('user_id', profile.user_id);
        }
      }
    } catch (error) {
      console.error('Error finding/creating company:', error);
      throw error;
    }
  };

  // Generate round-specific scoring criteria
  const generateRoundCriteria = (type: string, round: number, globalCriteria: string[]): string => {
    const baseMap: { [key: string]: string[] } = {
      'ai': [
        'Algorithm problem-solving capability',
        'Code quality and best practices',
        'Technical knowledge depth',
        'Logical reasoning and approach'
      ],
      'human': [
        'Communication and presentation skills',
        'Cultural fit and team collaboration',
        'Leadership potential and mentoring ability',
        'Domain expertise and experience'
      ],
      'ai_human': [
        'Technical skills demonstration',
        'Communication effectiveness',
        'Problem-solving approach',
        'Team collaboration potential'
      ]
    };

    const roundSpecific = baseMap[type] || baseMap['human'];
    
    // Add round-specific criteria
    if (round === 1) {
      roundSpecific.push('Initial screening and basic qualifications');
    } else if (round === 2) {
      roundSpecific.push('Advanced technical assessment');
    } else {
      roundSpecific.push('Final evaluation and cultural alignment');
    }

    // Combine with global criteria if available
    const combinedCriteria = [...roundSpecific];
    if (globalCriteria.length > 0) {
      combinedCriteria.push(...globalCriteria.slice(0, 2)); // Add top 2 global criteria
    }

    return combinedCriteria.slice(0, 3).join(', '); // Return top 3 criteria as comma-separated string
  };

  const generateJobDescription = async () => {
    if (!jobTitle.trim()) {
      toast({
        title: "Job title required",
        description: "Please enter a job title to generate description",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setDescription(''); // Clear existing description for streaming
    setAiGeneratedDescription(''); // Clear AI generated description
    
    try {
      const companyName = profile?.company_name;
      
      console.log('Starting AI job description generation...');
      
      // Try streaming AI generation
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`https://nwohehoountzfudzygqg.supabase.co/functions/v1/generate-job-description-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          jobTitle,
          companyName: companyName,
          industry: 'Technology', // Default industry
          experienceLevel,
          employmentType,
          location,
          skills: skillsRequired,
          budgetMin: salaryMin,
          budgetMax: salaryMax,
          currency
        }),
      });

      if (!response.ok) {
        console.error('AI generation failed:', response.status, response.statusText);
        throw new Error(`Failed to generate job description: ${response.status}`);
      }

      console.log('Starting to read streaming response...');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No reader available for streaming');
      }

      let accumulatedDescription = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim()) {
              try {
                const parsed = JSON.parse(data);
                console.log('Received streaming data:', parsed.type);
                
                if (parsed.type === 'content') {
                  accumulatedDescription += parsed.content;
                  setDescription(accumulatedDescription);
                  console.log('Updated description length:', accumulatedDescription.length);
                } else if (parsed.type === 'complete') {
                  console.log('AI generation completed');
                  setAiGeneratedDescription(parsed.fullDescription);
                  setDescription(parsed.fullDescription);
                  
                  // Apply AI budget recommendation
                  if (parsed.budgetRecommendation && !budgetOverridden) {
                    setBudgetRecommendation(parsed.budgetRecommendation);
                    setBudgetRangeMin(parsed.budgetRecommendation.min);
                    setBudgetRangeMax(parsed.budgetRecommendation.max);
                    setBudgetAutoSuggested(true);
                  }
                  
                  // Apply AI suggestions
                  if (parsed.scoringCriteria?.length) {
                    setScoringCriteria(parsed.scoringCriteria);
                  }
                  
                  // Generate AI scoring criteria for each interview round
                  const updatedRounds = interviewRounds.map((round, index) => ({
                    ...round,
                    aiGeneratedCriteria: generateRoundCriteria(round.type, round.round, parsed.scoringCriteria || []),
                    criteria: round.criteria || generateRoundCriteria(round.type, round.round, parsed.scoringCriteria || [])
                  }));
                  setInterviewRounds(updatedRounds);
                  
                  if (parsed.suggestedSkills?.length) {
                    setSkillsRequired(prev => [...new Set([...prev, ...parsed.suggestedSkills])]);
                  }
                  
                  if (parsed.suggestedRequirements?.length) {
                    setRequirements(prev => [...new Set([...prev, ...parsed.suggestedRequirements])]);
                  }
                  
                  toast({
                    title: "Job description generated!",
                    description: "AI has created a comprehensive job description with budget recommendations and scoring criteria.",
                  });
                } else if (parsed.type === 'error') {
                  console.error('AI generation error:', parsed.error);
                  throw new Error(parsed.error);
                }
              } catch (e) {
                console.log('Error parsing streaming data:', e);
              }
            }
          }
        }
      }
      
    } catch (error: any) {
      console.error('Error generating job description:', error);
      
      toast({
        title: "AI generation failed",
        description: "Switching to template-based generation",
        variant: "destructive",
      });
      
      // Fallback to template-based generation
      const templateDescription = generateTemplateDescription({
        jobTitle,
        companyName: profile?.company_name || 'Our Company',
        industry: 'Technology',
        experienceLevel,
        employmentType,
        location,
        salaryMin,
        salaryMax,
        currency
      });

      setDescription(templateDescription);
      
      // Add default skills and requirements
      const defaultSkills = getDefaultSkills(jobTitle);
      const defaultRequirements = getDefaultRequirements(experienceLevel);
      const defaultCriteria = getDefaultScoringCriteria();

      setSkillsRequired(prev => [...new Set([...prev, ...defaultSkills])]);
      setRequirements(prev => [...new Set([...prev, ...defaultRequirements])]);
      setScoringCriteria(prev => [...new Set([...prev, ...defaultCriteria])]);

      // Generate AI scoring criteria for each interview round with fallback
      const updatedRounds = interviewRounds.map((round, index) => ({
        ...round,
        aiGeneratedCriteria: generateRoundCriteria(round.type, round.round, defaultCriteria),
        criteria: round.criteria || generateRoundCriteria(round.type, round.round, defaultCriteria)
      }));
      setInterviewRounds(updatedRounds);

      toast({
        title: "Template description created",
        description: "Using template-based job description. You can edit and customize it.",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Template-based job description generator
  const generateTemplateDescription = ({
    jobTitle,
    companyName,
    industry,
    experienceLevel,
    employmentType,
    location,
    salaryMin,
    salaryMax,
    currency
  }: any) => {
    const salaryRange = salaryMin && salaryMax ? 
      `${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()} ${currency}` : 
      'Competitive salary package';

    return `## About ${companyName}

${companyName} is a leading ${industry || 'technology'} company committed to innovation and excellence. We're looking for talented individuals to join our dynamic team and contribute to our continued growth and success.

## Position Overview

We are seeking a ${experienceLevel || 'skilled'} ${jobTitle} to join our team. This is a ${employmentType || 'full-time'} position ${location ? `based in ${location}` : 'with flexible location options'}. The successful candidate will play a key role in driving our technology initiatives and contributing to our company's mission.

## Key Responsibilities

• Lead and execute ${jobTitle.toLowerCase()} initiatives and projects
• Collaborate with cross-functional teams to deliver high-quality solutions
• Participate in the full software development lifecycle
• Mentor junior team members and provide technical guidance
• Stay current with industry trends and best practices
• Contribute to code reviews and maintain high coding standards
• Work closely with product managers and stakeholders to understand requirements
• Troubleshoot and resolve technical issues efficiently

## Required Qualifications

• Bachelor's degree in Computer Science, Engineering, or related field
• ${getExperienceText(experienceLevel)} years of professional experience
• Strong problem-solving and analytical skills
• Excellent communication and teamwork abilities
• Experience with modern development tools and methodologies
• Proven track record of delivering successful projects
• Ability to work in a fast-paced, agile environment

## Preferred Qualifications

• Master's degree in relevant field
• Experience with cloud platforms and modern architecture
• Knowledge of DevOps practices and CI/CD pipelines
• Contribution to open-source projects
• Experience in ${industry || 'technology'} industry

## What We Offer

• Competitive salary: ${salaryRange}
• Comprehensive health and dental benefits
• Flexible working arrangements and remote work options
• Professional development opportunities and training budget
• Modern office environment with latest technology
• Team building activities and company events
• Performance-based bonuses and stock options
• Generous vacation policy and paid time off

## Application Process

If you're passionate about technology and want to make a meaningful impact, we'd love to hear from you. Please submit your resume along with a cover letter explaining why you're the perfect fit for this role.

${companyName} is an equal opportunity employer committed to diversity and inclusion.`;
  };

  // Helper functions for default suggestions
  const getDefaultSkills = (jobTitle: string): string[] => {
    const title = jobTitle.toLowerCase();
    if (title.includes('software') || title.includes('developer') || title.includes('engineer')) {
      return ['JavaScript', 'React', 'Node.js', 'Git', 'API Development'];
    }
    if (title.includes('data')) {
      return ['Python', 'SQL', 'Data Analysis', 'Machine Learning', 'Statistics'];
    }
    if (title.includes('design')) {
      return ['Figma', 'Adobe Creative Suite', 'UI/UX Design', 'Prototyping', 'User Research'];
    }
    if (title.includes('product')) {
      return ['Product Strategy', 'Market Research', 'Analytics', 'User Stories', 'Roadmapping'];
    }
    if (title.includes('marketing')) {
      return ['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics', 'Social Media'];
    }
    return ['Communication', 'Problem Solving', 'Teamwork', 'Time Management'];
  };

  const getDefaultRequirements = (experienceLevel: string): string[] => {
    const baseRequirements = [
      'Bachelor\'s degree or equivalent experience',
      'Strong communication skills',
      'Ability to work collaboratively in a team environment'
    ];

    switch (experienceLevel) {
      case 'entry':
        return [...baseRequirements, '0-2 years of professional experience', 'Eagerness to learn and grow'];
      case 'mid':
        return [...baseRequirements, '3-5 years of professional experience', 'Proven track record of successful projects'];
      case 'senior':
        return [...baseRequirements, '5+ years of professional experience', 'Leadership and mentoring experience'];
      case 'lead':
        return [...baseRequirements, '7+ years of professional experience', 'Team leadership experience', 'Strategic thinking abilities'];
      case 'executive':
        return [...baseRequirements, '10+ years of professional experience', 'Executive leadership experience', 'Strategic vision and planning'];
      default:
        return [...baseRequirements, '2+ years of professional experience'];
    }
  };

  const getDefaultScoringCriteria = (): string[] => {
    return [
      'Technical competency and skills demonstration',
      'Problem-solving approach and methodology',
      'Communication and collaboration skills',
      'Cultural fit and team dynamics',
      'Leadership potential and growth mindset'
    ];
  };

  const getExperienceText = (level: string): string => {
    switch (level) {
      case 'entry': return '0-2';
      case 'mid': return '3-5';
      case 'senior': return '5+';
      case 'lead': return '7+';
      case 'executive': return '10+';
      default: return '2+';
    }
  };

  const addRequirement = () => {
    if (requirementInput.trim() && !requirements.includes(requirementInput.trim())) {
      setRequirements([...requirements, requirementInput.trim()]);
      setRequirementInput('');
    }
  };

  const removeRequirement = (req: string) => {
    setRequirements(requirements.filter(r => r !== req));
  };

  const addSkill = () => {
    if (skillInput.trim() && !skillsRequired.includes(skillInput.trim())) {
      setSkillsRequired([...skillsRequired, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkillsRequired(skillsRequired.filter(s => s !== skill));
  };

  const addCriteria = () => {
    if (criteriaInput.trim() && !scoringCriteria.includes(criteriaInput.trim())) {
      setScoringCriteria([...scoringCriteria, criteriaInput.trim()]);
      setCriteriaInput('');
    }
  };

  const removeCriteria = (criteria: string) => {
    setScoringCriteria(scoringCriteria.filter(c => c !== criteria));
  };

  const uploadOfferTemplate = async (file: File) => {
    setUploadingTemplate(true);
    try {
      const fileName = `${profile?.user_id}/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('offer-templates')
        .upload(fileName, file);

      if (error) throw error;

      // Create template record
      const { data: template, error: templateError } = await supabase
        .from('offer_templates')
        .insert({
          template_name: file.name,
          template_content: data.path,
          created_by: profile?.user_id
        })
        .select()
        .single();

      if (templateError) throw templateError;

      setOfferTemplates(prev => [...prev, template]);
      setSelectedOfferTemplate(template.id);
      
      toast({
        title: "Template uploaded!",
        description: "Offer template has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading template:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload offer template",
        variant: "destructive",
      });
    } finally {
      setUploadingTemplate(false);
    }
  };
  
  const addInterviewRound = () => {
    const nextRound = interviewRounds.length + 1;
    const newRound: InterviewRound = {
      round: nextRound,
      type: 'human',
      criteria: '',
      duration: 60,
      aiGeneratedCriteria: '',
      interviewerName: '',
      interviewerEmail: '',
      interviewerPhone: ''
    };
    
    // Generate AI criteria for the new round
    const generatedCriteria = generateRoundCriteria(newRound.type, nextRound, scoringCriteria);
    newRound.aiGeneratedCriteria = generatedCriteria;
    newRound.criteria = generatedCriteria;
    
    setInterviewRounds([...interviewRounds, newRound]);
  };

  const updateInterviewRound = (index: number, field: keyof InterviewRound, value: any) => {
    const updated = [...interviewRounds];
    updated[index] = { ...updated[index], [field]: value };
    
    // If type changed, regenerate AI criteria
    if (field === 'type') {
      const newCriteria = generateRoundCriteria(value, updated[index].round, scoringCriteria);
      updated[index].aiGeneratedCriteria = newCriteria;
      updated[index].criteria = newCriteria;
    }
    
    setInterviewRounds(updated);
  };

  const removeInterviewRound = (index: number) => {
    if (interviewRounds.length > 1) {
      const updated = interviewRounds.filter((_, i) => i !== index);
      // Renumber rounds and regenerate criteria
      updated.forEach((round, i) => {
        round.round = i + 1;
        const newCriteria = generateRoundCriteria(round.type, round.round, scoringCriteria);
        round.aiGeneratedCriteria = newCriteria;
        if (!round.criteria || round.criteria === round.aiGeneratedCriteria) {
          round.criteria = newCriteria;
        }
      });
      setInterviewRounds(updated);
    }
  };

  const handleSubmit = async (shouldPublish = false) => {
    // Debug logging
    console.log('Form submission data:', {
      jobTitle: jobTitle,
      jobTitleLength: jobTitle?.length,
      description: description,
      descriptionLength: description?.length,
      clientCompanyId: clientCompanyId,
      shouldPublish
    });

    // Check for interviewer details if there are human interview rounds
    const humanRounds = interviewRounds.filter(round => round.type === 'human' || round.type === 'ai_human');
    
    // Enhanced validation with better error messages
    if (!jobTitle || jobTitle.trim().length === 0) {
      toast({
        title: "Job title required",
        description: "Please enter a job title",
        variant: "destructive",
      });
      setCurrentTab('basic');
      return;
    }

    if (!description || description.trim().length === 0) {
      toast({
        title: "Job description required", 
        description: "Please generate or enter a job description",
        variant: "destructive",
      });
      setCurrentTab('description');
      return;
    }

    if (!companyName || companyName.trim().length === 0) {
      toast({
        title: "Company name required",
        description: "Please enter your company name",
        variant: "destructive",
      });
      setCurrentTab('basic');
      return;
    }

    if (!clientCompanyId) {
      // Try to create company with the entered name
      await findOrCreateClientCompanyWithName(companyName.trim());
      if (!clientCompanyId) {
        toast({
          title: "Company setup failed",
          description: "Could not create company. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    // Check each human round has interviewer details
    for (const round of humanRounds) {
      if (!round.interviewerName?.trim() || !round.interviewerEmail?.trim()) {
        toast({
          title: "Interviewer details required",
          description: `Please provide interviewer name and email for Round ${round.round}`,
          variant: "destructive",
        });
        setCurrentTab('interviews');
        return;
      }
    }

    setLoading(true);
    try {
      // Create the job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert({
          title: jobTitle,
          company_id: clientCompanyId,
          description,
          ai_generated_description: aiGeneratedDescription,
          location,
          employment_type: employmentType,
          experience_level: experienceLevel,
          remote_allowed: remoteAllowed,
          salary_min: salaryMin,
          salary_max: salaryMax,
          currency,
          budget_range_min: budgetRangeMin,
          budget_range_max: budgetRangeMax,
          budget_auto_suggested: budgetAutoSuggested,
          budget_recommendation: budgetRecommendation,
          total_positions: totalPositions,
          requirements,
          skills_required: skillsRequired,
          scoring_criteria: scoringCriteria,
          interview_rounds: interviewRounds.length,
          interview_types: interviewRounds as any,
          publish_to_linkedin: publishToLinkedin,
          publish_to_website: publishToSimplifyHiring,
          publish_to_vendors: publishToVendors,
          assigned_vendors: assignedVendors,
          offer_template_id: selectedOfferTemplate || null,
          created_by: profile?.user_id,
          min_assessment_score: minAssessmentScore,
          status: shouldPublish ? 'published' : 'draft'
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Create interview rounds with interviewer details
      if (jobData) {
        const roundsToCreate = interviewRounds.map(round => ({
          job_id: jobData.id,
          round_number: round.round,
          round_type: round.type,
          scoring_criteria: `${round.criteria}${round.interviewerName ? ` | Interviewer: ${round.interviewerName}` : ''}${round.interviewerEmail ? ` (${round.interviewerEmail})` : ''}${round.interviewerPhone ? ` - ${round.interviewerPhone}` : ''}`,
          duration_minutes: round.duration
        }));

        const { error: roundsError } = await supabase
          .from('interview_rounds')
          .insert(roundsToCreate);

        if (roundsError) {
          console.error('Error creating interview rounds:', roundsError);
          // Don't fail the whole operation for this
        }
      }

      toast({
        title: shouldPublish ? "Job published successfully!" : "Job created successfully!",
        description: shouldPublish 
          ? `${jobTitle} has been published and is now visible to candidates.`
          : `${jobTitle} has been created as a draft. You can publish it when ready.`,
      });

      // Reset form
      resetForm();
      setOpen(false);
      onJobCreated?.();

    } catch (error: any) {
      console.error('Error creating job:', error);
      toast({
        title: "Failed to create job",
        description: error.message || "An error occurred while creating the job",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setJobTitle('');
    setDescription('');
    setAiGeneratedDescription('');
    setLocation('');
    setEmploymentType('');
    setExperienceLevel('');
    setRemoteAllowed(false);
    setSalaryMin(undefined);
    setSalaryMax(undefined);
    setCurrency('IDR');
    setBudgetRangeMin(undefined);
    setBudgetRangeMax(undefined);
    setBudgetAutoSuggested(false);
    setTotalPositions(1);
    setRequirements([]);
    setSkillsRequired([]);
    setScoringCriteria([]);
    setInterviewRounds([{ round: 1, type: 'human', criteria: '', duration: 60, aiGeneratedCriteria: '', interviewerName: '', interviewerEmail: '', interviewerPhone: '' }]);
    setPublishToLinkedin(false);
    setPublishToSimplifyHiring(true);
    setPublishToVendors(false);
    setAssignedVendors([]);
    setSelectedOfferTemplate('');
    setCurrentTab('basic');
  };

  const defaultTrigger = (
    <Button variant="hero" size="sm">
      <Sparkles className="w-4 h-4 mr-2" />
      Create Job with AI
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Create Job with AI
          </DialogTitle>
          <DialogDescription>
            Generate comprehensive job descriptions with AI and configure all hiring settings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="publish">Publish</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company *</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter your company name"
                      className="bg-background"
                    />
                    {!companyName && (
                      <p className="text-xs text-destructive">Company name is required for job creation</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Jakarta, Indonesia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select value={employmentType} onValueChange={setEmploymentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceLevel">Experience Level</Label>
                    <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="lead">Lead/Principal</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remoteAllowed"
                    checked={remoteAllowed}
                    onCheckedChange={(checked) => setRemoteAllowed(checked === true)}
                  />
                  <Label htmlFor="remoteAllowed">Remote work allowed</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPositions">Number of Positions</Label>
                  <Input
                    id="totalPositions"
                    type="number"
                    min="1"
                    value={totalPositions}
                    onChange={(e) => setTotalPositions(parseInt(e.target.value) || 1)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="description" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  AI Job Description Generator
                </CardTitle>
                <CardDescription>
                  Generate a comprehensive job description using AI based on the job title and details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={generateJobDescription}
                  disabled={generating || !jobTitle.trim()}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating with AI streaming...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Job Description with AI
                    </>
                  )}
                </Button>

                {generating && (
                  <div className="text-sm text-muted-foreground text-center">
                    <Bot className="w-4 h-4 inline mr-1" />
                    AI is generating content in real-time...
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Job description will be generated here..."
                    rows={12}
                  />
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <Label>Required Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Add a skill..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" onClick={addSkill} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillsRequired.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-2">
                  <Label>Job Requirements</Label>
                  <div className="flex gap-2">
                    <Input
                      value={requirementInput}
                      onChange={(e) => setRequirementInput(e.target.value)}
                      placeholder="Add a requirement..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    />
                    <Button type="button" onClick={addRequirement} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {requirements.map((req, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {req}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeRequirement(req)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Interview Configuration
                </CardTitle>
                <CardDescription>
                  Set up interview rounds, types, and scoring criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Interview Rounds */}
                <div className="space-y-4">
                  <h4 className="font-medium">Interview Rounds</h4>
                  {interviewRounds.map((round, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Round {round.round}</h5>
                        {interviewRounds.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInterviewRound(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Interview Type</Label>
                            <Select
                              value={round.type}
                              onValueChange={(value: 'ai' | 'human' | 'ai_human') => 
                                updateInterviewRound(index, 'type', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="human">Human Interview</SelectItem>
                                <SelectItem value="ai">AI Interview</SelectItem>
                                <SelectItem value="ai_human">AI + Human Interview</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Duration (minutes)</Label>
                            <Input
                              type="number"
                              value={round.duration}
                              onChange={(e) => 
                                updateInterviewRound(index, 'duration', parseInt(e.target.value) || 60)
                              }
                            />
                          </div>
                        </div>
                        
                        {(round.type === 'human' || round.type === 'ai_human') && (
                          <div className="border rounded-lg p-3 space-y-3 bg-blue-50/30">
                            <h6 className="text-sm font-medium flex items-center gap-2">
                              <User className="w-3 h-3" />
                              Interviewer Details for Round {round.round}
                            </h6>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Name *</Label>
                                <Input
                                  value={round.interviewerName || ''}
                                  onChange={(e) => updateInterviewRound(index, 'interviewerName', e.target.value)}
                                  placeholder="e.g., John Doe"
                                  className="text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Email *</Label>
                                <Input
                                  type="email"
                                  value={round.interviewerEmail || ''}
                                  onChange={(e) => updateInterviewRound(index, 'interviewerEmail', e.target.value)}
                                  placeholder="e.g., john@company.com"
                                  className="text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Phone</Label>
                                <Input
                                  value={round.interviewerPhone || ''}
                                  onChange={(e) => updateInterviewRound(index, 'interviewerPhone', e.target.value)}
                                  placeholder="e.g., +62 812 3456"
                                  className="text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Scoring Criteria</Label>
                            {round.aiGeneratedCriteria && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => updateInterviewRound(index, 'criteria', round.aiGeneratedCriteria)}
                                className="text-xs"
                              >
                                <Bot className="w-3 h-3 mr-1" />
                                Reset to AI
                              </Button>
                            )}
                          </div>
                          <Textarea
                            value={round.criteria}
                            onChange={(e) => 
                              updateInterviewRound(index, 'criteria', e.target.value)
                            }
                            placeholder={round.aiGeneratedCriteria || "AI will generate criteria based on interview type"}
                            rows={3}
                            className="text-sm"
                          />
                          {round.aiGeneratedCriteria && round.criteria !== round.aiGeneratedCriteria && (
                            <p className="text-xs text-muted-foreground">
                              <Bot className="w-3 h-3 inline mr-1" />
                              AI suggested: {round.aiGeneratedCriteria}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button type="button" onClick={addInterviewRound} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Interview Round
                </Button>

                <Separator />

                {/* Global Scoring Criteria */}
                <div className="space-y-2">
                  <Label>Global Scoring Criteria</Label>
                  <div className="flex gap-2">
                    <Input
                      value={criteriaInput}
                      onChange={(e) => setCriteriaInput(e.target.value)}
                      placeholder="Add scoring criteria..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCriteria())}
                    />
                    <Button type="button" onClick={addCriteria} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {scoringCriteria.map((criteria, index) => (
                      <Badge key={index} variant="default" className="flex items-center gap-1">
                        {criteria}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeCriteria(criteria)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* AI Assessment Minimum Score */}
                <div className="space-y-2">
                  <Label htmlFor="minAssessmentScore">Minimum AI Assessment Score for Interview (%)</Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      id="minAssessmentScore"
                      type="number"
                      min={0}
                      max={100}
                      value={minAssessmentScore}
                      onChange={(e) => setMinAssessmentScore(parseInt(e.target.value) || 70)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">
                      Applications scoring {minAssessmentScore}% or higher will be shortlisted for interview
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI will automatically assess applications against your job description and shortlist/reject based on this score
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            {/* AI Budget Recommendation */}
            {budgetRecommendation && (
              <Card className="border-l-4 border-l-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Bot className="w-4 h-4" />
                    AI Budget Recommendation
                  </CardTitle>
                  <CardDescription>
                    AI has analyzed market data and suggests the following budget range
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Recommended Min Budget</Label>
                      <div className="p-3 bg-background rounded-md border">
                        <span className="text-lg font-semibold text-green-600">
                          {budgetRecommendation.min?.toLocaleString()} {currency}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Recommended Max Budget</Label>
                      <div className="p-3 bg-background rounded-md border">
                        <span className="text-lg font-semibold text-green-600">
                          {budgetRecommendation.max?.toLocaleString()} {currency}
                        </span>
                      </div>
                    </div>
                  </div>
                  {budgetRecommendation.reasoning && (
                    <div className="space-y-2">
                      <Label>AI Reasoning</Label>
                      <p className="text-sm text-muted-foreground bg-background p-3 rounded-md border">
                        {budgetRecommendation.reasoning}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSalaryMin(budgetRecommendation.min);
                        setSalaryMax(budgetRecommendation.max);
                        setBudgetRangeMin(budgetRecommendation.min);
                        setBudgetRangeMax(budgetRecommendation.max);
                        toast({
                          title: "Budget applied",
                          description: "AI recommendation has been applied to salary fields",
                        });
                      }}
                    >
                      Apply to Salary
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBudgetRecommendation(null);
                        setBudgetOverridden(true);
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Budget content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Salary & Budget Configuration
                </CardTitle>
                <CardDescription>
                  Set salary ranges and budget recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IDR">IDR (Rupiah)</SelectItem>
                        <SelectItem value="USD">USD (Dollar)</SelectItem>
                        <SelectItem value="SGD">SGD (Singapore Dollar)</SelectItem>
                        <SelectItem value="MYR">MYR (Ringgit)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="salaryMin">Salary Min</Label>
                    <Input
                      id="salaryMin"
                      type="number"
                      value={salaryMin || ''}
                      onChange={(e) => {
                        setSalaryMin(parseInt(e.target.value) || undefined);
                        setBudgetOverridden(true);
                      }}
                      placeholder="Minimum salary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="salaryMax">Salary Max</Label>
                    <Input
                      id="salaryMax"
                      type="number"
                      value={salaryMax || ''}
                      onChange={(e) => {
                        setSalaryMax(parseInt(e.target.value) || undefined);
                        setBudgetOverridden(true);
                      }}
                      placeholder="Maximum salary"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Budget Range Min</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      value={budgetRangeMin || ''}
                      onChange={(e) => setBudgetRangeMin(parseInt(e.target.value) || undefined)}
                      placeholder="Minimum budget"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Budget Range Max</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      value={budgetRangeMax || ''}
                      onChange={(e) => setBudgetRangeMax(parseInt(e.target.value) || undefined)}
                      placeholder="Maximum budget"
                    />
                  </div>
                </div>

                {budgetAutoSuggested && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    Budget ranges were auto-suggested by AI
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="publish" className="space-y-6">
            {/* Publishing options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share className="w-4 h-4" />
                  Publishing Options
                </CardTitle>
                <CardDescription>
                  Choose where to publish this job posting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="publishToSimplifyHiring"
                      checked={publishToSimplifyHiring}
                      onCheckedChange={(checked) => setPublishToSimplifyHiring(checked === true)}
                    />
                    <Label htmlFor="publishToSimplifyHR" className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary" />
                      Publish to SimplifyHR Job Portal
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="publishToLinkedin"
                      checked={publishToLinkedin}
                      onCheckedChange={(checked) => setPublishToLinkedin(checked === true)}
                    />
                    <Label htmlFor="publishToLinkedin">Publish to LinkedIn</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="publishToVendors"
                      checked={publishToVendors}
                      onCheckedChange={(checked) => setPublishToVendors(checked === true)}
                    />
                    <Label htmlFor="publishToVendors">Share with recruitment vendors</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => handleSubmit(false)} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save as Draft'
              )}
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Share className="w-4 h-4 mr-2" />
                  Publish Job
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobModal;