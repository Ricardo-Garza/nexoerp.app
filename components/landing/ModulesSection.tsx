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
  ShieldCheck
} from "lucide-react";

const modules = [
  {
    icon: Users,
    title: "Clientes / CRM",
    description: "Gestiona relaciones y seguimiento de clientes en un solo lugar",
  },
  {
    icon: ShoppingCart,
    title: "Ventas",
    description: "Cotizaciones, pedidos y órdenes de venta integradas",
  },
  {
    icon: FileText,
    title: "Facturación",
    description: "Facturación electrónica CFDI simple y automatizada",
  },
  {
    icon: Package,
    title: "Inventarios",
    description: "Control de stock, almacenes y movimientos en tiempo real",
  },
  {
    icon: Truck,
    title: "Compras",
    description: "Órdenes de compra y gestión de proveedores",
  },
  {
    icon: Wallet,
    title: "Finanzas",
    description: "Cuentas por cobrar, pagar y flujo de efectivo",
  },
  {
    icon: BarChart3,
    title: "Reportes & Dashboards",
    description: "Métricas y KPIs para tomar mejores decisiones",
  },
  {
    icon: ShieldCheck,
    title: "Usuarios & Roles",
    description: "Control de accesos y permisos por usuario",
  },
];

const ModulesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="modulos" ref={ref} className="py-24 bg-muted/30 relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">
            Módulos principales
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
            Todo lo que necesitas para operar
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cada módulo está diseñado para trabajar de forma independiente o integrada con los demás.
          </p>
        </motion.div>

        {/* Modules grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module, index) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group cursor-pointer"
            >
              <div className="h-full bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-xl hover:border-accent/30 transition-all duration-300 relative overflow-hidden">
                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 ring-1 ring-white/30 shadow-lg shadow-cyan-500/30 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-cyan-400/50 transition-all duration-300">
                    <module.icon className="w-7 h-7 text-slate-900" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-accent transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {module.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;
