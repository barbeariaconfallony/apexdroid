"use client"

import { useEffect, useState, useCallback } from "react"
import { 
  Plus, Layout, GitBranch, Package, Settings, 
  Github, Blocks, X, Download, Code2, Sparkles
} from "lucide-react"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"

interface CommandPaletteProps {
  onBuildClick: () => void
  onSettingsClick: () => void
  onLoginClick: () => void
  onBlocksClick: () => void
  onBlocksEditorClick?: () => void
  onExportClick?: () => void
  onTemplatesClick?: () => void
}

const actions = [
  { id: "new_comp", name: "Adicionar Componente...", icon: Plus },
  { id: "open_screen", name: "Abrir Tela...", icon: Layout },
  { id: "templates", name: "Galeria de Templates", icon: Sparkles },
  { id: "blocks_editor", name: "Editor de Blocos", icon: Code2 },
  { id: "export", name: "Exportar Projeto", icon: Download },
  { id: "commit", name: "Commitar Mudanças", icon: GitBranch },
  { id: "build", name: "Build APK", icon: Package },
  { id: "settings", name: "Configurações IA", icon: Settings },
  { id: "login", name: "Login GitHub", icon: Github },
  { id: "blocks", name: "Ver Blocos da Tela", icon: Blocks }
]

export function CommandPalette({ 
  onBuildClick, 
  onSettingsClick, 
  onLoginClick, 
  onBlocksClick,
  onBlocksEditorClick,
  onExportClick,
  onTemplatesClick
}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { setActiveTab } = useIDEStore()

  const filteredActions = actions.filter(a => 
    a.name.toLowerCase().includes(query.toLowerCase())
  )

  const executeAction = useCallback((actionId: string) => {
    setIsOpen(false)
    setQuery("")

    switch (actionId) {
      case "new_comp":
        setActiveTab("componentes")
        break
      case "open_screen":
        setActiveTab("telas")
        break
      case "templates":
        onTemplatesClick?.()
        break
      case "blocks_editor":
        onBlocksEditorClick?.()
        break
      case "export":
        onExportClick?.()
        break
      case "build":
        onBuildClick()
        break
      case "settings":
        onSettingsClick()
        break
      case "login":
        onLoginClick()
        break
      case "blocks":
        onBlocksClick()
        break
    }
  }, [setActiveTab, onBuildClick, onSettingsClick, onLoginClick, onBlocksClick, onBlocksEditorClick, onExportClick, onTemplatesClick])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault()
        setIsOpen(prev => !prev)
        setQuery("")
        setSelectedIndex(0)
      }

      if (e.key === "Escape") {
        setIsOpen(false)
      }

      if (isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredActions.length - 1 ? prev + 1 : prev
          )
        }
        if (e.key === "ArrowUp") {
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
        }
        if (e.key === "Enter" && filteredActions[selectedIndex]) {
          executeAction(filteredActions[selectedIndex].id)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, filteredActions, selectedIndex, executeAction])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[3000] bg-black/60 flex items-start justify-center pt-[20vh]"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O que você deseja fazer?"
            className="w-full bg-transparent px-5 py-4 text-base outline-none border-b border-border"
            autoFocus
          />
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredActions.map((action, index) => (
            <div
              key={action.id}
              onClick={() => executeAction(action.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all text-sm",
                index === selectedIndex 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-secondary"
              )}
            >
              <action.icon className="w-4 h-4 opacity-70" />
              <span>{action.name}</span>
            </div>
          ))}

          {filteredActions.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nenhum comando encontrado.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
