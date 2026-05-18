"use client"

import { cn } from "@/lib/utils"
import { 
  Inbox, 
  FolderOpen, 
  Search, 
  Plus, 
  Upload,
  Smartphone,
  Image as ImageIcon,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ElementType
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-10 px-4 text-center", className)}>
      <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground/60" />
      </div>
      
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      
      {description && (
        <p className="text-xs text-muted-foreground max-w-[200px] mb-4">
          {description}
        </p>
      )}
      
      {(action || secondaryAction) && (
        <div className="flex flex-col gap-2">
          {action && (
            <Button size="sm" onClick={action.onClick} className="gap-1.5">
              {action.icon && <action.icon className="w-3.5 h-3.5" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={secondaryAction.onClick}
              className="text-xs text-muted-foreground"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Pre-configured empty states for common IDE scenarios

export function EmptyScreens({ onCreateScreen }: { onCreateScreen?: () => void }) {
  return (
    <EmptyState
      icon={Smartphone}
      title="Nenhuma tela carregada"
      description="Selecione um repositorio para ver as telas disponiveis."
      action={onCreateScreen ? {
        label: "Nova Tela",
        onClick: onCreateScreen,
        icon: Plus
      } : undefined}
    />
  )
}

export function EmptyAssets({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={ImageIcon}
      title="Nenhum asset encontrado"
      description="Assets devem estar na pasta assets/ do seu repositorio."
      action={onUpload ? {
        label: "Upload Asset",
        onClick: onUpload,
        icon: Upload
      } : undefined}
    />
  )
}

export function EmptyRepos({ onConnect }: { onConnect?: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Nenhum repositorio"
      description="Conecte sua conta GitHub para importar projetos."
      action={onConnect ? {
        label: "Conectar GitHub",
        onClick: onConnect
      } : undefined}
    />
  )
}

export function EmptySearch({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title={`Nenhum resultado para "${query}"`}
      description="Tente buscar por outro termo."
      action={onClear ? {
        label: "Limpar busca",
        onClick: onClear
      } : undefined}
    />
  )
}

export function EmptyChat({ onStart }: { onStart?: () => void }) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Comece uma conversa"
      description="Pergunte sobre seu projeto ou peca ajuda para criar componentes."
      action={onStart ? {
        label: "Iniciar conversa",
        onClick: onStart
      } : undefined}
    />
  )
}

export function EmptyComponentTree() {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Nenhuma tela selecionada"
      description="Selecione uma tela para ver a arvore de componentes."
    />
  )
}
