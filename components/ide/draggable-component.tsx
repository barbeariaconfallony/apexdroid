"use client"

import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"

interface DraggableComponentProps {
  id: string
  componentType: string
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

export function DraggableComponent({ 
  id, 
  componentType, 
  children, 
  onClick,
  disabled = false 
}: DraggableComponentProps) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id,
    data: {
      type: "palette",
      componentType,
    },
    disabled,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all",
        isDragging && "opacity-50 scale-95"
      )}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  )
}
