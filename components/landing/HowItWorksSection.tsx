"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Calendar, Settings, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Calendar,
    title: "Agenda una demo",
    description: "Conoce NEXO ERP con una demostración personalizada según tu industria y necesidades.",
  },
  {
    number: "02",
    icon: Settings,
    title: "Configuramos NEXO a tu operación",
    description: "Nuestro equipo te acompaña en la implementación y migración de datos.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Empiezas a operar y medir resultados",
    description: "Tu equipo comienza a usar NEXO con soporte continuo y capacitación.",
  },
];

const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">
            Cómo funciona
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
            3 pasos para transformar tu operación
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Implementación simple y acompañamiento cercano en cada paso del camino.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Connection line - desktop */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
            
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  {/* Mobile connection line */}
                  {index < steps.length - 1 && (
                    <div className="md:hidden absolute left-8 top-20 w-0.5 h-full bg-gradient-to-b from-accent/30 to-transparent" />
                  )}
                  
                  <div className="relative z-10">
                    {/* Step number circle */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/25"
                    >
                      <step.icon className="w-7 h-7 text-white" />
                    </motion.div>
                    
                    {/* Step number badge */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full">
                      <span className="text-4xl md:text-5xl font-bold text-accent/20">
                        {step.number}
                      </span>
                    </div>

                    <div className="text-center">
                      <h3 className="font-bold text-xl text-foreground mb-3">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
