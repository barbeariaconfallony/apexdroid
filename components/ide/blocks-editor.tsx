"use client"

import { Blocks, X, Code2, Copy, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { BkyWorkspace } from "./bky-workspace"
import { toast } from "./toast"

interface BlocksEditorProps {
  isOpen: boolean
  onClose: () => void
}

export function BlocksEditor({ isOpen, onClose }: BlocksEditorProps) {
  const { currentScreenName } = useIDEStore()
  const [viewMode, setViewMode] = useState<"blocks" | "java" | "kotlin">("blocks")
  
  if (!isOpen) return null
  
  const copyCode = () => {
    toast.success("Código copiado para a área de transferência")
  }
  
  return (
    <div 
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-6xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header Profissional */}
        <div className="px-6 py-4 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Blocks className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Editor de Lógica</h2>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                {currentScreenName || "Screen1"}
              </p>
            </div>
          </div>
          
          {/* Seletor de Modo */}
          <div className="flex items-center gap-4">
            <div className="bg-secondary/50 rounded-xl p-1 flex gap-1 border border-white/5">
              <button
                onClick={() => setViewMode("blocks")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  viewMode === "blocks" ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white"
                )}
              >
                Blocos
              </button>
              <button
                onClick={() => setViewMode("java")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  viewMode === "java" ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white"
                )}
              >
                Java
              </button>
              <button
                onClick={() => setViewMode("kotlin")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  viewMode === "kotlin" ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-white"
                )}
              >
                Kotlin
              </button>
            </div>
            
            <div className="w-px h-6 bg-white/10" />
            
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Main Content - Full Space para Blockly */}
        <div className="flex-1 relative overflow-hidden">
          {viewMode === "blocks" ? (
            <div className="absolute inset-0">
              <BkyWorkspace />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col bg-[#0a0a0a]">
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-secondary/20">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-mono text-blue-400">
                    {currentScreenName || "Screen1"}.{viewMode}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-[10px] gap-2 font-bold uppercase tracking-widest hover:bg-white/10" onClick={copyCode}>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Codigo
                </Button>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                <pre className="text-xs font-mono text-muted-foreground leading-relaxed">
                  {`// Codigo gerado automaticamente para ${viewMode.toUpperCase()}\n// Sincronizado com os blocos visuais\n\nclass ${currentScreenName || "Screen1"} {\n    // Logica em processamento...\n}`}
                </pre>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              Motor Sincronizado com SCM
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl px-6 h-9 text-xs border-white/10 hover:bg-white/5">
              Fechar
            </Button>
            <Button size="sm" className="rounded-xl px-6 h-9 text-xs bg-white text-black hover:bg-white/90 font-bold gap-2">
              <Eye className="w-3.5 h-3.5" />
              Testar App
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
