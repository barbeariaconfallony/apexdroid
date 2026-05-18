"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useIDEStore } from "@/lib/ide-store"
import { RefreshCw, ZoomIn, ZoomOut, Save, CheckCircle, Cloud, CloudOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as Blockly from 'blockly'
import 'blockly/blocks'
import { registerKodularBlocks, generateDynamicToolbox } from "@/lib/blocks-utils"
import { generateCodeFromWorkspace, registerCodeGenerators } from "@/lib/blocks-codegen"
import { convertScmToBlocks } from "@/lib/scm-to-blocks"
import { bkySyncService } from "@/lib/bky-sync-service"
import { toast } from "sonner"

export function BkyWorkspace() {
  const { 
    currentBkyContent, 
    currentProject, 
    setBkyContent,
    currentScreenName,
    screens,
    ghToken,
    selectedRepo,
    setSyncStatus,
    bkySyncSource,
    bkySyncTimestamp
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
    const { ghToken, selectedRepo, screens, currentProject, screenFiles, currentFile } = useIDEStore.getState()
    
    if (!ghToken || !selectedRepo) {
      return // Nao conectado ao GitHub
    }

    setIsSyncing(true)
    setSyncStatus("syncing")

    try {
      // Preparar arquivos para commit
      const screenMeta = screenFiles.find(s => s.name === screenName)
      const bkyPath = screenMeta?.bkyPath || `src/${screenName}.bky`

      const files = [
        {
          path: bkyPath,
          content: bkyContent
        }
      ]

      // Incluir tambem o SCM da tela se existir
      const screenData = screens[screenName]

      if (screenData?.data) {
        let scmContent = JSON.stringify(screenData.data, null, 2)
        
        // Preservar prefixo se disponível no arquivo atual
        if (currentFile?.path.endsWith(`${screenName}.scm`) && currentFile.originalContent.includes("$JSON")) {
          const jsonStart = currentFile.originalContent.indexOf("{")
          if (jsonStart > 0) {
            const prefix = currentFile.originalContent.substring(0, jsonStart)
            scmContent = prefix + scmContent
          }
        }

        files.push({
          path: screenMeta?.scmPath || screenData.scmPath || `src/${screenName}.scm`,
          content: scmContent
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
      // Bloquear eventos para evitar loop de salvamento no carregamento
      Blockly.Events.disable()
      
      // Tentar carregar como JSON (formato novo do Blockly 12)
      if (content.trim().startsWith('{')) {
        const state = JSON.parse(content)
        Blockly.serialization.workspaces.load(state, ws)
      } else if (content.trim().startsWith('<')) {
        // Se comecar com <, e XML legado (Kodular/App Inventor padrao)
        try {
          const xml = Blockly.utils.xml.textToDom(content)
          Blockly.Xml.domToWorkspace(xml, ws)
          console.log('[v0] XML legado carregado com sucesso')
        } catch (e) {
          console.error('[v0] Erro ao carregar XML legado:', e)
          toast.error("Erro ao carregar blocos XML")
        }
      } else {
        // Tentar parse JSON de qualquer forma
        const state = JSON.parse(content)
        Blockly.serialization.workspaces.load(state, ws)
      }
    } catch (e) {
      console.error("Erro ao carregar blocos:", e)
    } finally {
      // Reativar eventos apos o carregamento
      setTimeout(() => {
        Blockly.Events.enable()
        setSyncStatus("synced")
      }, 100)
    }
  }, [setSyncStatus])

  // Funcao para salvar blocos na screen atual
  const saveBlocksToScreen = useCallback((ws: Blockly.WorkspaceSvg) => {
    // Usar o XML legado para manter compatibilidade com o Kodular (.bky)
    const xmlDom = Blockly.Xml.workspaceToDom(ws)
    const blocksXml = Blockly.Xml.domToText(xmlDom)
    
    // Atualizar o bkyContent usando o novo sistema de sincronizacao
    setBkyContent(blocksXml, 'blocks')
    
    // Notificar o serviço centralizado
    const { currentScreenName } = useIDEStore.getState()
    if (currentScreenName) {
      bkySyncService.updateFromBkyXml(currentScreenName, blocksXml, 'blocks')
    }
    
    // Atualizar diretamente no objeto screens para persistencia na sessao
    const { screens } = useIDEStore.getState()
    if (currentScreenName && screens[currentScreenName]) {
      screens[currentScreenName].bkyContent = blocksXml
      
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
    }
    
    setSyncStatus("synced") // O auto-sync da Sidebar cuidara do push real
    setLastSaved(new Date())
    setIsSaving(false)
  }, [setBkyContent, setSyncStatus])

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
          'name': 'apex-theme',
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

      // Monkeypatch para suprimir erro conhecido do Blockly 12.x durante drag
      // "Block not present in workspace's list of top-most blocks"
      const originalRemoveTopBlock = ws.removeTopBlock?.bind(ws)
      if (originalRemoveTopBlock) {
        ws.removeTopBlock = function(block: any) {
          try {
            originalRemoveTopBlock(block)
          } catch (err: any) {
            // Ignorar erro especifico de insertion marker durante drag
            if (err?.message?.includes("Block not present in workspace")) {
              // Silenciar - e esperado durante operacoes de drag
              return
            }
            throw err
          }
        }
      }

      // Listener para Auto-Save Inteligente (Debounced)
      ws.addChangeListener((event: any) => {
        // Ignore events during drag operations to prevent the "Block not present" error
        if (event.type === Blockly.Events.BLOCK_DRAG) {
          return // Skip drag events entirely
        }
        
        // Skip if block is being dragged (check for active gesture)
        const gesture = ws.getGesture()
        if (gesture) {
          return // Don't save while dragging
        }
        
        if (event.type === Blockly.Events.BLOCK_MOVE || 
            event.type === Blockly.Events.BLOCK_CHANGE || 
            event.type === Blockly.Events.BLOCK_CREATE || 
            event.type === Blockly.Events.BLOCK_DELETE) {
          
          setIsSaving(true)
          
          if (saveTimeout.current) clearTimeout(saveTimeout.current)
          
          // Auto-save apos 1.5 segundos de inatividade
          saveTimeout.current = setTimeout(() => {
            // Double-check no active gesture before saving
            const currentGesture = ws.getGesture()
            if (!currentGesture) {
              saveBlocksToScreen(ws)
            } else {
              setIsSaving(false)
            }
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
        try {
          // Cancel any active gestures/drags before disposing
          const gesture = ws.getGesture()
          if (gesture) {
            gesture.cancel()
          }
          // Small delay to ensure all pending operations complete
          setTimeout(() => {
            try {
              ws.dispose()
            } catch (disposeErr) {
              // Ignore dispose errors - workspace is being cleaned up anyway
            }
          }, 0)
        } catch (err) {
          // Ignore cleanup errors
        }
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

  // Carregar blocos quando trocar de tela ou o workspace inicializar
  useEffect(() => {
    if (workspace && currentScreenName && screens[currentScreenName]) {
      const screenBky = screens[currentScreenName]?.bkyContent || currentBkyContent
      const screenData = screens[currentScreenName]?.data || currentProject
      
      try {
        // Cancel any active gestures before clearing
        const gesture = workspace.getGesture()
        if (gesture) {
          gesture.cancel()
        }
        
        Blockly.Events.disable()
        
        // Use setTimeout to ensure gesture is fully cancelled before clearing
        setTimeout(() => {
          try {
            workspace.clear()
            
            if (screenBky) {
              console.log(`[v0] Carregando blocos para ${currentScreenName} (${screenBky.length} bytes)`)
              loadBlocksContent(screenBky, workspace)
            } else if (screenData) {
              // Se nao tem blocos salvos, tenta gerar a partir da logica do arquivo SCM (Linguagem do Designer)
              console.log(`[v0] Gerando blocos a partir do SCM para: ${currentScreenName}`)
              try {
                const generated = convertScmToBlocks(screenData)
                if (generated.blocks.blocks && generated.blocks.blocks.length > 0) {
                  Blockly.serialization.workspaces.load(generated, workspace)
                  // Salvar no store para persistencia usando o novo sistema
                  const state = Blockly.serialization.workspaces.save(workspace)
                  setBkyContent(JSON.stringify(state), 'blocks')
                }
              } catch (e) {
                console.error("Erro ao gerar blocos do SCM:", e)
              }
            }
          } catch (clearErr) {
            console.error("Erro ao limpar workspace:", clearErr)
          } finally {
            setTimeout(() => {
              Blockly.Events.enable()
            }, 200)
          }
        }, 50)
      } catch (err) {
        console.error("Erro ao preparar carregamento de blocos:", err)
        Blockly.Events.enable()
      }
    }
  }, [currentScreenName, workspace, loadBlocksContent, screens])

  // Listener para sincronização vinda de outras abas (Code Editor ou Flowchart)
  useEffect(() => {
    if (!workspace || !currentScreenName) return
    
    // Se a origem da sincronização não foi o editor de blocos, recarregar
    if (bkySyncSource && bkySyncSource !== 'blocks' && currentBkyContent) {
      console.log(`[BkyWorkspace] Recarregando blocos - origem: ${bkySyncSource}`)
      
      try {
        const gesture = workspace.getGesture()
        if (gesture) gesture.cancel()
        
        Blockly.Events.disable()
        workspace.clear()
        loadBlocksContent(currentBkyContent, workspace)
        
        setTimeout(() => {
          Blockly.Events.enable()
        }, 100)
      } catch (err) {
        console.error("[BkyWorkspace] Erro ao recarregar blocos:", err)
        Blockly.Events.enable()
      }
    }
  }, [bkySyncTimestamp, bkySyncSource, workspace, currentScreenName, currentBkyContent, loadBlocksContent])

  // Salvar manualmente
  const handleManualSave = useCallback(() => {
    if (workspace) {
      saveBlocksToScreen(workspace) 
      toast.success("Blocos salvos localmente!")
    }
  }, [workspace, saveBlocksToScreen])

  // Sincronizar manualmente com GitHub
  const handleManualSync = useCallback(async () => {
    if (!workspace || !currentScreenName) return
    
    // Primeiro salvar
    const xmlDom = Blockly.Xml.workspaceToDom(workspace)
    const blocksXml = Blockly.Xml.domToText(xmlDom)
    setBkyContent(blocksXml, 'blocks')
    
    // Notificar o serviço centralizado
    bkySyncService.updateFromBkyXml(currentScreenName, blocksXml, 'blocks')
    
    const { screens } = useIDEStore.getState()
    if (screens[currentScreenName]) {
      screens[currentScreenName].bkyContent = blocksXml
    }
    
    // Depois sincronizar
    await syncToGitHub(currentScreenName, blocksXml)
  }, [workspace, currentScreenName, setBkyContent, syncToGitHub])

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
        /* Estilo para campos de texto durante a edicao */
        .blocklyHtmlInput {
          color: #000000 !important;
          background-color: #ffffff !important;
          font-family: sans-serif !important;
          border: none !important;
          outline: none !important;
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
