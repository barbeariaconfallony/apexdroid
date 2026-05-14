"use client"

import { useState, useCallback, memo, useRef, useEffect } from "react"
import { Zap, PlusCircle, Github, Smartphone, Tablet, RotateCcw, Maximize2, Minimize2, Crown, UserX, VolumeX, X, ChevronRight, Monitor, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BkyWorkspace } from "./bky-workspace"
import { useIDEStore } from "@/lib/ide-store"
import type { KodularComponent, ProjectAsset } from "@/lib/ide-types"
import { cn } from "@/lib/utils"
import { DroppableZone, EmptyDropZone } from "./droppable-zone"
import { useIDEDnd } from "./dnd-context"
import { toast } from "sonner"

// Device presets
const devicePresets = {
  phone: [
    { name: "iPhone SE", width: 375, height: 667 },
    { name: "iPhone 14", width: 390, height: 844 },
    { name: "iPhone 14 Pro Max", width: 430, height: 932 },
    { name: "Samsung Galaxy S21", width: 360, height: 800 },
    { name: "Pixel 7", width: 412, height: 915 },
  ],
  tablet: [
    { name: "iPad Mini", width: 768, height: 1024 },
    { name: "iPad Air", width: 820, height: 1180 },
    { name: "iPad Pro 11\"", width: 834, height: 1194 },
    { name: "iPad Pro 12.9\"", width: 1024, height: 1366 },
    { name: "Samsung Tab S7", width: 800, height: 1280 },
  ],
  custom: [
    { name: "HD (720p)", width: 720, height: 1280 },
    { name: "Full HD (1080p)", width: 1080, height: 1920 },
    { name: "QHD (1440p)", width: 1440, height: 2560 },
  ]
}

// Kodular color converter
function convertColor(k?: string): string {
  if (!k || k === "None" || k === "0") return "transparent"
  if (k.startsWith("&H")) {
    const hex = k.substring(2)
    if (hex.length === 8) {
      const a = parseInt(hex.substring(0, 2), 16) / 255
      const r = parseInt(hex.substring(2, 4), 16)
      const g = parseInt(hex.substring(4, 6), 16)
      const b = parseInt(hex.substring(6, 8), 16)
      return `rgba(${r},${g},${b},${a})`
    }
    return `#${hex}`
  }
  return k
}

function convertSize(v?: string | number): string {
  if (v === "-1" || v === -1) return "auto"
  if (v === "-2" || v === -2) return "100%"
  if (typeof v === "number" && v > 0) return `${v}px`
  if (typeof v === "string" && parseInt(v) > 0) return `${v}px`
  return "auto"
}

function convertAlignment(v?: string): string {
  if (v === "2") return "center"
  if (v === "3") return "flex-end"
  return "flex-start"
}

// Runtime global para executar codigo dos blocos
interface BlocksRuntime {
  triggerEvent: (component: string, event: string, ...args: any[]) => void
  getEventHandlers: () => Record<string, Record<string, Function[]>>
}

// Funcao para obter o runtime global
function getBlocksRuntime(): BlocksRuntime | null {
  if (typeof window !== 'undefined' && (window as any).__apexBlocksRuntime) {
    return (window as any).__apexBlocksRuntime as BlocksRuntime
  }
  return null
}

interface ComponentRendererProps {
  component: KodularComponent
  onSelect: (comp: KodularComponent) => void
  selectedName?: string
  appMode: "edit" | "run" | "blocks"
  assets?: ProjectAsset[]
  moveComponent: (name: string, targetParent: string, targetIndex?: number) => void
  dragOverInfo: { name: string | null, position: 'top' | 'middle' | 'bottom' | 'left' | 'right' | null }
  setDragOverInfo: (info: { name: string | null, position: 'top' | 'middle' | 'bottom' | 'left' | 'right' | null }) => void
  parentName?: string
  index?: number
  onTriggerEvent?: (component: string, event: string) => void
}

// Resolve asset URL from asset name
function resolveAssetUrl(assetName: string | undefined, assets: ProjectAsset[]): string | null {
  if (!assetName) return null
  // Find asset by name (case insensitive)
  const asset = assets.find(a => a.name.toLowerCase() === assetName.toLowerCase())
  return asset?.url || null
}

const ComponentRenderer = memo(({ 
  component, onSelect, selectedName, appMode, assets = [], 
  moveComponent, dragOverInfo, setDragOverInfo,
  parentName, index, onTriggerEvent
}: ComponentRendererProps) => {
  const { $Type, $Name, $Components } = component
  
  // Handler para disparar eventos no modo run
  const handleRunClick = useCallback(() => {
    if (appMode === "run" && onTriggerEvent) {
      onTriggerEvent($Name, "Click")
    }
  }, [appMode, $Name, onTriggerEvent])

  // Non-visible components (services, not UI)
  const nonVisibleTypes = [
    "Clock", "Sound", "Notifier", "TinyDB", "Web", "Firebase", "Cloudinary",
    "FirebaseDB", "TinyWebDB", "BluetoothClient", "BluetoothServer",
    "ActivityStarter", "TextToSpeech", "SpeechRecognizer", "Sharing",
    "PhoneCall", "Texting", "Twitter", "ProbeNetwork", "Network"
  ]
  if (nonVisibleTypes.some(t => $Type.includes(t))) {
    return null
  }

  const isSelected = selectedName === $Name

  const handleDrop = (e: React.DragEvent) => {
    if (appMode !== "edit") return
    e.preventDefault()
    e.stopPropagation()
    const draggedName = e.dataTransfer.getData("componentName")
    const pos = dragOverInfo.position
    setDragOverInfo({ name: null, position: null })

    if (draggedName && draggedName !== $Name) {
      if (pos === 'middle') {
        moveComponent(draggedName, $Name)
      } else if (parentName) {
        const targetIdx = (pos === 'top' || pos === 'left') ? (index || 0) : (index || 0) + 1
        moveComponent(draggedName, parentName, targetIdx)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (appMode !== "edit") return
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const w = rect.width
    const h = rect.height
    
    let pos: 'top' | 'middle' | 'bottom' | 'left' | 'right'
    
    // Check if parent is horizontal or vertical to decide indicator
    const isHorizontal = parentName?.toLowerCase().includes("horizontal")
    
    if (isHorizontal) {
      if (x < w / 4) pos = 'left'
      else if (x > (w * 3) / 4) pos = 'right'
      else pos = 'middle'
    } else {
      if (y < h / 4) pos = 'top'
      else if (y > (h * 3) / 4) pos = 'bottom'
      else pos = 'middle'
    }
    
    if (dragOverInfo.name !== $Name || dragOverInfo.position !== pos) {
      setDragOverInfo({ name: $Name, position: pos })
    }
  }

  const baseStyle: React.CSSProperties = {
    width: convertSize(component.Width),
    height: convertSize(component.Height),
    backgroundColor: convertColor(component.BackgroundColor || "&H00FFFFFF")
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (appMode === "edit") {
      onSelect(component)
    } else if (appMode === "run") {
      handleRunClick()
    }
  }

  // Common wrapper for components to handle drag indicators
  const renderWithDragIndicators = (children: React.ReactNode) => (
    <div
      draggable={appMode === "edit"}
      onDragStart={(e) => {
        if (appMode !== "edit") return
        e.dataTransfer.setData("componentName", $Name)
        e.dataTransfer.effectAllowed = "move"
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={() => setDragOverInfo({ name: null, position: null })}
      className={cn(
        "relative transition-all",
        dragOverInfo.name === $Name && dragOverInfo.position === 'top' && "border-t-2 border-primary",
        dragOverInfo.name === $Name && dragOverInfo.position === 'bottom' && "border-b-2 border-primary",
        dragOverInfo.name === $Name && dragOverInfo.position === 'left' && "border-l-2 border-primary",
        dragOverInfo.name === $Name && dragOverInfo.position === 'right' && "border-r-2 border-primary",
      )}
    >
      {children}
    </div>
  )

  if ($Type === "Button") {
    return renderWithDragIndicators(
      <div
        onClick={handleClick}
        className={cn(
          "px-3 py-2 text-center rounded text-sm cursor-pointer transition-all duration-300",
          isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background glow-primary z-10" : "hover:scale-[1.02]"
        )}
        style={{
          ...baseStyle,
          backgroundColor: convertColor(component.BackgroundColor) || "#3b82f6",
          color: convertColor(component.TextColor) || "white"
        }}
      >
        {component.Text || "Button"}
      </div>
    )
  }

  if ($Type === "Label") {
    return renderWithDragIndicators(
      <div
        onClick={handleClick}
        className={cn(
          "cursor-pointer transition-all px-1 duration-300",
          isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background glow-primary z-10 rounded" : "hover:text-foreground"
        )}
        style={{
          ...baseStyle,
          color: convertColor(component.TextColor || "&HFF000000"),
          fontSize: component.FontSize ? `${component.FontSize}px` : undefined,
          fontWeight: component.FontBold === "True" ? "bold" : undefined,
          textAlign: component.TextAlignment === "1" ? "center" : component.TextAlignment === "2" ? "right" : "left"
        }}
      >
        {component.Text || "Label"}
      </div>
    )
  }

  if ($Type === "TextBox") {
    return renderWithDragIndicators(
      <input
        type="text"
        placeholder={component.Hint as string || "Digite aqui..."}
        onClick={handleClick}
        readOnly={appMode === "edit"}
        className={cn(
          "px-3 py-2 rounded border text-sm w-full cursor-pointer transition-all duration-300",
          isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background glow-primary z-10" : "border-border"
        )}
        style={{
          ...baseStyle,
          borderColor: "#ccc",
          color: convertColor(component.TextColor || "&HFF000000")
        }}
      />
    )
  }

  if ($Type === "PasswordTextBox") {
    return renderWithDragIndicators(
      <input
        type="password"
        placeholder={component.Hint as string || "Senha..."}
        onClick={handleClick}
        readOnly={appMode === "edit"}
        className={cn(
          "px-3 py-2 rounded border text-sm w-full cursor-pointer transition-all duration-300",
          isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background glow-primary z-10" : "border-border"
        )}
        style={{
          ...baseStyle,
          borderColor: "#ccc"
        }}
      />
    )
  }

  if ($Type === "Image") {
    const pictureName = component.Picture as string
    const imageSrc = resolveAssetUrl(pictureName, assets)
    return renderWithDragIndicators(
      <div
        onClick={handleClick}
        className={cn(
          "cursor-pointer transition-all flex items-center justify-center overflow-hidden",
          isSelected && "ring-2 ring-blue-500 ring-offset-1 rounded"
        )}
        style={baseStyle}
      >
        {imageSrc ? (
          <img 
            src={imageSrc} 
            alt={$Name}
            className="max-w-full max-h-full object-contain"
            crossOrigin="anonymous"
          />
        ) : pictureName ? (
          <div className="w-full h-full bg-gray-200/50 rounded flex flex-col items-center justify-center text-gray-400 text-xs p-2">
            <span className="truncate max-w-full">{pictureName}</span>
            <span className="text-[10px] opacity-60">Asset nao encontrado</span>
          </div>
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
            Imagem
          </div>
        )}
      </div>
    )
  }

  if ($Type === "CheckBox") {
    return renderWithDragIndicators(
      <label
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 cursor-pointer transition-all px-1",
          isSelected && "ring-2 ring-blue-500 ring-offset-1 rounded"
        )}
        style={baseStyle}
      >
        <input type="checkbox" className="w-4 h-4" readOnly={appMode === "edit"} />
        <span className="text-sm">{component.Text || "CheckBox"}</span>
      </label>
    )
  }

  if ($Type === "Switch") {
    return renderWithDragIndicators(
      <div
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 cursor-pointer transition-all px-1",
          isSelected && "ring-2 ring-blue-500 ring-offset-1 rounded"
        )}
        style={baseStyle}
      >
        <div className="w-10 h-5 bg-gray-300 rounded-full relative">
          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div>
        </div>
        <span className="text-sm">{component.Text || ""}</span>
      </div>
    )
  }

  if ($Type === "Slider") {
    return renderWithDragIndicators(
      <div
        onClick={handleClick}
        className={cn(
          "cursor-pointer transition-all px-1 py-2 w-full",
          isSelected && "ring-2 ring-blue-500 ring-offset-1 rounded"
        )}
        style={baseStyle}
      >
        <input type="range" className="w-full" readOnly={appMode === "edit"} />
      </div>
    )
  }

  if ($Type === "Spinner") {
    return renderWithDragIndicators(
      <select
        onClick={handleClick}
        className={cn(
          "px-3 py-2 rounded border text-sm w-full cursor-pointer",
          isSelected && "ring-2 ring-blue-500 ring-offset-1"
        )}
        style={baseStyle}
      >
        <option>{component.Selection as string || "Selecione..."}</option>
      </select>
    )
  }

  if ($Type.includes("Arrangement")) {
    const isVertical = $Type.includes("Vertical")
    const isScroll = $Type.includes("Scroll")
    return (
      <DroppableZone
        id={`drop-${$Name}`}
        targetName={$Name}
        className={cn(
          "flex gap-2 p-2 cursor-pointer transition-all min-h-[40px] relative isolate",
          isSelected && "ring-2 ring-blue-500 ring-offset-1 rounded",
          isScroll && "overflow-auto"
        )}
        style={{
          ...baseStyle,
          flexDirection: isVertical ? "column" : "row",
          alignItems: convertAlignment(component.AlignHorizontal),
          justifyContent: convertAlignment(component.AlignVertical)
        }}
        disabled={appMode !== "edit"}
      >
        <div onClick={handleClick} className="absolute inset-0 z-[-1]" />
        {$Components?.map((child, idx) => (
          <ComponentRenderer
            key={child.$Name}
            component={child}
            onSelect={onSelect}
            selectedName={selectedName}
            appMode={appMode}
            assets={assets}
            moveComponent={moveComponent}
            dragOverInfo={dragOverInfo}
            setDragOverInfo={setDragOverInfo}
            parentName={$Name}
            index={idx}
            onTriggerEvent={onTriggerEvent}
          />
        ))}
        {(!$Components || $Components.length === 0) && appMode === "edit" && (
          <EmptyDropZone
            id={`empty-${$Name}`}
            targetName={$Name}
            className="flex-1 min-h-[30px]"
          />
        )}
      </DroppableZone>
    )
  }

  if ($Type === "CardView") {
    return (
      <DroppableZone
        id={`drop-${$Name}`}
        targetName={$Name}
        className={cn(
          "bg-white rounded-lg shadow-md p-3 cursor-pointer transition-all relative isolate",
          isSelected && "ring-2 ring-blue-500 ring-offset-1"
        )}
        style={baseStyle}
        disabled={appMode !== "edit"}
      >
        <div onClick={handleClick} className="absolute inset-0 z-[-1]" />
        {$Components?.map((child, idx) => (
          <ComponentRenderer
            key={child.$Name}
            component={child}
            onSelect={onSelect}
            selectedName={selectedName}
            appMode={appMode}
            assets={assets}
            moveComponent={moveComponent}
            dragOverInfo={dragOverInfo}
            setDragOverInfo={setDragOverInfo}
            parentName={$Name}
            index={idx}
            onTriggerEvent={onTriggerEvent}
          />
        ))}
        {(!$Components || $Components.length === 0) && appMode === "edit" && (
          <EmptyDropZone
            id={`empty-${$Name}`}
            targetName={$Name}
            className="min-h-[30px]"
          />
        )}
      </DroppableZone>
    )
  }

  if ($Type === "ListView") {
    const elements = (component.Elements as string)?.split(",") || []
    return renderWithDragIndicators(
      <div
        onClick={handleClick}
        className={cn(
          "cursor-pointer transition-all border rounded overflow-hidden",
          isSelected && "ring-2 ring-blue-500 ring-offset-1"
        )}
        style={baseStyle}
      >
        {elements.length > 0 ? (
          elements.slice(0, 5).map((item, i) => (
            <div key={i} className="px-3 py-2 border-b last:border-b-0 text-sm bg-white">
              {item.trim()}
            </div>
          ))
        ) : (
          <div className="p-3 text-gray-400 text-sm text-center">ListView vazia</div>
        )}
      </div>
    )
  }

  if ($Type === "WebViewer") {
    return renderWithDragIndicators(
      <div
        onClick={handleClick}
        className={cn(
          "cursor-pointer transition-all border rounded bg-white flex items-center justify-center",
          isSelected && "ring-2 ring-blue-500 ring-offset-1"
        )}
        style={{ ...baseStyle, minHeight: "100px" }}
      >
        <div className="text-xs text-gray-400 text-center p-4">
          <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
          WebViewer
        </div>
      </div>
    )
  }

  if ($Type === "VideoPlayer") {
    return renderWithDragIndicators(
      <div
        onClick={handleClick}
        className={cn(
          "cursor-pointer transition-all border rounded bg-black flex items-center justify-center",
          isSelected && "ring-2 ring-blue-500 ring-offset-1"
        )}
        style={{ ...baseStyle, minHeight: "80px" }}
      >
        <div className="text-xs text-white text-center p-4">
          <Play className="w-8 h-8 mx-auto mb-2 opacity-70" />
          VideoPlayer
        </div>
      </div>
    )
  }

  // Default rendering for other components
  return renderWithDragIndicators(
    <div
      onClick={handleClick}
      className={cn(
        "cursor-pointer transition-all p-2 rounded bg-gray-100",
        isSelected && "ring-2 ring-blue-500 ring-offset-1"
      )}
      style={baseStyle}
    >
      <span className="text-xs text-gray-500">[{$Type}] {$Name}</span>
      {component.Text && <div className="text-sm mt-1">{component.Text}</div>}
    </div>
  )
})

ComponentRenderer.displayName = "ComponentRenderer"

export function PhonePreview() {
  const { 
    currentProject, appMode, setAppMode, updateComponent, removeComponent, moveComponent,
    selectedComponent, setSelectedComponent, setShowProperties,
    selectedRepo, currentScreenName, setActiveTab,
    projectAssets, ghToken, isThinking
  } = useIDEStore()

  // Device state
  const [deviceType, setDeviceType] = useState<"phone" | "tablet">("phone")
  const [selectedDevice, setSelectedDevice] = useState(devicePresets.phone[1]) // iPhone 14
  const [isLandscape, setIsLandscape] = useState(false)
  const [scale, setScale] = useState(0.7)
  const [showHiddenComponents, setShowHiddenComponents] = useState(false)
  const [dragOverInfo, setDragOverInfo] = useState<{ 
    name: string | null, 
    position: 'top' | 'middle' | 'bottom' | 'left' | 'right' | null 
  }>({ name: null, position: null });
  
  const containerRef = useRef<HTMLDivElement>(null)
  const [runtimeInitialized, setRuntimeInitialized] = useState(false)
  
  // Inicializar runtime dos blocos quando entrar no modo run
  useEffect(() => {
    if (appMode === "run" && currentScreenName && !runtimeInitialized) {
      initializeBlocksRuntime()
    }
  }, [appMode, currentScreenName])

  // Funcao para inicializar e executar o codigo dos blocos
  const initializeBlocksRuntime = useCallback(() => {
    try {
      // Obter codigo gerado dos blocos
      const generatedCode = typeof window !== 'undefined' 
        ? (window as any).__apexGeneratedCode?.[currentScreenName || ''] 
        : null

      if (!generatedCode) {
        console.log('[v0] Nenhum codigo de blocos para executar')
        setRuntimeInitialized(true)
        return
      }

      // Criar contexto de componentes
      const componentProps: Record<string, any> = {}
      const collectComponents = (comp: KodularComponent) => {
        componentProps[comp.$Name] = { ...comp }
        comp.$Components?.forEach(collectComponents)
      }
      if (currentProject?.Properties) {
        collectComponents(currentProject.Properties)
      }

      // Criar runtime
      const eventHandlers: Record<string, Record<string, Function[]>> = {}
      const globals: Record<string, any> = {}

      const runtime = {
        on: (component: string, event: string, handler: Function) => {
          if (!eventHandlers[component]) eventHandlers[component] = {}
          if (!eventHandlers[component][event]) eventHandlers[component][event] = []
          eventHandlers[component][event].push(handler)
        },
        get: (component: string, property: string) => {
          return componentProps[component]?.[property] ?? null
        },
        set: (component: string, property: string, value: any) => {
          if (componentProps[component]) {
            componentProps[component][property] = value
            updateComponent(component, { [property]: value }, true)
          }
        },
        call: (component: string, method: string, args: any[]) => {
          if (method === 'ShowAlert' || method === 'ShowMessageDialog') {
            toast.info(args[0] || 'Alerta')
          } else {
            console.log(`[Runtime] ${component}.${method}(${args.join(', ')})`)
          }
        },
        openScreen: (name: string) => toast.info(`Abrindo tela: ${name}`),
        closeScreen: () => toast.info('Fechando tela'),
        getStartValue: () => null,
        setAny: (comp: any, prop: string, val: any) => runtime.set(typeof comp === 'string' ? comp : comp?.$Name, prop, val),
        getAny: (comp: any, prop: string) => runtime.get(typeof comp === 'string' ? comp : comp?.$Name, prop),
        callAny: (comp: any, method: string, args: any[]) => runtime.call(typeof comp === 'string' ? comp : comp?.$Name, method, args),
        splitColor: (c: string) => [0,0,0]
      }

      // Expor runtime globalmente
      if (typeof window !== 'undefined') {
        (window as any).__apexBlocksRuntime = {
          triggerEvent: (component: string, event: string, ...args: any[]) => {
            const handlers = eventHandlers[component]?.[event] || []
            handlers.forEach(h => {
              try { h(...args) } catch(e) { console.error('Erro no handler:', e) }
            })
          },
          getEventHandlers: () => eventHandlers
        }
      }

      // Executar codigo gerado
      const wrappedCode = `
        (function(__runtime, __globals) {
          ${generatedCode}
        })
      `
      
      try {
        const fn = eval(wrappedCode)
        fn(runtime, globals)
        console.log('[v0] Codigo dos blocos executado com sucesso')
        toast.success('Modo Live ativado!')
      } catch (e) {
        console.error('[v0] Erro ao executar codigo:', e)
      }

      setRuntimeInitialized(true)
    } catch (e) {
      console.error('[v0] Erro ao inicializar runtime:', e)
      setRuntimeInitialized(true)
    }
  }, [currentScreenName, currentProject, updateComponent])

  // Handler para disparar eventos de componentes
  const handleTriggerEvent = useCallback((componentName: string, eventName: string) => {
    const runtime = getBlocksRuntime()
    if (runtime) {
      console.log(`[v0] Disparando evento: ${componentName}.${eventName}`)
      runtime.triggerEvent(componentName, eventName)
    }
  }, [])

  // Reset runtime quando sair do modo run
  useEffect(() => {
    if (appMode !== "run") {
      setRuntimeInitialized(false)
      if (typeof window !== 'undefined') {
        delete (window as any).__apexBlocksRuntime
      }
    }
  }, [appMode])
  
  // Fictitious connected users (all, shown 3 inline + rest in modal)
  const allUsers = [
    { id: "1", name: "Maria S.", avatar: "https://i.pravatar.cc/32?img=1", color: "#22c55e", role: "member" },
    { id: "2", name: "Joao P.", avatar: "https://i.pravatar.cc/32?img=2", color: "#3b82f6", role: "member" },
    { id: "3", name: "Ana L.", avatar: "https://i.pravatar.cc/32?img=3", color: "#a855f7", role: "leader" },
    { id: "4", name: "Carlos M.", avatar: "https://i.pravatar.cc/32?img=4", color: "#f59e0b", role: "member" },
    { id: "5", name: "Beatriz R.", avatar: "https://i.pravatar.cc/32?img=5", color: "#ec4899", role: "member" },
  ]
  const connectedUsers = allUsers.slice(0, 3)
  const extraCount = allUsers.length - connectedUsers.length

  // Modal & menu state
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const usersModalRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close modal/menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (usersModalRef.current && !usersModalRef.current.contains(e.target as Node)) {
        setShowUsersModal(false)
        setSelectedUserId(null)
      }
    }
    if (showUsersModal) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showUsersModal])

  const handleUserClick = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenuPosition({ top: rect.top, left: rect.right + 8 })
    setSelectedUserId(prev => prev === userId ? null : userId)
  }

  const handleAction = (action: string, userName: string) => {
    console.log(`Action: ${action} on ${userName}`)
    setSelectedUserId(null)
    setShowUsersModal(false)
  }

  const handleComponentSelect = useCallback((comp: KodularComponent) => {
    setSelectedComponent(comp)
    setShowProperties(true)
  }, [setSelectedComponent, setShowProperties])

  const handleDeviceChange = (deviceName: string) => {
    const allDevices = [...devicePresets.phone, ...devicePresets.tablet, ...devicePresets.custom]
    const device = allDevices.find(d => d.name === deviceName)
    if (device) {
      setSelectedDevice(device)
    }
  }

  const toggleOrientation = () => {
    setIsLandscape(!isLandscape)
  }

  const deviceWidth = isLandscape ? selectedDevice.height : selectedDevice.width
  const deviceHeight = isLandscape ? selectedDevice.width : selectedDevice.height

  // Auto-fit always active - recalculate on any change
  useEffect(() => {
    if (!containerRef.current) return
    
    const calculateFit = () => {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      // Calculate frame size including padding
      const fw = deviceWidth + (deviceType === "phone" ? 28 : 36)
      const fh = deviceHeight + (deviceType === "phone" ? 76 : 48)
      
      // 40px margin
      const scaleW = (width - 40) / fw
      const scaleH = (height - 40) / fh
      
      // Use the smaller scale to fit entirely, max 1 (100%)
      const newScale = Math.min(scaleW, scaleH, 1)
      if (newScale > 0.2) {
        setScale(newScale)
      }
    }
    
    // Calculate immediately
    calculateFit()
    
    const resizeObserver = new ResizeObserver(() => {
      calculateFit()
    })
    
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [deviceWidth, deviceHeight, deviceType, currentProject])

  // Show welcome screen when no repo selected
  if (!selectedRepo) {
    return (
      <main className="flex-1 bg-background flex flex-col items-center justify-center overflow-hidden relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "32px 32px"
            }}
          />
        </div>
        
        <div className="text-center px-10 relative z-10">
          <Zap className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">APEX DROID AI</h1>
          <p className="text-muted-foreground mb-10">
            O futuro do desenvolvimento Kodular, potencializado por IA.
          </p>

          <div className="flex gap-5 justify-center">
            <div 
              onClick={() => setActiveTab("telas")}
              className="bg-secondary border border-border p-6 rounded-2xl max-w-[200px] cursor-pointer hover:-translate-y-1 hover:border-primary transition-all"
            >
              <PlusCircle className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Selecionar Tela</h3>
              <p className="text-xs text-muted-foreground">
                Selecione uma tela do projeto para editar.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-10">
            DICA: Pressione{" "}
            <kbd className="bg-secondary px-1.5 py-0.5 rounded font-mono text-[10px]">Ctrl</kbd>
            {" + "}
            <kbd className="bg-secondary px-1.5 py-0.5 rounded font-mono text-[10px]">K</kbd>
            {" "}para abrir a Paleta de Comandos.
          </p>
        </div>
      </main>
    )
  }

  // Repo selected but no screen loaded yet - show message to select a screen
  if (!currentProject) {
    return (
      <main className="flex-1 bg-background flex flex-col items-center justify-center overflow-hidden relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "32px 32px"
            }}
          />
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Projeto carregado</h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-xs">
            Selecione uma tela na aba TELAS para visualizar e editar no preview.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveTab("telas")}
          >
            Ver telas do projeto
          </Button>
        </div>
      </main>
    )
  }

  const props = currentProject.Properties

  return (
    <main className="flex-1 bg-background flex flex-col relative overflow-hidden min-w-[320px]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px"
          }}
        />
      </div>

      {/* Top Controls Bar - Compact & Responsive */}
      <div className="flex items-center justify-center gap-2 px-2 py-1 border-b border-border/50 bg-card/80 backdrop-blur-sm z-10 flex-wrap">
        {/* Device Type Tabs */}
        <div className="bg-secondary rounded-md p-0.5 flex gap-0.5">
          <Button
            variant={deviceType === "phone" ? "default" : "ghost"}
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => {
              setDeviceType("phone")
              setSelectedDevice(devicePresets.phone[1])
            }}
          >
            <Smartphone className="w-3 h-3" />
          </Button>
          <Button
            variant={deviceType === "tablet" ? "default" : "ghost"}
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => {
              setDeviceType("tablet")
              setSelectedDevice(devicePresets.tablet[0])
            }}
          >
            <Tablet className="w-3 h-3" />
          </Button>
        </div>

        {/* Device Dropdown */}
        <Select value={selectedDevice.name} onValueChange={handleDeviceChange}>
          <SelectTrigger className="w-[100px] h-6 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">CELULARES</div>
            {devicePresets.phone.map(device => (
              <SelectItem key={device.name} value={device.name} className="text-[10px]">
                {device.name}
              </SelectItem>
            ))}
            <div className="px-2 py-0.5 text-[9px] font-semibold text-muted-foreground mt-1">TABLETS</div>
            {devicePresets.tablet.map(device => (
              <SelectItem key={device.name} value={device.name} className="text-[10px]">
                {device.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Orientation Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={toggleOrientation}
        >
          <RotateCcw className={cn("w-3 h-3 transition-transform", isLandscape && "rotate-90")} />
        </Button>

        {/* Zoom Controls - Always visible */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-md px-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={() => setScale(Math.max(0.3, scale - 0.1))}
          >
            <Minimize2 className="w-2.5 h-2.5" />
          </Button>
          <span className="text-[9px] font-mono text-muted-foreground w-7 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={() => setScale(Math.min(1.5, scale + 0.1))}
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </Button>
        </div>

        {/* Screen Size */}
        <span className="text-[9px] text-muted-foreground font-mono">
          {deviceWidth}x{deviceHeight}
        </span>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-grid-pattern">
        {appMode === "blocks" ? (
          <BkyWorkspace />
        ) : (
          <div ref={containerRef} className="flex-1 flex items-center justify-center p-2 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-primary/5 rounded-full blur-[80px]" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-info/5 rounded-full blur-[80px]" />

            {/* Device Frame */}
        <div 
          className={cn(
            "relative transition-all duration-500 ease-in-out",
            isThinking && "ring-4 ring-primary/40 ring-offset-4 ring-offset-background animate-pulse-glow rounded-[3rem]",
            (appMode as string) === "blocks" && "animate-float"
          )}
          style={{ transform: `scale(${scale})` }}
        >
          {/* Main Phone Frame with Premium Finish */}
          <div className={cn(
            "bg-[#0a0a0a] shadow-[0_0_0_2px_#222,0_0_0_10px_#111,0_30px_60px_-15px_rgba(0,0,0,0.8)] border border-white/5 relative",
            deviceType === "tablet" ? "rounded-[3rem]" : "rounded-[3.5rem]"
          )}>
            {/* Bezel Gloss Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-10 rounded-[inherit]" />
            
            <div 
              className="relative"
              style={{
                padding: deviceType === "phone" ? "14px" : "18px",
                paddingTop: deviceType === "phone" ? "38px" : "24px",
                paddingBottom: deviceType === "phone" ? "38px" : "24px"
              }}
            >
              {/* Notch/Camera (for phones) */}
              {deviceType === "phone" && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#0a0a0a] rounded-full flex items-center justify-center gap-3 z-20 shadow-inner">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a] border border-white/5"></div>
                  <div className="w-14 h-4 rounded-full bg-[#111] border border-white/5"></div>
                </div>
              )}

              {/* Screen Container */}
              <div 
                className="bg-white overflow-hidden flex flex-col relative z-0"
                style={{
                  width: `${deviceWidth}px`,
                  height: `${deviceHeight}px`,
                  borderRadius: deviceType === "phone" ? "32px" : "18px"
                }}
              >
                {/* Status Bar */}
                <div className="h-7 bg-[#0a0a0a] flex items-center justify-between px-6 text-white text-[10px] shrink-0 font-medium">
                  <span>9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-2 border border-white rounded-sm">
                    <div className="w-2/3 h-full bg-white rounded-sm"></div>
                  </div>
                </div>
              </div>

              {/* Title Bar */}
              {props.TitleVisible !== "False" && (
                <div 
                  className="px-4 py-3 text-sm font-semibold shrink-0"
                  style={{
                    backgroundColor: convertColor((props.TitleBarColor as any) || "&HFF6200EE"),
                    color: "white"
                  }}
                >
                  {props.Title || props.$Name}
                </div>
              )}

              {/* Screen Content */}
              <DroppableZone
                id="phone-screen-content"
                targetName={props.$Name}
                className={cn(
                  "flex-1 overflow-auto flex flex-col p-2 relative transition-all duration-300 isolate",
                  isThinking && "animate-blinking ring-2 ring-primary/30 ring-inset"
                )}
                style={{
                  backgroundColor: convertColor(props.BackgroundColor || "&HFFFFFFFF"),
                  alignItems: convertAlignment(props.AlignHorizontal),
                  justifyContent: convertAlignment(props.AlignVertical)
                }}
                disabled={appMode !== "edit"}
              >
                {isThinking && (
                  <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-primary/5">
                    <div className="bg-primary/20 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/30 flex items-center gap-2">
                      <Zap className="w-3 h-3 text-primary animate-pulse" />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">AI Processing</span>
                    </div>
                  </div>
                )}
                <div 
                  className="absolute inset-0 z-[-1]"
                  onClick={() => {
                    if (appMode === "edit") {
                      // Click on empty area - select the screen itself
                      setSelectedComponent(props)
                      setShowProperties(true)
                    }
                  }}
                />
                {currentProject.Properties.$Components?.map((comp, idx) => (
              <ComponentRenderer 
                key={comp.$Name} 
                component={comp} 
                onSelect={setSelectedComponent}
                selectedName={selectedComponent?.$Name}
                appMode={appMode}
                assets={projectAssets}
                moveComponent={moveComponent}
                dragOverInfo={dragOverInfo}
                setDragOverInfo={setDragOverInfo}
                parentName={currentProject.Properties.$Name}
                index={idx}
                onTriggerEvent={handleTriggerEvent}
              />
            ))}
                
                {(!props.$Components || props.$Components.length === 0) && appMode === "edit" && (
                  <EmptyDropZone
                    id={`empty-${props.$Name}`}
                    targetName={props.$Name}
                    className="flex-1 m-2"
                  />
                )}
              </DroppableZone>

              {/* Non-Visible Components Bar */}
              {props.$Components?.some(c => 
                ["Clock", "Sound", "Notifier", "TinyDB", "Web", "Firebase", "Cloudinary"].includes(c.$Type)
              ) && (
                <div className="bg-gray-100 border-t border-gray-200 px-3 py-2 flex gap-2 overflow-x-auto shrink-0">
                  <span className="text-[10px] text-gray-400 opacity-50 shrink-0">NAO VISIVEIS</span>
                  {props.$Components
                    .filter(c => ["Clock", "Sound", "Notifier", "TinyDB", "Web", "Firebase", "Cloudinary"].includes(c.$Type))
                    .map(c => (
                      <div 
                        key={c.$Name}
                        className={cn(
                          "bg-white border px-2.5 py-1 rounded text-[10px] font-semibold cursor-pointer hover:border-blue-500 shrink-0",
                          selectedComponent?.$Name === c.$Name ? "border-blue-500 bg-blue-50" : "border-gray-300"
                        )}
                        onClick={() => handleComponentSelect(c)}
                      >
                        {c.$Name}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            {/* Home Indicator (for phones) */}
            {deviceType === "phone" && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-600 rounded-full"></div>
            )}
            </div>
          </div>
        </div>
        
        {/* Connected Users - Bottom Right */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1 border border-border/50 shadow-lg z-30">
          <div className="flex -space-x-2">
            {connectedUsers.map((user, idx) => (
              <div
                key={idx}
                className="relative group cursor-pointer"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full border-2 border-card object-cover transition-transform group-hover:scale-110"
                  style={{ borderColor: user.color }}
                />
                <span 
                  className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-card"
                  style={{ backgroundColor: user.color }}
                />
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg z-50"
                  style={{ background: user.color, color: "#fff" }}
                >
                  {user.name}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: user.color }} />
                </div>
              </div>
            ))}
          </div>
          {/* +N badge — click to open modal */}
          {extraCount > 0 && (
            <button
              onClick={() => setShowUsersModal(true)}
              className="ml-1 text-[9px] font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-full w-5 h-5 flex items-center justify-center transition-all hover:scale-110 shadow"
            >
              +{extraCount}
            </button>
          )}
        </div>

        {/* Users List Modal */}
        {showUsersModal && (
          <div
            ref={usersModalRef}
            className="absolute bottom-12 right-3 w-52 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{ backdropFilter: "blur(16px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/50">
              <span className="text-[11px] font-semibold text-foreground">Usuários Online</span>
              <button
                onClick={() => { setShowUsersModal(false); setSelectedUserId(null) }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* User list */}
            <div className="py-1">
              {allUsers.map((user) => (
                <div key={user.id} className="relative">
                  <button
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-secondary/60 transition-colors group/item",
                      selectedUserId === user.id && "bg-secondary"
                    )}
                    onClick={(e) => handleUserClick(user.id, e)}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover"
                        style={{ border: `2px solid ${user.color}` }}
                      />
                      <span
                        className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-card"
                        style={{ backgroundColor: user.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium text-foreground truncate">{user.name}</span>
                        {user.role === "leader" && (
                          <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground">{user.role === "leader" ? "Líder" : "Membro"}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  </button>

                  {/* Inline action menu */}
                  {selectedUserId === user.id && (
                    <div className="mx-3 mb-1 rounded-lg border border-border bg-background shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-amber-500/10 hover:text-amber-400 transition-colors text-foreground"
                        onClick={() => handleAction("leader", user.name)}
                      >
                        <Crown className="w-3 h-3 text-amber-400" />
                        Tornar Líder
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-rose-500/10 hover:text-rose-400 transition-colors text-foreground border-t border-border"
                        onClick={() => handleAction("disconnect", user.name)}
                      >
                        <UserX className="w-3 h-3 text-rose-400" />
                        Desconectar
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-blue-500/10 hover:text-blue-400 transition-colors text-foreground border-t border-border"
                        onClick={() => handleAction("mute", user.name)}
                      >
                        <VolumeX className="w-3 h-3 text-blue-400" />
                        Silenciar movimentos
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
</main>
  )
}
