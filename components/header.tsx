"use client"

import { Zap, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  onLoginClick: () => void
  onRegisterClick: () => void
}

export function Header({ onLoginClick, onRegisterClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-4">
        <div className="h-14 max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-foreground hover:text-primary transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="hidden sm:inline">APEX DROID</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onLoginClick}
              className="text-muted-foreground hover:text-foreground"
            >
              Entrar
            </Button>
            <Button 
              size="sm"
              onClick={onRegisterClick} 
              className="shadow-sm shadow-primary/20"
            >
              Comecar
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "sm:hidden max-w-5xl mx-auto mt-2 overflow-hidden transition-all duration-200",
          mobileMenuOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="px-4 py-3 rounded-xl bg-card/60 backdrop-blur-xl border border-border/50 flex flex-col gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                onLoginClick()
                setMobileMenuOpen(false)
              }}
              className="w-full justify-start text-muted-foreground"
            >
              Entrar
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                onRegisterClick()
                setMobileMenuOpen(false)
              }} 
              className="w-full"
            >
              Comecar
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
