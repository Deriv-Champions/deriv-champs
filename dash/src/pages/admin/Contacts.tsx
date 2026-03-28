import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, User, Clock, CheckCircle2, MoreHorizontal, Eye, MessageSquare, Info, Trash2, Download, FileText, Table as TableIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const Contacts = () => {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["contact_messages"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from("contact_messages")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact_messages"] });
      toast.success("Message status updated!");
    },
    onError: (error: any) => {
      console.error("Update status error:", error);
      toast.error(`Update failed: ${error.message || "Unknown error"}`);
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("contact_messages")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact_messages"] });
      toast.success("Message deleted");
      setSelectedMessage(null);
    },
    onError: (error: any) => {
      console.error("Delete message error:", error);
      toast.error(`Delete failed: ${error.message || "Unknown error"}`);
    }
  });

  const handleExportCSV = () => {
    if (!messages || messages.length === 0) return;
    const exportData = messages.map(m => ({
      ID: m.id,
      Name: m.name,
      Email: m.email,
      Subject: m.subject || "N/A",
      Message: m.message,
      Status: m.status,
      Received: format(new Date(m.created_at), "yyyy-MM-dd HH:mm")
    }));
    exportToCSV(exportData, "contacts_export");
    toast.success("CSV Exported successfully");
  };

  const handleExportPDF = async () => {
    if (!messages || messages.length === 0) return;
    const headers = ["Name", "Email", "Subject", "Message", "Status", "Received"];
    const data = messages.map(m => [
      m.name,
      m.email,
      m.subject || "N/A",
      m.message,
      m.status,
      format(new Date(m.created_at), "MMM d, yyyy")
    ]);
    await exportToPDF(headers, data, "contacts_report", "Deriv Champions - Contacts Enquiries");
    toast.success("PDF Exported successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">Manage and track all direct enquiries from the site.</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
                <TableIcon className="h-4 w-4" /> Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4" /> Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px]">Sender</TableHead>
                <TableHead className="min-w-[250px]">Message Info</TableHead>
                <TableHead className="w-[150px]">Received</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : messages?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No messages found.
                  </TableCell>
                </TableRow>
              ) : (
                messages?.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="font-medium flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" /> {msg.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" /> {msg.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold text-sm">{msg.subject || "No Subject"}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2 italic">"{msg.message}"</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(msg.created_at), "MMM d, h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider 
                      ${msg.status === 'read' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {msg.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedMessage(msg)} className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: msg.id, status: "read" })} className="cursor-pointer">
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Read
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: msg.id, status: "unread" })} className="cursor-pointer">
                            <Clock className="h-4 w-4 mr-2" /> Mark as Unread
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive font-medium cursor-pointer"
                            onClick={() => {
                              if (confirm("Delete this message?")) {
                                deleteMessageMutation.mutate(msg.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Info className="h-5 w-5 text-blue-500" />
              Inquiry Details
            </DialogTitle>
            <DialogDescription>
              Received on {selectedMessage?.created_at ? format(new Date(selectedMessage.created_at), "PPP 'at' p") : ""}.
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From</div>
                  <div className="font-semibold text-lg">{selectedMessage.name}</div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Mail className="h-3.5 w-3.5" />
                    <a href={`mailto:${selectedMessage.email}`} className="hover:underline">{selectedMessage.email}</a>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</div>
                  <div className="font-semibold text-lg truncate">{selectedMessage.subject || "No Subject"}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {selectedMessage.status === 'read' ? 'Already processed' : 'Pending review'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground px-1">
                  <MessageSquare className="h-4 w-4" /> Message Content
                </div>
                <div className="bg-muted/30 border p-6 rounded-xl text-md leading-relaxed whitespace-pre-wrap italic">
                  "{selectedMessage.message}"
                </div>
              </div>

              <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border border-dashed">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                    ${selectedMessage.status === 'read' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                    {selectedMessage.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newStatus = selectedMessage.status === 'read' ? 'unread' : 'read';
                      updateStatusMutation.mutate({ id: selectedMessage.id, status: newStatus });
                      setSelectedMessage(prev => prev ? { ...prev, status: newStatus } : null);
                    }}
                  >
                    {selectedMessage.status === 'read' ? 'Mark as Unread' : 'Mark as Read'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this message permanently?")) {
                        deleteMessageMutation.mutate(selectedMessage.id);
                      }
                    }}
                  >
                    Delete Message
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contacts;


