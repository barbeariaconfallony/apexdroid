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
  Smartphone, GitPullRequest, HardDrive, Network, Search, X, Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIDEStore } from "@/lib/ide-store"
import { fetchUserRepos, fetchRepoTree, fetchFileContent, updateFileContent } from "@/lib/github-service"
import { cn } from "@/lib/utils"
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
    projectAssets, setProjectAssets, setCurrentBkyContent, currentFile,
    setShowProperties, setSelectedComponent
  } = useIDEStore()
  
  
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

  const processRepoFiles = useCallback(async (repo: GitHubRepo) => {
    if (!ghToken) return
    
    setRepoTreeLoading(true)
    setSelectedRepo(repo)
    
    try {
      const [owner] = repo.full_name.split("/")
      const tree = await fetchRepoTree(ghToken, owner, repo.name, repo.default_branch)
      setRepoTree(tree)
      
      // Find all .scm files (screens) and their corresponding .bky files
      const scmFiles = tree.filter(item => item.path.endsWith(".scm"))
      const bkyFiles = tree.filter(item => item.path.endsWith(".bky"))
      
      const screens: ScreenFile[] = scmFiles.map(scm => {
        const screenName = scm.path.replace(".scm", "")
        const bky = bkyFiles.find(b => b.path.replace(".bky", "") === screenName)
        return {
          name: scm.path.split("/").pop()?.replace(".scm", "") || screenName,
          scmPath: scm.path,
          bkyPath: bky?.path || null
        }
      })
      
      setScreenFiles(screens)
      
      // Find assets (usually in assets/ folder or src/assets/)
      const assetFiles = tree.filter(item => {
        const isAssetFolder = item.path.includes("assets/") || item.path.includes("Assets/")
        const isFile = item.type === "blob"
        const ext = item.path.split(".").pop()?.toLowerCase() || ""
        const isMediaFile = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "mp3", "wav", "ogg", "mp4", "webm"].includes(ext)
        return isAssetFolder && isFile && isMediaFile
      })
      
      const assets: ProjectAsset[] = assetFiles.map(file => ({
        name: file.path.split("/").pop() || file.path,
        path: file.path,
        url: `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/${file.path}`,
        type: getAssetType(file.path)
      }))
      
      setProjectAssets(assets)
      
      // Switch to screens tab to show available screens
      setActiveTab("telas")
      setCurrentProject(null)
      setCurrentScreenName(null)
    } catch (error) {
      console.error("Erro ao processar repositorio:", error)
      setRepoTree([])
      setScreenFiles([])
      setProjectAssets([])
    } finally {
      setRepoTreeLoading(false)
    }
  }, [ghToken, setSelectedRepo, setRepoTree, setRepoTreeLoading, setScreenFiles, setProjectAssets, setActiveTab, setCurrentProject, setCurrentScreenName])

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

  const loadScreen = async (screen: ScreenFile, repo?: GitHubRepo, ownerOverride?: string) => {
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
  }

  // Save to GitHub
  const saveToGitHub = async () => {
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
  }

  // Load repos when token changes
  useEffect(() => {
    if (ghToken && ghRepos.length === 0 && !ghReposLoading) {
      loadRepos()
    }
  }, [ghToken, ghRepos.length, ghReposLoading, loadRepos])

  const handleComponentClick = (compName: string) => {
    if (currentProject) {
      addComponent(currentProject.Properties.$Name, compName)
    }
  }

  // Filter components by search
  const filteredCategories = kodularCategories.map(category => ({
    ...category,
    components: category.components.filter(comp => 
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.components.length > 0)

  const { chatMessages, addChatMessage } = useIDEStore()

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return
    const userMessage = { id: Date.now().toString(), role: "user" as const, content: chatInput }
    addChatMessage(userMessage)
    setChatInput("")
    setTimeout(() => {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: "Entendi! Vou ajudar com isso. " + (currentProject ? "Posso adicionar componentes ou modificar propriedades do projeto." : "Primeiro carregue um projeto para eu fazer modificações.")
      })
    }, 800)
  }

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
    <aside className="bg-card border-r border-border flex shrink-0" style={{ width: "300px" }}>
      {/* Icon Rail - vertical tab icons */}
      <div className="w-12 bg-gradient-to-b from-card to-background border-r border-border flex flex-col items-center py-3 gap-1.5 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-lg transition-all relative group",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg glow-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <tab.icon className={cn(
              "w-4 h-4 transition-transform",
              activeTab !== tab.id && "group-hover:scale-110"
            )} />
            {tab.id === "chat" && chatMessages.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success border-2 border-card" />
            )}
          </button>
        ))}
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Bottom indicator */}
        <div className="w-6 h-1 rounded-full bg-border" />
      </div>

      {/* Content panel */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ width: "248px" }}>
        {/* Tab title with gradient */}
        <div className="px-3 py-2.5 border-b border-border shrink-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
              <div className="flex justify-end mb-2">
                <Plus className="w-3.5 h-3.5 cursor-pointer hover:text-foreground text-muted-foreground" title="Nova tela" />
              </div>
              {screenFiles.length === 0 ? (
                <div className="text-center py-8">
                  <Monitor className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">
                    Nenhuma tela carregada.
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Selecione um repositorio na aba PROJETOS.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {screenFiles.map((screen) => (
                    <div
                      key={screen.scmPath}
                      onClick={() => loadScreen(screen)}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all",
                        currentScreenName === screen.name 
                          ? "bg-primary/20 border border-primary text-primary" 
                          : "hover:bg-secondary border border-transparent"
                      )}
                    >
                      {loadingScreen === screen.name ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Monitor className="w-4 h-4" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium truncate block">{screen.name}</span>
                        {screen.bkyPath && (
                          <span className="text-[10px] text-muted-foreground">+ blocos</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Save Button */}
              {currentProject && currentFile && (
                <div className="mt-4 pt-3 border-t border-border">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full gap-2"
                    onClick={saveToGitHub}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <GitCommit className="w-4 h-4" />
                    )}
                    {saving ? "Salvando..." : "Salvar no GitHub"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Sincroniza automaticamente com seu repositorio
                  </p>
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
                      <div className="text-xs font-semibold truncate">{selectedRepo.name}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        {selectedRepo.default_branch}
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
                          onClick={() => processRepoFiles(repo)}
                          className="p-2.5 rounded-lg border border-border hover:border-primary hover:bg-secondary cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <FolderGit2 className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-medium truncate">{repo.name}</span>
                            {repo.private && (
                              <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
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
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                ASSETS DO PROJETO
                <Upload className="w-3.5 h-3.5 cursor-pointer hover:text-foreground" />
              </div>
              {projectAssets.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">
                    Nenhum asset encontrado.
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Assets devem estar na pasta assets/ do repositorio.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {projectAssets.map((asset) => {
                    const IconComponent = getAssetIcon(asset.type)
                    return (
                      <div
                        key={asset.path}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-secondary cursor-pointer transition-all border border-transparent hover:border-border"
                      >
                        {asset.type === "image" ? (
                          <div className="w-8 h-8 rounded bg-secondary border border-border overflow-hidden flex-shrink-0">
                            <img 
                              src={asset.url} 
                              alt={asset.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium truncate block">{asset.name}</span>
                          <span className="text-[10px] text-muted-foreground capitalize">{asset.type}</span>
                        </div>
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
                        {cloudUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cloudUser.name}</p>
                      <p className="text-[10px] text-muted-foreground">{cloudUser.email}</p>
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
                  {renderComponentTree(currentProject.Properties)}
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
                  <Sparkles className="w-10 h-10 text-primary mb-3 opacity-60" />
                  <p className="text-xs font-medium mb-1">APEX Droid AI</p>
                  <p className="text-[10px] text-muted-foreground">
                    Pergunte sobre seu projeto, peça para adicionar componentes ou modificar propriedades.
                  </p>
                </div>
              )}
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground self-end rounded-br-sm"
                      : "bg-secondary text-secondary-foreground self-start rounded-bl-sm border border-border"
                  )}
                >
                  {msg.content}
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-border flex gap-1.5 shrink-0">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Ex: Adicione um botao azul..."
                className="bg-input border-border text-xs h-8"
              />
              <Button size="sm" className="px-2 h-8 shrink-0" onClick={sendChatMessage}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
