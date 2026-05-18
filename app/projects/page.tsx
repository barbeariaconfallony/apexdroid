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
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  LogOut,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { fetchUserRepos, checkIsApexProject, validateGitHubToken } from "@/lib/github-service"
import type { GitHubRepo } from "@/lib/ide-types"
import { CommunityTab } from "@/components/community-tab"

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
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-5 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-foreground">Criar Novo Projeto</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={onImportGitHub}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
              <Github className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-foreground">Importar do GitHub</h3>
              <p className="text-xs text-muted-foreground">Importe projetos APEX DROID</p>
            </div>
          </button>

          <button
            onClick={onImportAIA}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors shrink-0">
              <FileUp className="w-5 h-5 text-success" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-foreground">Importar AIA</h3>
              <p className="text-xs text-muted-foreground">Importe do Kodular (.aia)</p>
            </div>
          </button>

          <button
            onClick={onCreateBlank}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center group-hover:bg-info/20 transition-colors shrink-0">
              <FolderPlus className="w-5 h-5 text-info" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-foreground">Projeto em Branco</h3>
              <p className="text-xs text-muted-foreground">Comece do zero</p>
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
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-4 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[70vh] flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-foreground">Importar do GitHub</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onRefresh}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded-md"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredRepos.length > 0 ? (
            filteredRepos.map(repo => (
              <button
                key={repo.id}
                onClick={() => onSelect(repo)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Github className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-xs text-foreground truncate">{repo.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{repo.description || "—"}</p>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderOpen className="w-10 h-10 text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">
                {search ? "Nenhum encontrado" : "Nenhum projeto APEX DROID"}
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
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-4 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-foreground">Importar AIA</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center transition-all",
            dragActive ? "border-primary bg-primary/5" : "border-border",
            selectedFile && "border-success bg-success/5"
          )}
        >
          {selectedFile ? (
            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="text-xs h-7"
              >
                Remover
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto rounded-lg bg-muted flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Arraste o AIA</p>
                <p className="text-xs text-muted-foreground">ou clique para selecionar</p>
              </div>
              <input
                type="file"
                accept=".aia"
                onChange={handleFileSelect}
                className="hidden"
                id="aia-upload"
              />
              <label htmlFor="aia-upload">
                <Button variant="outline" size="sm" asChild className="text-xs h-7">
                  <span>Selecionar</span>
                </Button>
              </label>
            </div>
          )}
        </div>

        {importStatus && (
          <div className={cn(
            "mt-3 p-2.5 rounded-md flex items-center gap-2 text-xs",
            importStatus.success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {importStatus.success ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <p>{importStatus.message}</p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} size="sm" className="flex-1 text-xs h-8">
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!selectedFile || importing}
            size="sm"
            className="flex-1 text-xs h-8"
          >
            {importing ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
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

interface GitHubTokenModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (token: string) => void
  currentUser?: string
}

function GitHubTokenModal({ isOpen, onClose, onSave, currentUser }: GitHubTokenModalProps) {
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [validating, setValidating] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Listener para o callback OAuth do popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "github-oauth-success") {
        setOauthLoading(false)
        onSave(event.data.token)
        onClose()
      } else if (event.data?.type === "github-oauth-error") {
        setOauthLoading(false)
        setError(`Erro OAuth: ${event.data.error}`)
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onSave, onClose])

  if (!isOpen) return null

  const handleOAuthConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    if (!clientId) {
      setError("Configure NEXT_PUBLIC_GITHUB_CLIENT_ID no .env.local")
      return
    }
    const redirectUri = `${window.location.origin}/api/auth/github/callback`
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user&redirect_uri=${encodeURIComponent(redirectUri)}`
    setOauthLoading(true)
    setError(null)
    window.open(url, "github-auth", "width=600,height=700,scrollbars=yes,resizable=yes")
  }

  const handleSave = async () => {
    if (!token.trim()) {
      setError("Insira o token")
      return
    }

    setValidating(true)
    setError(null)

    const result = await validateGitHubToken(token.trim())
    
    if (result.valid) {
      onSave(token.trim())
      setToken("")
      onClose()
    } else {
      setError(result.error || "Token inválido")
    }
    
    setValidating(false)
  }

  return (
    <div 
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-4 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Github className="w-5 h-5 text-primary" />
            Conexão Rápida GitHub
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentUser && (
          <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg animate-in slide-in-from-top-1 duration-300">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Conectado como @{currentUser}</span>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <Button 
            type="button"
            disabled={oauthLoading}
            className="w-full h-14 bg-[#24292e] hover:bg-[#1a1e22] text-white flex items-center gap-4 px-5 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:scale-100"
            onClick={handleOAuthConnect}
          >
            {oauthLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <div className="text-left flex-1">
                  <p className="text-sm font-bold leading-tight">Aguardando autorização...</p>
                  <p className="text-[11px] text-white/60">Conclua no popup do GitHub</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-white/10 rounded-lg">
                  <Github className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold leading-tight">Continuar com GitHub</p>
                  <p className="text-[11px] text-white/60">Autoriza acesso aos seus repositórios</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white/40">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </>
            )}
          </Button>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-border/50"></div>
            <span className="flex-shrink mx-4 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Ou use o acesso manual</span>
            <div className="flex-grow border-t border-border/50"></div>
          </div>

          {!currentUser && (
            <p className="text-xs text-muted-foreground text-center px-4">
              Insira seu Personal Access Token do GitHub para acesso manual.
            </p>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {currentUser ? "Atualizar Token" : "Personal Access Token"}
              </label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  autoComplete="new-password"
                  onChange={(e) => { setToken(e.target.value); setError(null) }}
                  className="pr-10 h-9 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </p>
              )}
            </div>

            <a
              href="https://github.com/settings/tokens/new?description=APEX%20DROID%20IDE&scopes=repo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Criar novo Personal Access Token no GitHub
            </a>

            <div className="bg-secondary/50 rounded-lg p-2.5 space-y-1">
              <p className="text-xs font-medium text-foreground">Permissões necessárias:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• repo (acesso total aos repositórios)</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} size="sm" className="flex-1 text-xs h-8">
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={validating}
              size="sm"
              className="flex-1 text-xs h-8"
            >
              {validating ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Validando...
                </>
              ) : (
                "Conectar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
    >
      {/* Preview com celular */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-secondary to-muted p-2.5 flex items-center justify-center">
        <div className="w-full max-w-[80px] aspect-[9/16] bg-background rounded-lg border-2 border-muted-foreground/20 overflow-hidden shadow-lg">
          <div className="h-full flex flex-col">
            {/* Status bar simulada */}
            <div className="h-2.5 bg-muted flex items-center justify-center">
              <div className="w-6 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
            {/* Conteúdo simulado */}
            <div className="flex-1 bg-background p-1.5 space-y-1">
              <div className="h-1.5 bg-muted rounded-full w-3/4" />
              <div className="h-1.5 bg-muted rounded-full w-1/2" />
              <div className="h-4 bg-primary/20 rounded mt-1" />
              <div className="h-1.5 bg-muted rounded-full w-2/3 mt-1" />
            </div>
          </div>
        </div>
        
        {/* Badge APEX */}
        {project.isApexProject && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
            APEX
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 space-y-1.5">
        <h3 className="font-medium text-xs text-foreground truncate group-hover:text-primary transition-colors">
          {project.name}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span className="text-xs">{new Date(project.createdAt).toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
    </button>
  )
}

interface ProgressModalProps {
  isOpen: boolean
  current: number
  total: number
  repoName: string
}

function ProgressModal({ isOpen, current, total, repoName }: ProgressModalProps) {
  if (!isOpen) return null
  
  const percent = total > 0 ? Math.round((current / total) * 100) : 0
  
  return (
    <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-500">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <Github className="w-4 h-4 text-primary absolute animate-pulse" />
        </div>
        
        <h2 className="text-lg font-bold text-foreground mb-1">Analisando Repositórios</h2>
        <p className="text-xs text-muted-foreground mb-6 text-center h-4 overflow-hidden text-ellipsis whitespace-nowrap w-full">
          Verificando: <span className="font-medium text-foreground">{repoName || "..."}</span>
        </p>
        
        <div className="w-full bg-secondary rounded-full h-2.5 mb-2 overflow-hidden border border-border/50 relative">
          <div 
            className="bg-primary h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden flex items-center justify-center"
            style={{ width: `${percent}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
        
        <div className="w-full flex justify-between items-center text-xs text-muted-foreground font-medium">
          <span>{current} de {total}</span>
          <span className="text-primary text-sm font-bold">{percent}%</span>
        </div>
      </div>
    </div>
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
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null)

  // GitHub Token e usuário
  const [ghToken, setGhToken] = useState<string>("")
  const [ghUser, setGhUser] = useState<string | null>(null)
  const [checkingProjects, setCheckingProjects] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, repoName: "" })

  // Carregar token do localStorage no cliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("gh_token")
      const savedUser = localStorage.getItem("gh_user")
      if (savedToken) {
        setGhToken(savedToken)
        setGhUser(savedUser)
      }
    }
  }, [])

  const loadProjects = useCallback(async () => {
    if (!ghToken) {
      setProjects([])
      setLoading(false)
      return
    }

    setLoading(true)
    setCheckingProjects(true)
    
    try {
      const userRepos = await fetchUserRepos(ghToken)
      setRepos(userRepos)
      
      setProgress({ current: 0, total: userRepos.length, repoName: "Preparando..." })
      
      // Verificar cada repositório se é projeto APEX (com limite de concorrência)
      const CONCURRENCY_LIMIT = 3
      const projectList: Project[] = []
      let checkedCount = 0
      
      for (let i = 0; i < userRepos.length; i += CONCURRENCY_LIMIT) {
        const chunk = userRepos.slice(i, i + CONCURRENCY_LIMIT)
        const chunkPromises = chunk.map(async (repo): Promise<Project> => {
          setProgress(prev => ({ ...prev, repoName: repo.name }))
          const isApex = await checkIsApexProject(ghToken, repo.owner.login, repo.name)
          checkedCount++
          setProgress(prev => ({ ...prev, current: checkedCount, repoName: repo.name }))
          return {
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            createdAt: repo.created_at,
            updatedAt: repo.updated_at,
            url: repo.html_url,
            description: repo.description || undefined,
            isApexProject: isApex
          }
        })
        
        const chunkResults = await Promise.all(chunkPromises)
        projectList.push(...chunkResults)
        
        // Adicionar um pequeno atraso (500ms) entre os lotes para evitar que 
        // o firewall do GitHub bloqueie nosso IP por "Abuse Rate Limits"
        if (i + CONCURRENCY_LIMIT < userRepos.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      // Filtrar apenas projetos APEX
      const apexProjects = projectList.filter(p => p.isApexProject)
      setProjects(apexProjects)
    } catch (error) {
      console.warn("Erro ao carregar projetos:", error instanceof Error ? error.message : error)
      // Se o token for inválido, limpar
      if (error instanceof Error && error.message.includes("401")) {
        handleLogout()
      }
    } finally {
      setLoading(false)
      setCheckingProjects(false)
    }
  }, [ghToken])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleSaveToken = async (token: string) => {
    const result = await validateGitHubToken(token)
    if (result.valid && result.user) {
      setGhToken(token)
      setGhUser(result.user)
      if (typeof window !== "undefined") {
        localStorage.setItem("gh_token", token)
        localStorage.setItem("gh_user", result.user)
      }
    }
  }

  const handleLogout = () => {
    setGhToken("")
    setGhUser(null)
    setProjects([])
    setRepos([])
    if (typeof window !== "undefined") {
      localStorage.removeItem("gh_token")
      localStorage.removeItem("gh_user")
    }
  }

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
      <header className="sticky top-0 z-[100] border-b border-border bg-background/50 backdrop-blur-xl glass">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm text-foreground">APEX DROID</span>
            </div>

            {/* Tabs */}
            <nav className="hidden md:flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab("projects")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all",
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
                  "px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                  activeTab === "community"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Users className="w-3 h-3" />
                Comunidade
              </button>
              <button
                onClick={() => setActiveTab("store")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                  activeTab === "store"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <ShoppingBag className="w-3 h-3" />
                Loja
              </button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {activeTab === "projects" && ghToken && (
                <Button 
                  size="sm"
                  onClick={() => setCreateModalOpen(true)}
                  className="shadow-lg shadow-primary/25 text-xs h-8"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Criar
                </Button>
              )}
              
              {ghUser ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground hidden sm:inline">@{ghUser}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setTokenModalOpen(true)}
                    className="h-8 w-8 p-0"
                    title="Configurações do GitHub"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleLogout}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Desconectar"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button 
                  size="sm"
                  onClick={() => setTokenModalOpen(true)}
                  className="text-xs h-8 gap-1.5 animate-pulse-glow"
                >
                  <Github className="w-3.5 h-3.5" />
                  Conectar GitHub
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden border-t border-border px-2 py-1.5 flex gap-1.5 overflow-x-auto items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab("projects")}
              className={cn(
                "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all",
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
                "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1",
                activeTab === "community"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground bg-secondary"
              )}
            >
              <Users className="w-3 h-3" />
              Com
            </button>
            <button
              onClick={() => setActiveTab("store")}
              className={cn(
                "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1",
                activeTab === "store"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground bg-secondary"
              )}
            >
              <ShoppingBag className="w-3 h-3" />
              Loja
            </button>
          </div>
          {activeTab === "projects" && ghToken && (
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="shadow-lg shadow-primary/25 shrink-0 text-xs h-7"
            >
              <Plus className="w-3 h-3" />
            </Button>
          )}
          {!ghToken && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTokenModalOpen(true)}
              className="shrink-0 text-xs h-7"
            >
              <Github className="w-3 h-3" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-3 sm:px-4 py-4">
        {activeTab === "projects" && (
          <>
            {!ghToken ? (
              // Tela de conexão quando não está autenticado
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Github className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  Conecte sua conta GitHub
                </h3>
                <p className="text-xs text-muted-foreground mb-6 max-w-sm">
                  Para gerenciar seus projetos APEX DROID, conecte sua conta do GitHub usando um Personal Access Token.
                </p>
                <Button 
                  size="sm"
                  onClick={() => setTokenModalOpen(true)}
                  className="text-xs h-8"
                >
                  <Key className="w-3 h-3 mr-1.5" />
                  Conectar com GitHub
                </Button>
                <a
                  href="https://github.com/settings/tokens/new?description=APEX%20DROID%20IDE&scopes=repo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-4"
                >
                  <ExternalLink className="w-3 h-3" />
                  Criar Personal Access Token
                </a>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="mb-5 flex items-center gap-3">
                  <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9 bg-card border-border rounded-lg text-sm"
                    />
                  </div>
                  {checkingProjects && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Verificando projetos...
                    </span>
                  )}
                </div>

                {/* Projects Grid */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                    <p className="text-xs text-muted-foreground">Carregando projetos APEX DROID...</p>
                  </div>
                ) : filteredProjects.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                    {filteredProjects.map(project => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onClick={() => handleOpenProject(project)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FolderOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      {searchQuery ? "Nenhum projeto encontrado" : "Nenhum projeto APEX DROID"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                      {searchQuery 
                        ? "Tente buscar com outros termos"
                        : "Crie um novo projeto ou importe um existente do GitHub"
                      }
                    </p>
                    {!searchQuery && (
                      <Button 
                        size="sm" 
                        onClick={() => setCreateModalOpen(true)}
                        className="text-xs h-8"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Criar Projeto
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "community" && (
          <CommunityTab />
        )}

        {activeTab === "store" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center mb-3">
              <ShoppingBag className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Loja de Aplicativos</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
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

      <GitHubTokenModal
        isOpen={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        onSave={handleSaveToken}
        currentUser={ghUser || undefined}
      />

      <ProgressModal 
        isOpen={checkingProjects} 
        current={progress.current} 
        total={progress.total} 
        repoName={progress.repoName} 
      />
    </div>
  )
}
