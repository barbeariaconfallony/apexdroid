import type { GitHubRepo, GitHubContent, GitHubTreeItem } from "./ide-types"

const GITHUB_API = "https://api.github.com"

export async function fetchUserRepos(token: string): Promise<GitHubRepo[]> {
  const response = await fetch(`${GITHUB_API}/user/repos?sort=updated&per_page=50`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json"
    }
  })
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }
  
  return response.json()
}

export async function fetchRepoContents(
  token: string, 
  owner: string, 
  repo: string, 
  path: string = ""
): Promise<GitHubContent[]> {
  const url = path 
    ? `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`
    : `${GITHUB_API}/repos/${owner}/${repo}/contents`
    
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json"
    }
  })
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }
  
  const data = await response.json()
  return Array.isArray(data) ? data : [data]
}

export async function fetchRepoTree(
  token: string,
  owner: string,
  repo: string,
  branch: string = "main"
): Promise<GitHubTreeItem[]> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    }
  )
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }
  
  const data = await response.json()
  return data.tree || []
}

export async function fetchFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<{ content: string; sha: string }> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    }
  )
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }
  
  const data = await response.json()
  const content = atob(data.content.replace(/\n/g, ""))
  
  return {
    content,
    sha: data.sha
  }
}

export async function updateFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  sha: string,
  message: string,
  branch: string = "main"
): Promise<{ sha: string }> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        content: btoa(content),
        sha,
        branch
      })
    }
  )
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }
  
  const data = await response.json()
  return { sha: data.content.sha }
}

export async function createFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string = "main"
): Promise<{ sha: string }> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        content: btoa(content),
        branch
      })
    }
  )
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }
  
  const data = await response.json()
  return { sha: data.content.sha }
}
export async function deleteFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  sha: string,
  message: string,
  branch: string = "main"
): Promise<void> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        sha,
        branch
      })
    }
  )
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }
}

// Verificar se um repositório é um projeto APEX DROID
export async function checkIsApexProject(
  token: string,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    // Verificar se existe arquivo de configuração APEX ou estrutura de projeto AIA
    const apexIndicators = [
      "apex-droid.json",
      "youngandroidproject/project.properties",
      "src/appinventor",
      ".apex"
    ]
    
    const tree = await fetchRepoTree(token, owner, repo).catch(() => [])
    
    if (tree.length === 0) return false
    
    const paths = tree.map(item => item.path.toLowerCase())
    
    // Verificar indicadores de projeto APEX
    for (const indicator of apexIndicators) {
      if (paths.some(p => p.includes(indicator.toLowerCase()))) {
        return true
      }
    }
    
    // Verificar topics do repositório
    const repoResponse = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    )
    
    if (repoResponse.ok) {
      const repoData = await repoResponse.json()
      if (repoData.topics?.includes("apex-droid") || 
          repoData.topics?.includes("app-inventor") ||
          repoData.topics?.includes("kodular")) {
        return true
      }
    }
    
    return false
  } catch {
    return false
  }
}

// Validar token do GitHub
export async function validateGitHubToken(token: string): Promise<{ valid: boolean; user?: string; error?: string }> {
  try {
    const response = await fetch(`${GITHUB_API}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      return { valid: true, user: data.login }
    } else if (response.status === 401) {
      return { valid: false, error: "Token inválido ou expirado" }
    } else {
      return { valid: false, error: `Erro: ${response.status}` }
    }
  } catch {
    return { valid: false, error: "Erro de conexão" }
  }
}
