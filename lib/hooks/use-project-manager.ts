import { useCallback } from "react"
import { useIDEStore } from "@/lib/ide-store"
import { fetchRepoTree, createFile, deleteFile, updateFileContent, fetchFileContent } from "@/lib/github-service"
import type { GitHubRepo, ScreenFile, ProjectAsset } from "@/lib/ide-types"

export function useProjectManager() {
  const {
    ghToken,
    selectedRepo,
    setSelectedRepo,
    repoTree,
    setRepoTree,
    setRepoTreeLoading,
    screenFiles,
    setScreenFiles,
    projectAssets,
    setProjectAssets,
    activeTab,
    setActiveTab,
    currentProject,
    setCurrentProject,
    currentScreenName,
    setCurrentScreenName,
    setShowWelcome
  } = useIDEStore()

  const getAssetType = (filename: string): "image" | "audio" | "video" | "other" => {
    const ext = filename.split(".").pop()?.toLowerCase() || ""
    if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) return "image"
    if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "audio"
    if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video"
    return "other"
  }

  const selectProject = useCallback(async (repo: GitHubRepo) => {
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
      
      // Find assets
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
      
      // Reset current editing state
      setActiveTab("telas")
      setCurrentProject(null)
      setCurrentScreenName(null)
      setShowWelcome(false)
      
      // Retornar as telas para que o chamador possa abrir a primeira
      return { screens, tree }
    } catch (error) {
      console.warn("Erro ao processar repositorio:", error instanceof Error ? error.message : error)
      setRepoTree([])
      setScreenFiles([])
      setProjectAssets([])
      return { screens: [], tree: [] }
    } finally {
      setRepoTreeLoading(false)
    }
  }, [ghToken, setSelectedRepo, setRepoTree, setRepoTreeLoading, setScreenFiles, setProjectAssets, setActiveTab, setCurrentProject, setCurrentScreenName, setShowWelcome])

  const createNewScreen = useCallback(async (name: string) => {
    if (!ghToken || !selectedRepo) return
    
    // Validar nome da tela (A-Z, 0-9, sem espaços)
    const validName = name.replace(/[^a-zA-Z0-9]/g, "")
    if (!validName) throw new Error("Nome de tela inválido")

    // 1. Verificar se já existe na lista local de telas
    if (screenFiles.some(s => s.name.toLowerCase() === validName.toLowerCase())) {
      throw new Error(`A tela "${validName}" já está aberta no editor.`)
    }
    
    const scmPath = `src/${validName}.scm`
    const bkyPath = `src/${validName}.bky`

    // 2. Verificar se o arquivo já existe na árvore do repositório (arquivos que podem não ter sido carregados como telas)
    if (repoTree.some(item => item.path === scmPath)) {
      throw new Error(`O arquivo "${scmPath}" já existe no GitHub. Exclua-o manualmente ou escolha um nome diferente para a nova tela.`)
    }
    
    const scmContent = JSON.stringify({
      Properties: {
        "$Type": "Form",
        "$Name": validName,
        "Title": validName,
        "BackgroundColor": "&HFFFFFFFF",
        "AlignHorizontal": "1",
        "AlignVertical": "1",
        "$Components": []
      }
    }, null, 2)
    
    const bkyContent = `<xml xmlns="http://www.w3.org/1999/xhtml"></xml>`
    
    try {
      const [owner] = selectedRepo.full_name.split("/")
      const branch = selectedRepo.default_branch
      
      // Criar .scm
      try {
        await createFile(ghToken, owner, selectedRepo.name, scmPath, scmContent, `Create screen ${validName}`, branch)
      } catch (e: any) {
        if (e.message?.includes("422")) {
          throw new Error(`Conflito: "${scmPath}" já existe. Tente atualizar a lista de arquivos.`)
        }
        throw e
      }
      
      // Criar .bky
      await createFile(ghToken, owner, selectedRepo.name, bkyPath, bkyContent, `Create blocks for ${validName}`, branch)
      
      // Atualizar lista local
      const newScreen: ScreenFile = {
        name: validName,
        scmPath,
        bkyPath
      }
      
      setScreenFiles([...screenFiles, newScreen])
      
      // Abrir a tela automaticamente após a criação usando as funções da store
      const { addScreen, switchScreen } = useIDEStore.getState()
      
      // Registrar a nova tela na store global (gerenciador de múltiplas telas)
      addScreen(validName)
      
      // Mudar para a nova tela
      switchScreen(validName)
      
      // Garantir que a aba de telas esteja ativa
      setActiveTab("telas")
      
      // Recarregar a árvore em segundo plano para manter a integridade, sem resetar a tela atual
      const [owner2] = selectedRepo.full_name.split("/")
      const { setRepoTree } = useIDEStore.getState()
      fetchRepoTree(ghToken, owner2, selectedRepo.name, selectedRepo.default_branch)
        .then(tree => setRepoTree(tree))
        .catch(err => console.warn("Erro ao atualizar árvore em background:", err))
      
      return newScreen
    } catch (error) {
      console.warn("Erro ao criar tela:", error instanceof Error ? error.message : error)
      throw error
    }
  }, [ghToken, selectedRepo, screenFiles, repoTree, setScreenFiles, setCurrentScreenName, setCurrentProject, setActiveTab])

  const deleteScreen = useCallback(async (screen: ScreenFile) => {
    if (!ghToken || !selectedRepo) return
    
    try {
      const [owner] = selectedRepo.full_name.split("/")
      const branch = selectedRepo.default_branch
      
      // Tentar obter SHAs atualizados para evitar 409 Conflict
      let scmSha = ""
      let bkySha = ""
      
      try {
        const scmFile = await fetchFileContent(ghToken, owner, selectedRepo.name, screen.scmPath)
        scmSha = scmFile.sha
      } catch (e) {
        // Se der 404, talvez o arquivo já não exista ou o path esteja diferente
        const item = repoTree.find(item => item.path === screen.scmPath)
        scmSha = item?.sha || ""
      }

      if (screen.bkyPath) {
        try {
          const bkyFile = await fetchFileContent(ghToken, owner, selectedRepo.name, screen.bkyPath)
          bkySha = bkyFile.sha
        } catch (e) {
          const item = repoTree.find(item => item.path === screen.bkyPath)
          bkySha = item?.sha || ""
        }
      }
      
      // Deletar .scm
      if (scmSha) {
        await deleteFile(ghToken, owner, selectedRepo.name, screen.scmPath, scmSha, `Delete screen ${screen.name}`, branch)
      }
      
      // Deletar .bky
      if (bkySha && screen.bkyPath) {
        await deleteFile(ghToken, owner, selectedRepo.name, screen.bkyPath, bkySha, `Delete blocks for ${screen.name}`, branch)
      }
      
      // Atualizar lista local
      setScreenFiles(screenFiles.filter(s => s.scmPath !== screen.scmPath))
      
      if (currentScreenName === screen.name) {
        setCurrentProject(null)
        setCurrentScreenName(null)
      }
      
      // Recarregar a árvore
      await selectProject(selectedRepo)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      if (errorMsg.includes("404")) {
        setScreenFiles(screenFiles.filter(s => s.scmPath !== screen.scmPath))
        await selectProject(selectedRepo)
        return
      }
      console.warn("Erro ao deletar tela:", errorMsg)
      throw error
    }
  }, [ghToken, selectedRepo, repoTree, screenFiles, setScreenFiles, currentScreenName, setCurrentProject, setCurrentScreenName, selectProject])

  const saveCurrentScreen = useCallback(async () => {
    if (!ghToken || !selectedRepo || !currentProject || !currentScreenName) {
      throw new Error("Missing required data to save.")
    }

    const { currentBkyContent } = useIDEStore.getState()
    const [owner] = selectedRepo.full_name.split("/")
    const branch = selectedRepo.default_branch

    // Tentar encontrar os caminhos reais da tela existente para evitar duplicação em pastas diferentes
    const existingScreen = screenFiles.find(s => s.name === currentScreenName)
    
    const scmPath = existingScreen?.scmPath || `src/${currentScreenName}.scm`
    const bkyPath = existingScreen?.bkyPath || `src/${currentScreenName}.bky`

    const scmContent = JSON.stringify(currentProject, null, 2)
    
    // Adicionar o prefixo Kodular/App Inventor se ele existir na store
    const { screens } = useIDEStore.getState()
    const screenData = screens[currentScreenName]
    const finalScmContent = (screenData && screenData.scmPrefix) 
      ? screenData.scmPrefix + scmContent 
      : scmContent
    
    // Find SHAs se os arquivos já existem na árvore (para fazer UPDATE em vez de CREATE)
    const scmItem = repoTree.find(item => item.path === scmPath)
    const bkyItem = repoTree.find(item => item.path === bkyPath)

    try {
      // Fetch latest SHAs to avoid 409 Conflict
      let latestScmSha = ""
      let latestBkySha = ""
      
      try {
        const scmFile = await fetchFileContent(ghToken, owner, selectedRepo.name, scmPath)
        latestScmSha = scmFile.sha
      } catch (e) { /* File might not exist yet */ }

      try {
        const bkyFile = await fetchFileContent(ghToken, owner, selectedRepo.name, bkyPath)
        latestBkySha = bkyFile.sha
      } catch (e) { /* File might not exist yet */ }

      // Save .scm
      if (latestScmSha) {
        await updateFileContent(ghToken, owner, selectedRepo.name, scmPath, finalScmContent, latestScmSha, `Update ${currentScreenName} design`, branch)
      } else {
        await createFile(ghToken, owner, selectedRepo.name, scmPath, finalScmContent, `Create ${currentScreenName} design`, branch)
      }

      // Save .bky if content exists
      if (currentBkyContent !== null && currentBkyContent !== undefined) {
        if (latestBkySha) {
          await updateFileContent(ghToken, owner, selectedRepo.name, bkyPath, currentBkyContent, latestBkySha, `Update ${currentScreenName} blocks`, branch)
        } else {
          await createFile(ghToken, owner, selectedRepo.name, bkyPath, currentBkyContent, `Create ${currentScreenName} blocks`, branch)
        }
      }

      // Reload ONLY the repo tree to get new SHAs so we can save again without conflict
      const newTree = await fetchRepoTree(ghToken, owner, selectedRepo.name, branch)
      setRepoTree(newTree)
    } catch (error) {
      console.warn("Error saving to GitHub:", error instanceof Error ? error.message : error)
      throw error
    }
  }, [ghToken, selectedRepo, currentProject, currentScreenName, repoTree, selectProject])

  return {
    selectProject,
    createNewScreen,
    deleteScreen,
    saveCurrentScreen
  }
}
