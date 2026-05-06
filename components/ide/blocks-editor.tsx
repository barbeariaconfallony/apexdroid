"use client"

import { useState, useCallback } from "react"
import { 
  Blocks, X, Zap, Play, MousePointer, Clock, 
  Variable, Calculator, MessageSquare, Repeat, 
  GitBranch, Code2, Copy, ChevronRight, Plus,
  Trash2, GripVertical, Settings2, Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import { toast } from "./toast"

// Block types
interface VisualBlock {
  id: string
  type: "event" | "action" | "control" | "variable" | "math" | "text"
  category: string
  name: string
  component?: string
  params?: Record<string, string>
  children?: VisualBlock[]
  color: string
}

// Block categories with available blocks
const blockCategories = [
  {
    name: "Eventos",
    icon: Zap,
    color: "bg-amber-500",
    blocks: [
      { type: "event", name: "quando_clicado", label: "Quando clicado", component: true },
      { type: "event", name: "quando_iniciar", label: "Quando Screen iniciar", component: false },
      { type: "event", name: "quando_timer", label: "Quando Timer disparar", component: true },
      { type: "event", name: "quando_texto_mudar", label: "Quando texto mudar", component: true },
    ]
  },
  {
    name: "Controle",
    icon: GitBranch,
    color: "bg-orange-500",
    blocks: [
      { type: "control", name: "se", label: "Se <condicao> entao" },
      { type: "control", name: "se_senao", label: "Se <condicao> entao / senao" },
      { type: "control", name: "para_cada", label: "Para cada item na lista" },
      { type: "control", name: "enquanto", label: "Enquanto <condicao>" },
      { type: "control", name: "repetir", label: "Repetir N vezes" },
    ]
  },
  {
    name: "Acoes",
    icon: Play,
    color: "bg-blue-500",
    blocks: [
      { type: "action", name: "definir_texto", label: "Definir texto de", component: true },
      { type: "action", name: "definir_visivel", label: "Definir visibilidade de", component: true },
      { type: "action", name: "definir_cor", label: "Definir cor de", component: true },
      { type: "action", name: "abrir_tela", label: "Abrir outra tela" },
      { type: "action", name: "mostrar_notificacao", label: "Mostrar notificacao" },
      { type: "action", name: "reproduzir_som", label: "Reproduzir som" },
    ]
  },
  {
    name: "Variaveis",
    icon: Variable,
    color: "bg-purple-500",
    blocks: [
      { type: "variable", name: "criar_var", label: "Criar variavel" },
      { type: "variable", name: "obter_var", label: "Obter valor de" },
      { type: "variable", name: "definir_var", label: "Definir valor de" },
      { type: "variable", name: "criar_lista", label: "Criar lista vazia" },
      { type: "variable", name: "adicionar_lista", label: "Adicionar item a lista" },
    ]
  },
  {
    name: "Matematica",
    icon: Calculator,
    color: "bg-green-500",
    blocks: [
      { type: "math", name: "numero", label: "Numero" },
      { type: "math", name: "soma", label: "Soma (+)" },
      { type: "math", name: "subtracao", label: "Subtracao (-)" },
      { type: "math", name: "multiplicacao", label: "Multiplicacao (*)" },
      { type: "math", name: "divisao", label: "Divisao (/)" },
      { type: "math", name: "aleatorio", label: "Numero aleatorio" },
    ]
  },
  {
    name: "Texto",
    icon: MessageSquare,
    color: "bg-pink-500",
    blocks: [
      { type: "text", name: "texto", label: "Texto" },
      { type: "text", name: "juntar", label: "Juntar textos" },
      { type: "text", name: "tamanho", label: "Tamanho do texto" },
      { type: "text", name: "contem", label: "Texto contem" },
      { type: "text", name: "substituir", label: "Substituir no texto" },
    ]
  }
]

// Generate Java code from blocks
function generateJavaCode(blocks: VisualBlock[]): string {
  let code = `// Codigo gerado pelo APEX DROID\n`
  code += `// Arquivo: Screen1.java\n\n`
  code += `package com.example.myapp;\n\n`
  code += `import android.app.Activity;\n`
  code += `import android.os.Bundle;\n`
  code += `import android.view.View;\n`
  code += `import android.widget.*;\n\n`
  code += `public class Screen1 extends Activity {\n\n`
  
  // Generate variable declarations
  const variables: string[] = []
  blocks.forEach(block => {
    if (block.type === "variable" && block.name === "criar_var") {
      variables.push(`    private String ${block.params?.name || "variavel"};`)
    }
  })
  if (variables.length > 0) {
    code += variables.join("\n") + "\n\n"
  }
  
  // Generate onCreate
  code += `    @Override\n`
  code += `    protected void onCreate(Bundle savedInstanceState) {\n`
  code += `        super.onCreate(savedInstanceState);\n`
  code += `        setContentView(R.layout.activity_main);\n`
  code += `        \n`
  code += `        // Inicializacao de componentes\n`
  code += `        initializeComponents();\n`
  code += `    }\n\n`
  
  // Generate event handlers
  blocks.forEach(block => {
    if (block.type === "event") {
      if (block.name === "quando_clicado" && block.component) {
        code += `    // Evento: ${block.component} clicado\n`
        code += `    private void on${block.component}Click(View view) {\n`
        block.children?.forEach(child => {
          code += generateActionCode(child, "        ")
        })
        code += `    }\n\n`
      }
    }
  })
  
  code += `    private void initializeComponents() {\n`
  code += `        // Vincular componentes e eventos\n`
  code += `    }\n`
  code += `}\n`
  
  return code
}

function generateActionCode(block: VisualBlock, indent: string): string {
  let code = ""
  
  switch (block.name) {
    case "definir_texto":
      code += `${indent}${block.component}.setText("${block.params?.value || ""}");\n`
      break
    case "definir_visivel":
      code += `${indent}${block.component}.setVisibility(View.${block.params?.visible === "true" ? "VISIBLE" : "GONE"});\n`
      break
    case "mostrar_notificacao":
      code += `${indent}Toast.makeText(this, "${block.params?.message || ""}", Toast.LENGTH_SHORT).show();\n`
      break
    case "se":
      code += `${indent}if (${block.params?.condition || "true"}) {\n`
      block.children?.forEach(child => {
        code += generateActionCode(child, indent + "    ")
      })
      code += `${indent}}\n`
      break
    default:
      code += `${indent}// ${block.name}\n`
  }
  
  return code
}

// Generate Kotlin code from blocks
function generateKotlinCode(blocks: VisualBlock[]): string {
  let code = `// Codigo gerado pelo APEX DROID\n`
  code += `// Arquivo: Screen1.kt\n\n`
  code += `package com.example.myapp\n\n`
  code += `import android.os.Bundle\n`
  code += `import android.view.View\n`
  code += `import android.widget.*\n`
  code += `import androidx.appcompat.app.AppCompatActivity\n\n`
  code += `class Screen1 : AppCompatActivity() {\n\n`
  
  // Generate variable declarations
  const variables: string[] = []
  blocks.forEach(block => {
    if (block.type === "variable" && block.name === "criar_var") {
      variables.push(`    private var ${block.params?.name || "variavel"}: String = ""`)
    }
  })
  if (variables.length > 0) {
    code += variables.join("\n") + "\n\n"
  }
  
  // Generate onCreate
  code += `    override fun onCreate(savedInstanceState: Bundle?) {\n`
  code += `        super.onCreate(savedInstanceState)\n`
  code += `        setContentView(R.layout.activity_main)\n`
  code += `        \n`
  code += `        // Inicializacao de componentes\n`
  code += `        initializeComponents()\n`
  code += `    }\n\n`
  
  // Generate event handlers
  blocks.forEach(block => {
    if (block.type === "event") {
      if (block.name === "quando_clicado" && block.component) {
        code += `    // Evento: ${block.component} clicado\n`
        code += `    private fun on${block.component}Click(view: View) {\n`
        block.children?.forEach(child => {
          code += generateKotlinActionCode(child, "        ")
        })
        code += `    }\n\n`
      }
    }
  })
  
  code += `    private fun initializeComponents() {\n`
  code += `        // Vincular componentes e eventos\n`
  code += `    }\n`
  code += `}\n`
  
  return code
}

function generateKotlinActionCode(block: VisualBlock, indent: string): string {
  let code = ""
  
  switch (block.name) {
    case "definir_texto":
      code += `${indent}${block.component}.text = "${block.params?.value || ""}"\n`
      break
    case "definir_visivel":
      code += `${indent}${block.component}.visibility = View.${block.params?.visible === "true" ? "VISIBLE" : "GONE"}\n`
      break
    case "mostrar_notificacao":
      code += `${indent}Toast.makeText(this, "${block.params?.message || ""}", Toast.LENGTH_SHORT).show()\n`
      break
    case "se":
      code += `${indent}if (${block.params?.condition || "true"}) {\n`
      block.children?.forEach(child => {
        code += generateKotlinActionCode(child, indent + "    ")
      })
      code += `${indent}}\n`
      break
    default:
      code += `${indent}// ${block.name}\n`
  }
  
  return code
}

interface BlocksEditorProps {
  isOpen: boolean
  onClose: () => void
}

export function BlocksEditor({ isOpen, onClose }: BlocksEditorProps) {
  const { currentProject, currentScreenName } = useIDEStore()
  const [activeBlocks, setActiveBlocks] = useState<VisualBlock[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Eventos"])
  const [selectedBlock, setSelectedBlock] = useState<VisualBlock | null>(null)
  const [codeView, setCodeView] = useState<"blocks" | "java" | "kotlin">("blocks")
  const [draggedBlock, setDraggedBlock] = useState<{ type: string; name: string; label: string } | null>(null)
  
  const components = currentProject?.Properties.$Components?.map(c => c.$Name) || []
  
  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    )
  }
  
  const addBlock = useCallback((blockDef: { type: string; name: string; label: string; component?: boolean }) => {
    const newBlock: VisualBlock = {
      id: `block-${Date.now()}`,
      type: blockDef.type as VisualBlock["type"],
      category: blockDef.type,
      name: blockDef.name,
      component: blockDef.component ? components[0] : undefined,
      params: {},
      children: [],
      color: blockCategories.find(c => c.blocks.some(b => b.name === blockDef.name))?.color || "bg-gray-500"
    }
    setActiveBlocks(prev => [...prev, newBlock])
    toast.success(`Bloco "${blockDef.label}" adicionado`)
  }, [components])
  
  const removeBlock = (blockId: string) => {
    setActiveBlocks(prev => prev.filter(b => b.id !== blockId))
    if (selectedBlock?.id === blockId) setSelectedBlock(null)
  }
  
  const updateBlockComponent = (blockId: string, component: string) => {
    setActiveBlocks(prev => prev.map(b => 
      b.id === blockId ? { ...b, component } : b
    ))
  }
  
  const copyCode = (language: "java" | "kotlin") => {
    const code = language === "java" 
      ? generateJavaCode(activeBlocks)
      : generateKotlinCode(activeBlocks)
    navigator.clipboard.writeText(code)
    toast.success(`Codigo ${language.toUpperCase()} copiado`)
  }
  
  if (!isOpen) return null
  
  return (
    <div 
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-xl w-full max-w-5xl h-[80vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Blocks className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold">Editor de Blocos</h2>
            <span className="text-xs text-muted-foreground">
              {currentScreenName || "Screen1"}
            </span>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="bg-secondary rounded-lg p-0.5 flex gap-0.5">
              <button
                onClick={() => setCodeView("blocks")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  codeView === "blocks" ? "bg-card shadow-sm" : "text-muted-foreground"
                )}
              >
                <Blocks className="w-3.5 h-3.5 inline mr-1.5" />
                Blocos
              </button>
              <button
                onClick={() => setCodeView("java")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  codeView === "java" ? "bg-card shadow-sm" : "text-muted-foreground"
                )}
              >
                <Code2 className="w-3.5 h-3.5 inline mr-1.5" />
                Java
              </button>
              <button
                onClick={() => setCodeView("kotlin")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  codeView === "kotlin" ? "bg-card shadow-sm" : "text-muted-foreground"
                )}
              >
                <Code2 className="w-3.5 h-3.5 inline mr-1.5" />
                Kotlin
              </button>
            </div>
            
            <X 
              className="w-5 h-5 cursor-pointer text-muted-foreground hover:text-foreground ml-4" 
              onClick={onClose}
            />
          </div>
        </div>
        
        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {codeView === "blocks" ? (
            <>
              {/* Block Palette */}
              <div className="w-64 border-r border-border bg-secondary/30">
                <ScrollArea className="h-full">
                  <div className="p-3">
                    {blockCategories.map((category) => (
                      <div key={category.name} className="mb-2">
                        <button
                          onClick={() => toggleCategory(category.name)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary transition-colors"
                        >
                          <ChevronRight className={cn(
                            "w-3.5 h-3.5 transition-transform",
                            expandedCategories.includes(category.name) && "rotate-90"
                          )} />
                          <div className={cn("w-3 h-3 rounded-sm", category.color)} />
                          <span className="text-xs font-medium">{category.name}</span>
                        </button>
                        
                        {expandedCategories.includes(category.name) && (
                          <div className="ml-5 mt-1 space-y-1">
                            {category.blocks.map((block) => (
                              <div
                                key={block.name}
                                draggable
                                onDragStart={() => setDraggedBlock(block)}
                                onDragEnd={() => setDraggedBlock(null)}
                                onClick={() => addBlock(block)}
                                className={cn(
                                  "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing",
                                  "border-l-4 bg-secondary/50 hover:bg-secondary transition-colors",
                                  category.color.replace("bg-", "border-")
                                )}
                              >
                                <GripVertical className="w-3 h-3 text-muted-foreground/50" />
                                <span className="text-[11px]">{block.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Block Canvas */}
              <div 
                className="flex-1 bg-background p-4 overflow-auto"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedBlock) {
                    addBlock(draggedBlock)
                  }
                }}
              >
                {activeBlocks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Blocks className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Arraste blocos da paleta para comecar</p>
                      <p className="text-xs mt-1 opacity-70">ou clique em um bloco para adicionar</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeBlocks.map((block) => (
                      <div 
                        key={block.id}
                        onClick={() => setSelectedBlock(block)}
                        className={cn(
                          "relative p-3 rounded-lg border-l-4 transition-all cursor-pointer",
                          "bg-card hover:shadow-md",
                          block.color.replace("bg-", "border-"),
                          selectedBlock?.id === block.id && "ring-2 ring-primary"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
                            <span className="text-sm font-medium">
                              {blockCategories
                                .flatMap(c => c.blocks)
                                .find(b => b.name === block.name)?.label || block.name}
                            </span>
                            
                            {block.component !== undefined && components.length > 0 && (
                              <select
                                value={block.component}
                                onChange={(e) => updateBlockComponent(block.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs bg-secondary border border-border rounded px-2 py-1"
                              >
                                {components.map(comp => (
                                  <option key={comp} value={comp}>{comp}</option>
                                ))}
                              </select>
                            )}
                          </div>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); removeBlock(block.id) }}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Nested blocks area */}
                        {(block.type === "event" || block.type === "control") && (
                          <div className="mt-2 ml-6 pl-3 border-l-2 border-dashed border-muted-foreground/30 min-h-[40px]">
                            {block.children && block.children.length > 0 ? (
                              block.children.map(child => (
                                <div key={child.id} className="text-xs text-muted-foreground py-1">
                                  {child.name}
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground/50 py-2">
                                Solte acoes aqui
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Properties Panel */}
              {selectedBlock && (
                <div className="w-56 border-l border-border bg-secondary/30 p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium">Propriedades</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase">Tipo</label>
                      <p className="text-xs font-medium">{selectedBlock.type}</p>
                    </div>
                    
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase">Nome</label>
                      <p className="text-xs font-medium">{selectedBlock.name}</p>
                    </div>
                    
                    {selectedBlock.component && (
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase">Componente</label>
                        <p className="text-xs font-medium">{selectedBlock.component}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Code View */
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30">
                <span className="text-xs font-medium">
                  {codeView === "java" ? "Screen1.java" : "Screen1.kt"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => copyCode(codeView)}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <pre className="p-4 text-xs font-mono text-muted-foreground">
                  {codeView === "java" 
                    ? generateJavaCode(activeBlocks)
                    : generateKotlinCode(activeBlocks)
                  }
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0">
          <div className="text-xs text-muted-foreground">
            {activeBlocks.length} bloco{activeBlocks.length !== 1 ? "s" : ""} adicionado{activeBlocks.length !== 1 ? "s" : ""}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
            <Button size="sm" className="gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Visualizar Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
