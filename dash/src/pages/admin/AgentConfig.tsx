
import { useEffect, useState, useCallback } from "react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Loader2, Zap, HelpCircle, Edit3, XCircle } from "lucide-react";

const AgentConfig = () => {
  usePageMeta("Agent Config | Deriv Champions Admin", "Configure your WhatsApp AI agent name and system prompt.");
  const [agentName, setAgentName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [welcomeInstructions, setWelcomeInstructions] = useState("");
  const [leadQualificationPrompt, setLeadQualificationPrompt] = useState("");
  const [toneVoice, setToneVoice] = useState("");
  const [responseStyle, setResponseStyle] = useState("");
  const [faqs, setFaqs] = useState("");
  const [adTriggerKeywords, setAdTriggerKeywords] = useState("");
  const [initialMenu, setInitialMenu] = useState("");
  const [onboardingQuiz, setOnboardingQuiz] = useState("");
  const [configId, setConfigId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("agent_config").select("*").limit(1).single();
      if (data) {
        const config = data as any;
        setConfigId(config.id);
        setAgentName(config.agent_name);
        setSystemPrompt(config.system_prompt);
        setWelcomeInstructions(config.welcome_instructions || "");
        setLeadQualificationPrompt(config.lead_qualification_prompt || "");
        setToneVoice(config.tone_voice || "");
        setResponseStyle(config.response_style || "");
        setFaqs(JSON.stringify(config.faqs || [], null, 2));
        setAdTriggerKeywords((config.ad_trigger_keywords || []).join(", "));
        setInitialMenu(JSON.stringify(config.initial_menu || {}, null, 2));
        setOnboardingQuiz(JSON.stringify(config.onboarding_quiz || {}, null, 2));
      }
    } catch (e) {
      console.error("Error fetching config:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = () => {
    fetchData();
    setIsEditing(false);
    toast.info("Changes discarded.");
  };

  const handleSave = async () => {
    if (!configId) return;
    
    try {
      // Validate JSON fields
      const parsedInitialMenu = JSON.parse(initialMenu);
      const parsedOnboardingQuiz = JSON.parse(onboardingQuiz);
      const parsedFaqs = JSON.parse(faqs);
      
      setSaving(true);
      const { error } = await supabase
        .from("agent_config")
        .update({ 
          agent_name: agentName, 
          system_prompt: systemPrompt, 
          welcome_instructions: welcomeInstructions,
          lead_qualification_prompt: leadQualificationPrompt,
          tone_voice: toneVoice,
          response_style: responseStyle,
          faqs: parsedFaqs,
          ad_trigger_keywords: adTriggerKeywords.split(",").map(k => k.trim()).filter(k => k !== ""),
          initial_menu: parsedInitialMenu,
          onboarding_quiz: parsedOnboardingQuiz,
          updated_at: new Date().toISOString() 
        } as any)
        .eq("id", configId);
      
      setSaving(false);
      if (error) {
        toast.error("Failed to save configuration: " + error.message);
      } else {
        toast.success("Agent configuration saved!");
        setIsEditing(false);
      }
    } catch (e: any) {
      toast.error("Invalid JSON format: " + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agent Configuration</h1>
          <p className="text-muted-foreground mt-1">Protect and manage your AI agent's logic and personality</p>
        </div>
        
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="w-fit">
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Configuration
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className={`max-w-4xl space-y-6 ${!isEditing ? "opacity-90" : ""}`}>
        <Card className={!isEditing ? "border-muted" : "border-primary/20 shadow-sm"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Bot Identity
              {!isEditing && <span className="text-[10px] font-normal bg-muted px-2 py-0.5 rounded uppercase tracking-wider text-muted-foreground">Locked</span>}
            </CardTitle>
            <CardDescription>Configure your WhatsApp chatbot's name and core personality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input
                  id="agent-name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. Alexa - Trading Guide"
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ad-triggers" className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  Ad Trigger Keywords
                </Label>
                <Input
                  id="ad-triggers"
                  value={adTriggerKeywords}
                  onChange={(e) => setAdTriggerKeywords(e.target.value)}
                  placeholder="i want to learn, start training"
                  disabled={!isEditing}
                />
                <p className="text-[10px] text-muted-foreground italic">Comma-separated phrases that bypass the main menu and start the quiz.</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="system-prompt">Identity & Background</Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Define the agent's personality and business expertise..."
                className="min-h-[120px] font-mono text-sm"
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        <Card className={!isEditing ? "border-muted" : "border-primary/20 shadow-sm"}>
          <CardHeader>
            <CardTitle>Personality & Style</CardTitle>
            <CardDescription>Control how the AI sounds and formats its responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tone-voice">Tone of Voice</Label>
              <Input
                id="tone-voice"
                value={toneVoice}
                onChange={(e) => setToneVoice(e.target.value)}
                placeholder="e.g. Warm, encouraging, and professional."
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="response-style">Response Style & Rules</Label>
              <Textarea
                id="response-style"
                value={responseStyle}
                onChange={(e) => setResponseStyle(e.target.value)}
                placeholder="e.g. Concise for WhatsApp, use bullet points, max 1 question per turn."
                className="min-h-[80px] text-sm"
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={!isEditing ? "border-muted" : "border-primary/20 shadow-sm"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Initial Menu (JSON)
              </CardTitle>
              <CardDescription>First message options for direct contacts</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="initial-menu"
                value={initialMenu}
                onChange={(e) => setInitialMenu(e.target.value)}
                className="min-h-[200px] font-mono text-xs"
                disabled={!isEditing}
              />
            </CardContent>
          </Card>

          <Card className={!isEditing ? "border-muted" : "border-primary/20 shadow-sm"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Onboarding Quiz (JSON)
              </CardTitle>
              <CardDescription>Questions, buttons, and logic for leads</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="onboarding-quiz"
                value={onboardingQuiz}
                onChange={(e) => setOnboardingQuiz(e.target.value)}
                className="min-h-[200px] font-mono text-xs"
                disabled={!isEditing}
              />
            </CardContent>
          </Card>
        </div>

        <Card className={!isEditing ? "border-muted" : "border-primary/20 shadow-sm"}>
          <CardHeader>
            <CardTitle>Structured FAQs (JSON)</CardTitle>
            <CardDescription>Specific answers to common questions about Deriv Champions</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="faqs"
              value={faqs}
              onChange={(e) => setFaqs(e.target.value)}
              className="min-h-[150px] font-mono text-xs"
              disabled={!isEditing}
            />
          </CardContent>
        </Card>

        <Card className={!isEditing ? "border-muted" : "border-primary/20 shadow-sm"}>
          <CardHeader>
            <CardTitle>Lead Qualification Engine</CardTitle>
            <CardDescription>Configure how the AI analyzes conversations to extract lead data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="welcome-instructions">Interaction & Welcome Rules</Label>
              <Textarea
                id="welcome-instructions"
                value={welcomeInstructions}
                onChange={(e) => setWelcomeInstructions(e.target.value)}
                placeholder="Instructions for first contact and naming conventions..."
                className="min-h-[100px] text-sm"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualification-prompt">Qualification Logic (JSON Spec)</Label>
              <Textarea
                id="qualification-prompt"
                value={leadQualificationPrompt}
                onChange={(e) => setLeadQualificationPrompt(e.target.value)}
                placeholder="Prompt for lead extraction and scoring..."
                className="min-h-[200px] font-mono text-xs"
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex gap-4">
             <Button onClick={handleSave} disabled={saving} className="flex-1 h-12 text-lg">
              {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              {saving ? "Saving Changes..." : "Push Configuration Live"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={saving} className="h-12">
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentConfig;
