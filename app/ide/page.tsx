"use client"

import { useState, useEffect } from "react"
import { IDEHeader } from "@/components/ide/ide-header"
import { Sidebar } from "@/components/ide/sidebar"
import { PhonePreview } from "@/components/ide/phone-preview"
import { PropertiesPanel } from "@/components/ide/properties-panel"
import { BuildModal } from "@/components/ide/build-modal"
import { BlocksModal } from "@/components/ide/blocks-modal"
import { BlocksEditor } from "@/components/ide/blocks-editor"
import { ExportModal } from "@/components/ide/export-modal"
import { TemplatesModal } from "@/components/ide/templates-modal"
import { SettingsModal } from "@/components/ide/settings-modal"
import { LoginModal } from "@/components/ide/login-modal"
import { CommandPalette } from "@/components/ide/command-palette"
import { ToastContainer } from "@/components/ide/toast"
import { ErrorBoundary } from "@/components/ide/error-boundary"
import { LoadingScreen } from "@/components/ide/loading-skeleton"
import { IDEDndProvider } from "@/components/ide/dnd-context"
import { useIDEStore } from "@/lib/ide-store"

export default function IDEPage() {
  const [buildModalOpen, setBuildModalOpen] = useState(false)
  const [blocksModalOpen, setBlocksModalOpen] = useState(false)
  const [blocksEditorOpen, setBlocksEditorOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { 
    selectedComponent, 
    removeComponent,
    undo,
    redo 
  } = useIDEStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === "y") || (e.ctrlKey && e.shiftKey && e.key === "z")) {
        e.preventDefault()
        redo()
      }
      // Delete component
      if (e.key === "Delete" && selectedComponent) {
        removeComponent(selectedComponent.$Name)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedComponent, removeComponent, undo, redo])

  if (!mounted) {
    return (
      <div className="h-screen bg-background">
        <LoadingScreen message="Carregando APEX DROID..." />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <IDEDndProvider>
        <div className="h-screen bg-background flex flex-col overflow-hidden">
          <IDEHeader 
            onBuildClick={() => setBuildModalOpen(true)}
            onSettingsClick={() => setSettingsModalOpen(true)}
          />

          <div className="flex flex-1 overflow-hidden">
            <ErrorBoundary>
              <Sidebar onLoginClick={() => setLoginModalOpen(true)} />
            </ErrorBoundary>
            <ErrorBoundary>
              <PhonePreview onLoginClick={() => setLoginModalOpen(true)} />
            </ErrorBoundary>
            <ErrorBoundary>
              <PropertiesPanel onShowBlocks={() => setBlocksModalOpen(true)} />
            </ErrorBoundary>
          </div>

        {/* Modals */}
        <BuildModal 
          isOpen={buildModalOpen} 
          onClose={() => setBuildModalOpen(false)} 
        />
        <BlocksModal 
          isOpen={blocksModalOpen} 
          onClose={() => setBlocksModalOpen(false)} 
        />
        <SettingsModal 
          isOpen={settingsModalOpen} 
          onClose={() => setSettingsModalOpen(false)} 
        />
        <LoginModal 
          isOpen={loginModalOpen} 
          onClose={() => setLoginModalOpen(false)} 
        />
        <BlocksEditor 
          isOpen={blocksEditorOpen} 
          onClose={() => setBlocksEditorOpen(false)} 
        />
        <ExportModal 
          isOpen={exportModalOpen} 
          onClose={() => setExportModalOpen(false)} 
        />
        <TemplatesModal 
          isOpen={templatesModalOpen} 
          onClose={() => setTemplatesModalOpen(false)} 
        />

        {/* Command Palette */}
        <CommandPalette
          onBuildClick={() => setBuildModalOpen(true)}
          onSettingsClick={() => setSettingsModalOpen(true)}
          onLoginClick={() => setLoginModalOpen(true)}
          onBlocksClick={() => setBlocksModalOpen(true)}
          onBlocksEditorClick={() => setBlocksEditorOpen(true)}
          onExportClick={() => setExportModalOpen(true)}
          onTemplatesClick={() => setTemplatesModalOpen(true)}
        />

        {/* Toast Container */}
          <ToastContainer />
        </div>
      </IDEDndProvider>
    </ErrorBoundary>
  )
}
