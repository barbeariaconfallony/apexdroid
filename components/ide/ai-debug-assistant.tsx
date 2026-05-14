"use client"

import { useState } from "react"
import { AlertCircle, Loader, Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAIChat } from "@/lib/hooks/use-ai-chat"

interface AIDebugAssistantProps {
  isOpen: boolean
  onClose: () => void
  errorMessage?: string
  componentName?: string
}

export function AIDebugAssistant({ 
  isOpen, 
  onClose, 
  errorMessage = "",
  componentName = ""
}: AIDebugAssistantProps) {
  const [error, setError] = useState(errorMessage)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const { toast } = useToast()
  const { isLoading, debugError: analyzeErrorAI } = useAIChat({
    onError: (err) => {
      toast({
        title: "Erro na Análise",
        description: err.message,
        variant: "destructive"
      })
    }
  })

  const analyzeError = async () => {
    if (!error.trim()) {
      toast({
        title: "Erro vazio",
        description: "Por favor, descreva o erro que está enfrentando",
        variant: "destructive"
      })
      return
    }

    try {
      const result = await analyzeErrorAI(error.trim(), componentName || undefined)
      setAnalysis(result)
      
      toast({
        title: "Análise Completa",
        description: "A IA analisou seu erro com sucesso"
      })

    } catch (error) {
      // Erro já foi tratado pelo hook
    }
  }

  const copyToClipboard = async () => {
    if (!analysis) return
    
    try {
      await navigator.clipboard.writeText(analysis)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copiado",
        description: "Análise copiada para a área de transferência"
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Assistente de Debug com IA
          </DialogTitle>
          <DialogDescription>
            Descreva o erro que está enfrentando e receba uma análise detalhada com soluções
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {!analysis && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Mensagem de Erro</label>
                <Textarea
                  value={error}
                  onChange={(e) => setError(e.target.value)}
                  placeholder="Cole aqui a mensagem de erro ou log que você recebeu..."
                  className="min-h-32 font-mono text-xs"
                />
              </div>

              {componentName && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Componente Envolvido</label>
                  <p className="text-sm text-muted-foreground">{componentName}</p>
                </div>
              )}

              <Button 
                onClick={analyzeError} 
                disabled={isLoading || !error.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Analisar Erro
                  </>
                )}
              </Button>
            </>
          )}

          {analysis && (
            <div className="space-y-4">
              <div className="bg-secondary/50 p-4 rounded-lg border border-border space-y-3">
                <h3 className="font-semibold text-sm">Análise da IA</h3>
                <div className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                  {analysis}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setAnalysis(null)
                    setError("")
                  }}
                  className="flex-1"
                >
                  Analisar Outro Erro
                </Button>
                <Button 
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Análise
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
