import { useCallback } from "react"
import { useIDEStore } from "@/lib/ide-store"
import { fetchRepoTree, createFile, deleteFile, updateFileContent } from "@/lib/github-service"
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
    } catch (error) {
      console.error("Erro ao processar repositorio:", error)
      setRepoTree([])
      setScreenFiles([])
      setProjectAssets([])
    } finally {
      setRepoTreeLoading(false)
    }
  }, [ghToken, setSelectedRepo, setRepoTree, setRepoTreeLoading, setScreenFiles, setProjectAssets, setActiveTab, setCurrentProject, setCurrentScreenName, setShowWelcome])

  const createNewScreen = useCallback(async (name: string) => {
    if (!ghToken || !selectedRepo) return
    
    // Validar nome da tela (A-Z, 0-9, sem espaços)
    const validName = name.replace(/[^a-zA-Z0-9]/g, "")
    if (!validName) return
    
    const scmPath = `src/${validName}.scm`
    const bkyPath = `src/${validName}.bky`
    
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
      
      // Criar .scm
      await createFile(ghToken, owner, selectedRepo.name, scmPath, scmContent, `Create screen ${validName}`, selectedRepo.default_branch)
      
      // Criar .bky
      await createFile(ghToken, owner, selectedRepo.name, bkyPath, bkyContent, `Create blocks for ${validName}`, selectedRepo.default_branch)
      
      // Atualizar lista local
      const newScreen: ScreenFile = {
        name: validName,
        scmPath,
        bkyPath
      }
      setScreenFiles([...screenFiles, newScreen])
      
      // Recarregar a árvore para garantir integridade
      await selectProject(selectedRepo)
      
      return newScreen
    } catch (error) {
      console.error("Erro ao criar tela:", error)
      throw error
    }
  }, [ghToken, selectedRepo, screenFiles, setScreenFiles, selectProject])

  const deleteScreen = useCallback(async (screen: ScreenFile) => {
    if (!ghToken || !selectedRepo) return
    
    try {
      const [owner] = selectedRepo.full_name.split("/")
      
      // Encontrar SHAs na árvore
      const scmItem = repoTree.find(item => item.path === screen.scmPath)
      const bkyItem = screen.bkyPath ? repoTree.find(item => item.path === screen.bkyPath) : null
      
      if (scmItem) {
        await deleteFile(ghToken, owner, selectedRepo.name, screen.scmPath, scmItem.sha, `Delete screen ${screen.name}`, selectedRepo.default_branch)
      }
      
      if (bkyItem && screen.bkyPath) {
        await deleteFile(ghToken, owner, selectedRepo.name, screen.bkyPath, bkyItem.sha, `Delete blocks for ${screen.name}`, selectedRepo.default_branch)
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
      console.error("Erro ao deletar tela:", error)
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
    
    // Find SHAs se os arquivos já existem na árvore (para fazer UPDATE em vez de CREATE)
    const scmItem = repoTree.find(item => item.path === scmPath)
    const bkyItem = repoTree.find(item => item.path === bkyPath)

    try {
      // Save .scm
      if (scmItem) {
        await updateFileContent(ghToken, owner, selectedRepo.name, scmPath, scmContent, scmItem.sha, `Update ${currentScreenName} design`, branch)
      } else {
        await createFile(ghToken, owner, selectedRepo.name, scmPath, scmContent, `Create ${currentScreenName} design`, branch)
      }

      // Save .bky if content exists
      if (currentBkyContent !== null && currentBkyContent !== undefined) {
        if (bkyItem) {
          await updateFileContent(ghToken, owner, selectedRepo.name, bkyPath, currentBkyContent, bkyItem.sha, `Update ${currentScreenName} blocks`, branch)
        } else {
          await createFile(ghToken, owner, selectedRepo.name, bkyPath, currentBkyContent, `Create ${currentScreenName} blocks`, branch)
        }
      }

      // Reload ONLY the repo tree to get new SHAs so we can save again without conflict
      // Do NOT call selectProject because it resets the UI state and kicks the user out of the screen
      const newTree = await fetchRepoTree(ghToken, owner, selectedRepo.name, branch)
      setRepoTree(newTree)
    } catch (error) {
      console.error("Error saving to GitHub:", error)
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
