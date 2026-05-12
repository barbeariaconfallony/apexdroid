"use client"

import { useState } from "react"
import { 
  X, Search, Upload, FileImage, FileAudio, FileVideo, 
  File, Grid, List, Trash2, Download, ExternalLink,
  Loader2, AlertCircle, Plus, CheckCircle2
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import type { ProjectAsset } from "@/lib/ide-types"
import { toast } from "sonner"

interface AssetsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AssetsModal({ isOpen, onClose }: AssetsModalProps) {
  const { projectAssets, setProjectAssets } = useIDEStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeType, setActiveType] = useState<string>("all")
  const [uploading, setUploading] = useState(false)

  const filteredAssets = projectAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = activeType === "all" || asset.type === activeType
    return matchesSearch && matchesType
  })

  const handleUpload = () => {
    // In a real scenario, this would open a file picker and upload to GitHub
    toast.info("Funcionalidade de upload em desenvolvimento. No momento, os assets são carregados do repositório GitHub.")
  }

  const handleDeleteAsset = (assetPath: string) => {
    // Just a simulation for now
    toast.error("A exclusão de assets deve ser feita diretamente no repositório GitHub.")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <HardDrive className="w-6 h-6 text-primary" />
                Gerenciador de Ativos
              </DialogTitle>
              <DialogDescription>
                Gerencie imagens, sons e outros arquivos do seu projeto.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                title={viewMode === "grid" ? "Vista em Lista" : "Vista em Grade"}
              >
                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
              <Button variant="default" className="gap-2" onClick={handleUpload}>
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={activeType} onValueChange={setActiveType} className="shrink-0">
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="image">Imagens</TabsTrigger>
                <TabsTrigger value="audio">Áudio</TabsTrigger>
                <TabsTrigger value="video">Vídeo</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-muted-foreground opacity-20" />
              </div>
              <h3 className="text-lg font-semibold">Nenhum ativo encontrado</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                {searchQuery || activeType !== "all" 
                  ? "Tente ajustar seus filtros de busca para encontrar o que procura."
                  : "Seu projeto ainda não possui ativos. Faça upload de arquivos para começar."}
              </p>
              {(searchQuery || activeType !== "all") && (
                <Button 
                  variant="link" 
                  onClick={() => {setSearchQuery(""); setActiveType("all")}}
                  className="mt-2"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <AssetGridItem 
                  key={asset.path} 
                  asset={asset} 
                  onDelete={() => handleDeleteAsset(asset.path)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map((asset) => (
                <AssetListItem 
                  key={asset.path} 
                  asset={asset} 
                  onDelete={() => handleDeleteAsset(asset.path)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-6 pt-0 border-t bg-secondary/20 flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Total: <strong>{filteredAssets.length}</strong> arquivos selecionados
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AssetGridItem({ asset, onDelete }: { asset: ProjectAsset, onDelete: () => void }) {
  return (
    <div className="group relative bg-card border rounded-xl overflow-hidden hover:border-primary transition-all hover:shadow-md">
      <div className="aspect-square bg-secondary/50 flex items-center justify-center overflow-hidden">
        {asset.type === "image" ? (
          <img 
            src={asset.url} 
            alt={asset.name} 
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
            crossOrigin="anonymous"
          />
        ) : asset.type === "audio" ? (
          <FileAudio className="w-12 h-12 text-muted-foreground opacity-40" />
        ) : asset.type === "video" ? (
          <FileVideo className="w-12 h-12 text-muted-foreground opacity-40" />
        ) : (
          <File className="w-12 h-12 text-muted-foreground opacity-40" />
        )}
      </div>
      
      <div className="p-3 bg-card/80 backdrop-blur-sm border-t">
        <p className="text-xs font-medium truncate" title={asset.name}>{asset.name}</p>
        <p className="text-[10px] text-muted-foreground capitalize">{asset.type}</p>
      </div>

      {/* Overlay Actions */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button size="icon" variant="secondary" className="h-8 w-8" asChild>
          <a href={asset.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function AssetListItem({ asset, onDelete }: { asset: ProjectAsset, onDelete: () => void }) {
  const Icon = asset.type === "image" ? FileImage : asset.type === "audio" ? FileAudio : asset.type === "video" ? FileVideo : File

  return (
    <div className="flex items-center gap-4 p-3 bg-card border rounded-lg hover:border-primary transition-all">
      <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center overflow-hidden shrink-0">
        {asset.type === "image" ? (
          <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <Icon className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{asset.name}</p>
        <p className="text-xs text-muted-foreground">{asset.path}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
          <a href={asset.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function HardDrive(props: any) {
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
      <rect width="20" height="8" x="2" y="14" rx="2" />
      <path d="M6 18h.01" />
      <path d="M10 18h.01" />
      <path d="M2 9v1a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3L15.3 3.6a2 2 0 0 0-1.4-.6H10.1a2 2 0 0 0-1.4.6L7 7H4a2 2 0 0 0-2 2Z" />
    </svg>
  )
}
