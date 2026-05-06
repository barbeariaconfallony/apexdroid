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

    // Start simulated build process
    simulateBuild(buildId, project)

    return NextResponse.json({
      buildId,
      status: "queued",
      message: "Build started successfully"
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

// Simulated build process
async function simulateBuild(buildId: string, project: unknown) {
  const build = builds.get(buildId)
  if (!build) return

  const addLog = (message: string, type: string = "log") => {
    const buildState = builds.get(buildId)
    if (buildState) {
      buildState.logs.push({
        timestamp: new Date().toISOString(),
        message,
        type
      })
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
    // Phase 1: Initialization
    updateProgress(5, "building")
    addLog(`Iniciando build para ${build.projectName}...`, "info")
    await delay(500)

    // Phase 2: Validating project
    updateProgress(10)
    addLog("Validando estrutura do projeto...")
    await delay(800)
    addLog("Analisando componentes SCM...")
    await delay(600)
    addLog("Verificando blocos BKY...")
    await delay(400)
    addLog("Projeto validado com sucesso", "success")
    updateProgress(20)

    // Phase 3: Processing assets
    addLog("Processando assets...")
    await delay(500)
    addLog("Otimizando imagens...")
    await delay(700)
    addLog("Comprimindo recursos...")
    await delay(500)
    updateProgress(35)

    // Phase 4: Generating code
    addLog("Gerando codigo Java...", "info")
    await delay(1000)
    addLog("Criando classes de componentes...")
    await delay(800)
    addLog("Gerando handlers de eventos...")
    await delay(600)
    addLog("Codigo gerado com sucesso", "success")
    updateProgress(50)

    // Phase 5: Compiling
    addLog("Compilando projeto...", "info")
    await delay(1200)
    addLog("Executando javac...")
    await delay(800)
    addLog("Gerando bytecode DEX...")
    await delay(1000)
    updateProgress(70)

    // Phase 6: Packaging
    addLog("Empacotando APK...")
    await delay(800)
    addLog("Adicionando AndroidManifest.xml...")
    await delay(400)
    addLog("Incluindo recursos compilados...")
    await delay(600)
    updateProgress(85)

    // Phase 7: Signing
    const mode = build.config.mode
    addLog(`Assinando APK (${mode})...`, "info")
    await delay(700)
    if (mode === "debug") {
      addLog("Usando keystore de debug...")
    } else {
      addLog("Usando keystore de release...")
    }
    await delay(500)
    addLog("APK assinado com sucesso", "success")
    updateProgress(95)

    // Phase 8: Finalizing
    addLog("Alinhando APK com zipalign...")
    await delay(400)
    
    // Generate fake APK URL and QR code
    const apkFileName = `${build.projectName.replace(/\s+/g, "_")}_v${build.config.versionName}.apk`
    const apkUrl = `/downloads/${apkFileName}`
    const apkSize = Math.floor(Math.random() * 5000000) + 2000000 // 2-7 MB

    // Generate QR Code
    const qrDataUrl = await QRCode.toDataURL(
      `https://apexdroid.app${apkUrl}`,
      {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      }
    )

    // Complete build
    const buildState = builds.get(buildId)
    if (buildState) {
      buildState.status = "completed"
      buildState.progress = 100
      buildState.apkUrl = apkUrl
      buildState.apkSize = apkSize
      buildState.qrCode = qrDataUrl
      buildState.completedAt = new Date().toISOString()
      buildState.logs.push({
        timestamp: new Date().toISOString(),
        message: `BUILD CONCLUIDO COM SUCESSO! APK: ${apkFileName} (${formatBytes(apkSize)})`,
        type: "success"
      })
      builds.set(buildId, buildState)
    }

  } catch (error) {
    const buildState = builds.get(buildId)
    if (buildState) {
      buildState.status = "failed"
      buildState.error = error instanceof Error ? error.message : "Unknown error"
      buildState.completedAt = new Date().toISOString()
      buildState.logs.push({
        timestamp: new Date().toISOString(),
        message: `ERRO: ${buildState.error}`,
        type: "error"
      })
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
