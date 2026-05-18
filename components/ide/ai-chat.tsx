"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, Send, Loader, CheckCircle2, Circle, AlertCircle, ClipboardList } from "lucide-react"
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
): { count: number; errors: string[] } {
  let parsed: any[]
  const errors: string[] = []
  
  try {
    // Limpa possiveis caracteres problematicos antes de parsear
    const cleaned = actionsJson.trim()
    parsed = JSON.parse(cleaned)
  } catch (e) {
    console.error('[APEX AI] Erro ao parsear actions JSON:', e, actionsJson)
    return { count: 0, errors: [`Erro de parse JSON: ${e}`] }
  }
  if (!Array.isArray(parsed)) return { count: 0, errors: ['Actions nao e um array'] }

  let count = 0
  for (const action of parsed) {
    try {
      console.log('[APEX AI] Executando acao:', action)

      switch (action.action) {
        case "clear_screen": {
          // Limpa todos os componentes da tela atual
          const proj = useIDEStore.getState().currentProject
          if (proj && proj.Properties.$Components) {
            proj.Properties.$Components = []
            useIDEStore.setState({ 
              currentProject: JSON.parse(JSON.stringify(proj)),
              selectedComponent: null 
            })
            count++
          }
          break
        }
        
        case "create_screen": {
          // Cria uma nova tela
          if (action.name) {
            store.createScreen(action.name)
            count++
          } else {
            errors.push('create_screen: nome da tela nao especificado')
          }
          break
        }
        
        case "switch_screen": {
          // Muda para outra tela
          if (action.name) {
            store.switchScreen(action.name)
            count++
          } else {
            errors.push('switch_screen: nome da tela nao especificado')
          }
          break
        }
        
        case "set_screen_design": {
          // Define toda a estrutura visual de uma tela
          const design = action.properties?.design
          const screenName = action.screenName || action.properties?.design?.$Name
          
          if (design && screenName) {
            // Encontra o arquivo da tela
            const screenFiles = useIDEStore.getState().screenFiles
            const screenFile = screenFiles.find(sf => sf.name === screenName)
            
            if (screenFile) {
              // Atualiza o conteudo SCM da tela
              const newContent = JSON.stringify(design, null, 2)
              store.updateScreenFileContent(screenFile.name, newContent)
              
              // Se for a tela atual, atualiza o projeto
              if (useIDEStore.getState().currentScreenName === screenName) {
                useIDEStore.setState({
                  currentProject: { ...useIDEStore.getState().currentProject!, Properties: design }
                })
              }
              count++
            } else {
              // Cria a tela se nao existir
              store.createScreen(screenName)
              setTimeout(() => {
                store.updateScreenFileContent(screenName, JSON.stringify(design, null, 2))
                if (useIDEStore.getState().currentScreenName === screenName) {
                  useIDEStore.setState({
                    currentProject: { ...useIDEStore.getState().currentProject!, Properties: design }
                  })
                }
              }, 100)
              count++
            }
          } else {
            errors.push('set_screen_design: design ou screenName nao especificado')
          }
          break
        }
        
        case "set_screen_logic": {
          // Define a logica de blocos (BKY) de uma tela
          const bkyContent = action.properties?.bkyContent
          const screenName = action.screenName
          
          if (bkyContent && screenName) {
            const screenFiles = useIDEStore.getState().screenFiles
            const screenFile = screenFiles.find(sf => sf.name === screenName)
            
            if (screenFile) {
              store.updateScreenBky(screenFile.name, bkyContent)
              count++
            } else {
              errors.push(`set_screen_logic: tela "${screenName}" nao encontrada`)
            }
          } else {
            errors.push('set_screen_logic: bkyContent ou screenName nao especificado')
          }
          break
        }
        
        case "add_component": {
          if (action.parentName && action.type) {
            const newName = store.addComponent(action.parentName, action.type, action.properties || {})
            console.log('[APEX AI] Componente adicionado:', newName)
            count++
          } else {
            errors.push('add_component: parentName ou type nao especificado')
          }
          break
        }
        
        case "update_component": {
          if (action.name && action.properties) {
            store.updateComponent(action.name, action.properties)
            count++
          } else {
            errors.push('update_component: name ou properties nao especificado')
          }
          break
        }
        
        case "remove_component": {
          if (action.name) {
            store.removeComponent(action.name)
            count++
          } else {
            errors.push('remove_component: name nao especificado')
          }
          break
        }
        
        case "select_component": {
          if (action.name) {
            // Busca o componente pelo nome e seleciona
            const findComponent = (comp: any, name: string): any => {
              if (comp.$Name === name) return comp
              if (comp.$Components) {
                for (const child of comp.$Components) {
                  const found = findComponent(child, name)
                  if (found) return found
                }
              }
              return null
            }
            const proj = useIDEStore.getState().currentProject
            if (proj) {
              const comp = findComponent(proj.Properties, action.name)
              if (comp) {
                store.setSelectedComponent(comp)
                count++
              } else {
                errors.push(`select_component: componente "${action.name}" nao encontrado`)
              }
            }
          }
          break
        }
        
        case "update_partial": {
          // Atualiza apenas um trecho especifico
          if (action.target && action.path && action.value !== undefined) {
            const proj = useIDEStore.getState().currentProject
            if (proj) {
              // Encontra o componente
              const findAndUpdate = (comp: any, target: string, path: string, value: any): boolean => {
                if (comp.$Name === target) {
                  // Navega pelo path (ex: "properties.Text")
                  const parts = path.split('.')
                  let obj = comp
                  for (let i = 0; i < parts.length - 1; i++) {
                    if (!obj[parts[i]]) obj[parts[i]] = {}
                    obj = obj[parts[i]]
                  }
                  obj[parts[parts.length - 1]] = value
                  return true
                }
                if (comp.$Components) {
                  for (const child of comp.$Components) {
                    if (findAndUpdate(child, target, path, value)) return true
                  }
                }
                return false
              }
              
              if (findAndUpdate(proj.Properties, action.target, action.path, action.value)) {
                useIDEStore.setState({ 
                  currentProject: JSON.parse(JSON.stringify(proj)) 
                })
                count++
              } else {
                errors.push(`update_partial: componente "${action.target}" nao encontrado`)
              }
            }
          }
          break
        }
        
        default:
          errors.push(`Acao desconhecida: ${action.action}`)
      }
    } catch (e) {
      console.error('[APEX AI] Erro ao executar acao:', action, e)
      errors.push(`Erro ao executar ${action.action}: ${e}`)
    }
  }
  return { count, errors }
}

// ─── Tipos e parser de tasks ─────────────────────────────────────────────────

type TaskStatus = "pending" | "running" | "done" | "error"

interface ParsedTask {
  index: number
  label: string
  status: TaskStatus
}

function parseTasks(content: string): ParsedTask[] | null {
  // Verifica se ha um plano de execucao
  if (!/\*\*PLANO DE EXECUCAO\*\*/i.test(content)) return null

  // Extrai todas as declaracoes de task do plano (Task 1: ..., Task 2: ..., etc)
  const planSection = content.match(/\*\*PLANO DE EXECUCAO\*\*([\s\S]*?)(?:\*\*Iniciando|$)/i)
  if (!planSection) return null

  const taskDeclarations = [...planSection[1].matchAll(/Task\s*(\d+)[:\s]+(.+)/gi)]
  if (taskDeclarations.length === 0) return null

  return taskDeclarations.map((match) => {
    const index = parseInt(match[1])
    const label = match[2].trim()

    // Verifica se a task foi concluida (aparece "Task N concluida" no texto)
    const donePattern = new RegExp(`Task\\s*${index}[^\\n]*conclu[ií]d`, "i")
    // Verifica se a task esta em andamento ("Iniciando Task N")
    const runningPattern = new RegExp(`Iniciando Task\\s*${index}`, "i")
    // Verifica se e a ultima task e tem "TODAS AS TASKS CONCLUIDAS"
    const allDone = /TODAS AS TASKS CONCLU[IÍ]DAS/i.test(content)

    let status: TaskStatus = "pending"
    if (allDone || donePattern.test(content)) {
      status = "done"
    } else if (runningPattern.test(content)) {
      // Task esta rodando se foi iniciada mas ainda nao concluida
      status = "running"
    }

    return { index, label, status }
  })
}

// ─── Card de Tasks ────────────────────────────────────────────────────────────

function TasksCard({ tasks, allDone }: { tasks: ParsedTask[]; allDone: boolean }) {
  return (
    <div className="self-start w-full max-w-[90%] mt-1 mb-0.5 rounded-xl border border-border bg-secondary/50 overflow-hidden">
      {/* Cabecalho */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-secondary/80">
        <ClipboardList className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
          Plano de Execucao
        </span>
        {allDone && (
          <span className="ml-auto text-[10px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Concluido
          </span>
        )}
      </div>
      {/* Lista de tasks */}
      <div className="px-3 py-2 flex flex-col gap-1.5">
        {tasks.map((task) => (
          <div key={task.index} className="flex items-start gap-2">
            {/* Bolinha de status */}
            <span className="mt-px shrink-0">
              {task.status === "done" && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              {task.status === "running" && (
                <Loader className="w-3.5 h-3.5 text-primary animate-spin" />
              )}
              {task.status === "pending" && (
                <Circle className="w-3.5 h-3.5 text-muted-foreground/50" />
              )}
              {task.status === "error" && (
                <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              )}
            </span>
            {/* Numero + label */}
            <span
              className={cn(
                "text-[11px] leading-relaxed",
                task.status === "done" && "text-foreground/60 line-through",
                task.status === "running" && "text-foreground font-medium",
                task.status === "pending" && "text-foreground/50",
                task.status === "error" && "text-destructive"
              )}
            >
              <span className="text-muted-foreground mr-1 not-italic">
                {task.index}.
              </span>
              {task.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AIChat() {
  const [input, setInput] = useState("")
  const [collapsed, setCollapsed] = useState(false)
  const [lastActionCount, setLastActionCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Map<string, string>>(new Map())

  const store = useIDEStore()
  const { 
    chatMessages, addChatMessage, currentProject, aiSettings, selectedComponent,
    screenFiles, currentScreenName
  } = store
  const { toast } = useToast()

  // Obter BKY atual da tela
  const getCurrentBky = () => {
    const currentScreen = screenFiles.find(sf => sf.name === currentScreenName)
    return currentScreen?.bkyContent || ''
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const sendMessage = async () => {
    if (!input.trim() || store.isThinking) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input
    }

    addChatMessage(userMessage)
    setInput("")
    store.setIsThinking(true)
    setLastActionCount(0)

    // Contexto completo do projeto
    let projectContext = "Nenhum projeto carregado."
    if (currentProject) {
      const screenName = currentProject.Properties.$Name || "Screen1"
      const tree = serializeComponents(currentProject.Properties)
      projectContext = `Tela ativa: "${screenName}"\n`
      if (selectedComponent) {
        projectContext += `Componente selecionado atualmente: "${selectedComponent.$Name}" (${selectedComponent.$Type})\n`
      }
      projectContext += `Estrutura de componentes:\n${tree}`
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
          settings: aiSettings,
          screenFiles: screenFiles.map(sf => ({ name: sf.name })),
          currentBky: getCurrentBky()
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Erro ${response.status}: ${errText}`)
      }

      if (!response.body) throw new Error("Sem corpo na resposta")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        
        // Atualiza mensagem no store em tempo real
        useIDEStore.setState(state => ({
          chatMessages: state.chatMessages.map(m =>
            m.id === messageId ? { ...m, content: accumulated } : m
          )
        }))
      }

      // Procura e executa blocos ```actions no texto final (regex flexivel)
      const actionsMatch = accumulated.match(/```actions\s*\n([\s\S]*?)\n\s*```/)
      console.log('[APEX AI] Resposta completa:', accumulated.substring(0, 200))
      console.log('[APEX AI] Actions encontradas:', !!actionsMatch)
      if (actionsMatch && currentProject) {
        const currentStore = useIDEStore.getState()
        const { count, errors } = executeActions(actionsMatch[1], currentStore)
        if (count > 0) {
          setLastActionCount(count)
          
          // Mensagem de sucesso com ou sem erros
          if (errors.length > 0) {
            toast({
              title: `${count} alteracao${count > 1 ? "s" : ""} aplicada${count > 1 ? "s" : ""} (com avisos)`,
              description: errors.slice(0, 2).join('; '),
              variant: "default"
            })
          } else {
            toast({
              title: `${count} alteracao${count > 1 ? "s" : ""} aplicada${count > 1 ? "s" : ""}`,
              description: "O projeto foi modificado pela IA."
            })
          }
          
          // Efeito visual de confirmação (flash no preview)
          const previewEl = document.getElementById('phone-screen-content')
          if (previewEl) {
            previewEl.classList.add('animate-flash')
            setTimeout(() => previewEl.classList.remove('animate-flash'), 1000)
          }
        } else if (errors.length > 0) {
          toast({
            title: "Erros ao aplicar alteracoes",
            description: errors.slice(0, 2).join('; '),
            variant: "destructive"
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
      store.setIsThinking(false)
    }
  }

  // Texto exibido na mensagem: oculta blocos técnicos e de pensamento
  const renderContent = (content: string) =>
    content
      .replace(/<thought>[\s\S]*?<\/thought>/g, "")  // Remove blocos de pensamento
      .replace(/```actions[\s\S]*?```/g, "")          // Remove blocos de acao
      // Remove cabecalho do plano e marcadores de task (ficam no card)
      .replace(/\*\*PLANO DE EXECUCAO\*\*/gi, "")
      .replace(/^Task\s*\d+[:\s]+.+$/gm, "")
      .replace(/\*\*Iniciando Task\s*\d+\.\.\.\*\*/gi, "")
      .replace(/\*\*Task\s*\d+[^*]*\*\*/gi, "")
      .replace(/\*\*TODAS AS TASKS CONCLU[IÍ]DAS!?\*\*/gi, "")
      .replace(/\n{3,}/g, "\n\n")   // Colapsa multiplas linhas em branco
      .trim()

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
              const hasActions = msg.role === "assistant" && /```actions/.test(msg.content)
              const isAssistant = msg.role === "assistant"

              // Parseia tasks para mensagens do assistente
              const tasks = isAssistant ? parseTasks(msg.content) : null
              const allTasksDone = isAssistant && /TODAS AS TASKS CONCLU[IÍ]DAS/i.test(msg.content)

              return (
                <div key={msg.id} className="flex flex-col gap-1">
                  {/* Card de tasks (aparece acima do balao de texto) */}
                  {tasks && tasks.length > 0 && (
                    <TasksCard tasks={tasks} allDone={allTasksDone} />
                  )}

                  {/* Balao de mensagem (omite se so restou texto vazio apos remover marcadores) */}
                  {(display || (!tasks && isAssistant)) && (
                    <div
                      className={cn(
                        "max-w-[90%] px-3 py-2 rounded-xl text-[12px] leading-relaxed break-words whitespace-pre-wrap",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground self-end rounded-br-sm"
                          : "bg-secondary text-secondary-foreground self-start rounded-bl-sm border border-border"
                      )}
                    >
                      {display || (store.isThinking && isAssistant ? "Pensando..." : "")}
                    </div>
                  )}

                  {/* Badge de alteracoes aplicadas */}
                  {hasActions && (
                    <div className="self-start flex items-center gap-1 text-[11px] text-emerald-400 ml-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Alteracoes aplicadas no projeto</span>
                    </div>
                  )}
                </div>
              )
            })}
            {store.isThinking && (
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
              onKeyDown={(e) => e.key === "Enter" && !store.isThinking && sendMessage()}
              placeholder="Ex: Adicione um botao azul..."
              className="bg-input border-border text-sm h-9"
              disabled={store.isThinking}
            />
            <Button
              size="sm"
              className="px-2.5 h-9"
              onClick={sendMessage}
              disabled={store.isThinking || !input.trim()}
            >
              {store.isThinking ? (
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
