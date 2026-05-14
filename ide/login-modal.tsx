"use client"

import { useState } from "react"
import { X, Mail, Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useIDEStore } from "@/lib/ide-store"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [ghPat, setGhPat] = useState("")
  const { setGhToken, setCloudUser, setActiveTab, setShowWelcome } = useIDEStore()

  const handleGitHubToken = () => {
    if (ghPat.trim()) {
      // Limpar repos anteriores ao salvar novo token
      const { setGhRepos, setSelectedRepo, setRepoTree } = useIDEStore.getState()
      setGhRepos([])
      setSelectedRepo(null)
      setRepoTree([])
      
      setGhToken(ghPat)
      setActiveTab("github")
      onClose()
    }
  }

  const handleCloudLogin = () => {
    // Simulate cloud login
    setCloudUser({
      id: "usr_123",
      name: "Dev Pro",
      email: "contato@apex.io"
    })
    setActiveTab("cloud")
    onClose()
  }

  // Demo project loader
  const loadDemoProject = () => {
    const { setCurrentProject, setShowWelcome, saveSnapshot } = useIDEStore.getState()
    
    const demoProject = {
      Properties: {
        $Type: "Form",
        $Name: "Screen1",
        Title: "Meu App Demo",
        BackgroundColor: "&HFFFFFFFF",
        $Components: [
          {
            $Type: "VerticalArrangement",
            $Name: "VerticalArrangement1",
            Width: "-2",
            Height: "-1",
            $Components: [
              {
                $Type: "Label",
                $Name: "Label1",
                Text: "Bem-vindo ao APEX DROID AI!",
                TextColor: "&HFF000000",
                Width: "-2"
              },
              {
                $Type: "Button",
                $Name: "Button1",
                Text: "Clique aqui",
                BackgroundColor: "&HFF3B82F6",
                TextColor: "&HFFFFFFFF",
                Width: "-2"
              }
            ]
          }
        ]
      }
    }
    
    setCurrentProject(demoProject)
    saveSnapshot()
    setShowWelcome(false)
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
          <h2 className="font-semibold">Entrar no APEX DROID</h2>
          <X 
            className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground" 
            onClick={onClose}
          />
        </div>

        {/* Body */}
        <div className="p-5">
          <Button className="w-full mb-3 gap-2" onClick={handleCloudLogin}>
            <Mail className="w-4 h-4" />
            LOGIN COM EMAIL
          </Button>
          
          <Button variant="outline" className="w-full mb-3 gap-2" onClick={handleCloudLogin}>
            <Chrome className="w-4 h-4" />
            LOGIN COM GOOGLE
          </Button>

          <div className="text-center text-[10px] text-muted-foreground my-4">
            OU CONTINUE LOCALMENTE
          </div>

          <Button 
            variant="secondary" 
            className="w-full mb-4"
            onClick={loadDemoProject}
          >
            CARREGAR PROJETO DEMO
          </Button>

          <hr className="border-border my-5" />

          <Label className="text-xs text-muted-foreground uppercase">
            GitHub Personal Access Token (PAT)
          </Label>
          <Input
            type="password"
            value={ghPat}
            onChange={(e) => setGhPat(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="bg-input border-border mt-1"
          />
          <p className="text-[10px] text-muted-foreground mt-2">
            Opcional: Necessário apenas para sincronizar com repositórios.
          </p>

          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={handleGitHubToken}
          >
            Salvar Token GitHub
          </Button>
        </div>
      </div>
    </div>
  )
}
