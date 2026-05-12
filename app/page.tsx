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
    <div className="min-h-screen relative bg-dot-premium">
      {/* Spotlight effect */}
      <div className="spotlight" />
      
      {/* Grid lines overlay */}
      <div className="grid-lines" />
      
      {/* Secondary glow accents */}
      <div className="glow-secondary -top-40 -right-40 opacity-60" />
      <div className="glow-secondary bottom-1/4 -left-60 opacity-40" />
      
      <Header onLoginClick={openLogin} onRegisterClick={openRegister} />
      
      <main className="relative z-10">
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
