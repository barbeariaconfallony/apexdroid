"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core"
import { useIDEStore } from "@/lib/ide-store"
import { 
  Square, Type, ImageIcon, ToggleLeft, SlidersHorizontal, 
  List, Globe, Video, Layers, Grid3X3, CreditCard, 
  TextCursorInput, Box
} from "lucide-react"

// Component icon mapping
const componentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Button: Square,
  Label: Type,
  TextBox: TextCursorInput,
  PasswordTextBox: TextCursorInput,
  Image: ImageIcon,
  CheckBox: ToggleLeft,
  Switch: ToggleLeft,
  Slider: SlidersHorizontal,
  Spinner: List,
  ListView: List,
  WebViewer: Globe,
  VideoPlayer: Video,
  VerticalArrangement: Layers,
  HorizontalArrangement: Layers,
  TableArrangement: Grid3X3,
  VerticalScrollArrangement: Layers,
  HorizontalScrollArrangement: Layers,
  CardView: CreditCard,
  Space: Box,
}

interface DragData {
  type: "palette" | "tree"
  componentType: string
  componentName?: string
}

interface DropData {
  type: "preview" | "arrangement"
  targetName: string
  index?: number
}

interface IDEDndContextValue {
  activeId: string | null
  activeData: DragData | null
  overId: string | null
  overData: DropData | null
  isDragging: boolean
}

const IDEDndContext = createContext<IDEDndContextValue>({
  activeId: null,
  activeData: null,
  overId: null,
  overData: null,
  isDragging: false,
})

export function useIDEDnd() {
  return useContext(IDEDndContext)
}

interface IDEDndProviderProps {
  children: React.ReactNode
}

export function IDEDndProvider({ children }: IDEDndProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeData, setActiveData] = useState<DragData | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [overData, setOverData] = useState<DropData | null>(null)

  const { addComponent, currentProject, saveSnapshot } = useIDEStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    setActiveData(active.data.current as DragData)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event
    if (over) {
      setOverId(over.id as string)
      setOverData(over.data.current as DropData)
    } else {
      setOverId(null)
      setOverData(null)
    }
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.data.current && over.data.current) {
      const dragData = active.data.current as DragData
      const dropData = over.data.current as DropData

      // Handle drop from palette to preview/arrangement
      if (dragData.type === "palette" && currentProject) {
        const targetName = dropData.targetName || currentProject.Properties.$Name
        addComponent(targetName, dragData.componentType)
        saveSnapshot()
      }
    }

    // Reset state
    setActiveId(null)
    setActiveData(null)
    setOverId(null)
    setOverData(null)
  }, [addComponent, currentProject, saveSnapshot])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setActiveData(null)
    setOverId(null)
    setOverData(null)
  }, [])

  const contextValue: IDEDndContextValue = {
    activeId,
    activeData,
    overId,
    overData,
    isDragging: activeId !== null,
  }

  return (
    <IDEDndContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {activeId && activeData && (
            <DragPreview componentType={activeData.componentType} />
          )}
        </DragOverlay>
      </DndContext>
    </IDEDndContext.Provider>
  )
}

function DragPreview({ componentType }: { componentType: string }) {
  const Icon = componentIcons[componentType] || Box

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-xl border-2 border-primary-foreground/20 cursor-grabbing">
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{componentType}</span>
    </div>
  )
}
