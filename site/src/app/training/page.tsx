import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, TrendingUp, Users } from "lucide-react";
import { RoadmapSection } from "@/components/sections/roadmap-section";

export const metadata: Metadata = {
  title: "Training Mastery Programme",
  description: "Our comprehensive trading mastery programme covers technical foundations, risk discipline, and trading psychology for Forex, Gold, and Binary Options.",
};

export default function Training() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* PAGE HEADER */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-slate-50 dark:bg-[#050505]">
        {/* Subtle grid background for premium tech feel */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        {/* Ambient glow */}
        <div className="absolute left-1/4 top-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-primary opacity-[0.08] dark:opacity-[0.15] blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-24">

          {/* Left Text Column */}
          <div className="flex-1 w-full max-w-2xl">
            <p className="inline-flex items-center rounded-full border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-6">
              The Programme
            </p>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-6">
              Trading Mastery Programme
            </h1>
            <p className="text-slate-600 dark:text-zinc-400 text-lg leading-relaxed max-w-lg mb-8">
              Available in-person in Kisumu or fully online. Both formats deliver the exact same rigorous curriculum designed to build your mechanical edge.
            </p>
          </div>

          {/* Right Image Column */}
          <div className="w-full md:w-1/2 flex justify-center relative">
            <div className="relative w-full max-w-[450px]">
              <img
                src="/deriv-binary.png"
                alt="Deriv Trading App"
                className="w-full h-auto object-contain [mask-image:radial-gradient(circle,white_70%,transparent_100%)] hover:-translate-y-2 transition-transform duration-700 ease-out select-none"
              />
            </div>
          </div>

        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="mb-16">
            <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-4 border-l-2 border-primary pl-4">
              Philosophy
            </p>
            <h2 className="text-2xl md:text-4xl font-black text-foreground tracking-tight leading-tight">Skill is built, <span className="text-primary italic">not</span> inherited.</h2>
            <p className="text-muted-foreground mt-6 max-w-xl text-xs md:text-sm leading-relaxed italic border-l border-border/50 pl-6">
              Consistent traders earn their edge through deliberate practice and honest self-assessment. Our training is built on three unshakeable pillars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {[
              {
                num: "01",
                title: "Technical Foundation",
                desc: "Price action, market structure, and precise entries — built from the ground up. No lagging indicators, just raw chart fluency and structure reading.",
              },
              {
                num: "02",
                title: "Risk Discipline",
                desc: "Protecting capital is the first rule. We train exact position sizing, exposure limits, and drawdown defense as a non-negotiable habit.",
              },
              {
                num: "03",
                title: "Trading Psychology",
                desc: "Your mindset is your edge. We address FOMO, revenge trading, and emotional paralysis — the patterns that silently destroy most traders.",
              },
            ].map((p, idx) => (
              <div key={p.num} className="relative group transition-all duration-300 flex flex-col items-start px-0">
                <div className="text-primary font-black text-3xl md:text-4xl mb-4 opacity-20 group-hover:opacity-100 transition-opacity select-none tracking-tighter">
                  {p.num}
                </div>
                <h3 className="text-lg font-black text-foreground mb-3 uppercase tracking-tight">{p.title}</h3>
                <p className="text-muted-foreground text-[12px] md:text-sm leading-relaxed italic group-hover:text-foreground transition-colors border-t border-border/20 pt-4">
                  "{p.desc}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROADMAP / CURRICULUM */}
      <RoadmapSection />

      {/* PROGRAMS */}
      <section className="py-24 md:py-32 bg-slate-50 dark:bg-[#080808] border-y border-border/50 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="mb-16">
            <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-4 border-l-2 border-primary pl-4">
              Mentorship Paths
            </p>
            <h2 className="text-2xl md:text-4xl font-black text-foreground tracking-tighter leading-none">Two paths, <span className="text-primary italic">one</span> standard.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 max-w-5xl">
            {/* 1-on-1 Mentorship */}
            <div className="relative group flex flex-col items-start px-0">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-4 tracking-tighter uppercase">1-on-1 Mentorship</h3>
              <p className="text-xs md:text-sm leading-relaxed mb-8 italic text-muted-foreground opacity-80 group-hover:opacity-100 transition-opacity max-w-sm">
                The fastest path to mastery — built entirely around you. Fully personalised with direct access to Steve.
              </p>
              <ul className="space-y-4 w-full border-t border-border/20 pt-8 mb-10">
                {[
                  "Personalised curriculum and trading plan",
                  "Live chart analysis and trade reviews",
                  "Ongoing support between sessions",
                  "Accountability and progress tracking",
                  "Flexible scheduling — online or in-person",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-[11px] md:text-xs font-bold uppercase tracking-tight">
                    <span className="text-primary mt-0.5 opacity-50">✦</span>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/programmes"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 bg-primary hover:scale-105 transition-transform"
              >
                View 1-on-1 Cohorts <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Group Sessions */}
            <div className="relative group flex flex-col items-start px-0">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-4 tracking-tighter uppercase">Group Sessions</h3>
              <p className="text-xs md:text-sm leading-relaxed mb-8 italic text-muted-foreground opacity-80 group-hover:opacity-100 transition-opacity max-w-sm">
                Expert instruction meets peer learning — a community growing together through a structured curriculum.
              </p>
              <ul className="space-y-4 w-full border-t border-border/20 pt-8 mb-10">
                {[
                  "Structured curriculum from basics to advanced",
                  "Live market analysis and Q&A",
                  "Peer discussion and shared learning",
                  "Regular session schedule",
                  "Access to group trading community",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-[11px] md:text-xs font-bold uppercase tracking-tight">
                    <span className="text-primary mt-0.5 opacity-50">✦</span>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/programmes"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest text-foreground border border-border bg-background hover:bg-muted transition-all"
              >
                View Group Cohorts <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* INSTRUMENTS */}
      <section className="py-24 md:py-32 bg-background relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="mb-16">
            <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-4 border-l-2 border-primary pl-4">
              Instruments
            </p>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Markets we <span className="text-primary italic">specialise</span> in.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {[
              {
                image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
                title: "Forex — Currency Pairs",
                desc: "Price action, timing entries, position management on the major and minor currency pairs."
              },
              {
                image: "/xauusd-gold.jpg",
                title: "Gold (XAU/USD)",
                desc: "Navigate volatility with structure and precision. High reward when traded with discipline."
              },
              {
                image: "/deriv-binary.png",
                title: "Deriv Binary Options",
                desc: "Strategic binary trading with proper risk framing. Mastery of fixed-time instruments."
              },
            ].map((inst) => (
              <div key={inst.title} className="group relative transition-all duration-300 flex flex-col px-0">
                <div className="relative aspect-[4/3] md:aspect-square w-full overflow-hidden rounded-2xl mb-6 shadow-2xl shadow-primary/5">
                  <img
                    src={inst.image}
                    alt={inst.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Gentle gradient overlay to set text readability if needed, though we use text below now */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">{inst.title}</h3>
                  <p className="text-muted-foreground text-[12px] md:text-sm leading-relaxed italic border-t border-border/20 pt-4 opacity-80 group-hover:opacity-100 transition-opacity">
                    "{inst.desc}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-background border-t border-slate-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Ready to start training?</h2>
          <p className="text-slate-600 dark:text-zinc-400 mb-10 text-lg max-w-xl mx-auto leading-relaxed italic">
            "The market has no memory of what happened last minute. Your edge lies in what you do in the next."
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-sm font-bold bg-primary text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Book a Free Strategy Session <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="mt-8 text-xs font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-widest">No commitment required • Direct access to Steve</p>
        </div>
      </section>
    </div>
  );
}
