"use client"

import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Hero() {
  return (
    <section className="pt-[180px] pb-[100px] px-6 text-center flex flex-col items-center max-w-5xl mx-auto">
      <div className="animate-fade-in-down">
        <span className="inline-block bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-primary mb-6">
          Nova Geração de IDE Mobile
        </span>
      </div>
      
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 animate-fade-in-up text-balance">
        Crie Apps com o Poder da{" "}
        <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Inteligência Artificial
        </span>
      </h1>
      
      <p className="text-lg text-muted-foreground max-w-2xl mb-10 animate-fade-in-up text-pretty" style={{ animationDelay: "0.2s" }}>
        O APEX DROID AI é o ambiente de desenvolvimento mobile definitivo. Do protótipo à produção, 
        facilitamos cada passo do seu projeto com ferramentas modernas e IA integrada.
      </p>
      
      <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
        <Button asChild size="lg" className="shadow-lg shadow-primary/25 gap-2">
          <Link href="/ide">
            Começar Agora
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button variant="outline" size="lg">
          Ver Documentação
        </Button>
      </div>
    </section>
  )
}
