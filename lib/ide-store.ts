"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { toast } from "sonner"
import type {
  KodularComponent,
  ProjectData,
  GitHubFile,
  ChatMessage,
  Block,
  AISettings,
  CloudUser,
  BuildLog,
  BuildHistoryItem,
  BuildResult,
  GitHubRepo,
  GitHubTreeItem,
  ProjectAsset,
  ScreenFile,
  Screen,
  DragState,
  HistorySnapshot
} from "./ide-types"

interface IDEState {
  // GitHub
  ghToken: string | null
  setGhToken: (token: string | null) => void
  ghRepos: GitHubRepo[]
  setGhRepos: (repos: GitHubRepo[]) => void
  ghReposLoading: boolean
  setGhReposLoading: (loading: boolean) => void
  ghReposError: string | null
  setGhReposError: (error: string | null) => void
  selectedRepo: GitHubRepo | null
  setSelectedRepo: (repo: GitHubRepo | null) => void
  repoTree: GitHubTreeItem[]
  setRepoTree: (tree: GitHubTreeItem[]) => void
  repoTreeLoading: boolean
  setRepoTreeLoading: (loading: boolean) => void

  // Project
  currentProject: ProjectData | null
  setCurrentProject: (project: ProjectData | null) => void
  currentFile: GitHubFile | null
  setCurrentFile: (file: GitHubFile | null) => void
  screenFiles: ScreenFile[]
  setScreenFiles: (files: ScreenFile[]) => void
  currentScreenName: string | null
  setCurrentScreenName: (name: string | null) => void
  projectAssets: ProjectAsset[]
  setProjectAssets: (assets: ProjectAsset[]) => void
  currentBkyContent: string | null
  setCurrentBkyContent: (content: string | null) => void

  // Selection
  selectedComponent: KodularComponent | null
  setSelectedComponent: (comp: KodularComponent | null) => void

  // UI State
  activeTab: string
  setActiveTab: (tab: string) => void
  showProperties: boolean
  setShowProperties: (show: boolean) => void
  showWelcome: boolean
  setShowWelcome: (show: boolean) => void
  appMode: "edit" | "run" | "blocks" | "code"
  setAppMode: (mode: "edit" | "run" | "blocks" | "code") => void
  isSidebarCompact: boolean
  setIsSidebarCompact: (compact: boolean) => void
  toggleSidebar: () => void
  isSidebarContentExpanded: boolean
  setIsSidebarContentExpanded: (expanded: boolean) => void
  toggleSidebarContent: () => void

  // Chat
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void

  // Blocks
  blocks: Block[]
  setBlocks: (blocks: Block[]) => void

  // AI Settings
  aiSettings: AISettings
  setAISettings: (settings: AISettings) => void

  // Cloud User
  cloudUser: CloudUser | null
  setCloudUser: (user: CloudUser | null) => void

  // Build
  buildStatus: "idle" | "active" | "completed" | "failed"
  setBuildStatus: (status: "idle" | "active" | "completed" | "failed") => void
  buildProgress: number
  setBuildProgress: (progress: number) => void
  buildLogs: BuildLog[]
  addBuildLog: (log: BuildLog) => void
  clearBuildLogs: () => void

  // History for undo/redo
  history: HistorySnapshot[]
  historyIndex: number
  saveSnapshot: () => void
  buildHistory: BuildHistoryItem[]
  currentBuild: BuildResult | null
  setBuildHistory: (history: BuildHistoryItem[]) => void
  setCurrentBuild: (build: BuildResult | null) => void
  connectedUsers: Array<{ id: string; name: string; avatar: string; color: string; lastActive: number }>
  setConnectedUsers: (users: Array<{ id: string; name: string; avatar: string; color: string; lastActive: number }>) => void
  isOffline: boolean
  syncStatus: "synced" | "syncing" | "error" | "offline"
  setSyncStatus: (status: "synced" | "syncing" | "error" | "offline") => void
  // AI Operations
  isThinking: boolean
  setIsThinking: (thinking: boolean) => void
  executeAIAction: (action: { 
    action: string, 
    type?: string, 
    parentName?: string, 
    name?: string, 
    properties?: Record<string, any>,
    targetScreen?: string
  }) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // Drag & Drop
  dragState: DragState
  setDragState: (state: DragState) => void
  startDrag: (componentType: string, sourceType: "palette" | "tree") => void
  endDrag: () => void

  // Multi-screen management
  screens: Record<string, Screen>
  addScreen: (name: string) => void
  removeScreen: (name: string) => void
  duplicateScreen: (name: string) => void
  renameScreen: (oldName: string, newName: string) => void
  switchScreen: (name: string) => void
  getScreenNames: () => string[]

  // Component operations
  updateComponent: (name: string, props: Record<string, unknown>, skipSnapshot?: boolean) => void
  addComponent: (parentName: string, type: string, initialProps?: Record<string, any>) => string | undefined
  removeComponent: (name: string) => void
  moveComponent: (name: string, targetParentName: string, targetIndex?: number) => void
  findComponent: (root: KodularComponent, name: string) => KodularComponent | null
}

export const useIDEStore = create<IDEState>()(
  persist(
    (set, get) => ({
      // Inicializar ghToken com valor do localStorage (fallback)
      ghToken: typeof window !== 'undefined' ? localStorage.getItem('apex_gh_token_fallback') : null,
      setGhToken: (token) => {
        if (typeof window !== 'undefined') {
          if (token) localStorage.setItem('apex_gh_token_fallback', token)
          else localStorage.removeItem('apex_gh_token_fallback')
        }
        set({ ghToken: token })
      },
      ghRepos: [],
      setGhRepos: (repos) => set({ ghRepos: repos }),
      ghReposLoading: false,
      setGhReposLoading: (loading) => set({ ghReposLoading: loading }),
      ghReposError: null,
      setGhReposError: (error) => set({ ghReposError: error }),
      selectedRepo: null,
      setSelectedRepo: (repo) => set({ selectedRepo: repo }),
      repoTree: [],
      setRepoTree: (tree) => set({ repoTree: tree }),
      repoTreeLoading: false,
      setRepoTreeLoading: (loading) => set({ repoTreeLoading: loading }),

      // Project
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),
      currentFile: null,
      setCurrentFile: (file) => set({ currentFile: file }),
      screenFiles: [],
      setScreenFiles: (files) => set({ screenFiles: files }),
      currentScreenName: null,
      setCurrentScreenName: (name) => set({ currentScreenName: name }),
      projectAssets: [],
      setProjectAssets: (assets) => set({ projectAssets: assets }),
      currentBkyContent: null,
      setCurrentBkyContent: (content) => set({ currentBkyContent: content }),

      // Selection
      selectedComponent: null,
      setSelectedComponent: (comp) => set({ selectedComponent: comp }),

      // UI State
      activeTab: "componentes",
      setActiveTab: (tab) => set({ activeTab: tab }),
      showProperties: false,
      setShowProperties: (show) => set({ showProperties: show }),
      showWelcome: true,
      setShowWelcome: (show) => set({ showWelcome: show }),
      appMode: "edit",
      setAppMode: (mode) => set({ appMode: mode }),
      isSidebarCompact: false,
setIsSidebarCompact: (compact) => set({ isSidebarCompact: compact }),
  toggleSidebar: () => set((state) => ({ isSidebarCompact: !state.isSidebarCompact })),
  isSidebarContentExpanded: true,
  setIsSidebarContentExpanded: (expanded) => set({ isSidebarContentExpanded: expanded }),
  toggleSidebarContent: () => set((state) => ({ isSidebarContentExpanded: !state.isSidebarContentExpanded })),

      // Chat
      chatMessages: [
        { id: "1", role: "assistant", content: "Olá! Eu sou o APEX DROID. Como posso ajudar com seu projeto hoje?" }
      ],
      addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, message]
      })),
      clearChat: () => set({
        chatMessages: [
          { id: "1", role: "assistant", content: "Olá! Eu sou o APEX DROID. Como posso ajudar com seu projeto hoje?" }
        ]
      }),

      // Blocks
      blocks: [],
      setBlocks: (blocks) => set({ blocks }),

      // AI Settings
      aiSettings: {
        provider: "groq",
        model: "llama-3.3-70b-versatile",
        apiKey: "",
        baseUrl: "https://api.groq.com/openai/v1"
      },
      setAISettings: (settings) => set({ aiSettings: settings }),

      // Cloud User
      cloudUser: null,
      setCloudUser: (user) => set({ cloudUser: user }),

      // Build
      buildStatus: "idle",
      setBuildStatus: (status) => set({ buildStatus: status }),
      buildProgress: 0,
      setBuildProgress: (progress) => set({ buildProgress: progress }),
      buildLogs: [],
      addBuildLog: (log) => set((state) => ({
        buildLogs: [...state.buildLogs, log]
      })),
      clearBuildLogs: () => set({ buildLogs: [] }),

      // History with undo/redo
      history: [],
      historyIndex: -1,
      saveSnapshot: () => {
        const { currentProject, currentScreenName, history, historyIndex, activeTab, selectedComponent } = get()
        if (!currentProject) return

        // Create snapshot
        const snapshot: HistorySnapshot = {
          screens: { [currentScreenName || "Screen1"]: JSON.parse(JSON.stringify(currentProject)) },
          currentScreenName,
          activeTab,
          selectedComponentName: selectedComponent?.$Name,
          timestamp: Date.now()
        }

        // Trim future history if we're not at the end
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(snapshot)

        // Limit history to 50 snapshots
        if (newHistory.length > 50) {
          newHistory.shift()
        }

        set({ history: newHistory, historyIndex: newHistory.length - 1 })
      },
      buildHistory: [],
      currentBuild: null,
      setBuildHistory: (history) => set({ buildHistory: history }),
      setCurrentBuild: (build) => set({ currentBuild: build }),
      connectedUsers: [],
      setConnectedUsers: (users) => set({ connectedUsers: users }),
      isOffline: false,
      syncStatus: "synced",
      setSyncStatus: (status) => set({ syncStatus: status }),
      undo: () => {
        const { history, historyIndex, currentScreenName } = get()
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1
          const snapshot = history[newIndex]
          const screenName = currentScreenName || "Screen1"
          const project = snapshot.screens[screenName]
          if (project) {
            const selectedName = snapshot.selectedComponentName
            let selectedComp = null
            if (selectedName) {
              selectedComp = get().findComponent(project.Properties, selectedName)
            }
            
            set({ 
              historyIndex: newIndex, 
              currentProject: JSON.parse(JSON.stringify(project)),
              activeTab: snapshot.activeTab || get().activeTab,
              selectedComponent: selectedComp
            })
          }
        }
      },
      redo: () => {
        const { history, historyIndex, currentScreenName } = get()
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1
          const snapshot = history[newIndex]
          const screenName = currentScreenName || "Screen1"
          const project = snapshot.screens[screenName]
          if (project) {
            const selectedName = snapshot.selectedComponentName
            let selectedComp = null
            if (selectedName) {
              selectedComp = get().findComponent(project.Properties, selectedName)
            }

            set({ 
              historyIndex: newIndex, 
              currentProject: JSON.parse(JSON.stringify(project)),
              activeTab: snapshot.activeTab || get().activeTab,
              selectedComponent: selectedComp
            })
          }
        }
      },
      canUndo: () => {
        const { historyIndex } = get()
        return historyIndex > 0
      },
      canRedo: () => {
        const { history, historyIndex } = get()
        return historyIndex < history.length - 1
      },

      // Drag & Drop state
      dragState: {
        isDragging: false,
        componentType: null,
        sourceType: null
      },
      setDragState: (state) => set({ dragState: state }),
      startDrag: (componentType, sourceType) => set({
        dragState: { isDragging: true, componentType, sourceType }
      }),
      endDrag: () => set({
        dragState: { isDragging: false, componentType: null, sourceType: null }
      }),

      // Multi-screen management
      screens: {},
      addScreen: (name) => {
        const { screens, saveSnapshot } = get()
        if (screens[name]) return // Already exists

        const newScreen: Screen = {
          name,
          data: {
            Properties: {
              $Type: "Form",
              $Name: name,
              Title: name,
              $Components: []
            }
          },
          bkyContent: null
        }

        set({ screens: { ...screens, [name]: newScreen } })
        saveSnapshot()
      },
      removeScreen: (name) => {
        const { screens, currentScreenName, saveSnapshot } = get()
        if (Object.keys(screens).length <= 1) return // Can't remove last screen

        const newScreens = { ...screens }
        delete newScreens[name]

        // If removing current screen, switch to another
        let newCurrentScreen = currentScreenName
        if (currentScreenName === name) {
          newCurrentScreen = Object.keys(newScreens)[0]
          set({
            currentScreenName: newCurrentScreen,
            currentProject: newScreens[newCurrentScreen]?.data || null
          })
        }

        set({ screens: newScreens })
        saveSnapshot()
      },
      duplicateScreen: (name) => {
        const { screens, saveSnapshot } = get()
        const screen = screens[name]
        if (!screen) return

        // Generate unique name
        let counter = 1
        let newName = `${name}_copy`
        while (screens[newName]) {
          newName = `${name}_copy${counter}`
          counter++
        }

        const newScreen: Screen = {
          name: newName,
          data: screen.data ? JSON.parse(JSON.stringify(screen.data)) : null,
          bkyContent: screen.bkyContent
        }

        if (newScreen.data) {
          newScreen.data.Properties.$Name = newName
          newScreen.data.Properties.Title = newName
        }

        set({ screens: { ...screens, [newName]: newScreen } })
        saveSnapshot()
      },
      renameScreen: (oldName, newName) => {
        const { screens, currentScreenName, saveSnapshot } = get()
        if (!screens[oldName] || screens[newName]) return

        const screen = screens[oldName]
        const newScreens = { ...screens }
        delete newScreens[oldName]

        const renamedScreen: Screen = {
          ...screen,
          name: newName,
          data: screen.data ? {
            ...screen.data,
            Properties: {
              ...screen.data.Properties,
              $Name: newName,
              Title: newName
            }
          } : null
        }

        newScreens[newName] = renamedScreen

        set({
          screens: newScreens,
          currentScreenName: currentScreenName === oldName ? newName : currentScreenName
        })
        saveSnapshot()
      },
      switchScreen: (name) => {
        const { screens } = get()
        const screen = screens[name]
        if (screen) {
          set({
            currentScreenName: name,
            currentProject: screen.data,
            currentBkyContent: screen.bkyContent,
            selectedComponent: null
          })
        }
      },
      getScreenNames: () => {
        const { screens } = get()
        return Object.keys(screens)
      },

      // Component operations
      findComponent: (root, name) => {
        if (root.$Name === name) return root
        if (root.$Components) {
          for (const c of root.$Components) {
            const found = get().findComponent(c, name)
            if (found) return found
          }
        }
        return null
      },

      updateComponent: (name, props, skipSnapshot = false) => {
        const { currentProject, findComponent, saveSnapshot, selectedComponent, currentScreenName, screens } = get()
        if (!currentProject) return
        const comp = findComponent(currentProject.Properties, name)
        if (comp) {
          Object.assign(comp, props)
          const newProject = JSON.parse(JSON.stringify(currentProject))
          
          const updates: Partial<IDEState> = { currentProject: newProject }
          
          // Fix: update selectedComponent to point to the new reference so PropertiesPanel stays stable
          if (selectedComponent && selectedComponent.$Name === name) {
             updates.selectedComponent = get().findComponent(newProject.Properties, name) || newProject.Properties
          }
          
          // Sincronizar com o objeto screens para auto-sync com GitHub
          if (currentScreenName && screens[currentScreenName]) {
            const newScreens = { ...screens }
            newScreens[currentScreenName] = {
              ...newScreens[currentScreenName],
              data: newProject
            }
            updates.screens = newScreens
          }
          
          set(updates)

          if (!skipSnapshot) {
            saveSnapshot()
          }
        }
      },

      addComponent: (parentName, type, initialProps) => {
        const { currentProject, findComponent, saveSnapshot } = get()
        if (!currentProject) return undefined
        const parent = findComponent(currentProject.Properties, parentName)
        if (parent) {
          if (!parent.$Components) parent.$Components = []

          // Generate unique name
          let counter = 1
          const isNameUnique = (name: string): boolean => {
            const check = (root: KodularComponent): boolean => {
              if (root.$Name === name) return false
              if (root.$Components) {
                for (const c of root.$Components) {
                  if (!check(c)) return false
                }
              }
              return true
            }
            return check(currentProject.Properties)
          }

          while (!isNameUnique(type + counter)) counter++
          const newName = type + counter

          const newComp: KodularComponent = {
            $Type: type,
            $Name: newName,
            ...initialProps
          }

          parent.$Components.push(newComp)
          saveSnapshot()
          const newProject = JSON.parse(JSON.stringify(currentProject))
          
          // Sincronizar com o objeto screens para auto-sync com GitHub
          const { currentScreenName, screens } = get()
          const updates: Partial<IDEState> = { currentProject: newProject }
          
          if (currentScreenName && screens[currentScreenName]) {
            const newScreens = { ...screens }
            newScreens[currentScreenName] = {
              ...newScreens[currentScreenName],
              data: newProject
            }
            updates.screens = newScreens
          }
          
          set(updates)
          return newName
        }
        return undefined
      },

      removeComponent: (name) => {
        const { currentProject, saveSnapshot } = get()
        if (!currentProject) return
        if (name === currentProject.Properties.$Name) return

        const removeFromParent = (root: KodularComponent): boolean => {
          if (root.$Components) {
            const idx = root.$Components.findIndex(c => c.$Name === name)
            if (idx !== -1) {
              root.$Components.splice(idx, 1)
              return true
            }
            for (const c of root.$Components) {
              if (removeFromParent(c)) return true
            }
          }
          return false
        }

        if (removeFromParent(currentProject.Properties)) {
          saveSnapshot()
          const newProject = JSON.parse(JSON.stringify(currentProject))
          
          // Sincronizar com o objeto screens para auto-sync com GitHub
          const { currentScreenName, screens } = get()
          const updates: Partial<IDEState> = { currentProject: newProject, selectedComponent: null }
          
          if (currentScreenName && screens[currentScreenName]) {
            const newScreens = { ...screens }
            newScreens[currentScreenName] = {
              ...newScreens[currentScreenName],
              data: newProject
            }
            updates.screens = newScreens
          }
          
          set(updates)
        }
      },

      moveComponent: (name, targetParentName, targetIndex) => {
        const { currentProject, findComponent, saveSnapshot } = get()
        if (!currentProject) return

        // 1. Localizar e remover o componente da posição atual
        let componentToMove: KodularComponent | null = null
        
        const findAndRemove = (root: KodularComponent): boolean => {
          if (root.$Components) {
            const idx = root.$Components.findIndex(c => c.$Name === name)
            if (idx !== -1) {
              componentToMove = root.$Components.splice(idx, 1)[0]
              return true
            }
            for (const c of root.$Components) {
              if (findAndRemove(c)) return true
            }
          }
          return false
        }

        // Não permitir mover a própria tela
        if (name === currentProject.Properties.$Name) return

        if (findAndRemove(currentProject.Properties)) {
          // 2. Localizar o novo pai
          const targetParent = findComponent(currentProject.Properties, targetParentName)
          if (targetParent && componentToMove) {
            if (!targetParent.$Components) targetParent.$Components = []
            
            const index = targetIndex !== undefined ? targetIndex : targetParent.$Components.length
            targetParent.$Components.splice(index, 0, componentToMove)
            
            saveSnapshot()
            const newProject = JSON.parse(JSON.stringify(currentProject))
            
            // Sincronizar com o objeto screens para auto-sync com GitHub
            const { currentScreenName, screens } = get()
            const updates: Partial<IDEState> = { currentProject: newProject }
            
            if (currentScreenName && screens[currentScreenName]) {
              const newScreens = { ...screens }
              newScreens[currentScreenName] = {
                ...newScreens[currentScreenName],
                data: newProject
              }
              updates.screens = newScreens
            }
            
            set(updates)
            toast.success(`${name} movido para ${targetParentName}`)
          }
        }
      },

      // AI Operations
      isThinking: false,
      setIsThinking: (thinking) => set({ isThinking: thinking }),
      executeAIAction: (data) => {
        const { addComponent, updateComponent, removeComponent, switchScreen, screens, currentScreenName } = get()
        
        // 1. Identificar a tela alvo
        let targetScreen = data.targetScreen
        
        // Se não houver tela alvo, tentamos descobrir onde o componente está
        if (!targetScreen && data.parentName) {
          // Se o pai é o nome de uma tela, ela é a alvo
          if (screens[data.parentName]) {
            targetScreen = data.parentName
          } else {
            // Procurar em todas as telas em qual o pai reside
            for (const sName of Object.keys(screens)) {
              const screen = screens[sName]
              if (screen.data && get().findComponent(screen.data.Properties, data.parentName)) {
                targetScreen = sName
                break
              }
            }
          }
        }

        // Se for update/remove e não temos targetScreen, procuramos o componente em si
        if (!targetScreen && data.name) {
          for (const sName of Object.keys(screens)) {
            const screen = screens[sName]
            if (screen.data && get().findComponent(screen.data.Properties, data.name)) {
              targetScreen = sName
              break
            }
          }
        }

        // Fallback final: se não encontramos uma tela, usamos a tela atual
        if (!targetScreen) {
          targetScreen = currentScreenName || undefined
        }

        // 2. Trocar de tela se necessário
        if (targetScreen && targetScreen !== currentScreenName && screens[targetScreen]) {
          switchScreen(targetScreen)
        }

        // 3. Executar a ação na tela (agora atualizada)
        switch (data.action) {
          case 'clear_screen':
            if (targetScreen && screens[targetScreen] && screens[targetScreen].data) {
              const screenData = screens[targetScreen].data
              if (screenData) {
                const screenProps = screenData.Properties
                screenProps.$Components = []
                get().saveSnapshot()
                set({ 
                  currentProject: JSON.parse(JSON.stringify(get().currentProject)),
                  selectedComponent: null 
                })
              }
            }
            break
          case 'add_component':
            if (data.parentName && data.type) {
              addComponent(data.parentName, data.type, data.properties)
            }
            break
          case 'update_component':
            if (data.name && data.properties) {
              updateComponent(data.name, data.properties)
            }
            break
          case 'remove_component':
            if (data.name) {
              removeComponent(data.name)
            }
            break
          case 'select_component':
            if (data.name) {
              const { currentProject, findComponent } = get()
              if (currentProject) {
                const comp = findComponent(currentProject.Properties, data.name)
                if (comp) {
                  set({ selectedComponent: comp, activeTab: "propriedades", showProperties: true })
                }
              }
            }
            break
        }
      }
    }),
    {
      name: "apex-droid-ide-storage",
      version: 1, // Incremented version to trigger migration
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrate from old OpenAI model gpt-4-turbo to gpt-4o-mini
          if (persistedState.aiSettings?.model === "gpt-4-turbo") {
            persistedState.aiSettings.model = "gpt-4o-mini";
          }
          // Fix Groq model if it's set to something like DeepSeek that might be broken
          if (persistedState.aiSettings?.provider === "groq" && 
              persistedState.aiSettings?.model?.includes("deepseek")) {
            persistedState.aiSettings.model = "deepseek-r1-distill-llama-70b";
          }
        }
        return persistedState;
      },
      partialize: (state) => ({
        ghToken: state.ghToken,
        aiSettings: state.aiSettings,
        cloudUser: state.cloudUser
      })
    }
  )
)
