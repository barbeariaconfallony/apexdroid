"use client"

import { useState } from "react"
import { 
  X, Search, Upload, FileImage, FileAudio, FileVideo, 
  File, Trash2, ExternalLink, HardDrive
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
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import type { ProjectAsset } from "@/lib/ide-types"
import { toast } from "sonner"

interface AssetsModalProps {
  isOpen: boolean
  onClose: () => void
}

const FILE_TABS = [
  { id: "all",    label: "Todos" },
  { id: "image",  label: "Imagens" },
  { id: "audio",  label: "Áudio" },
  { id: "video",  label: "Vídeo" },
  { id: "other",  label: "Outros" },
]

export function AssetsModal({ isOpen, onClose }: AssetsModalProps) {
  const { projectAssets, setProjectAssets } = useIDEStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeType, setActiveType] = useState<string>("all")

  const filteredAssets = projectAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType =
      activeType === "all" ||
      (activeType === "other"
        ? !["image", "audio", "video"].includes(asset.type)
        : asset.type === activeType)
    return matchesSearch && matchesType
  })

  const imageAssets  = filteredAssets.filter(a => a.type === "image")
  const nonImageAssets = filteredAssets.filter(a => a.type !== "image")

  const handleUpload = () => {
    toast.info("Funcionalidade de upload em desenvolvimento. No momento, os assets são carregados do repositório GitHub.")
  }

  const handleDeleteAsset = () => {
    toast.error("A exclusão de assets deve ser feita diretamente no repositório GitHub.")
  }

  const countsByType = {
    all:   projectAssets.length,
    image: projectAssets.filter(a => a.type === "image").length,
    audio: projectAssets.filter(a => a.type === "audio").length,
    video: projectAssets.filter(a => a.type === "video").length,
    other: projectAssets.filter(a => !["image","audio","video"].includes(a.type)).length,
  } as Record<string, number>

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[860px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary" />
              <div>
                <DialogTitle className="text-base font-semibold leading-none">
                  Gerenciador de Ativos
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Imagens, sons e outros arquivos do projeto
                </DialogDescription>
              </div>
            </div>
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleUpload}>
              <Upload className="w-3.5 h-3.5" />
              Upload
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar arquivo..."
              className="pl-9 h-8 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type tabs */}
          <div className="flex gap-0.5 border-b border-border">
            {FILE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveType(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors",
                  activeType === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {countsByType[tab.id] > 0 && (
                  <span className={cn(
                    "ml-1.5 px-1 py-0.5 rounded text-[10px] leading-none",
                    activeType === tab.id
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {countsByType[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0 px-5 py-4">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-3">
                <Search className="w-7 h-7 text-muted-foreground opacity-30" />
              </div>
              <p className="text-sm font-medium text-foreground">Nenhum arquivo encontrado</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {searchQuery || activeType !== "all"
                  ? "Tente ajustar os filtros."
                  : "Faça upload de arquivos para começar."}
              </p>
              {(searchQuery || activeType !== "all") && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs mt-2"
                  onClick={() => { setSearchQuery(""); setActiveType("all") }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Imagens em grade grande */}
              {imageAssets.length > 0 && (
                <section>
                  {(activeType === "all") && (
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Imagens
                    </h4>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {imageAssets.map(asset => (
                      <ImageAssetCard
                        key={asset.path}
                        asset={asset}
                        onDelete={handleDeleteAsset}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Demais arquivos em lista */}
              {nonImageAssets.length > 0 && (
                <section>
                  {(activeType === "all") && (
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Outros arquivos
                    </h4>
                  )}
                  <div className="space-y-1.5">
                    {nonImageAssets.map(asset => (
                      <AssetListItem
                        key={asset.path}
                        asset={asset}
                        onDelete={handleDeleteAsset}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-secondary/20 flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground">
            {filteredAssets.length} arquivo{filteredAssets.length !== 1 ? "s" : ""}
          </p>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Image card: preview grande + nome abaixo ── */
function ImageAssetCard({ asset, onDelete }: { asset: ProjectAsset; onDelete: () => void }) {
  return (
    <div className="group flex flex-col">
      <div className="relative aspect-square bg-secondary rounded-lg overflow-hidden border border-border hover:border-primary transition-all">
        <img
          src={asset.url}
          alt={asset.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          crossOrigin="anonymous"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
          <Button size="icon" variant="secondary" className="h-7 w-7" asChild>
            <a href={asset.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-7 w-7"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {/* Nome abaixo */}
      <p
        className="text-[11px] text-muted-foreground mt-1.5 truncate text-center leading-tight px-0.5"
        title={asset.name}
      >
        {asset.name}
      </p>
    </div>
  )
}

/* ── List item para áudio, vídeo e outros ── */
function AssetListItem({ asset, onDelete }: { asset: ProjectAsset; onDelete: () => void }) {
  const Icon =
    asset.type === "audio"
      ? FileAudio
      : asset.type === "video"
      ? FileVideo
      : File

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-card border border-border rounded-lg hover:border-primary transition-all">
      <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate text-foreground">{asset.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{asset.path}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
          <a href={asset.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
