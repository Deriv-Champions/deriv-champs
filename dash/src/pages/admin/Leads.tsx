import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, FileText, Eye } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

interface Lead {
  id: string;
  whatsapp_phone: string;
  name: string | null;
  email: string | null;
  training_interest: string | null;
  experience_level: string | null;
  status: string;
  lead_score: number;
  notes: string | null;
  extracted_data: any;
  created_at: string;
}

const STAGES = [
  { value: "all", label: "All Leads" },
  { value: "new", label: "🆕 New" },
  { value: "contacted", label: "📞 Contacted" },
  { value: "nurturing", label: "🌱 Nurturing" },
  { value: "qualified", label: "✅ Qualified" },
  { value: "proposal", label: "📋 Proposal Sent" },
  { value: "negotiation", label: "🤝 Negotiation" },
  { value: "converted", label: "🎉 Converted" },
  { value: "lost", label: "❌ Lost" },
];

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  contacted: "secondary",
  nurturing: "secondary",
  qualified: "default",
  proposal: "outline",
  negotiation: "outline",
  converted: "default",
  lost: "destructive",
};

const Leads = () => {
  usePageMeta("Leads | Deriv Champions Admin", "Track and qualify leads from WhatsApp conversations with AI-powered scoring.");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchLeads = async () => {
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setLeads((data as Lead[]) || []);
  };

  useEffect(() => { fetchLeads(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("leads").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    toast.success("Lead status updated");
    fetchLeads();
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return toast.error("No leads to export");
    const exportData = leads.map(l => ({
      Name: l.name || "—",
      Phone: l.whatsapp_phone,
      Email: l.email || "—",
      Interest: l.training_interest || "—",
      Experience: l.experience_level || "—",
      Score: l.lead_score,
      Status: l.status,
      Notes: l.notes || "—",
      Created: new Date(l.created_at).toLocaleDateString()
    }));
    exportToCSV(exportData, `leads_${filter}_${new Date().toISOString().slice(0, 10)}`);
    toast.success("CSV exported");
  };

  const handleExportPDF = async () => {
    if (leads.length === 0) return toast.error("No leads to export");
    const headers = ["Name", "Phone", "Interest", "Experience", "Score", "Status"];
    const data = leads.map(l => [
      l.name || "—",
      l.whatsapp_phone,
      l.training_interest || "—",
      l.experience_level || "—",
      l.lead_score,
      l.status
    ]);
    await exportToPDF(headers, data, `leads_${filter}_report`, "Deriv Champions - Leads Report");
    toast.success("PDF exported");
  };

  const getAIReasoning = (lead: Lead): string => {
    const data = lead.extracted_data as any;
    if (data?.next_action || data?.objections || data?.qualification_status) {
      const parts: string[] = [];
      if (data.qualification_status) parts.push(`AI Status: ${data.qualification_status}`);
      if (data.next_action) parts.push(`Recommended Action: ${data.next_action}`);
      if (data.objections) parts.push(`Objections: ${data.objections}`);
      if (data.key_interests?.length) parts.push(`Key Interests: ${data.key_interests.join(", ")}`);
      return parts.join("\n\n");
    }
    if (lead.notes) return lead.notes;
    return "No AI reasoning available yet. The AI will provide qualification reasoning after analyzing enough conversation data.";
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Leads</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="mr-1 h-4 w-4" />CSV</Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}><FileText className="mr-1 h-4 w-4" />PDF</Button>
        </div>
      </div>

      {/* Stage summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {STAGES.filter(s => s.value !== "all").map(stage => {
          const count = leads.length > 0 && filter === "all"
            ? leads.filter(l => l.status === stage.value).length
            : stage.value === filter ? leads.length : 0;
          return (
            <Card
              key={stage.value}
              className={`cursor-pointer transition-all hover:shadow-md ${filter === stage.value ? "ring-2 ring-primary" : ""}`}
              onClick={() => setFilter(stage.value === filter ? "all" : stage.value)}
            >
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold">{filter === "all" ? leads.filter(l => l.status === stage.value).length : count}</p>
                <p className="text-xs text-muted-foreground">{stage.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[150px]">Name</TableHead>
                  <TableHead className="w-[150px]">Phone</TableHead>
                  <TableHead className="min-w-[150px]">Interest</TableHead>
                  <TableHead className="w-[120px]">Experience</TableHead>
                  <TableHead className="w-[120px]">Score</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Reasoning</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name || "—"}</TableCell>
                    <TableCell>{lead.whatsapp_phone}</TableCell>
                    <TableCell>{lead.training_interest || "—"}</TableCell>
                    <TableCell>{lead.experience_level || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${lead.lead_score}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{lead.lead_score}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                        <SelectTrigger className="w-32 h-8">
                          <Badge variant={statusColors[lead.status] || "secondary"}>{lead.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STAGES.filter(s => s.value !== "all").map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLead(lead)}>
                        <Eye className="h-4 w-4 mr-1" />View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {leads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No leads found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedLead?.name || selectedLead?.whatsapp_phone || "Lead Details"}</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Phone:</span> {selectedLead.whatsapp_phone}</div>
                <div><span className="text-muted-foreground">Email:</span> {selectedLead.email || "—"}</div>
                <div><span className="text-muted-foreground">Interest:</span> {selectedLead.training_interest || "—"}</div>
                <div><span className="text-muted-foreground">Experience:</span> {selectedLead.experience_level || "—"}</div>
                <div><span className="text-muted-foreground">Score:</span> {selectedLead.lead_score}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={statusColors[selectedLead.status] || "secondary"}>{selectedLead.status}</Badge></div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">🤖 AI Qualification Reasoning</h4>
                <div className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap">
                  {getAIReasoning(selectedLead)}
                </div>
              </div>
              {selectedLead.notes && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedLead.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;
