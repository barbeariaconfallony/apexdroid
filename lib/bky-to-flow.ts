/**
 * Converte XML de blocos (Blockly/Kodular) em estrutura de fluxograma (nós e arestas)
 * 
 * Este arquivo agora usa o serviço centralizado bky-sync-service para parsing
 * e mantém compatibilidade com a API anterior.
 */

import { 
  parseBkyXml, 
  type BkyBlock, 
  type FlowNode, 
  type FlowEdge,
  type FlowDocument 
} from './bky-sync-service'

// Mapeamento de nomes internos para nomes amigáveis
const FRIENDLY_NAMES: Record<string, string> = {
  'procedures_defnoreturn': 'Procedimento',
  'procedures_defreturn': 'Função',
  'global_declaration': 'Variável Global',
  'lexical_variable_set': 'Definir Variável',
  'lexical_variable_get': 'Obter Variável',
  'controls_if': 'Se (If)',
  'controls_openAnotherScreen': 'Abrir Tela',
  'controls_closeScreen': 'Fechar Tela',
  'controls_closeScreenWithPlainText': 'Fechar com Texto',
  'controls_closeScreenWithValue': 'Fechar com Valor',
  'component_event': 'Evento',
  'component_method': 'Método',
  'component_set': 'Definir Propriedade',
  'component_get': 'Obter Propriedade',
  'text': 'Texto',
  'text_join': 'Juntar Textos',
  'math_number': 'Número',
  'math_add': 'Somar',
  'math_subtract': 'Subtrair',
  'math_multiply': 'Multiplicar',
  'math_divide': 'Dividir',
  'logic_boolean': 'Booleano',
  'logic_compare': 'Comparar',
  'logic_operation': 'Operação Lógica',
  'logic_negate': 'Negar',
  'lists_create_with': 'Criar Lista',
  'lists_length': 'Tamanho da Lista',
  'lists_add_items': 'Adicionar à Lista',
  'controls_forRange': 'Para (For)',
  'controls_forEach': 'Para Cada',
  'controls_while': 'Enquanto (While)',
}

/**
 * Converte BKY XML para FlowDocument
 */
export function convertBkyToFlow(xmlText: string): FlowDocument {
  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []
  
  if (!xmlText || !xmlText.trim().startsWith('<xml')) {
    return { nodes, edges }
  }

  try {
    const doc = parseBkyXml(xmlText)
    
    doc.blocks.forEach((block, index) => {
      const baseX = block.x ?? (index * 300 + 100)
      const baseY = block.y ?? 100
      processBlockToFlow(block, nodes, edges, baseX, baseY, null)
    })
  } catch (e) {
    console.error("[bky-to-flow] Erro ao converter BKY para Flow:", e)
  }

  return { nodes, edges }
}

/**
 * Processa um bloco BKY e cria nós/arestas de fluxo
 */
function processBlockToFlow(
  block: BkyBlock,
  nodes: FlowNode[],
  edges: FlowEdge[],
  x: number,
  y: number,
  parentId: string | null
): string {
  const nodeId = block.id

  // Determinar tipo e label do nó
  let nodeType: FlowNode['type'] = 'process'
  let label = FRIENDLY_NAMES[block.type] || block.type
  const metadata: FlowNode['metadata'] = {
    bkyType: block.type,
    functions: []
  }

  // ===== EVENTO DE COMPONENTE =====
  if (block.type === 'component_event') {
    nodeType = 'event'
    const compType = block.mutation?.component_type || 'Component'
    const compName = block.mutation?.instance_name || block.fields.COMPONENT_SELECTOR || 'Componente'
    const eventName = block.mutation?.event_name || 'Event'
    
    label = `Quando ${compName}.${eventName}`
    metadata.componentName = compName
    metadata.componentType = compType
    metadata.eventName = eventName
    metadata.functions?.push({
      id: `f-${nodeId}`,
      type: 'event',
      name: eventName,
      label: `Quando ${eventName}`
    })
  }
  // ===== MÉTODO DE COMPONENTE =====
  else if (block.type === 'component_method') {
    nodeType = 'action'
    const compType = block.mutation?.component_type || 'Component'
    const compName = block.mutation?.instance_name || block.fields.COMPONENT_SELECTOR || 'Componente'
    const methodName = block.mutation?.method_name || 'Method'
    
    label = `${compName}.${methodName}`
    metadata.componentName = compName
    metadata.componentType = compType
    metadata.methodName = methodName
    metadata.functions?.push({
      id: `f-${nodeId}`,
      type: 'method',
      name: methodName,
      label: methodName
    })
  }
  // ===== SET PROPERTY =====
  else if (block.type === 'component_set') {
    nodeType = 'action'
    const compType = block.mutation?.component_type || 'Component'
    const compName = block.mutation?.instance_name || block.fields.COMPONENT_SELECTOR || 'Componente'
    const propName = block.mutation?.property_name || 'Property'
    
    label = `Definir ${compName}.${propName}`
    metadata.componentName = compName
    metadata.componentType = compType
    metadata.propertyName = propName
    metadata.functions?.push({
      id: `f-${nodeId}`,
      type: 'property_set',
      name: propName,
      label: propName,
      value: extractValueFromBlock(block.values.VALUE)
    })
  }
  // ===== GET PROPERTY =====
  else if (block.type === 'component_get') {
    nodeType = 'action'
    const compType = block.mutation?.component_type || 'Component'
    const compName = block.mutation?.instance_name || block.fields.COMPONENT_SELECTOR || 'Componente'
    const propName = block.mutation?.property_name || 'Property'
    
    label = `Obter ${compName}.${propName}`
    metadata.componentName = compName
    metadata.componentType = compType
    metadata.propertyName = propName
    metadata.functions?.push({
      id: `f-${nodeId}`,
      type: 'property_get',
      name: propName,
      label: propName
    })
  }
  // ===== PROCEDIMENTO =====
  else if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn') {
    nodeType = 'logic'
    const name = block.fields.NAME || 'procedimento'
    const hasReturn = block.type === 'procedures_defreturn'
    label = `${hasReturn ? 'Função' : 'Procedimento'}: ${name}`
    metadata.functions?.push({
      id: `f-${nodeId}`,
      type: 'method',
      name: name,
      label: hasReturn ? 'Retornar' : 'Executar'
    })
  }
  // ===== VARIÁVEL GLOBAL =====
  else if (block.type === 'global_declaration') {
    nodeType = 'logic'
    const name = block.fields.NAME || 'variavel'
    label = `Variável Global: ${name}`
    metadata.functions?.push({
      id: `f-${nodeId}`,
      type: 'property_set',
      name: name,
      label: name,
      value: extractValueFromBlock(block.values.VALUE)
    })
  }
  // ===== DEFINIR VARIÁVEL =====
  else if (block.type === 'lexical_variable_set') {
    nodeType = 'logic'
    const varName = block.fields.VAR || 'variavel'
    label = `Definir ${varName.replace('global ', '')}`
    metadata.functions?.push({
      id: `f-${nodeId}`,
      type: 'property_set',
      name: varName,
      label: varName.replace('global ', ''),
      value: extractValueFromBlock(block.values.VALUE)
    })
  }
  // ===== OBTER VARIÁVEL =====
  else if (block.type === 'lexical_variable_get') {
    nodeType = 'logic'
    const varName = block.fields.VAR || 'variavel'
    label = `Obter ${varName.replace('global ', '')}`
    metadata.functions?.push({
      id: `f-${nodeId}`,
      type: 'property_get',
      name: varName,
      label: varName.replace('global ', '')
    })
  }
  // ===== CONTROLE IF =====
  else if (block.type === 'controls_if') {
    nodeType = 'decision'
    label = 'Se ... Então'
  }
  // ===== ABRIR TELA =====
  else if (block.type === 'controls_openAnotherScreen') {
    nodeType = 'action'
    const screenBlock = block.values.SCREEN
    const screenName = extractValueFromBlock(screenBlock) || 'Screen1'
    label = `Abrir Tela: ${screenName}`
    metadata.targetScreen = screenName
  }
  // ===== FECHAR TELA =====
  else if (block.type === 'controls_closeScreen') {
    nodeType = 'action'
    label = 'Fechar Tela'
  }
  // ===== LOOPS =====
  else if (block.type === 'controls_forRange' || block.type === 'controls_forEach' || block.type === 'controls_while') {
    nodeType = 'logic'
    label = FRIENDLY_NAMES[block.type] || 'Loop'
  }

  // Criar o nó
  const node: FlowNode = {
    id: nodeId,
    type: nodeType,
    label,
    x,
    y,
    width: 220,
    height: 80,
    metadata
  }
  nodes.push(node)

  // Conectar ao pai
  if (parentId) {
    edges.push({
      id: `e-${parentId}-${nodeId}`,
      source: parentId,
      target: nodeId
    })
  }

  // Processar statements (DO, STACK, etc.)
  let childY = y + 120
  for (const [stmtName, stmtBlock] of Object.entries(block.statements)) {
    processBlockToFlow(stmtBlock, nodes, edges, x, childY, nodeId)
    childY += 120
    
    // Se for if, processar ELSE também com posição diferente
    if (block.type === 'controls_if' && stmtName === 'DO0') {
      const elseStmt = block.statements.ELSE
      if (elseStmt) {
        const elseEdge: FlowEdge = {
          id: `e-${nodeId}-${elseStmt.id}-else`,
          source: nodeId,
          target: elseStmt.id,
          label: 'Não'
        }
        edges.push(elseEdge)
        processBlockToFlow(elseStmt, nodes, edges, x + 280, y + 120, null)
      }
    }
  }

  // Processar next
  if (block.next) {
    processBlockToFlow(block.next, nodes, edges, x, childY, nodeId)
  }

  return nodeId
}

/**
 * Extrai o valor de um bloco de valor (text, number, boolean, etc.)
 */
function extractValueFromBlock(block: BkyBlock | undefined): string {
  if (!block) return ''
  
  if (block.type === 'text') {
    return block.fields.TEXT || ''
  }
  if (block.type === 'math_number') {
    return block.fields.NUM || '0'
  }
  if (block.type === 'logic_boolean') {
    return block.fields.BOOL || 'FALSE'
  }
  if (block.type === 'color_picker') {
    return block.fields.COLOR || '#000000'
  }
  
  // Para blocos complexos, retornar descrição
  return `[${FRIENDLY_NAMES[block.type] || block.type}]`
}

// Re-exportar tipos para compatibilidade
export type { FlowNode, FlowEdge, FlowDocument }
