"use client"

import { useState } from "react"
import { Sparkles, Loader, Layout, Check, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useIDEStore } from "@/lib/ide-store"
import { toast } from "sonner"
import { useAIChat } from "@/lib/hooks/use-ai-chat"

interface AIScreenGeneratorProps {
  isOpen: boolean
  onClose: () => void
}

export function AIScreenGenerator({ isOpen, onClose }: AIScreenGeneratorProps) {
  const [description, setDescription] = useState("")
  const [generatedScreen, setGeneratedScreen] = useState<any>(null)
  const [isApplying, setIsApplying] = useState(false)
  
  const { currentProject, setCurrentProject, saveSnapshot } = useIDEStore()
  const { isLoading, generateScreen: generateScreenAI } = useAIChat()

  const handleGenerateScreen = async () => {
    if (!description.trim()) {
      toast.error("Por favor, descreva a tela que deseja criar.")
      return
    }

    try {
      const result = await generateScreenAI(description)
      setGeneratedScreen(result)
      toast.success("Estrutura da tela gerada com sucesso!")
    } catch (error) {
      toast.error("Falha ao gerar tela. Verifique sua chave de API nas configurações.")
    }
  }

  const applyGeneratedScreen = async () => {
    if (!generatedScreen) return
    
    setIsApplying(true)
    try {
      // Small delay for effect
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setCurrentProject(generatedScreen.data)
      saveSnapshot()
      
      toast.success("Nova tela aplicada ao projeto!")
      onClose()
      setDescription("")
      setGeneratedScreen(null)
    } catch (error) {
      toast.error("Erro ao aplicar tela.")
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Layout className="w-6 h-6 text-primary" />
            Gerador de Telas IA
          </DialogTitle>
          <DialogDescription>
            Descreva a interface que você imagina e a IA criará toda a estrutura de componentes (SCM) para você.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!generatedScreen ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">O que esta tela deve conter?</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Uma tela de login moderna com fundo escuro, campo de email, senha, botão de login e link para esqueci minha senha..."
                  className="min-h-[120px] resize-none"
                />
              </div>
              
              <div className="bg-secondary/30 p-3 rounded-lg border border-border">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Dica</h4>
                <p className="text-[11px] text-muted-foreground">
                  Seja específico sobre as cores e os elementos. A IA tentará usar as melhores práticas de layout do Kodular.
                </p>
              </div>

              <Button 
                onClick={handleGenerateScreen} 
                className="w-full h-11 shine"
                disabled={isLoading || !description.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Estrutura...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Tela
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-success/10 border border-success/20 p-4 rounded-xl flex items-start gap-3 animate-in zoom-in-95">
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Tela pronta para aplicação!</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    A IA gerou uma estrutura com <strong>{generatedScreen.componentCount}</strong> componentes incluindo {generatedScreen.summary}.
                  </p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden bg-secondary/20">
                <div className="px-3 py-2 border-b bg-card flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Pré-visualização da Estrutura</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{generatedScreen.theme || "Padrão"}</span>
                </div>
                <div className="p-3 max-h-[150px] overflow-y-auto text-[11px] font-mono opacity-70">
                  {generatedScreen.preview}
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setGeneratedScreen(null)}
                >
                  Refazer
                </Button>
                <Button 
                  className="flex-1 shine"
                  onClick={applyGeneratedScreen}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    "Aplicar no Projeto"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {!generatedScreen && (
          <DialogFooter className="text-[10px] text-muted-foreground text-center sm:justify-center border-t pt-4">
            A IA gera apenas a interface visual. Você precisará configurar os blocos de lógica manualmente.
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
