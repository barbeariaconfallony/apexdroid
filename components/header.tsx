"use client"

import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface HeaderProps {
  onLoginClick: () => void
  onRegisterClick: () => void
}

export function Header({ onLoginClick, onRegisterClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-extrabold text-xl tracking-tight text-foreground">
          <Zap className="w-6 h-6 text-primary drop-shadow-[0_0_8px_var(--primary)]" />
          APEX DROID AI
        </Link>
        
        <nav className="flex items-center gap-4">
          <Button variant="ghost" onClick={onLoginClick}>
            Entrar
          </Button>
          <Button onClick={onRegisterClick} className="shadow-lg shadow-primary/25">
            Cadastrar
          </Button>
        </nav>
      </div>
    </header>
  )
}
