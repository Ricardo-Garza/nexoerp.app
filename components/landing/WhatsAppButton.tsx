"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  return (
    <motion.a
      href="https://wa.me/5218120074691?text=Hola,%20me%20gustar%C3%ADa%20informaci%C3%B3n%20sobre%20NEXO%20ERP."
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2, duration: 0.3 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl shadow-black/30 ring-2 ring-white/70 border border-white/40 hover:shadow-[#25D366]/40 transition-shadow"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-6 h-6 text-white" />
      
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />
    </motion.a>
  );
};

export default WhatsAppButton;
