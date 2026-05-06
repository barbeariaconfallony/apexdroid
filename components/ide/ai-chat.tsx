"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, Send, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

export function AIChat() {
  const [input, setInput] = useState("")
  const [collapsed, setCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { chatMessages, addChatMessage, currentProject, aiSettings } = useIDEStore()
  const { toast } = useToast()

  // Auto-scroll para o último mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input
    }
    
    addChatMessage(userMessage)
    const userInput = input
    setInput("")
    setIsLoading(true)

    try {
      // Construir contexto do projeto
      const projectContext = currentProject 
        ? `Projeto: ${currentProject.Properties?.$Name || 'Untitled'}. Componentes: ${currentProject.Properties?.$Components?.map(c => c.$Type).join(', ') || 'Nenhum'}`
        : 'Nenhum projeto carregado'

      // Enviar para API com configuracoes do usuario
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          context: projectContext,
          settings: aiSettings
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Sem resposta do servidor')
      }

      // Processar streaming
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""
      const messageId = (Date.now() + 1).toString()

      // Adicionar mensagem vazia do assistente
      addChatMessage({
        id: messageId,
        role: "assistant",
        content: ""
      })

      // Ler stream
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('0:')) {
            const jsonStr = line.slice(2)
            try {
              const data = JSON.parse(jsonStr)
              if (data.type === 'text') {
                assistantMessage += data.value
                // Atualizar a mensagem no store em tempo real
                const state = useIDEStore.getState()
                const msgs = [...state.chatMessages]
                const lastMsg = msgs[msgs.length - 1]
                if (lastMsg && lastMsg.id === messageId) {
                  lastMsg.content = assistantMessage
                  // Criar nova entrada para atualizar o componente
                  state.chatMessages[state.chatMessages.length - 1] = { ...lastMsg }
                }
              }
            } catch (e) {
              // Ignorar erros de parse JSON
            }
          }
        }
      }

      // Salvar mensagem final
      const state = useIDEStore.getState()
      const msgs = [...state.chatMessages]
      const lastMsg = msgs[msgs.length - 1]
      if (lastMsg && lastMsg.id === messageId) {
        lastMsg.content = assistantMessage
      }

    } catch (error) {
      console.error('Chat error:', error)
      
      const errorMessage = {
        id: (Date.now() + 2).toString(),
        role: "assistant" as const,
        content: `Desculpe, ocorreu um erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
      addChatMessage(errorMessage)
      
      toast({
        title: "Erro",
        description: "Falha ao comunicar com a IA",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <aside className={cn(
      "bg-card border-r border-border flex flex-col shrink-0 transition-all duration-300",
      collapsed ? "w-12" : "w-[280px]"
    )}>
      <div 
        className="px-4 py-3 bg-card/50 border-b border-border flex items-center justify-between cursor-pointer hover:bg-card/70 transition-colors"
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
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5"
          >
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[90%] px-3 py-2 rounded-xl text-sm leading-relaxed break-words",
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground self-end rounded-br-sm" 
                    : "bg-secondary text-secondary-foreground self-start rounded-bl-sm border border-border"
                )}
              >
                {msg.content || (isLoading && msg.role === "assistant" ? "Pensando..." : "")}
              </div>
            ))}
            {isLoading && (
              <div className="self-start flex items-center gap-2 text-xs text-muted-foreground">
                <Loader className="w-3 h-3 animate-spin" />
                <span>APEX DROID está digitando...</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-black/10 border-t border-border flex gap-1.5">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
              placeholder="Ex: Adicione um botão azul..."
              className="bg-input border-border text-sm h-9"
              disabled={isLoading}
            />
            <Button 
              size="sm" 
              className="px-2.5 h-9" 
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </>
      )}
    </aside>
  )
}
