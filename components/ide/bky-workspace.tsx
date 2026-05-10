"use client"

import { useEffect, useRef, useState } from "react"
import { useIDEStore } from "@/lib/ide-store"
import { Loader2, Info, RefreshCw, ZoomIn, ZoomOut, Puzzle, Layers, Zap, GitBranch, Variable, Calculator, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BkyWorkspace() {
  const { currentBkyContent, isThinking } = useIDEStore()
  const blocklyDiv = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workspace, setWorkspace] = useState<any>(null)

  useEffect(() => {
    let isMounted = true

    async function loadBlockly() {
      if (typeof window === "undefined") return

      // Se ja estiver carregado, pula
      if ((window as any).Blockly) {
        initBlockly((window as any).Blockly)
        return
      }

      try {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/blockly/blockly.min.js"
        script.async = true
        script.onload = () => {
          const scriptBlocks = document.createElement("script")
          scriptBlocks.src = "https://unpkg.com/blockly/blocks.min.js"
          scriptBlocks.onload = () => {
             if (isMounted) initBlockly((window as any).Blockly)
          }
          document.head.appendChild(scriptBlocks)
        }
        script.onerror = () => setError("Erro ao carregar Blockly do CDN")
        document.head.appendChild(script)
      } catch (err) {
        setError("Falha ao inicializar scripts")
      }
    }

    function initBlockly(Blockly: any) {
      if (!isMounted || !blocklyDiv.current) return

      try {
        // Toolbox no estilo Kodular
        const toolbox = `
          <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
            <category name="Controle" colour="#FFAB19">
              <block type="controls_if"></block>
              <block type="controls_repeat_ext"></block>
              <block type="controls_whileUntil"></block>
            </category>
            <category name="Logica" colour="#4C97FF">
              <block type="logic_compare"></block>
              <block type="logic_operation"></block>
              <block type="logic_negate"></block>
              <block type="logic_boolean"></block>
            </category>
            <category name="Matematica" colour="#5962AD">
              <block type="math_number"></block>
              <block type="math_arithmetic"></block>
              <block type="math_single"></block>
            </category>
            <category name="Texto" colour="#59AD89">
              <block type="text"></block>
              <block type="text_join"></block>
              <block type="text_length"></block>
            </category>
            <sep></sep>
            <category name="Variaveis" colour="#FF8C1A" custom="VARIABLE"></category>
            <category name="Procedimentos" colour="#FF661A" custom="PROCEDURE"></category>
          </xml>
        `

        const ws = Blockly.inject(blocklyDiv.current, {
          toolbox: toolbox,
          theme: {
            'base': 'dark',
            'componentStyles': {
              'workspaceBackgroundColour': '#121212',
              'toolboxBackgroundColour': '#1e1e1e',
              'toolboxForegroundColour': '#fff',
              'flyoutBackgroundColour': '#252526',
              'flyoutForegroundColour': '#ccc',
              'insertionMarkerColour': '#fff',
              'insertionMarkerOpacity': 0.3,
              'scrollbarColour': '#797979',
              'scrollbarOpacity': 0.4,
              'cursorColour': '#d0d0d0',
            }
          },
          move: { scrollbars: true, drag: true, wheel: true },
          zoom: { controls: false, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
          trashcan: true,
          grid: { spacing: 25, length: 3, colour: '#333', snap: true }
        })

        setWorkspace(ws)
        setLoading(false)

        if (currentBkyContent) {
          try {
            const xml = Blockly.utils.xml.textToDom(currentBkyContent)
            Blockly.Xml.domToWorkspace(xml, ws)
          } catch (e) {
            console.error("Erro no XML:", e)
          }
        }

        // Listener para mudancas (auto-save em breve)
        ws.addChangeListener((event: any) => {
          if (event.type === Blockly.Events.BLOCK_MOVE || 
              event.type === Blockly.Events.BLOCK_CHANGE || 
              event.type === Blockly.Events.BLOCK_CREATE || 
              event.type === Blockly.Events.BLOCK_DELETE) {
            // Aqui podemos atualizar o store se necessário
          }
        })
      } catch (err) {
        console.error("Init Error:", err)
        setError("Erro ao inicializar workspace")
      }
    }

    loadBlockly()

    return () => {
      isMounted = false
      if (workspace) workspace.dispose()
    }
  }, [])

  // Sincronizar quando mudar de tela
  useEffect(() => {
    if (workspace && currentBkyContent) {
      try {
        const Blockly = (window as any).Blockly
        workspace.clear()
        const xml = Blockly.utils.xml.textToDom(currentBkyContent)
        Blockly.Xml.domToWorkspace(xml, workspace)
      } catch (e) {}
    }
  }, [currentBkyContent, workspace])

  return (
    <div className="flex-1 flex flex-col bg-[#121212] relative overflow-hidden">
      {/* Workspace Header Info */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="glass-dark px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10 shadow-2xl">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Puzzle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Logic Editor</p>
            <p className="text-xs font-semibold text-white/90">Visual BKY Engine</p>
          </div>
        </div>
      </div>

      {/* Workspace Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="glass-dark p-1 rounded-xl border border-white/10 shadow-2xl flex flex-col gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10" onClick={() => workspace?.zoom(0, 0, 1.2)}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10" onClick={() => workspace?.zoom(0, 0, 0.8)}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="h-px bg-white/10 mx-2" />
          <Button variant="ghost" size="icon" className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10" onClick={() => workspace?.zoom(0, 0, 1)}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Thinking Indicator (Pulse) */}
      {isThinking && (
        <div className="absolute inset-0 z-10 pointer-events-none border-2 border-primary/50 animate-pulse-glow" />
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Puzzle className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-sm font-medium animate-pulse">Carregando motor de blocos...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-5">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
             <Info className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <p className="text-lg font-bold">Erro de Conexão</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Não foi possível carregar a biblioteca de blocos. Verifique sua conexão com a internet.
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </Button>
        </div>
      ) : (
        <div ref={blocklyDiv} className="flex-1 w-full h-full blockly-dark-workspace" />
      )}
      
      {/* Bottom Bar Info */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
         <div className="glass-dark px-5 py-2 rounded-full border border-white/10 shadow-2xl flex items-center gap-3">
            <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
               <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Compilação Pronta</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1.5">
               <Layers className="w-3 h-3 text-primary" />
               <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Event-Driven Engine</span>
            </div>
         </div>
      </div>

      <style jsx global>{`
        .blocklyToolboxDiv {
          background-color: rgba(30, 30, 30, 0.8) !important;
          backdrop-filter: blur(12px) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
          padding: 12px 4px !important;
        }
        .blocklyTreeLabel {
          font-family: inherit !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
        .blocklyTreeRow {
          margin: 4px 8px !important;
          padding: 8px 12px !important;
          border-radius: 8px !important;
          transition: all 0.2s !important;
        }
        .blocklyTreeSelected {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .blocklyTreeRow:hover:not(.blocklyTreeSelected) {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .blocklyScrollbarHandle {
          fill: rgba(255, 255, 255, 0.2) !important;
        }
        .blocklyFlyoutBackground {
          fill: rgba(40, 40, 40, 0.9) !important;
          fill-opacity: 0.9 !important;
        }
      `}</style>
    </div>
  )
}
