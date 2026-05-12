"use client"

import { useCallback, useRef, useEffect } from "react"
import { useIDEStore } from "@/lib/ide-store"
import { toast } from "sonner"

interface SyncOptions {
  debounceMs?: number
  showToasts?: boolean
}

export function useGitHubSync(options: SyncOptions = {}) {
  const { debounceMs = 3000, showToasts = true } = options
  
  const syncTimeout = useRef<NodeJS.Timeout | null>(null)
  const lastSyncedState = useRef<string | null>(null)
  
  const {
    ghToken,
    selectedRepo,
    screens,
    currentProject,
    currentScreenName,
    setSyncStatus
  } = useIDEStore()

  // Gerar hash do estado atual para detectar mudancas reais
  const generateStateHash = useCallback(() => {
    const state = {
      screens: Object.fromEntries(
        Object.entries(screens).map(([name, screen]) => [
          name,
          { data: screen.data, bkyContent: screen.bkyContent }
        ])
      ),
      currentProject
    }
    return JSON.stringify(state)
  }, [screens, currentProject])

  // Funcao principal de sincronizacao
  const syncToGitHub = useCallback(async (force: boolean = false) => {
    if (!ghToken || !selectedRepo) {
      return { success: false, reason: "not_connected" }
    }

    const currentState = generateStateHash()
    
    // Evitar sync desnecessario se estado nao mudou
    if (!force && lastSyncedState.current === currentState) {
      return { success: true, reason: "no_changes" }
    }

    setSyncStatus("syncing")

    try {
      const files: { path: string; content: string }[] = []

      // Preparar todos os arquivos SCM e BKY das telas
      for (const [screenName, screen] of Object.entries(screens)) {
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

      // Incluir project.json com metadados
      const projectMeta = {
        name: selectedRepo.name,
        screens: Object.keys(screens),
        currentScreen: currentScreenName,
        lastModified: new Date().toISOString(),
        version: "1.0.0"
      }
      files.push({
        path: "project.json",
        content: JSON.stringify(projectMeta, null, 2)
      })

      if (files.length === 0) {
        setSyncStatus("synced")
        return { success: true, reason: "empty" }
      }

      const response = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: ghToken,
          repo: selectedRepo.full_name,
          message: `[Auto-sync] Project updated`,
          files
        })
      })

      if (response.ok) {
        lastSyncedState.current = currentState
        setSyncStatus("synced")
        if (showToasts) {
          toast.success("Sincronizado com GitHub", { duration: 2000 })
        }
        return { success: true }
      } else {
        const err = await response.json()
        throw new Error(err.error || "Falha ao sincronizar")
      }
    } catch (error: any) {
      console.error("Erro ao sincronizar com GitHub:", error)
      setSyncStatus("error")
      if (showToasts) {
        toast.error("Erro ao sincronizar com GitHub")
      }
      return { success: false, error: error.message }
    }
  }, [ghToken, selectedRepo, screens, currentScreenName, setSyncStatus, generateStateHash, showToasts])

  // Funcao debounced para auto-sync
  const queueSync = useCallback(() => {
    if (!ghToken || !selectedRepo) return

    setSyncStatus("syncing")
    
    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current)
    }

    syncTimeout.current = setTimeout(() => {
      syncToGitHub()
    }, debounceMs)
  }, [ghToken, selectedRepo, debounceMs, syncToGitHub, setSyncStatus])

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current)
      }
    }
  }, [])

  // Verificar se esta conectado ao GitHub
  const isConnected = Boolean(ghToken && selectedRepo)

  return {
    syncToGitHub,
    queueSync,
    isConnected
  }
}

// Store subscription para auto-sync global
let globalSyncTimeout: NodeJS.Timeout | null = null
let lastGlobalState: string | null = null

export function setupGlobalAutoSync() {
  if (typeof window === "undefined") return

  const unsubscribe = useIDEStore.subscribe((state, prevState) => {
    // Ignorar se nao conectado ao GitHub
    if (!state.ghToken || !state.selectedRepo) return

    // Detectar mudancas relevantes
    const hasChanges = 
      state.currentProject !== prevState.currentProject ||
      state.screens !== prevState.screens ||
      state.currentBkyContent !== prevState.currentBkyContent

    if (!hasChanges) return

    // Gerar hash do estado atual
    const currentStateHash = JSON.stringify({
      screens: state.screens,
      currentProject: state.currentProject
    })

    // Evitar sync se estado e identico
    if (lastGlobalState === currentStateHash) return

    state.setSyncStatus("syncing")

    // Debounce de 3 segundos
    if (globalSyncTimeout) {
      clearTimeout(globalSyncTimeout)
    }

    globalSyncTimeout = setTimeout(async () => {
      try {
        const files: { path: string; content: string }[] = []

        // Preparar arquivos
        for (const [screenName, screen] of Object.entries(state.screens)) {
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

        // Project metadata
        const projectMeta = {
          name: state.selectedRepo!.name,
          screens: Object.keys(state.screens),
          currentScreen: state.currentScreenName,
          lastModified: new Date().toISOString(),
          version: "1.0.0"
        }
        files.push({
          path: "project.json",
          content: JSON.stringify(projectMeta, null, 2)
        })

        if (files.length === 0) {
          state.setSyncStatus("synced")
          return
        }

        const response = await fetch("/api/github/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: state.ghToken,
            repo: state.selectedRepo!.full_name,
            message: `[Auto-sync] Project updated`,
            files
          })
        })

        if (response.ok) {
          lastGlobalState = currentStateHash
          state.setSyncStatus("synced")
          toast.success("Sincronizado com GitHub", { duration: 2000 })
        } else {
          throw new Error("Falha ao sincronizar")
        }
      } catch (error) {
        console.error("Auto-sync error:", error)
        state.setSyncStatus("error")
      }
    }, 3000)
  })

  return unsubscribe
}
