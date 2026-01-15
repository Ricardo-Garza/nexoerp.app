"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  FileSpreadsheet, 
  FileWarning, 
  EyeOff, 
  AlertTriangle, 
  TrendingDown 
} from "lucide-react";

const painPoints = [
  {
    icon: FileSpreadsheet,
    title: "Información dispersa en Excel",
    description: "Múltiples archivos sin conexión entre sí",
  },
  {
    icon: FileWarning,
    title: "Facturación complicada y manual",
    description: "Procesos lentos propensos a errores",
  },
  {
    icon: EyeOff,
    title: "Poca visibilidad del negocio",
    description: "Decisiones sin datos en tiempo real",
  },
  {
    icon: AlertTriangle,
    title: "Errores operativos y retrabajos",
    description: "Tiempo perdido corrigiendo errores",
  },
  {
    icon: TrendingDown,
    title: "Crecimiento desordenado",
    description: "Difícil escalar sin estructura",
  },
];

const PainPointsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="problema" ref={ref} className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--accent)/0.05),transparent_50%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">
            El problema actual
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
            ¿Te suena familiar?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Muchas PYMEs enfrentan estos desafíos diariamente, perdiendo tiempo, dinero y oportunidades de crecimiento.
          </p>
        </motion.div>

        {/* Pain points grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {painPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group"
            >
              <div className="h-full bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-xl hover:border-destructive/30 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
                  <point.icon className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {point.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {point.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
