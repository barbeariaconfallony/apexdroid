"use client"

import { useState } from "react"
import { 
  Layout, MessageSquare, Calculator, CheckSquare, 
  ShoppingCart, Calendar, Search, X, Sparkles,
  Download, Eye, Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useIDEStore } from "@/lib/ide-store"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ide/toast"
import type { ProjectData, KodularComponent } from "@/lib/ide-types"

interface Template {
  id: string
  name: string
  description: string
  icon: React.ElementType
  category: "starter" | "business" | "social" | "utility"
  screens: {
    name: string
    data: ProjectData
  }[]
  featured?: boolean
}

// Pre-built templates
const templates: Template[] = [
  {
    id: "blank",
    name: "Projeto em Branco",
    description: "Comece do zero com uma tela vazia",
    icon: Layout,
    category: "starter",
    screens: [{
      name: "Screen1",
      data: {
        Properties: {
          $Type: "Form",
          $Name: "Screen1",
          Title: "Meu App",
          BackgroundColor: "&HFFFFFFFF",
          $Components: []
        }
      }
    }]
  },
  {
    id: "todo",
    name: "Lista de Tarefas",
    description: "App de gerenciamento de tarefas com adicionar, marcar e excluir",
    icon: CheckSquare,
    category: "utility",
    featured: true,
    screens: [{
      name: "Screen1",
      data: {
        Properties: {
          $Type: "Form",
          $Name: "Screen1",
          Title: "Minhas Tarefas",
          BackgroundColor: "&HFFF5F5F5",
          $Components: [
            {
              $Type: "VerticalArrangement",
              $Name: "MainContainer",
              Width: "-2",
              Height: "-2",
              BackgroundColor: "&HFFFFFFFF",
              $Components: [
                {
                  $Type: "HorizontalArrangement",
                  $Name: "HeaderRow",
                  Width: "-2",
                  Height: "60",
                  BackgroundColor: "&HFF6200EE",
                  AlignVertical: "2",
                  $Components: [
                    {
                      $Type: "Label",
                      $Name: "TitleLabel",
                      Text: "Minhas Tarefas",
                      TextColor: "&HFFFFFFFF",
                      FontSize: "20",
                      FontBold: "True",
                      Width: "-2"
                    }
                  ]
                },
                {
                  $Type: "HorizontalArrangement",
                  $Name: "InputRow",
                  Width: "-2",
                  Height: "60",
                  AlignVertical: "2",
                  $Components: [
                    {
                      $Type: "TextBox",
                      $Name: "TaskInput",
                      Hint: "Digite uma nova tarefa...",
                      Width: "-2",
                      Height: "45"
                    },
                    {
                      $Type: "Button",
                      $Name: "AddButton",
                      Text: "+",
                      Width: "50",
                      Height: "45",
                      BackgroundColor: "&HFF6200EE",
                      TextColor: "&HFFFFFFFF"
                    }
                  ]
                },
                {
                  $Type: "ListView",
                  $Name: "TaskList",
                  Width: "-2",
                  Height: "-2"
                }
              ]
            }
          ]
        }
      }
    }]
  },
  {
    id: "calculator",
    name: "Calculadora",
    description: "Calculadora simples com operacoes basicas",
    icon: Calculator,
    category: "utility",
    screens: [{
      name: "Screen1",
      data: {
        Properties: {
          $Type: "Form",
          $Name: "Screen1",
          Title: "Calculadora",
          BackgroundColor: "&HFF1A1A1A",
          $Components: [
            {
              $Type: "VerticalArrangement",
              $Name: "MainContainer",
              Width: "-2",
              Height: "-2",
              BackgroundColor: "&HFF1A1A1A",
              $Components: [
                {
                  $Type: "Label",
                  $Name: "Display",
                  Text: "0",
                  TextColor: "&HFFFFFFFF",
                  FontSize: "48",
                  Width: "-2",
                  Height: "120",
                  TextAlignment: "2"
                },
                {
                  $Type: "TableArrangement",
                  $Name: "ButtonGrid",
                  Width: "-2",
                  Height: "-2",
                  Columns: "4",
                  Rows: "5",
                  $Components: [
                    { $Type: "Button", $Name: "BtnClear", Text: "C", BackgroundColor: "&HFFA5A5A5", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "BtnSign", Text: "+/-", BackgroundColor: "&HFFA5A5A5", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "BtnPercent", Text: "%", BackgroundColor: "&HFFA5A5A5", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "BtnDivide", Text: "/", BackgroundColor: "&HFFFF9500", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "Btn7", Text: "7", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "Btn8", Text: "8", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "Btn9", Text: "9", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "BtnMultiply", Text: "x", BackgroundColor: "&HFFFF9500", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "Btn4", Text: "4", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "Btn5", Text: "5", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "Btn6", Text: "6", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "BtnSubtract", Text: "-", BackgroundColor: "&HFFFF9500", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "Btn1", Text: "1", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "Btn2", Text: "2", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "Btn3", Text: "3", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "BtnAdd", Text: "+", BackgroundColor: "&HFFFF9500", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "Btn0", Text: "0", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF", Width: "140", Height: "70" },
                    { $Type: "Button", $Name: "BtnDecimal", Text: ".", BackgroundColor: "&HFF333333", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" },
                    { $Type: "Button", $Name: "BtnEquals", Text: "=", BackgroundColor: "&HFFFF9500", TextColor: "&HFFFFFFFF", Width: "70", Height: "70" }
                  ]
                }
              ]
            }
          ]
        }
      }
    }]
  },
  {
    id: "chat",
    name: "Chat Simples",
    description: "Interface de chat com mensagens e entrada de texto",
    icon: MessageSquare,
    category: "social",
    featured: true,
    screens: [{
      name: "Screen1",
      data: {
        Properties: {
          $Type: "Form",
          $Name: "Screen1",
          Title: "Chat",
          BackgroundColor: "&HFFF0F0F0",
          $Components: [
            {
              $Type: "VerticalArrangement",
              $Name: "MainContainer",
              Width: "-2",
              Height: "-2",
              $Components: [
                {
                  $Type: "VerticalScrollArrangement",
                  $Name: "MessageList",
                  Width: "-2",
                  Height: "-2",
                  BackgroundColor: "&HFFFFFFFF",
                  $Components: [
                    {
                      $Type: "HorizontalArrangement",
                      $Name: "Message1",
                      Width: "-2",
                      $Components: [
                        {
                          $Type: "Label",
                          $Name: "MsgText1",
                          Text: "Ola! Como posso ajudar?",
                          BackgroundColor: "&HFF6200EE",
                          TextColor: "&HFFFFFFFF",
                          FontSize: "14"
                        }
                      ]
                    }
                  ]
                },
                {
                  $Type: "HorizontalArrangement",
                  $Name: "InputRow",
                  Width: "-2",
                  Height: "60",
                  BackgroundColor: "&HFFFFFFFF",
                  AlignVertical: "2",
                  $Components: [
                    {
                      $Type: "TextBox",
                      $Name: "MessageInput",
                      Hint: "Digite sua mensagem...",
                      Width: "-2",
                      Height: "45"
                    },
                    {
                      $Type: "Button",
                      $Name: "SendButton",
                      Text: "Enviar",
                      Width: "80",
                      Height: "45",
                      BackgroundColor: "&HFF6200EE",
                      TextColor: "&HFFFFFFFF"
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    }]
  },
  {
    id: "login",
    name: "Tela de Login",
    description: "Formulario de login com email e senha",
    icon: Layout,
    category: "starter",
    screens: [{
      name: "Screen1",
      data: {
        Properties: {
          $Type: "Form",
          $Name: "Screen1",
          Title: "Login",
          BackgroundColor: "&HFF6200EE",
          $Components: [
            {
              $Type: "VerticalArrangement",
              $Name: "MainContainer",
              Width: "-2",
              Height: "-2",
              AlignHorizontal: "2",
              AlignVertical: "2",
              $Components: [
                {
                  $Type: "Image",
                  $Name: "Logo",
                  Width: "120",
                  Height: "120"
                },
                {
                  $Type: "Label",
                  $Name: "WelcomeLabel",
                  Text: "Bem-vindo",
                  TextColor: "&HFFFFFFFF",
                  FontSize: "28",
                  FontBold: "True"
                },
                {
                  $Type: "Label",
                  $Name: "SubtitleLabel",
                  Text: "Faca login para continuar",
                  TextColor: "&HCCFFFFFF",
                  FontSize: "14"
                },
                {
                  $Type: "VerticalArrangement",
                  $Name: "FormContainer",
                  Width: "300",
                  BackgroundColor: "&HFFFFFFFF",
                  $Components: [
                    {
                      $Type: "TextBox",
                      $Name: "EmailInput",
                      Hint: "Email",
                      Width: "-2",
                      Height: "50"
                    },
                    {
                      $Type: "PasswordTextBox",
                      $Name: "PasswordInput",
                      Hint: "Senha",
                      Width: "-2",
                      Height: "50"
                    },
                    {
                      $Type: "Button",
                      $Name: "LoginButton",
                      Text: "Entrar",
                      Width: "-2",
                      Height: "50",
                      BackgroundColor: "&HFF6200EE",
                      TextColor: "&HFFFFFFFF"
                    },
                    {
                      $Type: "Label",
                      $Name: "ForgotLabel",
                      Text: "Esqueceu a senha?",
                      TextColor: "&HFF6200EE",
                      FontSize: "12",
                      TextAlignment: "1"
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    }]
  },
  {
    id: "shop",
    name: "Loja Virtual",
    description: "Interface de e-commerce com produtos e carrinho",
    icon: ShoppingCart,
    category: "business",
    screens: [{
      name: "Screen1",
      data: {
        Properties: {
          $Type: "Form",
          $Name: "Screen1",
          Title: "Loja",
          BackgroundColor: "&HFFF5F5F5",
          $Components: [
            {
              $Type: "VerticalArrangement",
              $Name: "MainContainer",
              Width: "-2",
              Height: "-2",
              $Components: [
                {
                  $Type: "HorizontalArrangement",
                  $Name: "Header",
                  Width: "-2",
                  Height: "60",
                  BackgroundColor: "&HFFFFFFFF",
                  AlignVertical: "2",
                  $Components: [
                    {
                      $Type: "Label",
                      $Name: "StoreName",
                      Text: "Minha Loja",
                      FontSize: "18",
                      FontBold: "True",
                      Width: "-2"
                    },
                    {
                      $Type: "Button",
                      $Name: "CartButton",
                      Text: "Carrinho (0)",
                      BackgroundColor: "&HFF6200EE",
                      TextColor: "&HFFFFFFFF"
                    }
                  ]
                },
                {
                  $Type: "TextBox",
                  $Name: "SearchBox",
                  Hint: "Buscar produtos...",
                  Width: "-2",
                  Height: "45"
                },
                {
                  $Type: "VerticalScrollArrangement",
                  $Name: "ProductList",
                  Width: "-2",
                  Height: "-2",
                  $Components: [
                    {
                      $Type: "CardView",
                      $Name: "ProductCard1",
                      Width: "-2",
                      $Components: [
                        {
                          $Type: "Image",
                          $Name: "ProductImage1",
                          Width: "-2",
                          Height: "150"
                        },
                        {
                          $Type: "Label",
                          $Name: "ProductName1",
                          Text: "Produto 1",
                          FontSize: "16",
                          FontBold: "True"
                        },
                        {
                          $Type: "Label",
                          $Name: "ProductPrice1",
                          Text: "R$ 99,90",
                          TextColor: "&HFF4CAF50",
                          FontSize: "18"
                        },
                        {
                          $Type: "Button",
                          $Name: "AddToCart1",
                          Text: "Adicionar ao Carrinho",
                          Width: "-2",
                          BackgroundColor: "&HFF6200EE",
                          TextColor: "&HFFFFFFFF"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    }]
  }
]

const categoryLabels: Record<string, string> = {
  starter: "Inicial",
  business: "Negocios",
  social: "Social",
  utility: "Utilidades"
}

interface TemplateGalleryProps {
  onSelect?: (template: Template) => void
}

export function TemplateGallery({ onSelect }: TemplateGalleryProps) {
  const { setCurrentProject, setCurrentScreenName, saveSnapshot, addScreen, screens } = useIDEStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })
  
  const featuredTemplates = templates.filter(t => t.featured)
  
  const handleApplyTemplate = (template: Template) => {
    const screen = template.screens[0]
    if (screen) {
      // Deep clone the template data
      const projectData = JSON.parse(JSON.stringify(screen.data))
      
      setCurrentProject(projectData)
      setCurrentScreenName(screen.name)
      saveSnapshot()
      
      toast.success(`Template "${template.name}" aplicado com sucesso!`)
      onSelect?.(template)
    }
    setPreviewTemplate(null)
  }
  
  const categories = ["starter", "utility", "social", "business"]
  
  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar templates..."
            className="pl-8 h-8 text-xs"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Category filters */}
      <div className="p-2 border-b border-border flex flex-wrap gap-1">
        <Button
          variant={selectedCategory === null ? "default" : "ghost"}
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={() => setSelectedCategory(null)}
        >
          Todos
        </Button>
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "ghost"}
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={() => setSelectedCategory(cat)}
          >
            {categoryLabels[cat]}
          </Button>
        ))}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Featured section */}
          {!searchQuery && !selectedCategory && featuredTemplates.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-3.5 h-3.5 text-warning" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Destaques
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {featuredTemplates.map(template => (
                  <TemplateCard 
                    key={template.id} 
                    template={template}
                    onPreview={() => setPreviewTemplate(template)}
                    onApply={() => handleApplyTemplate(template)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* All templates */}
          <div>
            {(searchQuery || selectedCategory) && (
              <div className="flex items-center gap-1 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {filteredTemplates.map(template => (
                <TemplateCard 
                  key={template.id} 
                  template={template}
                  onPreview={() => setPreviewTemplate(template)}
                  onApply={() => handleApplyTemplate(template)}
                />
              ))}
            </div>
            
            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Layout className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Nenhum template encontrado</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
      
      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewTemplate && <previewTemplate.icon className="w-5 h-5 text-primary" />}
              {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              {previewTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {previewTemplate && categoryLabels[previewTemplate.category]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {previewTemplate?.screens.length} tela{previewTemplate?.screens.length !== 1 ? "s" : ""}
              </span>
            </div>
            
            {/* Mini preview */}
            <div className="bg-secondary rounded-lg p-4 flex items-center justify-center">
              <div className="w-32 h-56 bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="h-4 bg-zinc-900 flex items-center justify-center">
                  <div className="w-8 h-2 bg-zinc-800 rounded-full" />
                </div>
                <div className="h-6 bg-primary flex items-center px-2">
                  <span className="text-[8px] text-white font-medium truncate">
                    {previewTemplate?.screens[0]?.data?.Properties?.Title || "App"}
                  </span>
                </div>
                <div className="p-2 space-y-1">
                  {previewTemplate?.screens[0]?.data?.Properties?.$Components?.slice(0, 3).map((comp, i) => (
                    <div 
                      key={i} 
                      className="h-3 bg-secondary rounded"
                      style={{ width: `${60 + Math.random() * 40}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPreviewTemplate(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={() => previewTemplate && handleApplyTemplate(previewTemplate)}
              >
                <Download className="w-4 h-4 mr-2" />
                Usar Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface TemplateCardProps {
  template: Template
  onPreview: () => void
  onApply: () => void
}

function TemplateCard({ template, onPreview, onApply }: TemplateCardProps) {
  const Icon = template.icon
  
  return (
    <div 
      className={cn(
        "group relative bg-card border border-border rounded-lg p-3 cursor-pointer transition-all",
        "hover:border-primary/50 hover:shadow-sm"
      )}
      onClick={onPreview}
    >
      {template.featured && (
        <div className="absolute -top-1 -right-1">
          <Star className="w-4 h-4 text-warning fill-warning" />
        </div>
      )}
      
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="text-xs font-medium leading-tight">{template.name}</h4>
          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
            {template.description}
          </p>
        </div>
      </div>
      
      {/* Hover actions */}
      <div className="absolute inset-0 bg-card/90 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            onPreview()
          }}
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          Ver
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            onApply()
          }}
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          Usar
        </Button>
      </div>
    </div>
  )
}
