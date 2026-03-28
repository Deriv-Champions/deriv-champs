"use client";

import { motion } from "framer-motion";
import { TrendingUp, ShieldCheck, Zap, BarChart3, Users, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

const services = [
  {
    title: "1-on-1 Mentorship",
    description: "The fastest path to mastery — built entirely around you.",
    icon: TrendingUp,
    highlight: true,
    features: [
      "Personalised curriculum and trading plan",
      "Live chart analysis and trade reviews",
      "Ongoing support between sessions",
      "Accountability and progress tracking",
      "Flexible scheduling — online or in-person",
    ]
  },
  {
    title: "Group Sessions",
    description: "Expert instruction meets peer learning — a community growing together.",
    icon: Users,
    highlight: false,
    features: [
      "Structured curriculum from basics to advanced",
      "Live market analysis and Q&A",
      "Peer discussion and shared learning",
      "Regular session schedule",
      "Access to group trading community",
    ]
  }
];

export function ServicesGrid() {
  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-12">
          <div className="max-w-xl">
            <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-4 border-l-2 border-primary pl-4">The Programme</p>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Two paths, <span className="text-primary italic">one</span> standard.
            </h2>
          </div>
          <p className="text-muted-foreground max-w-md text-xs md:text-sm leading-relaxed italic border-l border-border/50 pl-6">
            Available in-person in Kisumu or fully online. Both formats deliver the same rigorous curriculum.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative p-0 transition-all duration-300 flex flex-col items-start text-left"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-6",
                service.highlight ? "bg-primary text-white" : "bg-primary/10 text-primary"
              )}>
                <service.icon className="w-5 h-5" />
              </div>
              
              <h3 className="text-xl md:text-2xl font-black mb-3 tracking-tighter uppercase">{service.title}</h3>
              <p className="text-[12px] md:text-sm leading-relaxed mb-8 italic text-muted-foreground max-w-sm">
                {service.description}
              </p>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-8 gap-y-3 w-full border-t border-border/20 pt-6">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-[11px] font-bold">
                    <span className="text-primary mt-0.5 opacity-50">✦</span>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
