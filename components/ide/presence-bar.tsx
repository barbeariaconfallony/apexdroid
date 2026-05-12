"use client"

import { useEffect } from "react"
import { useIDEStore } from "@/lib/ide-store"
import { Clock } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function PresenceBar() {
  const { connectedUsers, setConnectedUsers } = useIDEStore()

  // Simulate multiple users for demonstration
  useEffect(() => {
    const demoUsers = [
      { id: "1", name: "Bruno (Você)", avatar: "B", color: "bg-primary", lastActive: Date.now() },
      { id: "2", name: "Alice Designer", avatar: "AD", color: "bg-pink-500", lastActive: Date.now() - 5000 },
      { id: "3", name: "Carlos Dev", avatar: "CD", color: "bg-amber-500", lastActive: Date.now() - 10000 }
    ]
    setConnectedUsers(demoUsers)
  }, [setConnectedUsers])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-3 ml-4 border-l border-white/10 pl-4">
        <div className="flex items-center gap-2">
          <div className="status-dot status-dot-success" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden lg:inline">
            Sessão Ativa
          </span>
        </div>

        <div className="flex -space-x-2.5 overflow-hidden items-center">
          {connectedUsers.map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "relative inline-flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-background border border-white/10 text-[10px] font-bold text-white cursor-pointer transition-all hover:scale-110 hover:z-20 hover:-translate-y-0.5 shadow-lg",
                    user.color
                  )}
                >
                  <span className="drop-shadow-md">{user.avatar}</span>
                  {Date.now() - user.lastActive < 15000 && (
                    <span className="absolute -bottom-0.5 -right-0.5 block w-2.5 h-2.5 rounded-full bg-success ring-2 ring-background animate-pulse" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="flex flex-col gap-0.5 bg-card border-border shadow-2xl p-2 min-w-[120px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("w-2 h-2 rounded-full", user.color)} />
                  <span className="font-bold text-xs">{user.name}</span>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {user.id === "1" ? "Editando agora" : "Observando"}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                className="inline-flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-background border border-dashed border-muted-foreground/50 text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all ml-2 group"
                onClick={() => {
                  const url = `https://apexdroid.app/collab/${Math.random().toString(36).substring(7)}`
                  navigator.clipboard.writeText(url)
                  alert("Link de colaboração copiado: " + url)
                }}
              >
                <span className="text-sm font-bold group-hover:scale-125 transition-transform">+</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Convidar Colaborador
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
