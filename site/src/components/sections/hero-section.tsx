"use client";

import Link from "next/link";
import Image from "next/image";
import { MoveUpRight } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] lg:min-h-[85vh] flex items-center pt-28 pb-12 md:pt-32 md:pb-24 overflow-hidden bg-background">
      {/* Background Grid and Glow */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column: Content */}
        <motion.div 
          initial={{ opacity: 1, x: 0 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Train Smart, Trade Stronger
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] mb-6 decoration-primary/20 underline-offset-8 mobile-text-balance">
            Elevate Your <br />
            Wealth with <span className="text-primary italic">Intelligent</span> <br />
            Trading.
          </h1>
          
          <p className="text-[12px] md:text-sm text-muted-foreground max-w-lg mb-8 md:mb-10 leading-relaxed italic opacity-90 border-l-2 border-primary/20 pl-4 md:pl-6">
            Markets reward those who master their craft. We train serious traders to build the skills, structure, and mental edge needed to perform consistently on Deriv.
          </p>
          
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/contact"
              className="group relative inline-flex items-center gap-2 px-6 md:px-8 py-3.5 bg-primary text-white font-black text-[10px] md:text-xs uppercase tracking-widest rounded-full orange-glow hover:orange-glow-lg transition-all duration-300 w-full sm:w-auto justify-center"
            >
              Book a Session <MoveUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            
            <Link
              href="/programmes"
              className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <div className="w-8 h-[1px] bg-muted-foreground/30 group-hover:bg-primary group-hover:w-12 transition-all" />
              View Programmes
            </Link>
          </div>
        </motion.div>

        {/* Right Column: 3D Mockup + Floating Cards */}
        <motion.div 
          initial={{ opacity: 1, scale: 1 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
          style={{ perspective: "1000px" }}
        >
          {/* Main Phone Image */}
          <div className="relative z-10 w-full max-w-[320px] sm:max-w-[450px] mx-auto scale-90 sm:scale-100">
            <div className="relative aspect-[4/5] w-full rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden border-4 sm:border-8 border-background/20 shadow-2xl">
              <Image
                src="/trader_phone_mockup.png" 
                alt="Trading App Mockup"
                fill
                className="object-contain drop-shadow-[0_20px_50px_rgba(234,88,12,0.3)] dark:drop-shadow-[0_20px_50px_rgba(234,88,12,0.15)]"
                priority
              />
            </div>
          </div>
          
          {/* Floating Dashboard Card 1 (Top Left) */}
          <motion.div 
            animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -left-12 z-20 w-48 h-32 rounded-2xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-md hidden md:block"
          >
            <Image
              src="/crypto_card_btc.png"
              alt="Bitcoin Card"
              fill
              className="object-cover"
            />
          </motion.div>

          {/* Floating Dashboard Card 2 (Bottom Right) */}
          <motion.div 
            animate={{ y: [0, 15, 0], x: [0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-6 -right-12 z-20 w-52 h-36 rounded-2xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-md hidden md:block"
          >
            <Image
              src="/portfolio_card_eth.png"
              alt="Ethereum Portfolio"
              fill
              className="object-cover"
            />
          </motion.div>
          
          {/* Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
