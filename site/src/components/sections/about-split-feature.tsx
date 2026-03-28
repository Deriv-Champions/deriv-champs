"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";

export function AboutSplitFeature() {
  return (
    <section className="py-24 bg-muted relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Professional Image and Decorative Elements */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative z-10 rounded-2xl overflow-hidden border-4 md:border-8 border-background shadow-2xl aspect-[4/5] max-w-[280px] md:max-w-md mx-auto">
              <Image
                src="/woman_trader_professional.png"
                alt="Professional Trader"
                fill
                className="object-cover"
              />
            </div>
            
            {/* Floating Element 1 (Card-style) */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute -bottom-4 -right-4 md:-bottom-6 md:right-0 bg-background p-4 md:p-6 rounded-xl shadow-xl z-20 border border-border max-w-[160px] md:max-w-[200px]"
            >
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-[10px] md:text-xs font-bold leading-tight uppercase">Trusted by 500+ Traders</p>
              <p className="text-[9px] md:text-[10px] text-muted-foreground mt-1">Consistency built on discipline.</p>
            </motion.div>
            
            {/* Background geometric shape */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-3xl -z-10" />
            <div 
              className="absolute top-10 left-0 w-24 h-24 bg-primary rounded-xl rotate-12 opacity-10 pointer-events-none"
            />
          </motion.div>

          {/* Right Column: Content and Features */}
          <div className="space-y-8">
            <div>
              <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-4 border-l-2 border-primary pl-4">Philosophy</p>
              <h2 className="text-2xl md:text-3xl font-black mb-6 tracking-tighter italic underline decoration-primary/10 underline-offset-8">Skill is built, <span className="text-primary not-italic">not</span> inherited.</h2>
              <p className="text-muted-foreground text-xs md:text-sm leading-relaxed max-w-lg italic opacity-90">
                Consistent traders earn their edge through deliberate practice and honest self-assessment. 
                Our training is for those serious about that process.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {[
                {
                  num: "01",
                  title: "Technical Foundation",
                  desc: "Price action, market structure, and precise entries — built from the ground up."
                },
                {
                  num: "02",
                  title: "Risk Discipline",
                  desc: "Protecting capital is the first rule. We train risk management as a non-negotiable habit."
                },
                {
                  num: "03",
                  title: "Trading Psychology",
                  desc: "Your mindset is your edge. We address the emotional patterns that silently destroy most traders."
                }
              ].map((item) => (
                <div key={item.num} className="flex gap-4 items-start group">
                  <div className="min-w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-black text-[10px] group-hover:bg-primary group-hover:text-white transition-colors">
                    {item.num}
                  </div>
                  <div>
                    <h4 className="text-sm font-black mb-1 uppercase tracking-tight">{item.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">"{item.desc}"</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4">
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:orange-glow shadow-lg shadow-primary/20">
                Start Your Training <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
