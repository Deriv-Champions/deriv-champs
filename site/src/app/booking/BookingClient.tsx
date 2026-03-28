"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { 
  Calendar, Clock, MapPin, Globe, Loader2, 
  Check, ArrowRight, BookOpen, AlertCircle
} from "lucide-react";
import { useBookingStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

const schema = z.object({
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().min(2, "Last name required"),
  phone: z.string().min(5, "Phone number required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  programmeId: z.string().min(1, "Select a programme"),
  bookingDate: z.string().min(1, "Select a date"),
  startTime: z.string().min(1, "Select a time"),
  isOnline: z.boolean(),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Programme {
  id: string;
  title: string;
}

export function BookingClient() {
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const { selectedCohort, closeBooking } = useBookingStore();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      programmeId: selectedCohort?.id || "",
      isOnline: true,
      bookingDate: "",
      startTime: "",
    },
  });

  const watchedDate = watch("bookingDate");

  useEffect(() => {
    const fetchData = async () => {
      const { data: progs } = await supabase.from("programmes").select("id, title");
      if (progs) setProgrammes(progs);

      const { data: slots } = await supabase.from("availability").select("*").eq("is_active", true);
      if (slots) setAvailableSlots(slots);
    };
    fetchData();
  }, []);

  const filteredSlots = availableSlots.filter(s => {
    if (!watchedDate) return false;
    const date = new Date(watchedDate);
    return s.day_of_week === date.getDay();
  });

  const onSubmit = async (data: FormValues) => {
    setIsPending(true);
    try {
      const { error } = await supabase.from("bookings").insert([
        {
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          programme_id: data.programmeId,
          booking_date: data.bookingDate,
          start_time: data.startTime,
          is_online: data.isOnline,
          message: data.message,
          status: "pending",
        },
      ]);

      if (error) throw error;

      setSubmitted(true);
      closeBooking();
      toast.success("Booking confirmed! We'll contact you to finalize the schedule.");
    } catch (error: any) {
      toast.error(`Booking failed: ${error.message || "Something went wrong"}`);
    } finally {
      setIsPending(false);
    }
  };

  const inputClass =
    "w-full bg-muted/20 border border-border/50 rounded-lg text-xs md:text-sm text-foreground placeholder:text-muted-foreground/50 px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <section className="pt-32 pb-16 bg-muted/30 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-primary">
            Scheduling
          </p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-none mb-6">Reserve your session.</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-xs md:text-base leading-relaxed italic border-l-2 md:border-l-0 md:border-b-2 border-primary/20 pl-4 md:pl-0 md:pb-4">
            "Select your preferred programme and timing, and Steve will coordinate the final details with you directly."
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 md:mb-8 relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-20" />
                <Check className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              </div>
              <h3 className="text-2xl md:text-4xl lg:text-5xl font-black text-foreground mb-4 md:mb-6 tracking-tight">Booking Received.</h3>
              <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-lg leading-relaxed mb-8 md:mb-10">
                Thank you for your interest. Steve will reach out via WhatsApp or Phone within <span className="text-foreground font-bold italic">60 minutes</span> to confirm your session and finalize the schedule.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link 
                  href="/programmes" 
                  className="px-8 py-4 rounded-full bg-primary text-white font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity shadow-xl shadow-primary/20 flex items-center gap-3"
                >
                  Explore Programmes
                </Link>
                <Link 
                  href="/" 
                  className="px-8 py-4 rounded-full border border-border text-foreground font-bold text-[10px] uppercase tracking-widest hover:bg-muted transition-colors flex items-center gap-3"
                >
                  Return Home
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-black italic">01</span>
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">First Name</label>
                    <input {...register("firstName")} className={inputClass} placeholder="John" />
                    {errors.firstName && <p className="text-red-500 text-[10px] mt-1">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Last Name</label>
                    <input {...register("lastName")} className={inputClass} placeholder="Doe" />
                    {errors.lastName && <p className="text-red-500 text-[10px] mt-1">{errors.lastName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Phone / WhatsApp</label>
                    <input {...register("phone")} className={inputClass} placeholder="+254 700 000 000" />
                    {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Email address</label>
                    <input {...register("email")} className={inputClass} placeholder="john@email.com" />
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/40" />

              <div className="space-y-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-black italic">02</span>
                  Selection
                </h2>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Select Programme</label>
                    <select {...register("programmeId")} className={inputClass + " appearance-none cursor-pointer"}>
                      <option value="">Select a programme...</option>
                      {programmes.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    {errors.programmeId && <p className="text-red-500 text-[10px] mt-1">{errors.programmeId.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setValue("isOnline", true)}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${watch("isOnline") ? 'border-primary bg-primary/5' : 'border-border/50 opacity-60'}`}
                    >
                      <Globe className={`w-5 h-5 ${watch("isOnline") ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Online session</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("isOnline", false)}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${!watch("isOnline") ? 'border-primary bg-primary/5' : 'border-border/50 opacity-60'}`}
                    >
                      <MapPin className={`w-5 h-5 ${!watch("isOnline") ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Physical (Kisumu)</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border/40" />

              <div className="space-y-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-black italic">03</span>
                  Scheduling
                </h2>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Preferred Date</label>
                      <input 
                        type="date" 
                        {...register("bookingDate")} 
                        min={format(new Date(), "yyyy-MM-dd")} 
                        className={inputClass} 
                      />
                      {errors.bookingDate && <p className="text-red-500 text-[10px] mt-1">{errors.bookingDate.message}</p>}
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Available Slots</label>
                      {watchedDate ? (
                        filteredSlots.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {filteredSlots.map(slot => (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => setValue("startTime", slot.start_time)}
                                className={`py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded border transition-all ${watch("startTime") === slot.start_time ? 'bg-primary border-primary text-white' : 'border-border/50 hover:border-primary/40'}`}
                              >
                                {slot.start_time.substring(0, 5)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 rounded bg-red-50/50 border border-red-100 text-red-600 text-[10px] italic">
                            <AlertCircle className="w-3.5 h-3.5" /> No slots available for this day.
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2 p-3 rounded bg-muted/30 border border-dashed border-border/50 text-muted-foreground/60 text-[10px] italic">
                          <Clock className="w-3.5 h-3.5" /> Select a date first.
                        </div>
                      )}
                      {errors.startTime && <p className="text-red-500 text-[10px] mt-1">{errors.startTime.message}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Additional Message</label>
                    <textarea
                      {...register("message")}
                      className={inputClass + " min-h-[100px] resize-none"}
                      placeholder="Share your goals or specific trading challenges..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 pb-20 max-w-sm">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 rounded-full bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-3"
                >
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><BookOpen className="w-4 h-4" /> Confirm Booking</>}
                </button>
                <p className="mt-6 text-left text-[10px] text-muted-foreground italic border-l-2 border-primary/20 pl-4">
                  Steve will review your application and coordinate via WhatsApp within 60 minutes.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
