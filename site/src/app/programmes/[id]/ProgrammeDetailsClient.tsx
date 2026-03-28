"use client";

import { 
  Calendar, Clock, Users, ArrowLeft,Star, Award, ChevronRight, MapPin 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

interface Programme {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  duration: string;
  level: string;
  type: string;
  image_url: string;
  status: string;
  curriculum: string[];
  benefits: string[];
}

export function ProgrammeDetailsClient({ programme }: { programme: Programme }) {
  const router = useRouter();
  const { openBooking } = useBookingStore();

  const handleEnroll = () => {
    openBooking({
      id: programme.id,
      title: `${programme.title} — ${programme.subtitle}`,
      type: programme.type,
    });
    router.push("/booking");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* IMMERSIVE HERO */}
      <section className="relative min-h-[60vh] flex items-center pt-20 overflow-hidden">
        {/* HERO IMAGE BACKGROUND */}
        <div className="absolute inset-0 z-0">
          {programme.image_url ? (
            <img 
              src={programme.image_url.startsWith('http') 
                ? programme.image_url 
                : supabase.storage.from('programme-images').getPublicUrl(programme.image_url).data.publicUrl} 
              alt={programme.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full py-20">
          <Link 
            href="/programmes" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:opacity-80 transition-all mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Programmes
          </Link>

          <div className="max-w-2xl space-y-6">
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-primary/20">
                {programme.level}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10">
                 {programme.type === 'one-on-one' ? '1-on-1 Mentorship' : 'Group Cohort'}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-foreground leading-[1.1] tracking-tighter">
              {programme.title}
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl italic border-l-2 border-primary/40 pl-6">
              "{programme.subtitle}"
            </p>

            <div className="pt-6 flex flex-wrap gap-8 items-center">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-[0.2em]">Duration</p>
                <p className="text-sm font-black text-foreground">{programme.duration}</p>
              </div>
              <div className="w-px h-8 bg-border/50 hidden sm:block" />
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-[0.2em]">Investment</p>
                <p className="text-sm font-black text-primary">{programme.price}</p>
              </div>
            </div>
            
            <div className="pt-8">
              <button
                onClick={handleEnroll}
                className="px-8 py-3.5 rounded-full bg-primary text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center gap-3"
              >
                Enroll Now <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW & CURRICULUM */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-16">
              <div>
                <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-foreground flex items-center gap-3">
                  <span className="w-8 h-px bg-primary" />
                  Programme Overview
                </h2>
                <div className="max-w-none text-muted-foreground leading-relaxed text-sm md:text-base italic">
                  <p>{programme.description}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-black mb-8 uppercase tracking-widest text-foreground flex items-center gap-3">
                  <span className="w-8 h-px bg-primary" />
                  Core Curriculum
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {programme.curriculum && Array.isArray(programme.curriculum) ? (
                    programme.curriculum.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4 border-b border-border/40 pb-4 group hover:border-primary/40 transition-colors">
                        <span className="text-[10px] font-black text-primary/40 mt-1">{String(idx + 1).padStart(2, '0')}</span>
                        <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors leading-tight uppercase tracking-tight">{item}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground italic col-span-2 text-xs">Curriculum details coming soon.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-32 space-y-12">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground mb-8 border-b border-primary/20 pb-2">Programme Benefits</h3>
                  <div className="space-y-6">
                    {[
                      "Priority WhatsApp support for 6 months",
                      "Access to live chart walkthroughs",
                      "Proprietary trading model guide",
                      "Psychology & risk blueprints",
                      "Access to the Deriv Champions community"
                    ].map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <Award className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-bold text-muted-foreground leading-relaxed italic">"{benefit}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-8 border-t border-border">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Global</p>
                    <p className="text-[10px] font-bold text-foreground">Online Worldwide</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Local</p>
                    <p className="text-[10px] font-bold text-foreground">In-Person Kisumu</p>
                  </div>
                </div>

                <button 
                  onClick={handleEnroll}
                  className="w-full py-4 rounded-full bg-foreground text-background font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-foreground/5"
                >
                  Reserve Your Spot
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
