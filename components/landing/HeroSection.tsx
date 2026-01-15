"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Floating Decorative Elements */}
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-[10%] w-72 h-72 bg-accent/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-[10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl"
      />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Pensado para PYMEs en Latinoamérica</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              El ERP que{" "}
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                conecta toda tu operación
              </span>{" "}
              en un solo lugar
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Ventas, facturación, clientes, inventarios y finanzas integrados en una sola plataforma simple y escalable.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/25 group animate-pulse-glow"
                asChild
              >
                <a href="#contacto">
                  Solicitar demo
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="group" asChild>
                <a href="#contacto">
                  <Play className="mr-2 w-4 h-4" />
                  Hablar con un asesor
                </a>
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Sin compromisos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Implementación rápida</span>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 rounded-2xl blur-2xl transform scale-95" />
            
            {/* Dashboard placeholder */}
            <div className="relative bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
              {/* Browser header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground">
                    app.nexoerp.com/dashboard
                  </div>
                </div>
              </div>
              
              {/* Dashboard content placeholder */}
              <div className="p-6 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Ventas del mes", value: "$847,520" },
                    { label: "Clientes activos", value: "1,284" },
                    { label: "Productos", value: "3,847" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                      className="bg-muted/50 rounded-lg p-4"
                    >
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>
                
                {/* Chart placeholder */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="bg-muted/30 rounded-lg p-4 h-48"
                >
                  <div className="flex items-end justify-between h-full gap-2 pt-4">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 80].map((height, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.8, delay: 1 + i * 0.05 }}
                        className="flex-1 bg-gradient-to-t from-accent to-accent/50 rounded-t-sm"
                      />
                    ))}
                  </div>
                </motion.div>
                
                {/* Table placeholder */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  className="space-y-2"
                >
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-accent/20" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-muted rounded w-1/3" />
                        <div className="h-2 bg-muted/50 rounded w-1/2" />
                      </div>
                      <div className="h-6 w-16 bg-accent/20 rounded" />
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 rounded-full bg-muted-foreground/50" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
