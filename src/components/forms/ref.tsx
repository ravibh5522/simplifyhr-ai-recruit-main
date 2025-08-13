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
} from "lucide-react";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer"; // Adjust path if needed
import { Switch } from "@/components/ui/switch";

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
  // --- THE CORRECTED LINE ---
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

      // Inside the try block of your fetchData function...
      const { data: interviewersData, error: interviewersError } =
        await supabase
        .rpc('get_company_interviewers');
          // .from("interviewers")
          // .select("profile_id, profiles(first_name, last_name)"); // RLS secures this

      if (interviewersError) throw interviewersError;
      setInterviewers(interviewersData || []);
      console.log("Successfully fetched interviewers via RPC:", interviewersData);

      setVendors(vendorsData || []);
      setOfferTemplates(templatesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Replace your existing findOrCreateClientCompany function with this one.

  const findOrCreateClientCompany = async () => {
    const companyNameToUse = profile?.company_name || "Default Company";
    if (companyNameToUse === "Default Company") return; // Don't create default companies automatically

    try {
      console.log(
        `Pre-fetching company ID for: "${companyNameToUse}" using RPC...`
      );

      // Use our new, powerful database function that bypasses RLS
      const { data: companyId, error: rpcError } = await supabase.rpc(
        "find_or_create_company",
        { company_name_to_check: companyNameToUse }
      );

      if (rpcError) throw rpcError;

      if (companyId) {
        setClientCompanyId(companyId);
        console.log("Pre-fetched and set company ID:", companyId);
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
        "http://jd-gen.sslip.io/generate-job-description-streaming";
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
      const { data: finalCompanyId, error: rpcError } = await supabase.rpc(
        "find_or_create_company",
        { company_name_to_check: companyName.trim() }
      );

      if (rpcError)
        throw new Error(
          `Failed to find or create company: ${rpcError.message}`
        );
      if (!finalCompanyId) throw new Error("Failed to resolve company ID.");

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
          min_assessment_score: minAssessmentScore,

          is_urgent: false,
        })
        .select("id") // We only need the ID of the new job
        .single();

      if (jobError) throw jobError;
      if (!jobData?.id) throw new Error("Failed to create job and get its ID.");

      const newJobId = jobData.id;

      // --- STAGE 4: INSERT THE INTERVIEW ROUNDS INTO THE 'interviews' TABLE ---
      const roundsToInsert = interviewRounds.map((round) => ({
        job_id: newJobId,
        round_number: round.round,
        round_type: round.type,
        duration_minutes: round.duration,
        scoring_criteria: {
          round_specific: round.criteria.split(",").map((s) => s.trim()),
        },
        // Create a JSONB object for the interviewer profiles
        interviewer_profiles: round.interviewerProfileId
          ? [{ profile_id: round.interviewerProfileId }]
          : [],
      }));

      const { error: roundsError } = await supabase
        .from("interviews") // The correct table for this data
        .insert(roundsToInsert);

      if (roundsError) {
        // If this fails, we should ideally delete the job we just created to avoid orphaned data.
        // For now, we'll just log a strong warning.
        console.error(
          "CRITICAL: Job was created, but failed to insert interview rounds:",
          roundsError
        );
        toast({
          title: "Job created, but rounds failed",
          description:
            "The job was saved, but the interview rounds could not be created. Please edit the job to add them.",
          variant: "destructive",
        });
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Create Job with AI
            </DialogTitle>
            <DialogDescription>
              Generate comprehensive job descriptions with AI and configure all
              hiring settings
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={currentTab}
            onValueChange={setCurrentTab}
            className="w-full"
          >
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
                        disabled 
                      />
                      {!companyName && (
                        <p className="text-xs text-destructive">
                          Company name is required for job creation
                        </p>
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
                      <Select
                        value={employmentType}
                        onValueChange={setEmploymentType}
                      >
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
                      <Select
                        value={experienceLevel}
                        onValueChange={setExperienceLevel}
                      >
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
                      onCheckedChange={(checked) =>
                        setRemoteAllowed(checked === true)
                      }
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
                      onChange={(e) =>
                        setTotalPositions(parseInt(e.target.value) || 1)
                      }
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
                    Generate a comprehensive job description using AI based on
                    the job title and details
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
                    {/* --- 2. ADD THE TOGGLE SWITCH --- */}
                    {description && (
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="preview-toggle" className="text-sm">
                          Edit
                        </Label>
                        <Switch
                          id="preview-toggle"
                          checked={isDescriptionPreview}
                          onCheckedChange={setIsDescriptionPreview}
                        />
                        <Label htmlFor="preview-toggle" className="text-sm">
                          Preview
                        </Label>
                      </div>
                    )}
                  </div>

                  {/* --- 3. CONDITIONALLY RENDER THE COMPONENT --- */}
                  {isDescriptionPreview ? (
                    // If in preview mode, show the beautifully rendered Markdown
                    <div className="p-4 border rounded-md min-h-[250px] bg-muted/20">
                      <MarkdownRenderer content={description} />
                    </div>
                  ) : (
                    // If in edit mode, show the standard textarea
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Job description will be generated here..."
                      rows={12}
                    />
                  )}

                  {/* Skills */}
                  <div className="space-y-2">
                    <Label>Required Skills</Label>
                    <div className="flex gap-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="Add a skill..."
                        onKeyPress={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addSkill())
                        }
                      />
                      <Button type="button" onClick={addSkill} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skillsRequired.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
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
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addRequirement())
                        }
                      />
                      <Button type="button" onClick={addRequirement} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {requirements.map((req, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
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
                      <div
                        key={index}
                        className="border rounded-lg p-4 space-y-3"
                      >
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
                                onValueChange={(
                                  value: "ai" | "human" | "ai_human"
                                ) => updateInterviewRound(index, "type", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="human">
                                    Human Interview
                                  </SelectItem>
                                  <SelectItem value="ai">
                                    AI Interview
                                  </SelectItem>
                                  <SelectItem value="ai_human">
                                    AI + Human Interview
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Duration (minutes)</Label>
                              <Input
                                type="number"
                                value={round.duration}
                                onChange={(e) =>
                                  updateInterviewRound(
                                    index,
                                    "duration",
                                    parseInt(e.target.value) || 60
                                  )
                                }
                              />
                            </div>
                          </div>

                          {(round.type === "human" ||
                            round.type === "ai_human") && (
                            <div className="border rounded-lg p-3 space-y-3 bg-blue-50/30">
                              <h6 className="text-sm font-medium flex items-center gap-2">
                                <User className="w-3 h-3" />
                                Interviewer Details for Round {round.round}
                              </h6>
                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Select Interviewer *
                                </Label>
                                <Select
                                  value={round.interviewerProfileId}
                                  onValueChange={(value) =>
                                    updateInterviewRound(
                                      index,
                                      "interviewerProfileId",
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Assign an interviewer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {interviewers.map((interviewer) => (
                                      <SelectItem
                                        key={interviewer.profile_id}
                                        value={interviewer.profile_id}
                                      >
                                        {interviewer.first_name}{" "}
                                        {interviewer.last_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
                                  onClick={() =>
                                    updateInterviewRound(
                                      index,
                                      "criteria",
                                      round.aiGeneratedCriteria
                                    )
                                  }
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
                                updateInterviewRound(
                                  index,
                                  "criteria",
                                  e.target.value
                                )
                              }
                              placeholder={
                                round.aiGeneratedCriteria ||
                                "AI will generate criteria based on interview type"
                              }
                              rows={3}
                              className="text-sm"
                            />
                            {round.aiGeneratedCriteria &&
                              round.criteria !== round.aiGeneratedCriteria && (
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

                  <Button
                    type="button"
                    onClick={addInterviewRound}
                    variant="outline"
                    className="w-full"
                  >
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
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addCriteria())
                        }
                      />
                      <Button type="button" onClick={addCriteria} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {scoringCriteria.map((criteria, index) => (
                        <Badge
                          key={index}
                          variant="default"
                          className="flex items-center gap-1"
                        >
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
                    <Label htmlFor="minAssessmentScore">
                      Minimum AI Assessment Score for Interview (%)
                    </Label>
                    <div className="flex items-center space-x-3">
                      <Input
                        id="minAssessmentScore"
                        type="number"
                        min={0}
                        max={100}
                        value={minAssessmentScore}
                        onChange={(e) =>
                          setMinAssessmentScore(parseInt(e.target.value) || 70)
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        Applications scoring {minAssessmentScore}% or higher
                        will be shortlisted for interview
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      AI will automatically assess applications against your job
                      description and shortlist/reject based on this score
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
                      AI has analyzed market data and suggests the following
                      budget range
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Recommended Min Budget</Label>
                        <div className="p-3 bg-background rounded-md border">
                          <span className="text-lg font-semibold text-green-600">
                            {budgetRecommendation.min?.toLocaleString()}{" "}
                            {currency}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Recommended Max Budget</Label>
                        <div className="p-3 bg-background rounded-md border">
                          <span className="text-lg font-semibold text-green-600">
                            {budgetRecommendation.max?.toLocaleString()}{" "}
                            {currency}
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
                            description:
                              "AI recommendation has been applied to salary fields",
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
                          <SelectItem value="SGD">
                            SGD (Singapore Dollar)
                          </SelectItem>
                          <SelectItem value="MYR">MYR (Ringgit)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salaryMin">Salary Min</Label>
                      <Input
                        id="salaryMin"
                        type="number"
                        value={salaryMin || ""}
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
                        value={salaryMax || ""}
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
                        value={budgetRangeMin || ""}
                        onChange={(e) =>
                          setBudgetRangeMin(
                            parseInt(e.target.value) || undefined
                          )
                        }
                        placeholder="Minimum budget"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="budgetMax">Budget Range Max</Label>
                      <Input
                        id="budgetMax"
                        type="number"
                        value={budgetRangeMax || ""}
                        onChange={(e) =>
                          setBudgetRangeMax(
                            parseInt(e.target.value) || undefined
                          )
                        }
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
                        id="publishToSimplifyHR"
                        checked={publishToSimplifyHR}
                        onCheckedChange={(checked) =>
                          setPublishToSimplifyHR(checked === true)
                        }
                      />
                      <Label
                        htmlFor="publishToSimplifyHR"
                        className="flex items-center gap-2"
                      >
                        <Bot className="w-4 h-4 text-primary" />
                        Publish to SimplifyHR Job Portal
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="publishToLinkedin"
                        checked={publishToLinkedin}
                        onCheckedChange={(checked) =>
                          setPublishToLinkedin(checked === true)
                        }
                      />
                      <Label htmlFor="publishToLinkedin">
                        Publish to LinkedIn
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="publishToVendors"
                        checked={publishToVendors}
                        onCheckedChange={(checked) =>
                          setPublishToVendors(checked === true)
                        }
                      />
                      <Label htmlFor="publishToVendors">
                        Share with recruitment vendors
                      </Label>
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
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save as Draft"
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
    </>
  );
};

export default CreateJobModal;