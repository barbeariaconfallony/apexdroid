"use client"

import { useState } from "react"
import { X, Zap, ChevronDown, ChevronRight, Trash2, Copy, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import type { KodularComponent } from "@/lib/ide-types"

// Property categories for better organization
const propertyCategories = {
  basic: {
    name: "Basico",
    properties: ["Text", "Hint", "Title", "Enabled", "Visible"]
  },
  appearance: {
    name: "Aparencia",
    properties: ["BackgroundColor", "TextColor", "FontSize", "FontBold", "FontItalic", "TextAlignment", "Shape"]
  },
  size: {
    name: "Tamanho",
    properties: ["Width", "Height"]
  },
  layout: {
    name: "Layout",
    properties: ["AlignHorizontal", "AlignVertical", "Orientation"]
  },
  media: {
    name: "Midia",
    properties: ["Picture", "Source", "Image"]
  },
  advanced: {
    name: "Avancado",
    properties: [] // Will contain remaining properties
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
    blocks, currentProject, setSelectedComponent
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

  const handlePropertyChange = (key: string, value: string) => {
    if (selectedComponent) {
      updateComponent(selectedComponent.$Name, { [key]: value })
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
    media: [],
    advanced: []
  }

  if (selectedComponent) {
    Object.entries(selectedComponent)
      .filter(([key]) => !key.startsWith("$"))
      .forEach(([key, value]) => {
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
    if (key.toLowerCase().includes("color")) {
      return (
        <div className="space-y-1">
          <div className="flex gap-1">
            <Input
              value={stringValue}
              onChange={(e) => handlePropertyChange(key, e.target.value)}
              className="bg-input border-border text-xs h-7 font-mono flex-1"
            />
            <div 
              className="w-7 h-7 rounded border border-border cursor-pointer"
              style={{ backgroundColor: convertKodularColor(stringValue) }}
              title="Cor atual"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {colorPresets.slice(0, 5).map(preset => (
              <button
                key={preset.value}
                onClick={() => handlePropertyChange(key, preset.value)}
                className="w-5 h-5 rounded border border-border hover:ring-1 ring-primary"
                style={{ backgroundColor: convertKodularColor(preset.value) }}
                title={preset.name}
              />
            ))}
            <Select onValueChange={(v) => handlePropertyChange(key, v)}>
              <SelectTrigger className="w-7 h-5 p-0 border-border">
                <Palette className="w-3 h-3 mx-auto" />
              </SelectTrigger>
              <SelectContent>
                {colorPresets.map(preset => (
                  <SelectItem key={preset.value} value={preset.value} className="text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: convertKodularColor(preset.value) }}
                      />
                      {preset.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    }
    
    // Size properties (Width, Height)
    if (key === "Width" || key === "Height") {
      return (
        <div className="space-y-1">
          <Input
            value={stringValue}
            onChange={(e) => handlePropertyChange(key, e.target.value)}
            className="bg-input border-border text-xs h-7 font-mono"
          />
          <div className="flex gap-1">
            {sizePresets.map(preset => (
              <button
                key={preset.value}
                onClick={() => handlePropertyChange(key, preset.value)}
                className={cn(
                  "px-1.5 py-0.5 text-[9px] rounded border transition-all",
                  stringValue === preset.value 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "border-border hover:border-primary"
                )}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )
    }
    
    // Alignment properties
    if (key.includes("Align")) {
      return (
        <Select value={stringValue} onValueChange={(v) => handlePropertyChange(key, v)}>
          <SelectTrigger className="bg-input border-border text-xs h-7">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {alignmentPresets.map(preset => (
              <SelectItem key={preset.value} value={preset.value} className="text-xs">
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    
    // Boolean properties
    if (value === "True" || value === "False" || key === "Enabled" || key === "Visible" || key === "FontBold" || key === "FontItalic") {
      return (
        <div className="flex gap-1">
          <button
            onClick={() => handlePropertyChange(key, "True")}
            className={cn(
              "flex-1 py-1 text-[10px] rounded border transition-all",
              stringValue === "True" 
                ? "bg-primary text-primary-foreground border-primary" 
                : "border-border hover:border-primary"
            )}
          >
            Sim
          </button>
          <button
            onClick={() => handlePropertyChange(key, "False")}
            className={cn(
              "flex-1 py-1 text-[10px] rounded border transition-all",
              stringValue === "False" 
                ? "bg-primary text-primary-foreground border-primary" 
                : "border-border hover:border-primary"
            )}
          >
            Nao
          </button>
        </div>
      )
    }
    
    // TextAlignment
    if (key === "TextAlignment") {
      return (
        <Select value={stringValue} onValueChange={(v) => handlePropertyChange(key, v)}>
          <SelectTrigger className="bg-input border-border text-xs h-7">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0" className="text-xs">Esquerda</SelectItem>
            <SelectItem value="1" className="text-xs">Centro</SelectItem>
            <SelectItem value="2" className="text-xs">Direita</SelectItem>
          </SelectContent>
        </Select>
      )
    }
    
    // Default text input
    return (
      <Input
        value={stringValue}
        onChange={(e) => handlePropertyChange(key, e.target.value)}
        className="bg-input border-border text-xs h-7 font-mono"
      />
    )
  }

  return (
    <aside className="w-[300px] bg-card border-l border-border flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex justify-between items-center shrink-0">
        <h3 className="text-sm font-bold">PROPRIEDADES</h3>
        <X 
          className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" 
          onClick={() => setShowProperties(false)}
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {selectedComponent ? (
            <>
              {/* Component Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-primary font-bold text-sm">
                    {selectedComponent.$Name}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {selectedComponent.$Type}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {/* Copy component */}}
                    title="Duplicar"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  {selectedComponent.$Name !== currentProject?.Properties.$Name && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={handleDelete}
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Property Categories */}
              {Object.entries(categorizedProperties).map(([category, properties]) => {
                if (properties.length === 0) return null
                const categoryConfig = propertyCategories[category as keyof typeof propertyCategories]
                
                return (
                  <div key={category} className="mb-3">
                    <button
                      onClick={() => toggleSection(category)}
                      className="w-full flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors"
                    >
                      {expandedSections[category] ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      {categoryConfig.name}
                      <span className="text-[9px] text-muted-foreground/50 ml-auto">
                        {properties.length}
                      </span>
                    </button>
                    
                    {expandedSections[category] && (
                      <div className="space-y-2 pl-5">
                        {properties.map(([key, value]) => (
                          <div key={key}>
                            <Label className="text-[10px] text-muted-foreground uppercase block mb-1">
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
      </ScrollArea>

      {/* Events Section */}
      <div className="p-4 border-t border-border bg-black/5 shrink-0">
        <button
          onClick={() => toggleSection("events")}
          className="w-full flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground"
        >
          {expandedSections.events ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          EVENTOS DO COMPONENTE
          <Zap className="w-3 h-3 text-amber-500" />
        </button>

        {expandedSections.events && (
          <>
            {componentBlocks.length > 0 ? (
              <div className="space-y-2">
                {componentBlocks.map((block, i) => (
                  <div 
                    key={i}
                    className="bg-secondary border-l-4 border-amber-500 p-2 rounded text-xs"
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />
                      {block.eventName}
                    </div>
                    <div className="text-muted-foreground text-[10px] mt-0.5">
                      {block.summary}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Nenhum evento configurado.
              </p>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3 text-[10px]"
              onClick={onShowBlocks}
            >
              VER TODOS OS BLOCOS
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
