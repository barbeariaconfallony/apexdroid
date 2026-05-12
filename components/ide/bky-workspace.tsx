"use client"

import { useEffect, useRef, useState } from "react"
import { useIDEStore } from "@/lib/ide-store"
import { Loader2, Info, RefreshCw, ZoomIn, ZoomOut, Puzzle, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import Blockly from 'blockly'
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
            const xml = Blockly.Xml.workspaceToDom(ws)
            const xmlText = Blockly.Xml.domToText(xml)
            setCurrentBkyContent(xmlText)
          }, 2000) // Salva após 2 segundos de inatividade
        }
      })

      setWorkspace(ws)
      setLoading(false)

      // Carregar conteúdo BKY inicial
      if (currentBkyContent) {
        try {
          const xml = Blockly.Xml.textToDom(currentBkyContent)
          Blockly.Xml.domToWorkspace(xml, ws)
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
    <div className="flex-1 flex flex-col bg-[#0a0a0a] relative overflow-hidden">
      {/* Indicador de Sincronia */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10 shadow-2xl">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Puzzle className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Logic Engine</p>
            <p className="text-xs font-semibold text-white/90">SCM Synchronized</p>
          </div>
        </div>
      </div>

      {/* Controles de Zoom */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-2xl flex flex-col gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => workspace?.zoom(0, 0, 1.2)}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => workspace?.zoom(0, 0, 0.8)}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="h-px bg-white/10 mx-2" />
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => workspace?.zoom(0, 0, 1)}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm font-medium">Otimizando motor de blocos...</p>
        </div>
      )}

      <div ref={blocklyDiv} className="flex-1 w-full h-full" />
      
      {/* Status Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
         <div className="bg-black/60 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-2xl flex items-center gap-3">
            <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-green-500" />
               <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Editor Otimizado</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1.5">
               <Layers className="w-3 h-3 text-blue-500" />
               <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Nativo NPM</span>
            </div>
         </div>
      </div>

      <style jsx global>{`
        .blocklyToolboxDiv {
          background-color: #1a1a1a !important;
          border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
          padding: 8px !important;
        }
        .blocklyTreeLabel {
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
        .blocklyTreeRow {
          margin: 2px 0 !important;
          border-radius: 6px !important;
        }
        .blocklyTreeSelected {
          background-color: rgba(0, 112, 243, 0.2) !important;
        }
        .blocklyFlyoutBackground {
          fill: #1a1a1a !important;
        }
        .blocklyBlockCanvas {
          transition: transform 0.1s ease-out;
        }
      `}</style>
    </div>
  )
}
