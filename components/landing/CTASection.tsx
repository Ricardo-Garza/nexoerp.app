"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "¡Solicitud enviada!",
      description: "Nos pondremos en contacto contigo pronto.",
    });
    
    setFormData({ name: "", email: "", company: "", phone: "" });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <section id="contacto" ref={ref} className="py-24 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90" />
      
      {/* Decorative elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] border border-white/10 rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] border border-white/5 rounded-full"
      />
      
      {/* Glowing orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
                Empieza a tener control real de tu negocio
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8">
                Agenda una demo sin compromiso y descubre cómo NEXO ERP puede transformar tu operación.
              </p>
              
              {/* Trust points */}
              <div className="space-y-3">
                {[
                  "Sin compromisos",
                  "Pensado para PYMEs",
                  "Soporte cercano",
                ].map((point, index) => (
                  <motion.div
                    key={point}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3 justify-center lg:justify-start"
                  >
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                    <span className="text-primary-foreground/90">{point}</span>
                  </motion.div>
                ))}
              </div>

              {/* WhatsApp button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-8"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20 backdrop-blur-sm"
                  asChild
                >
                  <a href="https://wa.me/5215512345678" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 w-5 h-5" />
                    Escribir por WhatsApp
                  </a>
                </Button>
              </motion.div>
            </motion.div>

            {/* Right - Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-card rounded-2xl p-8 shadow-2xl border border-border">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Solicita tu demo
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Completa tus datos y te contactamos en menos de 24 horas.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        name="name"
                        placeholder="Tu nombre"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="bg-muted/50"
                      />
                    </div>
                    <div>
                      <Input
                        name="company"
                        placeholder="Nombre de empresa"
                        value={formData.company}
                        onChange={handleChange}
                        required
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                  <div>
                    <Input
                      name="email"
                      type="email"
                      placeholder="Correo electrónico"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="bg-muted/50"
                    />
                  </div>
                  <div>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="Teléfono (opcional)"
                      value={formData.phone}
                      onChange={handleChange}
                      className="bg-muted/50"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg shadow-accent/25"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Solicitar demo
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Al enviar, aceptas nuestro{" "}
                  <a href="#" className="underline hover:text-foreground">
                    aviso de privacidad
                  </a>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
