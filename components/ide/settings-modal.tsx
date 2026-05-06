"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useIDEStore } from "@/lib/ide-store"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { aiSettings, setAISettings } = useIDEStore()
  const [settings, setSettings] = useState(aiSettings)

  useEffect(() => {
    setSettings(aiSettings)
  }, [aiSettings, isOpen])

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
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Configurações da IA</h2>
          <X 
            className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground" 
            onClick={onClose}
          />
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase">
              Provider
            </Label>
            <select
              value={settings.provider}
              onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
              className="w-full mt-1 bg-input border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground uppercase">
              API Key
            </Label>
            <Input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              className="bg-input border-border mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground uppercase">
              Model
            </Label>
            <Input
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              placeholder="gpt-4-turbo"
              className="bg-input border-border mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground uppercase">
              Base URL
            </Label>
            <Input
              value={settings.baseUrl}
              onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="bg-input border-border mt-1"
            />
          </div>

          <Button className="w-full mt-2" onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}
