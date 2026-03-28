"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Calendar, Clock, Users, ArrowRight, Star, Loader2 
} from "lucide-react";
import { useBookingStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

interface Cohort {
  id: string;
  title: string;
  subtitle: string;
  type: "group" | "one-on-one";
  level: string;
  duration: string;
  spots?: number;
  spots_left?: number;
  price: string;
  description: string;
  status: "open" | "almost-full" | "full" | "coming-soon";
  image_url?: string;
  start_date?: string;
}

const statusConfig = {
  open: { label: "Open", color: "text-green-500", bg: "bg-green-500/10" },
  "almost-full": { label: "Almost Full", color: "text-orange-400", bg: "bg-orange-400/10" },
  full: { label: "Full", color: "text-red-400", bg: "bg-red-400/10" },
  "coming-soon": { label: "Coming Soon", color: "text-blue-400", bg: "bg-blue-400/10" },
};

function CohortCard({ cohort }: { cohort: Cohort }) {
  const { openBooking } = useBookingStore();
  const router = useRouter();

  const statusCfg = statusConfig[cohort.status] || statusConfig.open;
  const isFull = cohort.status === "full";
  const isSoon = cohort.status === "coming-soon";
  
  const spots = cohort.spots || 0;
  const spotsLeft = cohort.spots_left || 0;
  const spotsPercent = spots > 0 ? Math.round(((spots - spotsLeft) / spots) * 100) : 0;

  const handleEnroll = () => {
    openBooking({
      id: cohort.id,
      title: cohort.title + " — " + cohort.subtitle,
      type: cohort.type,
    });
    router.push("/contact");
  };

  return (
    <div className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 flex flex-col h-full">
      <div className="relative aspect-[16/8] w-full overflow-hidden bg-muted">
        {cohort.image_url && cohort.image_url.trim() !== "" ? (
          <img 
            src={cohort.image_url.startsWith('http') 
              ? cohort.image_url 
              : supabase.storage.from('programme-images').getPublicUrl(cohort.image_url).data.publicUrl} 
            alt={cohort.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            <img 
              src="https://images.unsplash.com/photo-1611974717482-952513ca0ad8?q=80&w=1000&auto=format&fit=crop" 
              alt="Trading"
              className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale brightness-50"
            />
            <div className="relative z-10 flex flex-col items-center gap-1">
              <Star className="w-6 h-6 text-primary/40 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-primary/40 underline decoration-primary/20">PREMIUM CONTENT</span>
            </div>
          </div>
        )}
        
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${statusCfg.bg} ${statusCfg.color} backdrop-blur-md`}>
            {statusCfg.label}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/50 text-white backdrop-blur-md">
            {cohort.type === "one-on-one" ? "1-on-1" : "Group"}
          </span>
        </div>

        <div className="absolute bottom-4 right-4 bg-primary text-white px-2.5 py-1 rounded-full text-xs font-black shadow-lg">
          {cohort.price}
        </div>
      </div>

      <div className="p-3.5 md:p-5 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="text-xs md:text-base lg:text-lg font-black text-foreground mb-0.5 leading-tight tracking-tight group-hover:text-primary transition-colors">{cohort.title}</h3>
          <p className="text-[7.5px] font-bold text-primary uppercase tracking-[0.2em] mb-1.5">{cohort.subtitle}</p>
          <p className="text-[9px] md:text-[11px] text-muted-foreground leading-relaxed line-clamp-2 italic">"{cohort.description?.substring(0, 80)}..."</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6 pt-4 border-t border-border/30">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-muted-foreground/60">
              <Calendar className="w-2.5 h-2.5" />
              <span className="text-[8px] font-bold uppercase tracking-wider">Starts</span>
            </div>
            <p className="text-[10px] font-black text-foreground">{cohort.start_date || "TBC"}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-muted-foreground/60">
              <Clock className="w-2.5 h-2.5" />
              <span className="text-[8px] font-bold uppercase tracking-wider">Length</span>
            </div>
            <p className="text-[10px] font-black text-foreground">{cohort.duration}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-muted-foreground/60">
              <Users className="w-2.5 h-2.5" />
              <span className="text-[8px] font-bold uppercase tracking-wider">Spots</span>
            </div>
            <p className="text-[9px] font-black text-foreground tracking-tight">{isSoon ? "TBC" : isFull ? "Full" : `${spotsLeft} Lft`}</p>
          </div>
        </div>

        {!isSoon && !isFull && (
          <div className="mb-6">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${spotsPercent}%`,
                  backgroundColor: "hsl(22 100% 50%)",
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
               <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{spotsPercent}% Enrolled</span>
               <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{spotsLeft} Spaces Left</span>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-border/30">
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href={`/programmes/${cohort.id}`}
              className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest text-foreground border border-border/50 hover:bg-muted transition-all flex items-center justify-center gap-2"
            >
              Learn More
            </Link>
            
            {isFull ? (
              <button
                disabled
                className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest text-muted-foreground bg-muted/50 cursor-not-allowed flex items-center justify-center gap-2"
              >
                Sold Out
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                style={{ backgroundColor: "hsl(22 100% 50%)" }}
              >
                {isSoon ? "Waitlist" : "Join"} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProgrammesClient({ initialProgrammes }: { initialProgrammes: Cohort[] }) {
  const [filter, setFilter] = useState<"all" | "group" | "one-on-one">("all");

  const filtered = initialProgrammes.filter((c) =>
    filter === "all" ? true : c.type === filter
  );

  return (
    <>
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(["all", "group", "one-on-one"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === f
                  ? "text-white shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted"
              }`}
              style={filter === f ? { backgroundColor: "hsl(22 100% 50%)" } : {}}
            >
              {f === "all" ? "All" : f === "group" ? "Groups" : "1-on-1"}
            </button>
          ))}
          <span className="ml-auto text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest hidden sm:block">
            {filtered.length} AVAILABLE
          </span>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          {filtered.length === 0 ? (
            <div className="py-20 text-center border border-dashed rounded-xl">
              <p className="text-muted-foreground">No cohorts match this filter yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {filtered.map((c) => (
                <CohortCard key={c.id} cohort={c} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
