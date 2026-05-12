"use client"

import { useEffect, useRef } from "react"
import { 
  Layout, 
  Sparkles, 
  GitBranch, 
  Blocks, 
  FolderOpen,
  Package,
  Bot,
  Palette,
  Zap,
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Layout,
    title: "Interface Drag & Drop",
    description: "Paleta completa de componentes nativos. Arraste botoes, campos de texto e layouts para criar interfaces incriveis com visualizacao em tempo real.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
    className: "md:col-span-2 md:row-span-2",
    highlight: true
  },
  {
    icon: Sparkles,
    title: "APEX DROID AI",
    description: "Inteligencia artificial integrada que entende seus comandos. Peca para criar telas, ajustar estilos ou explicar logicas complexas.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
    className: "md:col-span-1"
  },
  {
    icon: Blocks,
    title: "Logica por Blocos",
    description: "Sistema de programacao visual poderoso. Visualize o fluxo de eventos sem a complexidade de codigo puro.",
    image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=800",
    className: "md:col-span-1"
  },
  {
    icon: GitBranch,
    title: "Sincronizacao & GitHub",
    description: "Conecte seus repositorios, gerencie branches e faca commits sem sair da IDE.",
    image: "https://images.unsplash.com/photo-1618401471353-b98aadebc25b?auto=format&fit=crop&q=80&w=800",
    className: "md:col-span-1"
  },
  {
    icon: Package,
    title: "Build APK Instantaneo",
    description: "Compilacao remota de alto desempenho. Gere seu APK pronto para instalacao em segundos.",
    image: "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&q=80&w=800",
    className: "md:col-span-1"
  },
  {
    icon: FolderOpen,
    title: "Gestao de Assets",
    description: "Gerencie multiplas telas e organize seus arquivos de midia com um gerenciador integrado.",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800",
    className: "md:col-span-1"
  }
]

const additionalFeatures = [
  {
    icon: Bot,
    title: "Chat com IA",
    description: "Assistente inteligente para duvidas e sugestoes"
  },
  {
    icon: Palette,
    title: "Temas Personalizados",
    description: "Customize cores e aparencia do seu app"
  },
  {
    icon: Zap,
    title: "Hot Reload",
    description: "Veja mudancas instantaneamente no preview"
  },
  {
    icon: Shield,
    title: "Projeto Seguro",
    description: "Seus dados e codigo protegidos na nuvem"
  }
]

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  image,
  className,
  highlight,
  index 
}: { 
  icon: typeof Layout
  title: string
  description: string
  image: string
  className?: string
  highlight?: boolean
  index: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-reveal")
            entry.target.classList.remove("opacity-0")
          }
        })
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  const isLarge = highlight

  return (
    <div
      ref={cardRef}
      className={cn(
        "opacity-0 group relative rounded-xl overflow-hidden transition-all duration-300",
        "bg-card/40 border border-border/50 backdrop-blur-sm",
        "hover:bg-card/60 hover:border-border hover:shadow-lg hover:shadow-primary/5",
        "hover-glow-border flex flex-col",
        className
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image Section */}
      <div className={cn(
        "relative overflow-hidden",
        isLarge ? "h-48 md:h-64" : "h-32"
      )}>
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        
        {/* Icon badge */}
        <div className={cn(
          "absolute bottom-3 left-4 w-10 h-10 rounded-lg flex items-center justify-center",
          "bg-primary/90 backdrop-blur-sm shadow-lg"
        )}>
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        {highlight && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        )}
        
        <h3 className={cn(
          "font-semibold text-foreground mb-2",
          isLarge ? "text-lg" : "text-base"
        )}>
          {title}
        </h3>
        
        <p className={cn(
          "text-muted-foreground leading-relaxed",
          isLarge ? "text-sm" : "text-xs"
        )}>
          {description}
        </p>
      </div>
    </div>
  )
}

function MiniFeature({ icon: Icon, title, description }: { 
  icon: typeof Layout
  title: string
  description: string 
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-card/30 border border-border/30 hover:border-border/50 transition-colors">
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export function Features() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-16">
        <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">
          Funcionalidades
        </p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 tracking-tight text-balance">
          Tudo para criar apps Android
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-pretty">
          Ferramentas profissionais em uma interface simples e intuitiva.
        </p>
      </div>

      {/* Main Features Grid - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} {...feature} index={index} />
        ))}
      </div>

      {/* Additional Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {additionalFeatures.map((feature) => (
          <MiniFeature key={feature.title} {...feature} />
        ))}
      </div>

      {/* Security Note */}
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span>Seus projetos e dados ficam seguros na nuvem</span>
        </div>
      </div>
    </section>
  )
}
