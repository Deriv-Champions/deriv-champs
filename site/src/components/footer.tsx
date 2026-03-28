import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-14">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image 
                src="/deriv-logo.png" 
                alt="Deriv Champions" 
                width={150} 
                height={50} 
                className="h-10 w-auto object-contain dark:invert-[0.1] brightness-110"
              />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Professional forex and binary options training by Steve — Deriv specialist based in Kisumu, Kenya.
            </p>
          </div>

          <div>
            <p className="text-foreground text-sm font-semibold mb-4">Navigation</p>
            <ul className="space-y-2.5">
              {[
                { label: "Home", href: "/" },
                { label: "Training", href: "/training" },
                { label: "Programmes", href: "/programmes" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-foreground text-sm font-semibold mb-4">Contact</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(22 100% 50%)" }} />
                <a href="tel:+254726043830" className="hover:text-foreground transition-colors">
                  +254 726 043 830
                </a>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(22 100% 50%)" }} />
                Kisumu, Kenya
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Deriv Champions. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs">
            Training on the{" "}
            <a href="https://deriv.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
              Deriv Platform
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
