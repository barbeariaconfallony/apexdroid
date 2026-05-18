/**
 * Gerador de XML BKY 100% compatível com Kodular/App Inventor
 * 
 * Este arquivo usa o serviço centralizado bky-sync-service para serialização
 * e mantém compatibilidade com a API anterior.
 */

import {
  type BkyBlock,
  type BkyDocument,
  type FlowNode,
  type FlowEdge,
  type FlowDocument,
  serializeToBkyXml,
  generateId
} from './bky-sync-service'

/**
 * Converte FlowDocument para XML BKY
 */
export function convertFlowToBky(nodes: FlowNode[], edges: FlowEdge[]): string {
  const doc: BkyDocument = {
    xmlns: 'http://www.w3.org/1999/xhtml',
    blocks: []
  }

  // Encontrar nós raiz (sem arestas de entrada ou eventos)
  const hasIncoming = new Set(edges.map(e => e.target))
  
  const rootNodes = nodes.filter(n => {
    // Nós de evento são sempre raiz
    if (n.type === 'event' || n.label.startsWith('Quando')) return true
    // Nós de lógica (procedimentos, variáveis globais) são raiz
    if (n.type === 'logic' && (n.label.startsWith('Procedimento') || n.label.startsWith('Variável Global') || n.label.startsWith('Função'))) return true
    // Nós sem entrada são raiz
    return !hasIncoming.has(n.id)
  })

  // Se não há nós raiz claros, usar eventos ou o primeiro nó
  const eventNodes = nodes.filter(n => 
    n.type === 'event' || 
    n.metadata?.functions?.some(f => f.type === 'event') ||
    n.label.startsWith('Quando')
  )
  
  const topNodes = rootNodes.length > 0 ? rootNodes : (eventNodes.length > 0 ? eventNodes : nodes.slice(0, 1))

  // Processar nós já visitados para evitar duplicatas
  const processedNodes = new Set<string>()

  topNodes.forEach(node => {
    if (processedNodes.has(node.id)) return
    const block = convertNodeToBlock(node, nodes, edges, processedNodes)
    if (block) {
      doc.blocks.push(block)
    }
  })

  return serializeToBkyXml(doc)
}

/**
 * Converte um nó de fluxo para um bloco BKY
 */
function convertNodeToBlock(
  node: FlowNode, 
  allNodes: FlowNode[], 
  edges: FlowEdge[],
  processedNodes: Set<string>
): BkyBlock | null {
  if (processedNodes.has(node.id)) return null
  processedNodes.add(node.id)

  const block: BkyBlock = {
    id: node.id,
    type: node.metadata?.bkyType || 'text_print',
    x: node.x,
    y: node.y,
    fields: {},
    values: {},
    statements: {}
  }

  const functions = node.metadata?.functions || []
  const eventFunc = functions.find(f => f.type === 'event')
  const methodFunc = functions.find(f => f.type === 'method')
  const setPropFunc = functions.find(f => f.type === 'property_set')
  const getPropFunc = functions.find(f => f.type === 'property_get')

  // ===== EVENTO DE COMPONENTE =====
  if (node.type === 'event' || eventFunc || node.label.startsWith('Quando')) {
    block.type = 'component_event'
    const compName = node.metadata?.componentName || 'Screen1'
    const compType = node.metadata?.componentType || 'Form'
    const eventName = node.metadata?.eventName || eventFunc?.name || 'Initialize'
    
    block.mutation = {
      component_type: compType,
      is_generic: 'false',
      instance_name: compName,
      event_name: eventName
    }
    block.fields.COMPONENT_SELECTOR = compName

    // Processar filhos (statement DO)
    const childEdges = edges.filter(e => e.source === node.id && e.label !== 'Não')
    if (childEdges.length > 0) {
      const firstChildId = childEdges[0].target
      const childNode = allNodes.find(n => n.id === firstChildId)
      if (childNode && !processedNodes.has(childNode.id)) {
        const childBlock = convertNodeToBlock(childNode, allNodes, edges, processedNodes)
        if (childBlock) {
          delete childBlock.x
          delete childBlock.y
          block.statements.DO = childBlock
        }
      }
    }
    
    return block
  }

  // ===== PROCEDIMENTO =====
  if (node.label.startsWith('Procedimento:') || node.label.startsWith('Função:')) {
    const isFunction = node.label.startsWith('Função:')
    block.type = isFunction ? 'procedures_defreturn' : 'procedures_defnoreturn'
    const name = node.label.replace(/^(Procedimento|Função): /, '')
    block.fields.NAME = name

    const childEdges = edges.filter(e => e.source === node.id)
    if (childEdges.length > 0) {
      const firstChildId = childEdges[0].target
      const childNode = allNodes.find(n => n.id === firstChildId)
      if (childNode && !processedNodes.has(childNode.id)) {
        const childBlock = convertNodeToBlock(childNode, allNodes, edges, processedNodes)
        if (childBlock) {
          delete childBlock.x
          delete childBlock.y
          block.statements.STACK = childBlock
        }
      }
    }
    
    return block
  }

  // ===== VARIÁVEL GLOBAL =====
  if (node.label.startsWith('Variável Global:')) {
    block.type = 'global_declaration'
    const name = node.label.replace('Variável Global: ', '')
    block.fields.NAME = name
    
    const value = setPropFunc?.value || functions[0]?.value || '0'
    block.values.VALUE = createValueBlock(value)
    
    return block
  }

  // ===== MÉTODO DE COMPONENTE =====
  if (methodFunc || node.metadata?.methodName) {
    block.type = 'component_method'
    const compName = node.metadata?.componentName || 'Screen1'
    const compType = node.metadata?.componentType || 'Form'
    const methodName = node.metadata?.methodName || methodFunc?.name || 'Method'
    
    block.mutation = {
      component_type: compType,
      method_name: methodName,
      is_generic: 'false',
      instance_name: compName
    }
    block.fields.COMPONENT_SELECTOR = compName

    // Adicionar argumentos do método se houver
    if (methodFunc?.value) {
      const args = String(methodFunc.value).split(',').map(s => s.trim()).filter(Boolean)
      args.forEach((arg, idx) => {
        block.values[`ARG${idx}`] = createValueBlock(arg)
      })
    }

    addNextBlock(block, node, allNodes, edges, processedNodes)
    return block
  }

  // ===== SET PROPERTY =====
  if (setPropFunc || (node.metadata?.propertyName && node.label.startsWith('Definir'))) {
    block.type = 'component_set'
    const compName = node.metadata?.componentName || 'Screen1'
    const compType = node.metadata?.componentType || 'Form'
    const propName = node.metadata?.propertyName || setPropFunc?.name || 'Property'
    
    block.mutation = {
      component_type: compType,
      set_or_get: 'set',
      property_name: propName,
      is_generic: 'false',
      instance_name: compName
    }
    block.fields.COMPONENT_SELECTOR = compName
    block.values.VALUE = createValueBlock(setPropFunc?.value || '')

    addNextBlock(block, node, allNodes, edges, processedNodes)
    return block
  }

  // ===== GET PROPERTY =====
  if (getPropFunc || (node.metadata?.propertyName && node.label.startsWith('Obter'))) {
    block.type = 'component_get'
    const compName = node.metadata?.componentName || 'Screen1'
    const compType = node.metadata?.componentType || 'Form'
    const propName = node.metadata?.propertyName || getPropFunc?.name || 'Property'
    
    block.mutation = {
      component_type: compType,
      set_or_get: 'get',
      property_name: propName,
      is_generic: 'false',
      instance_name: compName
    }
    block.fields.COMPONENT_SELECTOR = compName

    return block
  }

  // ===== DEFINIR VARIÁVEL =====
  if (node.label.startsWith('Definir ') && node.type === 'logic') {
    block.type = 'lexical_variable_set'
    const varName = node.label.replace('Definir ', '')
    block.fields.VAR = `global ${varName}`
    block.values.VALUE = createValueBlock(setPropFunc?.value || '0')

    addNextBlock(block, node, allNodes, edges, processedNodes)
    return block
  }

  // ===== OBTER VARIÁVEL =====
  if (node.label.startsWith('Obter ') && node.type === 'logic') {
    block.type = 'lexical_variable_get'
    const varName = node.label.replace('Obter ', '')
    block.fields.VAR = `global ${varName}`
    return block
  }

  // ===== ABRIR TELA =====
  if (node.label.startsWith('Abrir Tela') || node.metadata?.targetScreen) {
    block.type = 'controls_openAnotherScreen'
    const screenName = node.metadata?.targetScreen || node.label.replace('Abrir Tela: ', '') || 'Screen1'
    
    block.values.SCREEN = {
      id: generateId(),
      type: 'text',
      fields: { TEXT: screenName },
      values: {},
      statements: {}
    }

    addNextBlock(block, node, allNodes, edges, processedNodes)
    return block
  }

  // ===== FECHAR TELA =====
  if (node.label === 'Fechar Tela') {
    block.type = 'controls_closeScreen'
    addNextBlock(block, node, allNodes, edges, processedNodes)
    return block
  }

  // ===== DECISÃO (IF) =====
  if (node.type === 'decision') {
    block.type = 'controls_if'
    
    // Condição padrão
    block.values.IF0 = {
      id: generateId(),
      type: 'logic_boolean',
      fields: { BOOL: 'TRUE' },
      values: {},
      statements: {}
    }

    // Processar branches
    const childEdges = edges.filter(e => e.source === node.id)
    const trueEdge = childEdges.find(e => !e.label || e.label === 'Sim' || e.label === 'Verdadeiro')
    const falseEdge = childEdges.find(e => e.label === 'Não' || e.label === 'Falso')

    if (trueEdge) {
      const trueNode = allNodes.find(n => n.id === trueEdge.target)
      if (trueNode && !processedNodes.has(trueNode.id)) {
        const trueBlock = convertNodeToBlock(trueNode, allNodes, edges, processedNodes)
        if (trueBlock) {
          delete trueBlock.x
          delete trueBlock.y
          block.statements.DO0 = trueBlock
        }
      }
    }

    if (falseEdge) {
      block.mutation = { ...block.mutation, else: '1' }
      const falseNode = allNodes.find(n => n.id === falseEdge.target)
      if (falseNode && !processedNodes.has(falseNode.id)) {
        const falseBlock = convertNodeToBlock(falseNode, allNodes, edges, processedNodes)
        if (falseBlock) {
          delete falseBlock.x
          delete falseBlock.y
          block.statements.ELSE = falseBlock
        }
      }
    }

    return block
  }

  // ===== BLOCO COM TIPO BKY EXPLÍCITO =====
  if (node.metadata?.bkyType) {
    block.type = node.metadata.bkyType
    
    // Tratar tipos específicos
    if (block.type === 'text') {
      block.fields.TEXT = String(setPropFunc?.value || '')
    } else if (block.type === 'math_number') {
      block.fields.NUM = String(setPropFunc?.value || '0')
    } else if (block.type === 'logic_boolean') {
      block.fields.BOOL = String(setPropFunc?.value || 'TRUE').toUpperCase()
    }

    addNextBlock(block, node, allNodes, edges, processedNodes)
    return block
  }

  // ===== BLOCO GENÉRICO (FALLBACK) =====
  block.type = 'text_print'
  block.values.TEXT = {
    id: generateId(),
    type: 'text',
    fields: { TEXT: node.label },
    values: {},
    statements: {}
  }

  addNextBlock(block, node, allNodes, edges, processedNodes)
  return block
}

/**
 * Adiciona o próximo bloco na cadeia (next)
 */
function addNextBlock(
  block: BkyBlock, 
  node: FlowNode, 
  allNodes: FlowNode[], 
  edges: FlowEdge[],
  processedNodes: Set<string>
) {
  const nextEdge = edges.find(e => e.source === node.id && !e.label)
  if (nextEdge) {
    const nextNode = allNodes.find(n => n.id === nextEdge.target)
    if (nextNode && !processedNodes.has(nextNode.id)) {
      const nextBlock = convertNodeToBlock(nextNode, allNodes, edges, processedNodes)
      if (nextBlock) {
        delete nextBlock.x
        delete nextBlock.y
        block.next = nextBlock
      }
    }
  }
}

/**
 * Cria um bloco de valor baseado no tipo inferido
 */
function createValueBlock(value: any): BkyBlock {
  const id = generateId()
  const strValue = String(value)
  
  // Booleano
  if (strValue === 'true' || strValue === 'false' || strValue === 'TRUE' || strValue === 'FALSE') {
    return {
      id,
      type: 'logic_boolean',
      fields: { BOOL: strValue.toUpperCase() },
      values: {},
      statements: {}
    }
  }
  
  // Número
  if (!isNaN(Number(strValue)) && strValue.trim() !== '') {
    return {
      id,
      type: 'math_number',
      fields: { NUM: strValue },
      values: {},
      statements: {}
    }
  }
  
  // Cor
  if (strValue.startsWith('#') && (strValue.length === 7 || strValue.length === 9)) {
    return {
      id,
      type: 'color_picker',
      fields: { COLOR: strValue },
      values: {},
      statements: {}
    }
  }
  
  // Texto (padrão)
  return {
    id,
    type: 'text',
    fields: { TEXT: strValue.replace(/^["']|["']$/g, '') },
    values: {},
    statements: {}
  }
}

// Re-exportar tipos e utilidades para compatibilidade
export { generateId }
export type { BkyBlock, BkyDocument, FlowNode, FlowEdge, FlowDocument }
