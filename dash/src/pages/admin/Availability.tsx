import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Clock, Plus, Trash2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const days = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const Availability = () => {
  const queryClient = useQueryClient();
  const [newSlot, setNewSlot] = React.useState({
    day: "1", // Monday
    start: "09:00",
    end: "10:00"
  });

  const { data: slots, isLoading } = useQuery({
    queryKey: ["availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data as TimeSlot[];
    },
  });

  const addSlotMutation = useMutation({
    mutationFn: async (slot: any) => {
      const { error } = await supabase.from("availability").insert([{
        day_of_week: parseInt(slot.day),
        start_time: slot.start,
        end_time: slot.end,
        is_active: true
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      toast.success("Time slot added!");
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("availability").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      toast.success("Time slot removed!");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Availability</h1>
          <p className="text-muted-foreground">Define and manage your training schedule.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="p-6 border rounded-lg bg-card shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Slot
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Day of the Week</label>
                <Select value={newSlot.day} onValueChange={(val) => setNewSlot({ ...newSlot, day: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="time"
                    value={newSlot.start}
                    onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="time"
                    value={newSlot.end}
                    onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })}
                  />
                </div>
              </div>
              <Button
                className="w-full h-10"
                onClick={() => addSlotMutation.mutate(newSlot)}
                disabled={addSlotMutation.isPending}
              >
                {addSlotMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Slot"}
              </Button>
            </div>
          </div>

          <div className="p-6 border rounded-lg bg-blue-50/50 border-blue-100 text-blue-900">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
              <CalendarClock className="h-4 w-4" /> Schedule Note
            </h3>
            <p className="text-xs leading-relaxed opacity-80">
              Users will only be able to book sessions that fall within these defined recurring time slots.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
            ) : slots?.length === 0 ? (
              <div className="py-20 text-center border rounded-lg bg-card text-muted-foreground italic">No slots defined yet.</div>
            ) : (
              days.map((dayName, dayIndex) => {
                const daySlots = slots?.filter(s => s.day_of_week === dayIndex);
                if (daySlots?.length === 0) return null;

                return (
                  <div key={dayName} className="p-4 border rounded-lg bg-card">
                    <h3 className="font-bold text-sm mb-4 border-b pb-2">{dayName}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {daySlots?.map(slot => (
                        <div key={slot.id} className="flex items-center justify-between p-2 rounded bg-muted/30 border text-xs group">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</span>
                          </div>
                          <button
                            onClick={() => deleteSlotMutation.mutate(slot.id)}
                            className="p-1 rounded hover:bg-red-100 text-transparent group-hover:text-red-600 transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Availability;
