import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save } from "lucide-react";

const AgentConfig = () => {
  const [agentName, setAgentName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [configId, setConfigId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("agent_config").select("*").limit(1).single();
      if (data) {
        setConfigId(data.id);
        setAgentName(data.agent_name);
        setSystemPrompt(data.system_prompt);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!configId) return;
    setSaving(true);
    const { error } = await supabase
      .from("agent_config")
      .update({ agent_name: agentName, system_prompt: systemPrompt, updated_at: new Date().toISOString() })
      .eq("id", configId);
    setSaving(false);
    if (error) {
      toast.error("Failed to save configuration");
    } else {
      toast.success("Agent configuration saved!");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Agent Configuration</h1>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bot Identity</CardTitle>
            <CardDescription>Configure your WhatsApp chatbot's name and personality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g. Steve - Trading Mentor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Define the agent's personality, knowledge, and behavior..."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This prompt defines how your bot responds. Include details about your services,
                lead qualification questions, and the tone you want.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook URL</CardTitle>
            <CardDescription>Set this URL in your Meta/WhatsApp Cloud API webhook configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block bg-muted px-4 py-3 rounded-lg text-sm break-all">
              {`https://jcehskfmxeyejramdoce.supabase.co/functions/v1/whatsapp-webhook`}
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              Use this URL for both the Callback URL and the Verify Token endpoint.
            </p>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
};

export default AgentConfig;
