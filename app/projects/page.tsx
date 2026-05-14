"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Github, 
  FileUp, 
  FolderPlus, 
  Search, 
  Users, 
  ShoppingBag,
  Smartphone,
  Calendar,
  ExternalLink,
  Loader2,
  X,
  Upload,
  AlertCircle,
  CheckCircle,
  FolderOpen,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { fetchUserRepos } from "@/lib/github-service"
import type { GitHubRepo } from "@/lib/ide-types"

// Função para extrair AIA (arquivo ZIP do Kodular)
async function extractAIA(file: File): Promise<{ isValid: boolean; files: Map<string, string>; error?: string }> {
  const JSZip = (await import("jszip")).default
  const zip = new JSZip()
  
  try {
    const content = await zip.loadAsync(file)
    const files = new Map<string, string>()
    
    // Verificar se é um AIA do Kodular (deve ter youngandroidproject/project.properties)
    const projectPropsPath = Object.keys(content.files).find(
      path => path.includes("youngandroidproject/project.properties")
    )
    
    if (!projectPropsPath) {
      return { 
        isValid: false, 
        files, 
        error: "Este arquivo não parece ser um projeto AIA do Kodular válido." 
      }
    }
    
    // Extrair todos os arquivos relevantes
    const entries = Object.entries(content.files)
    for (const [path, zipEntry] of entries) {
      if (!zipEntry.dir) {
        // Ignorar o arquivo AIA em si, extrair apenas o conteúdo interno
        const relativePath = path.replace(/^[^/]+\//, "") // Remove pasta raiz
        if (relativePath && !relativePath.startsWith("__MACOSX")) {
          const fileContent = await zipEntry.async("string")
          files.set(relativePath, fileContent)
        }
      }
    }
    
    return { isValid: true, files }
  } catch {
    return { 
      isValid: false, 
      files: new Map(), 
      error: "Erro ao ler o arquivo AIA. Certifique-se de que o arquivo não está corrompido." 
    }
  }
}

interface Project {
  id: number
  name: string
  fullName: string
  createdAt: string
  updatedAt: string
  url: string
  description?: string
  isApexProject: boolean
}

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateBlank: () => void
  onImportGitHub: () => void
  onImportAIA: () => void
}

function CreateProjectModal({ isOpen, onClose, onCreateBlank, onImportGitHub, onImportAIA }: CreateProjectModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground">Criar Novo Projeto</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={onImportGitHub}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Github className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Importar do GitHub</h3>
              <p className="text-sm text-muted-foreground">Importe projetos APEX DROID existentes</p>
            </div>
          </button>

          <button
            onClick={onImportAIA}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
              <FileUp className="w-6 h-6 text-success" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Importar AIA</h3>
              <p className="text-sm text-muted-foreground">Importe projetos do Kodular (.aia)</p>
            </div>
          </button>

          <button
            onClick={onCreateBlank}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center group-hover:bg-info/20 transition-colors">
              <FolderPlus className="w-6 h-6 text-info" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Projeto em Branco</h3>
              <p className="text-sm text-muted-foreground">Comece do zero com um projeto vazio</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

interface ImportGitHubModalProps {
  isOpen: boolean
  onClose: () => void
  repos: GitHubRepo[]
  loading: boolean
  onSelect: (repo: GitHubRepo) => void
  onRefresh: () => void
}

function ImportGitHubModal({ isOpen, onClose, repos, loading, onSelect, onRefresh }: ImportGitHubModalProps) {
  const [search, setSearch] = useState("")
  
  // Filtrar apenas projetos APEX DROID (que tenham o arquivo de identificação)
  const apexRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes("apex") || 
    repo.description?.toLowerCase().includes("apex droid") ||
    repo.topics?.includes("apex-droid")
  )
  
  const filteredRepos = apexRepos.filter(repo =>
    repo.name.toLowerCase().includes(search.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Importar do GitHub</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-secondary rounded-lg"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar repositórios APEX DROID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredRepos.length > 0 ? (
            filteredRepos.map(repo => (
              <button
                key={repo.id}
                onClick={() => onSelect(repo)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Github className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{repo.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{repo.description || "Sem descrição"}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? "Nenhum repositório encontrado" : "Nenhum projeto APEX DROID encontrado"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie um novo projeto ou importe um AIA
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ImportAIAModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (file: File) => void
  importing: boolean
  importStatus: { success: boolean; message: string } | null
}

function ImportAIAModal({ isOpen, onClose, onImport, importing, importStatus }: ImportAIAModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith(".aia")) {
        setSelectedFile(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleImport = () => {
    if (selectedFile) {
      onImport(selectedFile)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground">Importar Arquivo AIA</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all",
            dragActive ? "border-primary bg-primary/5" : "border-border",
            selectedFile && "border-success bg-success/5"
          )}
        >
          {selectedFile ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                Remover
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-xl bg-muted flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Arraste o arquivo AIA aqui</p>
                <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
              </div>
              <input
                type="file"
                accept=".aia"
                onChange={handleFileSelect}
                className="hidden"
                id="aia-upload"
              />
              <label htmlFor="aia-upload">
                <Button variant="outline" size="sm" asChild>
                  <span>Selecionar Arquivo</span>
                </Button>
              </label>
            </div>
          )}
        </div>

        {importStatus && (
          <div className={cn(
            "mt-4 p-4 rounded-lg flex items-center gap-3",
            importStatus.success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {importStatus.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="text-sm">{importStatus.message}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!selectedFile || importing}
            className="flex-1"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              "Importar"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
    >
      {/* Preview com celular */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-secondary to-muted p-4 flex items-center justify-center">
        <div className="w-full max-w-[120px] aspect-[9/16] bg-background rounded-2xl border-4 border-muted-foreground/20 overflow-hidden shadow-xl">
          <div className="h-full flex flex-col">
            {/* Status bar simulada */}
            <div className="h-4 bg-muted flex items-center justify-center">
              <div className="w-8 h-1.5 bg-muted-foreground/30 rounded-full" />
            </div>
            {/* Conteúdo simulado */}
            <div className="flex-1 bg-background p-2 space-y-1.5">
              <div className="h-2 bg-muted rounded-full w-3/4" />
              <div className="h-2 bg-muted rounded-full w-1/2" />
              <div className="h-6 bg-primary/20 rounded mt-2" />
              <div className="h-2 bg-muted rounded-full w-2/3 mt-2" />
              <div className="h-2 bg-muted rounded-full w-1/2" />
            </div>
          </div>
        </div>
        
        {/* Badge APEX */}
        {project.isApexProject && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
            APEX
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {project.name}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(project.createdAt).toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
    </button>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"projects" | "community" | "store">("projects")
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [githubModalOpen, setGithubModalOpen] = useState(false)
  const [aiaModalOpen, setAiaModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null)

  // Mock token para demonstração (em produção, viria da autenticação)
  const ghToken = typeof window !== "undefined" ? localStorage.getItem("gh_token") || "" : ""

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      if (ghToken) {
        const userRepos = await fetchUserRepos(ghToken)
        setRepos(userRepos)
        
        // Converter para formato de projeto
        const projectList: Project[] = userRepos.map(repo => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          url: repo.html_url,
          description: repo.description || undefined,
          isApexProject: repo.name.toLowerCase().includes("apex") || 
                         repo.description?.toLowerCase().includes("apex droid") ||
                         repo.topics?.includes("apex-droid") || false
        }))
        
        setProjects(projectList)
      } else {
        // Projetos de demonstração quando não há token
        setProjects([
          {
            id: 1,
            name: "MeuApp",
            fullName: "user/MeuApp",
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-20T15:30:00Z",
            url: "https://github.com/user/MeuApp",
            description: "Meu primeiro aplicativo APEX DROID",
            isApexProject: true
          },
          {
            id: 2,
            name: "CalculadoraSimples",
            fullName: "user/CalculadoraSimples",
            createdAt: "2024-02-01T08:00:00Z",
            updatedAt: "2024-02-05T12:00:00Z",
            url: "https://github.com/user/CalculadoraSimples",
            description: "Calculadora básica",
            isApexProject: true
          },
          {
            id: 3,
            name: "ListaDeTarefas",
            fullName: "user/ListaDeTarefas",
            createdAt: "2024-03-10T14:00:00Z",
            updatedAt: "2024-03-15T09:00:00Z",
            url: "https://github.com/user/ListaDeTarefas",
            description: "App de lista de tarefas",
            isApexProject: true
          }
        ])
      }
    } catch (error) {
      console.error("Erro ao carregar projetos:", error)
    } finally {
      setLoading(false)
    }
  }, [ghToken])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenProject = (project: Project) => {
    // Armazenar informações do projeto selecionado
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_repo", JSON.stringify({
        owner: project.fullName.split("/")[0],
        name: project.name,
        url: project.url
      }))
    }
    router.push("/ide")
  }

  const handleCreateBlank = () => {
    setCreateModalOpen(false)
    router.push("/ide")
  }

  const handleImportGitHub = (repo: GitHubRepo) => {
    setGithubModalOpen(false)
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_repo", JSON.stringify({
        owner: repo.owner.login,
        name: repo.name,
        url: repo.html_url
      }))
    }
    router.push("/ide")
  }

  const handleImportAIA = async (file: File) => {
    setImporting(true)
    setImportStatus(null)
    
    try {
      const result = await extractAIA(file)
      
      if (!result.isValid) {
        setImportStatus({ success: false, message: result.error || "Arquivo inválido" })
        return
      }
      
      setImportStatus({ success: true, message: "Projeto importado com sucesso!" })
      
      // Aguardar um momento para mostrar o sucesso
      setTimeout(() => {
        setAiaModalOpen(false)
        setImportStatus(null)
        router.push("/ide")
      }, 1500)
    } catch {
      setImportStatus({ success: false, message: "Erro ao importar o arquivo" })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen relative bg-dot-premium">
      {/* Spotlight effect */}
      <div className="spotlight" />
      
      {/* Grid lines overlay */}
      <div className="grid-lines" />
      
      {/* Secondary glow accents */}
      <div className="glow-secondary -top-40 -right-40 opacity-60" />
      <div className="glow-secondary bottom-1/4 -left-60 opacity-40" />

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-background/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">APEX DROID</span>
            </div>

            {/* Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-secondary/50 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("projects")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === "projects"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                Meus Projetos
              </button>
              <button
                onClick={() => setActiveTab("community")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  activeTab === "community"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Users className="w-4 h-4" />
                Comunidade
              </button>
              <button
                onClick={() => setActiveTab("store")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  activeTab === "store"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                Loja de Aplicativos
              </button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {activeTab === "projects" && (
                <Button 
                  onClick={() => setCreateModalOpen(true)}
                  className="shadow-lg shadow-primary/25"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Projeto
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden border-t border-border px-4 py-2 flex gap-2 overflow-x-auto items-center justify-between">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("projects")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                activeTab === "projects"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground bg-secondary"
              )}
            >
              Projetos
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
                activeTab === "community"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground bg-secondary"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Comunidade
            </button>
            <button
              onClick={() => setActiveTab("store")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
                activeTab === "store"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground bg-secondary"
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Loja
            </button>
          </div>
          {activeTab === "projects" && (
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="shadow-lg shadow-primary/25 shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "projects" && (
          <>
            {/* Search */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar projetos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-card border-border rounded-xl"
                />
              </div>
            </div>

            {/* Projects Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {filteredProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => handleOpenProject(project)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
                  <FolderOpen className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {searchQuery ? "Nenhum projeto encontrado" : "Nenhum projeto ainda"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchQuery 
                    ? "Tente buscar com outros termos"
                    : "Comece criando seu primeiro projeto APEX DROID"
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Projeto
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "community" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Comunidade</h3>
            <p className="text-muted-foreground max-w-md">
              Em breve! Compartilhe seus projetos e descubra o que outros desenvolvedores estão criando.
            </p>
          </div>
        )}

        {activeTab === "store" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Loja de Aplicativos</h3>
            <p className="text-muted-foreground max-w-md">
              Em breve! Encontre templates, componentes e extensões para seus projetos.
            </p>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateBlank={handleCreateBlank}
        onImportGitHub={() => {
          setCreateModalOpen(false)
          setGithubModalOpen(true)
        }}
        onImportAIA={() => {
          setCreateModalOpen(false)
          setAiaModalOpen(true)
        }}
      />

      <ImportGitHubModal
        isOpen={githubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        repos={repos}
        loading={loading}
        onSelect={handleImportGitHub}
        onRefresh={loadProjects}
      />

      <ImportAIAModal
        isOpen={aiaModalOpen}
        onClose={() => {
          setAiaModalOpen(false)
          setImportStatus(null)
        }}
        onImport={handleImportAIA}
        importing={importing}
        importStatus={importStatus}
      />
    </div>
  )
}
