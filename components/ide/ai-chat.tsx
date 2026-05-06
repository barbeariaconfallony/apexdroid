"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, Send, Loader, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

// Serializa os componentes da tela para contexto da IA
function serializeComponents(comp: any, depth = 0): string {
  const indent = "  ".repeat(depth)
  let out = `${indent}- ${comp.$Type} "${comp.$Name}"`
  if (comp.Text) out += ` (Text: "${comp.Text}")`
  if (comp.BackgroundColor) out += ` (Cor: ${comp.BackgroundColor})`
  if (comp.$Components?.length) {
    out += "\n" + comp.$Components.map((c: any) => serializeComponents(c, depth + 1)).join("\n")
  }
  return out
}

// Processa e executa as acoes retornadas pela IA no projeto
function executeActions(
  actionsJson: string,
  store: ReturnType<typeof useIDEStore.getState>
): number {
  let parsed: any[]
  try {
    parsed = JSON.parse(actionsJson)
  } catch {
    return 0
  }
  if (!Array.isArray(parsed)) return 0

  let count = 0
  for (const action of parsed) {
    try {
      if (action.action === "add_component" && action.parentName && action.type) {
        // Adiciona o componente via store
        store.addComponent(action.parentName, action.type)
        // Aplica propriedades extras alem do basico se houver
        if (action.properties && Object.keys(action.properties).length > 0) {
          // O nome final pode ter sido ajustado; descobre o ultimo componente adicionado
          const proj = useIDEStore.getState().currentProject
          if (proj) {
            const findLast = (root: any, type: string): any => {
              let last: any = null
              if (root.$Type === type) last = root
              if (root.$Components) {
                for (const c of root.$Components) {
                  const found = findLast(c, type)
                  if (found) last = found
                }
              }
              return last
            }
            const added = findLast(proj.Properties, action.type)
            if (added) {
              const propsToApply: Record<string, unknown> = {}
              for (const [k, v] of Object.entries(action.properties)) {
                if (k !== "$Type") propsToApply[k] = v
              }
              store.updateComponent(added.$Name, propsToApply)
            }
          }
        }
        count++
      } else if (action.action === "update_component" && action.name && action.properties) {
        store.updateComponent(action.name, action.properties)
        count++
      } else if (action.action === "remove_component" && action.name) {
        store.removeComponent(action.name)
        count++
      }
    } catch {
      // continua para proxima acao
    }
  }
  return count
}

export function AIChat() {
  const [input, setInput] = useState("")
  const [collapsed, setCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastActionCount, setLastActionCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Map<string, string>>(new Map())

  const store = useIDEStore()
  const { chatMessages, addChatMessage, currentProject, aiSettings } = store
  const { toast } = useToast()

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
    setInput("")
    setIsLoading(true)
    setLastActionCount(0)

    // Contexto completo do projeto
    let projectContext = "Nenhum projeto carregado."
    if (currentProject) {
      const screenName = currentProject.Properties.$Name || "Screen1"
      const tree = serializeComponents(currentProject.Properties)
      projectContext = `Tela ativa: "${screenName}"\nEstrutura de componentes:\n${tree}`
    }

    const messageId = (Date.now() + 1).toString()
    // Adiciona placeholder da resposta do assistente
    addChatMessage({ id: messageId, role: "assistant", content: "" })
    messagesRef.current.set(messageId, "")

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          context: projectContext,
          settings: aiSettings
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Erro ${response.status}: ${errText}`)
      }

      if (!response.body) throw new Error("Sem corpo na resposta")

      // Leitura do stream no formato AI SDK Data Stream (toDataStreamResponse)
      // Formato: linhas "0:\"texto\"" para texto, "d:{...}" para finalizacao
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (!line.trim()) continue

          // Formato AI SDK data stream: "0:" seguido de JSON string com o delta de texto
          if (line.startsWith("0:")) {
            try {
              const delta = JSON.parse(line.slice(2)) as string
              accumulated += delta
              // Atualiza mensagem no store em tempo real
              useIDEStore.setState(state => ({
                chatMessages: state.chatMessages.map(m =>
                  m.id === messageId ? { ...m, content: accumulated } : m
                )
              }))
            } catch {
              // ignorar linhas mal-formadas
            }
          }
        }
      }

      // Procura e executa blocos ```actions no texto final
      const actionsMatch = accumulated.match(/```actions\n([\s\S]*?)\n```/)
      if (actionsMatch && currentProject) {
        const currentStore = useIDEStore.getState()
        const count = executeActions(actionsMatch[1], currentStore)
        if (count > 0) {
          setLastActionCount(count)
          toast({
            title: `${count} alteracao${count > 1 ? "s" : ""} aplicada${count > 1 ? "s" : ""}`,
            description: "O projeto foi modificado pela IA."
          })
        }
      }

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Erro desconhecido"
      useIDEStore.setState(state => ({
        chatMessages: state.chatMessages.map(m =>
          m.id === messageId
            ? { ...m, content: `Desculpe, ocorreu um erro: ${errMsg}` }
            : m
        )
      }))
      toast({
        title: "Erro na IA",
        description: errMsg,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Texto exibido na mensagem: oculta o bloco ```actions``` do usuario
  const renderContent = (content: string) =>
    content.replace(/```actions[\s\S]*?```/g, "").trim()

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
            {chatMessages.map((msg) => {
              const display = renderContent(msg.content)
              // Verifica se houve acoes nessa mensagem
              const hasActions = msg.role === "assistant" && /```actions/.test(msg.content)
              return (
                <div key={msg.id} className="flex flex-col gap-1">
                  <div
                    className={cn(
                      "max-w-[90%] px-3 py-2 rounded-xl text-sm leading-relaxed break-words whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground self-end rounded-br-sm"
                        : "bg-secondary text-secondary-foreground self-start rounded-bl-sm border border-border"
                    )}
                  >
                    {display || (isLoading && msg.role === "assistant" ? "Pensando..." : "")}
                  </div>
                  {hasActions && (
                    <div className="self-start flex items-center gap-1 text-[11px] text-success ml-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Alteracoes aplicadas no projeto</span>
                    </div>
                  )}
                </div>
              )
            })}
            {isLoading && (
              <div className="self-start flex items-center gap-2 text-xs text-muted-foreground">
                <Loader className="w-3 h-3 animate-spin" />
                <span>APEX DROID esta digitando...</span>
              </div>
            )}
          </div>

          {/* Info do provider atual */}
          <div className="px-3 py-1.5 border-t border-border/50 text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="font-medium uppercase">{aiSettings.provider}</span>
            <span>/</span>
            <span className="truncate">{aiSettings.model}</span>
          </div>

          <div className="p-3 border-t border-border flex gap-1.5">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
              placeholder="Ex: Adicione um botao azul..."
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
