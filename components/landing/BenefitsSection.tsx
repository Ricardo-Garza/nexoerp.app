"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Eye, 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  Rocket, 
  Building2 
} from "lucide-react";

const benefits = [
  {
    icon: Eye,
    title: "Control total del negocio en tiempo real",
    description: "Visualiza métricas clave, inventarios y ventas al instante desde cualquier dispositivo.",
  },
  {
    icon: ShieldCheck,
    title: "Menos errores operativos",
    description: "Automatización que elimina duplicados, inconsistencias y errores humanos.",
  },
  {
    icon: Clock,
    title: "Ahorro de tiempo administrativo",
    description: "Procesos que tomaban horas ahora se completan en minutos.",
  },
  {
    icon: TrendingUp,
    title: "Escalable conforme crece tu empresa",
    description: "Añade usuarios, sucursales y módulos según tus necesidades.",
  },
  {
    icon: Rocket,
    title: "Implementación sencilla",
    description: "Configuración guiada y soporte cercano para empezar rápido.",
  },
  {
    icon: Building2,
    title: "Diseñado para PYMEs",
    description: "Funcionalidad empresarial con simplicidad y precios accesibles.",
  },
];

const BenefitsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="beneficios" ref={ref} className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-gradient-to-l from-accent/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Title and description */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">
              Beneficios clave
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-6">
              Resultados reales para tu negocio
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              No vendemos funciones, vendemos resultados. NEXO ERP está diseñado para transformar cómo operas tu negocio día a día.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: "70%", label: "Menos tiempo admin" },
                { value: "3x", label: "Mayor visibilidad" },
                { value: "50%", label: "Menos errores" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-accent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Benefits list */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: 30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ x: 5 }}
                className="group"
              >
                <div className="flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                    <benefit.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-accent transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
