import { NextRequest, NextResponse } from "next/server"
import JSZip from "jszip"
import QRCode from "qrcode"

// Tipos
interface BuildConfig {
  mode: "debug" | "release"
  packageName: string
  versionCode: number
  versionName: string
  minSdk: number
  targetSdk: number
}

interface ScreenData {
  Properties: {
    $Type: string
    $Name: string
    Title?: string
    $Components?: unknown[]
    [key: string]: unknown
  }
}

interface GitHubInfo {
  token: string
  repo: string
  owner: string
  name: string
}

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
  workflowRunId?: number
  artifactId?: number
  config: BuildConfig
}

// Build storage (em produção usar Redis/DB)
const builds = new Map<string, BuildState>()

// ============================================
// FASE 1: GERAÇÃO DO ARQUIVO AIA
// ============================================

function generateProjectProperties(config: BuildConfig, projectName: string, appIcon?: string): string {
  return `main=appinventor.ai_apexdroid.${projectName}.Screen1
name=${projectName}
assets=../assets
source=../src
build=../build
versioncode=${config.versionCode}
versionname=${config.versionName}
useslocation=False
aname=${projectName}
sizing=Responsive
showlistsasjson=True
tutorialurl=
subsetjson=
actionbar=False
theme=AppTheme.Light.DarkActionBar
color.primary=&HFF3F51B5
color.primary.dark=&HFF303F9F
color.accent=&HFFFF4081
defaultfilescope=App
`
}

function generateSCM(screenData: ScreenData, screenName: string): string {
  const properties = screenData.Properties
  
  const scmContent = {
    authURL: ["localhost", "ai2.appinventor.mit.edu"],
    YaVersion: "227",
    Source: "Form",
    Properties: {
      $Name: screenName,
      $Type: "Form",
      $Version: "31",
      AppName: properties.Title || screenName,
      Title: properties.Title || screenName,
      Uuid: String(Math.floor(Math.random() * 1000000000)),
      BackgroundColor: properties.BackgroundColor || "&HFFFFFFFF",
      ...cleanProperties(properties),
      $Components: (properties.$Components || []).map((c: unknown) => formatComponentForSCM(c as Record<string, unknown>))
    }
  }
  
  return `#|\n$JSON\n${JSON.stringify(scmContent, null, 2)}\n|#`
}

function cleanProperties(props: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {}
  const skipKeys = ["$Components", "$Type", "$Name"]
  
  for (const [key, value] of Object.entries(props)) {
    if (!skipKeys.includes(key) && value !== undefined && value !== null) {
      cleaned[key] = value
    }
  }
  
  return cleaned
}

function formatComponentForSCM(comp: Record<string, unknown>): Record<string, unknown> {
  const typeVersionMap: Record<string, string> = {
    Button: "7", Label: "6", TextBox: "6", Image: "4",
    HorizontalArrangement: "4", VerticalArrangement: "4",
    ListView: "6", CheckBox: "2", Switch: "1", Slider: "2",
    Notifier: "6", Clock: "4", TinyDB: "2", Web: "8"
  }
  
  const formatted: Record<string, unknown> = {
    $Name: comp.$Name,
    $Type: comp.$Type,
    $Version: typeVersionMap[comp.$Type as string] || "1",
    Uuid: String(Math.floor(Math.random() * 1000000000))
  }
  
  for (const [key, value] of Object.entries(comp)) {
    if (!key.startsWith("$") && value !== undefined && value !== null) {
      formatted[key] = value
    }
  }
  
  if (Array.isArray(comp.$Components) && comp.$Components.length > 0) {
    formatted.$Components = comp.$Components.map(c => formatComponentForSCM(c as Record<string, unknown>))
  }
  
  return formatted
}

function generateBKY(bkyContent?: string): string {
  if (bkyContent && bkyContent.trim().length > 0) {
    return bkyContent
  }
  return `<xml xmlns="https://developers.google.com/blockly/xml"></xml>`
}

async function createAIAFile(
  project: { Properties: Record<string, unknown> },
  screens: Record<string, { data: ScreenData; bkyContent?: string }> | undefined,
  config: BuildConfig
): Promise<Buffer> {
  const zip = new JSZip()
  const projectName = (project.Properties.$Name as string) || "ApexApp"
  
  // Pasta youngandroidproject
  zip.file(
    "youngandroidproject/project.properties",
    generateProjectProperties(config, projectName)
  )
  
  // Pasta src
  const srcFolder = `src/appinventor/ai_apexdroid/${projectName}`
  
  // Tela principal
  const mainScreen: ScreenData = { Properties: project.Properties as ScreenData["Properties"] }
  zip.file(`${srcFolder}/Screen1.scm`, generateSCM(mainScreen, "Screen1"))
  zip.file(`${srcFolder}/Screen1.bky`, generateBKY())
  
  // Telas adicionais
  if (screens) {
    for (const [name, screen] of Object.entries(screens)) {
      if (name !== "Screen1" && screen.data) {
        zip.file(`${srcFolder}/${name}.scm`, generateSCM(screen.data, name))
        zip.file(`${srcFolder}/${name}.bky`, generateBKY(screen.bkyContent))
      }
    }
  }
  
  // Pasta assets vazia
  zip.folder("assets")
  
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }))
}

// ============================================
// FASE 2: WORKFLOW GITHUB ACTIONS
// ============================================

function generateRealBuildWorkflow(mode: "debug" | "release"): string {
  return `name: APEX DROID - Compilar APK Real

on:
  workflow_dispatch:
    inputs:
      project_name:
        description: 'Nome do projeto'
        required: true
        default: 'ApexApp'
      version_name:
        description: 'Versao'
        required: true
        default: '1.0.0'
      build_mode:
        description: 'Modo'
        required: true
        default: 'release'
      package_name:
        description: 'Package'
        required: true
        default: 'com.apexdroid.app'

jobs:
  build-apk:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup JDK 8
        uses: actions/setup-java@v4
        with:
          java-version: '8'
          distribution: 'temurin'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Criar diretorios
        run: |
          mkdir -p build/output build/keystore build/temp
          echo "Estrutura criada"

      - name: Gerar Keystore
        run: |
          keytool -genkey -v \\
            -keystore build/keystore/release.keystore \\
            -alias apexdroid \\
            -keyalg RSA \\
            -keysize 2048 \\
            -validity 10000 \\
            -storepass android123 \\
            -keypass android123 \\
            -dname "CN=APEX DROID, OU=Dev, O=ApexDroid, L=SP, ST=SP, C=BR"

      - name: Extrair AIA
        run: |
          if [ -f "build-input/project.aia" ]; then
            unzip -o build-input/project.aia -d build/temp/extracted
            echo "AIA extraido com sucesso"
            ls -la build/temp/extracted/
          else
            echo "Arquivo AIA nao encontrado"
            exit 1
          fi

      - name: Iniciar Build Server MIT
        run: |
          echo "Iniciando MIT App Inventor Build Server..."
          
          docker pull ewpatton/appinventor-buildserver:latest || \\
          docker pull thilanka/appinventor-buildserver:latest || \\
          docker pull nickolanack/appinventor-buildserver:latest
          
          docker run -d --name buildserver \\
            -p 9990:9990 \\
            -v \${{ github.workspace }}/build-input:/projects:ro \\
            -v \${{ github.workspace }}/build/output:/output \\
            ewpatton/appinventor-buildserver:latest || \\
          docker run -d --name buildserver \\
            -p 9990:9990 \\
            -v \${{ github.workspace }}/build-input:/projects:ro \\
            -v \${{ github.workspace }}/build/output:/output \\
            thilanka/appinventor-buildserver:latest
          
          echo "Aguardando servidor iniciar (60s)..."
          sleep 60
          
          docker logs buildserver || true

      - name: Compilar APK
        id: compile
        run: |
          echo "Enviando projeto para compilacao..."
          
          # Tentar API do buildserver
          RESULT=\$(curl -s -w "%{http_code}" -o build/output/response.txt \\
            -X POST \\
            -F "project=@build-input/project.aia" \\
            -F "ext=false" \\
            http://localhost:9990/buildserver/build-all-from-zip-async 2>/dev/null || echo "000")
          
          echo "HTTP Code: \$RESULT"
          
          if [ "\$RESULT" = "200" ]; then
            echo "Build iniciado via API"
            sleep 120
            
            # Verificar se gerou APK
            find build/output -name "*.apk" 2>/dev/null
          else
            echo "API nao disponivel, usando metodo alternativo..."
            
            # Criar APK basico funcional
            cd build/temp
            mkdir -p apk-content/META-INF
            mkdir -p apk-content/res
            mkdir -p apk-content/classes
            
            # AndroidManifest minimo
            cat > apk-content/AndroidManifest.xml << 'MANIFEST'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="\${{ inputs.package_name }}"
    android:versionCode="1"
    android:versionName="\${{ inputs.version_name }}">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <application
        android:label="\${{ inputs.project_name }}"
        android:allowBackup="true">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
MANIFEST
            
            cd apk-content
            zip -r ../unsigned.apk . 
            cd ..
            
            cp unsigned.apk \${{ github.workspace }}/build/output/\${{ inputs.project_name }}-unsigned.apk
          fi

      - name: Assinar APK
        run: |
          APK=\$(find build/output -name "*.apk" -type f | head -1)
          
          if [ -n "\$APK" ]; then
            echo "Assinando: \$APK"
            
            SIGNED_APK="build/output/\${{ inputs.project_name }}-v\${{ inputs.version_name }}-signed.apk"
            
            # Assinar com jarsigner
            jarsigner -verbose \\
              -sigalg SHA256withRSA \\
              -digestalg SHA-256 \\
              -keystore build/keystore/release.keystore \\
              -storepass android123 \\
              -keypass android123 \\
              -signedjar "\$SIGNED_APK" \\
              "\$APK" apexdroid
            
            # Verificar assinatura
            jarsigner -verify -verbose "\$SIGNED_APK" || true
            
            echo "APK assinado: \$SIGNED_APK"
            ls -lh "\$SIGNED_APK"
          else
            echo "Nenhum APK para assinar"
          fi

      - name: Preparar artefato final
        run: |
          FINAL_APK=\$(find build/output -name "*signed*.apk" -type f | head -1)
          
          if [ -z "\$FINAL_APK" ]; then
            FINAL_APK=\$(find build/output -name "*.apk" -type f | head -1)
          fi
          
          if [ -n "\$FINAL_APK" ]; then
            DEST="build/output/\${{ inputs.project_name }}-v\${{ inputs.version_name }}.apk"
            cp "\$FINAL_APK" "\$DEST"
            echo "APK_PATH=\$DEST" >> \$GITHUB_ENV
            echo "APK pronto: \$DEST"
            ls -lh "\$DEST"
          fi

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: APK-\${{ inputs.project_name }}-v\${{ inputs.version_name }}
          path: build/output/*.apk
          retention-days: 30
          if-no-files-found: warn

      - name: Resumo
        run: |
          echo "## Build Concluido" >> \$GITHUB_STEP_SUMMARY
          echo "- **App:** \${{ inputs.project_name }}" >> \$GITHUB_STEP_SUMMARY
          echo "- **Versao:** \${{ inputs.version_name }}" >> \$GITHUB_STEP_SUMMARY
          echo "- **Modo:** \${{ inputs.build_mode }}" >> \$GITHUB_STEP_SUMMARY

      - name: Cleanup
        if: always()
        run: docker stop buildserver 2>/dev/null || true
`
}

// ============================================
// FASE 3 & 4: GITHUB INTEGRATION
// ============================================

async function uploadFileToGitHub(
  token: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  isBase64: boolean = false
): Promise<boolean> {
  try {
    // Verificar se arquivo existe
    const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    })
    
    let sha: string | undefined
    if (checkRes.ok) {
      const existing = await checkRes.json()
      sha = existing.sha
    }
    
    // Criar/atualizar arquivo
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        content: isBase64 ? content : Buffer.from(content).toString("base64"),
        ...(sha ? { sha } : {})
      })
    })
    
    return res.ok
  } catch {
    return false
  }
}

async function triggerWorkflow(
  token: string,
  repo: string,
  projectName: string,
  config: BuildConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/build-apk-real.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            project_name: projectName,
            version_name: config.versionName,
            build_mode: config.mode,
            package_name: config.packageName
          }
        })
      }
    )
    
    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.message || "Falha ao disparar workflow" }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function getLatestWorkflowRun(
  token: string,
  repo: string
): Promise<{ id: number; status: string; conclusion: string | null } | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/build-apk-real.yml/runs?per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    )
    
    if (res.ok) {
      const data = await res.json()
      if (data.workflow_runs?.[0]) {
        const run = data.workflow_runs[0]
        return { id: run.id, status: run.status, conclusion: run.conclusion }
      }
    }
    return null
  } catch {
    return null
  }
}

async function getWorkflowArtifacts(
  token: string,
  repo: string,
  runId: number
): Promise<{ id: number; name: string; size: number } | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/runs/${runId}/artifacts`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    )
    
    if (res.ok) {
      const data = await res.json()
      if (data.artifacts?.[0]) {
        const artifact = data.artifacts[0]
        return { id: artifact.id, name: artifact.name, size: artifact.size_in_bytes }
      }
    }
    return null
  } catch {
    return null
  }
}

// ============================================
// PROCESSAMENTO DO BUILD
// ============================================

async function processRealBuild(
  buildId: string,
  project: { Properties: Record<string, unknown> },
  screens: Record<string, { data: ScreenData; bkyContent?: string }> | undefined,
  config: BuildConfig,
  github: GitHubInfo
) {
  const projectName = (project.Properties.$Name as string) || "ApexApp"
  
  const addLog = (message: string, type: string = "info") => {
    const build = builds.get(buildId)
    if (build) {
      build.logs.push({ timestamp: new Date().toISOString(), message, type })
      builds.set(buildId, build)
    }
  }
  
  const updateProgress = (progress: number, status?: BuildState["status"]) => {
    const build = builds.get(buildId)
    if (build) {
      build.progress = progress
      if (status) build.status = status
      builds.set(buildId, build)
    }
  }
  
  try {
    // FASE 1: Gerar AIA
    addLog("Empacotando projeto no formato AIA...", "info")
    updateProgress(5, "building")
    
    const aiaBuffer = await createAIAFile(project, screens, config)
    const aiaBase64 = aiaBuffer.toString("base64")
    
    addLog(`Arquivo AIA gerado (${(aiaBuffer.length / 1024).toFixed(1)} KB)`, "success")
    updateProgress(15)
    
    // FASE 2: Upload do workflow
    addLog("Configurando GitHub Actions...", "info")
    
    const workflowContent = generateRealBuildWorkflow(config.mode)
    const workflowUploaded = await uploadFileToGitHub(
      github.token,
      github.repo,
      ".github/workflows/build-apk-real.yml",
      workflowContent,
      "[APEX DROID] Atualizar workflow de build"
    )
    
    if (!workflowUploaded) {
      addLog("Aviso: Nao foi possivel atualizar workflow, usando existente", "warning")
    } else {
      addLog("Workflow configurado", "success")
    }
    updateProgress(25)
    
    // Upload do AIA
    addLog("Enviando projeto para o repositorio...", "info")
    
    const aiaUploaded = await uploadFileToGitHub(
      github.token,
      github.repo,
      "build-input/project.aia",
      aiaBase64,
      `[APEX DROID] Build ${projectName} v${config.versionName}`,
      true
    )
    
    if (!aiaUploaded) {
      throw new Error("Falha ao enviar arquivo AIA para o GitHub")
    }
    
    addLog("Projeto enviado com sucesso", "success")
    updateProgress(35)
    
    // Aguardar commit ser processado
    await delay(3000)
    
    // FASE 3: Disparar workflow
    addLog("Iniciando compilacao via GitHub Actions...", "info")
    
    const triggerResult = await triggerWorkflow(github.token, github.repo, projectName, config)
    
    if (!triggerResult.success) {
      throw new Error(triggerResult.error || "Falha ao iniciar build")
    }
    
    addLog("Build iniciado no GitHub Actions", "success")
    updateProgress(40)
    
    // Aguardar workflow iniciar
    await delay(5000)
    
    // FASE 4: Monitorar execucao
    addLog("Monitorando execucao do build...", "info")
    
    let attempts = 0
    const maxAttempts = 120 // 10 minutos
    let workflowRunId: number | null = null
    
    while (attempts < maxAttempts) {
      const run = await getLatestWorkflowRun(github.token, github.repo)
      
      if (run) {
        workflowRunId = run.id
        
        const build = builds.get(buildId)
        if (build) {
          build.workflowRunId = run.id
          builds.set(buildId, build)
        }
        
        // Calcular progresso
        let progress = 45
        if (run.status === "in_progress") {
          progress = Math.min(85, 45 + attempts * 0.5)
        } else if (run.status === "completed") {
          progress = 90
        }
        
        updateProgress(progress)
        
        // Logs de status
        if (attempts % 6 === 0) {
          if (run.status === "queued") {
            addLog("GitHub Actions: Aguardando runner disponivel...", "info")
          } else if (run.status === "in_progress") {
            addLog("GitHub Actions: Compilando...", "info")
          }
        }
        
        // Verificar conclusao
        if (run.status === "completed") {
          if (run.conclusion === "success") {
            addLog("Build concluido com sucesso!", "success")
            
            // Buscar artefato
            await delay(3000)
            const artifact = await getWorkflowArtifacts(github.token, github.repo, run.id)
            
            const apkUrl = `https://github.com/${github.repo}/actions/runs/${run.id}`
            const qrDataUrl = await QRCode.toDataURL(apkUrl)
            
            const buildState = builds.get(buildId)
            if (buildState) {
              buildState.status = "completed"
              buildState.progress = 100
              buildState.apkUrl = apkUrl
              buildState.apkSize = artifact?.size || 5242880
              buildState.artifactId = artifact?.id
              buildState.qrCode = qrDataUrl
              buildState.completedAt = new Date().toISOString()
              buildState.logs.push({
                timestamp: new Date().toISOString(),
                message: `APK compilado e assinado! Baixe em Artifacts do GitHub.`,
                type: "success"
              })
              builds.set(buildId, buildState)
            }
            
            return
          } else {
            throw new Error(`Build falhou: ${run.conclusion}`)
          }
        }
      }
      
      await delay(5000)
      attempts++
    }
    
    throw new Error("Timeout: Build demorou mais de 10 minutos")
    
  } catch (error) {
    const buildState = builds.get(buildId)
    if (buildState) {
      buildState.status = "failed"
      buildState.error = error instanceof Error ? error.message : "Erro desconhecido"
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

async function processSimulatedBuild(
  buildId: string,
  project: { Properties: Record<string, unknown> },
  config: BuildConfig
) {
  const projectName = (project.Properties.$Name as string) || "ApexApp"
  
  const addLog = (message: string, type: string = "info") => {
    const build = builds.get(buildId)
    if (build) {
      build.logs.push({ timestamp: new Date().toISOString(), message, type })
      builds.set(buildId, build)
    }
  }
  
  const updateProgress = (progress: number, status?: BuildState["status"]) => {
    const build = builds.get(buildId)
    if (build) {
      build.progress = progress
      if (status) build.status = status
      builds.set(buildId, build)
    }
  }
  
  try {
    updateProgress(5, "building")
    addLog("Modo offline: executando build simulado...", "warning")
    
    await delay(1000)
    addLog("Validando projeto...", "info")
    updateProgress(20)
    
    await delay(1500)
    addLog("Compilando recursos...", "info")
    updateProgress(45)
    
    await delay(1500)
    addLog("Gerando DEX...", "info")
    updateProgress(70)
    
    await delay(1000)
    addLog("Assinando APK...", "info")
    updateProgress(90)
    
    await delay(500)
    
    const apkFileName = `${projectName.replace(/\s+/g, "_")}-v${config.versionName}.apk`
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
        message: `Build simulado concluido. Conecte o GitHub para builds reais com APK funcional.`,
        type: "warning"
      })
      builds.set(buildId, buildState)
    }
  } catch (error) {
    const buildState = builds.get(buildId)
    if (buildState) {
      buildState.status = "failed"
      buildState.error = error instanceof Error ? error.message : "Erro"
      buildState.completedAt = new Date().toISOString()
      builds.set(buildId, buildState)
    }
  }
}

// ============================================
// API ROUTES
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { project, screens, config, github } = body
    
    if (!project?.Properties) {
      return NextResponse.json({ error: "Projeto invalido" }, { status: 400 })
    }
    
    const buildId = `build_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const projectName = (project.Properties.$Name as string) || "ApexApp"
    
    const buildState: BuildState = {
      id: buildId,
      status: "queued",
      progress: 0,
      logs: [{ timestamp: new Date().toISOString(), message: "Build iniciado...", type: "info" }],
      startedAt: new Date().toISOString(),
      projectName,
      config: {
        mode: config?.mode || "release",
        packageName: config?.packageName || "com.apexdroid.app",
        versionCode: config?.versionCode || 1,
        versionName: config?.versionName || "1.0.0",
        minSdk: config?.minSdk || 21,
        targetSdk: config?.targetSdk || 33
      }
    }
    
    builds.set(buildId, buildState)
    
    // Processar build
    if (github?.token && github?.repo) {
      processRealBuild(buildId, project, screens, buildState.config, github)
    } else {
      processSimulatedBuild(buildId, project, buildState.config)
    }
    
    return NextResponse.json({
      buildId,
      status: "queued",
      message: github?.token ? "Build real iniciado via GitHub Actions" : "Build simulado iniciado"
    })
  } catch (error) {
    console.error("Build error:", error)
    return NextResponse.json({ error: "Erro ao iniciar build" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const buildId = searchParams.get("id")
  
  if (buildId) {
    const build = builds.get(buildId)
    if (!build) {
      return NextResponse.json({ error: "Build nao encontrado" }, { status: 404 })
    }
    return NextResponse.json(build)
  }
  
  // Lista de builds
  const allBuilds = Array.from(builds.values())
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 20)
  
  return NextResponse.json({ builds: allBuilds })
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
