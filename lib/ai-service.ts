import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'

// AI Service - Novo arquivo para evitar cache do Turbopack

export type AIProvider = 'groq' | 'openai' | 'ollama'

export interface AISettings {
  provider: AIProvider | string
  apiKey: string
  model: string
  baseUrl?: string
}

/**
 * Creates a resilient AI model instance.
 */
export function getAIModel(settings: AISettings) {
  const { provider, apiKey, model, baseUrl } = settings
  
  const groqKey = apiKey || process.env.GROQ_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY || (provider === 'openai' ? apiKey : '')

  if (provider === 'groq' && groqKey) {
    const groq = createGroq({ apiKey: groqKey })
    if (model.toLowerCase().includes('deepseek') || model.toLowerCase().includes('r1')) {
      return groq('deepseek-r1-distill-llama-70b')
    }
    if (model.includes('prompt-guard')) {
      return groq('llama-3.3-70b-versatile')
    }
    return groq(model || 'llama-3.3-70b-versatile')
  } 
  
  if ((provider === 'openai' || !groqKey) && openaiKey) {
    const openai = createOpenAI({ 
      apiKey: openaiKey,
      baseURL: baseUrl || 'https://api.openai.com/v1'
    })
    let modelToUse = model || 'gpt-4o'
    if (modelToUse.includes('llama')) modelToUse = 'gpt-4o'
    return openai(modelToUse)
  }

  if (provider === 'ollama') {
    const ollama = createOpenAI({
      apiKey: 'ollama',
      baseURL: baseUrl || 'http://localhost:11434/v1',
    })
    return ollama(model || 'llama3.2')
  }

  if (groqKey) {
    return createGroq({ apiKey: groqKey })('llama-3.3-70b-versatile')
  }

  throw new Error('Nenhum provedor de IA configurado corretamente.')
}
