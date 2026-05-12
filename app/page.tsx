"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Footer } from "@/components/footer"
import { AuthModal } from "@/components/auth-modal"

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")

  const openLogin = () => {
    setAuthMode("login")
    setAuthModalOpen(true)
  }

  const openRegister = () => {
    setAuthMode("register")
    setAuthModalOpen(true)
  }

  const switchMode = () => {
    setAuthMode(authMode === "login" ? "register" : "login")
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern -z-10" />
      <div className="fixed top-0 right-0 w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px] -z-10 animate-pulse-glow" />
      
      <Header onLoginClick={openLogin} onRegisterClick={openRegister} />
      
      <main>
        <Hero />
        <Features />
      </main>
      
      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onSwitchMode={switchMode}
      />
    </div>
  )
}
