"use client"

import { useState } from "react"
import { 
  Plus, MoreVertical, Smartphone, Copy, Trash2, Edit2, 
  Check, X, ChevronLeft, ChevronRight 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
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
import { toast } from "./toast"
import type { ScreenFile, ProjectData, KodularComponent } from "@/lib/ide-types"

interface ScreenThumbnailsProps {
  onScreenSelect?: (screen: ScreenFile) => void
}

// Mini component renderer for thumbnails
function MiniComponentRenderer({ component, scale = 0.15 }: { component: KodularComponent; scale?: number }) {
  const { $Type, $Components } = component
  
  // Non-visible components
  const nonVisibleTypes = ["Clock", "Sound", "Notifier", "TinyDB", "Web", "Firebase"]
  if (nonVisibleTypes.some(t => $Type.includes(t))) {
    return null
  }
  
  const baseClass = "rounded-sm"
  
  if ($Type === "Button") {
    return <div className={cn(baseClass, "bg-primary/80 h-2 w-8")} />
  }
  
  if ($Type === "Label") {
    return <div className={cn(baseClass, "bg-muted-foreground/30 h-1.5 w-10")} />
  }
  
  if ($Type === "TextBox" || $Type === "PasswordTextBox") {
    return <div className={cn(baseClass, "bg-muted border border-muted-foreground/20 h-2 w-12")} />
  }
  
  if ($Type === "Image") {
    return <div className={cn(baseClass, "bg-muted-foreground/20 h-4 w-4")} />
  }
  
  if ($Type.includes("Arrangement")) {
    const isVertical = $Type.includes("Vertical")
    return (
      <div className={cn(
        "flex gap-0.5 p-0.5 bg-muted/50 rounded-sm min-h-[4px]",
        isVertical ? "flex-col" : "flex-row"
      )}>
        {$Components?.slice(0, 3).map((child, i) => (
          <MiniComponentRenderer key={i} component={child} scale={scale} />
        ))}
      </div>
    )
  }
  
  if ($Type === "CardView") {
    return (
      <div className="bg-white shadow-sm rounded-sm p-0.5 min-h-[6px]">
        {$Components?.slice(0, 2).map((child, i) => (
          <MiniComponentRenderer key={i} component={child} scale={scale} />
        ))}
      </div>
    )
  }
  
  if ($Type === "ListView") {
    return (
      <div className="bg-white border rounded-sm">
        <div className="h-1 w-full border-b bg-muted/50" />
        <div className="h-1 w-full border-b bg-muted/30" />
        <div className="h-1 w-full bg-muted/20" />
      </div>
    )
  }
  
  // Default
  return <div className={cn(baseClass, "bg-muted-foreground/10 h-2 w-6")} />
}

// Screen thumbnail component
function ScreenThumbnail({ 
  screen, 
  isActive, 
  onClick,
  onDuplicate,
  onDelete,
  onRename
}: { 
  screen: ScreenFile
  isActive: boolean
  onClick: () => void
  onDuplicate: () => void
  onDelete: () => void
  onRename: (newName: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(screen.name)
  const { currentProject } = useIDEStore()
  
  const handleRename = () => {
    if (editName.trim() && editName !== screen.name) {
      onRename(editName.trim())
    }
    setIsEditing(false)
  }
  
  return (
    <div 
      className={cn(
        "group relative flex-shrink-0 cursor-pointer transition-all duration-200",
        isActive && "scale-105"
      )}
    >
      {/* Thumbnail Card */}
      <div 
        onClick={onClick}
        className={cn(
          "w-20 h-36 rounded-lg border-2 bg-card overflow-hidden flex flex-col transition-all",
          isActive 
            ? "border-primary shadow-lg shadow-primary/20" 
            : "border-border hover:border-primary/50"
        )}
      >
        {/* Mini Preview */}
        <div className="flex-1 bg-background p-1 overflow-hidden">
          {/* Mini Status Bar */}
          <div className="h-1.5 bg-zinc-900 rounded-t-sm mb-0.5" />
          
          {/* Mini Title Bar */}
          <div className="h-2 bg-primary/80 rounded-sm mb-0.5" />
          
          {/* Mini Content */}
          <div className="bg-white rounded-sm p-0.5 h-full overflow-hidden flex flex-col gap-0.5">
            {currentProject?.Properties.$Components?.slice(0, 4).map((comp, i) => (
              <MiniComponentRenderer key={i} component={comp} />
            )) || (
              <div className="flex-1 border border-dashed border-muted-foreground/20 rounded-sm" />
            )}
          </div>
        </div>
      </div>
      
      {/* Screen Name */}
      <div className="mt-1.5 px-0.5">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-5 text-[10px] px-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename()
                if (e.key === "Escape") setIsEditing(false)
              }}
            />
            <button onClick={handleRename} className="text-success">
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-[10px] font-medium truncate flex-1",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {screen.name}
            </span>
            
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => { setEditName(screen.name); setIsEditing(true) }}>
                  <Edit2 className="w-3 h-3 mr-2" />
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="w-3 h-3 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="w-3 h-3 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
      )}
    </div>
  )
}

export function ScreenThumbnails({ onScreenSelect }: ScreenThumbnailsProps) {
  const { 
    screenFiles, 
    currentScreenName,
    addScreen,
    duplicateScreen,
    removeScreen,
    renameScreen,
  } = useIDEStore()
  
  const [isAddingScreen, setIsAddingScreen] = useState(false)
  const [newScreenName, setNewScreenName] = useState("")
  const [deleteConfirmScreen, setDeleteConfirmScreen] = useState<string | null>(null)
  
  const handleAddScreen = () => {
    if (!newScreenName.trim()) {
      toast.error("Digite um nome para a tela")
      return
    }
    
    const sanitized = newScreenName.replace(/[^a-zA-Z0-9_]/g, "")
    
    if (screenFiles.some(s => s.name === sanitized)) {
      toast.error("Ja existe uma tela com esse nome")
      return
    }
    
    addScreen(sanitized)
    toast.success(`Tela "${sanitized}" criada`)
    setNewScreenName("")
    setIsAddingScreen(false)
  }
  
  const handleDuplicateScreen = (name: string) => {
    duplicateScreen(name)
    toast.success(`Tela "${name}" duplicada`)
  }
  
  const handleDeleteScreen = (name: string) => {
    if (screenFiles.length <= 1) {
      toast.error("Nao e possivel remover a ultima tela")
      return
    }
    removeScreen(name)
    toast.success(`Tela "${name}" removida`)
    setDeleteConfirmScreen(null)
  }
  
  const handleRenameScreen = (oldName: string, newName: string) => {
    const sanitized = newName.replace(/[^a-zA-Z0-9_]/g, "")
    if (screenFiles.some(s => s.name === sanitized && s.name !== oldName)) {
      toast.error("Ja existe uma tela com esse nome")
      return
    }
    renameScreen(oldName, sanitized)
    toast.success(`Tela renomeada para "${sanitized}"`)
  }
  
  if (screenFiles.length === 0) {
    return null
  }
  
  return (
    <div className="bg-card/50 border-t border-border px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Label */}
        <div className="flex items-center gap-2 text-muted-foreground shrink-0">
          <Smartphone className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Telas</span>
        </div>
        
        {/* Screen Thumbnails */}
        <ScrollArea className="flex-1">
          <div className="flex items-start gap-3 pb-2">
            {screenFiles.map((screen) => (
              <ScreenThumbnail
                key={screen.name}
                screen={screen}
                isActive={currentScreenName === screen.name}
                onClick={() => onScreenSelect?.(screen)}
                onDuplicate={() => handleDuplicateScreen(screen.name)}
                onDelete={() => setDeleteConfirmScreen(screen.name)}
                onRename={(newName) => handleRenameScreen(screen.name, newName)}
              />
            ))}
            
            {/* Add Screen Button */}
            {isAddingScreen ? (
              <div className="flex-shrink-0 w-20 flex flex-col gap-1">
                <Input
                  value={newScreenName}
                  onChange={(e) => setNewScreenName(e.target.value)}
                  placeholder="Nome..."
                  className="h-7 text-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddScreen()
                    if (e.key === "Escape") setIsAddingScreen(false)
                  }}
                />
                <div className="flex gap-1">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1 h-6 text-[10px]"
                    onClick={handleAddScreen}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 h-6 text-[10px]"
                    onClick={() => setIsAddingScreen(false)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingScreen(true)}
                className="flex-shrink-0 w-20 h-36 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Nova Tela</span>
              </button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmScreen} onOpenChange={() => setDeleteConfirmScreen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tela?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tela &quot;{deleteConfirmScreen}&quot;? 
              Esta acao nao pode ser desfeita.
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
