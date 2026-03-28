import type { Metadata } from "next";
import { WelcomePopup } from "@/components/welcome-popup";
import { HeroSection } from "@/components/sections/hero-section";

import { ServicesGrid } from "@/components/sections/services-grid";
import { AboutSplitFeature } from "@/components/sections/about-split-feature";
import { ProcessSection } from "@/components/sections/process-section";
import { Testimonials } from "@/components/sections/testimonials";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Deriv Champions | Professional Trading Mentorship",
  description: "Master the art of disciplined trading with expert mentorship. We specialize in Gold (XAU/USD), Forex, and Deriv Binary Options.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <WelcomePopup />

      {/* Hero Section */}
      <HeroSection />


      {/* Services Grid */}
      <ServicesGrid />

      {/* Why Choose Us / Split Feature */}
      <AboutSplitFeature />

      {/* How it Works / Process */}
      <ProcessSection />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA STRIP */}
      <section className="py-16 md:py-24 border-t border-border bg-background relative overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 opacity-50 dark:opacity-60 pointer-events-none">
          <Image
            src="/bg_instruments.png"
            alt="Trading background"
            fill
            className="object-cover"
          />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-black text-foreground leading-tight mb-4 tracking-tighter">
              Ready to take the first <br className="hidden md:block" />
              step in your <span className="text-primary italic">trading journey?</span>
            </h2>
            <p className="text-muted-foreground text-xs md:text-sm">No commitment required — just a conversation about where you are.</p>
          </div>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-black text-base transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/20"
          >
            Book a Session <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* INSTRUMENTS PREVIEW */}
      <section className="py-16 md:py-24 bg-card border-t border-border relative overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 opacity-50 dark:opacity-60 pointer-events-none">
          <Image
            src="/bg_instruments.png"
            alt="Trading background"
            fill
            className="object-cover"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-4 border-l-2 border-primary pl-4">Instruments</p>
              <h2 className="text-2xl md:text-3xl font-black mb-8 leading-tight tracking-tighter">Markets we <span className="italic text-primary underline decoration-primary/20">specialise</span> in.</h2>
              <div className="space-y-6">
                {[
                  { label: "Forex — Currency Pairs", desc: "Price action, timing entries, position management." },
                  { label: "Gold (XAU/USD)", desc: "Navigate volatility with structure and precision." },
                  { label: "Deriv Binary Options", desc: "Strategic binary trading with proper risk framing." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-1 h-8 bg-primary/20 rounded-full group-hover:bg-primary transition-colors mt-1" />
                    <div>
                      <p className="font-black text-base mb-1 uppercase tracking-tight">{item.label}</p>
                      <p className="text-muted-foreground text-xs max-w-sm italic opacity-80">"{item.desc}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative pt-12 lg:pt-0">
               <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-4 border-l-2 border-primary pl-4">Who This Is For</p>
               <h3 className="text-xl font-black mb-8 tracking-tighter">Built for the serious few.</h3>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                 <div className="space-y-2">
                   <h4 className="font-black text-foreground text-xs uppercase tracking-wider">🌱 The Beginner</h4>
                   <p className="text-muted-foreground leading-relaxed text-[11px] opacity-90 italic">
                     Start with the right foundation — not the bad habits most self-taught traders spend years unlearning.
                   </p>
                 </div>
                 <div className="space-y-2">
                   <h4 className="font-black text-foreground text-xs uppercase tracking-wider">🔄 The Professional</h4>
                   <p className="text-muted-foreground leading-relaxed text-[11px] opacity-90 italic">
                     You know something is missing. We help you find and fix it with a systematic edge.
                   </p>
                 </div>
               </div>

               <Link href="/programmes" className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] hover:gap-4 transition-all">
                  View Full Programme <ArrowRight className="w-3.5 h-3.5" />
               </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
