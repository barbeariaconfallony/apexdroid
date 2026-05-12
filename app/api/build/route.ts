import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

// Simulated build storage (in production, use a database)
const builds = new Map<string, BuildState>()

interface BuildState {
  id: string
  status: "queued" | "building" | "completed" | "failed"
  progress: number
  logs: Array<{ timestamp: string; message: string; type: string }>
  apkUrl?: string
  apkSize?: number
  qrCode?: string
  startedAt: string
  completedAt?: string
  error?: string
  projectName: string
  config: {
    mode: string
    packageName: string
    versionCode: number
    versionName: string
  }
}

// POST - Start a new build
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { project, config } = body

    if (!project) {
      return NextResponse.json(
        { error: "Project data is required" },
        { status: 400 }
      )
    }

    const buildId = `build_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    const buildState: BuildState = {
      id: buildId,
      status: "queued",
      progress: 0,
      logs: [],
      startedAt: new Date().toISOString(),
      projectName: project.Properties?.$Name || "Untitled",
      config: {
        mode: config?.mode || "debug",
        packageName: config?.packageName || "com.example.app",
        versionCode: config?.versionCode || 1,
        versionName: config?.versionName || "1.0.0"
      }
    }

    builds.set(buildId, buildState)

    // Inicia o processo de build (Real via GitHub ou Simulado)
    handleBuild(buildId, project, body.github)

    return NextResponse.json({
      buildId,
      status: "queued",
      message: body.github ? "Real build started via GitHub Actions" : "Simulation started"
    })
  } catch (error) {
    console.error("Build error:", error)
    return NextResponse.json(
      { error: "Failed to start build" },
      { status: 500 }
    )
  }
}

// GET - Get build status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const buildId = searchParams.get("id")

  if (!buildId) {
    // Return all builds for history
    const allBuilds = Array.from(builds.values())
      .filter(b => b.status === "completed" || b.status === "failed")
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 10)
    
    return NextResponse.json({ builds: allBuilds })
  }

  const build = builds.get(buildId)
  
  if (!build) {
    return NextResponse.json(
      { error: "Build not found" },
      { status: 404 }
    )
  }

  return NextResponse.json(build)
}

// Processamento do Build (Real ou Simulado)
async function handleBuild(buildId: string, project: any, githubInfo?: any) {
  const build = builds.get(buildId)
  if (!build) return

  const addLog = (message: string, type: string = "log") => {
    const buildState = builds.get(buildId)
    if (buildState) {
      buildState.logs.push({ timestamp: new Date().toISOString(), message, type })
      builds.set(buildId, buildState)
    }
  }

  const updateProgress = (progress: number, status?: BuildState["status"]) => {
    const buildState = builds.get(buildId)
    if (buildState) {
      buildState.progress = progress
      if (status) buildState.status = status
      builds.set(buildId, buildState)
    }
  }

  try {
    if (githubInfo?.token && githubInfo?.repo) {
      addLog(`[GitHub] Iniciando workflow de build real em ${githubInfo.repo}...`, "info")
      updateProgress(10, "building")

      // 1. Trigger Workflow Dispatch
      const triggerRes = await fetch(`https://api.github.com/repos/${githubInfo.repo}/actions/workflows/build-apk.yml/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubInfo.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            project_name: build.projectName,
            version_name: build.config.versionName
          }
        })
      })

      if (!triggerRes.ok) {
        const err = await triggerRes.text()
        if (triggerRes.status === 404) {
          throw new Error(`Arquivo 'build-apk.yml' não encontrado no GitHub. Certifique-se de fazer o COMMIT e PUSH do arquivo para o repositório antes de iniciar o build.`)
        }
        throw new Error(`Falha ao disparar GitHub Action: ${err}`)
      }

      addLog("[GitHub] Workflow disparado com sucesso. Monitorando execução...", "success")
      updateProgress(20)

      // 2. Poll for the latest run
      let runId = null
      let attempts = 0
      const maxAttempts = 10
      
      while (!runId && attempts < maxAttempts) {
        await delay(3000)
        const runsRes = await fetch(`https://api.github.com/repos/${githubInfo.repo}/actions/workflows/build-apk.yml/runs?per_page=1`, {
          headers: { 'Authorization': `token ${githubInfo.token}` }
        })
        const runsData = await runsRes.json()
        if (runsData.workflow_runs?.[0] && new Date(runsData.workflow_runs[0].created_at) > new Date(Date.now() - 30000)) {
          runId = runsData.workflow_runs[0].id
        }
        attempts++
      }

      if (!runId) {
        throw new Error("Não foi possível localizar o run da Action iniciada.")
      }

      addLog(`[GitHub] Run localizado: #${runId}. Monitorando progresso...`, "info")

      // 3. Monitor Run Status
      let status = "queued"
      let conclusion = null
      
      while (status !== "completed") {
        await delay(5000)
        const runStatusRes = await fetch(`https://api.github.com/repos/${githubInfo.repo}/actions/runs/${runId}`, {
          headers: { 'Authorization': `token ${githubInfo.token}` }
        })
        const runData = await runStatusRes.json()
        status = runData.status
        conclusion = runData.conclusion
        
        addLog(`[GitHub] Status: ${status === "in_progress" ? "Compilando..." : status}...`)
        if (status === "in_progress") updateProgress(Math.min(90, (builds.get(buildId)?.progress || 20) + 10))
      }

      if (conclusion !== "success") {
        throw new Error(`O build no GitHub falhou com conclusão: ${conclusion}`)
      }

      // 4. Finalize and find artifact link
      const apkUrl = `https://github.com/${githubInfo.repo}/actions/runs/${runId}`
      
      const qrDataUrl = await QRCode.toDataURL(apkUrl)

      const buildState = builds.get(buildId)
      if (buildState) {
        buildState.status = "completed"
        buildState.progress = 100
        buildState.apkUrl = apkUrl
        buildState.apkSize = 5242880 // 5MB simulated
        buildState.qrCode = qrDataUrl
        buildState.completedAt = new Date().toISOString()
        buildState.logs.push({
          timestamp: new Date().toISOString(),
          message: `[GitHub] BUILD REAL CONCLUÍDO COM SUCESSO!`,
          type: "success"
        })
        builds.set(buildId, buildState)
      }

    } else {
      // MODO SIMULADO (Original)
      updateProgress(5, "building")
      addLog(`Iniciando build simulado para ${build.projectName}...`, "info")
      await delay(1000)
      addLog("Validando projeto...")
      updateProgress(30)
      await delay(1500)
      addLog("Compilando Java e DEX...")
      updateProgress(60)
      await delay(1500)
      addLog("Assinando APK...")
      updateProgress(90)
      await delay(1000)

      const apkFileName = `${build.projectName.replace(/\s+/g, "_")}_v${build.config.versionName}.apk`
      const apkUrl = `/downloads/${apkFileName}`
      const qrDataUrl = await QRCode.toDataURL(`https://apexdroid.app${apkUrl}`)

      const buildState = builds.get(buildId)
      if (buildState) {
        buildState.status = "completed"
        buildState.progress = 100
        buildState.apkUrl = apkUrl
        buildState.apkSize = 3500000
        buildState.qrCode = qrDataUrl
        buildState.completedAt = new Date().toISOString()
        buildState.logs.push({
          timestamp: new Date().toISOString(),
          message: `BUILD SIMULADO CONCLUIDO! APK: ${apkFileName}`,
          type: "success"
        })
        builds.set(buildId, buildState)
      }
    }
  } catch (error: any) {
    const buildState = builds.get(buildId)
    if (buildState) {
      buildState.status = "failed"
      buildState.error = error.message
      buildState.logs.push({ timestamp: new Date().toISOString(), message: `ERRO: ${error.message}`, type: "error" })
      builds.set(buildId, buildState)
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
