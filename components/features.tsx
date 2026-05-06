"use client"

import { useEffect, useRef } from "react"
import { Layout, Sparkles, Cloud, Box, Layers, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Layout,
    title: "Interface Drag & Drop",
    description: "Paleta completa de componentes nativos. Arraste botões, campos de texto e layouts para criar interfaces incríveis com visualização em tempo real.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800"
  },
  {
    icon: Sparkles,
    title: "APEX DROID AI",
    description: "Inteligência artificial integrada que entende seus comandos. Peça para criar telas, ajustar estilos ou explicar lógicas complexas diretamente no chat.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800"
  },
  {
    icon: Cloud,
    title: "Sincronização & GitHub",
    description: "Conecte seus repositórios, gerencie branches e faça commits sem sair da IDE. Persistência em nuvem para você nunca perder seu progresso.",
    image: "https://images.unsplash.com/photo-1618401471353-b98aadebc25b?auto=format&fit=crop&q=80&w=800"
  },
  {
    icon: Box,
    title: "Lógica por Blocos",
    description: "Sistema de programação visual poderoso. Visualize o fluxo de eventos e ações do seu app de forma intuitiva, sem a complexidade de código puro.",
    image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=800"
  },
  {
    icon: Layers,
    title: "Gestão de Telas e Assets",
    description: "Gerencie múltiplas telas e organize seus arquivos de mídia (imagens, sons, fontes) com um gerenciador de assets integrado e eficiente.",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800"
  },
  {
    icon: Package,
    title: "Build APK Instantâneo",
    description: "Compilação remota de alto desempenho. Acompanhe os logs em tempo real e gere seu APK pronto para instalação em segundos.",
    image: "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&q=80&w=800"
  }
]

export function Features() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up")
            entry.target.classList.remove("opacity-0", "translate-y-8")
          }
        })
      },
      { threshold: 0.1 }
    )

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <span className="inline-block bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-primary mb-4">
          Ecossistema Completo
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
          Funcionalidades de Nível Profissional
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
          Tudo o que você precisa para construir, testar e publicar aplicativos Android de alta performance em um único lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card
            key={feature.title}
            ref={(el) => { cardsRef.current[index] = el }}
            className="opacity-0 translate-y-8 transition-all duration-500 hover:-translate-y-2 hover:border-primary/50 bg-card/50 backdrop-blur-sm group"
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <CardHeader className="pb-4">
              <div className="relative h-40 rounded-lg overflow-hidden mb-4 border border-border">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
