"use client"

import { useState } from "react"
import { Sparkles, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"

export function AIChat() {
  const [input, setInput] = useState("")
  const [collapsed, setCollapsed] = useState(false)
  const { chatMessages, addChatMessage, currentProject, addComponent } = useIDEStore()

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input
    }
    addChatMessage(userMessage)
    setInput("")

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: "Entendi! Vou ajudar você com isso. " + 
          (currentProject ? "Posso adicionar componentes ou modificar propriedades do seu projeto." : 
          "Primeiro, carregue um projeto para que eu possa fazer modificações.")
      }
      addChatMessage(assistantMessage)
    }, 1000)
  }

  return (
    <aside className={cn(
      "bg-card border-r border-border flex flex-col shrink-0 transition-all duration-300",
      collapsed ? "w-12" : "w-[280px]"
    )}>
      <div 
        className="px-4 py-3 bg-card/50 border-b border-border flex items-center justify-between cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_var(--success)]" />
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-wide">APEX DROID AI</span>
          )}
        </div>
        {!collapsed && <Sparkles className="w-3.5 h-3.5 text-primary" />}
      </div>

      {!collapsed && (
        <>
          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[90%] px-3 py-2 rounded-xl text-sm leading-relaxed",
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground self-end rounded-br-sm" 
                    : "bg-secondary text-secondary-foreground self-start rounded-bl-sm border border-border"
                )}
              >
                {msg.content}
              </div>
            ))}
          </div>

          <div className="p-3 bg-black/10 border-t border-border flex gap-1.5">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ex: Adicione um botão azul..."
              className="bg-input border-border text-sm h-9"
            />
            <Button size="sm" className="px-2.5 h-9" onClick={sendMessage}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </aside>
  )
}
