"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Layout, Square, Type, ImageIcon, Plus, Upload, 
  Cloud, CheckCircle, LogOut, FolderGit2, GitBranch,
  Loader2, AlertCircle, RefreshCw, ArrowLeft, Monitor,
  FileImage, FileAudio, FileVideo, File, Save, GitCommit,
  ToggleLeft, SlidersHorizontal, List, Grid3X3, CircleDot,
  Clock, Bell, Database, Globe, Video, Music,
  Calendar, MapPin, Phone, MessageSquare, Camera, Mic,
  Share2, Settings, Wifi, Bluetooth, ChevronDown, ChevronRight,
  Box, Layers, CreditCard, TextCursorInput, Sparkles, Send,
  Smartphone, GitPullRequest, HardDrive, Network, Search, X, Star,
  ChevronLeft, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIDEStore } from "@/lib/ide-store"
import { fetchUserRepos, fetchRepoTree, fetchFileContent, updateFileContent } from "@/lib/github-service"
import { cn } from "@/lib/utils"
import { useProjectManager } from "@/lib/hooks/use-project-manager"
import { useAIChat } from "@/lib/hooks/use-ai-chat"
import type { GitHubRepo, ProjectAsset, ScreenFile } from "@/lib/ide-types"
import { DraggableComponent } from "./draggable-component"

const tabs = [
  { id: "componentes", label: "Paleta", icon: Layout, title: "PALETA DE COMPONENTES" },
  { id: "telas", label: "Telas", icon: Smartphone, title: "TELAS DO PROJETO" },
  { id: "github", label: "Projetos", icon: FolderGit2, title: "PROJETOS GITHUB" },
  { id: "assets", label: "Assets", icon: HardDrive, title: "ASSETS DO PROJETO" },
  { id: "cloud", label: "Cloud", icon: Cloud, title: "APEX CLOUD" },
  { id: "arvore", label: "Arvore", icon: Network, title: "ARVORE DE COMPONENTES" },
  { id: "chat", label: "Chat", icon: Sparkles, title: "APEX DROID AI" },
]

// Kodular component categories with all components
const kodularCategories = [
  {
    name: "Interface de Usuario",
    icon: Layout,
    expanded: true,
    components: [
      { name: "Button", icon: Square, description: "Botao clicavel" },
      { name: "Label", icon: Type, description: "Texto estatico" },
      { name: "TextBox", icon: TextCursorInput, description: "Campo de texto" },
      { name: "PasswordTextBox", icon: TextCursorInput, description: "Campo de senha" },
      { name: "Image", icon: ImageIcon, description: "Exibir imagem" },
      { name: "CheckBox", icon: CheckCircle, description: "Caixa de selecao" },
      { name: "Switch", icon: ToggleLeft, description: "Interruptor on/off" },
      { name: "Slider", icon: SlidersHorizontal, description: "Controle deslizante" },
      { name: "Spinner", icon: List, description: "Lista suspensa" },
      { name: "ListView", icon: List, description: "Lista de itens" },
      { name: "WebViewer", icon: Globe, description: "Visualizador web" },
      { name: "VideoPlayer", icon: Video, description: "Player de video" },
    ]
  },
  {
    name: "Layout",
    icon: Grid3X3,
    expanded: true,
    components: [
      { name: "VerticalArrangement", icon: Layers, description: "Layout vertical" },
      { name: "HorizontalArrangement", icon: Layers, description: "Layout horizontal" },
      { name: "TableArrangement", icon: Grid3X3, description: "Layout em grade" },
      { name: "VerticalScrollArrangement", icon: Layers, description: "Scroll vertical" },
      { name: "HorizontalScrollArrangement", icon: Layers, description: "Scroll horizontal" },
      { name: "CardView", icon: CreditCard, description: "Cartao elevado" },
      { name: "Space", icon: Box, description: "Espacador" },
    ]
  },
  {
    name: "Midia",
    icon: Music,
    expanded: false,
    components: [
      { name: "Sound", icon: Music, description: "Reproduzir som" },
      { name: "Player", icon: Video, description: "Player de midia" },
      { name: "Camera", icon: Camera, description: "Acessar camera" },
      { name: "Camcorder", icon: Video, description: "Gravar video" },
      { name: "ImagePicker", icon: ImageIcon, description: "Selecionar imagem" },
      { name: "SpeechRecognizer", icon: Mic, description: "Reconhecimento de voz" },
      { name: "TextToSpeech", icon: MessageSquare, description: "Texto para voz" },
    ]
  },
  {
    name: "Sensores",
    icon: Wifi,
    expanded: false,
    components: [
      { name: "AccelerometerSensor", icon: Monitor, description: "Acelerometro" },
      { name: "GyroscopeSensor", icon: CircleDot, description: "Giroscopio" },
      { name: "LocationSensor", icon: MapPin, description: "Localizacao GPS" },
      { name: "OrientationSensor", icon: CircleDot, description: "Orientacao" },
      { name: "ProximitySensor", icon: Wifi, description: "Proximidade" },
      { name: "Clock", icon: Clock, description: "Temporizador" },
    ]
  },
  {
    name: "Social",
    icon: Share2,
    expanded: false,
    components: [
      { name: "ContactPicker", icon: Phone, description: "Selecionar contato" },
      { name: "PhoneCall", icon: Phone, description: "Fazer ligacao" },
      { name: "PhoneNumberPicker", icon: Phone, description: "Selecionar numero" },
      { name: "Sharing", icon: Share2, description: "Compartilhar" },
      { name: "Texting", icon: MessageSquare, description: "Enviar SMS" },
      { name: "Twitter", icon: MessageSquare, description: "Twitter API" },
    ]
  },
  {
    name: "Armazenamento",
    icon: Database,
    expanded: false,
    components: [
      { name: "TinyDB", icon: Database, description: "Banco local" },
      { name: "TinyWebDB", icon: Database, description: "Banco web" },
      { name: "File", icon: File, description: "Manipular arquivos" },
      { name: "Firebase", icon: Database, description: "Firebase DB" },
      { name: "Cloudinary", icon: Cloud, description: "Cloudinary" },
    ]
  },
  {
    name: "Conectividade",
    icon: Wifi,
    expanded: false,
    components: [
      { name: "Web", icon: Globe, description: "Requisicoes HTTP" },
      { name: "ActivityStarter", icon: Share2, description: "Iniciar atividade" },
      { name: "BluetoothClient", icon: Bluetooth, description: "Bluetooth cliente" },
      { name: "BluetoothServer", icon: Bluetooth, description: "Bluetooth servidor" },
    ]
  },
  {
    name: "Notificacoes",
    icon: Bell,
    expanded: false,
    components: [
      { name: "Notifier", icon: Bell, description: "Alertas e dialogos" },
      { name: "Notification", icon: Bell, description: "Notificacao push" },
    ]
  }
]

interface SidebarProps {
  onLoginClick: () => void
}

function getAssetType(filename: string): "image" | "audio" | "video" | "other" {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) return "image"
  if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "audio"
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video"
  return "other"
}

function getAssetIcon(type: "image" | "audio" | "video" | "other") {
  switch (type) {
    case "image": return FileImage
    case "audio": return FileAudio
    case "video": return FileVideo
    default: return File
  }
}

export function Sidebar({ onLoginClick }: SidebarProps) {
  const { 
    activeTab, setActiveTab, cloudUser, setCloudUser,
    currentProject, addComponent, ghToken,
    ghRepos, setGhRepos, ghReposLoading, setGhReposLoading,
    ghReposError, setGhReposError, selectedRepo, setSelectedRepo,
    repoTree, setRepoTree, repoTreeLoading, setRepoTreeLoading,
    setCurrentProject, setCurrentFile, saveSnapshot, setShowWelcome,
    screenFiles, setScreenFiles, currentScreenName, setCurrentScreenName,
    projectAssets, setProjectAssets, setCurrentBkyContent, 
    currentFile, setShowProperties, selectedComponent, setSelectedComponent,
    isSidebarCompact, setIsSidebarCompact, toggleSidebar
  } = useIDEStore()
  
  const { selectProject, createNewScreen, deleteScreen } = useProjectManager()
  
  const [isCreatingScreen, setIsCreatingScreen] = useState(false)
  const [newScreenName, setNewScreenName] = useState("")
  const [deletingScreen, setDeletingScreen] = useState<string | null>(null)
  const [loadingScreen, setLoadingScreen] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    kodularCategories.forEach(cat => {
      initial[cat.name] = cat.expanded
    })
    return initial
  })
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [chatInput, setChatInput] = useState("")

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }))
  }

  const loadRepos = useCallback(async () => {
    if (!ghToken) return
    
    setGhReposLoading(true)
    setGhReposError(null)
    
    try {
      const repos = await fetchUserRepos(ghToken)
      setGhRepos(repos)
    } catch (error) {
      setGhReposError(error instanceof Error ? error.message : "Erro ao carregar repositorios")
    } finally {
      setGhReposLoading(false)
    }
  }, [ghToken, setGhRepos, setGhReposLoading, setGhReposError])

  // Extract balanced JSON from content - handles nested braces correctly
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

  // Parse SCM file content - Kodular/App Inventor format
  // Format: #|\n$JSON\n{...json...}\n|#
  const parseSCMContent = (content: string): { json: string; prefix: string } | null => {
    console.log("[v0] Parsing SCM, length:", content.length)
    
    // Find the first { which starts the JSON
    const jsonStart = content.indexOf("{")
    if (jsonStart === -1) {
      console.error("[v0] No JSON object found in SCM")
      return null
    }
    
    // Get prefix (everything before {)
    const prefix = content.substring(0, jsonStart)
    console.log("[v0] SCM prefix:", prefix.substring(0, 50))
    
    // Extract the complete JSON object using brace balancing
    const json = extractBalancedJSON(content, jsonStart)
    
    if (!json) {
      console.error("[v0] Could not extract balanced JSON")
      return null
    }
    
    console.log("[v0] Extracted JSON length:", json.length)
    return { json, prefix }
  }

  const loadScreen = useCallback(async (screen: ScreenFile, repo?: GitHubRepo, ownerOverride?: string) => {
    const currentRepo = repo || selectedRepo
    
    if (!ghToken || !currentRepo) {
      return
    }
    
    setLoadingScreen(screen.name)
    const [owner] = ownerOverride ? [ownerOverride] : currentRepo.full_name.split("/")
    
    try {
      // Load .scm file (screen components)
      const { content: scmContent, sha } = await fetchFileContent(ghToken, owner, currentRepo.name, screen.scmPath)
      
      console.log("[v0] SCM content length:", scmContent.length)
      console.log("[v0] SCM content preview:", scmContent.substring(0, 200))
      
      // Parse the SCM content
      const parsed = parseSCMContent(scmContent)
      
      if (!parsed) {
        console.error("[v0] Could not parse SCM format")
        return
      }
      
      console.log("[v0] Parsed JSON preview:", parsed.json.substring(0, 200))
      
      try {
        const projectData = JSON.parse(parsed.json)
        console.log("[v0] Parsed project:", projectData.Properties?.$Name)
        
        setCurrentProject(projectData)
        setCurrentScreenName(screen.name)
        setCurrentFile({
          repo: currentRepo.full_name,
          path: screen.scmPath,
          sha,
          branch: currentRepo.default_branch,
          originalContent: scmContent,
          content: scmContent
        })
        
        // Auto show palette when screen loads
        setActiveTab("componentes")
        setShowProperties(true)
        setSelectedComponent(projectData.Properties)
        setShowWelcome(false)
        
        // Load .bky file if exists (blocks)
        if (screen.bkyPath) {
          try {
            const { content: bkyContent } = await fetchFileContent(ghToken, owner, currentRepo.name, screen.bkyPath)
            setCurrentBkyContent(bkyContent)
          } catch {
            setCurrentBkyContent(null)
          }
        } else {
          setCurrentBkyContent(null)
        }
        
        saveSnapshot()
      } catch (parseError) {
        console.error("[v0] Erro ao parsear JSON do SCM:", parseError)
        console.error("[v0] JSON que falhou:", parsed.json.substring(0, 500))
      }
    } catch (error) {
      console.error("[v0] Erro ao carregar tela:", error)
    } finally {
      setLoadingScreen(null)
    }
  }, [ghToken, selectedRepo, fetchFileContent, parseSCMContent, setCurrentProject, setCurrentScreenName, setCurrentFile, setActiveTab, setShowProperties, setSelectedComponent, setShowWelcome, setCurrentBkyContent, saveSnapshot])

  // Save to GitHub
  const saveToGitHub = useCallback(async () => {
    if (!ghToken || !selectedRepo || !currentFile || !currentProject) return
    
    setSaving(true)
    try {
      const [owner] = selectedRepo.full_name.split("/")
      
      // Rebuild SCM content with JSON
      const jsonContent = JSON.stringify(currentProject, null, 2)
      let newContent = jsonContent
      
      // If original had prefix, preserve it
      if (currentFile.originalContent.includes("$JSON")) {
        const jsonStart = currentFile.originalContent.indexOf("{")
        if (jsonStart > 0) {
          const prefix = currentFile.originalContent.substring(0, jsonStart)
          newContent = prefix + jsonContent
        }
      }
      
      const result = await updateFileContent(
        ghToken,
        owner,
        selectedRepo.name,
        currentFile.path,
        newContent,
        currentFile.sha,
        `Atualizado via APEX DROID AI: ${currentScreenName}`,
        currentFile.branch
      )
      
      // Update the file reference with new SHA
      setCurrentFile({
        ...currentFile,
        sha: result.sha,
        originalContent: newContent,
        content: newContent
      })
      
    } catch (error) {
      console.error("Erro ao salvar no GitHub:", error)
    } finally {
      setSaving(false)
    }
  }, [ghToken, selectedRepo, currentFile, currentProject, currentScreenName, updateFileContent, setCurrentFile])

  // Load repos when token changes
  useEffect(() => {
    if (ghToken && ghRepos.length === 0 && !ghReposLoading) {
      loadRepos()
    }
  }, [ghToken, ghRepos.length, ghReposLoading, loadRepos])

  const handleComponentClick = useCallback((compName: string) => {
    if (currentProject) {
      addComponent(currentProject.Properties.$Name, compName)
    }
  }, [currentProject, addComponent])

  // Filter components by search
  const filteredCategories = kodularCategories.map(category => ({
    ...category,
    components: category.components.filter(comp => 
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.components.length > 0)

  const { chatMessages, addChatMessage, executeAIAction, getScreenNames, setIsThinking } = useIDEStore()
  const { sendMessage, isLoading: isChatLoading } = useAIChat()

  const sendChatMessage = useCallback(async () => {
    if (!chatInput.trim() || isChatLoading) return
    
    const text = chatInput.trim()
    const userMessage = { id: Date.now().toString(), role: "user" as const, content: text }
    addChatMessage(userMessage)
    setChatInput("")

    try {
      setIsThinking(true)
      // Preparar contexto do projeto para a IA
      const getTree = (comps: any[] = []): any[] => comps.map(c => ({
        name: c.$Name, type: c.$Type, 
        children: c.$Components ? getTree(c.$Components) : []
      }));
      
      const projectContext = currentProject 
        ? `TELA ATUAL ABERTA NA IDE: ${currentProject.Properties.$Name}.
           Qualquer modificação solicitada DEVE ser executada nesta tela (use-a como parentName), a menos que o usuário especifique outra tela ou componente pai.
           ÁRVORE COMPLETA DE COMPONENTES DESTA TELA: ${JSON.stringify(getTree(currentProject.Properties.$Components))}`
        : "Nenhum projeto carregado."

      const response = await sendMessage([...chatMessages, userMessage], projectContext)
      
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: response
      })

      // Extrair e executar ações (Regex mais flexível para variações de markdown)
      const actionMatch = response.match(/```actions\s*([\s\S]*?)\s*```/)
      if (actionMatch) {
        try {
          const rawJson = actionMatch[1].trim()
          const actions = JSON.parse(rawJson)
          if (Array.isArray(actions)) {
            actions.forEach(action => {
              // Se a IA não mandou targetScreen mas o parentName é uma tela conhecida, trocamos de tela
              const screenNames = getScreenNames()
              if (!action.targetScreen && action.parentName && screenNames.includes(action.parentName)) {
                action.targetScreen = action.parentName
              }
              executeAIAction(action)
            })
          }
        } catch (err) {
          console.error("Erro ao processar ações da IA:", err)
        }
      }
    } catch (err) {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Verifique suas configurações de IA."
      })
    } finally {
      setIsThinking(false)
    }
  }, [chatInput, addChatMessage, chatMessages, currentProject, sendMessage, isChatLoading])

  const renderComponentTree = (comp: import("@/lib/ide-types").KodularComponent, depth = 0): React.ReactNode => (
    <div key={comp.$Name}>
      <div
        onClick={() => { setSelectedComponent(comp); setShowProperties(true) }}
        className={cn(
          "flex items-center gap-1.5 py-1 rounded text-xs cursor-pointer hover:bg-secondary transition-all",
          selectedComponent?.$Name === comp.$Name && "bg-primary/20 text-primary"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <Box className="w-3 h-3 shrink-0 opacity-50" />
        <span className="truncate">{comp.$Name}</span>
        <span className="text-[9px] text-muted-foreground ml-auto pr-2">{comp.$Type?.split(".").pop()}</span>
      </div>
      {comp.$Components?.map((child) => renderComponentTree(child, depth + 1))}
    </div>
  )

  const activeTabMeta = tabs.find(t => t.id === activeTab)

  return (
    <aside 
      className={cn(
        "glass border-r border-white/5 flex shrink-0 transition-all duration-300 ease-in-out relative z-40 shadow-lg",
        isSidebarCompact ? "w-12" : "w-[280px]"
      )}
    >
      {/* Tab Rail - vertical with icons and labels */}
      <div className={cn(
        "bg-black/20 backdrop-blur-sm border-r border-white/5 flex flex-col py-2 gap-0.5 shrink-0 transition-all",
        isSidebarCompact ? "w-12 items-center px-0" : "w-[56px] px-1"
      )}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={isSidebarCompact ? tab.label : undefined}
            className={cn(
              "flex items-center justify-center rounded-md transition-all relative group",
              isSidebarCompact 
                ? "w-9 h-9" 
                : "w-full h-auto py-1.5 px-1 flex-col gap-0",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
          >
            <tab.icon className="w-3.5 h-3.5 shrink-0" />
            {!isSidebarCompact && (
              <span className="text-[8px] font-medium leading-tight text-center truncate w-full mt-0.5">
                {tab.label}
              </span>
            )}
            {tab.id === "chat" && chatMessages.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-success border border-card animate-pulse" />
            )}
          </button>
        ))}
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Toggle Sidebar Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex items-center justify-center rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-secondary/80",
            isSidebarCompact ? "w-9 h-9 mx-auto" : "w-full py-1.5 flex-col gap-0"
          )}
          title={isSidebarCompact ? "Expandir" : undefined}
        >
          {isSidebarCompact ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          {!isSidebarCompact && (
            <span className="text-[8px] font-medium mt-0.5">Recolher</span>
          )}
        </button>
      </div>

      {/* Content panel */}
      {!isSidebarCompact && (
        <div className="flex-1 overflow-hidden flex flex-col animate-in slide-in-from-left-2 duration-200">
        {/* Tab title with gradient */}
        <div className="px-2 py-1.5 border-b border-border/50 shrink-0">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {activeTabMeta?.title}
          </span>
        </div>
        {/* Palette Tab - Complete Kodular Components */}
        {activeTab === "componentes" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search with icon */}
            <div className="p-2.5 border-b border-border">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar componentes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-input border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredCategories.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Search className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Nenhum componente encontrado</p>
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-primary hover:underline mt-1"
                    >
                      Limpar busca
                    </button>
                  </div>
                ) : (
                  filteredCategories.map((category) => (
                    <div key={category.name} className="mb-3">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category.name)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:bg-secondary rounded-md transition-all group"
                      >
                        <span className={cn(
                          "transition-transform",
                          expandedCategories[category.name] ? "rotate-90" : "rotate-0"
                        )}>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                        <category.icon className="w-3.5 h-3.5 text-primary/60" />
                        <span className="flex-1 text-left">{category.name}</span>
                        <span className="text-[9px] text-muted-foreground/50 bg-secondary px-1.5 py-0.5 rounded">
                          {category.components.length}
                        </span>
                      </button>
                      
{/* Category Components */}
                                      {expandedCategories[category.name] && (
                                        <div className="grid grid-cols-2 gap-1.5 mt-1.5 pl-5">
                                          {category.components.map((comp) => (
                                            <DraggableComponent
                                              key={comp.name}
                                              id={`palette-${comp.name}`}
                                              componentType={comp.name}
                                              onClick={() => handleComponentClick(comp.name)}
                                              disabled={!currentProject}
                                            >
                                              <div
                                                className="component-item flex flex-col items-center gap-1.5 p-2 border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all"
                                                title={comp.description}
                                              >
                                                <comp.icon className="w-4 h-4" />
                                                <span className="text-[9px] font-medium text-center leading-tight">{comp.name}</span>
                                              </div>
                                            </DraggableComponent>
                                          ))}
                                        </div>
                                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            {/* Quick tip */}
            <div className="p-2 border-t border-border bg-secondary/50">
              <p className="text-[10px] text-muted-foreground text-center">
                Clique ou arraste para adicionar componentes
              </p>
            </div>
          </div>
        )}

        {/* Screens Tab */}
        {activeTab === "telas" && (
          <ScrollArea className="flex-1">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  TELAS DO PROJETO
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-primary/20 hover:text-primary transition-colors"
                  onClick={() => setIsCreatingScreen(true)}
                  disabled={!selectedRepo}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {isCreatingScreen && (
                <div className="mb-3 p-2 bg-secondary/30 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-1">
                  <Input
                    autoFocus
                    placeholder="Nome da tela (ex: Main)"
                    className="h-8 text-xs mb-2"
                    value={newScreenName}
                    onChange={(e) => setNewScreenName(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && newScreenName) {
                        try {
                          setSaving(true)
                          await createNewScreen(newScreenName)
                          setNewScreenName("")
                          setIsCreatingScreen(false)
                        } catch (err) {
                          console.error(err)
                        } finally {
                          setSaving(false)
                        }
                      } else if (e.key === "Escape") {
                        setIsCreatingScreen(false)
                        setNewScreenName("")
                      }
                    }}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-[10px]"
                      onClick={() => {
                        setIsCreatingScreen(false)
                        setNewScreenName("")
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-6 px-2 text-[10px]"
                      disabled={!newScreenName || saving}
                      onClick={async () => {
                        try {
                          setSaving(true)
                          await createNewScreen(newScreenName)
                          setNewScreenName("")
                          setIsCreatingScreen(false)
                        } catch (err) {
                          console.error(err)
                        } finally {
                          setSaving(false)
                        }
                      }}
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Criar"}
                    </Button>
                  </div>
                </div>
              )}

              {screenFiles.length === 0 ? (
                <div className="text-center py-8">
                  <Monitor className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">
                    Nenhuma tela carregada.
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {selectedRepo ? "Crie uma nova tela acima." : "Selecione um repositorio na aba PROJETOS."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {screenFiles.map((screen) => (
                    <div
                      key={screen.scmPath}
                      className={cn(
                        "group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all border",
                        currentScreenName === screen.name 
                          ? "bg-primary/10 border-primary/30 text-primary shadow-glow" 
                          : "hover:bg-secondary border-transparent"
                      )}
                      onClick={() => loadScreen(screen)}
                    >
                      {loadingScreen === screen.name ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Monitor className="w-3.5 h-3.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold truncate block">{screen.name}</span>
                        <div className="flex items-center gap-1.5 opacity-60">
                           <span className="text-[9px] uppercase tracking-tighter">scm</span>
                           {screen.bkyPath && <span className="text-[9px] uppercase tracking-tighter">bky</span>}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all",
                          deletingScreen === screen.name && "opacity-100"
                        )}
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (confirm(`Deseja realmente deletar a tela ${screen.name}?`)) {
                            try {
                              setDeletingScreen(screen.name)
                              await deleteScreen(screen)
                            } catch (err) {
                              console.error(err)
                            } finally {
                              setDeletingScreen(null)
                            }
                          }
                        }}
                      >
                        {deletingScreen === screen.name ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Save Button */}
              {currentProject && currentFile && (
                <div className="mt-6 pt-4 border-t border-border">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full gap-2 shadow-lg"
                    onClick={saveToGitHub}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <GitCommit className="w-4 h-4" />
                    )}
                    {saving ? "Salvando..." : "Sincronizar Projeto"}
                  </Button>
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    <div className="status-dot status-dot-success" />
                    <span className="text-[10px] text-muted-foreground font-medium">Auto-save pronto</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* GitHub Tab */}
        {activeTab === "github" && (
          <ScrollArea className="flex-1">
            <div className="p-3">
              {!ghToken ? (
                <>
                  <div className="flex flex-col items-center py-6 text-center">
                    <FolderGit2 className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium mb-1">Conecte ao GitHub</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Importe projetos Kodular/App Inventor diretamente dos seus repositorios.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={onLoginClick}
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    Conectar GitHub
                  </Button>
                </>
              ) : selectedRepo ? (
                // Repository selected - show screens summary
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        setSelectedRepo(null)
                        setRepoTree([])
                        setScreenFiles([])
                        setProjectAssets([])
                        setCurrentProject(null)
                        setCurrentScreenName(null)
                        setShowWelcome(true)
                      }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{selectedRepo!.name}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        {selectedRepo!.default_branch}
                      </div>
                    </div>
                  </div>
                  
                  {repoTreeLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                      <p className="text-xs text-muted-foreground">Carregando projeto...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-secondary rounded-lg p-3">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          RESUMO DO PROJETO
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Telas:</span>
                            <span className="font-medium">{screenFiles.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Assets:</span>
                            <span className="font-medium">{projectAssets.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Blocos:</span>
                            <span className="font-medium">{screenFiles.filter(s => s.bkyPath).length}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-muted-foreground text-center">
                        Use as abas TELAS e ASSETS para navegar pelo projeto.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Repository list
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      SEUS REPOSITORIOS
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={loadRepos}
                      disabled={ghReposLoading}
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", ghReposLoading && "animate-spin")} />
                    </Button>
                  </div>
                  
                  {ghReposLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : ghReposError ? (
                    <div className="flex flex-col items-center py-6 text-center">
                      <AlertCircle className="w-8 h-8 text-destructive mb-2" />
                      <p className="text-xs text-muted-foreground mb-3">{ghReposError}</p>
                      <Button variant="outline" size="sm" onClick={loadRepos}>
                        Tentar novamente
                      </Button>
                    </div>
                  ) : ghRepos.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      Nenhum repositorio encontrado.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {ghRepos.map((repo) => (
                        <div
                          key={repo.id}
                          onClick={() => selectProject(repo)}
                          className="p-2.5 rounded-lg border border-border hover:border-primary hover:bg-secondary cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-2 mb-1 min-w-0">
                            <FolderGit2 className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-medium truncate flex-1">{repo.name}</span>
                            {repo.private && (
                              <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                                Privado
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 ml-6">
                              {repo.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Assets Tab */}
        {activeTab === "assets" && (
          <ScrollArea className="flex-1">
            <div className="p-3">
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                ASSETS DO PROJETO
                <div className="flex items-center gap-1">
                  {saving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-primary/20 hover:text-primary transition-colors"
                    onClick={() => document.getElementById("asset-upload")?.click()}
                    disabled={!selectedRepo || saving}
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </Button>
                  <input
                    id="asset-upload"
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !selectedRepo || !ghToken) return
                      
                      try {
                        setSaving(true)
                        const [owner] = selectedRepo.full_name.split("/")
                        const reader = new FileReader()
                        
                        reader.onload = async (event) => {
                          const base64 = (event.target?.result as string).split(",")[1]
                          const assetPath = `assets/${file.name}`
                          
                          // Usar API do GitHub para criar arquivo (base64)
                          const response = await fetch(
                            `https://api.github.com/repos/${owner}/${selectedRepo.name}/contents/${assetPath}`,
                            {
                              method: "PUT",
                              headers: {
                                Authorization: `Bearer ${ghToken}`,
                                Accept: "application/vnd.github.v3+json",
                                "Content-Type": "application/json"
                              },
                              body: JSON.stringify({
                                message: `Upload asset ${file.name}`,
                                content: base64,
                                branch: selectedRepo.default_branch
                              })
                            }
                          )
                          
                          if (!response.ok) throw new Error("Erro no upload")
                          
                          // Atualizar lista local
                          const newAsset: ProjectAsset = {
                            name: file.name,
                            path: assetPath,
                            url: `https://raw.githubusercontent.com/${selectedRepo.full_name}/${selectedRepo.default_branch}/${assetPath}`,
                            type: getAssetType(file.name)
                          }
                          setProjectAssets([...projectAssets, newAsset])
                        }
                        
                        reader.readAsDataURL(file)
                      } catch (err) {
                        console.error("Erro ao fazer upload:", err)
                      } finally {
                        setSaving(false)
                        e.target.value = "" // Reset input
                      }
                    }}
                  />
                </div>
              </div>
              {projectAssets.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">
                    Nenhum asset encontrado.
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Upload arquivos para a pasta assets/ do repositorio.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {projectAssets.map((asset) => {
                    const IconComponent = getAssetIcon(asset.type)
                    return (
                      <div
                        key={asset.path}
                        className="group flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-secondary cursor-pointer transition-all border border-transparent hover:border-border"
                      >
                        {asset.type === "image" ? (
                          <div className="w-9 h-9 rounded bg-secondary border border-border overflow-hidden flex-shrink-0 shadow-sm">
                            <img 
                              src={asset.url} 
                              alt={asset.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded bg-secondary border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
                            <IconComponent className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold truncate block">{asset.name}</span>
                          <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">{asset.type}</span>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (confirm(`Deseja realmente deletar o asset ${asset.name}?`)) {
                              try {
                                setSaving(true)
                                const [owner] = selectedRepo!.full_name.split("/")
                                
                                // Pegar o SHA atual do arquivo
                                const shaResponse = await fetch(
                                  `https://api.github.com/repos/${owner}/${selectedRepo!.name}/contents/${asset.path}`,
                                  {
                                    headers: { Authorization: `Bearer ${ghToken}` }
                                  }
                                )
                                const shaData = await shaResponse.json()
                                
                                await deleteFile(ghToken!, owner, selectedRepo!.name, asset.path, shaData.sha, `Delete asset ${asset.name}`, selectedRepo!.default_branch)
                                setProjectAssets(projectAssets.filter(a => a.path !== asset.path))
                              } catch (err) {
                                console.error(err)
                              } finally {
                                setSaving(false)
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Cloud Tab */}
        {activeTab === "cloud" && (
          <ScrollArea className="flex-1">
            <div className="p-3">
              {!cloudUser ? (
                <>
                  <div className="flex flex-col items-center py-6 text-center">
                    <Cloud className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium mb-1">APEX Cloud</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Salve projetos na nuvem e acesse de qualquer lugar.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Em breve
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="bg-secondary p-3 rounded-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold">
                        {cloudUser!.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cloudUser!.name}</p>
                      <p className="text-[10px] text-muted-foreground">{cloudUser!.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={() => setCloudUser(null)}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Component Tree Tab */}
        {activeTab === "arvore" && (
          <ScrollArea className="flex-1">
            <div className="p-2">
              {!currentProject ? (
                <div className="text-center py-10">
                  <Network className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-muted-foreground">Nenhuma tela carregada.</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Selecione uma tela para ver a arvore.</p>
                </div>
              ) : (
                <div>
                  <div className="text-[10px] text-muted-foreground px-2 mb-2">
                    Clique em um componente para seleciona-lo
                  </div>
                  {renderComponentTree(currentProject!.Properties)}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Sparkles className="w-10 h-10 text-primary mb-3 animate-pulse" />
                  <p className="text-xs font-medium mb-1">APEX Droid IA</p>
                  <p className="text-[10px] text-muted-foreground px-4">
                    Pergunte sobre seu projeto, peça para adicionar componentes ou modificar propriedades.
                  </p>
                </div>
              )}
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed animate-in slide-in-from-bottom-2",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground self-end rounded-br-sm"
                      : "bg-secondary text-secondary-foreground self-start rounded-bl-sm border border-border"
                  )}
                >
                  {msg.role === "assistant" 
                    ? msg.content.replace(/```actions[\s\S]*?```/g, '').trim() 
                    : msg.content}
                </div>
              ))}
              {isChatLoading && (
                <div className="bg-secondary text-secondary-foreground self-start px-3 py-2 rounded-xl rounded-bl-sm border border-border text-[10px] flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  IA está pensando...
                </div>
              )}
            </div>
            <div className="p-2 border-t border-border flex gap-1.5 shrink-0">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Ex: Adicione um botao azul..."
                className="bg-input border-border text-xs h-8"
              />
                <Button 
                  size="sm" 
                  className="px-2 h-8 shrink-0" 
                  onClick={sendChatMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                >
                  {isChatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  )
}
