"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { IDEHeader } from "@/components/ide/ide-header"
import { Sidebar } from "@/components/ide/sidebar"
import { FlowchartSidebar } from "@/components/ide/flowchart-sidebar"
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
import { fetchUserRepos, fetchFileContent } from "@/lib/github-service"
import type { GitHubRepo, ScreenFile } from "@/lib/ide-types"

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
    setIsCodeEditorOpen,
    appMode,
    setActiveTab,
    setCurrentProject,
    setCurrentScreenName,
    setCurrentFile,
    setShowWelcome,
    setCurrentBkyContent,
    setCurrentFlowchartContent,
    saveSnapshot,
    setShowProperties,
    setSelectedComponent,
    screens: storeScreens
  } = useIDEStore()

  const { selectProject } = useProjectManager()

  // Helper function to extract balanced JSON from SCM content
  const extractBalancedJSON = (content: string, startIndex: number): string | null => {
    let braceCount = 0
    let inString = false
    let escapeNext = false
    let jsonEnd = startIndex
    
    for (let i = startIndex; i < content.length; i++) {
      const char = content[i]
      
      if (escapeNext) {
        escapeNext = false
        continue
      }
      
      if (char === '\\' && inString) {
        escapeNext = true
        continue
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString
        continue
      }
      
      if (!inString) {
        if (char === '{') braceCount++
        else if (char === '}') {
          braceCount--
          if (braceCount === 0) {
            jsonEnd = i + 1
            break
          }
        }
      }
    }
    
    if (braceCount !== 0) return null
    return content.substring(startIndex, jsonEnd)
  }

  // Parse SCM file content
  const parseSCMContent = (content: string): { json: string; prefix: string } | null => {
    const jsonStart = content.indexOf("{")
    if (jsonStart === -1) return null
    
    const prefix = content.substring(0, jsonStart)
    const json = extractBalancedJSON(content, jsonStart)
    
    if (!json) return null
    return { json, prefix }
  }

  // Load a screen from GitHub
  const loadScreen = useCallback(async (screen: ScreenFile, repo: GitHubRepo, ghToken: string) => {
    const [owner] = repo.full_name.split("/")
    
    try {
      const { content: scmContent, sha } = await fetchFileContent(ghToken, owner, repo.name, screen.scmPath)
      const parsed = parseSCMContent(scmContent)
      
      if (!parsed) {
        console.error("[v0] Could not parse SCM format")
        return
      }
      
      const projectData = JSON.parse(parsed.json)
      
      // Update store with screen data
      const currentScreens = useIDEStore.getState().screens
      useIDEStore.setState({
        currentProject: projectData,
        currentScreenName: screen.name,
        screens: {
          ...currentScreens,
          [screen.name]: {
            name: screen.name,
            data: projectData,
            scmPath: screen.scmPath,
            bkyPath: screen.bkyPath,
            bkyContent: null,
            scmPrefix: parsed.prefix
          }
        }
      })

      setCurrentFile({
        repo: repo.full_name,
        path: screen.scmPath,
        sha,
        branch: repo.default_branch,
        originalContent: scmContent,
        content: scmContent
      })
      
      setActiveTab("componentes")
      setShowProperties(true)
      setSelectedComponent(projectData.Properties)
      setShowWelcome(false)
      
      // Load .bky file
      if (screen.bkyPath) {
        try {
          const { content: bkyContent } = await fetchFileContent(ghToken, owner, repo.name, screen.bkyPath)
          setCurrentBkyContent(bkyContent)
        } catch {
          setCurrentBkyContent(null)
        }
      } else {
        setCurrentBkyContent(null)
      }
      
      // Try to load .flow file
      setCurrentFlowchartContent(null)
      try {
        const flowPath = screen.scmPath.replace(".scm", ".flow")
        const { content: flowContent } = await fetchFileContent(ghToken, owner, repo.name, flowPath)
        setCurrentFlowchartContent(flowContent)
      } catch {
        // No .flow file, that's ok
      }
      
      saveSnapshot()
    } catch (error) {
      console.error("[v0] Error loading screen:", error)
    }
  }, [setCurrentFile, setActiveTab, setShowProperties, setSelectedComponent, setShowWelcome, setCurrentBkyContent, setCurrentFlowchartContent, saveSnapshot])

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

    // Verificar se estamos offline antes de tentar o fetch
    if (!navigator.onLine) {
      toast.error("Sem conexão com a internet. Trabalhando em modo offline.")
      setLoadingProject(false)
      return
    }

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
          const result = await selectProject(fullRepo)
          
          // Carregar automaticamente a primeira tela se houver telas disponíveis
          if (result && result.screens && result.screens.length > 0) {
            const firstScreen = result.screens[0]
            await loadScreen(firstScreen, fullRepo, savedToken)
          }
        }
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        console.warn("Erro ao carregar projeto: Falha de conexão (Failed to fetch).")
        toast.error("Erro de conexão com o GitHub. Verifique sua internet.")
      } else {
        console.warn("Erro ao carregar projeto:", error instanceof Error ? error.message : error)
        toast.error("Erro ao carregar repositórios do GitHub.")
      }
    } finally {
      setLoadingProject(false)
    }
  }, [router, setGhToken, setGhRepos, selectProject, loadScreen])

  const hasLoaded = useRef(false)

  useEffect(() => {
    setMounted(true)
    if (!hasLoaded.current) {
      loadProjectFromStorage()
      hasLoaded.current = true
    }
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
  
  // Network status listeners
  const { setIsOffline } = useIDEStore()
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      toast.success("Conexão restabelecida!")
    }
    const handleOffline = () => {
      setIsOffline(true)
      toast.error("Você está offline. Algumas funções podem não estar disponíveis.")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [setIsOffline])

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
              {appMode === "flowchart" ? <FlowchartSidebar /> : <Sidebar />}
            </ErrorBoundary>
            <ErrorBoundary>
              <PhonePreview />
            </ErrorBoundary>
            {(appMode === "edit" || appMode === "run") && (
              <ErrorBoundary>
                <PropertiesPanel onShowBlocks={() => setBlocksModalOpen(true)} />
              </ErrorBoundary>
            )}
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
