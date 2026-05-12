"use client"

import { Blocks, X, Zap } from "lucide-react"
import { useIDEStore } from "@/lib/ide-store"

interface BlocksModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BlocksModal({ isOpen, onClose }: BlocksModalProps) {
  const { blocks } = useIDEStore()

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-xl w-full max-w-xl shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Blocks className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold">Visualizador de Blocos</h2>
          </div>
          <X 
            className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground" 
            onClick={onClose}
          />
        </div>

        {/* Body */}
        <div className="p-5 max-h-[500px] overflow-y-auto">
          {blocks.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">
              Nenhum bloco lógico encontrado nesta tela.
            </p>
          ) : (
            <div className="space-y-3">
              {blocks.map((block, i) => (
                <div 
                  key={i}
                  className="bg-secondary border-l-[6px] border-amber-500 p-3 rounded"
                >
                  <div className="font-bold text-sm flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    <span className="text-primary">{block.component}</span>
                    .{block.eventName}
                  </div>
                  <div className="text-muted-foreground text-xs mt-1">
                    {block.summary}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
