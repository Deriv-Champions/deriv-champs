"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    name: "Alvine O.",
    role: "DERIV TRADER",
    content: "Steve's mentorship is built on real market experience. The precise price action strategies changed everything.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
    align: "ml-auto mb-4 md:mr-32",
  },
  {
    name: "James T.",
    role: "BINARY OPTIONS",
    content: "Trading used to feel like gambling. Now, I have a clear structure and proper risk framing that actually works.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
    align: "mr-auto mb-4 md:ml-32",
  },
  {
    name: "Sarah M.",
    role: "FOREX ENTHUSIAST",
    content: "The focus on technical foundations and emotional control is what sets this training apart from the rest.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80",
    align: "mx-auto mb-4 md:ml-auto md:mr-16",
  },
];

const FlowerMask = () => (
  <svg width="0" height="0" className="absolute pointer-events-none">
    <defs>
      <clipPath id="flower-mask" clipPathUnits="objectBoundingBox">
        <path d="M 0.50 0.01 
C 0.61 0.01 0.65 0.12 0.73 0.10 
C 0.82 0.08 0.88 0.18 0.89 0.27 
C 0.90 0.37 0.99 0.41 0.98 0.50 
C 0.97 0.59 0.90 0.63 0.89 0.73 
C 0.88 0.82 0.82 0.92 0.73 0.90 
C 0.65 0.88 0.61 0.99 0.50 0.99 
C 0.39 0.99 0.35 0.88 0.27 0.90 
C 0.18 0.92 0.12 0.82 0.11 0.73 
C 0.10 0.63 0.01 0.59 0.02 0.50 
C 0.03 0.41 0.10 0.37 0.11 0.27 
C 0.12 0.18 0.18 0.08 0.27 0.10 
C 0.35 0.12 0.39 0.01 0.50 0.01 Z" />
      </clipPath>
    </defs>
  </svg>
);

export function Testimonials() {
  return (
    <section className="py-16 relative overflow-hidden bg-zinc-900 border-t border-zinc-800">
      <FlowerMask />
      {/* Dark background with shadow overlay */}
      <div className="absolute inset-0 z-0 opacity-80 mix-blend-multiply">
        <Image
          src="/palm_shadow_bg.png"
          alt="Shadow background"
          fill
          className="object-cover"
        />
      </div>

      <div className="container max-w-4xl mx-auto px-6 relative z-10 pt-4 pb-8">
        <h2 className="text-2xl md:text-4xl text-white font-serif mb-12 md:mb-16 tracking-wide font-normal">
          Testimonials
        </h2>

        <div className="flex flex-col gap-6">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.15 }}
              className={cn("relative w-full max-w-md", t.align)}
            >
              <div className="bg-[#e4e5e7] rounded-3xl px-6 py-8 md:px-8 md:pt-8 md:pb-8 shadow-2xl z-10 relative mt-10 md:mt-12 lg:ml-8">
                <div className="md:ml-24 text-center md:text-left">
                  <h4 className="text-lg md:text-xl font-bold font-serif mb-0.5 md:mb-1" style={{ color: "#bd3a2b" }}>{t.name}</h4>
                  <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3 md:mb-4">{t.role}</p>
                </div>
                <p className="text-zinc-800 leading-relaxed text-[13px] md:text-sm font-medium text-center md:text-left mt-1 md:mt-0 italic">
                  "{t.content}"
                </p>
              </div>

              {/* Overlapping scalloped avatar */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 md:translate-x-0 md:-top-4 md:-left-6 z-20 w-[80px] h-[80px] md:w-[100px] md:h-[100px] filter drop-shadow-2xl">
                <div
                  className="w-full h-full bg-white bg-cover bg-center"
                  style={{
                    clipPath: "url(#flower-mask)",
                    backgroundImage: `url(${t.avatar})`
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
