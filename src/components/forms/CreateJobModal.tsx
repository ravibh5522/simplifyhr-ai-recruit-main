import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Bot,
  Building2,
  Calculator,
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
  User,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Globe,
  TrendingUp,
  Shield,
  MapPin,
  Building,
} from "lucide-react";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer"; // Adjust path if needed
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface CreateJobModalProps {
  onJobCreated?: () => void;
  trigger?: React.ReactNode;
}

interface InterviewRound {
  round: number;
  type: "ai" | "human" | "ai_human";
  criteria: string;
  duration: number;
  aiGeneratedCriteria?: string; // Store AI-generated criteria separately
  interviewerProfileId?: string; //
  // interviewerName?: string;
  // interviewerEmail?: string;
  // interviewerPhone?: string;
}

const CreateJobModal = ({ onJobCreated, trigger }: CreateJobModalProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentTab, setCurrentTab] = useState("basic");

  // Form validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedTabs, setCompletedTabs] = useState<string[]>([]);

  // Form state
  const [jobTitle, setJobTitle] = useState("");
  const [description, setDescription] = useState("");
  const [aiGeneratedDescription, setAiGeneratedDescription] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [remoteAllowed, setRemoteAllowed] = useState(false);
  const [salaryMin, setSalaryMin] = useState<number | undefined>();
  const [salaryMax, setSalaryMax] = useState<number | undefined>();
  const [currency, setCurrency] = useState("IDR");
  const [budgetRangeMin, setBudgetRangeMin] = useState<number | undefined>();
  const [budgetRangeMax, setBudgetRangeMax] = useState<number | undefined>();
  const [budgetAutoSuggested, setBudgetAutoSuggested] = useState(false);
  const [totalPositions, setTotalPositions] = useState(1);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [skillsRequired, setSkillsRequired] = useState<string[]>([]);
  const [scoringCriteria, setScoringCriteria] = useState<string[]>([]);
  const [minAssessmentScore, setMinAssessmentScore] = useState(70);
  const [interviewers, setInterviewers] = useState<any[]>([]);
  const [interviewRounds, setInterviewRounds] = useState<InterviewRound[]>([
    {
      round: 1,
      type: "human",
      criteria: "",
      duration: 60,
      aiGeneratedCriteria: "",
      interviewerProfileId: undefined,
    },
  ]);

  // --- ADD A NEW STATE FOR TOGGLING THE VIEW ---
  const [isDescriptionPreview, setIsDescriptionPreview] = useState(true);

  // Publishing options
  const [publishToLinkedin, setPublishToLinkedin] = useState(false);
  const [publishToWebsite, setPublishToWebsite] = useState(true);
  const [publishToVendors, setPublishToVendors] = useState(false);
  const [publishToSimplifyHR, setPublishToSimplifyHR] = useState(true);
  const [assignedVendors, setAssignedVendors] = useState<string[]>([]);

  // Data
  const [clientCompanyId, setClientCompanyId] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [offerTemplates, setOfferTemplates] = useState<any[]>([]);
  const [selectedOfferTemplate, setSelectedOfferTemplate] = useState("");
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [budgetRecommendation, setBudgetRecommendation] = useState<any>(null);
  const [budgetOverridden, setBudgetOverridden] = useState(false);

  // Input helpers
  const [requirementInput, setRequirementInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [criteriaInput, setCriteriaInput] = useState("");

  // Form validation functions
  const validateBasicInfo = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!jobTitle.trim()) {
      newErrors.jobTitle = "Job title is required";
    }
    if (!companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    if (totalPositions < 1) {
      newErrors.totalPositions = "Must have at least 1 position";
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateDescription = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!description.trim()) {
      newErrors.description = "Job description is required";
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateInterviews = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    interviewRounds.forEach((round, index) => {
      if ((round.type === "human" || round.type === "ai_human") && !round.interviewerProfileId) {
        newErrors[`round_${index}`] = `Please select an interviewer for Round ${round.round}`;
      }
    });
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateBudget = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (salaryMin && salaryMax && salaryMin >= salaryMax) {
      newErrors.salary = "Maximum salary must be greater than minimum salary";
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const updateTabCompletion = (tab: string) => {
    let isValid = false;
    
    switch (tab) {
      case "basic":
        isValid = validateBasicInfo();
        break;
      case "description":
        isValid = validateDescription();
        break;
      case "interviews":
        isValid = validateInterviews();
        break;
      case "budget":
        isValid = validateBudget();
        break;
      case "publish":
        isValid = true; // No validation required for publish tab
        break;
    }
    
    if (isValid && !completedTabs.includes(tab)) {
      setCompletedTabs(prev => [...prev, tab]);
    } else if (!isValid && completedTabs.includes(tab)) {
      setCompletedTabs(prev => prev.filter(t => t !== tab));
    }
  };

  const getFormProgress = (): { overall: number; details: Record<string, number> } => {
    const tabProgress = {
      basic: 0,
      description: 0,
      interviews: 0,
      budget: 0,
      publish: 0
    };

    // Basic Info Progress (25% of total)
    let basicScore = 0;
    if (jobTitle.trim()) basicScore += 40;
    if (companyName.trim()) basicScore += 30;
    if (location.trim()) basicScore += 15;
    if (employmentType) basicScore += 10;
    if (experienceLevel) basicScore += 5;
    tabProgress.basic = Math.min(basicScore, 100);

    // Description Progress (25% of total)
    let descScore = 0;
    if (description.trim()) descScore += 70;
    if (skillsRequired.length > 0) descScore += 20;
    if (requirements.length > 0) descScore += 10;
    tabProgress.description = Math.min(descScore, 100);

    // Interviews Progress (25% of total)
    let interviewScore = 0;
    if (interviewRounds.length > 0) interviewScore += 50;
    const validRounds = interviewRounds.filter(round => {
      if (round.type === "ai") return true;
      return round.interviewerProfileId;
    });
    if (validRounds.length === interviewRounds.length) interviewScore += 30;
    if (scoringCriteria.length > 0) interviewScore += 20;
    tabProgress.interviews = Math.min(interviewScore, 100);

    // Budget Progress (15% of total)
    let budgetScore = 0;
    if (salaryMin && salaryMax && salaryMin < salaryMax) budgetScore += 80;
    if (currency) budgetScore += 20;
    tabProgress.budget = Math.min(budgetScore, 100);

    // Publish Progress (10% of total)
    let publishScore = 0;
    if (publishToSimplifyHR || publishToWebsite || publishToLinkedin || publishToVendors) publishScore += 100;
    tabProgress.publish = publishScore;

    // Calculate weighted overall progress
    const weights = { basic: 0.25, description: 0.25, interviews: 0.25, budget: 0.15, publish: 0.1 };
    const overall = Object.keys(tabProgress).reduce((total, tab) => {
      return total + (tabProgress[tab as keyof typeof tabProgress] * weights[tab as keyof typeof weights]);
    }, 0);

    return { overall: Math.round(overall), details: tabProgress };
  };

  useEffect(() => {
    if (open) {
      fetchData();
      // Reset any previous state when modal opens
      setBudgetOverridden(false);
      setBudgetRecommendation(null);
      // Set company name from profile or empty string
      setCompanyName(profile?.company_name || "");
    }
  }, [open, profile]);

  const fetchData = async () => {
    try {
      // Find or create company for the client
      await findOrCreateClientCompany();

      // Fetch vendors
      const { data: vendorsData } = await supabase
        .from("vendors")
        .select("*")
        .eq("is_active", true)
        .order("vendor_name");

      // Fetch offer templates
      const { data: templatesData } = await supabase
        .from("offer_templates")
        .select("*")
        .eq("created_by", profile?.id)
        .order("template_name");

      // Fetch interviewers using RPC function (similar to ref.tsx)
      const { data: interviewersData, error: interviewersError } =
        await supabase
        .rpc('get_company_interviewers');

      if (interviewersError) {
        console.warn("Could not fetch interviewers:", interviewersError);
        setInterviewers([]);
      } else {
        setInterviewers(interviewersData || []);
        console.log("Successfully fetched interviewers via RPC:", interviewersData);
      }

      setVendors(vendorsData || []);
      setOfferTemplates(templatesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const findOrCreateClientCompany = async () => {
    const companyNameToUse = profile?.company_name || "Default Company";
    if (companyNameToUse === "Default Company") return; // Don't create default companies automatically

    try {
      console.log(
        `Pre-fetching company ID for: "${companyNameToUse}" using direct query...`
      );

      // Try to find existing company first
      const { data: existingCompany, error: findError } = await supabase
        .from("companies")
        .select("id")
        .ilike("name", companyNameToUse)
        .single();

      if (findError && findError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw findError;
      }

      if (existingCompany) {
        setClientCompanyId(existingCompany.id);
        console.log("Pre-fetched existing company ID:", existingCompany.id);
        return;
      }

      // If company doesn't exist, create it
      const { data: newCompany, error: createError } = await supabase
        .from("companies")
        .insert({
          name: companyNameToUse,
          country: "Indonesia", // Default country
          is_active: true
        })
        .select("id")
        .single();

      if (createError) throw createError;

      if (newCompany) {
        setClientCompanyId(newCompany.id);
        console.log("Created and set company ID:", newCompany.id);
      }
    } catch (error: any) {
      console.error("Error in findOrCreateClientCompany:", error.message);
      // Don't show a toast here, as it's not a critical failure on load.
    }
  };

  const findOrCreateClientCompanyWithName = async (
    companyNameToUse: string
  ) => {
    try {
      // First, try to find existing company
      const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .ilike("name", companyNameToUse)
        .maybeSingle();

      if (existingCompany) {
        setClientCompanyId(existingCompany.id);
        console.log("Found existing company:", existingCompany.id);
        return;
      }

      // If not found, create a new company
      const { data: newCompany, error } = await supabase
        .from("companies")
        .insert({
          name: companyNameToUse,
          is_active: true,
          country: "Indonesia",
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating company:", error);
        throw error;
      }

      if (newCompany) {
        setClientCompanyId(newCompany.id);
        console.log("Created new company:", newCompany.id);

        // Update user profile with company name
        if (profile?.id) {
          await supabase
            .from("profiles")
            .update({ company_name: companyNameToUse })
            .eq("user_id", profile.id);
        }
      }
    } catch (error) {
      console.error("Error finding/creating company:", error);
      throw error;
    }
  };

  // Generate round-specific scoring criteria
  const generateRoundCriteria = (
    type: string,
    round: number,
    globalCriteria: string[]
  ): string => {
    const baseMap: { [key: string]: string[] } = {
      ai: [
        "Algorithm problem-solving capability",
        "Code quality and best practices",
        "Technical knowledge depth",
        "Logical reasoning and approach",
      ],
      human: [
        "Communication and presentation skills",
        "Cultural fit and team collaboration",
        "Leadership potential and mentoring ability",
        "Domain expertise and experience",
      ],
      ai_human: [
        "Technical skills demonstration",
        "Communication effectiveness",
        "Problem-solving approach",
        "Team collaboration potential",
      ],
    };

    const roundSpecific = baseMap[type] || baseMap["human"];

    // Add round-specific criteria
    if (round === 1) {
      roundSpecific.push("Initial screening and basic qualifications");
    } else if (round === 2) {
      roundSpecific.push("Advanced technical assessment");
    } else {
      roundSpecific.push("Final evaluation and cultural alignment");
    }

    // Combine with global criteria if available
    const combinedCriteria = [...roundSpecific];
    if (globalCriteria.length > 0) {
      combinedCriteria.push(...globalCriteria.slice(0, 2)); // Add top 2 global criteria
    }

    return combinedCriteria.slice(0, 3).join(", "); // Return top 3 criteria as comma-separated string
  };

  // Find this function in your CreateJobModal.tsx file and replace the whole thing.
  // Replace the entire generateJobDescription function in CreateJobModal.tsx

  const generateJobDescription = async () => {
    if (!jobTitle.trim()) {
      toast({
        title: "Job title required",
        description: "Please enter a job title to generate a description.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setDescription("");
    setAiGeneratedDescription("");

    const timeout = setTimeout(() => {
      toast({ title: "AI Generation Timed Out", variant: "destructive" });
      setGenerating(false);
    }, 120000);

    try {
      const apiUrl =
        import.meta.env.VITE_PYTHON_API_URL ||
        "https://jdgen.ximplify.in/generate-job-description-streaming";
      const payload = {
        jobTitle: jobTitle,
        companyName: companyName || profile?.company_name || null,
        industry: "Technology",
        experienceLevel: experienceLevel || null,
        employmentType: employmentType || null,
        location: location || null,
        skills: skillsRequired || [],
        budgetMin: salaryMin !== undefined ? Number(salaryMin) : null,
        budgetMax: salaryMax !== undefined ? Number(salaryMax) : null,
        currency: currency || "IDR",
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: `API request failed` }));
        throw new Error(errorData.detail);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedDescription = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.trim() === "") continue;
          try {
            const event = JSON.parse(line);
            const eventType = event.type;

            if (eventType === "jd_chunk") {
              accumulatedDescription += event.content;
              setDescription(accumulatedDescription);
            } else if (eventType === "structured_data") {
              const finalData = event.data;
              setAiGeneratedDescription(
                finalData.jobDescription || accumulatedDescription
              );

              if (finalData.budgetRecommendation && !budgetOverridden) {
                setBudgetRecommendation(finalData.budgetRecommendation);
                setBudgetRangeMin(finalData.budgetRecommendation.min);
                setBudgetRangeMax(finalData.budgetRecommendation.max);
                setBudgetAutoSuggested(true);
              }
              if (finalData.suggestedSkills) {
                setSkillsRequired((prev) => [
                  ...new Set([...prev, ...finalData.suggestedSkills]),
                ]);
              }
              // ==========================================================
              //  <<<--- THE FIX IS HERE ---<<<
              // ==========================================================
              if (finalData.suggestedRequirements) {
                setRequirements((prev) => [
                  ...new Set([...prev, ...finalData.suggestedRequirements]),
                ]); // Corrected from `final.`
              }
              // ==========================================================
              //  <<<--- END OF FIX ---<<<
              // ==========================================================
              if (finalData.suggestedScoringCriteria) {
                setScoringCriteria(finalData.suggestedScoringCriteria);
                const updatedRounds = interviewRounds.map((round) => ({
                  ...round,
                  criteria:
                    round.criteria ||
                    generateRoundCriteria(
                      round.type,
                      round.round,
                      finalData.suggestedScoringCriteria
                    ),
                }));
                setInterviewRounds(updatedRounds);
              }
            } else if (eventType === "error") {
              throw new Error(
                event.message || "An error occurred on the server."
              );
            }
          } catch (e) {
            console.warn(
              "Received a non-JSON line from stream, skipping:",
              line
            );
          }
        }
      }

      toast({
        title: "Job description generated!",
        description:
          "AI has successfully created the job description and suggestions.",
      });
    } catch (error: any) {
      console.error("Error generating job description:", error);
      toast({
        title: "AI generation failed",
        description:
          error.message || "Could not connect to the generation service.",
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeout);
      setGenerating(false);
    }
  };

  const generateTemplateDescription = ({
    jobTitle,
    companyName,
    industry,
    experienceLevel,
    employmentType,
    location,
    salaryMin,
    salaryMax,
    currency,
  }: any) => {
    const salaryRange =
      salaryMin && salaryMax
        ? `${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()} ${currency}`
        : "Competitive salary package";

    return `## About ${companyName}

${companyName} is a leading ${
      industry || "technology"
    } company committed to innovation and excellence. We're looking for talented individuals to join our dynamic team and contribute to our continued growth and success.

## Position Overview

We are seeking a ${
      experienceLevel || "skilled"
    } ${jobTitle} to join our team. This is a ${
      employmentType || "full-time"
    } position ${
      location ? `based in ${location}` : "with flexible location options"
    }. The successful candidate will play a key role in driving our technology initiatives and contributing to our company's mission.

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
• Experience in ${industry || "technology"} industry

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
    if (
      title.includes("software") ||
      title.includes("developer") ||
      title.includes("engineer")
    ) {
      return ["JavaScript", "React", "Node.js", "Git", "API Development"];
    }
    if (title.includes("data")) {
      return [
        "Python",
        "SQL",
        "Data Analysis",
        "Machine Learning",
        "Statistics",
      ];
    }
    if (title.includes("design")) {
      return [
        "Figma",
        "Adobe Creative Suite",
        "UI/UX Design",
        "Prototyping",
        "User Research",
      ];
    }
    if (title.includes("product")) {
      return [
        "Product Strategy",
        "Market Research",
        "Analytics",
        "User Stories",
        "Roadmapping",
      ];
    }
    if (title.includes("marketing")) {
      return [
        "Digital Marketing",
        "SEO",
        "Content Strategy",
        "Analytics",
        "Social Media",
      ];
    }
    return ["Communication", "Problem Solving", "Teamwork", "Time Management"];
  };

  const getDefaultRequirements = (experienceLevel: string): string[] => {
    const baseRequirements = [
      "Bachelor's degree or equivalent experience",
      "Strong communication skills",
      "Ability to work collaboratively in a team environment",
    ];

    switch (experienceLevel) {
      case "entry":
        return [
          ...baseRequirements,
          "0-2 years of professional experience",
          "Eagerness to learn and grow",
        ];
      case "mid":
        return [
          ...baseRequirements,
          "3-5 years of professional experience",
          "Proven track record of successful projects",
        ];
      case "senior":
        return [
          ...baseRequirements,
          "5+ years of professional experience",
          "Leadership and mentoring experience",
        ];
      case "lead":
        return [
          ...baseRequirements,
          "7+ years of professional experience",
          "Team leadership experience",
          "Strategic thinking abilities",
        ];
      case "executive":
        return [
          ...baseRequirements,
          "10+ years of professional experience",
          "Executive leadership experience",
          "Strategic vision and planning",
        ];
      default:
        return [...baseRequirements, "2+ years of professional experience"];
    }
  };

  const getDefaultScoringCriteria = (): string[] => {
    return [
      "Technical competency and skills demonstration",
      "Problem-solving approach and methodology",
      "Communication and collaboration skills",
      "Cultural fit and team dynamics",
      "Leadership potential and growth mindset",
    ];
  };

  const getExperienceText = (level: string): string => {
    switch (level) {
      case "entry":
        return "0-2";
      case "mid":
        return "3-5";
      case "senior":
        return "5+";
      case "lead":
        return "7+";
      case "executive":
        return "10+";
      default:
        return "2+";
    }
  };

  const addRequirement = () => {
    if (
      requirementInput.trim() &&
      !requirements.includes(requirementInput.trim())
    ) {
      setRequirements([...requirements, requirementInput.trim()]);
      setRequirementInput("");
    }
  };

  const removeRequirement = (req: string) => {
    setRequirements(requirements.filter((r) => r !== req));
  };

  const addSkill = () => {
    if (skillInput.trim() && !skillsRequired.includes(skillInput.trim())) {
      setSkillsRequired([...skillsRequired, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkillsRequired(skillsRequired.filter((s) => s !== skill));
  };

  const addCriteria = () => {
    if (
      criteriaInput.trim() &&
      !scoringCriteria.includes(criteriaInput.trim())
    ) {
      setScoringCriteria([...scoringCriteria, criteriaInput.trim()]);
      setCriteriaInput("");
    }
  };

  const removeCriteria = (criteria: string) => {
    setScoringCriteria(scoringCriteria.filter((c) => c !== criteria));
  };

  const uploadOfferTemplate = async (file: File) => {
    setUploadingTemplate(true);
    try {
      const fileName = `${profile?.id}/${Date.now()}_${file.name}`;

      const { data, error } = await supabase.storage
        .from("offer-templates")
        .upload(fileName, file);

      if (error) throw error;

      // Create template record
      const { data: template, error: templateError } = await supabase
        .from("offer_templates")
        .insert({
          template_name: file.name,
          template_content: data.path,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      setOfferTemplates((prev) => [...prev, template]);
      setSelectedOfferTemplate(template.id);

      toast({
        title: "Template uploaded!",
        description: "Offer template has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading template:", error);
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
    // const newRound: InterviewRound = {
    //   round: nextRound,
    //   type: 'human',
    //   criteria: '',
    //   duration: 60,
    //   aiGeneratedCriteria: '',
    //   interviewerName: '',
    //   interviewerEmail: '',
    //   interviewerPhone: ''
    // };

    // --- THE CORRECTED LOGIC ---
    const newRound: InterviewRound = {
      round: nextRound,
      type: "human",
      criteria: "",
      duration: 60,
      aiGeneratedCriteria: "",
      interviewerProfileId: undefined, // Use the new property
    };
    // Generate AI criteria for the new round
    const generatedCriteria = generateRoundCriteria(
      newRound.type,
      nextRound,
      scoringCriteria
    );
    newRound.aiGeneratedCriteria = generatedCriteria;
    newRound.criteria = generatedCriteria;

    setInterviewRounds([...interviewRounds, newRound]);
  };

  const updateInterviewRound = (
    index: number,
    field: keyof InterviewRound,
    value: any
  ) => {
    const updated = [...interviewRounds];
    updated[index] = { ...updated[index], [field]: value };

    // If type changed, regenerate AI criteria
    if (field === "type") {
      const newCriteria = generateRoundCriteria(
        value,
        updated[index].round,
        scoringCriteria
      );
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
        const newCriteria = generateRoundCriteria(
          round.type,
          round.round,
          scoringCriteria
        );
        round.aiGeneratedCriteria = newCriteria;
        if (!round.criteria || round.criteria === round.aiGeneratedCriteria) {
          round.criteria = newCriteria;
        }
      });
      setInterviewRounds(updated);
    }
  };

  // const handleSubmit = async (shouldPublish = false) => {
  //   console.log('--- SUBMITTING JOB ---');
  //   setLoading(true);

  //   try {
  //     // --- STAGE 1: FORM VALIDATION ---
  //     console.log('Step 1: Validating form data...');
  //     if (!jobTitle?.trim()) {
  //       throw new Error("Job title is required.");
  //     }
  //     if (!description?.trim()) {
  //       throw new Error("Job description is required.");
  //     }
  //     if (!companyName?.trim()) {
  //       throw new Error("Company name is required.");
  //     }

  //     // Check each human/ai_human round for interviewer details
  //     // for (const round of interviewRounds) {
  //     //     if ((round.type === 'human' || round.type === 'ai_human') && (!round.interviewerName?.trim() || !round.interviewerEmail?.trim())) {
  //     //         throw new Error(`Please provide interviewer name and email for Round ${round.round}`);
  //     //     }
  //     // }

  //     // --- THE CORRECTED BLOCK ---
  // for (const round of interviewRounds) {
  //     if ((round.type === 'human' || round.type === 'ai_human') && !round.interviewerProfileId) {
  //         throw new Error(`Please select an interviewer for Round ${round.round}`);
  //     }
  // }
  //     console.log('Validation passed.');

  //     // --- STAGE 2: GET COMPANY ID ---
  //     console.log('Step 2: Ensuring company ID exists via RPC...');
  //     const { data: finalCompanyId, error: rpcError } = await supabase
  //       .rpc('find_or_create_company', { company_name_to_check: companyName.trim() });

  //     if (rpcError) {
  //       console.error('!!! RPC Error:', rpcError);
  //       throw new Error(`Failed to find or create company: ${rpcError.message}`);
  //     }
  //     if (!finalCompanyId) {
  //         throw new Error("Failed to resolve company ID via RPC. Cannot proceed.");
  //     }
  //     console.log(`Company ID is confirmed: ${finalCompanyId}`);
  //     setClientCompanyId(finalCompanyId);

  //     // --- STAGE 3: INSERT JOB RECORD ---
  //     console.log('Step 3: Preparing and inserting job data...');
  //     const { data: jobData, error: jobError } = await supabase
  //       .from('jobs')
  //       .insert({
  //         title: jobTitle,
  //         company_id: finalCompanyId,
  //         description,
  //         ai_generated_description: aiGeneratedDescription,
  //         location,
  //         employment_type: employmentType,
  //         experience_level: experienceLevel,
  //         remote_allowed: remoteAllowed,
  //         salary_min: salaryMin,
  //         salary_max: salaryMax,
  //         currency,
  //         budget_range_min: budgetRangeMin,
  //         budget_range_max: budgetRangeMax,
  //         budget_auto_suggested: budgetAutoSuggested,
  //         budget_recommendation: budgetRecommendation,
  //         total_positions: totalPositions,
  //         requirements,
  //         skills_required: skillsRequired,
  //         scoring_criteria: scoringCriteria,
  //         interview_rounds: interviewRounds.length,
  //         interview_types: interviewRounds as any, // Cast as any for Supabase JSON type
  //         publish_to_linkedin: publishToLinkedin,
  //         publish_to_website: publishToSimplifyHR, // This seems to be your field for the SimplifyHR portal
  //         publish_to_vendors: publishToVendors,
  //         assigned_vendors: assignedVendors,
  //         offer_template_id: selectedOfferTemplate || null,
  //         created_by: profile?.user_id,
  //         min_assessment_score: minAssessmentScore,
  //         status: shouldPublish ? 'published' : 'draft'
  //       })
  //       .select()
  //       .single();

  //     if (jobError) throw jobError;
  //     console.log('Step 4: Job inserted successfully!', jobData);

  //     // --- STAGE 4: INSERT INTERVIEW ROUNDS ---
  //     if (jobData && interviewRounds.length > 0) {
  //       console.log('Step 5: Creating interview rounds...');
  //       const roundsToCreate = interviewRounds.map(round => ({
  //         job_id: jobData.id,
  //         round_number: round.round,
  //         round_type: round.type,
  //         scoring_criteria: `${round.criteria}`,
  //         duration_minutes: round.duration
  //       }));

  //       const { error: roundsError } = await supabase
  //         .from('interview_rounds')
  //         .insert(roundsToCreate);

  //       if (roundsError) {
  //         // Log the error but don't stop the process, as the main job was created.
  //         console.error('Warning: Could not create interview rounds:', roundsError);
  //       } else {
  //         console.log('Interview rounds created successfully.');
  //       }
  //     }

  //     // --- STAGE 5: FINAL CLEANUP AND FEEDBACK ---
  //     toast({
  //       title: shouldPublish ? "Job published successfully!" : "Job saved as draft!",
  //       description: shouldPublish
  //         ? `${jobTitle} is now live and accepting applications.`
  //         : `${jobTitle} has been saved. You can publish it from the dashboard.`,
  //     });

  //     resetForm();       // Reset all form fields
  //     setOpen(false);      // **This closes the modal**
  //     onJobCreated?.();   // **This refreshes the dashboard**

  //   } catch (error: any) {
  //     // This block catches any error from the stages above
  //     console.error('!!! HANDLE SUBMIT FAILED:', error);
  //     toast({
  //       title: "Failed to create job",
  //       description: error.message || "An unknown error occurred. Please check the details and try again.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     // This ALWAYS runs, ensuring the button is re-enabled
  //     setLoading(false);
  //     console.log('--- SUBMISSION COMPLETE ---');
  //   }
  // };

  const handleSubmit = async (shouldPublish = false) => {
    setLoading(true);
    try {
      // --- STAGE 1: VALIDATION (This part is correct) ---
      if (!jobTitle?.trim()) throw new Error("Job title is required.");
      if (!description?.trim()) throw new Error("Job description is required.");
      if (!companyName?.trim()) throw new Error("Company name is required.");

      for (const round of interviewRounds) {
        if (
          (round.type === "human" || round.type === "ai_human") &&
          !round.interviewerProfileId
        ) {
          throw new Error(
            `Please select an interviewer for Round ${round.round}`
          );
        }
      }

      // --- STAGE 2: GET COMPANY ID (This part is correct) ---
      const { data: existingCompany, error: findError } = await supabase
        .from("companies")
        .select("id")
        .ilike("name", companyName.trim())
        .single();

      let finalCompanyId: string;

      if (findError && findError.code !== 'PGRST116') { // Not a "no rows" error
        throw new Error(`Failed to find company: ${findError.message}`);
      }

      if (existingCompany) {
        finalCompanyId = existingCompany.id;
      } else {
        // Create new company
        const { data: newCompany, error: createError } = await supabase
          .from("companies")
          .insert({
            name: companyName.trim(),
            country: "Indonesia",
            is_active: true
          })
          .select("id")
          .single();

        if (createError) {
          throw new Error(`Failed to create company: ${createError.message}`);
        }
        
        if (!newCompany) {
          throw new Error("Failed to resolve company ID.");
        }
        
        finalCompanyId = newCompany.id;
      }

      // --- STAGE 3: INSERT THE MAIN JOB RECORD (Simplified and Corrected) ---
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .insert({
          title: jobTitle,
          company_id: finalCompanyId,
          created_by: profile?.id, // Use profile.id
          description: description,
          ai_generated_description: aiGeneratedDescription,
          requirements: requirements,
          skills_required: skillsRequired,
          experience_level: experienceLevel || null,
          employment_type: employmentType || null,
          location: location,
          remote_allowed: remoteAllowed,
          salary_min: salaryMin,
          salary_max: salaryMax,
          currency: currency,
          status: shouldPublish ? "published" : "draft",
          total_positions: totalPositions,
          interview_rounds: interviewRounds.length,
          scoring_criteria: { global: scoringCriteria }, // Save global criteria
          min_assessment_score: minAssessmentScore,

          is_urgent: false,
        })
        .select("id") // We only need the ID of the new job
        .single();

      if (jobError) throw jobError;
      if (!jobData?.id) throw new Error("Failed to create job and get its ID.");

      const newJobId = jobData.id;

      // --- STAGE 4: INSERT THE INTERVIEW ROUNDS INTO THE 'interviews' TABLE ---
      // Handle unique constraint by ensuring each round has a unique type per job
      const roundsToInsert = interviewRounds.map((round, index) => {
        // If we have multiple rounds of the same type, we need to work around the unique constraint
        // For now, let's modify the round_type to include the round number for uniqueness
        let effectiveRoundType = round.type;
        
        // Check if this round type already exists in previous rounds
        const previousRoundsWithSameType = interviewRounds.slice(0, index).filter(r => r.type === round.type);
        if (previousRoundsWithSameType.length > 0) {
          // If this constraint exists, we might need to use a different approach
          // For now, let's just use the first round of each type
          return null;
        }

        return {
          job_id: newJobId,
          round_type: effectiveRoundType,
          round_number: round.round,
          scoring_criteria: {
            round_specific: round.criteria.split(",").map((s) => s.trim()),
          },
          duration_minutes: round.duration,
          interviewers_required: round.interviewerProfileId ? 1 : 0,
          interviewer_profiles: round.interviewerProfileId
            ? [{ profile_id: round.interviewerProfileId }]
            : [],
          is_ai_assisted: round.type === 'ai' || round.type === 'ai_human',
          is_mandatory: true
        };
      }).filter(round => round !== null); // Remove null entries

      if (roundsToInsert.length > 0) {
        const { error: roundsError } = await supabase
          .from("interviews")
          .insert(roundsToInsert as any);

        if (roundsError) {
          console.error(
            "CRITICAL: Job was created, but failed to insert interview rounds:",
            roundsError
          );
          toast({
            title: "Job created, but rounds failed",
            description:
              "The job was saved, but some interview round templates could not be created due to database constraints. Only one round per type is allowed.",
            variant: "destructive",
          });
        }
      }

      // --- STAGE 5: SUCCESS ---
      toast({
        title: shouldPublish ? "Job published!" : "Job saved as draft!",
      });
      resetForm();
      setOpen(false);
      onJobCreated?.();
    } catch (error: any) {
      toast({
        title: "Failed to create job",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setJobTitle("");
    setDescription("");
    setAiGeneratedDescription("");
    setLocation("");
    setEmploymentType("");
    setExperienceLevel("");
    setRemoteAllowed(false);
    setSalaryMin(undefined);
    setSalaryMax(undefined);
    setCurrency("IDR");
    setBudgetRangeMin(undefined);
    setBudgetRangeMax(undefined);
    setBudgetAutoSuggested(false);
    setTotalPositions(1);
    setRequirements([]);
    setSkillsRequired([]);
    setScoringCriteria([]);
    // setInterviewRounds([{ round: 1, type: 'human', criteria: '', duration: 60, aiGeneratedCriteria: '', interviewerName: '', interviewerEmail: '', interviewerPhone: '' }]);
    setInterviewRounds([
      {
        round: 1,
        type: "human",
        criteria: "",
        duration: 60,
        aiGeneratedCriteria: "",
        interviewerProfileId: undefined,
      },
    ]);
    setPublishToLinkedin(false);
    setPublishToSimplifyHR(true);
    setPublishToVendors(false);
    setAssignedVendors([]);
    setSelectedOfferTemplate("");
    setCurrentTab("basic");
  };

  const defaultTrigger = (
    <Button variant="hero" size="sm">
      <Sparkles className="w-4 h-4 mr-2" />
      Create Job with AI
    </Button>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-2xl p-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6"><DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Create Job with AI
                </h2>
                <p className="text-sm font-normal text-gray-600 mt-1">
                  Powered by advanced AI • Step-by-step guidance
                </p>
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Generate comprehensive job descriptions with AI and configure all hiring settings with intelligent assistance
            </DialogDescription>
            
            {/* Enhanced Progress indicator */}
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Form Completion</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {getFormProgress().overall}%
                  </span>
                  {getFormProgress().overall === 100 && (
                    <div className="flex items-center gap-1 text-green-600 animate-bounce">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Complete</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Main Progress Bar with Gradient */}
              <div className="relative">
                <Progress 
                  value={getFormProgress().overall} 
                  className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full opacity-20 animate-pulse"></div>
              </div>
              
              {/* Mini Progress Indicators for Each Tab */}
              <div className="grid grid-cols-5 gap-1 mt-2">
                {Object.entries(getFormProgress().details).map(([tab, progress], index) => (
                  <div key={tab} className="flex flex-col items-center gap-1">
                    <div className={`w-full h-1 rounded-full transition-all duration-300 ${
                      progress === 100 ? 'bg-green-400 shadow-sm shadow-green-200' :
                      progress > 50 ? 'bg-yellow-400 shadow-sm shadow-yellow-200' :
                      progress > 0 ? 'bg-blue-400 shadow-sm shadow-blue-200' :
                      'bg-gray-200'
                    }`}></div>
                    <span className={`text-xs capitalize transition-colors ${
                      progress === 100 ? 'text-green-600 font-medium' :
                      progress > 0 ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {tab}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </DialogHeader>

          <Tabs
            value={currentTab}
            onValueChange={setCurrentTab}
            className="w-full space-y-6"
          >
            <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-slate-200 to-slate-300 p-3 rounded-xl border-2 border-slate-400 shadow-lg gap-2">
              <TabsTrigger 
                value="basic" 
                className={`relative transition-all duration-200 font-semibold rounded-xl p-3 ${
                  currentTab === 'basic' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg text-white transform scale-105' 
                    : 'text-slate-800 hover:text-slate-900 hover:bg-white bg-slate-100 border border-slate-400 shadow-sm'
                }`}
              >
                <span className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all shadow-sm ${
                    getFormProgress().details.basic === 100 ? 'bg-green-500 shadow-green-300 ring-2 ring-green-200' :
                    getFormProgress().details.basic > 0 ? 'bg-white animate-pulse ring-2 ring-white/50' : 
                    currentTab === 'basic' ? 'bg-white' : 'bg-slate-600'
                  }`}></div>
                  <span className="flex flex-col items-start">
                    <span className="text-sm font-bold">Basic Info</span>
                    <span className={`text-xs font-semibold ${currentTab === 'basic' ? 'text-white/90' : 'text-slate-700'}`}>
                      {Math.round(getFormProgress().details.basic)}%
                    </span>
                  </span>
                  {getFormProgress().details.basic === 100 && (
                    <CheckCircle className="w-4 h-4 text-green-500 animate-bounce drop-shadow-sm" />
                  )}
                </span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="description" 
                className={`relative transition-all duration-200 font-semibold rounded-xl p-3 ${
                  currentTab === 'description' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg text-white transform scale-105' 
                    : 'text-slate-800 hover:text-slate-900 hover:bg-white bg-slate-100 border border-slate-400 shadow-sm'
                }`}
              >
                <span className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all shadow-sm ${
                    getFormProgress().details.description === 100 ? 'bg-green-500 shadow-green-300 ring-2 ring-green-200' :
                    getFormProgress().details.description > 0 ? 'bg-white animate-pulse ring-2 ring-white/50' : 
                    currentTab === 'description' ? 'bg-white' : 'bg-slate-600'
                  }`}></div>
                  <span className="flex flex-col items-start">
                    <span className="text-sm font-bold">Description</span>
                    <span className={`text-xs font-semibold ${currentTab === 'description' ? 'text-white/90' : 'text-slate-700'}`}>
                      {Math.round(getFormProgress().details.description)}%
                    </span>
                  </span>
                  {getFormProgress().details.description === 100 && (
                    <CheckCircle className="w-4 h-4 text-green-500 animate-bounce drop-shadow-sm" />
                  )}
                </span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="interviews" 
                className={`relative transition-all duration-200 font-semibold rounded-xl p-3 ${
                  currentTab === 'interviews' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg text-white transform scale-105' 
                    : 'text-slate-800 hover:text-slate-900 hover:bg-white bg-slate-100 border border-slate-400 shadow-sm'
                }`}
              >
                <span className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all shadow-sm ${
                    getFormProgress().details.interviews === 100 ? 'bg-green-500 shadow-green-300 ring-2 ring-green-200' :
                    getFormProgress().details.interviews > 0 ? 'bg-white animate-pulse ring-2 ring-white/50' : 
                    currentTab === 'interviews' ? 'bg-white' : 'bg-slate-600'
                  }`}></div>
                  <span className="flex flex-col items-start">
                    <span className="text-sm font-bold">Interviews</span>
                    <span className={`text-xs font-semibold ${currentTab === 'interviews' ? 'text-white/90' : 'text-slate-700'}`}>
                      {Math.round(getFormProgress().details.interviews)}%
                    </span>
                  </span>
                  {getFormProgress().details.interviews === 100 && (
                    <CheckCircle className="w-4 h-4 text-green-500 animate-bounce drop-shadow-sm" />
                  )}
                </span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="budget" 
                className={`relative transition-all duration-200 font-semibold rounded-xl p-3 ${
                  currentTab === 'budget' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg text-white transform scale-105' 
                    : 'text-slate-800 hover:text-slate-900 hover:bg-white bg-slate-100 border border-slate-400 shadow-sm'
                }`}
              >
                <span className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all shadow-sm ${
                    getFormProgress().details.budget === 100 ? 'bg-green-500 shadow-green-300 ring-2 ring-green-200' :
                    getFormProgress().details.budget > 0 ? 'bg-white animate-pulse ring-2 ring-white/50' : 
                    currentTab === 'budget' ? 'bg-white' : 'bg-slate-600'
                  }`}></div>
                  <span className="flex flex-col items-start">
                    <span className="text-sm font-bold">Budget</span>
                    <span className={`text-xs font-semibold ${currentTab === 'budget' ? 'text-white/90' : 'text-slate-700'}`}>
                      {Math.round(getFormProgress().details.budget)}%
                    </span>
                  </span>
                  {getFormProgress().details.budget === 100 && (
                    <CheckCircle className="w-4 h-4 text-green-500 animate-bounce drop-shadow-sm" />
                  )}
                </span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="publish" 
                className={`relative transition-all duration-200 font-semibold rounded-xl p-3 ${
                  currentTab === 'publish' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg text-white transform scale-105' 
                    : 'text-slate-800 hover:text-slate-900 hover:bg-white bg-slate-100 border border-slate-400 shadow-sm'
                }`}
              >
                <span className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all shadow-sm ${
                    getFormProgress().details.publish === 100 ? 'bg-green-500 shadow-green-300 ring-2 ring-green-200' :
                    getFormProgress().details.publish > 0 ? 'bg-white animate-pulse ring-2 ring-white/50' : 
                    currentTab === 'publish' ? 'bg-white' : 'bg-slate-600'
                  }`}></div>
                  <span className="flex flex-col items-start">
                    <span className="text-sm font-bold">Publish</span>
                    <span className={`text-xs font-semibold ${currentTab === 'publish' ? 'text-white/90' : 'text-slate-700'}`}>
                      {Math.round(getFormProgress().details.publish)}%
                    </span>
                  </span>
                  {getFormProgress().details.publish === 100 && (
                    <CheckCircle className="w-4 h-4 text-green-500 animate-bounce drop-shadow-sm" />
                  )}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-8">
              <Card className="border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-white shadow-lg border border-slate-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-200 text-blue-800 shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Job Information</h3>
                      <p className="text-sm font-semibold text-slate-700">Essential details about the position</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle" className="flex items-center gap-1 font-semibold text-slate-800">
                        Job Title *
                        {errors.jobTitle && (
                          <AlertCircle className="w-3 h-3 text-destructive" />
                        )}
                      </Label>
                      <Input
                        id="jobTitle"
                        value={jobTitle}
                        onChange={(e) => {
                          setJobTitle(e.target.value);
                          if (errors.jobTitle) {
                            const newErrors = { ...errors };
                            delete newErrors.jobTitle;
                            setErrors(newErrors);
                          }
                        }}
                        onBlur={() => updateTabCompletion("basic")}
                        placeholder="e.g., Senior Software Engineer"
                        className={`font-medium ${errors.jobTitle ? "border-destructive" : "border-slate-300 focus:border-slate-500"}`}
                      />
                      {errors.jobTitle && (
                        <p className="text-xs text-destructive">{errors.jobTitle}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1 font-semibold text-slate-800">
                        Company *
                        {errors.companyName && (
                          <AlertCircle className="w-3 h-3 text-destructive" />
                        )}
                      </Label>
                      <Input
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          if (errors.companyName) {
                            const newErrors = { ...errors };
                            delete newErrors.companyName;
                            setErrors(newErrors);
                          }
                        }}
                        onBlur={() => updateTabCompletion("basic")}
                        placeholder="Enter your company name"
                        className={`font-medium bg-slate-50 ${errors.companyName ? "border-destructive" : "border-slate-300"}`}
                        disabled 
                      />
                      {errors.companyName && (
                        <p className="text-xs text-destructive">{errors.companyName}</p>
                      )}
                      {!companyName && !errors.companyName && (
                        <Alert className="border-blue-300 bg-blue-100/50 border-2">
                          <Info className="w-4 h-4 text-blue-800" />
                          <AlertDescription className="text-blue-900 font-medium">
                            Company name is taken from your profile. Update your profile to change it.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="font-semibold text-slate-800">Location</Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onBlur={() => updateTabCompletion("basic")}
                        placeholder="e.g., Jakarta, Indonesia"
                        className="font-medium border-slate-300 focus:border-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employmentType" className="font-semibold text-slate-800">Employment Type</Label>
                      <Select
                        value={employmentType}
                        onValueChange={(value) => {
                          setEmploymentType(value);
                          updateTabCompletion("basic");
                        }}
                      >
                        <SelectTrigger className="font-medium border-slate-300 focus:border-slate-500">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_time">
                            <div className="flex items-center gap-2 font-medium">
                              <Clock className="w-3 h-3" />
                              Full Time
                            </div>
                          </SelectItem>
                          <SelectItem value="part_time" className="font-medium">Part Time</SelectItem>
                          <SelectItem value="contract" className="font-medium">Contract</SelectItem>
                          <SelectItem value="internship" className="font-medium">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experienceLevel" className="font-semibold text-slate-800">Experience Level</Label>
                      <Select
                        value={experienceLevel}
                        onValueChange={(value) => {
                          setExperienceLevel(value);
                          updateTabCompletion("basic");
                        }}
                      >
                        <SelectTrigger className="font-medium border-slate-300 focus:border-slate-500">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry" className="font-medium">Entry Level (0-2 years)</SelectItem>
                          <SelectItem value="mid" className="font-medium">Mid Level (3-5 years)</SelectItem>
                          <SelectItem value="senior" className="font-medium">Senior Level (5+ years)</SelectItem>
                          <SelectItem value="lead" className="font-medium">Lead/Principal (7+ years)</SelectItem>
                          <SelectItem value="executive" className="font-medium">Executive (10+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remoteAllowed"
                      checked={remoteAllowed}
                      onCheckedChange={(checked) => {
                        setRemoteAllowed(checked === true);
                        updateTabCompletion("basic");
                      }}
                      className="border-slate-400 data-[state=checked]:bg-slate-800 data-[state=checked]:border-slate-800"
                    />
                    <Label htmlFor="remoteAllowed" className="text-sm font-semibold text-slate-800">Remote work allowed</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalPositions" className="flex items-center gap-1 font-semibold text-slate-800">
                      Number of Positions
                      {errors.totalPositions && (
                        <AlertCircle className="w-3 h-3 text-destructive" />
                      )}
                    </Label>
                    <Input
                      id="totalPositions"
                      type="number"
                      min="1"
                      value={totalPositions}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setTotalPositions(value);
                        if (errors.totalPositions) {
                          const newErrors = { ...errors };
                          delete newErrors.totalPositions;
                          setErrors(newErrors);
                        }
                      }}
                      onBlur={() => updateTabCompletion("basic")}
                      className={`w-24 font-medium ${errors.totalPositions ? "border-destructive" : "border-slate-300 focus:border-slate-500"}`}
                    />
                    {errors.totalPositions && (
                      <p className="text-xs text-destructive">{errors.totalPositions}</p>
                    )}
                  </div>

                  {/* Enhanced Smart suggestions */}
                  {jobTitle && (
                    <div className="relative overflow-hidden">
                      <Alert className="border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 shadow-md">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-emerald-100 animate-pulse">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <AlertDescription className="text-emerald-800">
                              <div className="mb-2">
                                <span className="font-semibold text-emerald-700">🤖 AI Recommendation:</span>
                                <span className="block text-sm text-emerald-600 mt-1">
                                  Based on "{jobTitle}", consider these popular skills:
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {getDefaultSkills(jobTitle).slice(0, 5).map((skill, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 cursor-pointer transition-colors"
                                    onClick={() => {
                                      if (!skillsRequired.includes(skill)) {
                                        setSkillsRequired(prev => [...prev, skill]);
                                      }
                                    }}
                                  >
                                    + {skill}
                                  </Badge>
                                ))}
                              </div>
                            </AlertDescription>
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100 rounded-full -mr-10 -mt-10 opacity-20"></div>
                      </Alert>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="description" className="space-y-8">
              <Card className="border-l-4 border-l-purple-600 bg-gradient-to-r from-purple-50 to-white shadow-lg border border-slate-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-200 text-purple-800 animate-pulse shadow-sm">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">AI Job Description Generator</h3>
                      <p className="text-sm font-semibold text-slate-700">Create compelling job descriptions with AI assistance</p>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-purple-800 font-bold">
                    Generate comprehensive job descriptions using AI based on the job title and details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => {
                      generateJobDescription();
                      updateTabCompletion("description");
                    }}
                    disabled={generating || !jobTitle.trim()}
                    className="w-full bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-800 hover:to-blue-800 text-white shadow-xl transform transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl border-0 font-bold text-base py-6"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        <span className="flex flex-col items-start">
                          <span className="font-bold text-lg">Generating with AI...</span>
                          <span className="text-sm opacity-90 font-medium">This may take 30-60 seconds</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="p-2 rounded-lg bg-white/20 mr-3 shadow-lg">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <span className="flex flex-col items-start">
                          <span className="font-bold text-lg">Generate Job Description with AI</span>
                          <span className="text-sm opacity-90 font-semibold">Powered by advanced AI models</span>
                        </span>
                      </>
                    )}
                  </Button>

                  {generating && (
                    <div className="relative overflow-hidden">
                      <Alert className="border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50 shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-blue-100 animate-bounce">
                            <Bot className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <AlertDescription className="text-blue-800 font-medium">
                              🚀 AI is crafting your job description in real-time...
                              <div className="text-sm text-blue-600 mt-1">
                                Analyzing job requirements, market trends, and industry standards
                              </div>
                            </AlertDescription>
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full -mr-8 -mt-8 opacity-30 animate-pulse"></div>
                      </Alert>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-1 font-semibold text-slate-800">
                      Job Description *
                      {errors.description && (
                        <AlertCircle className="w-3 h-3 text-destructive" />
                      )}
                    </Label>
                    {description && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="preview-toggle" className="text-sm font-semibold text-slate-700">
                            Edit
                          </Label>
                          <Switch
                            id="preview-toggle"
                            checked={isDescriptionPreview}
                            onCheckedChange={setIsDescriptionPreview}
                            className="data-[state=checked]:bg-slate-800"
                          />
                          <Label htmlFor="preview-toggle" className="text-sm font-semibold text-slate-700">
                            Preview
                          </Label>
                        </div>
                        <div className="text-xs font-semibold text-slate-600">
                          {description.length} characters
                        </div>
                      </div>
                    )}
                  </div>

                  {isDescriptionPreview ? (
                    <div className="p-4 border-2 rounded-md h-[300px] bg-slate-50 border-slate-300 overflow-y-auto">
                      {description ? (
                        <MarkdownRenderer content={description} />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-600">
                          <div className="text-center space-y-2">
                            <FileText className="w-8 h-8 mx-auto" />
                            <p className="font-semibold">Job description will appear here after generation</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (errors.description) {
                          const newErrors = { ...errors };
                          delete newErrors.description;
                          setErrors(newErrors);
                        }
                      }}
                      onBlur={() => updateTabCompletion("description")}
                      placeholder="Job description will be generated here..."
                      className={`h-[300px] resize-none font-medium border-2 ${errors.description ? "border-destructive" : "border-slate-300 focus:border-slate-500"}`}
                    />
                  )}
                  
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description}</p>
                  )}

                  {/* Skills and Requirements Section with Better Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Skills Section with Better UI */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-bold text-slate-800">Required Skills</Label>
                        <div className="text-xs font-semibold text-slate-600">
                          {skillsRequired.length} skill{skillsRequired.length !== 1 ? 's' : ''} added
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          placeholder="Add a skill..."
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSkill();
                              updateTabCompletion("description");
                            }
                          }}
                          className="font-medium border-2 border-slate-300 focus:border-slate-500"
                        />
                        <Button 
                          type="button" 
                          onClick={() => {
                            addSkill();
                            updateTabCompletion("description");
                          }} 
                          size="sm"
                          disabled={!skillInput.trim()}
                          className="bg-slate-800 hover:bg-slate-900 text-white font-semibold"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[2rem]">
                        {skillsRequired.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1 hover:bg-secondary/80 transition-colors font-semibold bg-slate-200 text-slate-800 border border-slate-400"
                          >
                            {skill}
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-destructive"
                              onClick={() => {
                                removeSkill(skill);
                                updateTabCompletion("description");
                              }}
                            />
                          </Badge>
                        ))}
                        {skillsRequired.length === 0 && (
                          <div className="text-sm font-semibold text-slate-600 italic">
                            No skills added yet. Add skills to improve job matching.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Requirements Section with Better UI */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-bold text-slate-800">Job Requirements</Label>
                        <div className="text-xs font-semibold text-slate-600">
                          {requirements.length} requirement{requirements.length !== 1 ? 's' : ''} added
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={requirementInput}
                          onChange={(e) => setRequirementInput(e.target.value)}
                          placeholder="Add a requirement..."
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addRequirement();
                              updateTabCompletion("description");
                            }
                          }}
                          className="font-medium border-2 border-slate-300 focus:border-slate-500"
                        />
                        <Button 
                          type="button" 
                          onClick={() => {
                            addRequirement();
                            updateTabCompletion("description");
                          }} 
                          size="sm"
                          disabled={!requirementInput.trim()}
                          className="bg-slate-800 hover:bg-slate-900 text-white font-semibold"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[2rem]">
                        {requirements.map((req, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="flex items-center gap-1 hover:bg-accent transition-colors font-semibold border-2 border-slate-400 text-slate-800"
                          >
                            {req}
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-destructive"
                              onClick={() => {
                                removeRequirement(req);
                                updateTabCompletion("description");
                              }}
                            />
                          </Badge>
                        ))}
                        {requirements.length === 0 && (
                          <div className="text-sm font-semibold text-slate-600 italic">
                            No requirements added yet. Add requirements to set clear expectations.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interviews" className="space-y-8">
              <Card className="border-l-4 border-l-green-600 bg-gradient-to-r from-green-50 to-white shadow-lg border border-slate-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-200 text-green-800 shadow-sm">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Interview Rounds Setup</h3>
                          <p className="text-sm font-semibold text-slate-700">Design your complete interview process</p>
                        </div>
                        {errors.interviews && (
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5 animate-pulse" />
                            <span className="text-sm font-bold">Issues Found</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-green-800 font-bold">
                    Configure interview rounds, types, and scoring criteria for your hiring process
                  </CardDescription>
                  
                  <Alert className="border-blue-300 bg-blue-100/50 mt-4 border-2">
                    <Info className="w-4 h-4 text-blue-800" />
                    <AlertDescription className="text-blue-900 font-semibold">
                      <strong>Interview Setup Rules:</strong>
                      <br />• Maximum 3 interview rounds allowed
                      <br />• Each interview type (AI, Human, AI+Human) can only be used once
                      <br />• Create a comprehensive interview process with diverse evaluation methods
                    </AlertDescription>
                  </Alert>
                </CardHeader>
                <CardContent className="space-y-6">
                  {errors.interviews && (
                    <Alert className="border-destructive/50 bg-destructive/5">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        {errors.interviews}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Interview Rounds */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Interview Rounds</Label>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {interviewRounds.length} round{interviewRounds.length !== 1 ? 's' : ''} configured
                      </div>
                    </div>

                    <div className="space-y-4">
                      {interviewRounds.map((round, index) => (
                        <Card key={index} className="border-l-4 border-l-blue-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-semibold">
                                  {round.round}
                                </div>
                                Round {round.round}
                              </CardTitle>
                              {interviewRounds.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    removeInterviewRound(index);
                                    updateTabCompletion("interviews");
                                  }}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm">Interview Type *</Label>
                                <Select
                                  value={round.type}
                                  onValueChange={(value: "ai" | "human" | "ai_human") => {
                                    updateInterviewRound(index, "type", value);
                                    updateTabCompletion("interviews");
                                    if (errors.interviews) {
                                      const newErrors = { ...errors };
                                      delete newErrors.interviews;
                                      setErrors(newErrors);
                                    }
                                  }}
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {/* Only show interview types that aren't already used in other rounds (except current) */}
                                    {(!interviewRounds.some((r, i) => i !== index && r.type === "human") || round.type === "human") && (
                                      <SelectItem value="human">
                                        <div className="flex items-center gap-2">
                                          <User className="w-3 h-3" />
                                          Human Interview
                                        </div>
                                      </SelectItem>
                                    )}
                                    {(!interviewRounds.some((r, i) => i !== index && r.type === "ai") || round.type === "ai") && (
                                      <SelectItem value="ai">
                                        <div className="flex items-center gap-2">
                                          <Bot className="w-3 h-3" />
                                          AI Interview
                                        </div>
                                      </SelectItem>
                                    )}
                                    {(!interviewRounds.some((r, i) => i !== index && r.type === "ai_human") || round.type === "ai_human") && (
                                      <SelectItem value="ai_human">
                                        <div className="flex items-center gap-2">
                                          <Users className="w-3 h-3" />
                                          AI + Human Interview
                                        </div>
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm">Duration (minutes)</Label>
                                <Input
                                  type="number"
                                  value={round.duration}
                                  onChange={(e) => {
                                    updateInterviewRound(index, "duration", parseInt(e.target.value) || 60);
                                    updateTabCompletion("interviews");
                                  }}
                                  placeholder="60"
                                  min="15"
                                  max="180"
                                  className="text-sm"
                                />
                              </div>
                            </div>

                            {(round.type === "human" || round.type === "ai_human") && (
                              <Card className="bg-blue-50/30 border-blue-200">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    Interviewer Assignment
                                    {round.interviewerProfileId && (
                                      <Badge variant="secondary" className="text-xs">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Assigned
                                      </Badge>
                                    )}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Select Interviewer *</Label>
                                    <Select
                                      value={round.interviewerProfileId}
                                      onValueChange={(value) => {
                                        updateInterviewRound(index, "interviewerProfileId", value);
                                        updateTabCompletion("interviews");
                                        if (errors.interviews) {
                                          const newErrors = { ...errors };
                                          delete newErrors.interviews;
                                          setErrors(newErrors);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Assign an interviewer" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {interviewers.map((interviewer) => (
                                          <SelectItem
                                            key={interviewer.profile_id}
                                            value={interviewer.profile_id}
                                          >
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-green-500" />
                                              <span>
                                                {interviewer.first_name || 'Unknown'} {interviewer.last_name || ''}
                                              </span>
                                              {interviewer.email && (
                                                <span className="text-xs text-gray-500">
                                                  ({interviewer.email})
                                                </span>
                                              )}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {round.interviewerProfileId && (
                                    <div className="flex items-center gap-2 p-2 mt-2 bg-green-50 rounded-md border border-green-200">
                                      <Info className="w-4 h-4 text-green-600" />
                                      <span className="text-xs text-green-700">
                                        Interviewer will be notified when candidates are scheduled
                                      </span>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Scoring Criteria</Label>
                                {round.aiGeneratedCriteria && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      updateInterviewRound(index, "criteria", round.aiGeneratedCriteria);
                                      updateTabCompletion("interviews");
                                    }}
                                    className="text-xs"
                                  >
                                    <Bot className="w-3 h-3 mr-1" />
                                    Reset to AI
                                  </Button>
                                )}
                              </div>
                              <Textarea
                                value={round.criteria}
                                onChange={(e) => {
                                  updateInterviewRound(index, "criteria", e.target.value);
                                  updateTabCompletion("interviews");
                                }}
                                placeholder={
                                  round.aiGeneratedCriteria ||
                                  "AI will generate criteria based on interview type"
                                }
                                rows={3}
                                className="text-sm"
                              />
                              {round.aiGeneratedCriteria &&
                                round.criteria !== round.aiGeneratedCriteria && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Bot className="w-3 h-3" />
                                    <span>AI suggested: {round.aiGeneratedCriteria}</span>
                                  </div>
                                )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {interviewRounds.length === 0 && (
                        <Card className="border-dashed">
                          <CardContent className="p-6 text-center">
                            <div className="space-y-2">
                              <Users className="w-8 h-8 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                No interview rounds configured yet
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Add interview rounds to structure your hiring process
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        addInterviewRound();
                        updateTabCompletion("interviews");
                      }}
                      variant="outline"
                      className="w-full"
                      disabled={interviewRounds.length >= 3}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {interviewRounds.length >= 3 ? "Maximum 3 Rounds Allowed" : "Add Interview Round"}
                    </Button>
                    
                    {interviewRounds.length >= 3 && (
                      <Alert className="border-orange-200 bg-orange-50/50">
                        <Info className="w-4 h-4 text-orange-600" />
                        <AlertDescription className="text-orange-700">
                          Maximum of 3 interview rounds allowed. Remove a round to add a different type.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Separator />

                  {/* Global Scoring Criteria */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Global Scoring Criteria</Label>
                      <div className="text-xs text-muted-foreground">
                        {scoringCriteria.length} criteria added
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={criteriaInput}
                        onChange={(e) => setCriteriaInput(e.target.value)}
                        placeholder="Add scoring criteria..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCriteria();
                            updateTabCompletion("interviews");
                          }
                        }}
                        className="text-sm"
                      />
                      <Button 
                        type="button" 
                        onClick={() => {
                          addCriteria();
                          updateTabCompletion("interviews");
                        }} 
                        size="sm"
                        disabled={!criteriaInput.trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[2rem]">
                      {scoringCriteria.map((criteria, index) => (
                        <Badge
                          key={index}
                          variant="default"
                          className="flex items-center gap-1 hover:bg-primary/80 transition-colors"
                        >
                          {criteria}
                          <X
                            className="w-3 h-3 cursor-pointer hover:text-destructive"
                            onClick={() => {
                              removeCriteria(criteria);
                              updateTabCompletion("interviews");
                            }}
                          />
                        </Badge>
                      ))}
                      {scoringCriteria.length === 0 && (
                        <div className="text-sm text-muted-foreground italic">
                          No criteria added yet. Add criteria to help evaluate candidates consistently.
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* AI Assessment Settings */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium" htmlFor="minAssessmentScore">
                      AI Assessment Threshold
                    </Label>
                    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Minimum Score for Interview (%)</Label>
                            <div className="text-lg font-semibold text-purple-700">
                              {minAssessmentScore}%
                            </div>
                          </div>
                          <Input
                            id="minAssessmentScore"
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={minAssessmentScore}
                            onChange={(e) => {
                              setMinAssessmentScore(parseInt(e.target.value) || 70);
                              updateTabCompletion("interviews");
                            }}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                          <div className="text-sm text-purple-700 bg-white/50 p-2 rounded border">
                            <Bot className="w-4 h-4 inline mr-1" />
                            Applications scoring <strong>{minAssessmentScore}%</strong> or higher will be 
                            automatically shortlisted for interview
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Alert className="border-blue-200 bg-blue-50/50">
                      <Info className="w-4 h-4 text-blue-600" />
                      <AlertDescription className="text-blue-700">
                        AI will automatically assess applications against your job description and 
                        shortlist/reject candidates based on this score threshold.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget" className="space-y-8">
              {/* AI Budget Recommendation */}
              {budgetRecommendation && (
                <Card className="border-l-4 border-l-emerald-400 bg-emerald-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-700">
                      <Bot className="w-4 h-4 animate-pulse" />
                      AI Budget Recommendation
                      <Badge variant="secondary" className="text-xs">
                        Market Analysis
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-emerald-600">
                      AI has analyzed market data and suggests the following competitive salary range
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Recommended Min Salary</Label>
                        <div className="p-4 bg-white rounded-lg border-2 border-emerald-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-emerald-700">
                              {budgetRecommendation.min?.toLocaleString()} {currency}
                            </span>
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="text-xs text-emerald-600 mt-1">Market competitive</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Recommended Max Salary</Label>
                        <div className="p-4 bg-white rounded-lg border-2 border-emerald-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-emerald-700">
                              {budgetRecommendation.max?.toLocaleString()} {currency}
                            </span>
                            <Target className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="text-xs text-emerald-600 mt-1">Top talent range</div>
                        </div>
                      </div>
                    </div>
                    
                    {budgetRecommendation.reasoning && (
                      <Alert className="border-emerald-200 bg-white/50">
                        <Info className="w-4 h-4 text-emerald-600" />
                        <AlertDescription className="text-emerald-700">
                          <strong>AI Analysis:</strong> {budgetRecommendation.reasoning}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSalaryMin(budgetRecommendation.min);
                          setSalaryMax(budgetRecommendation.max);
                          setBudgetRangeMin(budgetRecommendation.min);
                          setBudgetRangeMax(budgetRecommendation.max);
                          updateTabCompletion("budget");
                          toast({
                            title: "✅ Budget Applied",
                            description: "AI recommendations have been applied to salary fields",
                          });
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Apply Recommendation
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBudgetRecommendation(null);
                          setBudgetOverridden(true);
                        }}
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Use Custom Budget
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Budget Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Salary & Budget Configuration
                    {errors.budget && (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    Set competitive salary ranges and budget parameters for this position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {errors.budget && (
                    <Alert className="border-destructive/50 bg-destructive/5">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        {errors.budget}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Currency Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Currency & Location</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-300 shadow-md">
                        <div className="space-y-2">
                          <Label htmlFor="currency" className="text-sm font-semibold text-slate-800">Currency *</Label>
                          <Select 
                            value={currency} 
                            onValueChange={(value) => {
                              setCurrency(value);
                              updateTabCompletion("budget");
                              if (errors.budget) {
                                const newErrors = { ...errors };
                                delete newErrors.budget;
                                setErrors(newErrors);
                              }
                            }}
                          >
                            <SelectTrigger className="bg-white border-2 border-slate-300 font-medium">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IDR">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs">IDR</span>
                                  <span>Indonesian Rupiah</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="USD">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs">USD</span>
                                  <span>US Dollar</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="SGD">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs">SGD</span>
                                  <span>Singapore Dollar</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="MYR">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs">MYR</span>
                                  <span>Malaysian Ringgit</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </Card>
                      <div className="md:col-span-2 flex items-center">
                        <div className="text-sm text-slate-700 bg-slate-100 p-3 rounded-lg border border-slate-300 shadow-sm font-medium">
                          <Globe className="w-4 h-4 inline mr-2 text-slate-600" />
                          Selected currency will be used for all salary calculations and candidate communications
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Salary Range</Label>
                      {salaryMin && salaryMax && (
                        <Badge variant="outline" className="text-xs">
                          <Calculator className="w-3 h-3 mr-1" />
                          {((salaryMax - salaryMin) / salaryMin * 100).toFixed(0)}% range
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                      <Card className="p-4 border-2 border-green-400 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-700" />
                            <Label htmlFor="salaryMin" className="text-sm font-semibold text-green-800">
                              Minimum Salary *
                            </Label>
                          </div>
                          <Input
                            id="salaryMin"
                            type="number"
                            value={salaryMin || ""}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || undefined;
                              setSalaryMin(value);
                              setBudgetOverridden(true);
                              updateTabCompletion("budget");
                              if (errors.budget) {
                                const newErrors = { ...errors };
                                delete newErrors.budget;
                                setErrors(newErrors);
                              }
                            }}
                            placeholder="e.g., 5000000"
                            className={`border-2 border-green-300 bg-white font-medium ${errors.budget && !salaryMin ? "border-destructive" : ""}`}
                          />
                          {salaryMin && (
                            <div className="text-xs text-green-700 font-semibold bg-green-200 px-2 py-1 rounded">
                              {salaryMin.toLocaleString()} {currency} annually
                            </div>
                          )}
                        </div>
                      </Card>

                      <Card className="p-4 border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-700" />
                            <Label htmlFor="salaryMax" className="text-sm font-semibold text-blue-800">
                              Maximum Salary *
                            </Label>
                          </div>
                          <Input
                            id="salaryMax"
                            type="number"
                            value={salaryMax || ""}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || undefined;
                              setSalaryMax(value);
                              setBudgetOverridden(true);
                              updateTabCompletion("budget");
                              if (errors.budget) {
                                const newErrors = { ...errors };
                                delete newErrors.budget;
                                setErrors(newErrors);
                              }
                            }}
                            placeholder="e.g., 8000000"
                            className={`border-2 border-blue-300 bg-white font-medium ${errors.budget && !salaryMax ? "border-destructive" : ""}`}
                          />
                          {salaryMax && (
                            <div className="text-xs text-blue-700 font-semibold bg-blue-200 px-2 py-1 rounded">
                              {salaryMax.toLocaleString()} {currency} annually
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>

                    {salaryMin && salaryMax && salaryMin >= salaryMax && (
                      <Alert className="border-orange-200 bg-orange-50/50">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <AlertDescription className="text-orange-700">
                          Maximum salary should be higher than minimum salary for a valid range.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Separator />

                  {/* Budget Range */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold text-slate-800">Internal Budget Range</Label>
                      <div className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded">
                        For internal planning and approval workflows
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                      <div className="space-y-2 bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border-2 border-orange-300 shadow-md">
                        <Label htmlFor="budgetMin" className="text-sm font-semibold text-orange-800">Budget Range Min</Label>
                        <Input
                          id="budgetMin"
                          type="number"
                          value={budgetRangeMin || ""}
                          onChange={(e) => {
                            setBudgetRangeMin(parseInt(e.target.value) || undefined);
                            updateTabCompletion("budget");
                          }}
                          placeholder="Internal minimum budget"
                          className="text-sm border-2 border-orange-300 bg-white font-medium"
                        />
                      </div>

                      <div className="space-y-2 bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-300 shadow-md">
                        <Label htmlFor="budgetMax" className="text-sm font-semibold text-purple-800">Budget Range Max</Label>
                        <Input
                          id="budgetMax"
                          type="number"
                          value={budgetRangeMax || ""}
                          onChange={(e) => {
                            setBudgetRangeMax(parseInt(e.target.value) || undefined);
                            updateTabCompletion("budget");
                          }}
                          placeholder="Internal maximum budget"
                          className="text-sm border-2 border-purple-300 bg-white font-medium"
                        />
                      </div>
                    </div>

                    <Alert className="border-blue-200 bg-blue-50/50">
                      <Info className="w-4 h-4 text-blue-600" />
                      <AlertDescription className="text-blue-700">
                        <strong>Note:</strong> Budget ranges are used internally for planning and 
                        approval processes. Candidates will only see the public salary range.
                      </AlertDescription>
                    </Alert>
                  </div>

                  {/* Summary */}
                  {(salaryMin || salaryMax || budgetRangeMin || budgetRangeMax) && (
                    <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Budget Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-700">Public Salary Range</div>
                            <div className="text-gray-600">
                              {salaryMin?.toLocaleString() || 'Not set'} - {salaryMax?.toLocaleString() || 'Not set'} {currency}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">Internal Budget</div>
                            <div className="text-gray-600">
                              {budgetRangeMin?.toLocaleString() || 'Not set'} - {budgetRangeMax?.toLocaleString() || 'Not set'} {currency}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {budgetAutoSuggested && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 bg-purple-50 p-2 rounded border border-purple-200">
                      <Bot className="w-3 h-3 text-purple-600" />
                      <span className="text-purple-700">Budget ranges were auto-suggested by AI based on market analysis</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="publish" className="space-y-8">
              {/* Form Completion Summary */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    Job Creation Summary
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    Review your job posting before publishing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-sm">
                    <div className={`p-3 rounded-lg border ${completedTabs.includes('basic') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        {completedTabs.includes('basic') ? 
                          <CheckCircle className="w-4 h-4 text-green-600" /> : 
                          <Clock className="w-4 h-4 text-gray-400" />
                        }
                        <span className={completedTabs.includes('basic') ? 'text-green-700 font-medium' : 'text-gray-600'}>
                          Basic Info
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${completedTabs.includes('description') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        {completedTabs.includes('description') ? 
                          <CheckCircle className="w-4 h-4 text-green-600" /> : 
                          <Clock className="w-4 h-4 text-gray-400" />
                        }
                        <span className={completedTabs.includes('description') ? 'text-green-700 font-medium' : 'text-gray-600'}>
                          Description
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${completedTabs.includes('interviews') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        {completedTabs.includes('interviews') ? 
                          <CheckCircle className="w-4 h-4 text-green-600" /> : 
                          <Clock className="w-4 h-4 text-gray-400" />
                        }
                        <span className={completedTabs.includes('interviews') ? 'text-green-700 font-medium' : 'text-gray-600'}>
                          Interviews
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${completedTabs.includes('budget') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        {completedTabs.includes('budget') ? 
                          <CheckCircle className="w-4 h-4 text-green-600" /> : 
                          <Clock className="w-4 h-4 text-gray-400" />
                        }
                        <span className={completedTabs.includes('budget') ? 'text-green-700 font-medium' : 'text-gray-600'}>
                          Budget
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-blue-700">Overall Completion</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                          {getFormProgress().overall}%
                        </span>
                        {getFormProgress().overall >= 80 && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Ready to Publish</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative mb-3">
                      <Progress 
                        value={getFormProgress().overall} 
                        className="h-4 bg-white/50 shadow-inner"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-400 rounded-full opacity-20"></div>
                    </div>
                    
                    {/* Detailed Progress Breakdown */}
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(getFormProgress().details).map(([tab, progress]) => (
                        <div key={tab} className="text-center">
                          <div className={`w-full h-2 rounded-full mb-1 transition-all ${
                            progress === 100 ? 'bg-green-400' :
                            progress > 50 ? 'bg-yellow-400' :
                            progress > 0 ? 'bg-blue-400' : 'bg-gray-300'
                          }`}></div>
                          <span className="text-xs capitalize text-gray-600">{tab}</span>
                          <div className="text-xs font-medium text-gray-700">{Math.round(progress)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Publishing Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share className="w-4 h-4" />
                    Publishing & Distribution
                    {errors.publish && (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    Choose where to publish this job posting and reach your ideal candidates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {errors.publish && (
                    <Alert className="border-destructive/50 bg-destructive/5">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        {errors.publish}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    {/* SimplifyHR Platform */}
                    <Card 
                      className={`transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] transform ${publishToSimplifyHR ? 'border-primary bg-primary/10 shadow-lg scale-[1.01]' : 'hover:border-primary/50 hover:bg-primary/5'}`}
                      onClick={() => {
                        setPublishToSimplifyHR(!publishToSimplifyHR);
                        updateTabCompletion("publish");
                        if (errors.publish) {
                          const newErrors = { ...errors };
                          delete newErrors.publish;
                          setErrors(newErrors);
                        }
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Checkbox
                              id="publishToSimplifyHR"
                              checked={publishToSimplifyHR}
                              onCheckedChange={() => {}} // Handled by card click
                              className="mt-1 pointer-events-none"
                            />
                            <div className="space-y-3">
                              <Label htmlFor="publishToSimplifyHR" className="flex items-center gap-2 cursor-pointer text-base">
                                <Bot className="w-5 h-5 text-primary" />
                                <span className="font-semibold text-gray-800">SimplifyHR Job Portal</span>
                                <Badge variant="default" className="text-xs bg-green-600 text-white">Recommended</Badge>
                              </Label>
                              <p className="text-sm text-gray-600 font-medium">
                                Publish to our AI-powered job portal with intelligent candidate matching
                              </p>
                              <div className="flex items-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium">10M+ active candidates</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Target className="w-4 h-4 text-green-600" />
                                  <span className="font-medium">Smart matching</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-purple-600" />
                                  <span className="font-medium">Instant activation</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {publishToSimplifyHR && (
                            <Badge variant="default" className="text-sm bg-green-600 text-white">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Selected
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* LinkedIn */}
                    <Card 
                      className={`transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] transform ${publishToLinkedin ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.01]' : 'hover:border-blue-400 hover:bg-blue-50/50'}`}
                      onClick={() => {
                        setPublishToLinkedin(!publishToLinkedin);
                        updateTabCompletion("publish");
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Checkbox
                              id="publishToLinkedin"
                              checked={publishToLinkedin}
                              onCheckedChange={() => {}} // Handled by card click
                              className="mt-1 pointer-events-none"
                            />
                            <div className="space-y-3">
                              <Label htmlFor="publishToLinkedin" className="flex items-center gap-2 cursor-pointer text-base">
                                <Globe className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-gray-800">LinkedIn</span>
                                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">External</Badge>
                              </Label>
                              <p className="text-sm text-gray-600 font-medium">
                                Share to the world's largest professional network
                              </p>
                              <div className="flex items-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium">800M+ professionals</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-orange-600" />
                                  <span className="font-medium">Additional costs may apply</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {publishToLinkedin && (
                            <Badge variant="default" className="text-sm bg-blue-600 text-white">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Selected
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recruitment Vendors */}
                    <Card 
                      className={`transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] transform ${publishToVendors ? 'border-purple-500 bg-purple-50 shadow-lg scale-[1.01]' : 'hover:border-purple-400 hover:bg-purple-50/50'}`}
                      onClick={() => {
                        setPublishToVendors(!publishToVendors);
                        updateTabCompletion("publish");
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Checkbox
                              id="publishToVendors"
                              checked={publishToVendors}
                              onCheckedChange={() => {}} // Handled by card click
                              className="mt-1 pointer-events-none"
                            />
                            <div className="space-y-3">
                              <Label htmlFor="publishToVendors" className="flex items-center gap-2 cursor-pointer text-base">
                                <Building2 className="w-5 h-5 text-purple-600" />
                                <span className="font-semibold text-gray-800">Recruitment Partners</span>
                                <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">Network</Badge>
                              </Label>
                              <p className="text-sm text-gray-600 font-medium">
                                Share with trusted recruitment agencies and headhunters
                              </p>
                              <div className="flex items-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-purple-600" />
                                  <span className="font-medium">Verified partners only</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-green-600" />
                                  <span className="font-medium">Quality guaranteed</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {publishToVendors && (
                            <Badge variant="default" className="text-sm bg-purple-600 text-white">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Selected
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Publishing Summary */}
                  {(publishToSimplifyHR || publishToLinkedin || publishToVendors) && (
                    <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-green-800 font-semibold flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Publishing Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-sm text-green-800 font-medium">
                          Your job will be published to{' '}
                          <span className="font-semibold">
                            {[
                              publishToSimplifyHR && 'SimplifyHR Portal',
                              publishToLinkedin && 'LinkedIn',
                              publishToVendors && 'Recruitment Partners'
                            ].filter(Boolean).join(', ')}
                          </span>
                          .
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Globe className="w-5 h-5 text-green-700" />
                          <span className="text-sm text-green-700 font-medium">
                            Estimated reach: <span className="font-bold text-green-800">
                              {(
                                (publishToSimplifyHR ? 10 : 0) + 
                                (publishToLinkedin ? 800 : 0) + 
                                (publishToVendors ? 50 : 0)
                              ).toLocaleString()}M+ professionals
                            </span>
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* No channels selected warning */}
                  {!publishToSimplifyHR && !publishToLinkedin && !publishToVendors && (
                    <Alert className="border-2 border-orange-300 bg-orange-100 shadow-md">
                      <AlertCircle className="w-5 h-5 text-orange-700" />
                      <AlertDescription className="text-orange-800 font-medium">
                        <strong className="text-orange-900">No publishing channels selected.</strong> Your job will be saved as a draft. 
                        Select at least one publishing option to make it visible to candidates.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </div>
          
          {/* Sticky Footer */}
          <div className="flex justify-between items-center p-6 border-t-2 border-slate-300 bg-gradient-to-r from-slate-100 to-slate-200 shadow-lg">
            <Button 
              variant="ghost" 
              onClick={() => setOpen(false)}
              className="text-slate-700 hover:text-slate-900 hover:bg-slate-200 font-semibold border-2 border-transparent hover:border-slate-400"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="border-2 border-slate-400 text-slate-800 hover:bg-slate-100 hover:border-slate-500 shadow-md transition-all duration-200 font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Save as Draft
                  </>
                )}
              </Button>
              <Button 
                onClick={() => handleSubmit(true)} 
                disabled={loading}
                className="bg-gradient-to-r from-green-700 to-blue-700 hover:from-green-800 hover:to-blue-800 text-white shadow-xl transform transition-all duration-200 hover:scale-[1.05] hover:shadow-2xl font-bold border-2 border-green-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="flex flex-col items-start text-left">
                      <span>Publishing...</span>
                      <span className="text-xs opacity-90">Please wait</span>
                    </span>
                  </>
                ) : (
                  <>
                    <div className="p-1 rounded bg-white/20 mr-2">
                      <Share className="w-4 h-4" />
                    </div>
                    <span className="flex flex-col items-start text-left">
                      <span className="font-semibold">Publish Job</span>
                      <span className="text-xs opacity-90">Go live instantly</span>
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateJobModal;

