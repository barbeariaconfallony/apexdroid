"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { 
  Workflow, Plus, Save, Trash2, ZoomIn, ZoomOut, 
  RefreshCw, Hand, GitMerge, Square, 
  Circle, Diamond, Database, Terminal, Settings2,
  ChevronRight, ChevronDown, Smartphone, Loader2, X, Zap, Cog, Play
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
import { 
  getBlocksCatalogForComponent, 
  getEventsForComponent, 
  getMethodsForComponent, 
  getPropertiesForComponent,
  type KodularBlockDef 
} from "@/lib/kodular-blocks-catalog"

interface Edge {
  id: string
  source: string
  target: string
  label?: string
}

interface NodeFunction {
  id: string
  type: "event" | "method" | "property_get" | "property_set"
  name: string
  label: string
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
    functions?: NodeFunction[]
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
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ events: true, methods: false, properties: false })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)
  const lastBkyRef = useRef<string | null>(null)

  // Carregar estado inicial a partir do bky da tela atual
  useEffect(() => {
    const screenBky = screens[currentScreenName || ""]?.bkyContent || currentBkyContent
    
    if (screenBky === lastBkyRef.current && nodes.length > 0) {
      return
    }
    
    setIsLoading(true)
    
    if (screenBky && screenBky.trim().startsWith('<xml')) {
      lastBkyRef.current = screenBky
      const { nodes: convertedNodes, edges: convertedEdges } = convertBkyToFlow(screenBky)
      
      if (convertedNodes.length > 0) {
        setNodes(convertedNodes)
        setEdges(convertedEdges)
      } else {
        setNodes([])
        setEdges([])
      }
      setIsLoading(false)
      return
    }
    
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
    
    setNodes([])
    setEdges([])
    lastBkyRef.current = null
    setIsLoading(false)
  }, [currentBkyContent, currentScreenName, screens])

  // Gerar codigo JavaScript a partir do fluxo
  const generateJS = useCallback((nodes: Node[], edges: Edge[]) => {
    let code = "/** Codigo Gerado via Fluxograma **/\n\n"
    
    const eventNodes = nodes.filter(n => n.metadata?.componentName)
    
    eventNodes.forEach(node => {
      const compName = node.metadata?.componentName
      const functions = node.metadata?.functions || []
      
      functions.filter(f => f.type === 'event').forEach(func => {
        code += `__runtime.on('${compName}', '${func.name}', function() {\n`
        
        let currentEdge = edges.find(e => e.source === node.id)
        while (currentEdge) {
          const targetNode = nodes.find(n => n.id === currentEdge!.target)
          if (!targetNode) break
          
          if (targetNode.label === "Abrir Tela" && targetNode.metadata?.targetScreen) {
            code += `  __runtime.openScreen('${targetNode.metadata.targetScreen}');\n`
          } else if (targetNode.metadata?.functions?.some(f => f.type === 'method')) {
            const methods = targetNode.metadata.functions.filter(f => f.type === 'method')
            methods.forEach(m => {
              code += `  __runtime.call('${targetNode.metadata?.componentName}', '${m.name}', []);\n`
            })
          }
          
          currentEdge = edges.find(e => e.source === targetNode.id)
        }
        
        code += `});\n\n`
      })
    })
    
    return code
  }, [])

  // Auto-save e Sincronizacao
  const saveFlowState = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    
    saveTimeout.current = setTimeout(async () => {
      setIsSaving(true)
      const content = JSON.stringify({ nodes: newNodes, edges: newEdges })
      setCurrentFlowchartContent(content)

      if (newNodes.length > 0) {
        const generatedBky = convertFlowToBky(newNodes, newEdges)
        if (generatedBky !== currentBkyContent) {
          setCurrentBkyContent(generatedBky)
          lastBkyRef.current = generatedBky
        }
      }

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
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNode && document.activeElement?.tagName !== "INPUT" && !configModalOpen) {
        const newNodes = nodes.filter(n => n.id !== selectedNode)
        const newEdges = edges.filter(e => e.source !== selectedNode && e.target !== selectedNode)
        setNodes(newNodes)
        setEdges(newEdges)
        setSelectedNode(null)
        saveFlowState(newNodes, newEdges)
        toast.success("Elemento removido")
      }
      if (e.key === "Escape") {
        setConfigModalOpen(false)
        setSelectedNode(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedNode, nodes, edges, saveFlowState, configModalOpen])

  // Handler para clique em no - abre modal de configuracao
  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setSelectedNode(nodeId)
    setConfigModalOpen(true)
  }

  // Handler para arrastar no
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
    if (e.target === e.currentTarget || (e.target as Element).tagName === 'svg' || (e.target as Element).tagName === 'rect') {
      setSelectedNode(null)
      setConfigModalOpen(false)
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

    if (isPanning) {
      setPan({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
      return
    }

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
        label: nodeLabel,
        x: x - 100,
        y: y - 40,
        width: 200,
        height: 80,
        metadata: {
          componentName: nodeType === "component" ? nodeLabel : undefined,
          componentType: compType || undefined,
          functions: []
        }
      }
      const newNodes = [...nodes, newNode]
      setNodes(newNodes)
      saveFlowState(newNodes, edges)
    }
  }

  const handleMouseUp = () => {
    if (isDraggingNode && selectedNode) {
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

  // Adicionar funcao ao no selecionado
  const addFunctionToNode = (func: KodularBlockDef) => {
    if (!selectedNode) return
    
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNode) {
        const existingFunctions = n.metadata?.functions || []
        const alreadyExists = existingFunctions.some(f => f.name === func.name && f.type === func.type)
        if (alreadyExists) {
          toast.error("Funcao ja adicionada")
          return n
        }
        const newFunction: NodeFunction = {
          id: Date.now().toString(),
          type: func.type,
          name: func.name,
          label: func.label
        }
        return {
          ...n,
          metadata: {
            ...n.metadata,
            functions: [...existingFunctions, newFunction]
          }
        }
      }
      return n
    }))
    toast.success(`${func.label} adicionado`)
  }

  // Remover funcao do no
  const removeFunctionFromNode = (funcId: string) => {
    if (!selectedNode) return
    
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNode) {
        return {
          ...n,
          metadata: {
            ...n.metadata,
            functions: (n.metadata?.functions || []).filter(f => f.id !== funcId)
          }
        }
      }
      return n
    }))
    toast.success("Funcao removida")
  }

  // Renderizar no com nome do componente e subtitulo
  const renderNode = (node: Node) => {
    const isSelected = selectedNode === node.id
    const componentName = node.metadata?.componentName || node.label
    const functions = node.metadata?.functions || []
    const primaryFunction = functions[0]
    const functionCount = functions.length
    
    // Calcular altura dinamica baseada nas funcoes
    const baseHeight = 80
    const nodeHeight = baseHeight
    const nodeWidth = 200
    
    let shape = null
    switch (node.type) {
      case "start":
      case "end":
        shape = <rect width={nodeWidth} height={nodeHeight} rx={nodeHeight / 2} ry={nodeHeight / 2} />
        break
      case "decision":
        shape = <polygon points={`0,${nodeHeight/2} ${nodeWidth/2},0 ${nodeWidth},${nodeHeight/2} ${nodeWidth/2},${nodeHeight}`} />
        break
      default:
        shape = <rect width={nodeWidth} height={nodeHeight} rx={12} />
    }

    return (
      <g 
        key={node.id} 
        transform={`translate(${node.x},${node.y})`}
        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
        onClick={(e) => handleNodeClick(e, node.id)}
        className={cn(
          "cursor-pointer transition-all duration-300",
          isSelected ? "filter drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]" : "filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
        )}
      >
        {/* Background shape */}
        <g className={cn(
          "stroke-2 transition-colors duration-300",
          isSelected ? "stroke-primary fill-primary/15" : "stroke-white/10 fill-[#141414]"
        )}>
          {shape}
        </g>

        {/* Component name (main label) */}
        <text 
          x={nodeWidth / 2} 
          y={functionCount > 0 ? 28 : nodeHeight / 2} 
          textAnchor="middle" 
          dominantBaseline="middle"
          className={cn(
            "text-[12px] font-bold pointer-events-none select-none transition-colors",
            isSelected ? "fill-primary" : "fill-white"
          )}
        >
          {componentName.length > 20 ? componentName.substring(0, 18) + '...' : componentName}
        </text>

        {/* Function subtitle */}
        {primaryFunction && (
          <text 
            x={nodeWidth / 2} 
            y={48} 
            textAnchor="middle" 
            dominantBaseline="middle"
            className="text-[10px] fill-white/50 pointer-events-none select-none font-medium"
          >
            {primaryFunction.label}
            {functionCount > 1 && ` +${functionCount - 1}`}
          </text>
        )}

        {/* Function count badge */}
        {functionCount > 0 && (
          <g transform={`translate(${nodeWidth - 24}, 8)`}>
            <circle cx="12" cy="12" r="10" className="fill-primary/20 stroke-primary/40 stroke-1" />
            <text x="12" y="12" textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-primary font-bold pointer-events-none">
              {functionCount}
            </text>
          </g>
        )}

        {/* Component type badge */}
        {node.metadata?.componentType && (
          <g transform={`translate(8, ${nodeHeight - 20})`}>
            <rect width="auto" height="14" rx="4" className="fill-white/5" />
            <text x="4" y="10" className="text-[8px] fill-white/40 font-mono pointer-events-none uppercase">
              {node.metadata.componentType}
            </text>
          </g>
        )}

        {/* Connection Ports */}
        <circle 
          cx={nodeWidth / 2} 
          cy={0} 
          r={12} 
          className="fill-transparent cursor-crosshair"
          onMouseDown={(e) => startConnection(e, node.id, true)}
          onMouseUp={(e) => endConnection(e, node.id)}
        />
        <circle 
          cx={nodeWidth / 2} 
          cy={nodeHeight} 
          r={12} 
          className="fill-transparent cursor-crosshair"
          onMouseDown={(e) => startConnection(e, node.id, false)}
          onMouseUp={(e) => endConnection(e, node.id)}
        />
        
        {/* Visible Ports */}
        <circle 
          cx={nodeWidth / 2} 
          cy={0} 
          r={connecting ? 7 : 5} 
          className={cn(
            "stroke-white/30 pointer-events-none transition-all duration-200",
            connecting ? "fill-emerald-500" : "fill-blue-500"
          )}
        />
        <circle 
          cx={nodeWidth / 2} 
          cy={nodeHeight} 
          r={connecting ? 7 : 5} 
          className={cn(
            "stroke-white/30 pointer-events-none transition-all duration-200",
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

    const d = `M ${sx} ${sy} C ${sx} ${sy + 50} ${tx} ${ty - 50} ${tx} ${ty}`

    return (
      <g key={edge.id} className="group">
        <path 
          d={d} 
          fill="none" 
          stroke="rgba(255,255,255,0.1)" 
          strokeWidth="8"
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        />
        <path 
          d={d} 
          fill="none" 
          stroke={selectedNode === edge.source || selectedNode === edge.target ? "var(--primary)" : "rgba(255,255,255,0.25)"} 
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
          className="transition-colors duration-300"
        />
      </g>
    )
  }

  const addNodeAtCenter = (type: Node["type"], label: string) => {
    const newNode: Node = {
      id: Date.now().toString(),
      type: type,
      label: label,
      x: (-pan.x / zoom) + 300,
      y: (-pan.y / zoom) + 200,
      width: 200,
      height: 80,
      metadata: { functions: [] }
    }
    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    saveFlowState(newNodes, edges)
  }

  // Obter o no selecionado
  const selectedNodeData = nodes.find(n => n.id === selectedNode)
  const selectedComponentType = selectedNodeData?.metadata?.componentType || 'default'

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

      {/* Editor Canvas */}
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
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            <rect width="10000" height="10000" fill="url(#grid)" x="-5000" y="-5000" />

            {edges.map(renderEdge)}
            {nodes.map(renderNode)}

            {connecting && (
              <g>
                {(() => {
                  const sourceNode = nodes.find(n => n.id === connecting.source)
                  if (!sourceNode) return null
                  const sourceX = sourceNode.x + sourceNode.width / 2
                  const sourceY = Math.abs(connecting.y - sourceNode.y) < 5 ? sourceNode.y : sourceNode.y + sourceNode.height
                  
                  return (
                    <g className="pointer-events-none">
                      <path 
                        d={`M ${sourceX} ${sourceY} C ${sourceX} ${sourceY + (sourceY > sourceNode.y ? 50 : -50)} ${connecting.x} ${connecting.y + (sourceY > sourceNode.y ? -50 : 50)} ${connecting.x} ${connecting.y}`}
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

        {/* Floating Delete Button */}
        {selectedNode && !configModalOpen && selectedNodeData && (
          <div 
            className="absolute z-[100] pointer-events-none"
            style={{ 
              left: (selectedNodeData.x * zoom + pan.x),
              top: (selectedNodeData.y * zoom + pan.y - 50)
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
                  saveFlowState(newNodes, newEdges)
                  toast.success("Elemento removido")
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {configModalOpen && selectedNodeData && (
        <div className="absolute top-4 right-4 bottom-4 w-80 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl z-40 flex flex-col shadow-2xl animate-in slide-in-from-right-4 duration-300 overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">Configuracao</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setConfigModalOpen(false)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 space-y-6">
              {/* Label Edit */}
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Etiqueta do No</Label>
                <Input 
                  value={selectedNodeData.label}
                  onChange={(e) => {
                    setNodes(nodes.map(n => n.id === selectedNode ? { ...n, label: e.target.value } : n))
                  }}
                  className="h-9 text-xs bg-white/5 border-white/10"
                />
              </div>

              {/* Metadata Info */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Informacoes Tecnicas</span>
                <div className="bg-white/5 p-3 rounded-lg text-[10px] font-mono text-white/50 space-y-1">
                  <div>ID: {selectedNode}</div>
                  <div>Tipo: {selectedNodeData.type}</div>
                  {selectedNodeData.metadata?.componentName && (
                    <div>Componente: {selectedNodeData.metadata.componentName}</div>
                  )}
                  {selectedNodeData.metadata?.componentType && (
                    <div>Tipo Comp: {selectedNodeData.metadata.componentType}</div>
                  )}
                </div>
              </div>

              {/* Current Functions */}
              {(selectedNodeData.metadata?.functions?.length || 0) > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Funcoes Adicionadas</span>
                  <div className="space-y-1">
                    {selectedNodeData.metadata?.functions?.map(func => (
                      <div 
                        key={func.id}
                        className="flex items-center justify-between p-2 bg-primary/10 border border-primary/20 rounded-lg group"
                      >
                        <div className="flex items-center gap-2">
                          {func.type === 'event' && <Zap className="w-3 h-3 text-amber-500" />}
                          {func.type === 'method' && <Play className="w-3 h-3 text-emerald-500" />}
                          {(func.type === 'property_get' || func.type === 'property_set') && <Cog className="w-3 h-3 text-blue-500" />}
                          <span className="text-[10px] text-white font-medium">{func.label}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/20"
                          onClick={() => removeFunctionFromNode(func.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Functions - Organized by Type */}
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Adicionar Funcoes</span>
                
                {/* Events Section */}
                <div className="border border-white/5 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, events: !prev.events }))}
                    className="w-full flex items-center justify-between p-2 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-500 uppercase">Eventos</span>
                    </div>
                    {expandedSections.events ? <ChevronDown className="w-3 h-3 text-amber-500" /> : <ChevronRight className="w-3 h-3 text-amber-500" />}
                  </button>
                  {expandedSections.events && (
                    <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
                      {getEventsForComponent(selectedComponentType).map(event => (
                        <button
                          key={event.name}
                          onClick={() => addFunctionToNode(event)}
                          className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-white/5 transition-colors text-left"
                        >
                          <Plus className="w-3 h-3 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-white">{event.label}</span>
                            {event.description && (
                              <span className="text-[8px] text-muted-foreground">{event.description}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Methods Section */}
                <div className="border border-white/5 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, methods: !prev.methods }))}
                    className="w-full flex items-center justify-between p-2 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Play className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">Metodos</span>
                    </div>
                    {expandedSections.methods ? <ChevronDown className="w-3 h-3 text-emerald-500" /> : <ChevronRight className="w-3 h-3 text-emerald-500" />}
                  </button>
                  {expandedSections.methods && (
                    <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
                      {getMethodsForComponent(selectedComponentType).length > 0 ? (
                        getMethodsForComponent(selectedComponentType).map(method => (
                          <button
                            key={method.name}
                            onClick={() => addFunctionToNode(method)}
                            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-white/5 transition-colors text-left"
                          >
                            <Plus className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-white">{method.label}</span>
                          </button>
                        ))
                      ) : (
                        <p className="text-[9px] text-muted-foreground p-2 italic">Nenhum metodo disponivel</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Properties Section */}
                <div className="border border-white/5 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, properties: !prev.properties }))}
                    className="w-full flex items-center justify-between p-2 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Cog className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] font-bold text-blue-500 uppercase">Propriedades</span>
                    </div>
                    {expandedSections.properties ? <ChevronDown className="w-3 h-3 text-blue-500" /> : <ChevronRight className="w-3 h-3 text-blue-500" />}
                  </button>
                  {expandedSections.properties && (
                    <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
                      {getPropertiesForComponent(selectedComponentType).map(prop => (
                        <button
                          key={`${prop.type}-${prop.name}`}
                          onClick={() => addFunctionToNode(prop)}
                          className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-white/5 transition-colors text-left"
                        >
                          <Plus className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-white">{prop.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Target Screen (for navigation nodes) */}
              {selectedNodeData.label === "Abrir Tela" && (
                <div className="space-y-2 animate-in fade-in duration-300">
                  <Label className="text-[9px] uppercase font-bold text-muted-foreground">Destino (Tela)</Label>
                  <Select 
                    value={selectedNodeData.metadata?.targetScreen || ""}
                    onValueChange={(val) => {
                      setNodes(nodes.map(n => n.id === selectedNode ? { 
                        ...n, 
                        metadata: { ...n.metadata, targetScreen: val } 
                      } : n))
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs bg-white/5 border-white/10">
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
                    <span className="text-[10px] text-primary/80 font-medium">Abrira a tela quando o evento anterior for disparado.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 p-4 border-t border-white/5 bg-white/5 space-y-2">
            <Button 
              className="w-full h-9 text-[10px] font-bold uppercase shine" 
              onClick={() => {
                saveFlowState(nodes, edges)
                setConfigModalOpen(false)
                toast.success("Mudancas aplicadas")
              }}
            >
              Aplicar Mudancas
            </Button>
            <Button 
              variant="destructive" 
              className="w-full h-9 text-[10px] font-bold uppercase"
              onClick={() => {
                const newNodes = nodes.filter(n => n.id !== selectedNode)
                const newEdges = edges.filter(e => e.source !== selectedNode && e.target !== selectedNode)
                setNodes(newNodes)
                setEdges(newEdges)
                setSelectedNode(null)
                setConfigModalOpen(false)
                saveFlowState(newNodes, newEdges)
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
