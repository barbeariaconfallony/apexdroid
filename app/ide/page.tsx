"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
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
import { CommandPalette } from "@/components/ide/command-palette"
import { ToastContainer } from "@/components/ide/toast"
import { ErrorBoundary } from "@/components/ide/error-boundary"
import { LoadingScreen } from "@/components/ide/loading-skeleton"
import { IDEDndProvider } from "@/components/ide/dnd-context"
import { AIComponentGenerator } from "@/components/ide/ai-component-generator"
import { AIDebugAssistant } from "@/components/ide/ai-debug-assistant"
import { AIScreenGenerator } from "@/components/ide/ai-screen-generator"
import { BuildMonitor } from "@/components/ide/build-monitor"
import { AssetsModal } from "@/components/ide/assets-modal"
import { CodeEditor } from "@/components/ide/code-editor"
import { useIDEStore } from "@/lib/ide-store"
import { useProjectManager } from "@/lib/hooks/use-project-manager"
import { fetchUserRepos } from "@/lib/github-service"
import type { GitHubRepo } from "@/lib/ide-types"

export default function IDEPage() {
  const router = useRouter()
  const [buildModalOpen, setBuildModalOpen] = useState(false)
  const [blocksModalOpen, setBlocksModalOpen] = useState(false)
  const [blocksEditorOpen, setBlocksEditorOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [aiComponentGeneratorOpen, setAiComponentGeneratorOpen] = useState(false)
  const [aiDebugAssistantOpen, setAiDebugAssistantOpen] = useState(false)
  const [aiScreenGeneratorOpen, setAiScreenGeneratorOpen] = useState(false)
  const [assetsModalOpen, setAssetsModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loadingProject, setLoadingProject] = useState(true)

  const { 
    selectedComponent, 
    removeComponent,
    undo,
    redo,
    setGhToken,
    setGhRepos,
    isCodeEditorOpen,
    setIsCodeEditorOpen
  } = useIDEStore()

  const { selectProject } = useProjectManager()

  // Carregar token e projeto do localStorage
  const loadProjectFromStorage = useCallback(async () => {
    if (typeof window === "undefined") return

    const savedToken = localStorage.getItem("gh_token")
    const savedRepoData = localStorage.getItem("selected_repo")
    
    if (!savedToken) {
      // Sem token, redirecionar para página de projetos
      router.push("/projects")
      return
    }

    // Definir token no store
    setGhToken(savedToken)

    // Carregar repos do usuário
    try {
      const repos = await fetchUserRepos(savedToken)
      setGhRepos(repos)

      // Se tem um repo selecionado no storage, carregá-lo
      if (savedRepoData) {
        const repoInfo = JSON.parse(savedRepoData) as { owner: string; name: string; url: string }
        
        // Encontrar o repo completo na lista
        const fullRepo = repos.find(r => 
          r.name === repoInfo.name && r.owner.login === repoInfo.owner
        )

        if (fullRepo) {
          await selectProject(fullRepo)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar projeto:", error)
    } finally {
      setLoadingProject(false)
    }
  }, [router, setGhToken, setGhRepos, selectProject])

  useEffect(() => {
    setMounted(true)
    loadProjectFromStorage()
  }, [loadProjectFromStorage])

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

  if (!mounted || loadingProject) {
    return (
      <div className="h-screen bg-background">
        <LoadingScreen message={loadingProject ? "Carregando projeto..." : "Carregando APEX DROID..."} />
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
            onAIGeneratorClick={() => setAiComponentGeneratorOpen(true)}
            onAIScreenClick={() => setAiScreenGeneratorOpen(true)}
            onAIDebugClick={() => setAiDebugAssistantOpen(true)}
            onAssetsClick={() => setAssetsModalOpen(true)}
            onBackToProjects={() => router.push("/projects")}
          />

          <div className="flex flex-1 overflow-hidden">
            <ErrorBoundary>
              <Sidebar />
            </ErrorBoundary>
            <ErrorBoundary>
              <PhonePreview />
            </ErrorBoundary>
            <ErrorBoundary>
              <PropertiesPanel onShowBlocks={() => setBlocksModalOpen(true)} />
            </ErrorBoundary>
          </div>

          {/* Monaco Code Editor Overlay */}
          {isCodeEditorOpen && (
            <div className="fixed inset-0 z-[60] flex flex-col bg-background/80 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <h3 className="text-sm font-semibold tracking-tight uppercase">Editor de Código SCM</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive rounded-full transition-colors"
                  onClick={() => setIsCodeEditorOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeEditor className="h-full" />
              </div>
            </div>
          )}

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
        <AssetsModal 
          isOpen={assetsModalOpen} 
          onClose={() => setAssetsModalOpen(false)} 
        />

        {/* Command Palette */}
        <CommandPalette
          onBuildClick={() => setBuildModalOpen(true)}
          onSettingsClick={() => setSettingsModalOpen(true)}
          onBlocksClick={() => setBlocksModalOpen(true)}
          onBlocksEditorClick={() => setBlocksEditorOpen(true)}
          onExportClick={() => setExportModalOpen(true)}
          onTemplatesClick={() => setTemplatesModalOpen(true)}
          onAssetsClick={() => setAssetsModalOpen(true)}
          onAIScreenClick={() => setAiScreenGeneratorOpen(true)}
        />

        {/* AI Modals */}
        <AIComponentGenerator 
          isOpen={aiComponentGeneratorOpen}
          onClose={() => setAiComponentGeneratorOpen(false)}
        />
        <AIScreenGenerator 
          isOpen={aiScreenGeneratorOpen}
          onClose={() => setAiScreenGeneratorOpen(false)}
        />
        <AIDebugAssistant 
          isOpen={aiDebugAssistantOpen}
          onClose={() => setAiDebugAssistantOpen(false)}
        />

        <BuildMonitor />

        {/* Toast Container */}
          <ToastContainer />
        </div>
      </IDEDndProvider>
    </ErrorBoundary>
  )
}
