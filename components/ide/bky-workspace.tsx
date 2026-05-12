"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useIDEStore } from "@/lib/ide-store"
import { RefreshCw, ZoomIn, ZoomOut, Save, CheckCircle, Cloud, CloudOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as Blockly from 'blockly'
import { registerKodularBlocks, generateDynamicToolbox } from "@/lib/blocks-utils"
import { generateCodeFromWorkspace, registerCodeGenerators } from "@/lib/blocks-codegen"
import { toast } from "sonner"

export function BkyWorkspace() {
  const { 
    currentBkyContent, 
    currentProject, 
    setCurrentBkyContent,
    currentScreenName,
    screens,
    ghToken,
    selectedRepo,
    setSyncStatus
  } = useIDEStore()
  
  const blocklyDiv = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [workspace, setWorkspace] = useState<Blockly.WorkspaceSvg | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)
  const syncTimeout = useRef<NodeJS.Timeout | null>(null)

  // Funcao para sincronizar com GitHub
  const syncToGitHub = useCallback(async (screenName: string, bkyContent: string) => {
    const { ghToken, selectedRepo, screens, currentProject } = useIDEStore.getState()
    
    if (!ghToken || !selectedRepo) {
      return // Nao conectado ao GitHub
    }

    setIsSyncing(true)
    setSyncStatus("syncing")

    try {
      // Preparar arquivos para commit
      const files = [
        {
          path: `src/${screenName}.bky`,
          content: bkyContent
        }
      ]

      // Incluir tambem o SCM da tela se existir
      const screenData = screens[screenName]
      if (screenData?.data) {
        files.push({
          path: `src/${screenName}.scm`,
          content: JSON.stringify(screenData.data, null, 2)
        })
      }

      // Incluir project.json atualizado
      if (currentProject) {
        files.push({
          path: "project.json",
          content: JSON.stringify(currentProject, null, 2)
        })
      }

      const response = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: ghToken,
          repo: selectedRepo.full_name,
          message: `[Auto-sync] Blocks updated: ${screenName}`,
          files
        })
      })

      if (response.ok) {
        setLastSynced(new Date())
        setSyncStatus("synced")
        toast.success("Sincronizado com GitHub", { duration: 2000 })
      } else {
        const err = await response.json()
        throw new Error(err.error || "Falha ao sincronizar")
      }
    } catch (error) {
      console.error("Erro ao sincronizar com GitHub:", error)
      setSyncStatus("error")
      toast.error("Erro ao sincronizar com GitHub")
    } finally {
      setIsSyncing(false)
    }
  }, [setSyncStatus])

  // Funcao para carregar blocos (suporta JSON novo e XML legado)
  const loadBlocksContent = useCallback((content: string, ws: Blockly.WorkspaceSvg) => {
    if (!content || !ws) return
    
    try {
      // Tentar carregar como JSON (formato novo do Blockly 12)
      if (content.trim().startsWith('{')) {
        const state = JSON.parse(content)
        Blockly.serialization.workspaces.load(state, ws)
        return
      }
      
      // Se comecar com <, e XML legado - ignorar (nao mais suportado no Blockly 12)
      if (content.trim().startsWith('<')) {
        console.log('[v0] Formato XML legado detectado - sera convertido ao salvar')
        return
      }
      
      // Tentar parse JSON de qualquer forma
      const state = JSON.parse(content)
      Blockly.serialization.workspaces.load(state, ws)
    } catch (e) {
      console.error("Erro ao carregar blocos:", e)
    }
  }, [])

  // Funcao para salvar blocos na screen atual
  const saveBlocksToScreen = useCallback((ws: Blockly.WorkspaceSvg, autoSync: boolean = true) => {
    const state = Blockly.serialization.workspaces.save(ws)
    const blocksJson = JSON.stringify(state)
    
    // Atualizar o bkyContent da screen atual
    setCurrentBkyContent(blocksJson)
    
    // Atualizar diretamente no objeto screens para sincronizar com GitHub
    const { screens, currentScreenName } = useIDEStore.getState()
    if (currentScreenName && screens[currentScreenName]) {
      screens[currentScreenName].bkyContent = blocksJson
      
      // Gerar codigo JavaScript para o preview Live
      try {
        registerCodeGenerators()
        const generatedCode = generateCodeFromWorkspace(ws)
        // Armazenar codigo gerado para uso no Live preview
        if (typeof window !== 'undefined') {
          (window as any).__apexGeneratedCode = (window as any).__apexGeneratedCode || {}
          ;(window as any).__apexGeneratedCode[currentScreenName] = generatedCode
        }
      } catch (e) {
        console.error('Erro ao gerar codigo:', e)
      }

      // Auto-sync com GitHub (debounced para evitar muitos commits)
      if (autoSync) {
        if (syncTimeout.current) clearTimeout(syncTimeout.current)
        syncTimeout.current = setTimeout(() => {
          syncToGitHub(currentScreenName, blocksJson)
        }, 5000) // Sincroniza 5 segundos apos ultima alteracao
      }
    }
    
    setLastSaved(new Date())
    setIsSaving(false)
  }, [setCurrentBkyContent, syncToGitHub])

  // Inicializacao Unica do Workspace
  useEffect(() => {
    if (!blocklyDiv.current) return

    // Registrar blocos customizados do Kodular
    registerKodularBlocks(Blockly)

    // Gerar toolbox baseado nos componentes atuais (SCM)
    const toolboxXml = currentProject 
      ? generateDynamicToolbox(currentProject.Properties)
      : `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`

    try {
      const ws = Blockly.inject(blocklyDiv.current, {
        toolbox: toolboxXml,
        theme: {
          'base': Blockly.Themes.Classic,
          'componentStyles': {
            'workspaceBackgroundColour': '#0a0a0a',
            'toolboxBackgroundColour': '#1a1a1a',
            'toolboxForegroundColour': '#ffffff',
            'flyoutBackgroundColour': '#1a1a1a',
            'flyoutForegroundColour': '#cccccc',
            'insertionMarkerColour': '#0070f3',
            'insertionMarkerOpacity': 0.3,
            'scrollbarColour': '#333333',
            'scrollbarOpacity': 0.4,
          },
          'blockStyles': {
            'logic_blocks': { 'colourPrimary': '#4C97FF' },
            'loop_blocks': { 'colourPrimary': '#0fbd8c' },
            'math_blocks': { 'colourPrimary': '#5962AD' },
            'text_blocks': { 'colourPrimary': '#59AD89' },
          }
        },
        renderer: 'geras',
        move: { scrollbars: true, drag: true, wheel: true },
        zoom: { controls: false, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
        trashcan: true,
        grid: { spacing: 25, length: 3, colour: '#222', snap: true }
      })

      // Listener para Auto-Save Inteligente (Debounced)
      ws.addChangeListener((event: any) => {
        if (event.type === Blockly.Events.BLOCK_MOVE || 
            event.type === Blockly.Events.BLOCK_CHANGE || 
            event.type === Blockly.Events.BLOCK_CREATE || 
            event.type === Blockly.Events.BLOCK_DELETE) {
          
          setIsSaving(true)
          
          if (saveTimeout.current) clearTimeout(saveTimeout.current)
          
          // Auto-save apos 1.5 segundos de inatividade
          saveTimeout.current = setTimeout(() => {
            saveBlocksToScreen(ws)
          }, 1500)
        }
      })

      setWorkspace(ws)
      setLoading(false)

      // Carregar conteudo BKY inicial da screen atual
      const { currentScreenName, screens } = useIDEStore.getState()
      const screenBky = currentScreenName ? screens[currentScreenName]?.bkyContent : currentBkyContent
      
      if (screenBky) {
        loadBlocksContent(screenBky, ws)
      }

      return () => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current)
        if (syncTimeout.current) clearTimeout(syncTimeout.current)
        ws.dispose()
      }
    } catch (err) {
      console.error("Erro ao injetar Blockly:", err)
    }
  }, [])

  // Atualizar Toolbox Dinamicamente quando o Designer mudar (SCM Sync)
  useEffect(() => {
    if (workspace && currentProject) {
      const newToolbox = generateDynamicToolbox(currentProject.Properties)
      workspace.updateToolbox(newToolbox)
    }
  }, [currentProject, workspace])

  // Recarregar blocos quando trocar de tela
  useEffect(() => {
    if (workspace && currentScreenName && screens[currentScreenName]) {
      const screenBky = screens[currentScreenName].bkyContent
      workspace.clear()
      if (screenBky) {
        loadBlocksContent(screenBky, workspace)
      }
    }
  }, [currentScreenName, workspace, loadBlocksContent])

  // Salvar manualmente
  const handleManualSave = useCallback(() => {
    if (workspace) {
      saveBlocksToScreen(workspace, false) // Nao auto-sync
      toast.success("Blocos salvos localmente!")
    }
  }, [workspace, saveBlocksToScreen])

  // Sincronizar manualmente com GitHub
  const handleManualSync = useCallback(async () => {
    if (!workspace || !currentScreenName) return
    
    // Primeiro salvar
    const state = Blockly.serialization.workspaces.save(workspace)
    const blocksJson = JSON.stringify(state)
    setCurrentBkyContent(blocksJson)
    
    const { screens } = useIDEStore.getState()
    if (screens[currentScreenName]) {
      screens[currentScreenName].bkyContent = blocksJson
    }
    
    // Depois sincronizar
    await syncToGitHub(currentScreenName, blocksJson)
  }, [workspace, currentScreenName, setCurrentBkyContent, syncToGitHub])

  return (
    <div className="absolute inset-0 flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Controles de Zoom e Save - Compacto */}
      <div className="absolute top-3 right-3 z-20 flex gap-2">
        {/* Indicador de sincronizacao GitHub */}
        {ghToken && selectedRepo && (
          <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-2">
            {isSyncing ? (
              <>
                <Cloud className="w-3 h-3 text-blue-500 animate-pulse" />
                <span className="text-[10px] text-blue-500 font-medium">Sincronizando...</span>
              </>
            ) : lastSynced ? (
              <>
                <Cloud className="w-3 h-3 text-green-500" />
                <span className="text-[10px] text-green-500 font-medium">Synced</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Pendente</span>
              </>
            )}
          </div>
        )}
        
        {/* Indicador de salvamento local */}
        <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-2">
          {isSaving ? (
            <>
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] text-yellow-500 font-medium">Salvando...</span>
            </>
          ) : lastSaved ? (
            <>
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-[10px] text-green-500 font-medium">Salvo</span>
            </>
          ) : (
            <span className="text-[10px] text-muted-foreground">Pronto</span>
          )}
        </div>
        
        {/* Botoes de controle */}
        <div className="bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/10 flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleManualSave} title="Salvar blocos">
            <Save className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-5 bg-white/10 self-center" />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => workspace?.zoom(0, 0, 1.2)}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => workspace?.zoom(0, 0, 0.8)}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => workspace?.zoom(0, 0, 1)}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-4 bg-[#0a0a0a] z-30">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm font-medium">Carregando blocos...</p>
        </div>
      )}

      {/* Blockly Container - Full Space */}
      <div ref={blocklyDiv} className="absolute inset-0 w-full h-full" />

      <style jsx global>{`
        /* Toolbox estilo Kodular */
        .blocklyToolboxDiv {
          background-color: #1a1a1a !important;
          border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding: 4px !important;
          width: 200px !important;
        }
        .blocklyTreeLabel {
          font-size: 12px !important;
          font-weight: 500 !important;
          letter-spacing: 0.02em !important;
        }
        .blocklyTreeRow {
          margin: 1px 0 !important;
          border-radius: 4px !important;
          padding: 4px 8px !important;
          height: auto !important;
          line-height: 1.4 !important;
        }
        .blocklyTreeRow:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .blocklyTreeSelected {
          background-color: rgba(0, 112, 243, 0.15) !important;
        }
        .blocklyTreeSeparator {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          margin: 8px 0 !important;
        }
        .blocklyFlyoutBackground {
          fill: #141414 !important;
        }
        .blocklyFlyout {
          border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .blocklyMainBackground {
          stroke: none !important;
        }
        .blocklyTrash {
          opacity: 0.6;
        }
        .blocklyTrash:hover {
          opacity: 1;
        }
        /* Scrollbar estilizada */
        .blocklyScrollbarVertical, .blocklyScrollbarHorizontal {
          opacity: 0.3 !important;
        }
        .blocklyScrollbarVertical:hover, .blocklyScrollbarHorizontal:hover {
          opacity: 0.6 !important;
        }
        /* Workspace grid */
        .blocklyMainWorkspaceScrollbar {
          display: block !important;
        }
      `}</style>
    </div>
  )
}
