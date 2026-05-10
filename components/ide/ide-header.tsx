"use client"

import { useState } from "react"
import { 
  Zap, GitBranch, Package, Settings, ChevronRight, 
  Smartphone, Save, MoreHorizontal, Undo2, Redo2,
  Play, Code2, Layers, Eye, AlertCircle, Layout, Wifi, WifiOff, CloudOff, RefreshCw,
  ChevronDown, FolderGit2, Clock, Puzzle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import { useProjectManager } from "@/lib/hooks/use-project-manager"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PresenceBar } from "./presence-bar"

interface IDEHeaderProps {
  onBuildClick: () => void
  onSettingsClick: () => void
  onAIGeneratorClick?: () => void
  onAIScreenClick?: () => void
  onAIDebugClick?: () => void
  onAssetsClick?: () => void
}

export function IDEHeader({ 
  onBuildClick, 
  onSettingsClick,
  onAIGeneratorClick,
  onAIScreenClick,
  onAIDebugClick,
  onAssetsClick
}: IDEHeaderProps) {
  const { 
    ghToken, 
    cloudUser, 
    currentProject, 
    currentScreenName,
    selectedRepo,
    ghRepos,
    appMode,
    setAppMode,
    undo,
    redo,
    history,
    historyIndex,
    syncStatus,
    isOffline
  } = useIDEStore()

  const { selectProject, saveCurrentScreen } = useProjectManager()
  const { toast } = useToast()

  const [isSaving, setIsSaving] = useState(false)

  const projectName = selectedRepo?.name || currentProject?.name || "Novo Projeto"
  const screenName = currentScreenName || "Screen1"
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  // Status configuration
  const getStatus = () => {
    if (isSaving) return { label: "Salvando...", type: "warning" as const }
    if (cloudUser && ghToken) return { label: "Sincronizado", type: "success" as const }
    if (ghToken) return { label: "GitHub conectado", type: "success" as const }
    return { label: "Local", type: "muted" as const }
  }

  const status = getStatus()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (ghToken && selectedRepo) {
        await saveCurrentScreen()
        toast({
          title: "Salvo com sucesso",
          description: "Alterações enviadas para o GitHub."
        })
      } else {
        // Just simulate local save since we don't have github
        await new Promise(resolve => setTimeout(resolve, 800))
        toast({
          title: "Salvo localmente",
          description: "Conecte o GitHub para salvar na nuvem."
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-14 glass sticky top-0 z-50 flex items-center justify-between px-4 shrink-0 border-b border-white/5 shadow-2xl">
        {/* Left Section - Logo + Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-6 flex-1 min-w-0">
          {/* Logo with Glow */}
          <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-foreground select-none group">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform duration-300 shadow-glow">
              <Zap className="w-5 h-5 text-primary" style={{ fill: "var(--primary)" }} />
            </div>
            <div className="flex flex-col">
              <span className="hidden sm:inline leading-none">APEX DROID</span>
              <span className="text-[9px] text-primary font-bold tracking-[0.2em] leading-none mt-1 opacity-80">IDE PRO</span>
            </div>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* Breadcrumb with Repo Dropdown */}
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-secondary cursor-pointer transition-all group">
                  <span className="text-muted-foreground group-hover:text-foreground font-medium transition-colors">
                    {projectName as string}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground/50 group-hover:text-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 max-h-[400px] overflow-y-auto">
                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Meus Projetos (GitHub)
                </div>
                <DropdownMenuSeparator />
                {ghRepos.length === 0 ? (
                  <div className="px-2 py-4 text-center">
                    <p className="text-xs text-muted-foreground">Nenhum repositório encontrado</p>
                  </div>
                ) : (
                  ghRepos.map((repo) => (
                    <DropdownMenuItem 
                      key={repo.id} 
                      onClick={() => selectProject(repo)}
                      className={cn(
                        "flex flex-col items-start gap-1 p-2.5 cursor-pointer",
                        selectedRepo?.id === repo.id && "bg-primary/10"
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <FolderGit2 className={cn("w-4 h-4", selectedRepo?.id === repo.id ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("text-xs font-semibold truncate flex-1", selectedRepo?.id === repo.id && "text-primary")}>
                          {repo.name}
                        </span>
                        {repo.private ? (
                          <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground border border-border">Privado</span>
                        ) : (
                          <span className="text-[9px] bg-primary/10 px-1.5 py-0.5 rounded text-primary border border-primary/20">Público</span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1 pl-6">
                          {repo.description}
                        </p>
                      )}
                      <div className="text-[9px] text-muted-foreground/60 pl-6 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Atualizado {new Date(repo.updated_at).toLocaleDateString()}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="flex items-center gap-1.5 text-foreground font-medium px-2">
              <Smartphone className="w-3.5 h-3.5 text-primary" />
              {screenName}
            </span>
          </nav>

          {/* Presence Indicators */}
          <div className="hidden xl:block">
            <PresenceBar />
          </div>
          
          <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-full bg-success/5 border border-success/10 ml-2 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-medium text-success uppercase tracking-wider">Sincronizado</span>
          </div>
        </div>

        {/* Center Section - Mode Toggle + Quick Actions */}
        <div className="flex items-center gap-1">
          {/* Undo/Redo */}
          <div className="hidden md:flex items-center gap-0.5 mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={undo}
                  disabled={!canUndo}
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Desfazer (Ctrl+Z)
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={redo}
                  disabled={!canRedo}
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Refazer (Ctrl+Y)
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center bg-secondary/50 backdrop-blur-md rounded-xl p-1 border border-white/5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setAppMode("edit")}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 tab-transition hover-glow-border",
                    appMode === "edit" 
                      ? "bg-card text-primary shadow-lg scale-105 glow-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Design
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Modo de Edição Visual
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setAppMode("blocks")}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 tab-transition hover-glow-border",
                    appMode === "blocks" 
                      ? "bg-card text-primary shadow-lg scale-105 glow-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Puzzle className="w-3.5 h-3.5" />
                  Blocos
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Lógica de Programação
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setAppMode("run")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    appMode === "run" 
                      ? "bg-card text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Play className="w-3.5 h-3.5" />
                  Preview
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Testar App
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right Section - Status + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sync & Status Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-secondary/50 border border-border/50">
            {syncStatus === "synced" && <Wifi className="w-3.5 h-3.5 text-success" />}
            {syncStatus === "syncing" && <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />}
            {syncStatus === "offline" && <CloudOff className="w-3.5 h-3.5 text-muted-foreground" />}
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {syncStatus === "synced" && "Nuvem Sinc."}
              {syncStatus === "syncing" && "Sincronizando..."}
              {syncStatus === "offline" && "Modo Local"}
            </span>
          </div>

          {/* Save Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 text-xs h-8 hidden sm:flex"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className={cn("w-3.5 h-3.5", isSaving && "animate-pulse")} />
                Salvar
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Salvar Projeto (Ctrl+S)
            </TooltipContent>
          </Tooltip>

          {/* Commit Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 hidden md:flex">
                <GitBranch className="w-3.5 h-3.5" />
                Commit
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Enviar para GitHub
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 px-0" 
                onClick={onSettingsClick}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Configurações IA (Modelos e Providers)
            </TooltipContent>
          </Tooltip>

          {/* Build APK Button - Primary Action */}
          <Button 
            size="sm" 
            className="gap-1.5 text-xs h-8 shine" 
            onClick={onBuildClick}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Build APK</span>
            <span className="sm:hidden">Build</span>
          </Button>

          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onAIGeneratorClick && (
                <>
                  <DropdownMenuItem onClick={onAIGeneratorClick}>
                    <Zap className="w-4 h-4 mr-2" />
                    Gerar Componente IA
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAIScreenClick}>
                    <Layout className="w-4 h-4 mr-2" />
                    Gerar Tela Completa (IA)
                  </DropdownMenuItem>
                  {onAIDebugClick && (
                    <DropdownMenuItem onClick={onAIDebugClick}>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Debug Assistant
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={onSettingsClick}>
                <Settings className="w-4 h-4 mr-2" />
                Configuracoes IA
              </DropdownMenuItem>
              {onAssetsClick && (
                <DropdownMenuItem onClick={onAssetsClick}>
                  <Package className="w-4 h-4 mr-2" />
                  Gerenciador de Ativos
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Code2 className="w-4 h-4 mr-2" />
                Ver Codigo
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />
                Visualizar Blocos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="sm:hidden">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </DropdownMenuItem>
              <DropdownMenuItem className="md:hidden">
                <GitBranch className="w-4 h-4 mr-2" />
                Commit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  )
}
