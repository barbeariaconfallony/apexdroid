"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Editor, { OnMount, OnChange } from "@monaco-editor/react"
import { 
  Save, RotateCcw, Copy, Download, Upload, 
  Maximize2, Minimize2, Search, Replace,
  Code2, FileJson, Loader2, Check, AlertCircle,
  Undo2, Redo2, WrapText, Settings2, Scissors,
  ClipboardPaste, Sparkles, X, Send
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIDEStore } from "@/lib/ide-store"
import { useProjectManager } from "@/lib/hooks/use-project-manager"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface CodeEditorProps {
  className?: string
}

export function CodeEditor({ className }: CodeEditorProps) {
  const { 
    currentProject, 
    currentScreenName,
    screens,
    ghToken, 
    selectedRepo,
    aiSettings,
    setCurrentProject
  } = useIDEStore()
  
  const { saveCurrentScreen } = useProjectManager()

  const editorRef = useRef<any>(null)
  const [activeTab, setActiveTab] = useState<"frontend" | "backend">("frontend")
  const [scmCode, setScmCode] = useState("")
  const [bkyCode, setBkyCode] = useState("")
  const [code, setCode] = useState("")
  const [originalCode, setOriginalCode] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wordWrap, setWordWrap] = useState<"on" | "off">("off")
  const [minimap, setMinimap] = useState(true)
  const [fontSize, setFontSize] = useState(13)
  
  // AI Modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  
  // Error tracking state
  const [jsonErrors, setJsonErrors] = useState<Array<{
    line: number
    column: number
    message: string
  }>>([])
  const [isValidJson, setIsValidJson] = useState(true)
  const monacoRef = useRef<any>(null)

  // Função para validar JSON e extrair erros com posição
  const validateJson = useCallback((jsonString: string) => {
    try {
      JSON.parse(jsonString)
      setJsonErrors([])
      setIsValidJson(true)
      return true
    } catch (error) {
      if (error instanceof SyntaxError) {
        // Tentar extrair posição do erro
        const match = error.message.match(/position (\d+)/)
        let line = 1
        let column = 1
        
        if (match) {
          const position = parseInt(match[1], 10)
          // Calcular linha e coluna a partir da posição
          const lines = jsonString.substring(0, position).split('\n')
          line = lines.length
          column = lines[lines.length - 1].length + 1
        }
        
        // Tentar extrair mais detalhes do erro
        let message = error.message
        if (message.includes("Unexpected token")) {
          const tokenMatch = message.match(/Unexpected token (.+)/)
          if (tokenMatch) {
            message = `Token inesperado: ${tokenMatch[1]}`
          }
        } else if (message.includes("Unexpected end")) {
          message = "Fim inesperado do JSON - verifique se fechou todas as chaves e colchetes"
        }
        
        setJsonErrors([{ line, column, message }])
        setIsValidJson(false)
        
        // Adicionar marcadores de erro no Monaco
        if (monacoRef.current && editorRef.current) {
          const model = editorRef.current.getModel()
          if (model) {
            monacoRef.current.editor.setModelMarkers(model, 'json-validator', [{
              severity: monacoRef.current.MarkerSeverity.Error,
              message,
              startLineNumber: line,
              startColumn: column,
              endLineNumber: line,
              endColumn: column + 1
            }])
          }
        }
        
        return false
      }
      return false
    }
  }, [])

  const { currentBkyContent, setCurrentBkyContent } = useIDEStore()

  // Gerar o código SCM e BKY do projeto atual
  useEffect(() => {
    if (currentProject) {
      const jsonContent = JSON.stringify(currentProject, null, 2)
      setScmCode(jsonContent)
      
      const bkyContent = currentBkyContent || ""
      setBkyCode(bkyContent)

      const activeCode = activeTab === "frontend" ? jsonContent : bkyContent
      setCode(activeCode)
      setOriginalCode(activeCode)
      setHasChanges(false)
      setJsonErrors([])
      setIsValidJson(activeTab === "frontend" ? true : true) // XML nao validado por enquanto
    }
  }, [currentProject, currentBkyContent, activeTab])

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Configurar tema customizado
    monaco.editor.defineTheme("apex-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "string.key.json", foreground: "7dd3fc" },
        { token: "string.value.json", foreground: "86efac" },
        { token: "number", foreground: "fbbf24" },
        { token: "keyword", foreground: "c084fc" },
      ],
      colors: {
        "editor.background": "#0a0a0a",
        "editor.foreground": "#e5e5e5",
        "editor.lineHighlightBackground": "#1a1a1a",
        "editor.selectionBackground": "#3b82f640",
        "editorCursor.foreground": "#3b82f6",
        "editorLineNumber.foreground": "#525252",
        "editorLineNumber.activeForeground": "#a3a3a3",
        "editor.inactiveSelectionBackground": "#3b82f620",
      }
    })

    monaco.editor.setTheme("apex-dark")

    // Atalhos de teclado
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave()
    })

    // Auto-format JSON
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      formatCode()
    })
  }

  const handleEditorChange: OnChange = (value) => {
    if (value !== undefined) {
      setCode(value)
      setHasChanges(value !== originalCode)
      // Validar JSON em tempo real (com debounce implícito do Monaco)
      validateJson(value)
    }
  }

  // Auto-sync code changes to the store (which triggers GitHub sync in Sidebar)
  useEffect(() => {
    if (!hasChanges || !isValidJson) return

    const timeout = setTimeout(() => {
      try {
        const parsedJson = JSON.parse(code)
        setCurrentProject(parsedJson)
        
        // Atualizar screens na store para consistencia
        if (currentScreenName && screens[currentScreenName]) {
          const newScreens = { ...screens }
          newScreens[currentScreenName] = {
            ...newScreens[currentScreenName],
            data: parsedJson
          }
          useIDEStore.setState({ screens: newScreens })
        }
      } catch (e) {
        // Silently fail if JSON is partially invalid during typing
      }
    }, 2000)

    return () => clearTimeout(timeout)
  }, [code, hasChanges, isValidJson, setCurrentProject, currentScreenName, screens])

  const formatCode = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run()
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (!ghToken || !selectedRepo || !hasChanges) {
      if (!ghToken || !selectedRepo) {
        toast.error("Conecte ao GitHub para salvar")
        return
      }
      return
    }

    if (activeTab === "frontend") {
      // Bloquear salvamento se houver erros no JSON
      if (!isValidJson || jsonErrors.length > 0) {
        toast.error("Corrija os erros no codigo antes de salvar!", {
          description: jsonErrors[0]?.message || "JSON invalido"
        })
        return
      }
    }

    setIsSaving(true)

    try {
      if (activeTab === "frontend") {
        let parsedJson
        try {
          parsedJson = JSON.parse(code)
        } catch {
          toast.error("JSON invalido! Corrija os erros antes de salvar.")
          setIsSaving(false)
          return
        }
        setCurrentProject(parsedJson)
      } else {
        // Salvar Backend (BKY)
        setCurrentBkyContent(code)
      }
      
      // Forcar sync com GitHub
      await saveCurrentScreen()

      setOriginalCode(code)
      setHasChanges(false)
      toast.success(`${activeTab === "frontend" ? "Frontend" : "Backend"} salvo com sucesso!`)
    } catch (error) {
      console.error("[v0] Erro ao salvar:", error)
      toast.error("Erro ao salvar")
    } finally {
      setIsSaving(false)
    }
  }, [ghToken, selectedRepo, code, hasChanges, currentScreenName, screens, setCurrentProject, setCurrentBkyContent, isValidJson, jsonErrors, activeTab, saveCurrentScreen])

  const handleReset = useCallback(() => {
    setCode(originalCode)
    setHasChanges(false)
    toast.info("Codigo restaurado")
  }, [originalCode])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    toast.success("Codigo copiado!")
  }, [code])

  const handleCut = useCallback(() => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection()
      const selectedText = editorRef.current.getModel()?.getValueInRange(selection)
      if (selectedText) {
        navigator.clipboard.writeText(selectedText)
        editorRef.current.executeEdits("cut", [{
          range: selection,
          text: ""
        }])
        toast.success("Texto cortado!")
      }
    }
  }, [])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (editorRef.current && text) {
        editorRef.current.trigger("keyboard", "type", { text })
        toast.success("Texto colado!")
      }
    } catch {
      toast.error("Nao foi possivel acessar a area de transferencia")
    }
  }, [])

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentScreenName || "screen"}.scm`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Arquivo baixado!")
  }, [code, currentScreenName])

  const handleUndo = useCallback(() => {
    editorRef.current?.trigger("keyboard", "undo", null)
  }, [])

  const handleRedo = useCallback(() => {
    editorRef.current?.trigger("keyboard", "redo", null)
  }, [])

  // AI Code Modification
  const handleAIModify = useCallback(async () => {
    if (!aiPrompt.trim()) {
      toast.error("Digite uma instrucao para a IA")
      return
    }

    if (!code) {
      toast.error("Nenhum codigo para modificar")
      return
    }

    setIsAIProcessing(true)

    try {
      console.log("[v0] Enviando pedido de modificacao AI...", { 
        instruction: aiPrompt,
        codeLength: code.length,
        tab: activeTab
      })

      const response = await fetch("/api/ai/modify-code", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          code,
          instruction: aiPrompt,
          settings: aiSettings || {}
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar")
      }

      if (!data.modifiedCode) {
        throw new Error("A IA nao retornou nenhum codigo")
      }
      
      // Atualizar o editor com o novo codigo
      setCode(data.modifiedCode)
      setHasChanges(true)
      setIsAIModalOpen(false)
      setAiPrompt("")
      
      toast.success("Codigo modificado pela IA! Revise e salve.")
      
      // Formatar o código modificado após um pequeno delay
      setTimeout(() => {
        formatCode()
      }, 200)
    } catch (error) {
      console.error("[v0] Erro AI:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao processar com IA")
    } finally {
      setIsAIProcessing(false)
    }
  }, [code, aiPrompt, aiSettings, activeTab, formatCode])

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-muted-foreground">
        <div className="text-center">
          <Code2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Selecione uma tela para editar o codigo</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(
        "flex flex-col bg-[#0a0a0a] overflow-hidden",
        isFullscreen && "fixed inset-0 z-50",
        className
      )}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/5 bg-[#0f0f0f]">
          <div className="flex items-center gap-2">
            {/* Tabs Seletor */}
            <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5 mr-2">
              <button 
                onClick={() => setActiveTab("frontend")}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all rounded-md",
                  activeTab === "frontend" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                )}
              >
                Frontend
              </button>
              <button 
                onClick={() => setActiveTab("backend")}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all rounded-md",
                  activeTab === "backend" ? "bg-amber-500 text-black" : "text-muted-foreground hover:text-white"
                )}
              >
                Backend
              </button>
            </div>

            <div className="flex items-center gap-1">
              {/* File info */}
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 text-[10px]">
                {activeTab === "frontend" ? <FileJson className="w-3 h-3 text-primary" /> : <Code2 className="w-3 h-3 text-amber-500" />}
                <span className="text-muted-foreground">
                  {currentScreenName}.{activeTab === "frontend" ? "scm" : "bky"}
                </span>
                {hasChanges && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Alteracoes nao salvas" />
                )}
              </div>
            </div>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Undo/Redo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleUndo}>
                  <Undo2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Desfazer (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRedo}>
                  <Redo2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Refazer (Ctrl+Y)</TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Cut/Copy/Paste */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCut}>
                  <Scissors className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Cortar (Ctrl+X)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Copiar (Ctrl+C)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePaste}>
                  <ClipboardPaste className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Colar (Ctrl+V)</TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Search */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => editorRef.current?.getAction("actions.find")?.run()}
                >
                  <Search className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Buscar (Ctrl+F)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => editorRef.current?.getAction("editor.action.startFindReplaceAction")?.run()}
                >
                  <Replace className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Substituir (Ctrl+H)</TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* AI Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                  onClick={() => setIsAIModalOpen(true)}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Modificar com IA</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-1">
            {/* Settings dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings2 className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setWordWrap(wordWrap === "on" ? "off" : "on")}>
                  <WrapText className="w-4 h-4 mr-2" />
                  Quebra de linha
                  {wordWrap === "on" && <Check className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMinimap(!minimap)}>
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Minimapa
                  {minimap && <Check className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFontSize(Math.max(10, fontSize - 1))}>
                  Diminuir fonte ({fontSize}px)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFontSize(Math.min(24, fontSize + 1))}>
                  Aumentar fonte ({fontSize}px)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={formatCode}>
                  Formatar codigo (Alt+Shift+F)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload}>
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Baixar arquivo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Reset */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={handleReset}
                  disabled={!hasChanges}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Restaurar original</TooltipContent>
            </Tooltip>

            {/* Save */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={hasChanges && (activeTab === "frontend" ? isValidJson : true) ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-7 px-3 text-xs gap-1.5",
                    hasChanges && (activeTab === "frontend" ? isValidJson : true) && "bg-primary hover:bg-primary/90",
                    activeTab === "frontend" && !isValidJson && hasChanges && "bg-destructive/20 text-destructive border-destructive/30 cursor-not-allowed"
                  )}
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving || (activeTab === "frontend" && !isValidJson)}
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : activeTab === "frontend" && !isValidJson ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {activeTab === "frontend" && !isValidJson ? "Erros" : "Salvar"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {activeTab === "frontend" && !isValidJson ? "Corrija os erros antes de salvar" : "Salvar no GitHub (Ctrl+S)"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={activeTab === "frontend" ? "json" : "xml"}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              minimap: { enabled: minimap },
              wordWrap,
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              renderLineHighlight: "all",
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              padding: { top: 12, bottom: 12 },
              lineNumbers: "on",
              folding: true,
              foldingHighlight: true,
              showFoldingControls: "always",
              automaticLayout: true,
              tabSize: 2,
              formatOnPaste: true,
            }}
            loading={
              <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            }
          />
        </div>

        {/* Error Panel - exibe erros em tempo real */}
        {jsonErrors.length > 0 && (
          <div className="border-t border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-destructive/20 bg-destructive/10">
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs font-medium text-destructive">
                Problemas ({jsonErrors.length})
              </span>
            </div>
            <div className="max-h-24 overflow-y-auto">
              {jsonErrors.map((error, index) => (
                <button
                  key={index}
                  className="w-full flex items-start gap-2 px-3 py-1.5 text-left hover:bg-destructive/10 transition-colors"
                  onClick={() => {
                    // Ir para a linha do erro no editor
                    if (editorRef.current) {
                      editorRef.current.setPosition({ lineNumber: error.line, column: error.column })
                      editorRef.current.revealLineInCenter(error.line)
                      editorRef.current.focus()
                    }
                  }}
                >
                  <X className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-destructive font-mono">
                      Linha {error.line}, Coluna {error.column}
                    </span>
                    <p className="text-[11px] text-destructive/90 truncate">
                      {error.message}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1 border-t border-white/5 bg-[#0f0f0f] text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>JSON</span>
            <span>UTF-8</span>
            <span>Espacos: 2</span>
            {jsonErrors.length > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <X className="w-3 h-3" />
                {jsonErrors.length} erro(s)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isValidJson ? (
              <span className="flex items-center gap-1 text-destructive animate-pulse">
                <AlertCircle className="w-3 h-3" />
                JSON invalido
              </span>
            ) : hasChanges ? (
              <span className="flex items-center gap-1 text-amber-500">
                <AlertCircle className="w-3 h-3" />
                Alteracoes nao salvas
              </span>
            ) : (
              <span className="flex items-center gap-1 text-success">
                <Check className="w-3 h-3" />
                Sincronizado
              </span>
            )}
          </div>
        </div>

        {/* AI Modal */}
        <Dialog open={isAIModalOpen} onOpenChange={setIsAIModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Modificar Codigo com IA
              </DialogTitle>
              <DialogDescription>
                {activeTab === "frontend" 
                  ? "Descreva as alteracoes que deseja fazer no layout (JSON/SCM) e a IA ira aplica-las automaticamente."
                  : "Descreva a lógica ou os blocos que deseja modificar no Backend (XML/BKY) e a IA tentará atualizar o código."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">O que voce quer modificar?</label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Adicione um botao azul com texto 'Enviar', Mude a cor de fundo para preto, Adicione um campo de texto para email..."
                  className="min-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      handleAIModify()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Dica: Pressione Ctrl+Enter para enviar
                </p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Exemplos de instrucoes:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Adicione um Label com texto &quot;Bem-vindo&quot; no topo</li>
                  <li>Mude o BackgroundColor da Screen para #1a1a1a</li>
                  <li>Adicione 3 botoes horizontalmente: Inicio, Perfil, Config</li>
                  <li>Remova todos os componentes TextBox</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAIModalOpen(false)} disabled={isAIProcessing}>
                Cancelar
              </Button>
              <Button onClick={handleAIModify} disabled={isAIProcessing || !aiPrompt.trim()}>
                {isAIProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Aplicar
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
