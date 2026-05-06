export interface KodularComponent {
  $Type: string
  $Name: string
  $Components?: KodularComponent[]
  Text?: string
  Width?: string | number
  Height?: string | number
  BackgroundColor?: string
  TextColor?: string
  Title?: string
  TitleVisible?: string
  AlignHorizontal?: string
  AlignVertical?: string
  [key: string]: unknown
}

export interface ProjectData {
  Properties: KodularComponent
  [key: string]: unknown
}

export interface GitHubFile {
  repo: string
  path: string
  sha: string
  branch: string
  originalContent: string
  content: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

export interface Block {
  type: "event" | "action"
  component: string
  eventName: string
  summary: string
}

export interface AISettings {
  provider: string
  model: string
  apiKey: string
  baseUrl: string
}

export interface CloudUser {
  id: string
  name: string
  email: string
}

export interface BuildLog {
  timestamp: Date
  message: string
  type: "log" | "info" | "error" | "success" | "warning"
}

export interface BuildConfig {
  mode: "debug" | "release"
  packageName: string
  versionCode: number
  versionName: string
  minSdk: number
  targetSdk: number
  keystoreAlias?: string
}

export interface BuildResult {
  id: string
  status: "queued" | "building" | "completed" | "failed"
  progress: number
  apkUrl?: string
  apkSize?: number
  qrCode?: string
  startedAt: Date
  completedAt?: Date
  error?: string
}

export interface BuildHistoryItem {
  id: string
  projectName: string
  status: "completed" | "failed"
  apkUrl?: string
  apkSize?: number
  buildTime: number
  createdAt: Date
  config: BuildConfig
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  default_branch: string
  updated_at: string
}

export interface GitHubContent {
  name: string
  path: string
  sha: string
  size: number
  type: "file" | "dir"
  download_url: string | null
}

export interface GitHubTreeItem {
  path: string
  mode: string
  type: "blob" | "tree"
  sha: string
  size?: number
}

export interface ProjectAsset {
  name: string
  path: string
  url: string
  type: "image" | "audio" | "video" | "other"
}

export interface ScreenFile {
  name: string
  scmPath: string
  bkyPath: string | null
}

export interface Screen {
  name: string
  data: ProjectData | null
  bkyContent: string | null
}

export interface DragState {
  isDragging: boolean
  componentType: string | null
  sourceType: "palette" | "tree" | null
}

export interface HistorySnapshot {
  screens: Record<string, ProjectData>
  currentScreenName: string | null
  timestamp: number
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: "starter" | "business" | "social" | "utility"
  screens: {
    name: string
    data: ProjectData
  }[]
  preview?: string
}
