"use client"

import { useState, useEffect } from "react"
import { Lightbulb, Loader, X, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIDEStore } from "@/lib/ide-store"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export function AISuggestionsPanel() {
  const [suggestions, setSuggestions] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const { selectedComponent, currentBkyContent, currentProject } = useIDEStore()
  const { toast } = useToast()

  // Carregar sugestões quando há componente selecionado ou conteúdo de bloco
  useEffect(() => {
    if (!selectedComponent && !currentBkyContent) {
      setSuggestions("")
      return
    }

    const loadSuggestions = async () => {
      setIsLoading(true)
      try {
        const projectContext = currentProject
          ? `Projeto: ${currentProject.Properties?.$Name || 'Untitled'}. Componentes: ${currentProject.Properties?.$Components?.map(c => c.$Type).join(', ') || 'Nenhum'}`
          : undefined

        const response = await fetch('/api/ai/code-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedComponent: selectedComponent?.$Type,
            currentBlock: currentBkyContent ? 'Bloco Visual' : null,
            projectContext
          })
        })

        if (!response.ok) {
          throw new Error(`Erro: ${response.status}`)
        }

        if (!response.body) return

        // Processar streaming
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullText = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('0:')) {
              const jsonStr = line.slice(2)
              try {
                const data = JSON.parse(jsonStr)
                if (data.type === 'text') {
                  fullText += data.value
                  setSuggestions(fullText)
                }
              } catch (e) {
                // Ignorar erros de parse
              }
            }
          }
        }
      } catch (error) {
        console.error('Suggestions error:', error)
        setSuggestions("Erro ao carregar sugestões")
      } finally {
        setIsLoading(false)
      }
    }

    loadSuggestions()
  }, [selectedComponent, currentBkyContent, currentProject])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(suggestions)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copiado",
        description: "Sugestões copiadas para a área de transferência"
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar",
        variant: "destructive"
      })
    }
  }

  if (!suggestions && !isLoading) {
    return null
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 max-w-sm bg-card border border-border rounded-lg shadow-lg transition-all duration-300 z-40",
      isOpen ? "max-h-96" : "h-12"
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-12 px-4 flex items-center justify-between bg-secondary/50 hover:bg-secondary/70 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium">Sugestões de Código</span>
        </div>
        {isLoading && <Loader className="w-4 h-4 animate-spin" />}
      </button>

      {isOpen && (
        <div className="border-t border-border p-3 max-h-80 overflow-y-auto space-y-3">
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {suggestions || (isLoading ? "Gerando sugestões..." : "")}
          </div>

          {!isLoading && suggestions && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
