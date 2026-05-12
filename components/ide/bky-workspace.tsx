"use client"

import { useEffect, useRef, useState } from "react"
import { useIDEStore } from "@/lib/ide-store"
import { Loader2, Info, RefreshCw, ZoomIn, ZoomOut, Puzzle, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as Blockly from 'blockly'
import { registerKodularBlocks, generateDynamicToolbox } from "@/lib/blocks-utils"

// Configurar o idioma do Blockly
// Blockly.setLocale(En); // O pacote blockly ja vem com o locale padrao em ingles

export function BkyWorkspace() {
  const { currentBkyContent, currentProject, isThinking, setCurrentBkyContent } = useIDEStore()
  const blocklyDiv = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [workspace, setWorkspace] = useState<Blockly.WorkspaceSvg | null>(null)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)

  // Inicialização Única do Workspace
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
        renderer: 'geras', // Renderizador padrão balanceado
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
          
          if (saveTimeout.current) clearTimeout(saveTimeout.current)
          
          saveTimeout.current = setTimeout(() => {
            // Blockly 12: Usar serialization API em vez de Xml
            const state = Blockly.serialization.workspaces.save(ws)
            setCurrentBkyContent(JSON.stringify(state))
          }, 2000) // Salva apos 2 segundos de inatividade
        }
      })

      setWorkspace(ws)
      setLoading(false)

      // Carregar conteudo BKY inicial
      if (currentBkyContent) {
        try {
          // Blockly 12: Usar serialization API
          const state = JSON.parse(currentBkyContent)
          Blockly.serialization.workspaces.load(state, ws)
        } catch (e) {
          console.error("Erro ao restaurar blocos:", e)
        }
      }

      return () => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current)
        ws.dispose()
      }
    } catch (err) {
      console.error("Erro ao injetar Blockly:", err)
    }
  }, []) // Executa apenas uma vez no mount

  // Atualizar Toolbox Dinamicamente quando o Designer mudar (SCM Sync)
  useEffect(() => {
    if (workspace && currentProject) {
      const newToolbox = generateDynamicToolbox(currentProject.Properties)
      workspace.updateToolbox(newToolbox)
    }
  }, [currentProject, workspace])

  return (
    <div className="absolute inset-0 flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Controles de Zoom - Compacto */}
      <div className="absolute top-3 right-3 z-20 flex gap-1">
        <div className="bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/10 flex gap-1">
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
