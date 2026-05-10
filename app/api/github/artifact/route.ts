import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const repo = searchParams.get("repo")
  const artifactName = searchParams.get("name") || "APK-Result"

  if (!token || !repo) {
    return NextResponse.json({ error: "Token e Repo são obrigatórios" }, { status: 400 })
  }

  try {
    // 1. Buscar os artefatos mais recentes do repositório
    const artifactsRes = await fetch(`https://api.github.com/repos/${repo}/actions/artifacts?per_page=1`, {
      headers: { 'Authorization': `token ${token}` }
    })
    
    const artifactsData = await artifactsRes.json()
    const artifact = artifactsData.artifacts?.find((a: any) => a.name.includes(artifactName) || a.name.includes("APK"))

    if (!artifact) {
      return NextResponse.json({ error: "APK ainda não está pronto no GitHub. Aguarde alguns instantes." }, { status: 404 })
    }

    // 2. Obter a URL de download (esta URL redireciona para um ZIP)
    const downloadRes = await fetch(`https://api.github.com/repos/${repo}/actions/artifacts/${artifact.id}/zip`, {
      headers: { 'Authorization': `token ${token}` },
      redirect: 'manual'
    })

    const downloadUrl = downloadRes.headers.get("location")

    if (!downloadUrl) {
      throw new Error("Não foi possível obter a URL de download do artefato")
    }

    // Redireciona o navegador do usuário diretamente para o download do GitHub
    // Nota: O GitHub entrega um .zip contendo o .apk. 
    return NextResponse.redirect(downloadUrl)

  } catch (error: any) {
    console.error("Artifact download error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
