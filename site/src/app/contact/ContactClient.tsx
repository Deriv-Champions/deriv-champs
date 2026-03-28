"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Phone, MapPin, Monitor, Loader2, Check } from "lucide-react";
import { useBookingStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

const schema = z.object({
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().min(2, "Last name required"),
  phone: z.string().min(5, "Phone number required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  trainingInterest: z.enum(["one-on-one", "group", "open-account"]),
  experienceLevel: z.enum(["beginner", "some-experience", "experienced"]),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ContactClient() {
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { selectedCohort, closeBooking } = useBookingStore();

  const defaultTrainingInterest = selectedCohort?.type === "one-on-one" ? "one-on-one" : selectedCohort ? "group" : "one-on-one";

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      trainingInterest: defaultTrainingInterest,
      experienceLevel: "beginner",
      message: selectedCohort ? `I'd like to enroll in: ${selectedCohort.title}` : "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsPending(true);
    try {
      const { error } = await supabase.from("contact_messages").insert([
        {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          message: data.message,
          subject: data.trainingInterest ? `Inquiry: ${data.trainingInterest}` : "New Contact Inquiry",
        },
      ]);

      if (error) throw error;

      await supabase.from("training_requests").insert([
        {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          email: data.email,
          interest: data.trainingInterest,
          experience: data.experienceLevel,
          preferred_date: data.preferredDate,
          preferred_time: data.preferredTime,
          message: data.message,
          status: "new",
        },
      ]);

      setSubmitted(true);
      reset();
      closeBooking();
      toast.success("Request received! Steve will be in touch with you shortly.");
    } catch (error: any) {
      toast.error(`Error: ${error.message || "Something went wrong"}`);
    } finally {
      setIsPending(false);
    }
  };

  const inputClass =
    "w-full bg-muted/20 border border-border/50 rounded-lg text-xs md:text-sm text-foreground placeholder:text-muted-foreground/50 px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* PAGE HEADER */}
      <section className="pt-32 pb-16 bg-muted/30 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-primary">
            Get in Touch
          </p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-none mb-6 mobile-text-balance">Ready to begin?</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-xs md:text-base leading-relaxed italic border-l-2 md:border-l-0 md:border-b-2 border-primary/20 pl-4 md:pl-0 md:pb-4">
            "Fill in the form and Steve will reach out personally to discuss your goals and the right path for you."
          </p>
          {selectedCohort && (
            <div className="mt-8 inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 text-xs font-bold text-primary">
              <span className="opacity-70">Enrolling in:</span>
              <span>{selectedCohort.title}</span>
            </div>
          )}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* CONTACT INFO SIDEBAR */}
            <div className="space-y-10 lg:sticky lg:top-32 h-fit">
              <div className="space-y-8">
                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Phone & WhatsApp</p>
                    <a href="tel:+254726043830" className="text-sm font-bold text-foreground hover:text-primary transition-colors block">
                      +254 726 043 830
                    </a>
                    <p className="text-[10px] text-muted-foreground mt-1 italic tracking-tight">Direct line to Steve</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Location</p>
                    <p className="text-sm font-bold text-foreground">Kisumu, Kenya</p>
                    <p className="text-[10px] text-muted-foreground mt-1 italic tracking-tight">Available for physical and online sessions</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Monitor className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Training Platform</p>
                    <a href="https://deriv.com" target="_blank" rel="noreferrer" className="text-sm font-bold text-foreground hover:text-primary transition-colors block">
                      Deriv Professional
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-xs font-black uppercase tracking-widest text-primary mb-3">Response Time</p>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  "I value your time. Expect a personal response from me within 60 minutes during active trading hours."
                </p>
              </div>
            </div>

            {/* BOOKING FORM */}
            <div className="lg:col-span-2">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-20" />
                    <Check className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-3xl font-black text-foreground mb-4 tracking-tight">Request Received.</h3>
                  <p className="text-muted-foreground text-sm md:text-base max-w-sm leading-relaxed italic">
                    "Thank you for reaching out. I'll personally review your enquiry and coordinate with you via WhatsApp shortly."
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-10 px-8 py-3 rounded-full border border-primary/20 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all"
                  >
                    Submit New Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                  <div className="border-l-4 border-primary pl-4 md:pl-6 py-2">
                    <h2 className="text-lg md:text-xl font-black text-foreground mb-1 md:mb-2 uppercase tracking-tight">Inquiry Form</h2>
                    <p className="text-muted-foreground text-[10px] md:text-xs italic">Explore your path with a strategy-first consultation.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">First Name</label>
                      <input {...register("firstName")} className={inputClass} placeholder="John" />
                      {errors.firstName && <p className="text-red-500 text-[10px] mt-1">{errors.firstName.message?.toString()}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Last Name</label>
                      <input {...register("lastName")} className={inputClass} placeholder="Doe" />
                      {errors.lastName && <p className="text-red-500 text-[10px] mt-1">{errors.lastName.message?.toString()}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Phone / WhatsApp</label>
                      <input {...register("phone")} className={inputClass} placeholder="+254 700 000 000" />
                      {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone.message?.toString()}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Email address</label>
                      <input {...register("email")} type="email" className={inputClass} placeholder="john@email.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Interest</label>
                      <select {...register("trainingInterest")} className={inputClass + " appearance-none cursor-pointer"}>
                        <option value="one-on-one">1-on-1 Mentorship</option>
                        <option value="group">Group Sessions</option>
                        <option value="open-account">Open an Account Only</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Experience</label>
                      <select {...register("experienceLevel")} className={inputClass + " appearance-none cursor-pointer"}>
                        <option value="beginner">Beginner</option>
                        <option value="some-experience">Some Experience</option>
                        <option value="experienced">Experienced</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Preferred Date</label>
                      <input {...register("preferredDate")} type="date" className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Preferred Time</label>
                      <input {...register("preferredTime")} type="time" className={inputClass} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Additional Information</label>
                    <textarea
                      {...register("message")}
                      className={inputClass + " min-h-[120px] resize-none"}
                      placeholder="Share your specific goals or current trading challenges..."
                    />
                  </div>

                  <div className="pt-4 max-w-xs">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full py-4 rounded-lg text-xs font-black uppercase tracking-[0.2em] text-white disabled:opacity-60 transition-all hover:opacity-90 flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                      style={{ backgroundColor: "hsl(22 100% 50%)" }}
                    >
                      {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "Submit Inquiry"}
                    </button>
                    <p className="text-muted-foreground text-[10px] mt-4 italic text-left pl-4 border-l-2 border-primary/20">
                      Response within 60 minutes during active hours.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
