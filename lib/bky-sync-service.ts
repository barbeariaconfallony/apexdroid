/**
 * Serviço Centralizado de Sincronização BKY
 * 
 * Este serviço é a fonte única de verdade para:
 * - Parsing de arquivos BKY (XML do Kodular/App Inventor)
 * - Serialização para BKY XML compatível
 * - Conversão entre formatos (BKY <-> Flow <-> Code)
 * - Eventos de sincronização entre editores
 */

import { EventEmitter } from 'events'

// ============================================================================
// TIPOS
// ============================================================================

export interface BkyBlock {
  id: string
  type: string
  x?: number
  y?: number
  mutation?: Record<string, string>
  fields: Record<string, string>
  values: Record<string, BkyBlock>
  statements: Record<string, BkyBlock>
  next?: BkyBlock
}

export interface BkyDocument {
  xmlns: string
  blocks: BkyBlock[]
}

export interface FlowNode {
  id: string
  type: "start" | "process" | "decision" | "database" | "end" | "action" | "logic" | "event"
  label: string
  x: number
  y: number
  width: number
  height: number
  metadata?: {
    componentName?: string
    componentType?: string
    eventName?: string
    methodName?: string
    propertyName?: string
    targetScreen?: string
    bkyType?: string
    functions?: Array<{
      id: string
      type: "event" | "method" | "property_get" | "property_set"
      name: string
      label: string
      value?: any
      inputType?: string
    }>
  }
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface FlowDocument {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export type SyncSource = 'blocks' | 'code' | 'flowchart'

export interface SyncEvent {
  source: SyncSource
  screenName: string
  bkyXml: string
  flowDoc?: FlowDocument
  timestamp: number
}

// ============================================================================
// UTILIDADES
// ============================================================================

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = ''
  for (let i = 0; i < 20; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function unescapeXml(str: string): string {
  return str
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
}

// ============================================================================
// PARSER BKY XML -> ESTRUTURA
// ============================================================================

export function parseBkyXml(xmlText: string): BkyDocument {
  const doc: BkyDocument = {
    xmlns: 'http://www.w3.org/1999/xhtml',
    blocks: []
  }

  if (!xmlText || !xmlText.trim().startsWith('<xml')) {
    return doc
  }

  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
    
    // Verificar erros de parsing
    const parseError = xmlDoc.querySelector('parsererror')
    if (parseError) {
      console.error('[BkySyncService] XML parse error:', parseError.textContent)
      return doc
    }

    const xmlElement = xmlDoc.documentElement
    doc.xmlns = xmlElement.getAttribute('xmlns') || 'http://www.w3.org/1999/xhtml'

    // Pegar apenas blocos de primeiro nível (filhos diretos de <xml>)
    const topBlocks = Array.from(xmlElement.children).filter(
      child => child.tagName.toLowerCase() === 'block'
    )

    topBlocks.forEach(blockEl => {
      const block = parseBlockElement(blockEl as Element)
      if (block) {
        doc.blocks.push(block)
      }
    })
  } catch (error) {
    console.error('[BkySyncService] Error parsing BKY XML:', error)
  }

  return doc
}

function parseBlockElement(el: Element): BkyBlock | null {
  const type = el.getAttribute('type')
  if (!type) return null

  const block: BkyBlock = {
    id: el.getAttribute('id') || generateId(),
    type,
    fields: {},
    values: {},
    statements: {}
  }

  // Coordenadas
  const x = el.getAttribute('x')
  const y = el.getAttribute('y')
  if (x) block.x = parseFloat(x)
  if (y) block.y = parseFloat(y)

  // Mutation
  const mutation = el.querySelector(':scope > mutation')
  if (mutation) {
    block.mutation = {}
    for (const attr of Array.from(mutation.attributes)) {
      block.mutation[attr.name] = attr.value
    }
  }

  // Fields
  const fields = el.querySelectorAll(':scope > field')
  fields.forEach(field => {
    const name = field.getAttribute('name')
    if (name) {
      block.fields[name] = field.textContent || ''
    }
  })

  // Values (inputs com blocos)
  const values = el.querySelectorAll(':scope > value')
  values.forEach(value => {
    const name = value.getAttribute('name')
    const innerBlock = value.querySelector(':scope > block')
    if (name && innerBlock) {
      const parsed = parseBlockElement(innerBlock)
      if (parsed) {
        block.values[name] = parsed
      }
    }
  })

  // Statements (stacks de blocos)
  const statements = el.querySelectorAll(':scope > statement')
  statements.forEach(stmt => {
    const name = stmt.getAttribute('name')
    const innerBlock = stmt.querySelector(':scope > block')
    if (name && innerBlock) {
      const parsed = parseBlockElement(innerBlock)
      if (parsed) {
        block.statements[name] = parsed
      }
    }
  })

  // Next block
  const next = el.querySelector(':scope > next > block')
  if (next) {
    const parsed = parseBlockElement(next)
    if (parsed) {
      block.next = parsed
    }
  }

  return block
}

// ============================================================================
// SERIALIZER ESTRUTURA -> BKY XML
// ============================================================================

export function serializeToBkyXml(doc: BkyDocument): string {
  let xml = `<xml xmlns="${doc.xmlns}">\n`

  doc.blocks.forEach(block => {
    xml += serializeBlock(block, 2)
  })

  xml += '</xml>'
  return xml
}

function serializeBlock(block: BkyBlock, indent: number): string {
  const pad = ' '.repeat(indent)
  let xml = ''

  // Abrir tag do bloco
  xml += `${pad}<block type="${block.type}" id="${block.id}"`
  if (block.x !== undefined) xml += ` x="${Math.round(block.x)}"`
  if (block.y !== undefined) xml += ` y="${Math.round(block.y)}"`
  xml += '>\n'

  // Mutation
  if (block.mutation && Object.keys(block.mutation).length > 0) {
    xml += `${pad}  <mutation`
    for (const [key, value] of Object.entries(block.mutation)) {
      xml += ` ${key}="${escapeXml(value)}"`
    }
    xml += '></mutation>\n'
  }

  // Fields
  for (const [name, value] of Object.entries(block.fields)) {
    xml += `${pad}  <field name="${name}">${escapeXml(value)}</field>\n`
  }

  // Values
  for (const [name, valueBlock] of Object.entries(block.values)) {
    xml += `${pad}  <value name="${name}">\n`
    xml += serializeBlock(valueBlock, indent + 4)
    xml += `${pad}  </value>\n`
  }

  // Statements
  for (const [name, stmtBlock] of Object.entries(block.statements)) {
    xml += `${pad}  <statement name="${name}">\n`
    xml += serializeBlock(stmtBlock, indent + 4)
    xml += `${pad}  </statement>\n`
  }

  // Next
  if (block.next) {
    xml += `${pad}  <next>\n`
    xml += serializeBlock(block.next, indent + 4)
    xml += `${pad}  </next>\n`
  }

  xml += `${pad}</block>\n`
  return xml
}

// ============================================================================
// CONVERSÃO BKY -> FLOW
// ============================================================================

const FRIENDLY_NAMES: Record<string, string> = {
  'procedures_defnoreturn': 'Procedimento',
  'procedures_defreturn': 'Função',
  'global_declaration': 'Variável Global',
  'lexical_variable_set': 'Definir Variável',
  'lexical_variable_get': 'Obter Variável',
  'controls_if': 'Se (If)',
  'controls_openAnotherScreen': 'Abrir Tela',
  'controls_closeScreen': 'Fechar Tela',
  'component_event': 'Evento',
  'component_method': 'Método',
  'component_set': 'Definir Propriedade',
  'component_get': 'Obter Propriedade',
}

export function convertBkyToFlow(bkyXml: string): FlowDocument {
  const doc = parseBkyXml(bkyXml)
  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []

  doc.blocks.forEach((block, index) => {
    const baseX = block.x ?? (index * 300 + 100)
    const baseY = block.y ?? 100
    processBlockToFlow(block, nodes, edges, baseX, baseY, null)
  })

  return { nodes, edges }
}

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

  // Evento de componente
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
  // Método de componente
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
  // Set property
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
      label: propName
    })
  }
  // Get property
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
  // Procedimento
  else if (block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn') {
    nodeType = 'logic'
    const name = block.fields.NAME || 'procedimento'
    label = `${block.type === 'procedures_defreturn' ? 'Função' : 'Procedimento'}: ${name}`
  }
  // Variável global
  else if (block.type === 'global_declaration') {
    nodeType = 'logic'
    const name = block.fields.NAME || 'variavel'
    label = `Variável Global: ${name}`
  }
  // Set variável
  else if (block.type === 'lexical_variable_set') {
    nodeType = 'logic'
    const varName = block.fields.VAR || 'variavel'
    label = `Definir ${varName}`
  }
  // Controle If
  else if (block.type === 'controls_if') {
    nodeType = 'decision'
    label = 'Se ... Então'
  }
  // Abrir tela
  else if (block.type === 'controls_openAnotherScreen') {
    nodeType = 'action'
    const screenBlock = block.values.SCREEN
    const screenName = screenBlock?.fields?.TEXT || 'Screen1'
    label = `Abrir Tela: ${screenName}`
    metadata.targetScreen = screenName
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
    const childId = processBlockToFlow(stmtBlock, nodes, edges, x, childY, nodeId)
    childY += 120
    
    // Se for if, processar ELSE também
    if (block.type === 'controls_if' && stmtName === 'DO0') {
      const elseStmt = block.statements.ELSE
      if (elseStmt) {
        processBlockToFlow(elseStmt, nodes, edges, x + 250, y + 120, nodeId)
      }
    }
  }

  // Processar next
  if (block.next) {
    processBlockToFlow(block.next, nodes, edges, x, childY, nodeId)
  }

  return nodeId
}

// ============================================================================
// CONVERSÃO FLOW -> BKY
// ============================================================================

export function convertFlowToBky(flowDoc: FlowDocument): string {
  const { nodes, edges } = flowDoc
  const doc: BkyDocument = {
    xmlns: 'http://www.w3.org/1999/xhtml',
    blocks: []
  }

  // Encontrar nós raiz (sem arestas de entrada)
  const hasIncoming = new Set(edges.map(e => e.target))
  const rootNodes = nodes.filter(n => !hasIncoming.has(n.id))

  // Se não há nós raiz claros, usar nós de evento ou o primeiro
  const eventNodes = nodes.filter(n => 
    n.type === 'event' || 
    n.metadata?.functions?.some(f => f.type === 'event') ||
    n.label.startsWith('Quando')
  )
  
  const topNodes = rootNodes.length > 0 ? rootNodes : (eventNodes.length > 0 ? eventNodes : nodes.slice(0, 1))

  topNodes.forEach(node => {
    const block = convertNodeToBlock(node, nodes, edges)
    if (block) {
      doc.blocks.push(block)
    }
  })

  return serializeToBkyXml(doc)
}

function convertNodeToBlock(node: FlowNode, allNodes: FlowNode[], edges: FlowEdge[]): BkyBlock | null {
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

  // Evento de componente
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

    // Processar filhos (statements DO)
    const childEdges = edges.filter(e => e.source === node.id)
    if (childEdges.length > 0) {
      const firstChildId = childEdges[0].target
      const childNode = allNodes.find(n => n.id === firstChildId)
      if (childNode) {
        const childBlock = convertNodeToBlock(childNode, allNodes, edges)
        if (childBlock) {
          delete childBlock.x
          delete childBlock.y
          block.statements.DO = childBlock
        }
      }
    }
  }
  // Método de componente
  else if (methodFunc || node.metadata?.methodName) {
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

    // Adicionar next se houver
    addNextBlock(block, node, allNodes, edges)
  }
  // Set property
  else if (setPropFunc || node.metadata?.propertyName) {
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
    
    // Valor padrão
    block.values.VALUE = {
      id: generateId(),
      type: 'text',
      fields: { TEXT: setPropFunc?.value || '' },
      values: {},
      statements: {}
    }

    addNextBlock(block, node, allNodes, edges)
  }
  // Abrir tela
  else if (node.label.startsWith('Abrir Tela') || node.metadata?.targetScreen) {
    block.type = 'controls_openAnotherScreen'
    const screenName = node.metadata?.targetScreen || 'Screen1'
    
    block.values.SCREEN = {
      id: generateId(),
      type: 'text',
      fields: { TEXT: screenName },
      values: {},
      statements: {}
    }

    addNextBlock(block, node, allNodes, edges)
  }
  // Procedimento
  else if (node.label.startsWith('Procedimento:')) {
    block.type = 'procedures_defnoreturn'
    const name = node.label.replace('Procedimento: ', '')
    block.fields.NAME = name

    const childEdges = edges.filter(e => e.source === node.id)
    if (childEdges.length > 0) {
      const firstChildId = childEdges[0].target
      const childNode = allNodes.find(n => n.id === firstChildId)
      if (childNode) {
        const childBlock = convertNodeToBlock(childNode, allNodes, edges)
        if (childBlock) {
          delete childBlock.x
          delete childBlock.y
          block.statements.STACK = childBlock
        }
      }
    }
  }
  // Variável global
  else if (node.label.startsWith('Variável Global:')) {
    block.type = 'global_declaration'
    const name = node.label.replace('Variável Global: ', '')
    block.fields.NAME = name
    
    block.values.VALUE = {
      id: generateId(),
      type: 'math_number',
      fields: { NUM: '0' },
      values: {},
      statements: {}
    }
  }
  // Definir variável
  else if (node.label.startsWith('Definir ') && node.type === 'logic') {
    block.type = 'lexical_variable_set'
    const varName = node.label.replace('Definir ', '')
    block.fields.VAR = `global ${varName}`
    
    block.values.VALUE = {
      id: generateId(),
      type: 'math_number',
      fields: { NUM: '0' },
      values: {},
      statements: {}
    }

    addNextBlock(block, node, allNodes, edges)
  }
  // Decisão (if)
  else if (node.type === 'decision') {
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
      if (trueNode) {
        const trueBlock = convertNodeToBlock(trueNode, allNodes, edges)
        if (trueBlock) {
          delete trueBlock.x
          delete trueBlock.y
          block.statements.DO0 = trueBlock
        }
      }
    }

    if (falseEdge) {
      block.mutation = { else: '1' }
      const falseNode = allNodes.find(n => n.id === falseEdge.target)
      if (falseNode) {
        const falseBlock = convertNodeToBlock(falseNode, allNodes, edges)
        if (falseBlock) {
          delete falseBlock.x
          delete falseBlock.y
          block.statements.ELSE = falseBlock
        }
      }
    }
  }
  // Bloco genérico
  else {
    block.type = 'text_print'
    block.values.TEXT = {
      id: generateId(),
      type: 'text',
      fields: { TEXT: node.label },
      values: {},
      statements: {}
    }

    addNextBlock(block, node, allNodes, edges)
  }

  return block
}

function addNextBlock(block: BkyBlock, node: FlowNode, allNodes: FlowNode[], edges: FlowEdge[]) {
  const nextEdge = edges.find(e => e.source === node.id && !e.label)
  if (nextEdge) {
    const nextNode = allNodes.find(n => n.id === nextEdge.target)
    if (nextNode) {
      const nextBlock = convertNodeToBlock(nextNode, allNodes, edges)
      if (nextBlock) {
        delete nextBlock.x
        delete nextBlock.y
        block.next = nextBlock
      }
    }
  }
}

// ============================================================================
// SERVIÇO DE SINCRONIZAÇÃO
// ============================================================================

class BkySyncService {
  private emitter = new EventEmitter()
  private currentBky: Map<string, string> = new Map()
  private currentFlow: Map<string, FlowDocument> = new Map()
  private isSyncing = false
  private syncQueue: SyncEvent[] = []

  constructor() {
    this.emitter.setMaxListeners(20)
  }

  /**
   * Registra um listener para eventos de sincronização
   */
  onSync(callback: (event: SyncEvent) => void) {
    this.emitter.on('sync', callback)
    return () => this.emitter.off('sync', callback)
  }

  /**
   * Obtém o BKY XML atual para uma tela
   */
  getBkyXml(screenName: string): string | null {
    return this.currentBky.get(screenName) || null
  }

  /**
   * Obtém o FlowDocument atual para uma tela
   */
  getFlowDoc(screenName: string): FlowDocument | null {
    return this.currentFlow.get(screenName) || null
  }

  /**
   * Atualiza o BKY a partir de XML (vindo do editor de Blocos ou arquivo)
   */
  updateFromBkyXml(screenName: string, bkyXml: string, source: SyncSource = 'blocks') {
    if (this.isSyncing) {
      this.syncQueue.push({ source, screenName, bkyXml, timestamp: Date.now() })
      return
    }

    this.isSyncing = true
    
    try {
      // Armazenar BKY
      this.currentBky.set(screenName, bkyXml)
      
      // Converter para Flow
      const flowDoc = convertBkyToFlow(bkyXml)
      this.currentFlow.set(screenName, flowDoc)
      
      // Emitir evento
      this.emitter.emit('sync', {
        source,
        screenName,
        bkyXml,
        flowDoc,
        timestamp: Date.now()
      } as SyncEvent)
    } finally {
      this.isSyncing = false
      this.processQueue()
    }
  }

  /**
   * Atualiza o BKY a partir de FlowDocument (vindo do Fluxograma)
   */
  updateFromFlow(screenName: string, flowDoc: FlowDocument, source: SyncSource = 'flowchart') {
    if (this.isSyncing) {
      const bkyXml = convertFlowToBky(flowDoc)
      this.syncQueue.push({ source, screenName, bkyXml, flowDoc, timestamp: Date.now() })
      return
    }

    this.isSyncing = true
    
    try {
      // Converter para BKY
      const bkyXml = convertFlowToBky(flowDoc)
      
      // Armazenar
      this.currentBky.set(screenName, bkyXml)
      this.currentFlow.set(screenName, flowDoc)
      
      // Emitir evento
      this.emitter.emit('sync', {
        source,
        screenName,
        bkyXml,
        flowDoc,
        timestamp: Date.now()
      } as SyncEvent)
    } finally {
      this.isSyncing = false
      this.processQueue()
    }
  }

  /**
   * Valida se um XML BKY é válido
   */
  validateBkyXml(bkyXml: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!bkyXml || !bkyXml.trim()) {
      errors.push('XML vazio')
      return { valid: false, errors }
    }

    if (!bkyXml.trim().startsWith('<xml')) {
      errors.push('XML não começa com <xml>')
      return { valid: false, errors }
    }

    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(bkyXml, 'text/xml')
      
      const parseError = xmlDoc.querySelector('parsererror')
      if (parseError) {
        errors.push(`Erro de parsing: ${parseError.textContent}`)
        return { valid: false, errors }
      }

      // Validar estrutura básica
      const blocks = xmlDoc.querySelectorAll('block')
      blocks.forEach((block, idx) => {
        const type = block.getAttribute('type')
        if (!type) {
          errors.push(`Bloco ${idx + 1} sem atributo 'type'`)
        }
      })

    } catch (error) {
      errors.push(`Erro ao validar: ${error instanceof Error ? error.message : 'Desconhecido'}`)
      return { valid: false, errors }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Limpa o cache de uma tela
   */
  clearScreen(screenName: string) {
    this.currentBky.delete(screenName)
    this.currentFlow.delete(screenName)
  }

  /**
   * Limpa todo o cache
   */
  clearAll() {
    this.currentBky.clear()
    this.currentFlow.clear()
  }

  private processQueue() {
    if (this.syncQueue.length === 0) return
    
    const event = this.syncQueue.shift()!
    this.updateFromBkyXml(event.screenName, event.bkyXml, event.source)
  }
}

// Singleton
export const bkySyncService = new BkySyncService()

// Re-exportar funções utilitárias
export { generateId, escapeXml, unescapeXml }
