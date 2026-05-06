"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { useIDEDnd } from "./dnd-context"

interface DroppableZoneProps {
  id: string
  targetName: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
}

export function DroppableZone({ 
  id, 
  targetName, 
  children, 
  className,
  style,
  disabled = false 
}: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "arrangement",
      targetName,
    },
    disabled,
  })

  const { isDragging, activeData } = useIDEDnd()

  // Show drop indicator when dragging from palette
  const showDropIndicator = isDragging && activeData?.type === "palette" && !disabled

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-all duration-200",
        showDropIndicator && "ring-2 ring-dashed ring-primary/50",
        isOver && showDropIndicator && "ring-primary bg-primary/10 ring-solid",
        className
      )}
      style={style}
    >
      {children}
      
      {/* Drop indicator overlay */}
      {isOver && showDropIndicator && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-primary/5 rounded">
          <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded shadow-lg">
            Soltar aqui
          </div>
        </div>
      )}
    </div>
  )
}

// Empty drop zone placeholder for empty arrangements
interface EmptyDropZoneProps {
  id: string
  targetName: string
  className?: string
}

export function EmptyDropZone({ id, targetName, className }: EmptyDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "arrangement",
      targetName,
    },
  })

  const { isDragging, activeData } = useIDEDnd()
  const showDropIndicator = isDragging && activeData?.type === "palette"

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 border-2 border-dashed rounded flex items-center justify-center min-h-[40px] transition-all duration-200",
        showDropIndicator 
          ? "border-primary/50 bg-primary/5" 
          : "border-muted-foreground/30",
        isOver && showDropIndicator && "border-primary bg-primary/10 border-solid",
        className
      )}
    >
      <span className={cn(
        "text-xs transition-colors",
        isOver && showDropIndicator ? "text-primary font-medium" : "text-muted-foreground"
      )}>
        {isOver && showDropIndicator ? "Soltar para adicionar" : "Arraste componentes aqui"}
      </span>
    </div>
  )
}
