"use client"

import { useState, useEffect } from "react"
import { 
  Package, Loader2, CheckCircle2, AlertCircle, 
  ExternalLink, Download, Clock, ChevronRight, X 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useIDEStore } from "@/lib/ide-store"
import type { BuildHistoryItem, BuildResult } from "@/lib/ide-types"

export function BuildMonitor() {
  const { buildHistory, currentBuild } = useIDEStore()
  const [isOpen, setIsOpen] = useState(false)

  if (!currentBuild && buildHistory.length === 0) return null

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-[100] transition-all duration-300",
      isOpen ? "w-80" : "w-auto"
    )}>
      {!isOpen ? (
        <Button 
          onClick={() => setIsOpen(true)}
          className={cn(
            "rounded-full shadow-2xl h-12 gap-2 pr-4",
            currentBuild?.status === "building" ? "bg-primary animate-pulse" : "bg-card border border-border text-foreground hover:bg-secondary"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center">
            {currentBuild?.status === "building" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Package className="w-4 h-4" />
            )}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">
            {currentBuild?.status === "building" ? "Compilando..." : "Builds"}
          </span>
        </Button>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="px-4 py-3 border-b bg-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">Monitor de Build</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4">
            {currentBuild && (
              <div className="mb-6 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-muted-foreground uppercase">Status Atual</span>
                  <span className="text-primary font-bold animate-pulse">
                    {currentBuild.progress}% Completo
                  </span>
                </div>
                <Progress value={currentBuild.progress} className="h-2" />
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  GitHub Actions: Compilando recursos e gerando DEX...
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Histórico Recente</h4>
              <ScrollArea className="h-[200px] -mx-1 px-1">
                <div className="space-y-2">
                  {buildHistory.map((build: BuildHistoryItem) => (
                    <div 
                      key={build.id}
                      className="p-3 bg-secondary/20 rounded-lg border border-transparent hover:border-border transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-xs font-bold truncate max-w-[150px]">{build.projectName}</div>
                          <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(build.createdAt).toLocaleString()}
                          </div>
                        </div>
                        {build.status === "completed" ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>

                      {build.status === "completed" && build.apkUrl && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 gap-1" asChild>
                            <a href={build.apkUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="w-3 h-3" />
                              Baixar APK
                            </a>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" title="Ver no GitHub">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
