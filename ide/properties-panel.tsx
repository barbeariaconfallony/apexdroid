"use client"

import { useState } from "react"
import { X, Zap, ChevronDown, ChevronRight, Trash2, Copy, Palette, Sparkles, Plus, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIDEStore } from "@/lib/ide-store"
import { useAIChat } from "@/lib/hooks/use-ai-chat"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { KodularComponent } from "@/lib/ide-types"
import { componentMetadata } from "@/lib/metadata"
import { useEffect } from "react"

// Componente para evitar travamentos ao salvar histórico
function RealtimeInput({ value, onChange, placeholder, className, type = "text" }: any) {
  const [localValue, setLocalValue] = useState(value)

  // Sincroniza apenas se o valor externo mudar (ex: troca de componente)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  return (
    <Input
      type={type}
      value={localValue}
      onChange={(e) => {
        const val = e.target.value
        setLocalValue(val)
        // Atualiza a tela em tempo real SEM salvar snapshot (rápido)
        onChange(val, true)
      }}
      onBlur={() => {
        // Salva o snapshot apenas quando terminar de digitar
        onChange(localValue, false)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onChange(localValue, false)
        }
      }}
      className={className}
      placeholder={placeholder}
    />
  )
}

// Property categories for better organization
const propertyCategories = {
  basic: {
    name: "Básico",
    properties: ["Text", "Hint", "Title", "Enabled", "Visible", "HTMLFormat", "Checked", "Selection"]
  },
  appearance: {
    name: "Aparência",
    properties: [
      "BackgroundColor", "TextColor", "FontSize", "FontBold", "FontItalic", 
      "FontTypeface", "TextAlignment", "Shape", "Image", "Picture", "RotationAngle", 
      "ShowFeedback", "TouchColor", "BorderShadow", "PaintColor", "Color",
      "ThumbColor", "TrackColor"
    ]
  },
  size: {
    name: "Tamanho",
    properties: ["Width", "Height", "WidthPercent", "HeightPercent", "Radius", "CornerRadius"]
  },
  layout: {
    name: "Layout",
    properties: ["AlignHorizontal", "AlignVertical", "Orientation", "Scrollable", "Columns", "Rows"]
  },
  advanced: {
    name: "Avançado",
    properties: ["Name", "Uuid"] 
  }
}

// Color presets
const colorPresets = [
  { name: "Branco", value: "&HFFFFFFFF" },
  { name: "Preto", value: "&HFF000000" },
  { name: "Azul", value: "&HFF2196F3" },
  { name: "Vermelho", value: "&FFF44336" },
  { name: "Verde", value: "&HFF4CAF50" },
  { name: "Amarelo", value: "&FFFFEB3B" },
  { name: "Roxo", value: "&HFF9C27B0" },
  { name: "Laranja", value: "&HFFFF9800" },
  { name: "Cinza", value: "&HFF9E9E9E" },
  { name: "Transparente", value: "&H00FFFFFF" },
]

// Size presets
const sizePresets = [
  { name: "Auto", value: "-1" },
  { name: "Preencher", value: "-2" },
  { name: "50px", value: "50" },
  { name: "100px", value: "100" },
  { name: "150px", value: "150" },
  { name: "200px", value: "200" },
]

// Alignment presets
const alignmentPresets = [
  { name: "Inicio", value: "1" },
  { name: "Centro", value: "2" },
  { name: "Fim", value: "3" },
]

interface PropertiesPanelProps {
  onShowBlocks: () => void
}

export function PropertiesPanel({ onShowBlocks }: PropertiesPanelProps) {
  const { 
    showProperties, setShowProperties, 
    selectedComponent, updateComponent, removeComponent,
    blocks, currentProject, setSelectedComponent,
    projectAssets
  } = useIDEStore()

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    appearance: true,
    size: true,
    layout: false,
    media: false,
    advanced: false,
    events: true,
    tree: true
  })

  if (!showProperties) return null

  const componentBlocks = blocks.filter(
    b => b.component === selectedComponent?.$Name
  )

  const handlePropertyChange = (key: string, value: string, skipSnapshot: boolean = false) => {
    if (selectedComponent) {
      updateComponent(selectedComponent.$Name, { [key]: value }, skipSnapshot)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleDelete = () => {
    if (selectedComponent && selectedComponent.$Name !== currentProject?.Properties.$Name) {
      removeComponent(selectedComponent.$Name)
    }
  }

  // Categorize properties
  const categorizedProperties: Record<string, Array<[string, unknown]>> = {
    basic: [],
    appearance: [],
    size: [],
    layout: [],
    advanced: []
  }

  if (selectedComponent) {
    // 1. Get properties from metadata for this component type
    const componentType = selectedComponent.$Type.split('.').pop() || ""
    const metadata = componentMetadata[componentType]
    const metadataProps = metadata?.properties || []
    
    // 2. Get properties currently present in the object
    const actualProps = Object.keys(selectedComponent).filter(k => !k.startsWith("$"))
    
    // 3. Merge them (metadata takes precedence for order/availability)
    // We normalize names because metadata has spaces (e.g. "Background Color") 
    // but the object usually has them PascalCase or similar (e.g. "BackgroundColor")
    const allRelevantProps = new Set<string>()
    
    // Add metadata properties (normalized)
    metadataProps.forEach(p => {
      const normalized = p.replace(/\s+/g, '')
      allRelevantProps.add(normalized)
    })
    
    // Add any extra properties already in the object
    actualProps.forEach(p => allRelevantProps.add(p))

    allRelevantProps.forEach(key => {
      const value = selectedComponent[key] ?? ""
      let found = false
      for (const [category, config] of Object.entries(propertyCategories)) {
        if (config.properties.includes(key)) {
          categorizedProperties[category].push([key, value])
          found = true
          break
        }
      }
      if (!found) {
        categorizedProperties.advanced.push([key, value])
      }
    })
  }

  // Render property input based on type
  const renderPropertyInput = (key: string, value: unknown) => {
    const stringValue = String(value)
    
    // Color properties
    if (key.toLowerCase().includes("color") || key === "TouchColor") {
      return (
        <div className="space-y-1">
          <div className="flex gap-1">
            <RealtimeInput
              value={stringValue}
              onChange={(val: string, skip: boolean) => handlePropertyChange(key, val, skip)}
              className="bg-input border-border text-[10px] h-6 font-mono flex-1"
            />
            <div 
              className="w-6 h-6 rounded border border-border cursor-pointer shrink-0"
              style={{ backgroundColor: convertKodularColor(stringValue) }}
              onClick={() => {/* Open color picker? */}}
            />
          </div>
          <div className="flex flex-wrap gap-0.5">
            {colorPresets.map(preset => (
              <button
                key={preset.value}
                onClick={() => handlePropertyChange(key, preset.value)}
                className={cn(
                  "w-4 h-4 rounded-sm border border-border transition-all",
                  stringValue === preset.value ? "ring-1 ring-primary border-primary" : "hover:scale-110"
                )}
                style={{ backgroundColor: convertKodularColor(preset.value) }}
                title={preset.name}
              />
            ))}
          </div>
        </div>
      )
    }
    
    // Size properties (Width, Height)
    if (key === "Width" || key === "Height") {
      return (
        <div className="flex gap-0.5">
          <Input
            value={stringValue === "-1" ? "Auto" : stringValue === "-2" ? "Fill" : stringValue}
            onChange={(e) => {
              const val = e.target.value
              if (val === "Auto") handlePropertyChange(key, "-1")
              else if (val === "Fill") handlePropertyChange(key, "-2")
              else handlePropertyChange(key, val)
            }}
            className="bg-input border-border text-[10px] h-6 flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            className={cn("h-6 w-6 p-0 border-border", stringValue === "-1" && "bg-primary/20 border-primary")}
            onClick={() => handlePropertyChange(key, "-1")}
            title="Auto"
          >
            <div className="w-2.5 h-2.5 border border-current rounded-sm opacity-60" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn("h-6 w-6 p-0 border-border", stringValue === "-2" && "bg-primary/20 border-primary")}
            onClick={() => handlePropertyChange(key, "-2")}
            title="Fill"
          >
            <Zap className="w-2.5 h-2.5" />
          </Button>
        </div>
      )
    }
    
    // Alignment properties
    if (key.includes("Align") || key === "TextAlignment") {
      const isHorizontal = key.includes("Horizontal") || key === "TextAlignment"
      const labels = isHorizontal 
        ? ["Esq", "Centro", "Dir"] 
        : ["Topo", "Centro", "Base"]
        
      return (
        <Select value={stringValue} onValueChange={(v) => handlePropertyChange(key, v)}>
          <SelectTrigger className="bg-input border-border text-[10px] h-6">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {labels.map((label, idx) => (
              <SelectItem key={idx} value={String(idx + 1)} className="text-[10px]">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    
    // Boolean / Checkbox properties
    if (typeof value === "boolean" || value === "True" || value === "False" || 
        ["Enabled", "Visible", "FontBold", "FontItalic", "ShowFeedback", "HTMLFormat", "BorderShadow", "Scrollable"].includes(key)) {
      const isTrue = stringValue === "True" || value === true
      return (
        <div 
          className={cn(
            "flex items-center gap-2 cursor-pointer group p-1 rounded hover:bg-muted/50 transition-colors",
            isTrue ? "text-primary" : "text-muted-foreground"
          )}
          onClick={() => handlePropertyChange(key, isTrue ? "False" : "True")}
        >
          <div className={cn(
            "w-4 h-4 rounded border flex items-center justify-center transition-all",
            isTrue ? "bg-primary border-primary" : "bg-input border-border group-hover:border-primary/50"
          )}>
            {isTrue && <X className="w-3 h-3 text-primary-foreground stroke-[3]" />}
          </div>
          <span className="text-[11px] font-medium">{isTrue ? "Ativado" : "Desativado"}</span>
        </div>
      )
    }
    
    // Font Typeface
    if (key === "FontTypeface") {
      return (
        <Select value={stringValue} onValueChange={(v) => handlePropertyChange(key, v)}>
          <SelectTrigger className="bg-input border-border text-[10px] h-6">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0" className="text-[10px]">Padrao</SelectItem>
            <SelectItem value="1" className="text-[10px]">Sans</SelectItem>
            <SelectItem value="2" className="text-[10px]">Serif</SelectItem>
            <SelectItem value="3" className="text-[10px]">Mono</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    // Shape
    if (key === "Shape") {
      return (
        <Select value={stringValue} onValueChange={(v) => handlePropertyChange(key, v)}>
          <SelectTrigger className="bg-input border-border text-[10px] h-6">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0" className="text-[10px]">Padrao</SelectItem>
            <SelectItem value="1" className="text-[10px]">Arredondado</SelectItem>
            <SelectItem value="2" className="text-[10px]">Retangular</SelectItem>
            <SelectItem value="3" className="text-[10px]">Oval</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    // Image / Picture selection
    if (key === "Image" || key === "Picture") {
      const imageAssets = projectAssets.filter(a => a.type === "image")
      return (
        <div 
          className="space-y-1.5 group/image-prop"
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.classList.add("drag-over")
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove("drag-over")
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove("drag-over")
            const assetName = e.dataTransfer.getData("assetName")
            if (assetName) {
              handlePropertyChange(key, assetName)
              toast.success(`Imagem aplicada`, {
                description: `${assetName} vinculada a ${key}`,
                icon: <ImageIcon className="w-4 h-4 text-primary" />
              })
            }
          }}
        >
          <div className="flex gap-1">
            <Select 
              value={stringValue === "undefined" || stringValue === "" ? "none" : stringValue} 
              onValueChange={(v) => handlePropertyChange(key, v === "none" ? "" : v)}
            >
              <SelectTrigger className="bg-input/50 border-border/50 text-[10px] h-7 hover:bg-input transition-colors">
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent className="glass border-white/10">
                <SelectItem value="none" className="text-[10px]">Nenhuma</SelectItem>
                {imageAssets.map(asset => (
                  <SelectItem key={asset.path} value={asset.name} className="text-[10px]">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-sm border border-border/50 overflow-hidden bg-secondary/50">
                        <img src={asset.url} className="w-full h-full object-cover" />
                      </div>
                      {asset.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={cn(
            "relative w-full h-20 rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden group/preview",
            "bg-secondary/20 border-border/30 hover:border-primary/50 hover:bg-primary/5",
            "group-[.drag-over]/image-prop:border-primary group-[.drag-over]/image-prop:bg-primary/10 group-[.drag-over]/image-prop:scale-[1.02]"
          )}>
            {stringValue && stringValue !== "" && stringValue !== "undefined" ? (
              <>
                <img 
                  src={imageAssets.find(a => a.name === stringValue)?.url || ""} 
                  alt="Preview" 
                  className="max-w-[85%] max-h-[85%] object-contain transition-all duration-500 group-hover/preview:scale-110 drop-shadow-md"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <span className="text-[8px] text-white font-bold truncate drop-shadow-sm">{stringValue}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 opacity-40 group-hover/preview:opacity-100 transition-opacity">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-[8px] font-medium uppercase tracking-tighter">Arraste aqui</span>
              </div>
            )}
            
            {/* Drag overlay hint */}
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] opacity-0 group-[.drag-over]/image-prop:opacity-100 flex items-center justify-center transition-all">
              <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-[9px] font-bold shadow-lg flex items-center gap-2 animate-bounce">
                <Plus className="w-3 h-3" />
                SOLTAR IMAGEM
              </div>
            </div>
          </div>
          
          <style jsx>{`
            .drag-over {
              /* Utilizado para seletor group CSS */
            }
          `}</style>
        </div>
      )
    }

    // Number inputs (FontSize, RotationAngle)
    if (key === "FontSize" || key === "RotationAngle") {
      return (
        <RealtimeInput
          type="number"
          value={stringValue}
          onChange={(val: string, skip: boolean) => handlePropertyChange(key, val, skip)}
          className="bg-input border-border text-[10px] h-6 font-mono"
        />
      )
    }
    
    // Default text input
    return (
      <RealtimeInput
        value={stringValue === "undefined" ? "" : stringValue}
        onChange={(val: string, skip: boolean) => handlePropertyChange(key, val, skip)}
        className="bg-input border-border text-[10px] h-6"
        placeholder={key}
      />
    )
  }

  return (
    <aside className="w-[240px] bg-card border-l border-border/50 flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/50 flex justify-between items-center shrink-0">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Propriedades</h3>
        <X 
          className="w-3.5 h-3.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" 
          onClick={() => setShowProperties(false)}
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-2.5">
        {selectedComponent ? (
          <>
            {/* Component Header */}
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-border/30">
              <div className="min-w-0 flex-1">
                <div className="text-primary font-semibold text-xs truncate">
                  {selectedComponent.$Name}
                </div>
                <div className="text-[9px] text-muted-foreground truncate">
                  {selectedComponent.$Type.split('.').pop()}
                </div>
              </div>
              <div className="flex gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {/* Copy component */}}
                  title="Duplicar"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                {selectedComponent.$Name !== currentProject?.Properties.$Name && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={handleDelete}
                    title="Excluir"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Property Categories */}
            {Object.entries(categorizedProperties).map(([category, properties]) => {
              if (properties.length === 0) return null
              const categoryConfig = propertyCategories[category as keyof typeof propertyCategories]
              
              return (
                <div key={category} className="mb-2">
                  <button
                    onClick={() => toggleSection(category)}
                    className="w-full flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 hover:text-foreground transition-colors"
                  >
                    {expandedSections[category] ? (
                      <ChevronDown className="w-2.5 h-2.5" />
                    ) : (
                      <ChevronRight className="w-2.5 h-2.5" />
                    )}
                    {categoryConfig.name}
                    <span className="text-[8px] text-muted-foreground/50 ml-auto">
                      {properties.length}
                    </span>
                  </button>
                  
                  {expandedSections[category] && (
                    <div className="space-y-1.5 pl-4">
                      {properties.map(([key, value]) => (
                        <div key={key}>
                          <Label className="text-[9px] text-muted-foreground uppercase block mb-0.5">
                            {key}
                          </Label>
                          {renderPropertyInput(key, value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">
            Selecione um componente no preview para ver suas propriedades.
          </p>
        )}
      </div>

      {/* Events Section */}
      <div className="p-2.5 border-t border-border/50 bg-black/5 shrink-0">
        <button
          onClick={() => toggleSection("events")}
          className="w-full flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 hover:text-foreground"
        >
          {expandedSections.events ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
          Eventos
          <Zap className="w-2.5 h-2.5 text-amber-500" />
        </button>

        {expandedSections.events && (
          <>
            {componentBlocks.length > 0 ? (
              <div className="space-y-1.5">
                {componentBlocks.map((block, i) => (
                  <div 
                    key={i}
                    className="bg-secondary border-l-2 border-amber-500 p-1.5 rounded text-[10px]"
                  >
                    <div className="font-semibold flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      {block.eventName}
                    </div>
                    <div className="text-muted-foreground text-[9px]">
                      {block.summary}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                Nenhum evento configurado.
              </p>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-[9px] h-7 mt-2"
              onClick={onShowBlocks}
            >
              VER BLOCOS
            </Button>
          </>
        )}
      </div>

    </aside>
  )
}

// Helper function to convert Kodular color to CSS
function convertKodularColor(k?: string): string {
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

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4" />
      <path d="m16.2 7.8 2.9-2.9" />
      <path d="M18 12h4" />
      <path d="m16.2 16.2 2.9 2.9" />
      <path d="M12 18v4" />
      <path d="m4.9 19.1 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.9 4.9 2.9 2.9" />
    </svg>
  )
}
