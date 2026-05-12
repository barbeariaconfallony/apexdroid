"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { 
  Package, X, Download, Share2, QrCode, Settings2, 
  Play, CheckCircle, XCircle, Loader2, Copy, Check,
  Smartphone, Clock, FileCode, ChevronDown, ChevronRight,
  Info, AlertTriangle, Terminal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import type { BuildConfig, BuildResult, BuildHistoryItem } from "@/lib/ide-types"

interface BuildModalProps {
  isOpen: boolean
  onClose: () => void
}

type BuildPhase = "config" | "building" | "completed" | "failed"

interface BuildLog {
  timestamp: string
  message: string
  type: "log" | "info" | "error" | "success" | "warning"
}

export function BuildModal({ isOpen, onClose }: BuildModalProps) {
  const { currentProject } = useIDEStore()
  
  const [phase, setPhase] = useState<BuildPhase>("config")
  const [buildId, setBuildId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<BuildLog[]>([])
  const [result, setResult] = useState<BuildResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [buildHistory, setBuildHistory] = useState<BuildHistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<"build" | "history">("build")
  
  const { toast } = useToast()
  const logsEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [config, setConfig] = useState<BuildConfig>({
    mode: "debug",
    packageName: "com.example.app",
    versionCode: 1,
    versionName: "1.0.0",
    minSdk: 21,
    targetSdk: 33
  })

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  // Fetch build history
  useEffect(() => {
    if (isOpen && activeTab === "history") {
      fetchBuildHistory()
    }
  }, [isOpen, activeTab])

  const fetchBuildHistory = async () => {
    try {
      const response = await fetch("/api/build")
      if (response.ok) {
        const data = await response.json()
        setBuildHistory(data.builds || [])
      }
    } catch (error) {
      console.error("Failed to fetch build history:", error)
    }
  }

  // Poll build status
  const pollBuildStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/build?id=${id}`)
      if (!response.ok) throw new Error("Failed to fetch build status")
      
      const data = await response.json()
      
      setProgress(data.progress)
      setLogs(data.logs.map((log: { timestamp: string; message: string; type: string }) => ({
        ...log,
        type: log.type as BuildLog["type"]
      })))

      if (data.status === "completed") {
        setPhase("completed")
        setResult({
          id: data.id,
          status: "completed",
          progress: 100,
          apkUrl: data.apkUrl,
          apkSize: data.apkSize,
          qrCode: data.qrCode,
          startedAt: new Date(data.startedAt),
          completedAt: new Date(data.completedAt)
        })
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
      } else if (data.status === "failed") {
        setPhase("failed")
        setResult({
          id: data.id,
          status: "failed",
          progress: data.progress,
          error: data.error,
          startedAt: new Date(data.startedAt),
          completedAt: new Date(data.completedAt)
        })
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
      }
    } catch (error) {
      console.error("Polling error:", error)
    }
  }, [])

  const startBuild = async () => {
    if (!currentProject) return

    setPhase("building")
    setProgress(0)
    setLogs([])
    setResult(null)

    const addLogMessage = (msg: string, type: BuildLog["type"] = "info") => {
      setLogs(prev => [...prev, { timestamp: new Date().toISOString(), message: msg, type }])
    }

    try {
      const { ghToken, selectedRepo, screens } = useIDEStore.getState()
      
      addLogMessage("Iniciando processo de build...", "info")
      
      // Verificar conexao GitHub
      if (ghToken && selectedRepo) {
        addLogMessage(`Build real via GitHub Actions em ${selectedRepo.full_name}`, "info")
      } else {
        addLogMessage("Modo offline: Build simulado (conecte o GitHub para APKs reais)", "warning")
      }
      
      setProgress(5)

      // Iniciar Build via API (que faz o empacotamento AIA e aciona GitHub Actions)
      const response = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: currentProject,
          screens: screens,
          config,
          github: ghToken && selectedRepo ? {
            token: ghToken,
            repo: selectedRepo.full_name,
            owner: selectedRepo.owner.login,
            name: selectedRepo.name
          } : null
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Falha ao iniciar build")
      }
      
      const data = await response.json()
      setBuildId(data.buildId)
      
      addLogMessage(data.message || "Build iniciado com sucesso", "success")

      // Iniciar polling para acompanhar progresso
      pollIntervalRef.current = setInterval(() => {
        pollBuildStatus(data.buildId)
      }, 2000)

    } catch (error) {
      setPhase("failed")
      setLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        message: `Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        type: "error"
      }])
    }
  }

  const handleClose = () => {
    if (phase === "building") {
      if (!confirm("O build ainda esta em execucao. Deseja fechar?")) {
        return
      }
    }
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    
    setPhase("config")
    setProgress(0)
    setLogs([])
    setResult(null)
    setBuildId(null)
    onClose()
  }

  const copyLink = async () => {
    if (result?.apkUrl) {
      const { ghToken, selectedRepo } = useIDEStore.getState()
      let url = result.apkUrl
      if (ghToken && selectedRepo) {
        url = `/api/github/artifact?token=${ghToken}&repo=${selectedRepo.full_name}`
      }
      const finalUrl = url.startsWith("http") || url.startsWith("/") ? url : `https://apexdroid.app${url}`
      await navigator.clipboard.writeText(finalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = (url?: string, fileName?: string) => {
    if (!url) return
    
    const { ghToken, selectedRepo } = useIDEStore.getState()

    // Se for um build real via GitHub, usa nossa nova API de download direto
    if (ghToken && selectedRepo && url.includes("github.com")) {
      window.open(`/api/github/artifact?token=${ghToken}&repo=${selectedRepo.full_name}`, "_blank")
      toast({
        title: "Iniciando Download Real",
        description: "Buscando APK no GitHub. O arquivo virá compactado em .zip"
      })
      return
    }

    if (url.startsWith("http")) {
      window.open(url, "_blank")
      return
    }
    
    // Fallback para build simulado (Blob)
    const mockContent = `Mock APK Content for ${fileName || "app"}`
    const blob = new Blob([mockContent], { type: 'application/vnd.android.package-archive' })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName || "app-release.apk"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)

    toast({
      title: "Download Iniciado",
      description: "O download do seu APK começará em instantes."
    })
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (start: Date, end?: Date) => {
    const ms = (end || new Date()).getTime() - start.getTime()
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-card via-primary/5 to-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Build APK</h2>
              <p className="text-xs text-muted-foreground">
                {currentProject?.Properties?.$Name || "Sem projeto"}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("build")}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative",
              activeTab === "build" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              Build
            </span>
            {activeTab === "build" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative",
              activeTab === "history" 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Historico
            </span>
            {activeTab === "history" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {activeTab === "build" && (
            <>
              {/* Configuration Phase */}
              {phase === "config" && (
                <div className="space-y-4">
                  {/* GitHub Connection Status */}
                  <div className={cn(
                    "p-3 rounded-lg border flex items-center justify-between gap-3",
                    useIDEStore.getState().ghToken && useIDEStore.getState().selectedRepo
                      ? "bg-success/5 border-success/20"
                      : "bg-warning/5 border-warning/20"
                  )}>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        useIDEStore.getState().ghToken && useIDEStore.getState().selectedRepo ? "bg-success" : "bg-warning"
                      )} />
                      <span className="text-xs font-medium">
                        {useIDEStore.getState().ghToken && useIDEStore.getState().selectedRepo 
                          ? "Build Real (GitHub Actions)" 
                          : "Build Simulado (Modo Offline)"}
                      </span>
                    </div>
                    {!(useIDEStore.getState().ghToken && useIDEStore.getState().selectedRepo) && (
                      <span className="text-[10px] text-muted-foreground italic">
                        Conecte o GitHub para compilar APKs reais
                      </span>
                    )}
                  </div>

                  {/* Build Mode */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                      Modo de Build
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setConfig(c => ({ ...c, mode: "debug" }))}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-left",
                          config.mode === "debug"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Terminal className="w-4 h-4 text-warning" />
                          <span className="font-medium">Debug</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Para testes e desenvolvimento
                        </p>
                      </button>
                      <button
                        onClick={() => setConfig(c => ({ ...c, mode: "release" }))}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-left",
                          config.mode === "release"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-success" />
                          <span className="font-medium">Release</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Para publicacao na loja
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Version Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                        Versao
                      </label>
                      <input
                        type="text"
                        value={config.versionName}
                        onChange={(e) => setConfig(c => ({ ...c, versionName: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                        placeholder="1.0.0"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                        Codigo da Versao
                      </label>
                      <input
                        type="number"
                        value={config.versionCode}
                        onChange={(e) => setConfig(c => ({ ...c, versionCode: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                        min={1}
                      />
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div>
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <Settings2 className="w-4 h-4" />
                      Configuracoes Avancadas
                    </button>
                    
                    {showAdvanced && (
                      <div className="mt-3 p-4 bg-secondary/50 rounded-lg space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Package Name
                          </label>
                          <input
                            type="text"
                            value={config.packageName}
                            onChange={(e) => setConfig(c => ({ ...c, packageName: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:border-primary font-mono"
                            placeholder="com.example.app"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Min SDK
                            </label>
                            <input
                              type="number"
                              value={config.minSdk}
                              onChange={(e) => setConfig(c => ({ ...c, minSdk: parseInt(e.target.value) || 21 }))}
                              className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                              min={16}
                              max={33}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Target SDK
                            </label>
                            <input
                              type="number"
                              value={config.targetSdk}
                              onChange={(e) => setConfig(c => ({ ...c, targetSdk: parseInt(e.target.value) || 33 }))}
                              className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                              min={21}
                              max={34}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Start Button */}
                  <Button 
                    className="w-full h-12 text-base font-medium gap-2 shine"
                    onClick={startBuild}
                    disabled={!currentProject}
                  >
                    <Play className="w-5 h-5" />
                    INICIAR BUILD
                  </Button>
                  
                  {!currentProject && (
                    <div className="flex items-center gap-2 justify-center text-xs text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      Carregue um projeto primeiro
                    </div>
                  )}
                </div>
              )}

              {/* Building Phase */}
              {phase === "building" && (
                <div className="space-y-4">
                  {/* Progress Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      </div>
                      <div>
                        <p className="font-medium">Compilando...</p>
                        <p className="text-xs text-muted-foreground">
                          Isso pode levar alguns minutos
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-primary">{progress}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out"
                      style={{ 
                        width: `${progress}%`,
                        boxShadow: "0 0 20px var(--primary-glow)"
                      }}
                    />
                  </div>

                  {/* Logs */}
                  <div className="h-[200px] bg-background rounded-lg border border-border overflow-hidden">
                    <div className="px-3 py-2 border-b border-border bg-secondary/30 flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Build Output</span>
                    </div>
                    <div className="p-3 font-mono text-[11px] overflow-y-auto h-[calc(100%-36px)]">
                      {logs.map((log, i) => (
                        <div 
                          key={i}
                          className={cn(
                            "mb-1 leading-snug flex gap-2",
                            log.type === "error" && "text-destructive",
                            log.type === "success" && "text-success",
                            log.type === "warning" && "text-warning",
                            log.type === "info" && "text-primary",
                            log.type === "log" && "text-muted-foreground"
                          )}
                        >
                          <span className="text-muted-foreground/50 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span>{log.message}</span>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                </div>
              )}

              {/* Completed Phase */}
              {phase === "completed" && result && (
                <div className="space-y-5">
                  {/* Success Banner */}
                  <div className="flex items-center gap-4 p-4 bg-success/10 border border-success/20 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-success">Build Concluido!</p>
                      <p className="text-sm text-muted-foreground">
                        Tempo: {formatDuration(result.startedAt, result.completedAt)} | 
                        Tamanho: {result.apkSize ? formatBytes(result.apkSize) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* QR Code and Actions */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* QR Code */}
                    <div className="p-4 bg-secondary/50 rounded-lg flex flex-col items-center">
                      <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <QrCode className="w-4 h-4" />
                        Escaneie para instalar
                      </p>
                      {result.qrCode && (
                        <div className="bg-white p-2 rounded-lg">
                          <img 
                            src={result.qrCode} 
                            alt="QR Code" 
                            className="w-32 h-32"
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                      <Button 
                        className="flex-1 gap-2 h-12"
                        onClick={() => handleDownload(result.apkUrl, `${currentProject?.Properties?.$Name}_v${config.versionName}.apk`)}
                      >
                        <Download className="w-5 h-5" />
                        Download APK
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 gap-2 h-12"
                        onClick={copyLink}
                      >
                        {copied ? (
                          <>
                            <Check className="w-5 h-5 text-success" />
                            Link Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            Copiar Link
                          </>
                        )}
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2 h-12">
                        <Share2 className="w-5 h-5" />
                        Compartilhar
                      </Button>
                    </div>
                  </div>

                  {/* Install Instructions */}
                  <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-info mb-1">Como instalar</p>
                        <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                          <li>Escaneie o QR code com seu celular Android</li>
                          <li>Ou baixe o APK e transfira para o dispositivo</li>
                          <li>Habilite "Fontes desconhecidas" nas configuracoes</li>
                          <li>Toque no arquivo APK para instalar</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Build Again */}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setPhase("config")}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Novo Build
                  </Button>
                </div>
              )}

              {/* Failed Phase */}
              {phase === "failed" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-destructive">Build Falhou</p>
                      <p className="text-sm text-muted-foreground">
                        {result?.error || "Ocorreu um erro durante a compilacao"}
                      </p>
                    </div>
                  </div>

                  {/* Error Logs */}
                  <div className="h-[150px] bg-background rounded-lg border border-destructive/20 p-3 font-mono text-[11px] overflow-y-auto">
                    {logs.map((log, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "mb-1 leading-snug",
                          log.type === "error" && "text-destructive",
                          log.type === "success" && "text-success",
                          log.type === "info" && "text-primary"
                        )}
                      >
                        [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => setPhase("config")}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {buildHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum build anterior</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Seus builds anteriores aparecerao aqui
                  </p>
                </div>
              ) : (
                buildHistory.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 bg-secondary/30 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {item.status === "completed" ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                        <span className="font-medium">{item.projectName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        v{item.config.versionName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.buildTime}s
                      </span>
                      {item.apkSize && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {formatBytes(item.apkSize)}
                        </span>
                      )}
                    </div>
                    {item.status === "completed" && item.apkUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 h-8"
                        onClick={() => handleDownload(item.apkUrl, `${item.projectName}_v${item.config.versionName}.apk`)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
