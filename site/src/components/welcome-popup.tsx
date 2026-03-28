"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("dc-welcome");
    if (!seen) {
      const t = setTimeout(() => setIsOpen(true), 1800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setIsOpen(false);
    localStorage.setItem("dc-welcome", "true");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="relative w-full max-w-sm sm:max-w-md bg-card border border-border rounded-2xl p-6 sm:p-10 shadow-2xl text-center"
          >
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mx-auto flex items-center justify-center mb-6">
              <Image 
                src="/deriv-logo.png" 
                alt="Deriv Champions" 
                width={80} 
                height={80} 
                className="h-14 w-auto object-contain"
              />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-3">
              Welcome to Deriv Champions
            </h2>
            <p className="text-muted-foreground text-[13px] md:text-sm leading-relaxed mb-8 md:mb-10 opacity-80 italic">
              "Every champion was once a contender that refused to give up." Ready to build the skills, structure, and mental edge?
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/contact"
                onClick={dismiss}
                className="flex-1 py-3 md:py-3.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest text-white text-center hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                style={{ backgroundColor: "hsl(22 100% 50%)" }}
              >
                Book a Session
              </Link>
              <button
                onClick={dismiss}
                className="flex-1 py-3 md:py-3.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground border border-border hover:bg-muted transition-colors"
              >
                Explore First
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
