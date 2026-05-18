"use client"

import { ArrowRight, Sparkles, Command } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function Hero() {
  return (
    <section className="pt-[160px] pb-[80px] px-6 flex flex-col items-center max-w-5xl mx-auto">
      {/* Badge */}
      <div className="animate-reveal">
        <Badge 
          variant="outline" 
          className="px-4 py-1.5 rounded-full text-xs font-medium tracking-wide border-primary/30 bg-primary/5 text-primary gap-2 mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          IDE Mobile com Inteligencia Artificial
        </Badge>
      </div>
      
      {/* Title */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6 text-center animate-reveal stagger-1 tracking-tight">
        <span className="text-foreground">Crie Apps Android</span>
        <br />
        <span className="text-shimmer">do Zero ao APK</span>
      </h1>
      
      {/* Subtitle */}
      <p className="text-base sm:text-lg text-muted-foreground max-w-xl text-center mb-10 animate-reveal stagger-2 leading-relaxed text-pretty">
        Ambiente de desenvolvimento visual completo com IA integrada, 
        programacao por blocos e build remoto em segundos.
      </p>
      
      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center animate-reveal stagger-3">
        <Button asChild size="lg" className="gap-2 h-12 px-6 text-base shadow-lg shadow-primary/20 shine">
          <Link href="/projects">
            Acessar IDE
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base border-border hover:border-primary/50 hover:bg-primary/5">
          <Command className="w-4 h-4" />
          Atalhos Rapidos
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="mt-16 grid grid-cols-3 gap-8 sm:gap-16 animate-reveal stagger-4">
        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-bold text-foreground">100%</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Visual</p>
        </div>
        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-bold text-foreground">IA</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Integrada</p>
        </div>
        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-bold text-foreground">APK</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Instantaneo</p>
        </div>
      </div>
    </section>
  )
}
