"use client"

import { useState } from "react"
import { 
  Zap, GitBranch, Package, Settings, ChevronRight, 
  Smartphone, Save, MoreHorizontal,
  Play, Code2, Layers, Eye, AlertCircle, Layout, Wifi, CloudOff, RefreshCw,
  ChevronDown, FolderGit2, Clock, Puzzle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import { useProjectManager } from "@/lib/hooks/use-project-manager"
import { syncService } from "@/lib/sync/sync-service"
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
    syncStatus
  } = useIDEStore()

  const { selectProject, saveCurrentScreen } = useProjectManager()
  const { toast } = useToast()

  const [isSaving, setIsSaving] = useState(false)

  const projectName = selectedRepo?.name || currentProject?.name || "Novo Projeto"
  const screenName = currentScreenName || "Screen1"

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
      <header className="h-12 glass sticky top-0 z-50 flex items-center px-3 shrink-0 border-b border-white/5 shadow-lg relative">
        {/* Left Section - Logo + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Logo Icon Only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 hover:scale-105 transition-transform duration-300 shadow-glow cursor-pointer shrink-0">
                <Zap className="w-5 h-5 text-primary" style={{ fill: "var(--primary)" }} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              APEX DROID IDE
            </TooltipContent>
          </Tooltip>

          {/* Separator */}
          <div className="w-px h-6 bg-border/50 shrink-0" />

          {/* Breadcrumb with Repo Dropdown */}
          <nav className="flex items-center gap-1 text-sm min-w-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-secondary cursor-pointer transition-all group max-w-[140px]">
                  <span className="text-muted-foreground group-hover:text-foreground font-medium transition-colors truncate text-xs">
                    {projectName as string}
                  </span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground/50 group-hover:text-foreground shrink-0" />
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

            <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
            <span className="flex items-center gap-1 text-foreground font-medium text-xs">
              <Smartphone className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate max-w-[80px]">{screenName}</span>
            </span>
          </nav>
        </div>

        {/* Center Section - Mode Toggle (Absolute Centered) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
          {/* Mode Toggle */}
          <div className="flex items-center bg-secondary/50 backdrop-blur-md rounded-lg p-0.5 border border-white/5 shadow-lg">
            <button
              onClick={() => setAppMode("edit")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all duration-200",
                appMode === "edit" 
                  ? "bg-card text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="w-3 h-3" />
              <span className="hidden sm:inline">Design</span>
            </button>

            <button
              onClick={() => setAppMode("run")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all duration-200",
                appMode === "run" 
                  ? "bg-card text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Play className="w-3 h-3" />
              <span className="hidden sm:inline">Live</span>
            </button>

            <button
              onClick={() => setAppMode("blocks")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all duration-200",
                appMode === "blocks" 
                  ? "bg-card text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Puzzle className="w-3 h-3" />
              <span className="hidden sm:inline">Blocos</span>
            </button>

            <button
              onClick={() => setAppMode("code")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all duration-200",
                appMode === "code" 
                  ? "bg-card text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Code2 className="w-3 h-3" />
              <span className="hidden sm:inline">Código</span>
            </button>
          </div>
        </div>

        {/* Right Section - Compact Actions */}
        <div className="flex items-center gap-1.5 shrink-0 flex-1 justify-end">
          {/* Sync Status - Clicável para forçar sync */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => {
                  if (syncStatus === "error" || syncStatus === "synced") {
                    syncService.forceSync()
                  }
                }}
                disabled={syncStatus === "syncing" || syncStatus === "offline"}
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-md border transition-all",
                  syncStatus === "synced" && "bg-success/10 border-success/30 hover:bg-success/20 cursor-pointer",
                  syncStatus === "syncing" && "bg-primary/10 border-primary/30 cursor-wait",
                  syncStatus === "error" && "bg-destructive/10 border-destructive/30 hover:bg-destructive/20 cursor-pointer",
                  syncStatus === "offline" && "bg-secondary/50 border-border/50 cursor-not-allowed opacity-50"
                )}
              >
                {syncStatus === "synced" && <Wifi className="w-3.5 h-3.5 text-success" />}
                {syncStatus === "syncing" && <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />}
                {syncStatus === "error" && <AlertCircle className="w-3.5 h-3.5 text-destructive" />}
                {syncStatus === "offline" && <CloudOff className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-[200px]">
              {syncStatus === "synced" && (
                <div className="space-y-1">
                  <div className="font-medium text-success">Auto-sync Ativo</div>
                  <div className="text-muted-foreground">Clique para forçar sincronização</div>
                </div>
              )}
              {syncStatus === "syncing" && "Sincronizando alterações..."}
              {syncStatus === "error" && (
                <div className="space-y-1">
                  <div className="font-medium text-destructive">Erro na sincronização</div>
                  <div className="text-muted-foreground">Clique para tentar novamente</div>
                </div>
              )}
              {syncStatus === "offline" && "Conecte ao GitHub para sincronizar"}
            </TooltipContent>
          </Tooltip>

          {/* Save Button - Icon only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className={cn("w-4 h-4", isSaving && "animate-pulse")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Salvar (Ctrl+S)
            </TooltipContent>
          </Tooltip>

          {/* Commit Button - Icon only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <GitBranch className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Commit
            </TooltipContent>
          </Tooltip>
          
          {/* Settings - Icon only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={onSettingsClick}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Configuracoes
            </TooltipContent>
          </Tooltip>

          {/* Build APK Button - Primary Action */}
          <Button 
            size="sm" 
            className="gap-1 text-[11px] h-7 px-2.5 shine" 
            onClick={onBuildClick}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Build</span>
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
