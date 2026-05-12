import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, repo, files, message } = body

    if (!token || !repo || !files) {
      return NextResponse.json({ error: "Token, repo e files são obrigatórios" }, { status: 400 })
    }

    // 1. Obter o SHA do commit mais recente (ref)
    const refRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/main`, {
      headers: { 'Authorization': `token ${token}` }
    })
    
    // Se não existir main, tenta master
    let refData = await refRes.json()
    let branch = 'main'
    
    if (!refRes.ok) {
      const masterRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/master`, {
        headers: { 'Authorization': `token ${token}` }
      })
      refData = await masterRes.json()
      branch = 'master'
    }

    if (!refData.object) {
      throw new Error("Não foi possível encontrar a branch principal (main ou master)")
    }

    const latestCommitSha = refData.object.sha

    // 2. Criar Blobs para cada arquivo
    const treeItems = []
    for (const file of files) {
      const blobRes = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
        method: 'POST',
        headers: { 
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: file.content,
          encoding: 'utf-8'
        })
      })
      const blobData = await blobRes.json()
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha
      })
    }

    // 3. Criar uma nova Tree
    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: 'POST',
      headers: { 
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base_tree: latestCommitSha,
        tree: treeItems
      })
    })
    const treeData = await treeRes.json()

    // 4. Criar o Commit
    const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
      method: 'POST',
      headers: { 
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message || "Auto-sync from APEX DROID IDE",
        tree: treeData.sha,
        parents: [latestCommitSha]
      })
    })
    const commitData = await commitRes.json()

    // 5. Atualizar a Ref (Push)
    const pushRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sha: commitData.sha
      })
    })

    if (!pushRes.ok) {
      throw new Error("Falha ao atualizar a referência (Push)")
    }

    return NextResponse.json({ success: true, sha: commitData.sha, branch })

  } catch (error: any) {
    console.error("Auto-sync error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
