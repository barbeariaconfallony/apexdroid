"use client"

import { useState } from "react"
import { 
  X, Layout, LogIn, CheckSquare, Cloud, ShoppingCart, 
  MessageCircle, Calculator, Music, Camera, Map,
  Zap, ChevronRight, Star, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import { toast } from "./toast"
import type { ProjectData, KodularComponent } from "@/lib/ide-types"

interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: "starter" | "business" | "social" | "utility"
  difficulty: "beginner" | "intermediate" | "advanced"
  screens: number
  components: number
  data: ProjectData[]
}

// Template definitions
const projectTemplates: ProjectTemplate[] = [
  {
    id: "blank",
    name: "Projeto Vazio",
    description: "Comece do zero com uma tela em branco",
    icon: Layout,
    category: "starter",
    difficulty: "beginner",
    screens: 1,
    components: 0,
    data: [{
      Properties: {
        $Type: "Form",
        $Name: "Screen1",
        Title: "Meu App",
        BackgroundColor: "&HFFFFFFFF",
        $Components: []
      }
    }]
  },
  {
    id: "login",
    name: "Tela de Login",
    description: "Login com email e senha, botao de registro",
    icon: LogIn,
    category: "starter",
    difficulty: "beginner",
    screens: 2,
    components: 8,
    data: [{
      Properties: {
        $Type: "Form",
        $Name: "LoginScreen",
        Title: "Login",
        BackgroundColor: "&HFFFFFFFF",
        AlignHorizontal: "2",
        AlignVertical: "2",
        $Components: [
          {
            $Type: "VerticalArrangement",
            $Name: "LoginContainer",
            Width: "-2",
            Height: "-1",
            AlignHorizontal: "2",
            Padding: "16",
            $Components: [
              {
                $Type: "Image",
                $Name: "Logo",
                Width: "100",
                Height: "100"
              },
              {
                $Type: "Label",
                $Name: "TitleLabel",
                Text: "Bem-vindo",
                FontSize: "24",
                FontBold: "True",
                TextColor: "&HFF000000"
              },
              {
                $Type: "Label",
                $Name: "SubtitleLabel",
                Text: "Entre com sua conta",
                FontSize: "14",
                TextColor: "&HFF888888"
              },
              {
                $Type: "TextBox",
                $Name: "EmailInput",
                Hint: "Email",
                Width: "-2"
              },
              {
                $Type: "PasswordTextBox",
                $Name: "PasswordInput",
                Hint: "Senha",
                Width: "-2"
              },
              {
                $Type: "Button",
                $Name: "LoginButton",
                Text: "Entrar",
                Width: "-2",
                BackgroundColor: "&HFF6200EE",
                TextColor: "&HFFFFFFFF"
              },
              {
                $Type: "Button",
                $Name: "RegisterButton",
                Text: "Criar conta",
                Width: "-2",
                BackgroundColor: "&H00FFFFFF",
                TextColor: "&HFF6200EE"
              }
            ]
          }
        ]
      }
    }]
  },
  {
    id: "todo",
    name: "Lista de Tarefas",
    description: "App de tarefas com adicionar, marcar e excluir",
    icon: CheckSquare,
    category: "utility",
    difficulty: "intermediate",
    screens: 1,
    components: 10,
    data: [{
      Properties: {
        $Type: "Form",
        $Name: "TodoScreen",
        Title: "Minhas Tarefas",
        BackgroundColor: "&HFFF5F5F5",
        $Components: [
          {
            $Type: "VerticalArrangement",
            $Name: "MainContainer",
            Width: "-2",
            Height: "-2",
            Padding: "16",
            $Components: [
              {
                $Type: "HorizontalArrangement",
                $Name: "InputRow",
                Width: "-2",
                Height: "-1",
                $Components: [
                  {
                    $Type: "TextBox",
                    $Name: "TaskInput",
                    Hint: "Nova tarefa...",
                    Width: "-2"
                  },
                  {
                    $Type: "Button",
                    $Name: "AddButton",
                    Text: "+",
                    Width: "50",
                    BackgroundColor: "&HFF4CAF50",
                    TextColor: "&HFFFFFFFF"
                  }
                ]
              },
              {
                $Type: "ListView",
                $Name: "TaskList",
                Width: "-2",
                Height: "-2",
                Elements: "Tarefa 1,Tarefa 2,Tarefa 3"
              }
            ]
          }
        ]
      }
    }]
  },
  {
    id: "weather",
    name: "App de Clima",
    description: "Exibe clima atual com icones e previsao",
    icon: Cloud,
    category: "utility",
    difficulty: "intermediate",
    screens: 1,
    components: 12,
    data: [{
      Properties: {
        $Type: "Form",
        $Name: "WeatherScreen",
        Title: "Clima",
        BackgroundColor: "&HFF87CEEB",
        AlignHorizontal: "2",
        $Components: [
          {
            $Type: "VerticalArrangement",
            $Name: "WeatherContainer",
            Width: "-2",
            Height: "-1",
            AlignHorizontal: "2",
            Padding: "24",
            $Components: [
              {
                $Type: "Label",
                $Name: "CityLabel",
                Text: "Sao Paulo",
                FontSize: "28",
                FontBold: "True",
                TextColor: "&HFFFFFFFF"
              },
              {
                $Type: "Image",
                $Name: "WeatherIcon",
                Width: "120",
                Height: "120"
              },
              {
                $Type: "Label",
                $Name: "TempLabel",
                Text: "25°C",
                FontSize: "64",
                FontBold: "True",
                TextColor: "&HFFFFFFFF"
              },
              {
                $Type: "Label",
                $Name: "ConditionLabel",
                Text: "Parcialmente Nublado",
                FontSize: "18",
                TextColor: "&HFFFFFFFF"
              },
              {
                $Type: "HorizontalArrangement",
                $Name: "DetailsRow",
                Width: "-2",
                Height: "-1",
                $Components: [
                  {
                    $Type: "Label",
                    $Name: "HumidityLabel",
                    Text: "Umidade: 65%",
                    TextColor: "&HFFFFFFFF"
                  },
                  {
                    $Type: "Label",
                    $Name: "WindLabel",
                    Text: "Vento: 12 km/h",
                    TextColor: "&HFFFFFFFF"
                  }
                ]
              }
            ]
          }
        ]
      }
    }]
  },
  {
    id: "calculator",
    name: "Calculadora",
    description: "Calculadora basica com operacoes matematicas",
    icon: Calculator,
    category: "utility",
    difficulty: "beginner",
    screens: 1,
    components: 20,
    data: [{
      Properties: {
        $Type: "Form",
        $Name: "CalculatorScreen",
        Title: "Calculadora",
        BackgroundColor: "&HFF1A1A2E",
        $Components: [
          {
            $Type: "VerticalArrangement",
            $Name: "CalcContainer",
            Width: "-2",
            Height: "-2",
            Padding: "16",
            $Components: [
              {
                $Type: "Label",
                $Name: "Display",
                Text: "0",
                FontSize: "48",
                TextColor: "&HFFFFFFFF",
                Width: "-2",
                TextAlignment: "2"
              },
              {
                $Type: "HorizontalArrangement",
                $Name: "Row1",
                Width: "-2",
                $Components: [
                  { $Type: "Button", $Name: "Btn7", Text: "7", Width: "70", Height: "70", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF" },
                  { $Type: "Button", $Name: "Btn8", Text: "8", Width: "70", Height: "70", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF" },
                  { $Type: "Button", $Name: "Btn9", Text: "9", Width: "70", Height: "70", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF" },
                  { $Type: "Button", $Name: "BtnDiv", Text: "/", Width: "70", Height: "70", BackgroundColor: "&HFFFF9500", TextColor: "&HFFFFFFFF" }
                ]
              },
              {
                $Type: "HorizontalArrangement",
                $Name: "Row2",
                Width: "-2",
                $Components: [
                  { $Type: "Button", $Name: "Btn4", Text: "4", Width: "70", Height: "70", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF" },
                  { $Type: "Button", $Name: "Btn5", Text: "5", Width: "70", Height: "70", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF" },
                  { $Type: "Button", $Name: "Btn6", Text: "6", Width: "70", Height: "70", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF" },
                  { $Type: "Button", $Name: "BtnMul", Text: "x", Width: "70", Height: "70", BackgroundColor: "&HFFFF9500", TextColor: "&HFFFFFFFF" }
                ]
              },
              {
                $Type: "HorizontalArrangement",
                $Name: "Row3",
                Width: "-2",
                $Components: [
                  { $Type: "Button", $Name: "Btn1", Text: "1", Width: "70", Height: "70", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF" },
                  { $Type: "Button", $Name: "Btn2", Text: "2", Width: "70", Height: "70", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF" },
                  { $Type: "Button", $Name: "Btn3", Text: "3", Width: "70", Height: "70", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF" },
                  { $Type: "Button", $Name: "BtnSub", Text: "-", Width: "70", Height: "70", BackgroundColor: "&HFFFF9500", TextColor: "&HFFFFFFFF" }
                ]
              },
              {
                $Type: "HorizontalArrangement",
                $Name: "Row4",
                Width: "-2",
                $Components: [
                  { $Type: "Button", $Name: "Btn0", Text: "0", Width: "145", Height: "70", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF" },
                  { $Type: "Button", $Name: "BtnDot", Text: ".", Width: "70", Height: "70", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF" },
                  { $Type: "Button", $Name: "BtnAdd", Text: "+", Width: "70", Height: "70", BackgroundColor: "&HFFFF9500", TextColor: "&HFFFFFFFF" }
                ]
              },
              {
                $Type: "Button",
                $Name: "BtnEquals",
                Text: "=",
                Width: "-2",
                Height: "60",
                BackgroundColor: "&HFF4CAF50",
                TextColor: "&HFFFFFFFF"
              }
            ]
          }
        ]
      }
    }]
  },
  {
    id: "chat",
    name: "App de Chat",
    description: "Interface de chat com mensagens e input",
    icon: MessageCircle,
    category: "social",
    difficulty: "advanced",
    screens: 2,
    components: 15,
    data: [{
      Properties: {
        $Type: "Form",
        $Name: "ChatScreen",
        Title: "Chat",
        BackgroundColor: "&HFFF0F0F0",
        $Components: [
          {
            $Type: "VerticalArrangement",
            $Name: "ChatContainer",
            Width: "-2",
            Height: "-2",
            $Components: [
              {
                $Type: "VerticalScrollArrangement",
                $Name: "MessagesArea",
                Width: "-2",
                Height: "-2",
                BackgroundColor: "&HFFF5F5F5",
                $Components: [
                  {
                    $Type: "CardView",
                    $Name: "Message1",
                    Width: "-1",
                    $Components: [
                      {
                        $Type: "Label",
                        $Name: "MsgText1",
                        Text: "Ola! Como vai?",
                        TextColor: "&HFF000000"
                      }
                    ]
                  }
                ]
              },
              {
                $Type: "HorizontalArrangement",
                $Name: "InputArea",
                Width: "-2",
                Height: "-1",
                BackgroundColor: "&HFFFFFFFF",
                Padding: "8",
                $Components: [
                  {
                    $Type: "TextBox",
                    $Name: "MessageInput",
                    Hint: "Digite sua mensagem...",
                    Width: "-2"
                  },
                  {
                    $Type: "Button",
                    $Name: "SendButton",
                    Text: "Enviar",
                    BackgroundColor: "&HFF6200EE",
                    TextColor: "&HFFFFFFFF"
                  }
                ]
              }
            ]
          }
        ]
      }
    }]
  },
  {
    id: "ecommerce",
    name: "Loja Virtual",
    description: "Catalogo de produtos com carrinho",
    icon: ShoppingCart,
    category: "business",
    difficulty: "advanced",
    screens: 3,
    components: 25,
    data: [{
      Properties: {
        $Type: "Form",
        $Name: "StoreScreen",
        Title: "Minha Loja",
        BackgroundColor: "&HFFFFFFFF",
        $Components: [
          {
            $Type: "VerticalArrangement",
            $Name: "StoreContainer",
            Width: "-2",
            Height: "-2",
            $Components: [
              {
                $Type: "HorizontalArrangement",
                $Name: "SearchBar",
                Width: "-2",
                Height: "-1",
                Padding: "12",
                BackgroundColor: "&HFFF5F5F5",
                $Components: [
                  {
                    $Type: "TextBox",
                    $Name: "SearchInput",
                    Hint: "Buscar produtos...",
                    Width: "-2"
                  }
                ]
              },
              {
                $Type: "Label",
                $Name: "CategoriesLabel",
                Text: "Categorias",
                FontSize: "18",
                FontBold: "True",
                TextColor: "&HFF000000"
              },
              {
                $Type: "HorizontalScrollArrangement",
                $Name: "CategoriesRow",
                Width: "-2",
                Height: "-1",
                $Components: [
                  { $Type: "Button", $Name: "Cat1", Text: "Eletronicos", BackgroundColor: "&HFF6200EE", TextColor: "&HFFFFFFFF" },
                  { $Type: "Button", $Name: "Cat2", Text: "Roupas", BackgroundColor: "&HFFE0E0E0", TextColor: "&HFF000000" },
                  { $Type: "Button", $Name: "Cat3", Text: "Casa", BackgroundColor: "&HFFE0E0E0", TextColor: "&HFF000000" }
                ]
              },
              {
                $Type: "Label",
                $Name: "ProductsLabel",
                Text: "Produtos em Destaque",
                FontSize: "18",
                FontBold: "True",
                TextColor: "&HFF000000"
              },
              {
                $Type: "VerticalScrollArrangement",
                $Name: "ProductsList",
                Width: "-2",
                Height: "-2",
                $Components: [
                  {
                    $Type: "CardView",
                    $Name: "Product1",
                    Width: "-2",
                    $Components: [
                      {
                        $Type: "HorizontalArrangement",
                        $Name: "ProductRow1",
                        $Components: [
                          { $Type: "Image", $Name: "ProductImg1", Width: "80", Height: "80" },
                          {
                            $Type: "VerticalArrangement",
                            $Name: "ProductInfo1",
                            $Components: [
                              { $Type: "Label", $Name: "ProductName1", Text: "Smartphone XYZ", FontBold: "True" },
                              { $Type: "Label", $Name: "ProductPrice1", Text: "R$ 1.299,00", TextColor: "&HFF4CAF50" }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    }]
  }
]

// Category metadata
const categories = [
  { id: "all", name: "Todos", icon: Layout, type: "template" },
  { id: "starter", name: "Iniciante", icon: Star, type: "template" },
  { id: "utility", name: "Utilidades", icon: Calculator, type: "template" },
  { id: "social", name: "Social", icon: MessageCircle, type: "template" },
  { id: "business", name: "Negocios", icon: ShoppingCart, type: "template" },
  { id: "ext_ui", name: "Ext. UI", icon: Zap, type: "extension" },
  { id: "ext_api", name: "Ext. API", icon: Cloud, type: "extension" },
]

const extensions = [
  {
    id: "ext_lottie",
    name: "Lottie Animations",
    description: "Adicione animações JSON leves ao seu app.",
    author: "APEX Team",
    price: "Gratis",
    rating: 4.8,
    installs: "12k",
    icon: Zap
  },
  {
    id: "ext_firebase",
    name: "Firebase Connector",
    description: "Integração completa com Firestore e Auth.",
    author: "Google",
    price: "Gratis",
    rating: 4.9,
    installs: "45k",
    icon: Cloud
  }
]

interface TemplatesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TemplatesModal({ isOpen, onClose }: TemplatesModalProps) {
  const { setCurrentProject, setCurrentScreenName, saveSnapshot, setShowWelcome } = useIDEStore()
  const [activeTab, setActiveTab] = useState<"templates" | "extensions">("templates")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  
  const filteredTemplates = projectTemplates.filter(template => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })
  
  const handleUseTemplate = (template: ProjectTemplate) => {
    if (template.data.length > 0) {
      setCurrentProject(template.data[0])
      setCurrentScreenName(template.data[0].Properties.$Name)
      setShowWelcome(false)
      saveSnapshot()
      toast.success(`Template "${template.name}" carregado!`)
      onClose()
    }
  }
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "text-green-500 bg-green-500/10"
      case "intermediate": return "text-yellow-500 bg-yellow-500/10"
      case "advanced": return "text-red-500 bg-red-500/10"
      default: return "text-muted-foreground bg-muted"
    }
  }
  
  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "Iniciante"
      case "intermediate": return "Intermediario"
      case "advanced": return "Avancado"
      default: return difficulty
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div 
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg tracking-tight">Marketplace APEX</h2>
            </div>
            <div className="flex bg-secondary rounded-lg p-1 gap-1">
              <button 
                onClick={() => {setActiveTab("templates"); setSelectedCategory("all")}}
                className={cn(
                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                  activeTab === "templates" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Templates
              </button>
              <button 
                onClick={() => {setActiveTab("extensions"); setSelectedCategory("ext_ui")}}
                className={cn(
                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                  activeTab === "extensions" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Extensões
              </button>
            </div>
          </div>
          <X 
            className="w-5 h-5 cursor-pointer text-muted-foreground hover:text-foreground" 
            onClick={onClose}
          />
        </div>
        
        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-border bg-secondary/30 p-3 shrink-0">
            <div className="mb-3">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="h-8 text-xs"
              />
            </div>
            
            <div className="space-y-1">
              {categories.filter(c => activeTab === "templates" ? c.type === "template" : c.type === "extension").map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-2 rounded-md transition-colors text-left",
                    selectedCategory === cat.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <cat.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Templates Grid */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {activeTab === "templates" ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={cn(
                        "group relative bg-card border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                        selectedTemplate?.id === template.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {/* ... (rest of template card) */}
                      <div className="aspect-[4/3] bg-secondary/50 flex items-center justify-center relative">
                        <div className="w-16 h-28 bg-background rounded-lg border border-border shadow-sm flex flex-col overflow-hidden">
                          <div className="h-1.5 bg-zinc-900" />
                          <div className="h-2 bg-primary/80" />
                          <div className="flex-1 p-1 bg-white">
                            {template.data[0]?.Properties.$Components?.slice(0, 3).map((_, i) => (
                              <div key={i} className="h-1.5 bg-muted rounded-sm mb-0.5" />
                            ))}
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="sm" className="text-xs">Ver Detalhes</Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <template.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium truncate">{template.name}</h3>
                            <p className="text-[11px] text-muted-foreground line-clamp-2">{template.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extensions.map((ext) => (
                    <div key={ext.id} className="p-4 bg-card border border-border rounded-xl hover:border-primary transition-all group">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <ext.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-sm">{ext.name}</h3>
                            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full font-bold">{ext.price}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ext.description}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-amber-500" />
                              {ext.rating}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium">
                              {ext.installs} instalações
                            </div>
                            <Button variant="link" size="sm" className="h-auto p-0 text-[10px] ml-auto">
                              Instalar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Selected Template Detail */}
          {selectedTemplate && (
            <div className="w-64 border-l border-border bg-secondary/30 p-4 shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <selectedTemplate.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{selectedTemplate.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {getDifficultyLabel(selectedTemplate.difficulty)}
                  </p>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mb-4">
                {selectedTemplate.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Telas</span>
                  <span className="font-medium">{selectedTemplate.screens}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Componentes</span>
                  <span className="font-medium">{selectedTemplate.components}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Categoria</span>
                  <span className="font-medium capitalize">{selectedTemplate.category}</span>
                </div>
              </div>
              
              <Button 
                className="w-full gap-2"
                onClick={() => handleUseTemplate(selectedTemplate)}
              >
                <Zap className="w-4 h-4" />
                Usar Template
              </Button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0">
          <div className="text-xs text-muted-foreground">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} disponiveis
          </div>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
