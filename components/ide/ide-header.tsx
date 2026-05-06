"use client"

import { useState } from "react"
import { 
  Zap, GitBranch, Package, Settings, ChevronRight, 
  Smartphone, Save, MoreHorizontal, Undo2, Redo2,
  Play, Code2, Layers, Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
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
}

export function IDEHeader({ onBuildClick, onSettingsClick }: IDEHeaderProps) {
  const { 
    ghToken, 
    cloudUser, 
    currentProject, 
    currentScreenName,
    selectedRepo,
    appMode,
    setAppMode,
    undo,
    redo,
    history,
    historyIndex
  } = useIDEStore()

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
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 800))
    setIsSaving(false)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
        {/* Left Section - Logo + Breadcrumb */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-foreground select-none">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-primary" style={{ fill: "var(--primary)" }} />
            </div>
            <span className="hidden sm:inline">APEX DROID</span>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* Breadcrumb */}
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              {projectName}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <Smartphone className="w-3.5 h-3.5 text-primary" />
              {screenName}
            </span>
          </nav>
        </div>

        {/* Center Section - Mode Toggle + Quick Actions */}
        <div className="flex items-center gap-1">
          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5 mr-2">
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
          <div className="flex items-center bg-secondary rounded-lg p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setAppMode("edit")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    appMode === "edit" 
                      ? "bg-card text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Design
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Modo de Edicao Visual
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
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 mr-2 px-2.5 py-1.5 rounded-md bg-secondary/50">
            <span 
              className={cn(
                "status-dot",
                status.type === "success" && "status-dot-success",
                status.type === "warning" && "status-dot-warning",
                status.type === "error" && "status-dot-error",
                status.type === "muted" && "status-dot-muted"
              )}
            />
            <span className="text-xs text-muted-foreground">{status.label}</span>
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
              <DropdownMenuItem onClick={onSettingsClick}>
                <Settings className="w-4 h-4 mr-2" />
                Configuracoes IA
              </DropdownMenuItem>
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
