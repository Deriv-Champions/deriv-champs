"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Custom Flat SVG Artwork matched to the brand's Orange theme
const SvgStep1 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="100" className="fill-primary" />
    {/* Tablet Device */}
    <rect x="50" y="30" width="100" height="140" rx="12" className="fill-slate-800" />
    <rect x="58" y="42" width="84" height="116" rx="4" className="fill-white" />
    {/* Screen UI - Chart */}
    <path d="M 68 120 L 68 120 L 98 80 L 118 95 L 140 60" className="stroke-primary" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="140" cy="60" r="8" className="fill-primary" />
    {/* Abstract UI elements */}
    <rect x="68" y="55" width="24" height="6" rx="3" className="fill-slate-300" />
    <rect x="68" y="68" width="40" height="6" rx="3" className="fill-slate-200" />
    {/* Hand left */}
    <path d="M 20 110 C 20 110 40 100 55 105 C 55 105 60 110 55 120 C 50 130 30 135 15 130 Z" fill="#fbcf96" />
    <path d="M 10 130 L 30 150 L 25 180 L -10 180 Z" className="fill-slate-700" />
    {/* Hand right interacting */}
    <path d="M 180 140 C 180 140 150 145 130 125 C 130 125 125 115 135 110 C 145 105 165 115 185 125 Z" fill="#fbcf96" />
    <path d="M 185 140 L 165 180 L 195 180 Z" className="fill-slate-700" />
  </svg>
);

const SvgStep2 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="100" className="fill-primary" />
    {/* Light rays from box */}
    <path d="M 100 130 L 40 40 L 160 40 Z" fill="#ffffff" fillOpacity="0.15" />
    {/* Phone emerging */}
    <rect x="65" y="45" width="70" height="120" rx="10" className="fill-slate-800" />
    <rect x="72" y="55" width="56" height="90" rx="4" className="fill-white" />
    {/* App UI on Phone */}
    <circle cx="100" cy="85" r="16" className="fill-primary" />
    <rect x="85" y="115" width="30" height="6" rx="3" className="fill-slate-300" />
    <rect x="80" y="128" width="40" height="6" rx="3" className="fill-slate-200" />
    {/* Open Box */}
    <polygon points="50,110 150,110 130,170 70,170" fill="#d97706" />
    <polygon points="50,110 70,170 20,130" fill="#b45309" />
    <polygon points="150,110 130,170 180,130" fill="#b45309" />
    <polygon points="50,130 150,130 130,180 70,180" fill="#f59e0b" />
  </svg>
);

const SvgStep3 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="100" className="fill-primary" />
    {/* Top Hand (Dropping) */}
    <path d="M 150 -10 L 130 40 C 130 40 110 55 95 45 C 80 35 90 20 100 15 Z" fill="#fbcf96" />
    <path d="M 130 40 C 130 40 120 50 110 48 C 100 46 105 35 110 35 Z" fill="#e6b477" />
    <path d="M 200 -10 L 140 30 L 160 -10 Z" className="fill-slate-700" />
    {/* Coins falling */}
    <circle cx="100" cy="70" r="12" fill="#fbbf24" />
    <circle cx="100" cy="70" r="8" fill="#f59e0b" />
    <circle cx="85" cy="100" r="10" fill="#fbbf24" />
    <circle cx="115" cy="120" r="14" fill="#fbbf24" />
    {/* Bottom Hand (Receiving) */}
    <path d="M 30 210 L 60 150 C 60 150 90 140 120 150 C 150 160 155 175 130 180 L 100 180 Z" fill="#fbcf96" />
    <path d="M 120 150 C 120 150 135 140 145 150 C 155 160 140 170 130 170 Z" fill="#e6b477" />
    <path d="M -10 210 L 50 160 L 50 210 Z" className="fill-slate-800" />
    {/* Stack of coins in bottom hand */}
    <ellipse cx="100" cy="140" rx="20" ry="8" fill="#f59e0b" />
    <ellipse cx="100" cy="135" rx="20" ry="8" fill="#fbbf24" />
  </svg>
);

const steps = [
  {
    number: "01",
    title: "Sign up, its Free!",
    description: "Our team will set up your account and help you build your path to a professional trading desk.",
    icon: SvgStep1,
  },
  {
    number: "02",
    title: "Find best Deals & Invest",
    description: "Select from our open cohorts or private mentoring to start your disciplined trading journey.",
    icon: SvgStep2,
  },
  {
    number: "03",
    title: "Get your profit back",
    description: "Apply your training to the markets, manage risk with precision, and see the results of discipline.",
    icon: SvgStep3,
  },
];

export function ProcessSection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container max-w-4xl mx-auto px-6">
        
        {/* Title */}
        <div className="text-center mb-20 md:mb-32">
          <h2 className="text-lg tracking-widest uppercase text-primary font-medium mb-4">How It Works</h2>
          <div className="w-12 h-0.5 bg-primary/40 mx-auto" />
        </div>

        {/* Desktop Layout (Grid) */}
        <div className="hidden md:grid grid-cols-[1fr_80px_1fr] gap-x-8 lg:gap-x-16">
          {steps.map((step, idx) => {
            const isGraphicLeft = idx % 2 === 1;
            return (
              <div key={step.number} className="contents">
                {/* LEFT COLUMN */}
                <div className={cn("flex flex-col", isGraphicLeft ? "items-end" : "items-start")}>
                  {isGraphicLeft ? (
                    <div className="w-32 h-32 lg:w-40 lg:h-40 shadow-2xl rounded-full mr-4 flex-shrink-0">
                      <step.icon className="w-full h-full" />
                    </div>
                  ) : (
                    <div className="pt-2 text-left pr-4">
                      <h3 className="text-xl lg:text-2xl font-bold mb-4 text-primary">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-8">{step.description}</p>
                      <div className="flex gap-2.5">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-border" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* MIDDLE COLUMN (Timeline Axis) */}
                <div className="flex flex-col items-center">
                  <div className="flex flex-col items-center mb-4">
                    <span className="text-muted-foreground font-black tracking-[0.2em] text-[10px] uppercase mb-1">Step</span>
                    <span className="text-4xl font-black leading-none text-foreground">{step.number}</span>
                  </div>
                  
                  {/* Vertical line of dots (longer spacing to push next row down) */}
                  <div className="flex-1 flex flex-col items-center gap-4 py-4 min-h-[140px]">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-border" />
                    ))}
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className={cn("flex flex-col", isGraphicLeft ? "items-start" : "items-start")}>
                  {!isGraphicLeft ? (
                    <div className="w-32 h-32 lg:w-40 lg:h-40 shadow-2xl rounded-full ml-4 flex-shrink-0">
                      <step.icon className="w-full h-full" />
                    </div>
                  ) : (
                    <div className="pt-2 text-left pl-4 w-full">
                      <h3 className="text-xl lg:text-2xl font-bold mb-4 text-primary">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-8">{step.description}</p>
                      <div className="flex gap-2.5">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-border" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col gap-14">
          {steps.map((step) => (
            <motion.div 
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center"
            >
              <div className="flex flex-col items-center mb-6">
                <span className="text-muted-foreground font-black tracking-widest text-[9px] uppercase mb-1">Step</span>
                <span className="text-3xl font-black leading-none text-foreground">{step.number}</span>
              </div>
              <div className="w-28 h-28 rounded-full shadow-xl mb-6">
                <step.icon className="w-full h-full" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary uppercase tracking-tight">{step.title}</h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed mb-6">{step.description}</p>
              <div className="flex gap-2.5 justify-center">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-border" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
