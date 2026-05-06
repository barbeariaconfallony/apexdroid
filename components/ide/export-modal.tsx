"use client"

import { useState } from "react"
import JSZip from "jszip"
import { 
  Download, X, FileCode, FolderOpen, Package, 
  Check, Loader2, Code2, FileText, Smartphone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import { toast } from "./toast"
import type { ProjectData, KodularComponent } from "@/lib/ide-types"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

type ExportFormat = "android-studio" | "kodular" | "json"

// Generate Android Studio project structure
function generateAndroidStudioProject(
  projectData: ProjectData,
  projectName: string,
  packageName: string
): Record<string, string> {
  const files: Record<string, string> = {}
  const screenName = projectData.Properties.$Name || "MainActivity"
  
  // build.gradle (project level)
  files["build.gradle"] = `// Top-level build file
plugins {
    id 'com.android.application' version '8.2.0' apply false
    id 'org.jetbrains.kotlin.android' version '1.9.21' apply false
}
`

  // settings.gradle
  files["settings.gradle"] = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${projectName}"
include ':app'
`

  // gradle.properties
  files["gradle.properties"] = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`

  // app/build.gradle
  files["app/build.gradle"] = `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace '${packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${packageName}"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = '1.8'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
}
`

  // AndroidManifest.xml
  files["app/src/main/AndroidManifest.xml"] = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${projectName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Material3.Light.NoActionBar"
        tools:targetApi="31">
        <activity
            android:name=".${screenName}"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`

  // MainActivity.kt
  files[`app/src/main/java/${packageName.replace(/\./g, "/")}/${screenName}.kt`] = generateKotlinActivity(projectData, packageName)
  
  // Layout XML
  files[`app/src/main/res/layout/activity_${screenName.toLowerCase()}.xml`] = generateLayoutXml(projectData)
  
  // colors.xml
  files["app/src/main/res/values/colors.xml"] = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">#6200EE</color>
    <color name="primary_dark">#3700B3</color>
    <color name="accent">#03DAC5</color>
    <color name="white">#FFFFFF</color>
    <color name="black">#000000</color>
</resources>
`

  // strings.xml
  files["app/src/main/res/values/strings.xml"] = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${projectName}</string>
</resources>
`

  // themes.xml
  files["app/src/main/res/values/themes.xml"] = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.${projectName.replace(/\s/g, "")}" parent="Theme.Material3.Light.NoActionBar">
        <item name="colorPrimary">@color/primary</item>
        <item name="colorPrimaryDark">@color/primary_dark</item>
        <item name="colorAccent">@color/accent</item>
    </style>
</resources>
`

  return files
}

// Generate Kotlin Activity
function generateKotlinActivity(projectData: ProjectData, packageName: string): string {
  const screenName = projectData.Properties.$Name || "MainActivity"
  const components = projectData.Properties.$Components || []
  
  let code = `package ${packageName}

import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity

class ${screenName} : AppCompatActivity() {

`

  // Declare component variables
  components.forEach(comp => {
    const type = getKotlinWidgetType(comp.$Type)
    if (type) {
      code += `    private lateinit var ${comp.$Name.toLowerCase()}: ${type}\n`
    }
  })

  code += `
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_${screenName.toLowerCase()})
        
        initViews()
        setupListeners()
    }

    private fun initViews() {
`

  // Initialize components
  components.forEach(comp => {
    const type = getKotlinWidgetType(comp.$Type)
    if (type) {
      code += `        ${comp.$Name.toLowerCase()} = findViewById(R.id.${comp.$Name.toLowerCase()})\n`
    }
  })

  code += `    }

    private fun setupListeners() {
`

  // Add click listeners for buttons
  components.filter(c => c.$Type === "Button").forEach(comp => {
    code += `        ${comp.$Name.toLowerCase()}.setOnClickListener {
            // TODO: Handle ${comp.$Name} click
        }
`
  })

  code += `    }
}
`

  return code
}

function getKotlinWidgetType(kodularType: string): string | null {
  const mapping: Record<string, string> = {
    "Button": "Button",
    "Label": "TextView",
    "TextBox": "EditText",
    "PasswordTextBox": "EditText",
    "Image": "ImageView",
    "CheckBox": "CheckBox",
    "Switch": "Switch",
    "Slider": "SeekBar",
    "Spinner": "Spinner",
    "ListView": "ListView",
    "WebViewer": "WebView",
    "VideoPlayer": "VideoView",
  }
  return mapping[kodularType] || null
}

// Generate Layout XML
function generateLayoutXml(projectData: ProjectData): string {
  const props = projectData.Properties
  
  let xml = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="${convertKodularColorToAndroid(props.BackgroundColor)}">

`

  // Generate components
  props.$Components?.forEach(comp => {
    xml += generateComponentXml(comp, "    ")
  })

  xml += `</LinearLayout>
`

  return xml
}

function generateComponentXml(comp: KodularComponent, indent: string): string {
  const id = `@+id/${comp.$Name.toLowerCase()}`
  const width = comp.Width === "-2" ? "match_parent" : comp.Width === "-1" ? "wrap_content" : `${comp.Width}dp`
  const height = comp.Height === "-2" ? "match_parent" : comp.Height === "-1" ? "wrap_content" : `${comp.Height}dp`
  
  let xml = ""
  
  switch (comp.$Type) {
    case "Button":
      xml = `${indent}<Button
${indent}    android:id="${id}"
${indent}    android:layout_width="${width}"
${indent}    android:layout_height="${height}"
${indent}    android:text="${comp.Text || "Button"}" />

`
      break
      
    case "Label":
      xml = `${indent}<TextView
${indent}    android:id="${id}"
${indent}    android:layout_width="${width}"
${indent}    android:layout_height="${height}"
${indent}    android:text="${comp.Text || "Label"}" />

`
      break
      
    case "TextBox":
      xml = `${indent}<EditText
${indent}    android:id="${id}"
${indent}    android:layout_width="${width}"
${indent}    android:layout_height="${height}"
${indent}    android:hint="${comp.Hint || ""}" />

`
      break
      
    case "Image":
      xml = `${indent}<ImageView
${indent}    android:id="${id}"
${indent}    android:layout_width="${width}"
${indent}    android:layout_height="${height}"
${indent}    android:scaleType="fitCenter" />

`
      break
      
    case "VerticalArrangement":
      xml = `${indent}<LinearLayout
${indent}    android:id="${id}"
${indent}    android:layout_width="${width}"
${indent}    android:layout_height="${height}"
${indent}    android:orientation="vertical">
`
      comp.$Components?.forEach(child => {
        xml += generateComponentXml(child, indent + "    ")
      })
      xml += `${indent}</LinearLayout>

`
      break
      
    case "HorizontalArrangement":
      xml = `${indent}<LinearLayout
${indent}    android:id="${id}"
${indent}    android:layout_width="${width}"
${indent}    android:layout_height="${height}"
${indent}    android:orientation="horizontal">
`
      comp.$Components?.forEach(child => {
        xml += generateComponentXml(child, indent + "    ")
      })
      xml += `${indent}</LinearLayout>

`
      break
      
    default:
      xml = `${indent}<!-- ${comp.$Type}: ${comp.$Name} -->

`
  }
  
  return xml
}

function convertKodularColorToAndroid(color?: string): string {
  if (!color || color === "None") return "#FFFFFF"
  if (color.startsWith("&H")) {
    const hex = color.substring(2)
    if (hex.length === 8) {
      // ARGB to Android format
      return `#${hex.substring(2)}${hex.substring(0, 2)}`
    }
    return `#${hex}`
  }
  return color
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { currentProject, selectedRepo, currentScreenName } = useIDEStore()
  const [exportFormat, setExportFormat] = useState<ExportFormat>("android-studio")
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [packageName, setPackageName] = useState("com.example.myapp")
  
  const projectName = selectedRepo?.name || currentProject?.Properties?.$Name || "MyApp"
  
  const handleExport = async () => {
    if (!currentProject) {
      toast.error("Nenhum projeto carregado")
      return
    }
    
    setIsExporting(true)
    setProgress(0)
    
    try {
      const zip = new JSZip()
      
      if (exportFormat === "android-studio") {
        setProgress(20)
        const files = generateAndroidStudioProject(currentProject, projectName, packageName)
        
        setProgress(50)
        Object.entries(files).forEach(([path, content]) => {
          zip.file(path, content)
        })
        
        setProgress(80)
      } else if (exportFormat === "kodular") {
        // Export as Kodular/App Inventor .aia format
        const scmContent = `#|\n$JSON\n${JSON.stringify(currentProject, null, 2)}\n|#`
        zip.file(`${currentScreenName || "Screen1"}.scm`, scmContent)
        setProgress(80)
      } else {
        // Export as JSON
        zip.file(`${projectName}.json`, JSON.stringify(currentProject, null, 2))
        setProgress(80)
      }
      
      // Generate ZIP
      const blob = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 9 }
      })
      
      setProgress(100)
      
      // Download
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${projectName}_${exportFormat}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success("Projeto exportado com sucesso!")
      onClose()
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast.error("Erro ao exportar projeto")
    } finally {
      setIsExporting(false)
      setProgress(0)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div 
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Exportar Projeto</h2>
          </div>
          <X 
            className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground" 
            onClick={onClose}
          />
        </div>
        
        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Project Info */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{projectName}</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">{currentScreenName || "Screen1"}</span>
            </div>
          </div>
          
          {/* Export Format Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Formato de Exportacao</label>
            
            <div className="grid gap-2">
              <button
                onClick={() => setExportFormat("android-studio")}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  exportFormat === "android-studio"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  exportFormat === "android-studio" ? "bg-primary/10" : "bg-secondary"
                )}>
                  <Code2 className={cn(
                    "w-5 h-5",
                    exportFormat === "android-studio" ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Android Studio</div>
                  <div className="text-xs text-muted-foreground">
                    Projeto completo com Kotlin, Gradle e XML
                  </div>
                </div>
                {exportFormat === "android-studio" && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
              
              <button
                onClick={() => setExportFormat("kodular")}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  exportFormat === "kodular"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  exportFormat === "kodular" ? "bg-primary/10" : "bg-secondary"
                )}>
                  <Package className={cn(
                    "w-5 h-5",
                    exportFormat === "kodular" ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Kodular / App Inventor</div>
                  <div className="text-xs text-muted-foreground">
                    Formato .aia compativel com Kodular
                  </div>
                </div>
                {exportFormat === "kodular" && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
              
              <button
                onClick={() => setExportFormat("json")}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  exportFormat === "json"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  exportFormat === "json" ? "bg-primary/10" : "bg-secondary"
                )}>
                  <FileText className={cn(
                    "w-5 h-5",
                    exportFormat === "json" ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">JSON</div>
                  <div className="text-xs text-muted-foreground">
                    Dados do projeto em formato JSON
                  </div>
                </div>
                {exportFormat === "json" && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            </div>
          </div>
          
          {/* Package Name (for Android Studio) */}
          {exportFormat === "android-studio" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Pacote</label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:border-primary"
                placeholder="com.example.myapp"
              />
              <p className="text-xs text-muted-foreground">
                Ex: com.empresa.nomedoapp
              </p>
            </div>
          )}
          
          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Exportando...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !currentProject} className="gap-2">
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exportar
          </Button>
        </div>
      </div>
    </div>
  )
}
