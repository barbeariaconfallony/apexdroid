"use client"

import { useState, useEffect } from "react"
import { X, Zap, Globe, Server, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

// Configuracoes de providers
const AI_PROVIDERS = {
  groq: {
    name: "Groq",
    description: "IA ultrarapida (Recomendado)",
    icon: Zap,
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Rapido)", recommended: true },
      { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 (Raciocinio)" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Muito rapido)" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B (Balanceado)" },
    ],
    baseUrl: "https://api.groq.com/openai/v1",
    keyPlaceholder: "gsk_...",
    keyUrl: "https://console.groq.com/keys",
    color: "text-orange-500"
  },
  openai: {
    name: "OpenAI",
    description: "GPT-4 e modelos avancados",
    icon: Globe,
    models: [
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", recommended: true },
      { id: "gpt-4o", name: "GPT-4o (Multimodal)" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Economico)" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo (Rapido)" },
    ],
    baseUrl: "https://api.openai.com/v1",
    keyPlaceholder: "sk-...",
    keyUrl: "https://platform.openai.com/api-keys",
    color: "text-green-500"
  },
  ollama: {
    name: "Ollama",
    description: "Modelos locais (Gratuito)",
    icon: Server,
    models: [
      { id: "llama3.2", name: "Llama 3.2 (Local)", recommended: true },
      { id: "codellama", name: "Code Llama (Codigo)" },
      { id: "mistral", name: "Mistral (Balanceado)" },
      { id: "deepseek-coder", name: "DeepSeek Coder" },
    ],
    baseUrl: "http://localhost:11434/v1",
    keyPlaceholder: "Nao requer chave",
    keyUrl: "https://ollama.ai/download",
    color: "text-blue-500"
  }
}

type ProviderKey = keyof typeof AI_PROVIDERS

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { aiSettings, setAISettings } = useIDEStore()
  const [settings, setSettings] = useState(aiSettings)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    setSettings(aiSettings)
  }, [aiSettings, isOpen])

  const currentProvider = AI_PROVIDERS[settings.provider as ProviderKey] || AI_PROVIDERS.groq

  const handleProviderChange = (provider: ProviderKey) => {
    const providerConfig = AI_PROVIDERS[provider]
    const recommendedModel = providerConfig.models.find(m => m.recommended)?.id || providerConfig.models[0].id
    setSettings({
      ...settings,
      provider,
      model: recommendedModel,
      baseUrl: providerConfig.baseUrl,
      apiKey: provider === settings.provider ? settings.apiKey : ""
    })
  }

  const handleSave = () => {
    setAISettings(settings)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Configuracoes da IA</h2>
          <X 
            className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground" 
            onClick={onClose}
          />
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Provider Selection */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase mb-2 block">
              Provider
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(AI_PROVIDERS) as ProviderKey[]).map((key) => {
                const provider = AI_PROVIDERS[key]
                const Icon = provider.icon
                const isSelected = settings.provider === key
                return (
                  <button
                    key={key}
                    onClick={() => handleProviderChange(key)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                      isSelected 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", provider.color)} />
                    <span className="text-xs font-medium">{provider.name}</span>
                    {key === "groq" && (
                      <span className="text-[10px] text-primary bg-primary/20 px-1.5 py-0.5 rounded">
                        Rapido
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {currentProvider.description}
            </p>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-muted-foreground uppercase">
                API Key {settings.provider === "ollama" && "(Opcional)"}
              </Label>
              <a 
                href={currentProvider.keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Obter chave <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <Input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder={currentProvider.keyPlaceholder}
              className="bg-input border-border"
              disabled={settings.provider === "ollama"}
            />
          </div>

          {/* Model Selection */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase mb-1 block">
              Modelo
            </Label>
            <select
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {currentProvider.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} {model.recommended && "(Recomendado)"}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {showAdvanced ? "- Ocultar" : "+ Mostrar"} configuracoes avancadas
          </button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <Label className="text-xs text-muted-foreground uppercase">
                  Base URL
                </Label>
                <Input
                  value={settings.baseUrl}
                  onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                  placeholder={currentProvider.baseUrl}
                  className="bg-input border-border mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase">
                  Modelo Customizado
                </Label>
                <Input
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  placeholder="nome-do-modelo"
                  className="bg-input border-border mt-1"
                />
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            {settings.provider === "groq" && (
              <p>Groq oferece 14.400 requisicoes/dia gratuitas com latencia ultrabaixa (50-200ms).</p>
            )}
            {settings.provider === "openai" && (
              <p>OpenAI requer uma chave de API paga. Consulte os precos em platform.openai.com.</p>
            )}
            {settings.provider === "ollama" && (
              <p>Ollama roda localmente. Instale em ollama.ai e execute: ollama run llama3.2</p>
            )}
          </div>

          <Button className="w-full" onClick={handleSave}>
            Salvar Configuracoes
          </Button>
        </div>
      </div>
    </div>
  )
}
