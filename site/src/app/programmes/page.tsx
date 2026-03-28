import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ProgrammesClient } from "./ProgrammesClient";

export const metadata: Metadata = {
  title: "Trading Programmes",
  description: "Explore our expert-led trading programmes. From one-on-one mentorship to group cohorts, find the path that fits your trading goals.",
};

export default async function ProgrammesPage() {
  const { data: programmes } = await supabase
    .from("programmes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-12 lg:pt-32 lg:pb-24 overflow-hidden bg-slate-50 dark:bg-[#050505]">
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute right-1/4 top-1/4 -z-10 h-[300px] w-[300px] rounded-full bg-primary opacity-[0.08] dark:opacity-[0.12] blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-20">
          <div className="flex-1 w-full max-w-2xl text-center md:text-left">
            <p className="inline-flex items-center rounded-full border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-5">
              Cohorts & Programmes
            </p>
            <h1 className="text-2xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-5 mobile-text-balance">
              Two paths,<br className="hidden md:block" />one standard.
            </h1>
            <p className="text-slate-600 dark:text-zinc-400 text-sm md:text-base leading-relaxed max-w-lg mx-auto md:mx-0 mb-8 opacity-80">
              Choose the format that fits your schedule and goals. All cohorts are capped to ensure quality — enroll before spots fill up.
            </p>
          </div>

          <div className="w-full md:w-1/2 flex justify-center relative">
            <div className="relative w-full max-w-[480px]">
              <img 
                src="/woman_trader_professional.png" 
                alt="Professional Trading Mentorship"
                className="w-full h-auto object-contain [mask-image:radial-gradient(circle,white_70%,transparent_100%)] drop-shadow-[0_20px_50px_rgba(234,88,12,0.15)] dark:drop-shadow-[0_20px_50px_rgba(234,88,12,0.25)] hover:-translate-y-2 transition-transform duration-700 ease-out"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Client Component for filtering and rendering */}
      <ProgrammesClient initialProgrammes={programmes || []} />

      <section className="py-16 bg-muted/30 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-xl font-black text-foreground mb-10 tracking-tight uppercase text-center">Frequently Asked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {[
              {
                q: "Are sessions online or in-person?",
                a: "Both options are available. Group sessions are typically held online via video call. 1-on-1 mentorship can be in-person in Kisumu or online — your choice.",
              },
              {
                q: "What platform do you use?",
                a: "All training is done on the Deriv platform. If you don't have an account yet, we'll help you set one up for free before the cohort begins.",
              },
              {
                q: "What if I miss a session?",
                a: "All live sessions are recorded. Group cohort participants get access to recordings. 1-on-1 sessions can be rescheduled with 24 hours' notice.",
              },
              {
                q: "How do I pay?",
                a: "After enrolling, Steve will reach out directly to confirm your spot and share payment details (M-Pesa or bank transfer). No payment is taken online.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-l-2 border-primary/20 pl-6">
                <h3 className="text-xs font-black text-foreground mb-3 tracking-tight">{q}</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">"{a}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 bg-background border-t border-slate-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">Your path starts here.</h2>
          <p className="text-slate-600 dark:text-zinc-400 mb-10 text-sm md:text-lg max-w-xl mx-auto leading-relaxed italic opacity-80">
            "Every champion was once a contender that refused to give up."
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest bg-primary text-white hover:opacity-90 transition-all shadow-xl shadow-primary/20"
            >
              Talk to Steve <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
