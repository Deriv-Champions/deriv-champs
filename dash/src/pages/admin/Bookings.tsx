import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, Phone, Mail, MapPin, Globe, Eye, User, Clock, MessageSquare, Info, Download, FileText, Table as TableIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

interface Booking {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  booking_date: string;
  start_time: string;
  is_online: boolean;
  message: string;
  status: string;
  created_at: string;
  programmes: {
    title: string;
  } | null;
}

const Bookings = () => {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("bookings")
        .select(`
          *,
          programmes (
            title
          )
        `)
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Failed to fetch bookings");
        throw error;
      }
      return data as Booking[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from("bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking status updated!");
    },
    onError: (error: any) => {
      console.error("Update status error:", error);
      toast.error(`Update failed: ${error.message || "Unknown error"}`);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-yellow-100 text-yellow-700";
    }
  };

  const handleExportCSV = () => {
    if (!bookings || bookings.length === 0) return;
    const exportData = bookings.map(b => ({
      ID: b.id,
      Customer: `${b.first_name} ${b.last_name}`,
      Email: b.email,
      Phone: b.phone,
      Programme: b.programmes?.title || "N/A",
      Date: b.booking_date,
      Time: b.start_time,
      Type: b.is_online ? "Online" : "In-Person",
      Status: b.status,
      Submitted: format(new Date(b.created_at), "yyyy-MM-dd HH:mm")
    }));
    exportToCSV(exportData, "bookings_export");
    toast.success("CSV Exported successfully");
  };

  const handleExportPDF = async () => {
    if (!bookings || bookings.length === 0) return;
    const headers = ["Customer", "Programme", "Date", "Time", "Type", "Status"];
    const data = bookings.map(b => [
      `${b.first_name} ${b.last_name}`,
      b.programmes?.title || "N/A",
      b.booking_date,
      b.start_time,
      b.is_online ? "Online" : "In-Person",
      b.status
    ]);
    await exportToPDF(headers, data, "bookings_report", "Deriv Champions - Bookings Report");
    toast.success("PDF Exported successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Monitor and manage all training enrollments.</p>
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
                <TableHead className="w-[200px]">Customer</TableHead>
                <TableHead className="min-w-[150px]">Programme</TableHead>
                <TableHead className="min-w-[120px]">Schedule</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="text-right w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : bookings?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No bookings found.
                  </TableCell>
                </TableRow>
              ) : (
                bookings?.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">{booking.first_name} {booking.last_name}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {booking.phone}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {booking.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {booking.programmes?.title || "Unknown Programme"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {booking.booking_date ? format(new Date(booking.booking_date), "MMM d, yyyy") : "N/A"}
                        </div>
                        <div className="text-muted-foreground font-mono">
                          at {booking.start_time || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        {booking.is_online ? (
                          <><Globe className="h-3 w-3 text-blue-500" /> Online</>
                        ) : (
                          <><MapPin className="h-3 w-3 text-orange-500" /> In-Person</>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Select
                          defaultValue={booking.status}
                          onValueChange={(value) => updateStatusMutation.mutate({ id: booking.id, status: value })}
                        >
                          <SelectTrigger className="h-8 w-[110px] text-xs">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Info className="h-5 w-5 text-blue-500" />
              Booking Details
            </DialogTitle>
            <DialogDescription>
              Full information for the enrollment submitted on {selectedBooking?.created_at ? format(new Date(selectedBooking.created_at), "PPP 'at' p") : ""}.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" /> Customer Information
                  </h4>
                  <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                    <div className="font-medium text-lg">{selectedBooking.first_name} {selectedBooking.last_name}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <a href={`mailto:${selectedBooking.email}`} className="text-blue-600 hover:underline">{selectedBooking.email}</a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <a href={`tel:${selectedBooking.phone}`} className="text-blue-600 hover:underline">{selectedBooking.phone}</a>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" /> Programme & Schedule
                  </h4>
                  <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                    <div className="font-medium text-blue-700">{selectedBooking.programmes?.title}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{selectedBooking.booking_date ? format(new Date(selectedBooking.booking_date), "MMMM d, yyyy") : "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{selectedBooking.start_time || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Delivery:</span>
                      <span className="flex items-center gap-1 font-medium">
                        {selectedBooking.is_online ? <><Globe className="h-3 w-3" /> Online</> : <><MapPin className="h-3 w-3" /> In-person</>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4" /> Message / Notes
                  </h4>
                  <div className="bg-muted/50 p-3 rounded-lg min-h-[100px] text-sm italic text-muted-foreground whitespace-pre-wrap">
                    {selectedBooking.message || "No additional message provided."}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" /> Status Management
                  </h4>
                  <div className="bg-muted/50 p-3 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Update Status:</span>
                      <div className="w-[140px]">
                        <Select
                          value={selectedBooking.status}
                          onValueChange={(value) => {
                            updateStatusMutation.mutate({ id: selectedBooking.id, status: value });
                            setSelectedBooking(prev => prev ? { ...prev, status: value } : null);
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-muted">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Current</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bookings;


