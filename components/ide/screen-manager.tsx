"use client"

import { useState } from "react"
import { 
  Plus, Trash2, Copy, Edit2, Check, X, 
  Smartphone, MoreVertical, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ide/toast"

interface ScreenManagerProps {
  onScreenSelect?: (name: string) => void
}

export function ScreenManager({ onScreenSelect }: ScreenManagerProps) {
  const { 
    screens,
    currentScreenName,
    addScreen,
    removeScreen,
    duplicateScreen,
    renameScreen,
    switchScreen,
    screenFiles
  } = useIDEStore()
  
  const [isAddingScreen, setIsAddingScreen] = useState(false)
  const [newScreenName, setNewScreenName] = useState("")
  const [editingScreen, setEditingScreen] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [deleteConfirmScreen, setDeleteConfirmScreen] = useState<string | null>(null)
  
  // Get screen names from either screens state or screenFiles
  const screenNames = Object.keys(screens).length > 0 
    ? Object.keys(screens)
    : screenFiles.map(sf => sf.name)
  
  const handleAddScreen = () => {
    if (!newScreenName.trim()) {
      toast.error("Digite um nome para a tela")
      return
    }
    
    // Validate name
    const sanitized = newScreenName.replace(/[^a-zA-Z0-9_]/g, "")
    if (sanitized !== newScreenName) {
      toast.warning("Nome ajustado para remover caracteres especiais")
    }
    
    if (screenNames.includes(sanitized)) {
      toast.error("Ja existe uma tela com esse nome")
      return
    }
    
    addScreen(sanitized)
    toast.success(`Tela "${sanitized}" criada`)
    setNewScreenName("")
    setIsAddingScreen(false)
  }
  
  const handleRenameScreen = (oldName: string) => {
    if (!editName.trim()) {
      setEditingScreen(null)
      return
    }
    
    const sanitized = editName.replace(/[^a-zA-Z0-9_]/g, "")
    if (sanitized === oldName) {
      setEditingScreen(null)
      return
    }
    
    if (screenNames.includes(sanitized)) {
      toast.error("Ja existe uma tela com esse nome")
      return
    }
    
    renameScreen(oldName, sanitized)
    toast.success(`Tela renomeada para "${sanitized}"`)
    setEditingScreen(null)
  }
  
  const handleDeleteScreen = (name: string) => {
    if (screenNames.length <= 1) {
      toast.error("Nao e possivel remover a ultima tela")
      return
    }
    
    removeScreen(name)
    toast.success(`Tela "${name}" removida`)
    setDeleteConfirmScreen(null)
  }
  
  const handleDuplicateScreen = (name: string) => {
    duplicateScreen(name)
    toast.success(`Tela "${name}" duplicada`)
  }
  
  const handleScreenClick = (name: string) => {
    switchScreen(name)
    onScreenSelect?.(name)
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header with add button */}
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {screenNames.length} tela{screenNames.length !== 1 ? "s" : ""}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setIsAddingScreen(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Nova Tela
        </Button>
      </div>
      
      {/* Add screen input */}
      {isAddingScreen && (
        <div className="p-2 border-b border-border bg-secondary/50">
          <div className="flex items-center gap-2">
            <Input
              value={newScreenName}
              onChange={(e) => setNewScreenName(e.target.value)}
              placeholder="Nome da tela..."
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddScreen()
                if (e.key === "Escape") setIsAddingScreen(false)
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-success"
              onClick={handleAddScreen}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground"
              onClick={() => setIsAddingScreen(false)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Screen list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {screenNames.map((name) => (
            <div
              key={name}
              className={cn(
                "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all",
                currentScreenName === name
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "hover:bg-secondary text-foreground"
              )}
              onClick={() => editingScreen !== name && handleScreenClick(name)}
            >
              {/* Screen icon with indicator */}
              <div className="relative">
                <Smartphone className={cn(
                  "w-4 h-4",
                  currentScreenName === name ? "text-primary" : "text-muted-foreground"
                )} />
                {currentScreenName === name && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success" />
                )}
              </div>
              
              {/* Screen name (editable) */}
              {editingScreen === name ? (
                <div className="flex-1 flex items-center gap-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-6 text-xs flex-1"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === "Enter") handleRenameScreen(name)
                      if (e.key === "Escape") setEditingScreen(null)
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-success"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRenameScreen(name)
                    }}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <span className="flex-1 text-xs font-medium truncate">{name}</span>
              )}
              
              {/* Actions dropdown */}
              {editingScreen !== name && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditName(name)
                        setEditingScreen(name)
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-2" />
                      Renomear
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicateScreen(name)
                      }}
                    >
                      <Copy className="w-3.5 h-3.5 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      disabled={screenNames.length <= 1}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirmScreen(name)
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Current indicator */}
              {currentScreenName === name && (
                <ChevronRight className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
          ))}
          
          {screenNames.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhuma tela encontrada</p>
              <Button
                variant="link"
                size="sm"
                className="text-xs mt-1"
                onClick={() => setIsAddingScreen(true)}
              >
                Criar primeira tela
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmScreen} onOpenChange={() => setDeleteConfirmScreen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tela?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tela &quot;{deleteConfirmScreen}&quot;? 
              Esta acao nao pode ser desfeita e todos os componentes da tela serao perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmScreen && handleDeleteScreen(deleteConfirmScreen)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
