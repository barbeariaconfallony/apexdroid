import { NextRequest, NextResponse } from "next/server"

// GET - Buscar e redirecionar para download do artefato APK
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const repo = searchParams.get("repo")
  const artifactId = searchParams.get("artifactId")
  const runId = searchParams.get("runId")
  const artifactName = searchParams.get("name") || "APK"

  if (!token || !repo) {
    return NextResponse.json(
      { error: "Token e repo sao obrigatorios" },
      { status: 400 }
    )
  }

  try {
    let targetArtifactId = artifactId
    let targetRunId = runId

    // Se nao tiver artifactId, buscar do workflow mais recente
    if (!targetArtifactId) {
      
      // Buscar o run mais recente bem-sucedido
      if (!targetRunId) {
        // Tentar primeiro o workflow de build real
        let runsRes = await fetch(
          `https://api.github.com/repos/${repo}/actions/workflows/build-apk-real.yml/runs?per_page=1&status=completed`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json"
            }
          }
        )

        // Fallback para workflow antigo se o novo nao existir
        if (!runsRes.ok) {
          runsRes = await fetch(
            `https://api.github.com/repos/${repo}/actions/workflows/build-apk.yml/runs?per_page=1&status=completed`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json"
              }
            }
          )
        }

        if (!runsRes.ok) {
          // Tentar buscar qualquer run recente
          runsRes = await fetch(
            `https://api.github.com/repos/${repo}/actions/runs?per_page=5&status=completed`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json"
              }
            }
          )
        }

        if (runsRes.ok) {
          const runsData = await runsRes.json()
          const runs = runsData.workflow_runs || []
          
          // Buscar run com conclusao success
          const successRun = runs.find((r: { conclusion: string }) => r.conclusion === "success")
          if (successRun) {
            targetRunId = successRun.id
          } else if (runs[0]) {
            targetRunId = runs[0].id
          }
        }
      }

      if (!targetRunId) {
        return NextResponse.json(
          { error: "Nenhum build concluido encontrado. Execute um build primeiro." },
          { status: 404 }
        )
      }

      // Buscar artefatos do run
      const artifactsRes = await fetch(
        `https://api.github.com/repos/${repo}/actions/runs/${targetRunId}/artifacts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json"
          }
        }
      )

      if (!artifactsRes.ok) {
        return NextResponse.json(
          { error: "Falha ao buscar artefatos do build" },
          { status: 500 }
        )
      }

      const artifactsData = await artifactsRes.json()
      const artifacts = artifactsData.artifacts || []

      if (artifacts.length === 0) {
        return NextResponse.json(
          { error: "Nenhum artefato encontrado neste build. O build pode ter falhado." },
          { status: 404 }
        )
      }

      // Buscar artefato de APK (priorizar por nome)
      const apkArtifact = artifacts.find(
        (a: { name: string; expired: boolean }) => 
          !a.expired && (
            a.name.toLowerCase().includes("apk") || 
            a.name.includes(artifactName)
          )
      ) || artifacts.find((a: { expired: boolean }) => !a.expired) || artifacts[0]

      if (!apkArtifact) {
        return NextResponse.json(
          { error: "Artefato APK nao encontrado ou expirado" },
          { status: 404 }
        )
      }

      if (apkArtifact.expired) {
        return NextResponse.json(
          { error: "O artefato APK expirou. Execute um novo build." },
          { status: 410 }
        )
      }

      targetArtifactId = apkArtifact.id
    }

    // Buscar URL de download do artefato
    const downloadRes = await fetch(
      `https://api.github.com/repos/${repo}/actions/artifacts/${targetArtifactId}/zip`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json"
        },
        redirect: "manual"
      }
    )

    // GitHub retorna 302 redirect para URL temporaria de download
    if (downloadRes.status === 302) {
      const downloadUrl = downloadRes.headers.get("location")

      if (downloadUrl) {
        // Redirecionar usuario para download direto
        return NextResponse.redirect(downloadUrl)
      }
    }

    // Se nao conseguiu redirect, tentar download direto
    const directRes = await fetch(
      `https://api.github.com/repos/${repo}/actions/artifacts/${targetArtifactId}/zip`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    )

    if (directRes.ok) {
      const arrayBuffer = await directRes.arrayBuffer()
      
      return new NextResponse(arrayBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="apk-${Date.now()}.zip"`,
          "Content-Length": String(arrayBuffer.byteLength)
        }
      })
    }

    // Se chegou aqui, houve erro
    const errorData = await directRes.json().catch(() => ({}))
    return NextResponse.json(
      { error: errorData.message || "Falha ao obter link de download" },
      { status: directRes.status }
    )

  } catch (error) {
    console.error("Artifact download error:", error)
    return NextResponse.json(
      { error: "Erro ao processar download do artefato" },
      { status: 500 }
    )
  }
}

// POST - Listar artefatos disponiveis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, repo, runId } = body

    if (!token || !repo) {
      return NextResponse.json(
        { error: "Token e repo sao obrigatorios" },
        { status: 400 }
      )
    }

    // Se tiver runId, buscar artefatos desse run especifico
    let url = `https://api.github.com/repos/${repo}/actions/artifacts?per_page=20`
    if (runId) {
      url = `https://api.github.com/repos/${repo}/actions/runs/${runId}/artifacts`
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.message || "Falha ao listar artefatos" },
        { status: res.status }
      )
    }

    const data = await res.json()

    // Formatar e filtrar artefatos
    const artifacts = (data.artifacts || [])
      .filter((a: { expired: boolean }) => !a.expired)
      .map((a: {
        id: number
        name: string
        size_in_bytes: number
        created_at: string
        expires_at: string
        workflow_run?: { id: number; head_branch: string }
      }) => ({
        id: a.id,
        name: a.name,
        size: a.size_in_bytes,
        sizeFormatted: formatBytes(a.size_in_bytes),
        createdAt: a.created_at,
        expiresAt: a.expires_at,
        runId: a.workflow_run?.id,
        branch: a.workflow_run?.head_branch,
        downloadUrl: `/api/github/artifact?token=${token}&repo=${repo}&artifactId=${a.id}`
      }))

    return NextResponse.json({ 
      artifacts,
      total: artifacts.length
    })

  } catch (error) {
    console.error("List artifacts error:", error)
    return NextResponse.json(
      { error: "Erro ao listar artefatos" },
      { status: 500 }
    )
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
