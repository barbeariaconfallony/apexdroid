"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { 
  Workflow, Plus, Save, Trash2, ZoomIn, ZoomOut, 
  RefreshCw, MousePointer2, Hand, GitMerge, Square, 
  Circle, Diamond, Database, Terminal, Layers, Settings2,
  ChevronRight, Smartphone, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useIDEStore } from "@/lib/ide-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { convertBkyToFlow } from "@/lib/bky-to-flow"
import { convertFlowToBky } from "@/lib/flow-to-bky"

interface Edge {
  id: string
  source: string
  target: string
  label?: string
}

interface Node {
  id: string
  type: "start" | "process" | "decision" | "database" | "end" | "action" | "logic"
  label: string
  x: number
  y: number
  width: number
  height: number
  metadata?: {
    componentName?: string
    componentType?: string
    actionType?: string
    targetScreen?: string
  }
}

export function FlowchartEditor() {
  const { 
    screenFiles, 
    currentScreenName, 
    currentFlowchartContent, 
    setCurrentFlowchartContent,
    currentBkyContent,
    setCurrentBkyContent,
    screens,
    ghToken,
    selectedRepo,
    currentFile,
    currentProject
  } = useIDEStore()

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isDraggingNode, setIsDraggingNode] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [connecting, setConnecting] = useState<{ source: string; x: number; y: number } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)
  const lastBkyRef = useRef<string | null>(null)

  // Carregar estado inicial a partir do bky da tela atual (igual ao editor de blocos)
  useEffect(() => {
    // Pegar conteudo bky da screen atual - priorizar screens store igual ao BkyWorkspace
    const screenBky = screens[currentScreenName || ""]?.bkyContent || currentBkyContent
    
    // Se o bky nao mudou, nao recarregar
    if (screenBky === lastBkyRef.current && nodes.length > 0) {
      return
    }
    
    setIsLoading(true)
    
    // Se temos bky, converter para flow (isso gera os nos reais do arquivo)
    if (screenBky && screenBky.trim().startsWith('<xml')) {
      lastBkyRef.current = screenBky
      const { nodes: convertedNodes, edges: convertedEdges } = convertBkyToFlow(screenBky)
      
      if (convertedNodes.length > 0) {
        setNodes(convertedNodes)
        setEdges(convertedEdges)
        // Nao salvamos automaticamente no store para evitar loop - apenas quando usuario edita
      } else {
        // bky existe mas nao tem blocos validos - limpar
        setNodes([])
        setEdges([])
      }
      setIsLoading(false)
      return
    }
    
    // Se nao tem bky, verificar se tem flowchart salvo (fallback)
    if (currentFlowchartContent) {
      try {
        const saved = JSON.parse(currentFlowchartContent)
        if (saved.nodes && saved.nodes.length > 0) {
          setNodes(saved.nodes || [])
          setEdges(saved.edges || [])
          setIsLoading(false)
          return
        }
      } catch (e) {
        console.error("Erro ao carregar fluxograma:", e)
      }
    }
    
    // Nenhum dado - tela vazia
    setNodes([])
    setEdges([])
    lastBkyRef.current = null
    setIsLoading(false)
  }, [currentBkyContent, currentScreenName, screens])

  // Gerar codigo JavaScript a partir do fluxo
  const generateJS = useCallback((nodes: Node[], edges: Edge[]) => {
    let code = "/** Codigo Gerado via Fluxograma **/\n\n"
    
    // Encontrar nos que sao eventos (arrastados como componentes)
    const eventNodes = nodes.filter(n => n.metadata?.componentName)
    
    eventNodes.forEach(node => {
      const compName = node.metadata?.componentName
      const eventName = "Click" // Por padrao para botoes, pode ser dinamico depois
      
      code += `__runtime.on('${compName}', '${eventName}', function() {\n`
      
      // Seguir as conexoes para encontrar as acoes
      let currentEdge = edges.find(e => e.source === node.id)
      while (currentEdge) {
        const targetNode = nodes.find(n => n.id === currentEdge!.target)
        if (!targetNode) break
        
        if (targetNode.label === "Abrir Tela" && targetNode.metadata?.targetScreen) {
          code += `  __runtime.openScreen('${targetNode.metadata.targetScreen}');\n`
        } else if (targetNode.label === "Notificar") {
          code += `  __runtime.call('Notifier', 'ShowAlert', ['${targetNode.label} disparado!']);\n`
        }
        
        // Continuar para o proximo no se houver
        currentEdge = edges.find(e => e.source === targetNode.id)
      }
      
      code += `});\n\n`
    })
    
    return code
  }, [])

  // Auto-save e Sincronizacao - apenas quando usuario edita (nao no load inicial)
  const saveFlowState = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    
    saveTimeout.current = setTimeout(async () => {
      setIsSaving(true)
      const content = JSON.stringify({ nodes: newNodes, edges: newEdges })
      setCurrentFlowchartContent(content)

      // Sincronizar com os blocos (.bky) se houver mudanca estrutural
      if (newNodes.length > 0) {
        const generatedBky = convertFlowToBky(newNodes, newEdges)
        if (generatedBky !== currentBkyContent) {
          setCurrentBkyContent(generatedBky)
          lastBkyRef.current = generatedBky
        }
      }

      // Gerar e sincronizar codigo para Live Preview
      const generatedCode = generateJS(newNodes, newEdges)
      if (typeof window !== 'undefined' && currentScreenName) {
        (window as any).__apexGeneratedCode = (window as any).__apexGeneratedCode || {}
        ;(window as any).__apexGeneratedCode[currentScreenName] = generatedCode
      }
      
      setIsSaving(false)
    }, 1500)
  }, [setCurrentFlowchartContent, generateJS, currentScreenName, currentBkyContent, setCurrentBkyContent])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNode && document.activeElement?.tagName !== "INPUT") {
        const newNodes = nodes.filter(n => n.id !== selectedNode)
        const newEdges = edges.filter(e => e.source !== selectedNode && e.target !== selectedNode)
        setNodes(newNodes)
        setEdges(newEdges)
        setSelectedNode(null)
        saveFlowState(newNodes, newEdges)
        toast.success("Elemento removido")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedNode, nodes, edges, saveFlowState])

  // Handler para clique em no (seleciona o no)
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setSelectedNode(nodeId)
    setIsDraggingNode(true)
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({ 
          x: (e.clientX - rect.left - pan.x) / zoom - node.x, 
          y: (e.clientY - rect.top - pan.y) / zoom - node.y 
        })
      }
    }
  }

  // Handler para clique no canvas (inicia pan)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Se clicou no canvas (nao em um no), iniciar pan
    if (e.target === e.currentTarget || (e.target as Element).tagName === 'svg' || (e.target as Element).tagName === 'rect') {
      setSelectedNode(null)
      setIsPanning(true)
      setDragOffset({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (connecting) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setConnecting({
          ...connecting,
          x: (e.clientX - rect.left - pan.x) / zoom,
          y: (e.clientY - rect.top - pan.y) / zoom
        })
      }
      return
    }

    // Pan (arrastar canvas)
    if (isPanning) {
      setPan({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
      return
    }

    // Arrastar no
    if (isDraggingNode && selectedNode) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const newX = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x
        const newY = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y
        setNodes(prev => prev.map(n => 
          n.id === selectedNode 
            ? { ...n, x: newX, y: newY }
            : n
        ))
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const nodeType = e.dataTransfer.getData("nodeType") as Node["type"] | "component"
    const nodeLabel = e.dataTransfer.getData("nodeLabel")
    const compType = e.dataTransfer.getData("compType")

    if (nodeType && nodeLabel) {
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom

      const newNode: Node = {
        id: Date.now().toString(),
        type: nodeType === "component" ? "process" : nodeType,
        label: nodeType === "component" ? `Quando ${nodeLabel}.Clique` : nodeLabel,
        x: x - 75,
        y: y - 30,
        width: 150,
        height: 60,
        metadata: {
          componentName: nodeType === "component" ? nodeLabel : undefined,
          componentType: compType || undefined
        }
      }
      const newNodes = [...nodes, newNode]
      setNodes(newNodes)
      saveFlowState(newNodes, edges)
    }
  }

  const handleMouseUp = () => {
    if (isDraggingNode && selectedNode) {
      // Salvar posicao apos arrastar no
      saveFlowState(nodes, edges)
    }
    setIsDraggingNode(false)
    setIsPanning(false)
    setConnecting(null)
  }

  const startConnection = (e: React.MouseEvent, nodeId: string, isTop: boolean) => {
    e.stopPropagation()
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      const portX = node.x + node.width / 2
      const portY = isTop ? node.y : node.y + node.height
      setConnecting({
        source: nodeId,
        x: portX,
        y: portY
      })
    }
  }

  const endConnection = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation()
    if (connecting && connecting.source !== targetId) {
      // Check if edge already exists
      if (!edges.find(e => e.source === connecting.source && e.target === targetId)) {
        const newEdges = [...edges, {
          id: `e${connecting.source}-${targetId}`,
          source: connecting.source,
          target: targetId
        }]
        setEdges(newEdges)
        saveFlowState(nodes, newEdges)
      }
    }
    setConnecting(null)
  }

  const renderNode = (node: Node) => {
    const isSelected = selectedNode === node.id
    
    let shape = null
    switch (node.type) {
      case "start":
      case "end":
        shape = <rect width={node.width} height={node.height} rx={node.height / 2} ry={node.height / 2} />
        break
      case "decision":
        shape = <polygon points={`0,${node.height/2} ${node.width/2},0 ${node.width},${node.height/2} ${node.width/2},${node.height}`} />
        break
      default:
        shape = <rect width={node.width} height={node.height} rx={8} />
    }

    return (
      <g 
        key={node.id} 
        transform={`translate(${node.x},${node.y})`}
        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
        className={cn(
          "cursor-move transition-shadow duration-300",
          isSelected ? "filter drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]"
        )}
      >
        <g className={cn(
          "fill-secondary/80 stroke-2 transition-colors duration-300",
          isSelected ? "stroke-primary fill-primary/10" : "stroke-white/10 fill-[#1a1a1a]"
        )}>
          {shape}
        </g>
        <text 
          x={node.width / 2} 
          y={node.height / 2} 
          textAnchor="middle" 
          dominantBaseline="middle"
          className={cn(
            "text-[11px] font-semibold pointer-events-none select-none transition-colors",
            isSelected ? "fill-primary" : "fill-white/80"
          )}
        >
          {node.label}
        </text>

        {/* Ports (Transparent Hit Area) */}
        <circle 
          cx={node.width / 2} 
          cy={0} 
          r={12} 
          className="fill-transparent cursor-crosshair"
          onMouseDown={(e) => startConnection(e, node.id, true)}
          onMouseUp={(e) => endConnection(e, node.id)}
        />
        <circle 
          cx={node.width / 2} 
          cy={node.height} 
          r={12} 
          className="fill-transparent cursor-crosshair"
          onMouseDown={(e) => startConnection(e, node.id, false)}
          onMouseUp={(e) => endConnection(e, node.id)}
        />
        
        {/* Visible Ports */}
        <circle 
          cx={node.width / 2} 
          cy={0} 
          r={connecting ? 6 : 4} 
          className={cn(
            "stroke-white/20 pointer-events-none transition-all duration-200",
            connecting ? "fill-emerald-500" : "fill-blue-500"
          )}
        />
        <circle 
          cx={node.width / 2} 
          cy={node.height} 
          r={connecting ? 6 : 4} 
          className={cn(
            "stroke-white/20 pointer-events-none transition-all duration-200",
            connecting ? "fill-emerald-500" : "fill-blue-500"
          )}
        />
      </g>
    )
  }

  const renderEdge = (edge: Edge) => {
    const source = nodes.find(n => n.id === edge.source)
    const target = nodes.find(n => n.id === edge.target)
    if (!source || !target) return null

    const sx = source.x + source.width / 2
    const sy = source.y + source.height
    const tx = target.x + target.width / 2
    const ty = target.y

    const d = `M ${sx} ${sy} C ${sx} ${sy + 40} ${tx} ${ty - 40} ${tx} ${ty}`

    return (
      <g key={edge.id} className="group">
        <path 
          d={d} 
          fill="none" 
          stroke="rgba(255,255,255,0.1)" 
          strokeWidth="6"
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        />
        <path 
          d={d} 
          fill="none" 
          stroke={selectedNode === edge.source || selectedNode === edge.target ? "var(--primary)" : "rgba(255,255,255,0.2)"} 
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
          className="transition-colors duration-300"
        />
        {edge.label && (
          <g transform={`translate(${(sx + tx) / 2},${(sy + ty) / 2})`}>
            <rect x="-20" y="-10" width="40" height="20" rx="10" fill="#0a0a0a" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
            <text textAnchor="middle" dominantBaseline="middle" className="fill-white/60 text-[9px] font-medium">{edge.label}</text>
          </g>
        )}
      </g>
    )
  }

  // Adicionar no via click no botao de elementos
  const addNodeAtCenter = (type: Node["type"], label: string) => {
    const newNode: Node = {
      id: Date.now().toString(),
      type: type,
      label: label,
      x: (-pan.x / zoom) + 300,
      y: (-pan.y / zoom) + 200,
      width: type === 'decision' ? 100 : 140,
      height: type === 'decision' ? 100 : 50
    }
    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    saveFlowState(newNodes, edges)
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden select-none relative animate-in fade-in duration-500">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Carregando fluxo...</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/5 flex flex-col gap-1 shadow-2xl">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-lg text-muted-foreground"
            title="Arrastar canvas para navegar"
            disabled
          >
            <Hand className="w-4 h-4" />
          </Button>
          <div className="h-px bg-white/5 mx-2 my-1" />
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:text-primary transition-colors">
            <GitMerge className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/5 flex flex-col gap-1 shadow-2xl">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-lg"
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-lg"
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-lg"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Floating Status Card */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3 shadow-2xl">
          <div className={cn(
            "w-2 h-2 rounded-full shadow-glow-primary",
            isSaving ? "bg-amber-500 animate-pulse" : "bg-primary animate-pulse"
          )} />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              {isSaving ? "Salvando..." : nodes.length === 0 ? "Sem blocos" : "Modo Fluxograma"}
            </span>
            <span className="text-[9px] text-muted-foreground font-mono">
              Zoom: {Math.round(zoom * 100)}% | {nodes.length} nos
            </span>
          </div>
        </div>
      </div>

      {/* Node Templates Rail */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 flex items-center gap-2 shadow-2xl">
          <div className="px-2 py-1 flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest border-r border-white/10 mr-1">
            <Workflow className="w-3 h-3" />
            Elementos
          </div>
          {[
            { type: 'start' as const, icon: Circle, label: 'Inicio/Fim' },
            { type: 'process' as const, icon: Square, label: 'Processo' },
            { type: 'decision' as const, icon: Diamond, label: 'Decisao' },
            { type: 'database' as const, icon: Database, label: 'Banco' },
            { type: 'action' as const, icon: Terminal, label: 'E/S' },
          ].map(item => (
            <button
              key={item.type}
              className="group relative flex flex-col items-center p-2 rounded-xl hover:bg-white/5 transition-all"
              onClick={() => addNodeAtCenter(item.type, item.label)}
            >
              <item.icon className="w-4 h-4 text-white/60 group-hover:text-primary transition-colors" />
              <span className="absolute -top-8 bg-black border border-white/10 px-2 py-1 rounded text-[8px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Canvas - arrastar no canvas automaticamente faz pan */}
      <div 
        ref={containerRef}
        className={cn(
          "flex-1 relative overflow-hidden bg-grid-pattern",
          isPanning ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <svg className="w-full h-full">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.4)" />
            </marker>
          </defs>
          
          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Grid Helper (Interactive) */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            <rect width="10000" height="10000" fill="url(#grid)" x="-5000" y="-5000" />

            {edges.map(renderEdge)}
            {nodes.map(renderNode)}

            {/* Active connection line */}
            {connecting && (
              <g>
                {(() => {
                  const sourceNode = nodes.find(n => n.id === connecting.source)
                  if (!sourceNode) return null
                  const sourceX = sourceNode.x + sourceNode.width / 2
                  // Determine if we started from top or bottom port based on connecting.y
                  const sourceY = Math.abs(connecting.y - sourceNode.y) < 5 ? sourceNode.y : sourceNode.y + sourceNode.height
                  
                  return (
                    <g className="pointer-events-none">
                      <path 
                        d={`M ${sourceX} ${sourceY} C ${sourceX} ${sourceY + (sourceY > sourceNode.y ? 40 : -40)} ${connecting.x} ${connecting.y + (sourceY > sourceNode.y ? -40 : 40)} ${connecting.x} ${connecting.y}`}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="3"
                        strokeDasharray="6,4"
                        className="animate-pulse"
                      />
                      <circle cx={connecting.x} cy={connecting.y} r="8" className="fill-emerald-500 animate-ping opacity-20" />
                      <circle cx={connecting.x} cy={connecting.y} r="4" className="fill-emerald-500" />
                    </g>
                  )
                })()}
              </g>
            )}
          </g>
        </svg>

        {/* Selected Node Controls (Floating) */}
        {selectedNode && nodes.find(n => n.id === selectedNode) && (
          <div 
            className="absolute z-[100] flex gap-1 pointer-events-none"
            style={{ 
              left: (nodes.find(n => n.id === selectedNode)!.x * zoom + pan.x),
              top: (nodes.find(n => n.id === selectedNode)!.y * zoom + pan.y - 50)
            }}
          >
            <div className="bg-black/90 backdrop-blur-md p-1.5 rounded-xl border border-white/20 flex gap-1 shadow-2xl pointer-events-auto scale-110 animate-in zoom-in-50 duration-200">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:bg-destructive/20 rounded-lg"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  const newNodes = nodes.filter(n => n.id !== selectedNode)
                  const newEdges = edges.filter(e => e.source !== selectedNode && e.target !== selectedNode)
                  setNodes(newNodes)
                  setEdges(newEdges)
                  setSelectedNode(null)
                  setCurrentFlowchartContent(JSON.stringify({ nodes: newNodes, edges: newEdges }))
                  toast.success("Elemento removido")
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Properties Panel (Right Sidebar) */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bottom-4 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl z-40 flex flex-col shadow-2xl animate-in slide-in-from-right-4 duration-300">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">Configuração</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNode(null)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-6">
            {/* Label Edit */}
            <div className="space-y-2">
              <Label className="text-[9px] uppercase font-bold text-muted-foreground">Etiqueta do Nó</Label>
              <Input 
                value={nodes.find(n => n.id === selectedNode)?.label || ""}
                onChange={(e) => {
                  setNodes(nodes.map(n => n.id === selectedNode ? { ...n, label: e.target.value } : n))
                }}
                className="h-8 text-xs bg-white/5 border-white/10"
              />
            </div>

            {/* Special Action Configs */}
            {nodes.find(n => n.id === selectedNode)?.label === "Abrir Tela" && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Destino (Tela)</Label>
                <Select 
                  value={nodes.find(n => n.id === selectedNode)?.metadata?.targetScreen || ""}
                  onValueChange={(val) => {
                    setNodes(nodes.map(n => n.id === selectedNode ? { 
                      ...n, 
                      metadata: { ...n.metadata, targetScreen: val } 
                    } : n))
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10">
                    <SelectValue placeholder="Selecionar tela..." />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                    {screenFiles.map(screen => (
                      <SelectItem key={screen.name} value={screen.name} className="text-xs">
                        {screen.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2 mt-2">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] text-primary/80 font-medium">Vai abrir a tela quando o evento anterior for disparado.</span>
                </div>
              </div>
            )}

            {/* Metadata Info */}
            <div className="pt-4 border-t border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-muted-foreground uppercase font-bold">Informações Técnicas</span>
                <div className="bg-white/5 p-2 rounded text-[9px] font-mono text-white/40 space-y-1">
                  <div>ID: {selectedNode}</div>
                  <div>Tipo: {nodes.find(n => n.id === selectedNode)?.type}</div>
                  {nodes.find(n => n.id === selectedNode)?.metadata?.componentName && (
                    <div>Componente: {nodes.find(n => n.id === selectedNode)?.metadata?.componentName}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-white/5 bg-white/5 space-y-2">
            <Button className="w-full h-8 text-[10px] font-bold uppercase shine" onClick={() => setSelectedNode(null)}>
              Aplicar Mudanças
            </Button>
            <Button 
              variant="destructive" 
              className="w-full h-8 text-[10px] font-bold uppercase"
              onClick={() => {
                const newNodes = nodes.filter(n => n.id !== selectedNode)
                const newEdges = edges.filter(e => e.source !== selectedNode && e.target !== selectedNode)
                setNodes(newNodes)
                setEdges(newEdges)
                setSelectedNode(null)
                setCurrentFlowchartContent(JSON.stringify({ nodes: newNodes, edges: newEdges }))
                toast.success("Elemento removido")
              }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Remover Elemento
            </Button>
          </div>
        </div>
      )}

      <style jsx>{`
        .bg-grid-pattern {
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
          background-color: #050505;
        }
        .shadow-glow-primary {
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  )
}
