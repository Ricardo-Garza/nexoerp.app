"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Linkedin, Twitter, Facebook, Instagram } from "lucide-react";

const Footer = () => {
  const socialLinks = [
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ];

  const footerLinks = [
    { label: "Contacto", href: "#contacto" },
    { label: "Demo", href: "#contacto" },
    { label: "Aviso de privacidad", href: "#" },
  ];

  return (
    <footer className="bg-[#0b1220]/85 text-primary-foreground py-16 border-t border-white/10 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo and tagline */}
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
              <Image
                src="/Logo Nexo ERP (1).png"
                alt="Nexo ERP"
                width={260}
                height={72}
                className="h-14 w-auto md:h-16"
              />
            </div>
            <p className="text-primary-foreground/70 text-sm">
              Tecnología clara para negocios reales
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-white/80 hover:text-white transition-colors underline-offset-4 hover:underline"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Social links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-white text-[#0b1220] flex items-center justify-center shadow-md shadow-black/30 hover:bg-white/90 transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-sm text-primary-foreground/50">
            © {new Date().getFullYear()} NEXO ERP. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
