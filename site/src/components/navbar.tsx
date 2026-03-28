"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const links = [
    { label: "Training", href: "/training" },
    { label: "Programmes", href: "/programmes" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];


  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-background/20 backdrop-blur-[2px]"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/deriv-logo.png" 
            alt="Deriv Champions" 
            width={120} 
            height={40} 
            className="h-8 w-auto object-contain dark:invert-[0.1] brightness-110"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider transition-colors",
                pathname === l.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {l.label}
            </Link>
          ))}

          <div className="h-4 w-px bg-border mx-2" />

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full text-muted-foreground hover:text-primary transition-colors min-w-[32px] flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />
            ) : (
              <div className="w-3.5 h-3.5" />
            )}
          </button>

          <Link
            href="/contact"
            className="px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest text-white transition-all hover:scale-105 hover:orange-glow active:scale-95"
            style={{ backgroundColor: "hsl(22 100% 50%)" }}
          >
            Book a Session
          </Link>
        </nav>

        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-muted-foreground hover:text-primary min-w-[32px] flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>
          <button
            className="p-2 text-muted-foreground hover:text-primary"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 py-4 flex flex-col gap-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "py-2 text-[11px] font-bold uppercase tracking-wider transition-colors",
                pathname === l.href ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="mt-2 py-2.5 rounded text-[10px] font-black uppercase tracking-widest text-white text-center"
            style={{ backgroundColor: "hsl(22 100% 50%)" }}
          >
            Book a Session
          </Link>
        </div>
      )}
    </header>
  );
}
