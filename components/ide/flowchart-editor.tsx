"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { 
  Workflow, Plus, Save, Trash2, ZoomIn, ZoomOut, 
  RefreshCw, Hand, GitMerge, Square, 
  Circle, Diamond, Database, Terminal, Settings2,
  ChevronRight, ChevronDown, Smartphone, Loader2, X, Zap, Cog, Play, CloudUpload,
  Layers, Box, Variable, Cpu, Code2, Type, ImageIcon, Sparkles, Send, Wand2, AlertCircle, CheckCircle2, Download
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
import { bkySyncService } from "@/lib/bky-sync-service"
import { updateFileContent, fetchFileContent } from "@/lib/github-service"
import { 
  getBlocksCatalogForComponent, 
  getEventsForComponent, 
  getMethodsForComponent, 
  getPropertiesForComponent,
  getActionsForComponent,
  type KodularBlockDef 
} from "@/lib/kodular-blocks-catalog"
import type { KodularComponent } from "@/lib/ide-types"

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
  value?: any
  inputType?: "text" | "number" | "boolean" | "color" | "choice"
  options?: { label: string; value: string }[]
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
    bkyType?: string
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
    setBkyContent,
    screens,
    currentProject,
    ghToken,
    selectedRepo,
    setSelectedComponent,
    findComponent,
    updateComponent,
    aiSettings,
    bkySyncSource,
    bkySyncTimestamp
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ events: true, methods: false, properties: false, actions: true })
  const [isApplying, setIsApplying] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle")
  const [aiPromptOpen, setAiPromptOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)
  const lastBkyRef = useRef<string | null>(null)

  // Carregar estado inicial a partir do bky da tela atual
  useEffect(() => {
    const screenBky = screens[currentScreenName || ""]?.bkyContent || currentBkyContent
    
    // Tentar carregar do localStorage primeiro se for a mesma sessão
    const saved = localStorage.getItem(`flow_${selectedRepo?.name}_${currentScreenName}`)
    if (saved) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved)
        setNodes(savedNodes)
        setEdges(savedEdges)
        lastBkyRef.current = screenBky
        return
      } catch (e) {
        console.error("Erro ao carregar fluxo do localStorage", e)
      }
    }

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

  // Listener para sincronização vinda de outras abas (Blocks ou Code Editor)
  useEffect(() => {
    // Se a origem da sincronização não foi o fluxograma, recarregar os nós
    if (bkySyncSource && bkySyncSource !== 'flowchart' && currentBkyContent && currentScreenName) {
      console.log(`[FlowchartEditor] Recarregando fluxo - origem: ${bkySyncSource}`)
      
      if (currentBkyContent.trim().startsWith('<xml')) {
        const { nodes: convertedNodes, edges: convertedEdges } = convertBkyToFlow(currentBkyContent)
        
        if (convertedNodes.length > 0) {
          setNodes(convertedNodes)
          setEdges(convertedEdges)
          lastBkyRef.current = currentBkyContent
          
          // Atualizar localStorage
          if (selectedRepo) {
            const content = JSON.stringify({ nodes: convertedNodes, edges: convertedEdges })
            localStorage.setItem(`flow_${selectedRepo.name}_${currentScreenName}`, content)
          }
        }
      }
    }
  }, [bkySyncTimestamp, bkySyncSource, currentBkyContent, currentScreenName, selectedRepo])

  // Gerar codigo JavaScript a partir do fluxo
  const generateJS = useCallback((nodes: Node[], edges: Edge[]) => {
    let code = "/** Codigo Gerado via Fluxograma **/\n\n"
    
    const eventNodes = nodes.filter(n => n.metadata?.functions?.some(f => f.type === 'event'))
    
    eventNodes.forEach(node => {
      const compName = node.metadata?.componentName
      const functions = node.metadata?.functions || []
      
      functions.filter(f => f.type === 'event').forEach(func => {
        code += `__runtime.on('${compName}', '${func.name}', function() {\n`
        
        let currentEdge = edges.find(e => e.source === node.id)
        while (currentEdge) {
          const targetNode = nodes.find(n => n.id === currentEdge!.target)
          if (!targetNode) break
          
          // Suporte a bkyType ou label literal
          const bkyType = targetNode.metadata?.bkyType
          
          if (bkyType === 'controls_openAnotherScreen' || (targetNode.label === "Abrir Tela" && targetNode.metadata?.targetScreen)) {
            const screen = targetNode.metadata?.targetScreen || 'Screen1'
            code += `  __runtime.openScreen('${screen}');\n`
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
  const saveFlowState = useCallback((newNodes: Node[], newEdges: Edge[], immediate = false) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    
    const runSave = () => {
      setIsSaving(true)
      const content = JSON.stringify({ nodes: newNodes, edges: newEdges })
      setCurrentFlowchartContent(content)

      if (currentScreenName && selectedRepo) {
        localStorage.setItem(`flow_${selectedRepo.name}_${currentScreenName}`, content)
      }

      if (newNodes.length > 0) {
        const generatedBky = convertFlowToBky(newNodes, newEdges)
        if (generatedBky !== currentBkyContent) {
          // Usar o novo sistema de sincronização
          setBkyContent(generatedBky, 'flowchart')
          lastBkyRef.current = generatedBky
          
          // Notificar o serviço centralizado
          if (currentScreenName) {
            bkySyncService.updateFromBkyXml(currentScreenName, generatedBky, 'flowchart')
          }
        }
      }

      const generatedCode = generateJS(newNodes, newEdges)
      if (typeof window !== 'undefined' && currentScreenName) {
        (window as any).__apexGeneratedCode = (window as any).__apexGeneratedCode || {}
        ;(window as any).__apexGeneratedCode[currentScreenName] = generatedCode
      }
      
      setIsSaving(false)
    }

    if (immediate) {
      runSave()
    } else {
      saveTimeout.current = setTimeout(runSave, 1500)
    }
  }, [setCurrentFlowchartContent, generateJS, currentScreenName, currentBkyContent, setBkyContent, selectedRepo])

  // Sincronizar todos os componentes do projeto como nos
  const syncProjectComponents = useCallback(() => {
    if (!currentProject) return
    
    const projectComponents: any[] = []
    const flatten = (comp: any) => {
      if (!comp) return
      projectComponents.push(comp)
      if (comp.$Components) comp.$Components.forEach(flatten)
    }
    flatten(currentProject.Properties)
    
    const existingNames = new Set(nodes.map(n => n.metadata?.componentName).filter(Boolean))
    const newNodes = [...nodes]
    
    projectComponents.forEach((comp, idx) => {
      if (!existingNames.has(comp.$Name)) {
        const simpleType = comp.$Type?.includes(".") ? comp.$Type.split(".").pop() : comp.$Type
        newNodes.push({
          id: `comp-${comp.$Name}-${Date.now()}`,
          type: "process",
          label: comp.$Name,
          x: 100,
          y: 100 + (existingNames.size + idx) * 100,
          width: 200,
          height: 80,
          metadata: {
            componentName: comp.$Name,
            componentType: simpleType,
            functions: []
          }
        })
      }
    })
    
    setNodes(newNodes)
    saveFlowState(newNodes, edges)
    toast.success("Componentes sincronizados")
  }, [currentProject, nodes, edges, saveFlowState])

  const handleApplyChanges = async () => {
    if (!ghToken || !selectedRepo || !currentScreenName) {
      toast.error("GitHub não conectado ou projeto não selecionado")
      return
    }

    setIsApplying(true)
    const toastId = toast.loading("Gerando lógica e enviando para o GitHub...")

    try {
      // 1. Gerar o XML BKY do fluxo atual
      const bkyXml = convertFlowToBky(nodes, edges)
      const bkyPath = `assets/bky/${currentScreenName}.bky`

      // 2. Obter o SHA atual do arquivo BKY se existir
      let sha = ""
      try {
        const file = await fetchFileContent(ghToken, selectedRepo.owner.login, selectedRepo.name, bkyPath)
        sha = file.sha
      } catch (e) {
        console.log("Arquivo Bky novo ou não encontrado no GitHub, tentando criar...")
      }

      // 3. Atualizar no GitHub
      await updateFileContent(
        ghToken,
        selectedRepo.owner.login,
        selectedRepo.name,
        bkyPath,
        bkyXml,
        sha,
        `Update blocks for screen ${currentScreenName} via APEX Flowchart`
      )

      // 4. Atualizar o store local usando o novo sistema de sincronização
      setBkyContent(bkyXml, 'flowchart')
      
      // Notificar o serviço centralizado
      bkySyncService.updateFromBkyXml(currentScreenName, bkyXml, 'flowchart')
      
      setLastSyncTime(new Date())
      setSyncStatus("success")
      toast.success("Logica aplicada com sucesso no GitHub!", { id: toastId })
    } catch (error: any) {
      console.error("Error applying changes:", error)
      setSyncStatus("error")
      toast.error(`Erro ao aplicar logica: ${error.message}`, { id: toastId })
    } finally {
      setIsApplying(false)
    }
  }

  // Gerar fluxo com IA
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return
    setIsGeneratingAI(true)
    const toastId = toast.loading("IA analisando e gerando fluxo...")

    try {
      const response = await fetch("/api/ai/generate-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          screenName: currentScreenName,
          existingComponents: currentProject?.Properties?.$Components?.map(c => ({ name: c.$Name, type: c.$Type })) || [],
          settings: aiSettings
        })
      })

      const data = await response.json()
      if (data.nodes && data.edges) {
        setNodes(data.nodes)
        setEdges(data.edges)
        saveFlowState(data.nodes, data.edges)
        toast.success("Fluxo gerado com sucesso!", { id: toastId })
        setAiPromptOpen(false)
        setAiPrompt("")
      } else {
        throw new Error(data.error || "Formato invalido da IA")
      }
    } catch (error: any) {
      console.error("AI Error:", error)
      toast.error(`Falha na IA: ${error.message}`, { id: toastId })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Analisar fluxo com IA
  const handleAnalyzeFlow = async () => {
    if (nodes.length === 0) return
    setIsAnalyzing(true)
    const toastId = toast.loading("IA analisando seu fluxograma...")

    try {
      const response = await fetch("/api/ai/analyze-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes,
          edges,
          settings: aiSettings
        })
      })

      const data = await response.json()
      if (data.analysis) {
        setAnalysisResult(data.analysis)
        toast.success("Analise concluida!", { id: toastId })
      } else {
        throw new Error("Falha na analise")
      }
    } catch (error: any) {
      toast.error(`Erro na analise: ${error.message}`, { id: toastId })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Otimizar disposicao (Auto-layout)
  const handleAutoLayout = () => {
    if (nodes.length === 0) return
    toast.info("Otimizando layout...")

    const GRID_SIZE = 20
    const levelMap = new Map<string, number>()
    
    // Identificar raizes (nos sem entradas)
    const roots = nodes.filter(n => !edges.some(e => e.target === n.id))
    
    const queue: { id: string, level: number }[] = roots.map(r => ({ id: r.id, level: 0 }))
    const visited = new Set<string>()

    // Se houver ciclos ou nós soltos, garante que todos sejam visitados
    if (roots.length === 0) {
      queue.push({ id: nodes[0].id, level: 0 })
    }

    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      if (visited.has(id)) continue
      
      visited.add(id)
      levelMap.set(id, Math.max(levelMap.get(id) || 0, level))

      const outgoing = edges.filter(e => e.source === id).map(e => e.target)
      outgoing.forEach(targetId => {
        queue.push({ id: targetId, level: level + 1 })
      })
    }

    // Lidar com nós que não foram alcançados (ilhas)
    nodes.forEach(n => {
      if (!visited.has(n.id)) {
        levelMap.set(n.id, 0)
      }
    })

    const newNodes = [...nodes]
    const nodesByLevel: Record<number, Node[]> = {}
    
    levelMap.forEach((level, id) => {
      if (!nodesByLevel[level]) nodesByLevel[level] = []
      nodesByLevel[level].push(newNodes.find(n => n.id === id)!)
    })

    const START_X = 100
    const START_Y = 100
    const LEVEL_HEIGHT = 160
    const NODE_SPACING_X = 260

    Object.keys(nodesByLevel).forEach(levelStr => {
      const level = parseInt(levelStr)
      const levelNodes = nodesByLevel[level]
      const totalWidth = (levelNodes.length - 1) * NODE_SPACING_X
      const startXForLevel = START_X - (totalWidth / 2)

      levelNodes.forEach((node, idx) => {
        const rawX = startXForLevel + (idx * NODE_SPACING_X)
        const rawY = START_Y + (level * LEVEL_HEIGHT)
        
        node.x = Math.round(rawX / GRID_SIZE) * GRID_SIZE
        node.y = Math.round(rawY / GRID_SIZE) * GRID_SIZE
      })
    })

    setNodes(newNodes)
    saveFlowState(newNodes, edges)
    
    // Centralizar view no primeiro noh
    if (newNodes.length > 0) {
      setPan({ x: -newNodes[0].x + 300, y: -newNodes[0].y + 200 })
      setZoom(1)
    }
  }

  // Exportar fluxo como SVG (Fase 5)
  const handleExportSVG = () => {
    if (!containerRef.current) return
    const svgElement = containerRef.current.querySelector('svg')
    if (!svgElement) return

    // Clone o SVG para não afetar o DOM original
    const clone = svgElement.cloneNode(true) as SVGSVGElement
    
    // Ajustar viewBox para abranger todos os nós
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    nodes.forEach(n => {
      if (n.x < minX) minX = n.x
      if (n.y < minY) minY = n.y
      if (n.x + n.width > maxX) maxX = n.x + n.width
      if (n.y + n.height > maxY) maxY = n.y + n.height
    })
    
    if (nodes.length > 0) {
      // Adicionar padding
      minX -= 100; minY -= 100; maxX += 100; maxY += 100
      clone.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`)
      
      // Remover pan/zoom transform do clone (aplicar na viewBox em vez disso)
      const gElements = clone.querySelectorAll('g')
      if (gElements.length > 1) { // O primeiro G geralmente é o grupo de zoom/pan
         gElements[1].removeAttribute('transform')
      }
    }

    const svgData = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Fluxograma_${currentScreenName || 'Projeto'}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Documentação SVG exportada com sucesso!")
  }

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

  // Handler para clique em no - abre modal de configuracao e seleciona componente no store
  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setSelectedNode(nodeId)
    setConfigModalOpen(true)
    
    // Sincronizar com o Painel de Propriedades se for um componente
    const node = nodes.find(n => n.id === nodeId)
    if (node && node.metadata?.componentName && currentProject) {
      const comp = findComponent(currentProject.Properties, node.metadata.componentName)
      if (comp) {
        setSelectedComponent(comp)
      }
    }
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
        const GRID_SIZE = 20
        const rawX = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x
        const rawY = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y
        
        // Snapping logic
        const newX = Math.round(rawX / GRID_SIZE) * GRID_SIZE
        const newY = Math.round(rawY / GRID_SIZE) * GRID_SIZE

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
    const bkyType = e.dataTransfer.getData("bkyType")

    if (nodeType && nodeLabel) {
      const GRID_SIZE = 20
      const targetX = (e.clientX - rect.left - pan.x) / zoom
      const targetY = (e.clientY - rect.top - pan.y) / zoom
      
      const snappedX = Math.round((targetX - 100) / GRID_SIZE) * GRID_SIZE
      const snappedY = Math.round((targetY - 40) / GRID_SIZE) * GRID_SIZE

      const newNode: Node = {
        id: Date.now().toString(),
        type: nodeType === "component" ? "process" : nodeType,
        label: nodeLabel,
        x: snappedX,
        y: snappedY,
        width: 200,
        height: 80,
        metadata: {
          componentName: nodeType === "component" ? nodeLabel : undefined,
          componentType: compType || undefined,
          bkyType: bkyType || undefined,
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
      // Validacao de Tipo
      const sourceNode = nodes.find(n => n.id === connecting.source)
      const targetNode = nodes.find(n => n.id === targetId)

      if (sourceNode && targetNode) {
        // Nao permitir conexao se o destino ja for origem do atual (loop simples)
        if (edges.find(e => e.source === targetId && e.target === connecting.source)) {
          toast.error("Conexao circular nao permitida")
          setConnecting(null)
          return
        }

        // Regra: Se o destino for um evento puro (sem metodos/propriedades), ele nao deve receber conexao
        const targetHasTriggerOnly = (targetNode.metadata?.functions || []).every(f => f.type === 'event')
        if (targetHasTriggerOnly && targetNode.metadata?.functions?.length) {
          toast.error("Eventos nao podem ser destino de outras acoes")
          setConnecting(null)
          return
        }
      }

      if (!edges.find(e => e.source === connecting.source && e.target === targetId)) {
        const newEdges = [...edges, {
          id: `e${connecting.source}-${targetId}`,
          source: connecting.source,
          target: targetId
        }]
        setEdges(newEdges)
        saveFlowState(nodes, newEdges)
        toast.success("Conexao estabelecida")
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
        // Buscar valor atual no Designer se for uma propriedade
        let initialValue: any = func.inputType === 'boolean' ? false : (func.inputType === 'number' ? 0 : "")
        if (func.type === 'property_set' && n.metadata?.componentName) {
          // Garante que passamos um KodularComponent válido para o findComponent
          const properties = currentProject?.Properties as KodularComponent
          if (properties) {
            const comp = findComponent(properties, n.metadata.componentName)
            if (comp && comp[func.name] !== undefined) {
              initialValue = comp[func.name]
            }
          }
        }

        const newFunction: NodeFunction = {
          id: Date.now().toString(),
          type: func.type,
          name: func.name,
          label: func.label,
          inputType: func.inputType,
          options: func.options,
          value: initialValue
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

  // Atualizar valor de uma funcao (propriedade)
  const updateFunctionValue = (funcId: string, value: any) => {
    if (!selectedNode) return
    
    const node = nodes.find(n => n.id === selectedNode)
    if (!node) return

    setNodes(prev => prev.map(n => {
      if (n.id === selectedNode) {
        // Se for uma propriedade, atualizar tambem no Designer
        const func = n.metadata?.functions?.find(f => f.id === funcId)
        if (func && func.type === 'property_set' && n.metadata?.componentName) {
          updateComponent(n.metadata.componentName, { [func.name]: value })
        }

        return {
          ...n,
          metadata: {
            ...n.metadata,
            functions: (n.metadata?.functions || []).map(f => 
              f.id === funcId ? { ...f, value } : f
            )
          }
        }
      }
      return n
    }))
  }

  // Renderizar no com nome do componente e subtitulo
  const renderNode = (node: Node) => {
    const isSelected = selectedNode === node.id
    const componentName = node.metadata?.componentName || node.label
    const functions = node.metadata?.functions || []
    const primaryFunction = functions[0]
    const functionCount = functions.length
    
    // Usar as dimensões do nó ou valores padrão
    const nodeHeight = node.height || 80
    const nodeWidth = node.width || 200
    
    let shape = null
    let colorClass = "stroke-white/10 fill-[#141414]"
    let textClass = "fill-white"
    let gradientId = ""

    // Determinar categoria predominante do no para cor
    const primaryFuncType = primaryFunction?.type
    
    if (isSelected) {
      colorClass = "stroke-primary fill-primary/15"
      textClass = "fill-primary"
    } else if (node.type === 'logic' || primaryFuncType === 'method') {
      gradientId = primaryFuncType === 'method' ? "grad-emerald" : "grad-indigo"
      colorClass = primaryFuncType === 'method' ? "stroke-emerald-500/50" : "stroke-indigo-500/50"
      textClass = primaryFuncType === 'method' ? "fill-emerald-300" : "fill-indigo-300"
    } else if (primaryFuncType === 'event') {
      gradientId = "grad-amber"
      colorClass = "stroke-amber-500/50"
      textClass = "fill-amber-300"
    } else if (primaryFuncType === 'property_set' || primaryFuncType === 'property_get') {
      gradientId = "grad-blue"
      colorClass = "stroke-blue-500/50"
      textClass = "fill-blue-300"
    }

    switch (node.type) {
      case "start":
      case "end":
        shape = <rect width={nodeWidth} height={nodeHeight} rx={nodeHeight / 2} ry={nodeHeight / 2} />
        break
      case "decision":
        shape = <polygon points={`0,${nodeHeight/2} ${nodeWidth/2},0 ${nodeWidth},${nodeHeight/2} ${nodeWidth/2},${nodeHeight}`} />
        break
      case "logic":
        shape = <rect width={nodeWidth} height={nodeHeight} rx={8} />
        break
      default:
        shape = <rect width={nodeWidth} height={nodeHeight} rx={12} />
    }

    // Obter ícone baseado no tipo
    const getIcon = () => {
      const type = node.metadata?.componentType?.toLowerCase() || ""
      if (type.includes("button")) return <Zap className="w-4 h-4" />
      if (type.includes("label") || type.includes("text")) return <Type className="w-4 h-4" />
      if (type.includes("image")) return <ImageIcon className="w-4 h-4" />
      if (type.includes("layout") || type.includes("arrangement")) return <Layers className="w-4 h-4" />
      if (type.includes("database") || type.includes("firebase") || type.includes("db")) return <Database className="w-4 h-4" />
      if (type.includes("sensor") || type.includes("clock")) return <Cpu className="w-4 h-4" />
      if (type.includes("web") || type.includes("connectivity")) return <GitMerge className="w-4 h-4" />
      if (node.type === 'logic') return <Variable className="w-4 h-4" />
      if (node.type === 'decision') return <Diamond className="w-4 h-4" />
      return <Box className="w-4 h-4" />
    }

    return (
      <g 
        key={node.id} 
        transform={`translate(${node.x},${node.y})`}
        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
        onClick={(e) => handleNodeClick(e, node.id)}
        className={cn(
          "cursor-pointer transition-all duration-300 group",
          isSelected ? "filter drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]" : 
          node.type === 'logic' ? "filter drop-shadow-[0_4px_8px_rgba(99,102,241,0.2)]" :
          "filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
        )}
      >
        {/* Background shape */}
        <g className={cn("stroke-2 transition-colors duration-300", colorClass)} fill={gradientId ? `url(#${gradientId})` : undefined}>
          {shape}
        </g>

        {/* Icon and Component name */}
        <g transform={`translate(15, ${nodeHeight / 2 - 10})`}>
          <foreignObject width="20" height="20" className="pointer-events-none">
            <div className={cn(
              "flex items-center justify-center text-white/50 group-hover:text-white transition-colors",
              isSelected && "text-primary"
            )}>
              {getIcon()}
            </div>
          </foreignObject>
          
          <text 
            x={25} 
            y={10} 
            dominantBaseline="middle"
            className={cn(
              "text-[12px] font-bold pointer-events-none select-none transition-colors",
              textClass
            )}
          >
            {componentName.length > 20 ? componentName.substring(0, 18) + '...' : componentName}
          </text>
        </g>

        {/* Function subtitle */}
        {primaryFunction && (
          <text 
            x={40} 
            y={50} 
            dominantBaseline="middle"
            className={cn(
              "text-[10px] pointer-events-none select-none font-medium",
              node.type === 'logic' ? "fill-indigo-300/60" : "fill-white/50"
            )}
          >
            {primaryFunction.label}
            {functionCount > 1 && ` +${functionCount - 1}`}
          </text>
        )}

        {/* Function count badge */}
        {functionCount > 0 && (
          <g transform={`translate(${nodeWidth - 24}, 8)`}>
            <circle cx="12" cy="12" r="10" className={cn(
              "stroke-1",
              node.type === 'logic' ? "fill-indigo-500/20 stroke-indigo-500/40" : "fill-primary/20 stroke-primary/40"
            )} />
            <text x="12" y="12" textAnchor="middle" dominantBaseline="middle" className={cn(
              "text-[9px] font-bold pointer-events-none",
              node.type === 'logic' ? "fill-indigo-300" : "fill-primary"
            )}>
              {functionCount}
            </text>
          </g>
        )}

        {/* Component type badge */}
        {(node.metadata?.componentType || node.type === 'logic') && (
          <g transform={`translate(15, ${nodeHeight - 22})`}>
            <rect width="auto" height="12" rx="3" className="fill-white/5" />
            <text x="0" y="8" className="text-[7px] fill-white/30 font-mono pointer-events-none uppercase tracking-tighter">
              {node.type === 'logic' ? 'Lógica' : node.metadata?.componentType}
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
        <g className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <circle cx={nodeWidth / 2} cy={0} r="4" className={cn(
            "stroke-2",
            node.type === 'logic' ? "fill-indigo-900 stroke-indigo-500" : "fill-black stroke-primary"
          )} />
          <circle cx={nodeWidth / 2} cy={nodeHeight} r="4" className={cn(
            "stroke-2",
            node.type === 'logic' ? "fill-indigo-900 stroke-indigo-500" : "fill-black stroke-primary"
          )} />
        </g>
      </g>
    )
  }

  // Renderizar aresta (conexao)
  const renderEdge = (edge: Edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)
    
    if (!sourceNode || !targetNode) return null
    
    const sourceX = sourceNode.x + sourceNode.width / 2
    const sourceY = sourceNode.y + sourceNode.height
    const targetX = targetNode.x + targetNode.width / 2
    const targetY = targetNode.y
    
    const midY = (sourceY + targetY) / 2
    
    // Path Ortogonal (Angulos Retos)
    const path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`
    
    return (
      <g key={edge.id} className="group">
        <path 
          d={path} 
          fill="none" 
          stroke="rgba(255,255,255,0.01)" 
          strokeWidth="20" 
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            const labels = [undefined, "Sim", "Não"]
            const currentIndex = labels.indexOf(edge.label as any)
            const nextLabel = labels[(currentIndex + 1) % labels.length]
            
            setEdges(prev => prev.map(ed => 
              ed.id === edge.id ? { ...ed, label: nextLabel } : ed
            ))
            toast.info(`Caminho definido como: ${nextLabel || "Fluxo padrao"}`)
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            const newEdges = edges.filter(e => e.id !== edge.id)
            setEdges(newEdges)
            saveFlowState(nodes, newEdges)
            toast.success("Conexao removida")
          }}
        />
        <path 
          d={path} 
          fill="none" 
          stroke={sourceNode.type === 'logic' ? "#6366f1" : "var(--primary)"} 
          strokeWidth="2.5" 
          className="transition-all duration-300 opacity-60 group-hover:opacity-100"
          markerEnd="url(#arrowhead)"
        />

        {/* Flow Animation Particles */}
        <circle r="2" fill={sourceNode.type === 'logic' ? "#818cf8" : "var(--primary)"} className="filter blur-[1px]">
          <animateMotion 
            dur="2s" 
            repeatCount="indefinite" 
            path={path}
          />
        </circle>
        <circle r="1.5" fill="white" opacity="0.8">
          <animateMotion 
            dur="2s" 
            repeatCount="indefinite" 
            path={path}
          />
        </circle>
        {edge.label && (
          <g transform={`translate(${(sourceX + targetX) / 2}, ${(sourceY + targetY) / 2})`}>
            <rect x="-30" y="-10" width="60" height="20" rx="10" className="fill-black/80 stroke-white/10" />
            <text textAnchor="middle" dominantBaseline="middle" className="text-[10px] fill-white/60 font-medium">
              {edge.label}
            </text>
          </g>
        )}
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
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-lg hover:text-primary transition-colors"
            onClick={handleAutoLayout}
            title="Auto-organizar Layout"
          >
            <Workflow className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/5 flex flex-col gap-1 shadow-2xl">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-lg hover:text-primary transition-colors"
            onClick={() => setAiPromptOpen(true)}
            title="IA Assistente - Gerar Logica"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-lg hover:text-amber-400 transition-colors"
            onClick={handleAnalyzeFlow}
            disabled={isAnalyzing || nodes.length === 0}
            title="Analisar Fluxo (IA)"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-lg hover:text-emerald-400 transition-colors"
            onClick={handleExportSVG}
            title="Exportar Documentação (SVG)"
          >
            <Download className="w-4 h-4" />
          </Button>
          <div className="h-px bg-white/5 mx-2 my-1" />
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

      {/* Floating Status Card & Apply Button */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={syncProjectComponents}
            className="h-9 px-4 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-black/40 border-white/10 hover:bg-white/10 text-white shadow-2xl"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Sincronizar Componentes
          </Button>

          <Button
            size="sm"
            onClick={handleApplyChanges}
            disabled={isApplying}
            className={cn(
              "h-9 px-4 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all duration-500 shadow-2xl",
              isApplying 
                ? "bg-white/5 border border-white/10 text-white/40 cursor-wait" 
                : "bg-primary hover:bg-primary/90 text-white shadow-primary/20 shine"
            )}
          >
          {isApplying ? (
            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
          ) : (
            <CloudUpload className="w-3.5 h-3.5 mr-2" />
          )}
          {isApplying ? "Sincronizando..." : "Aplicar Mudancas"}
        </Button>
      </div>

      <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3 shadow-2xl">
          <div className={cn(
            "w-2 h-2 rounded-full shadow-glow-primary",
            isSaving ? "bg-amber-500 animate-pulse" : 
            syncStatus === "error" ? "bg-destructive" : 
            syncStatus === "success" ? "bg-emerald-500" : "bg-primary animate-pulse"
          )} />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              {isSaving ? "Salvando Localmente..." : 
               isApplying ? "Sincronizando GitHub..." :
               syncStatus === "error" ? "Erro na Sincronizacao" :
               nodes.length === 0 ? "Sem blocos" : "Fluxograma Sincronizado"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground font-mono">
                Zoom: {Math.round(zoom * 100)}% | {nodes.length} nos
              </span>
              {lastSyncTime && (
                <>
                  <span className="text-[9px] text-white/20">|</span>
                  <span className="text-[9px] text-emerald-500/70 font-mono">
                    Último Sync: {lastSyncTime.toLocaleTimeString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Result Overlay */}
      {analysisResult && (
        <div className="absolute top-20 right-4 z-50 w-80 animate-in slide-in-from-right duration-500">
          <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Analise da IA</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAnalysisResult(null)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="p-4">
              <div className="text-[11px] text-white/80 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                {analysisResult}
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-[9px] font-bold uppercase text-primary hover:text-primary/80 hover:bg-primary/10"
                  onClick={() => setAnalysisResult(null)}
                >
                  Entendido
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Prompt Modal */}
      {aiPromptOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-[500px] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Gerar Logica com IA</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white" onClick={() => setAiPromptOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground">Descreva em detalhes o comportamento que deseja criar. A IA ira gerar os nós e conexões automaticamente.</p>
              
              <div className="relative">
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Quando clicar no Botao1, verifique se o campo de texto esta vazio. Se estiver, mostre um alerta, caso contrario mude a cor de fundo da tela para azul."
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none"
                  autoFocus
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none opacity-40">
                  <span className="text-[10px] font-mono uppercase">IA Ativa</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-widest gap-2 shadow-lg shadow-primary/10 transition-all active:scale-95"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI || !aiPrompt.trim()}
                >
                  {isGeneratingAI ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  {isGeneratingAI ? "Processando..." : "Gerar Estrutura"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            { type: 'logic' as const, icon: Cpu, label: 'Logica/Var' },
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
          "flex-1 relative overflow-hidden bg-[#0c0c0c]",
          isPanning ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Background Grid Pattern (Visual Only) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ 
               backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
               backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
               backgroundPosition: `${pan.x}px ${pan.y}px`
             }} 
        />

        <svg className="w-full h-full">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" opacity="0.8" />
            </marker>

            {/* Gradients for Premium Look */}
            <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="grad-indigo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.05" />
            </linearGradient>
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
                  <div className="space-y-2">
                    {selectedNodeData.metadata?.functions?.map(func => (
                      <div 
                        key={func.id}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl group space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {func.type === 'event' && <Zap className="w-3 h-3 text-amber-500" />}
                            {func.type === 'method' && <Play className="w-3 h-3 text-emerald-500" />}
                            {(func.type === 'property_get' || func.type === 'property_set') && <Cog className="w-3 h-3 text-blue-500" />}
                            <span className="text-[10px] text-white font-medium uppercase tracking-tight">{func.label}</span>
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

                        {/* Method Params Input (Phase 4) */}
                        {func.type === 'method' && (
                          <div className="pt-1 space-y-1.5">
                            <span className="text-[8px] text-muted-foreground uppercase tracking-wider">Parâmetros (separados por vírgula)</span>
                            <Input
                              value={func.value || ''}
                              onChange={(e) => updateFunctionValue(func.id, e.target.value)}
                              className="h-8 text-[10px] bg-black/40 border-white/5 focus:border-emerald-500/40 font-mono"
                              placeholder='ex: "Olá", 100, true'
                            />
                            <p className="text-[8px] text-white/20 italic">Esses valores serão injetados como argumentos no bloco BKY gerado.</p>
                          </div>
                        )}

                        {/* Event info (read-only) */}
                        {func.type === 'event' && (
                          <div className="pt-1">
                            <span className="text-[9px] text-amber-500/50 italic">Evento disparador — conecte este nó aos próximos para definir o fluxo.</span>
                          </div>
                        )}

                        {/* Property Inputs */}
                        {(func.type === 'property_set' || func.type === 'property_get') && func.inputType && (
                          <div className="pt-1">
                            {func.inputType === 'boolean' && (
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={!!func.value} 
                                  onChange={(e) => updateFunctionValue(func.id, e.target.checked)}
                                  className="w-4 h-4 rounded bg-white/5 border-white/20 accent-primary"
                                />
                                <span className="text-[10px] text-white/70">{func.value ? 'Ativado' : 'Desativado'}</span>
                              </div>
                            )}
                            {func.inputType === 'number' && (
                              <Input 
                                type="number"
                                value={func.value}
                                onChange={(e) => updateFunctionValue(func.id, Number(e.target.value))}
                                className="h-8 text-[10px] bg-black/40 border-white/5 focus:border-primary/50"
                              />
                            )}
                            {func.inputType === 'text' && (
                              <Input 
                                value={func.value}
                                onChange={(e) => updateFunctionValue(func.id, e.target.value)}
                                className="h-8 text-[10px] bg-black/40 border-white/5 focus:border-primary/50"
                                placeholder="Valor do texto..."
                              />
                            )}
                            {func.inputType === 'choice' && func.options && (
                              <Select 
                                value={func.value} 
                                onValueChange={(val) => updateFunctionValue(func.id, val)}
                              >
                                <SelectTrigger className="h-8 text-[10px] bg-black/40 border-white/5">
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="bg-black/90 border-white/10">
                                  {func.options.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-[10px]">
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {func.inputType === 'color' && (
                              <div className="flex gap-2">
                                <div 
                                  className="w-8 h-8 rounded border border-white/10"
                                  style={{ backgroundColor: func.value || '#ffffff' }}
                                />
                                <Input 
                                  value={func.value}
                                  onChange={(e) => updateFunctionValue(func.id, e.target.value)}
                                  className="h-8 text-[10px] bg-black/40 border-white/5 flex-1"
                                  placeholder="#HEX..."
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Functions - Organized by Type */}
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Adicionar Funcoes</span>
                
                {/* Actions Section */}
                <div className="border border-white/5 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, actions: !prev.actions }))}
                    className="w-full flex items-center justify-between p-2 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3 h-3 text-indigo-500" />
                      <span className="text-[10px] font-bold text-indigo-500 uppercase">Ações</span>
                    </div>
                    {expandedSections.actions ? <ChevronDown className="w-3 h-3 text-indigo-500" /> : <ChevronRight className="w-3 h-3 text-indigo-500" />}
                  </button>
                  {expandedSections.actions && (
                    <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
                      {getActionsForComponent(selectedComponentType).map(action => (
                        <button
                          key={action.name}
                          onClick={() => addFunctionToNode(action)}
                          className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-white/5 transition-colors text-left"
                        >
                          <Plus className="w-3 h-3 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-white">{action.label}</span>
                            {action.description && (
                              <span className="text-[8px] text-muted-foreground">{action.description}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

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
                saveFlowState(nodes, edges, true)
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

      {/* Mini-Map (Phase 2) */}
      {nodes.length > 1 && (
        <div className="absolute bottom-20 right-4 z-20 w-40 h-28 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <svg width="100%" height="100%" viewBox="-100 -100 1400 1400" preserveAspectRatio="xMidYMid meet">
            {edges.map(edge => {
              const src = nodes.find(n => n.id === edge.source)
              const tgt = nodes.find(n => n.id === edge.target)
              if (!src || !tgt) return null
              return (
                <line
                  key={edge.id}
                  x1={src.x + src.width / 2} y1={src.y + src.height}
                  x2={tgt.x + tgt.width / 2} y2={tgt.y}
                  stroke="rgba(255,255,255,0.15)" strokeWidth="8"
                />
              )
            })}
            {nodes.map(node => (
              <rect
                key={node.id}
                x={node.x} y={node.y}
                width={node.width} height={node.height}
                rx={8}
                fill={selectedNode === node.id ? 'rgba(59,130,246,0.6)' :
                  node.type === 'decision' ? 'rgba(245,158,11,0.4)' :
                  node.type === 'logic' ? 'rgba(99,102,241,0.4)' :
                  'rgba(255,255,255,0.12)'}
                stroke={selectedNode === node.id ? '#3b82f6' : 'rgba(255,255,255,0.08)'}
                strokeWidth={selectedNode === node.id ? 6 : 2}
              />
            ))}
          </svg>
          <div className="absolute bottom-1 left-2">
            <span className="text-[8px] text-white/20 font-mono uppercase">Mapa</span>
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
