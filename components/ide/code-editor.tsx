"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Editor, { OnMount, OnChange } from "@monaco-editor/react"
import { 
  Save, RotateCcw, Copy, Download, Upload, 
  Maximize2, Minimize2, Search, Replace,
  Code2, FileJson, Loader2, Check, AlertCircle,
  Undo2, Redo2, WrapText, Settings2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIDEStore } from "@/lib/ide-store"
import { updateFileContent } from "@/lib/github-service"
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
} from "@/components/ui/tooltip"

interface CodeEditorProps {
  className?: string
}

export function CodeEditor({ className }: CodeEditorProps) {
  const { 
    currentProject, 
    currentFile, 
    setCurrentFile,
    ghToken, 
    selectedRepo,
    currentScreenName,
    setSyncStatus
  } = useIDEStore()

  const editorRef = useRef<any>(null)
  const [code, setCode] = useState("")
  const [originalCode, setOriginalCode] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wordWrap, setWordWrap] = useState<"on" | "off">("off")
  const [minimap, setMinimap] = useState(true)
  const [fontSize, setFontSize] = useState(13)

  // Gerar o código SCM do projeto atual
  useEffect(() => {
    if (currentProject) {
      const jsonContent = JSON.stringify(currentProject, null, 2)
      
      // Reconstruir o formato SCM se tiver prefixo original
      let scmContent = jsonContent
      if (currentFile?.originalContent?.includes("$JSON")) {
        const jsonStart = currentFile.originalContent.indexOf("{")
        if (jsonStart > 0) {
          const prefix = currentFile.originalContent.substring(0, jsonStart)
          scmContent = prefix + jsonContent
        }
      }
      
      setCode(scmContent)
      setOriginalCode(scmContent)
      setHasChanges(false)
    }
  }, [currentProject, currentFile?.originalContent])

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

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
    }
  }

  const formatCode = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run()
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (!ghToken || !selectedRepo || !currentFile || !hasChanges) return

    setIsSaving(true)
    setSyncStatus("syncing")

    try {
      const [owner] = selectedRepo.full_name.split("/")

      // Validar JSON antes de salvar
      try {
        // Extrair apenas o JSON do código (ignorar prefixo SCM)
        const jsonStart = code.indexOf("{")
        const jsonContent = jsonStart >= 0 ? code.substring(jsonStart) : code
        JSON.parse(jsonContent)
      } catch {
        toast.error("JSON inválido! Corrija os erros antes de salvar.")
        setIsSaving(false)
        setSyncStatus("error")
        return
      }

      const result = await updateFileContent(
        ghToken,
        owner,
        selectedRepo.name,
        currentFile.path,
        code,
        currentFile.sha,
        `[Code Editor] Atualizado: ${currentScreenName}`,
        currentFile.branch
      )

      // Atualizar referência do arquivo
      setCurrentFile({
        ...currentFile,
        sha: result.sha,
        originalContent: code,
        content: code
      })

      setOriginalCode(code)
      setHasChanges(false)
      setSyncStatus("synced")
      toast.success("Código salvo no GitHub!")
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setSyncStatus("error")
      toast.error("Erro ao salvar no GitHub")
    } finally {
      setIsSaving(false)
    }
  }, [ghToken, selectedRepo, currentFile, code, hasChanges, currentScreenName, setCurrentFile, setSyncStatus])

  const handleReset = useCallback(() => {
    setCode(originalCode)
    setHasChanges(false)
    toast.info("Código restaurado")
  }, [originalCode])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    toast.success("Código copiado!")
  }, [code])

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

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-muted-foreground">
        <div className="text-center">
          <Code2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Selecione uma tela para editar o código</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-col bg-[#0a0a0a] overflow-hidden",
      isFullscreen && "fixed inset-0 z-50",
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/5 bg-[#0f0f0f]">
        <div className="flex items-center gap-1">
          {/* File info */}
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 text-[10px]">
            <FileJson className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">{currentScreenName}.scm</span>
            {hasChanges && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Alterações não salvas" />
            )}
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
                Formatar código (Alt+Shift+F)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Copiar código</TooltipContent>
          </Tooltip>

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
                variant={hasChanges ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 px-3 text-xs gap-1.5",
                  hasChanges && "bg-primary hover:bg-primary/90"
                )}
                onClick={handleSave}
                disabled={!hasChanges || isSaving || !ghToken}
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Salvar
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Salvar no GitHub (Ctrl+S)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          defaultLanguage="json"
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

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-white/5 bg-[#0f0f0f] text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>JSON</span>
          <span>UTF-8</span>
          <span>Espaços: 2</span>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges ? (
            <span className="flex items-center gap-1 text-amber-500">
              <AlertCircle className="w-3 h-3" />
              Alterações não salvas
            </span>
          ) : (
            <span className="flex items-center gap-1 text-success">
              <Check className="w-3 h-3" />
              Sincronizado
            </span>
          )}
          <span>Ln {editorRef.current?.getPosition()?.lineNumber || 1}, Col {editorRef.current?.getPosition()?.column || 1}</span>
        </div>
      </div>
    </div>
  )
}
