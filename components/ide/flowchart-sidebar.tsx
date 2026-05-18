"use client"

import React, { useState, useMemo } from "react"
import { useIDEStore } from "@/lib/ide-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Box, Code2, GitBranch, Database, Type, Hash, List, BookOpen,
  Palette, ChevronRight, ChevronDown, Search, Zap, Settings, Play,
  ArrowRight, LayoutGrid, AlignLeft, Repeat, Globe, Bell, Wifi,
  Layers
} from "lucide-react"

// ─── Tipos ───────────────────────────────────────────────────────────────────
type NodeType = "event" | "process" | "decision" | "logic" | "io" | "action"

interface FlowItem {
  id: string
  label: string
  nodeType: NodeType
  bkyType: string    // tipo real do bloco Blockly para gerar XML correto
  color: string
  compType?: string
}

interface FlowCategory {
  id: string
  title: string
  icon: React.ElementType
  color: string
  items: FlowItem[]
}

// ─── Paleta Completa ──────────────────────────────────────────────────────────
const COLORS = {
  control:      "bg-[#4C97FF]/20 text-[#4C97FF] border-[#4C97FF]/30",
  logic:        "bg-[#9966FF]/20 text-[#9966FF] border-[#9966FF]/30",
  math:         "bg-[#5C81A6]/20 text-[#5C81A6] border-[#5C81A6]/30",
  text:         "bg-[#5CA65C]/20 text-[#5CA65C] border-[#5CA65C]/30",
  lists:        "bg-[#745BA5]/20 text-[#745BA5] border-[#745BA5]/30",
  dicts:        "bg-[#8C6D46]/20 text-[#8C6D46] border-[#8C6D46]/30",
  colors:       "bg-[#CC6699]/20 text-[#CC6699] border-[#CC6699]/30",
  vars:         "bg-[#FF8C1A]/20 text-[#FF8C1A] border-[#FF8C1A]/30",
  procs:        "bg-[#FF6680]/20 text-[#FF6680] border-[#FF6680]/30",
  components:   "bg-[#4DB6AC]/20 text-[#4DB6AC] border-[#4DB6AC]/30",
  event:        "bg-amber-500/20 text-amber-400 border-amber-500/30",
}

const STATIC_CATEGORIES: FlowCategory[] = [
  // ── Controle ────────────────────────────────────────────────────────────────
  {
    id: "control", title: "Controle", icon: GitBranch, color: COLORS.control,
    items: [
      { id: "if",        label: "Se ... Então",            nodeType: "decision", bkyType: "controls_if",          color: COLORS.control },
      { id: "if_else",   label: "Se ... Senão",            nodeType: "decision", bkyType: "controls_if_else",     color: COLORS.control },
      { id: "for",       label: "Para cada número",        nodeType: "logic",    bkyType: "controls_for",         color: COLORS.control },
      { id: "foreach",   label: "Para cada item da lista", nodeType: "logic",    bkyType: "controls_forEach",     color: COLORS.control },
      { id: "while",     label: "Enquanto",                nodeType: "decision", bkyType: "controls_whileUntil",  color: COLORS.control },
      { id: "break",     label: "Sair do loop",            nodeType: "process",  bkyType: "controls_break",       color: COLORS.control },
      { id: "do",        label: "Fazer e retornar",        nodeType: "process",  bkyType: "controls_do",          color: COLORS.control },
      { id: "open_screen",label: "Abrir Tela",             nodeType: "process",  bkyType: "controls_openAnotherScreen", color: COLORS.control },
      { id: "close_app", label: "Fechar Aplicativo",       nodeType: "process",  bkyType: "controls_close_app",   color: COLORS.control },
    ]
  },
  // ── Lógica ──────────────────────────────────────────────────────────────────
  {
    id: "logic", title: "Lógica", icon: Zap, color: COLORS.logic,
    items: [
      { id: "logic_true",  label: "Verdadeiro",    nodeType: "process", bkyType: "logic_true",       color: COLORS.logic },
      { id: "logic_false", label: "Falso",         nodeType: "process", bkyType: "logic_false",      color: COLORS.logic },
      { id: "logic_not",   label: "Não (not)",     nodeType: "process", bkyType: "logic_negate",     color: COLORS.logic },
      { id: "logic_and",   label: "E (and)",       nodeType: "process", bkyType: "logic_operation",  color: COLORS.logic },
      { id: "logic_or",    label: "Ou (or)",       nodeType: "process", bkyType: "logic_operation",  color: COLORS.logic },
      { id: "logic_cmp",   label: "Comparar",      nodeType: "process", bkyType: "logic_compare",    color: COLORS.logic },
      { id: "logic_null",  label: "Nulo",          nodeType: "process", bkyType: "logic_null",       color: COLORS.logic },
    ]
  },
  // ── Matemática ──────────────────────────────────────────────────────────────
  {
    id: "math", title: "Matemática", icon: Hash, color: COLORS.math,
    items: [
      { id: "math_num",       label: "Número",             nodeType: "process", bkyType: "math_number",          color: COLORS.math },
      { id: "math_arith",     label: "Aritmética (+−×÷)",  nodeType: "process", bkyType: "math_arithmetic",      color: COLORS.math },
      { id: "math_cmp",       label: "Comparar números",   nodeType: "process", bkyType: "math_compare",         color: COLORS.math },
      { id: "math_single",    label: "Função matemática",  nodeType: "process", bkyType: "math_single",          color: COLORS.math },
      { id: "math_round",     label: "Arredondar",         nodeType: "process", bkyType: "math_round",           color: COLORS.math },
      { id: "math_random",    label: "Número aleatório",   nodeType: "process", bkyType: "math_random_int",      color: COLORS.math },
      { id: "math_modulo",    label: "Resto (mod)",        nodeType: "process", bkyType: "math_modulo",          color: COLORS.math },
      { id: "math_constrain", label: "Limitar valor",      nodeType: "process", bkyType: "math_constrain",       color: COLORS.math },
      { id: "math_is_num",    label: "É número?",          nodeType: "process", bkyType: "math_is_number",       color: COLORS.math },
      { id: "math_format",    label: "Formatar decimal",   nodeType: "process", bkyType: "math_format_decimal",  color: COLORS.math },
      { id: "math_bitwise_and",label: "AND bitwise",       nodeType: "process", bkyType: "kodular_math_bitwise_and", color: COLORS.math },
      { id: "math_bitwise_or", label: "OR bitwise",        nodeType: "process", bkyType: "kodular_math_bitwise_or",  color: COLORS.math },
      { id: "math_bitwise_xor",label: "XOR bitwise",       nodeType: "process", bkyType: "kodular_math_bitwise_xor", color: COLORS.math },
    ]
  },
  // ── Texto ────────────────────────────────────────────────────────────────────
  {
    id: "text", title: "Texto", icon: Type, color: COLORS.text,
    items: [
      { id: "text",           label: "Texto literal",      nodeType: "process", bkyType: "text",             color: COLORS.text },
      { id: "text_join",      label: "Juntar textos",      nodeType: "process", bkyType: "text_join",        color: COLORS.text },
      { id: "text_append",    label: "Adicionar ao texto", nodeType: "process", bkyType: "text_append",      color: COLORS.text },
      { id: "text_length",    label: "Comprimento",        nodeType: "process", bkyType: "text_length",      color: COLORS.text },
      { id: "text_empty",     label: "Está vazio?",        nodeType: "decision",bkyType: "text_isEmpty",     color: COLORS.text },
      { id: "text_compare",   label: "Comparar textos",    nodeType: "process", bkyType: "text_compare",     color: COLORS.text },
      { id: "text_contains",  label: "Contém?",            nodeType: "decision",bkyType: "text_contains",    color: COLORS.text },
      { id: "text_split",     label: "Dividir texto",      nodeType: "process", bkyType: "text_split",       color: COLORS.text },
      { id: "text_segment",   label: "Segmento",           nodeType: "process", bkyType: "text_segment",     color: COLORS.text },
      { id: "text_replace",   label: "Substituir tudo",    nodeType: "process", bkyType: "text_replace_all", color: COLORS.text },
      { id: "text_upper",     label: "MAIÚSCULAS/minúsc",  nodeType: "process", bkyType: "text_changeCase",  color: COLORS.text },
      { id: "text_trim",      label: "Remover espaços",    nodeType: "process", bkyType: "text_trim",        color: COLORS.text },
      { id: "text_obfusc",    label: "Texto ofuscado",     nodeType: "process", bkyType: "kodular_text_obfuscated", color: COLORS.text },
    ]
  },
  // ── Listas ───────────────────────────────────────────────────────────────────
  {
    id: "lists", title: "Listas", icon: List, color: COLORS.lists,
    items: [
      { id: "list_empty",     label: "Lista vazia",           nodeType: "process", bkyType: "lists_create_empty",          color: COLORS.lists },
      { id: "list_create",    label: "Criar lista",           nodeType: "process", bkyType: "lists_create_with",           color: COLORS.lists },
      { id: "list_length",    label: "Tamanho da lista",      nodeType: "process", bkyType: "lists_length",                color: COLORS.lists },
      { id: "list_isempty",   label: "Lista vazia?",          nodeType: "decision",bkyType: "lists_isEmpty",               color: COLORS.lists },
      { id: "list_getindex",  label: "Obter item por índice", nodeType: "process", bkyType: "lists_getIndex",              color: COLORS.lists },
      { id: "list_setindex",  label: "Definir item",          nodeType: "process", bkyType: "lists_setIndex",              color: COLORS.lists },
      { id: "list_add",       label: "Adicionar item",        nodeType: "process", bkyType: "lists_add_item",              color: COLORS.lists },
      { id: "list_append",    label: "Anexar lista",          nodeType: "process", bkyType: "kodular_list_append",         color: COLORS.lists },
      { id: "list_copy",      label: "Copiar lista",          nodeType: "process", bkyType: "kodular_list_copy",           color: COLORS.lists },
      { id: "list_remove",    label: "Remover item",          nodeType: "process", bkyType: "kodular_list_remove_item",    color: COLORS.lists },
      { id: "list_insert",    label: "Inserir item",          nodeType: "process", bkyType: "kodular_list_insert_item",    color: COLORS.lists },
      { id: "list_replace",   label: "Substituir item",       nodeType: "process", bkyType: "kodular_list_replace_item",   color: COLORS.lists },
      { id: "list_reverse",   label: "Inverter lista",        nodeType: "process", bkyType: "kodular_list_reverse",        color: COLORS.lists },
      { id: "list_isin",      label: "Está na lista?",        nodeType: "decision",bkyType: "kodular_list_is_in_list",     color: COLORS.lists },
      { id: "list_random",    label: "Item aleatório",        nodeType: "process", bkyType: "kodular_list_pick_random",    color: COLORS.lists },
      { id: "list_join",      label: "Juntar com separador",  nodeType: "process", bkyType: "kodular_list_join_with_separator", color: COLORS.lists },
      { id: "list_csv_row",   label: "De linha CSV",          nodeType: "process", bkyType: "kodular_list_from_csv_row",   color: COLORS.lists },
      { id: "list_csv_table", label: "De tabela CSV",         nodeType: "process", bkyType: "kodular_list_from_csv_table", color: COLORS.lists },
    ]
  },
  // ── Dicionários ───────────────────────────────────────────────────────────────
  {
    id: "dicts", title: "Dicionários", icon: Database, color: COLORS.dicts,
    items: [
      { id: "dict_empty",    label: "Dicionário vazio",     nodeType: "process", bkyType: "dictionaries_create_empty",          color: COLORS.dicts },
      { id: "dict_with",     label: "Criar dicionário",     nodeType: "process", bkyType: "dictionaries_create_with",           color: COLORS.dicts },
      { id: "dict_pair",     label: "Par chave-valor",      nodeType: "process", bkyType: "dictionaries_pair",                  color: COLORS.dicts },
      { id: "dict_get",      label: "Obter valor",          nodeType: "process", bkyType: "dictionaries_get_value",             color: COLORS.dicts },
      { id: "dict_set",      label: "Definir valor",        nodeType: "process", bkyType: "dictionaries_set_value",             color: COLORS.dicts },
      { id: "dict_delete",   label: "Deletar entrada",      nodeType: "process", bkyType: "dictionaries_delete_pair",           color: COLORS.dicts },
      { id: "dict_keys",     label: "Obter chaves",         nodeType: "process", bkyType: "dictionaries_get_keys",              color: COLORS.dicts },
      { id: "dict_values",   label: "Obter valores",        nodeType: "process", bkyType: "dictionaries_get_values",            color: COLORS.dicts },
      { id: "dict_isdict",   label: "É dicionário?",        nodeType: "decision",bkyType: "dictionaries_is_dict",               color: COLORS.dicts },
      { id: "dict_iskey",    label: "Chave existe?",        nodeType: "decision",bkyType: "dictionaries_is_key_in",             color: COLORS.dicts },
      { id: "dict_length",   label: "Tamanho",              nodeType: "process", bkyType: "dictionaries_length",                color: COLORS.dicts },
      { id: "dict_tolist",   label: "Para lista de pares",  nodeType: "process", bkyType: "kodular_dict_to_list",               color: COLORS.dicts },
      { id: "dict_fromlist", label: "De lista de pares",    nodeType: "process", bkyType: "kodular_dict_from_list",             color: COLORS.dicts },
      { id: "dict_copy",     label: "Copiar dicionário",    nodeType: "process", bkyType: "kodular_dict_copy",                  color: COLORS.dicts },
      { id: "dict_merge",    label: "Mesclar dicionários",  nodeType: "process", bkyType: "kodular_dict_merge",                 color: COLORS.dicts },
    ]
  },
  // ── Cores ─────────────────────────────────────────────────────────────────────
  {
    id: "colors", title: "Cores", icon: Palette, color: COLORS.colors,
    items: [
      { id: "color_make",  label: "Criar cor (R,G,B)", nodeType: "process", bkyType: "color_make_color", color: COLORS.colors },
      { id: "color_black", label: "Preto",             nodeType: "process", bkyType: "color_black",      color: COLORS.colors },
      { id: "color_white", label: "Branco",            nodeType: "process", bkyType: "color_white",      color: COLORS.colors },
      { id: "color_red",   label: "Vermelho",          nodeType: "process", bkyType: "color_red",        color: COLORS.colors },
      { id: "color_green", label: "Verde",             nodeType: "process", bkyType: "color_green",      color: COLORS.colors },
      { id: "color_blue",  label: "Azul",              nodeType: "process", bkyType: "color_blue",       color: COLORS.colors },
      { id: "color_split", label: "Dividir cor",       nodeType: "process", bkyType: "color_split",      color: COLORS.colors },
    ]
  },
  // ── Variáveis ─────────────────────────────────────────────────────────────────
  {
    id: "variables", title: "Variáveis", icon: Layers, color: COLORS.vars,
    items: [
      { id: "var_global", label: "Variável Global: var", nodeType: "logic",   bkyType: "global_declaration",   color: COLORS.vars },
      { id: "var_set",    label: "Definir Variável",      nodeType: "process", bkyType: "lexical_variable_set",  color: COLORS.vars },
      { id: "var_get",    label: "Obter Variável",        nodeType: "io",      bkyType: "lexical_variable_get",  color: COLORS.vars },
    ]
  },
  // ── Procedimentos ─────────────────────────────────────────────────────────────
  {
    id: "procedures", title: "Procedimentos", icon: Play, color: COLORS.procs,
    items: [
      { id: "proc_def",  label: "Procedimento: novo",      nodeType: "logic",   bkyType: "procedures_defnoreturn", color: COLORS.procs },
      { id: "proc_ret",  label: "Função c/ retorno: nova", nodeType: "logic",   bkyType: "procedures_defreturn",   color: COLORS.procs },
      { id: "proc_call", label: "Chamar procedimento",     nodeType: "process", bkyType: "procedures_callnoreturn",color: COLORS.procs },
    ]
  },
]

// ─── Componente ───────────────────────────────────────────────────────────────
export function FlowchartSidebar() {
  const { currentProject } = useIDEStore()
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    components: true,
    control: true,
    logic: false,
    math: false,
    text: false,
    lists: false,
    dicts: false,
    colors: false,
    variables: true,
    procedures: false,
  })

  const toggleSection = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  // Extrair componentes da tela atual
  const screenComponents = useMemo(() => {
    if (!currentProject) return []
    const comps: { name: string; type: string }[] = []
    const traverse = (comp: any) => {
      if (comp.$Name && comp.$Type) comps.push({ name: comp.$Name, type: comp.$Type })
      if (comp.$Components) comp.$Components.forEach(traverse)
    }
    if (currentProject.Properties) traverse(currentProject.Properties)
    return comps
  }, [currentProject])

  // Filtrar por pesquisa
  const query = search.toLowerCase().trim()

  const filteredCategories = useMemo(() => {
    if (!query) return STATIC_CATEGORIES
    return STATIC_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(i => i.label.toLowerCase().includes(query))
    })).filter(cat => cat.items.length > 0)
  }, [query])

  const filteredComponents = useMemo(() => {
    if (!query) return screenComponents
    return screenComponents.filter(c => c.name.toLowerCase().includes(query))
  }, [screenComponents, query])

  const handleDragStart = (
    e: React.DragEvent,
    nodeType: string,
    nodeLabel: string,
    compType?: string,
    bkyType?: string
  ) => {
    e.dataTransfer.setData("nodeType", nodeType)
    e.dataTransfer.setData("nodeLabel", nodeLabel)
    if (compType) e.dataTransfer.setData("compType", compType)
    if (bkyType) e.dataTransfer.setData("bkyType", bkyType)
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div className="w-64 bg-card border-r border-white/5 flex flex-col h-full overflow-hidden shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-white/5 bg-secondary/30 shrink-0">
        <h2 className="text-xs font-semibold tracking-widest uppercase flex items-center gap-2 text-muted-foreground mb-2">
          <Code2 className="w-3.5 h-3.5 text-primary" />
          Ações do Fluxo
        </h2>
        {/* Search */}
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar blocos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary/60 border border-white/5 rounded-md pl-6 pr-2 py-1 text-[11px] text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/40"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1">

          {/* ── Componentes da Tela ── */}
          {(!query || filteredComponents.length > 0) && (
            <div>
              <button
                onClick={() => toggleSection("components")}
                className="flex items-center w-full gap-1.5 px-1.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded.components
                  ? <ChevronDown className="w-3 h-3 shrink-0" />
                  : <ChevronRight className="w-3 h-3 shrink-0" />}
                <Box className="w-3 h-3 shrink-0 text-[#4DB6AC]" />
                Componentes da Tela
                <span className="ml-auto text-[9px] bg-secondary rounded px-1">
                  {filteredComponents.length}
                </span>
              </button>

              {expanded.components && (
                <div className="mt-1 space-y-0.5 pl-3">
                  {filteredComponents.map(comp => (
                    <div
                      key={comp.name}
                      draggable
                      onDragStart={e => handleDragStart(e, "component", comp.name, comp.type)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 text-[11px] ${COLORS.components} border rounded-md cursor-grab active:cursor-grabbing hover:brightness-125 transition-all select-none`}
                    >
                      <Box className="w-3 h-3 shrink-0" />
                      <span className="truncate">{comp.name}</span>
                      <span className="ml-auto text-[9px] opacity-50 shrink-0">
                        {comp.type.split(".").pop()}
                      </span>
                    </div>
                  ))}
                  {filteredComponents.length === 0 && (
                    <p className="text-[10px] text-muted-foreground italic px-2 py-1">
                      Nenhum componente
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Categorias Estáticas ── */}
          {filteredCategories.map(category => {
            const Icon = category.icon
            return (
              <div key={category.id}>
                <button
                  onClick={() => toggleSection(category.id)}
                  className="flex items-center w-full gap-1.5 px-1.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expanded[category.id] || query
                    ? <ChevronDown className="w-3 h-3 shrink-0" />
                    : <ChevronRight className="w-3 h-3 shrink-0" />}
                  <Icon className="w-3 h-3 shrink-0" style={{ color: "currentColor" }} />
                  {category.title}
                  <span className="ml-auto text-[9px] bg-secondary rounded px-1">
                    {category.items.length}
                  </span>
                </button>

                {(expanded[category.id] || !!query) && (
                  <div className="mt-1 space-y-0.5 pl-3">
                    {category.items.map(item => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={e => handleDragStart(e, item.nodeType, item.label, undefined, item.bkyType)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 text-[11px] ${item.color} border rounded-md cursor-grab active:cursor-grabbing hover:brightness-125 transition-all select-none`}
                      >
                        <Icon className="w-3 h-3 shrink-0 opacity-70" />
                        <span className="truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

        </div>
      </ScrollArea>
    </div>
  )
}
