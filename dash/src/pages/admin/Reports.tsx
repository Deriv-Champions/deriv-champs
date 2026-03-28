import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  Download, 
  Play, 
  Loader2, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Users,
  MessageSquare
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface DailyReport {
  id: string;
  report_date: string;
  title: string;
  stats: any;
  pdf_url: string;
  created_at: string;
}

const Reports = () => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["daily_reports"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("daily_reports")
        .select("*")
        .order("report_date", { ascending: false });
      if (error) throw error;
      return data as DailyReport[];
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.functions.invoke("reports-generator", {
        method: "POST",
        body: { date: today }
      });
      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.error || "Failed to generate report");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
      toast.success("Daily report generated successfully!");
      setIsGenerating(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate report");
      setIsGenerating(false);
    },
  });

  const handleManualTrigger = () => {
    toast.info("Starting report generation. This may take a few moments...");
    generateReportMutation.mutate();
  };

  const latestStats = reports?.[0]?.stats || { total_messages: 0, new_leads: 0, unique_users: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Insights & Reports</h1>
          <p className="text-muted-foreground">Daily performance analysis powered by AI.</p>
        </div>
        <Button 
          onClick={handleManualTrigger} 
          disabled={isGenerating}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Generate Today's Report
        </Button>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Latest Interactions</p>
                <p className="text-2xl font-bold mt-1">{latestStats.total_messages || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Users</p>
                <p className="text-2xl font-bold mt-1">{latestStats.unique_users || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Leads Found</p>
                <p className="text-2xl font-bold mt-1">{latestStats.new_leads || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report History</CardTitle>
          <CardDescription>Browse and download previous daily PDF reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px]">Report Date</TableHead>
                  <TableHead>Insights Title</TableHead>
                  <TableHead className="hidden md:table-cell">Interactions</TableHead>
                  <TableHead className="hidden md:table-cell">Leads</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : reports?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No reports generated yet. Click "Generate Today's Report" to start.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports?.map((report) => (
                    <TableRow key={report.id} className="group cursor-default">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(report.report_date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{report.title}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="font-normal capitalize">
                          {report.stats?.total_messages || 0} msgs
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-green-600 bg-green-50/50 border-green-200">
                          {report.stats?.new_leads || 0} leads
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 gap-1.5"
                            onClick={() => window.open(report.pdf_url, "_blank")}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View
                          </Button>
                          <a 
                            href={report.pdf_url} 
                            download 
                            className="inline-flex"
                            onClick={(e) => {
                              // Ensure it downloads instead of just navigating if possible
                              if (!report.pdf_url) e.preventDefault();
                            }}
                          >
                            <Button variant="outline" size="sm" className="h-8 gap-1.5">
                              <Download className="h-3.5 w-3.5" />
                              PDF
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
