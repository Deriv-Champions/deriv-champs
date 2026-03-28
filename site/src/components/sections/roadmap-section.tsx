"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const roadmapSteps = [
  {
    phase: "Phase 01",
    title: "Market Fundamentals",
    description: "Introduction to Forex, Binary Options, and Gold. Understanding market mechanics, liquidity, and how to comfortably enter and exit positions.",
  },
  {
    phase: "Phase 02",
    title: "Technical Strategy",
    description: "Mastering price action, market structure, and precise entries. We strip away lagging indicators and focus on raw chart fluency.",
  },
  {
    phase: "Phase 03",
    title: "Trading Psychology",
    description: "Your mindset is your edge. Overcome FOMO, revenge trading, and emotional paralysis — the patterns that silently destroy most traders.",
  },
  {
    phase: "Phase 04",
    title: "Risk Management",
    description: "Protecting capital is the first rule. Learn exact position sizing, exposure limits, and drawdown defense to survive and thrive.",
  },
  {
    phase: "Phase 05",
    title: "The Trading Plan",
    description: "Pulling it all together into a mechanical, repeatable system. You will leave with a personalized trading plan built for absolute consistency.",
  },
];

export function RoadmapSection() {
  return (
    <section className="py-16 md:py-24 bg-slate-50 dark:bg-[#111111] text-slate-900 dark:text-white relative font-sans border-t border-slate-200 dark:border-zinc-800/50">
      <div className="container max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 md:mb-20 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-black mb-4 tracking-tight text-slate-900 dark:text-white uppercase italic">Training Roadmap</h2>
          <p className="text-slate-600 dark:text-zinc-400 text-[12px] md:text-sm leading-relaxed max-w-lg mx-auto italic">
            A structured progression from fundamentals to professional mechanical edge.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Glowing Center Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 bg-primary transform md:-translate-x-1/2 shadow-[0_0_15px_rgba(234,88,12,0.3)] dark:shadow-[0_0_15px_rgba(234,88,12,0.5)] rounded-full" />

          {/* Steps */}
          <div className="flex flex-col gap-12 md:gap-0">
            {roadmapSteps.map((step, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div key={step.phase} className="relative flex items-center md:justify-between py-6 md:py-0 md:min-h-[160px]">
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-6 md:left-1/2 w-[10px] h-[10px] bg-primary rounded-full transform -translate-x-1/2 md:-translate-x-1/2 z-10 border-2 border-slate-50 dark:border-[#111111]" />

                  {/* Desktop Layout - Alternating Empty Spacer */}
                  <div className={cn("hidden md:block w-5/12", !isEven && "md:order-last")} />
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                      "w-full pl-16 md:pl-0 md:w-5/12 relative",
                      isEven ? "md:pr-16 md:text-left" : "md:pl-16 md:text-left"
                    )}
                  >
                    {/* The Card */}
                    <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-2xl p-5 md:p-6 hover:bg-slate-50 dark:hover:bg-[#1f1f1f] transition-all shadow-lg dark:shadow-xl">
                      <span className="text-primary font-black text-[10px] uppercase tracking-widest mb-2 block">{step.phase}</span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{step.title}</h3>
                      <p className="text-slate-600 dark:text-zinc-400 text-[12px] leading-relaxed italic">{step.description}</p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
