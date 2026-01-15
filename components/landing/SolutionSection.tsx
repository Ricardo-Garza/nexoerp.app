"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Users, 
  ShoppingCart, 
  FileText, 
  Package, 
  Truck, 
  Wallet, 
  BarChart3,
  Shield
} from "lucide-react";

const modules = [
  { icon: Users, label: "CRM", color: "from-blue-500 to-blue-600" },
  { icon: ShoppingCart, label: "Ventas", color: "from-green-500 to-green-600" },
  { icon: FileText, label: "Facturación", color: "from-purple-500 to-purple-600" },
  { icon: Package, label: "Inventarios", color: "from-orange-500 to-orange-600" },
  { icon: Truck, label: "Compras", color: "from-red-500 to-red-600" },
  { icon: Wallet, label: "Finanzas", color: "from-teal-500 to-teal-600" },
  { icon: BarChart3, label: "Reportes", color: "from-indigo-500 to-indigo-600" },
  { icon: Shield, label: "Usuarios", color: "from-pink-500 to-pink-600" },
];

const SolutionSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="solucion" ref={ref} className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">
            La solución
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
            Todo conectado en <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">NEXO ERP</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            NEXO ERP conecta todos los procesos clave de tu empresa en un solo sistema, eliminando silos, errores y pérdida de tiempo.
          </p>
        </motion.div>

        {/* Hub diagram */}
        <div className="relative max-w-4xl mx-auto">
          {/* Center hub */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-20 mx-auto w-40 h-40 md:w-48 md:h-48"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full blur-xl opacity-40 animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-2xl">
              <div className="text-center text-primary-foreground">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold">N</span>
                </div>
                <span className="font-bold text-lg">NEXO ERP</span>
              </div>
            </div>
          </motion.div>

          {/* Orbiting modules */}
          <div className="absolute inset-0 flex items-center justify-center">
            {modules.map((module, index) => {
              const angle = (index * 360) / modules.length - 90;
              const radius = 180; // Distance from center
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;

              return (
                <motion.div
                  key={module.label}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${x}px - 32px)`,
                    top: `calc(50% + ${y}px - 32px)`,
                  }}
                  whileHover={{ scale: 1.15 }}
                  className="hidden md:block"
                >
                  {/* Connection line */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 0.3 } : {}}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.05 }}
                    className="absolute w-px h-24 bg-gradient-to-t from-accent/50 to-transparent origin-bottom"
                    style={{
                      left: "50%",
                      bottom: "100%",
                      transform: `rotate(${angle + 90}deg)`,
                      transformOrigin: "bottom center",
                    }}
                  />
                  
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg cursor-pointer`}>
                    <module.icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-center text-sm font-medium mt-2 text-foreground">
                    {module.label}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile view - grid */}
          <div className="md:hidden grid grid-cols-4 gap-4 mt-8">
            {modules.map((module, index) => (
              <motion.div
                key={module.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                className="flex flex-col items-center"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-center text-xs font-medium mt-2 text-foreground">
                  {module.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Spacer for desktop orbit */}
          <div className="hidden md:block h-96" />
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
