"use client"

import { useState } from "react"
import { Sparkles, Loader } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useIDEStore } from "@/lib/ide-store"
import { useToast } from "@/components/ui/use-toast"
import { useAIChat } from "@/lib/hooks/use-ai-chat"

interface AIComponentGeneratorProps {
  isOpen: boolean
  onClose: () => void
}

export function AIComponentGenerator({ isOpen, onClose }: AIComponentGeneratorProps) {
  const [description, setDescription] = useState("")
  const [generatedComponent, setGeneratedComponent] = useState<any>(null)
  
  const { currentProject, addComponent } = useIDEStore()
  const { toast } = useToast()
  const { isLoading, generateComponent: generateComponentAI, error } = useAIChat({
    onError: (err) => {
      toast({
        title: "Erro na Geração",
        description: err.message,
        variant: "destructive"
      })
    }
  })

  const handleGenerateComponent = async () => {
    if (!description.trim()) {
      toast({
        title: "Descrição vazia",
        description: "Por favor, descreva o componente que deseja criar",
        variant: "destructive"
      })
      return
    }

    try {
      const projectContext = currentProject 
        ? `Projeto: ${currentProject.Properties?.$Name || 'Untitled'}. Componentes existentes: ${currentProject.Properties?.$Components?.map(c => c.$Type).join(', ') || 'Nenhum'}`
        : undefined

      const component = await generateComponentAI(description, projectContext)
      setGeneratedComponent(component)
      
      toast({
        title: "Componente Gerado",
        description: `${component.type} foi criado com sucesso!`
      })

    } catch (error) {
      // Erro já foi tratado pelo hook
    }
  }

  const addGeneratedComponent = async () => {
    if (!generatedComponent || !currentProject) return

    try {
      // Adicionar componente ao projeto
      addComponent(currentProject.Properties.$Name, generatedComponent.type)
      
      toast({
        title: "Componente Adicionado",
        description: `${generatedComponent.name} foi adicionado ao projeto`
      })

      setDescription("")
      setGeneratedComponent(null)
      onClose()

    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao adicionar componente",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gerador de Componentes IA
          </DialogTitle>
          <DialogDescription>
            Descreva o componente que você deseja criar e deixe a IA gerar para você
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">O que você quer criar?</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Um campo de entrada de email com validação, Um botão com ícone de busca, Uma lista de produtos com preço..."
              className="min-h-24"
            />
          </div>

          {!generatedComponent && (
          <Button 
            onClick={handleGenerateComponent} 
            disabled={isLoading || !description.trim() || !currentProject}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Componente
              </>
            )}
          </Button>
          )}

          {generatedComponent && (
            <div className="bg-secondary/50 p-4 rounded-lg space-y-3 border border-border">
              <div>
                <h3 className="font-semibold text-sm">Componente Gerado</h3>
                <p className="text-xs text-muted-foreground mt-1">{generatedComponent.description}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Tipo:</span>
                  <span className="text-muted-foreground ml-2">{generatedComponent.type}</span>
                </div>
                <div>
                  <span className="font-medium">Nome:</span>
                  <span className="text-muted-foreground ml-2">{generatedComponent.name}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setGeneratedComponent(null)
                    setDescription("")
                  }}
                  className="flex-1"
                >
                  Gerar Outro
                </Button>
                <Button 
                  size="sm"
                  onClick={addGeneratedComponent}
                  className="flex-1"
                >
                  Adicionar ao Projeto
                </Button>
              </div>
            </div>
          )}

          {!currentProject && (
            <p className="text-xs text-muted-foreground p-3 bg-warning/10 rounded border border-warning/20">
              Carregue um projeto para adicionar componentes
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
