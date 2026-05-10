"use client"

import { useState, useCallback, memo, useRef, useEffect } from "react"
import { Zap, PlusCircle, Github, Smartphone, Tablet, RotateCcw, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BkyWorkspace } from "./bky-workspace"
import { useIDEStore } from "@/lib/ide-store"
import type { KodularComponent, ProjectAsset } from "@/lib/ide-types"
import { cn } from "@/lib/utils"
import { DroppableZone, EmptyDropZone } from "./droppable-zone"
import { useIDEDnd } from "./dnd-context"

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

interface ComponentRendererProps {
  component: KodularComponent
  onSelect: (comp: KodularComponent) => void
  selectedName?: string
  appMode: "edit" | "run"
  assets?: ProjectAsset[]
}

// Resolve asset URL from asset name
function resolveAssetUrl(assetName: string | undefined, assets: ProjectAsset[]): string | null {
  if (!assetName) return null
  // Find asset by name (case insensitive)
  const asset = assets.find(a => a.name.toLowerCase() === assetName.toLowerCase())
  return asset?.url || null
}

const ComponentRenderer = memo(({ component, onSelect, selectedName, appMode, assets = [] }: ComponentRendererProps) => {
  const { $Type, $Name, $Components } = component

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

  const baseStyle: React.CSSProperties = {
    width: convertSize(component.Width),
    height: convertSize(component.Height),
    backgroundColor: convertColor(component.BackgroundColor || "&H00FFFFFF")
  }

  const handleClick = (e: React.MouseEvent) => {
    if (appMode === "edit") {
      e.stopPropagation()
      onSelect(component)
    }
  }

  if ($Type === "Button") {
    return (
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
    return (
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
    return (
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
    return (
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
    return (
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
    return (
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
    return (
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
    return (
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
    return (
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
        {$Components?.map((child) => (
          <ComponentRenderer
            key={child.$Name}
            component={child}
            onSelect={onSelect}
            selectedName={selectedName}
            appMode={appMode}
            assets={assets}
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
        {$Components?.map((child) => (
          <ComponentRenderer
            key={child.$Name}
            component={child}
            onSelect={onSelect}
            selectedName={selectedName}
            appMode={appMode}
            assets={assets}
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
    return (
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
    return (
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
    return (
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
  return (
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

interface PhonePreviewProps {
  onLoginClick: () => void
}

export function PhonePreview({ onLoginClick }: PhonePreviewProps) {
  const { 
    currentProject, appMode, setAppMode,
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
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Fictitious connected users
  const connectedUsers = [
    { name: "Maria S.", avatar: "https://i.pravatar.cc/32?img=1", color: "#22c55e" },
    { name: "Joao P.", avatar: "https://i.pravatar.cc/32?img=2", color: "#3b82f6" },
    { name: "Ana L.", avatar: "https://i.pravatar.cc/32?img=3", color: "#a855f7" },
  ]

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
            {!ghToken && (
              <div 
                onClick={() => {
                  onLoginClick()
                }}
                className="bg-secondary border border-border p-6 rounded-2xl max-w-[200px] cursor-pointer hover:-translate-y-1 hover:border-primary transition-all"
              >
                <Github className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Conectar GitHub</h3>
                <p className="text-xs text-muted-foreground">
                  Importe seus projetos existentes e comece a editar.
                </p>
              </div>
            )}

            <div className="bg-secondary border border-border p-6 rounded-2xl max-w-[200px] cursor-pointer hover:-translate-y-1 hover:border-primary transition-all">
              <PlusCircle className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Novo Projeto</h3>
              <p className="text-xs text-muted-foreground">
                Inicie do zero com um template limpo e moderno.
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
            appMode === "blocks" && "animate-float"
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
                    backgroundColor: convertColor(props.TitleBarColor || "&HFF6200EE"),
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
                {props.$Components?.map((comp) => {
                  // Filter hidden components based on showHiddenComponents flag
                  const isHidden = comp.Visible === "False" || comp.Hidden === "True"
                  if (isHidden && !showHiddenComponents) {
                    return null
                  }
                  
                  return (
                    <ComponentRenderer
                      key={comp.$Name}
                      component={comp}
                      onSelect={handleComponentSelect}
                      selectedName={selectedComponent?.$Name}
                      appMode={appMode}
                      assets={projectAssets}
                    />
                  )
                })}
                
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
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1 border border-border/50 shadow-lg">
          <div className="flex -space-x-2">
            {connectedUsers.map((user, idx) => (
              <div
                key={idx}
                className="relative group"
                title={user.name}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full border-2 border-card object-cover"
                  style={{ borderColor: user.color }}
                />
                <span 
                  className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-card"
                  style={{ backgroundColor: user.color }}
                />
              </div>
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground font-medium ml-1">+2</span>
        </div>
      </div>
    )}
  </div>
</main>
  )
}
