"use client"

import { useIDEStore } from "@/lib/ide-store"
import { toast } from "sonner"

// Tipos de eventos para sincronização
export type SyncEventType = 
  | "component:add"
  | "component:update"
  | "component:remove"
  | "component:move"
  | "screen:add"
  | "screen:remove"
  | "screen:rename"
  | "screen:switch"
  | "blocks:update"
  | "property:change"
  | "cursor:move"
  | "user:join"
  | "user:leave"
  | "full:sync"

export interface SyncEvent {
  type: SyncEventType
  timestamp: number
  userId: string
  userName: string
  payload: Record<string, any>
  screenName?: string
  componentName?: string
}

export interface SyncConfig {
  debounceMs: number
  maxRetries: number
  retryDelayMs: number
  enableRealtime: boolean
  railwayUrl?: string
}

const DEFAULT_CONFIG: SyncConfig = {
  debounceMs: 3000,
  maxRetries: 3,
  retryDelayMs: 1000,
  enableRealtime: false,
  railwayUrl: undefined
}

class SyncService {
  private config: SyncConfig = DEFAULT_CONFIG
  private syncTimeout: NodeJS.Timeout | null = null
  private lastSyncedHash: string | null = null
  private pendingEvents: SyncEvent[] = []
  private retryCount = 0
  private unsubscribe: (() => void) | null = null
  private socket: WebSocket | null = null
  private isConnected = false

  // Inicializar serviço de sincronização
  initialize(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.setupStoreSubscription()
    
    if (this.config.enableRealtime && this.config.railwayUrl) {
      this.connectToRailway()
    }
    
    console.log("[SyncService] Inicializado com config:", this.config)
  }

  // Configurar subscription na store do Zustand
  private setupStoreSubscription() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }

    this.unsubscribe = useIDEStore.subscribe((state, prevState) => {
      // Ignorar se não conectado ao GitHub
      if (!state.ghToken || !state.selectedRepo) return

      // Detectar tipo de mudança
      const events = this.detectChanges(state, prevState)
      
      if (events.length > 0) {
        this.pendingEvents.push(...events)
        this.queueSync(state)
        
        // Emitir eventos em tempo real se conectado ao Railway
        if (this.isConnected && this.config.enableRealtime) {
          events.forEach(event => this.emitRealtimeEvent(event))
        }
      }
    })
  }

  // Detectar mudanças e gerar eventos
  private detectChanges(state: any, prevState: any): SyncEvent[] {
    const events: SyncEvent[] = []
    const userId = state.cloudUser?.id || "local"
    const userName = state.cloudUser?.name || "Você"
    const timestamp = Date.now()

    // Mudança de tela atual
    if (state.currentScreenName !== prevState.currentScreenName && state.currentScreenName) {
      events.push({
        type: "screen:switch",
        timestamp,
        userId,
        userName,
        payload: { 
          screenName: state.currentScreenName,
          previousScreen: prevState.currentScreenName 
        },
        screenName: state.currentScreenName
      })
    }

    // Mudanças no projeto atual (componentes)
    if (state.currentProject !== prevState.currentProject && state.currentProject) {
      const currentJson = JSON.stringify(state.currentProject)
      const prevJson = prevState.currentProject ? JSON.stringify(prevState.currentProject) : ""
      
      if (currentJson !== prevJson) {
        events.push({
          type: "component:update",
          timestamp,
          userId,
          userName,
          payload: { 
            project: state.currentProject,
            diff: this.generateDiff(prevState.currentProject, state.currentProject)
          },
          screenName: state.currentScreenName
        })
      }
    }

    // Mudanças nas telas
    const prevScreenNames = Object.keys(prevState.screens || {})
    const currentScreenNames = Object.keys(state.screens || {})

    // Telas adicionadas
    currentScreenNames
      .filter(name => !prevScreenNames.includes(name))
      .forEach(name => {
        events.push({
          type: "screen:add",
          timestamp,
          userId,
          userName,
          payload: { screenName: name, screen: state.screens[name] },
          screenName: name
        })
      })

    // Telas removidas
    prevScreenNames
      .filter(name => !currentScreenNames.includes(name))
      .forEach(name => {
        events.push({
          type: "screen:remove",
          timestamp,
          userId,
          userName,
          payload: { screenName: name },
          screenName: name
        })
      })

    // Mudanças no conteúdo de blocos
    if (state.currentBkyContent !== prevState.currentBkyContent && state.currentBkyContent) {
      events.push({
        type: "blocks:update",
        timestamp,
        userId,
        userName,
        payload: { 
          bkyContent: state.currentBkyContent,
          screenName: state.currentScreenName
        },
        screenName: state.currentScreenName || undefined
      })
    }

    return events
  }

  // Gerar diff simplificado para debugging
  private generateDiff(prev: any, current: any): Record<string, any> {
    if (!prev || !current) return { type: "full_replace" }
    
    // Simplificado - em produção usaria algo como jsondiffpatch
    return {
      type: "update",
      timestamp: Date.now()
    }
  }

  // Agendar sincronização com debounce
  private queueSync(state: any) {
    state.setSyncStatus("syncing")

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout)
    }

    this.syncTimeout = setTimeout(() => {
      this.performSync(state)
    }, this.config.debounceMs)
  }

  // Executar sincronização com GitHub
  private async performSync(state: any) {
    try {
      const files = this.prepareFiles(state)
      
      if (files.length === 0) {
        state.setSyncStatus("synced")
        return
      }

      // Gerar hash para evitar syncs duplicados
      const stateHash = JSON.stringify({ 
        screens: state.screens, 
        currentProject: state.currentProject 
      })
      
      if (this.lastSyncedHash === stateHash) {
        state.setSyncStatus("synced")
        return
      }

      const response = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: state.ghToken,
          repo: state.selectedRepo.full_name,
          message: this.generateCommitMessage(),
          files
        })
      })

      if (response.ok) {
        this.lastSyncedHash = stateHash
        this.pendingEvents = []
        this.retryCount = 0
        state.setSyncStatus("synced")
        toast.success("Sincronizado com GitHub", { duration: 2000 })
      } else {
        throw new Error("Falha na resposta da API")
      }
    } catch (error) {
      console.error("[SyncService] Erro ao sincronizar:", error)
      
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++
        setTimeout(() => this.queueSync(state), this.config.retryDelayMs)
      } else {
        state.setSyncStatus("error")
        toast.error("Erro ao sincronizar. Tente novamente.")
        this.retryCount = 0
      }
    }
  }

  // Preparar arquivos para commit
  private prepareFiles(state: any): { path: string; content: string }[] {
    const files: { path: string; content: string }[] = []

    // Arquivos SCM e BKY de cada tela
    for (const [screenName, screen] of Object.entries(state.screens) as [string, any][]) {
      if (screen.data) {
        files.push({
          path: `src/${screenName}.scm`,
          content: JSON.stringify(screen.data, null, 2)
        })
      }
      if (screen.bkyContent) {
        files.push({
          path: `src/${screenName}.bky`,
          content: screen.bkyContent
        })
      }
    }

    // Metadados do projeto
    const projectMeta = {
      name: state.selectedRepo?.name || "Untitled",
      screens: Object.keys(state.screens),
      currentScreen: state.currentScreenName,
      lastModified: new Date().toISOString(),
      version: "1.0.0",
      syncVersion: 2 // Versão do formato de sync
    }
    
    files.push({
      path: "project.json",
      content: JSON.stringify(projectMeta, null, 2)
    })

    return files
  }

  // Gerar mensagem de commit baseada nos eventos pendentes
  private generateCommitMessage(): string {
    if (this.pendingEvents.length === 0) {
      return "[Auto-sync] Project updated"
    }

    const eventTypes = [...new Set(this.pendingEvents.map(e => e.type))]
    const summary = eventTypes.map(type => {
      const count = this.pendingEvents.filter(e => e.type === type).length
      return `${type.replace(":", " ")}${count > 1 ? ` (${count}x)` : ""}`
    }).join(", ")

    return `[Auto-sync] ${summary}`
  }

  // Conectar ao servidor Railway (WebSocket)
  private connectToRailway() {
    if (!this.config.railwayUrl) return

    try {
      this.socket = new WebSocket(this.config.railwayUrl)
      
      this.socket.onopen = () => {
        this.isConnected = true
        console.log("[SyncService] Conectado ao Railway")
        this.joinRoom()
      }

      this.socket.onclose = () => {
        this.isConnected = false
        console.log("[SyncService] Desconectado do Railway")
        // Reconectar após 5 segundos
        setTimeout(() => this.connectToRailway(), 5000)
      }

      this.socket.onmessage = (event) => {
        this.handleRealtimeMessage(JSON.parse(event.data))
      }

      this.socket.onerror = (error) => {
        console.error("[SyncService] Erro WebSocket:", error)
      }
    } catch (error) {
      console.error("[SyncService] Falha ao conectar:", error)
    }
  }

  // Entrar na sala do repositório
  private joinRoom() {
    const state = useIDEStore.getState()
    if (!state.selectedRepo || !this.socket) return

    this.socket.send(JSON.stringify({
      type: "join",
      room: state.selectedRepo.full_name,
      user: {
        id: state.cloudUser?.id || "local",
        name: state.cloudUser?.name || "Anônimo",
        avatar: state.cloudUser?.name?.[0] || "A"
      }
    }))
  }

  // Emitir evento em tempo real
  private emitRealtimeEvent(event: SyncEvent) {
    if (!this.socket || !this.isConnected) return

    const state = useIDEStore.getState()
    
    this.socket.send(JSON.stringify({
      type: "broadcast",
      room: state.selectedRepo?.full_name,
      event
    }))
  }

  // Processar mensagens do servidor Railway
  private handleRealtimeMessage(message: any) {
    const { type, payload, userId } = message
    const state = useIDEStore.getState()

    // Ignorar eventos do próprio usuário
    if (userId === (state.cloudUser?.id || "local")) return

    switch (type) {
      case "user:join":
        this.handleUserJoin(payload)
        break
      case "user:leave":
        this.handleUserLeave(payload)
        break
      case "cursor:move":
        this.handleCursorMove(payload)
        break
      case "screen:switch":
        this.handleRemoteScreenSwitch(payload)
        break
      case "component:update":
        this.handleRemoteComponentUpdate(payload)
        break
      case "blocks:update":
        this.handleRemoteBlocksUpdate(payload)
        break
    }
  }

  private handleUserJoin(payload: any) {
    const { connectedUsers, setConnectedUsers } = useIDEStore.getState()
    const exists = connectedUsers.find(u => u.id === payload.user.id)
    
    if (!exists) {
      setConnectedUsers([...connectedUsers, {
        id: payload.user.id,
        name: payload.user.name,
        avatar: payload.user.avatar,
        color: this.generateUserColor(payload.user.id),
        lastActive: Date.now()
      }])
      toast.info(`${payload.user.name} entrou na sessão`)
    }
  }

  private handleUserLeave(payload: any) {
    const { connectedUsers, setConnectedUsers } = useIDEStore.getState()
    setConnectedUsers(connectedUsers.filter(u => u.id !== payload.userId))
    toast.info(`${payload.userName || "Usuário"} saiu da sessão`)
  }

  private handleCursorMove(payload: any) {
    // Atualizar posição do cursor do usuário remoto
    // Isso será implementado com ghost cursors no componente de preview
    const event = new CustomEvent("remote-cursor", { detail: payload })
    window.dispatchEvent(event)
  }

  private handleRemoteScreenSwitch(payload: any) {
    // Navegação sincronizada - quando admin muda de tela
    if (payload.isAdmin) {
      const { switchScreen } = useIDEStore.getState()
      switchScreen(payload.screenName)
      toast.info(`${payload.userName} navegou para ${payload.screenName}`)
    }
  }

  private handleRemoteComponentUpdate(payload: any) {
    // Aplicar atualização remota de componentes
    // Em produção, usaria CRDT (Yjs) para merge automático
    console.log("[SyncService] Componente atualizado remotamente:", payload)
  }

  private handleRemoteBlocksUpdate(payload: any) {
    // Aplicar atualização remota de blocos
    console.log("[SyncService] Blocos atualizados remotamente:", payload)
  }

  private generateUserColor(userId: string): string {
    const colors = [
      "bg-pink-500", "bg-amber-500", "bg-emerald-500", 
      "bg-cyan-500", "bg-violet-500", "bg-rose-500"
    ]
    const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  // Forçar sincronização manual
  forceSync() {
    const state = useIDEStore.getState()
    if (state.ghToken && state.selectedRepo) {
      this.lastSyncedHash = null
      this.queueSync(state)
    }
  }

  // Desconectar e limpar
  disconnect() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout)
      this.syncTimeout = null
    }
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.isConnected = false
    this.pendingEvents = []
  }
}

// Singleton export
export const syncService = new SyncService()

// Hook para uso em componentes
export function useSyncService() {
  return syncService
}
