"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import BenefitsSection from "@/components/landing/BenefitsSection"
import CTASection from "@/components/landing/CTASection"
import Footer from "@/components/landing/Footer"
import Header from "@/components/landing/Header"
import HeroSection from "@/components/landing/HeroSection"
import HowItWorksSection from "@/components/landing/HowItWorksSection"
import ModulesSection from "@/components/landing/ModulesSection"
import PainPointsSection from "@/components/landing/PainPointsSection"
import SolutionSection from "@/components/landing/SolutionSection"
import WhatsAppButton from "@/components/landing/WhatsAppButton"

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <PainPointsSection />
        <SolutionSection />
        <ModulesSection />
        <BenefitsSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
