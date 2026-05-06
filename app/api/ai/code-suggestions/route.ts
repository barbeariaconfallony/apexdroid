import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'

// Funcao para criar o modelo baseado no provider
function getAIModel(provider: string, apiKey: string, model: string, baseUrl?: string) {
  switch (provider) {
    case 'groq':
      const groq = createGroq({
        apiKey: apiKey || process.env.GROQ_API_KEY,
      })
      return groq(model || 'llama-3.3-70b-versatile')
    
    case 'openai':
      const openai = createOpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY,
        baseURL: baseUrl || 'https://api.openai.com/v1',
      })
      return openai(model || 'gpt-4-turbo')
    
    case 'ollama':
      const ollama = createOpenAI({
        apiKey: 'ollama',
        baseURL: baseUrl || 'http://localhost:11434/v1',
      })
      return ollama(model || 'llama3.2')
    
    default:
      const defaultGroq = createGroq({
        apiKey: apiKey || process.env.GROQ_API_KEY,
      })
      return defaultGroq(model || 'llama-3.3-70b-versatile')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentBlock, selectedComponent, projectContext, settings } = body
    
    // Extrair configuracoes do usuario
    const provider = settings?.provider || 'groq'
    const apiKey = settings?.apiKey || ''
    const model = settings?.model || 'llama-3.3-70b-versatile'
    const baseUrl = settings?.baseUrl

    if (!currentBlock && !selectedComponent) {
      return new Response(
        JSON.stringify({ error: 'currentBlock ou selectedComponent é necessário' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // System prompt para sugestões de código
    const systemPrompt = `Você é um especialista em blocos visuais MIT App Inventor/Kodular.

Sua responsabilidade é fornecer sugestões de blocos de código (BKY) baseado no contexto do usuário.

${projectContext ? `\nContexto do projeto:
${projectContext}` : ''}

Ao receber um bloco ou componente, sugira:
1. Blocos complementares que funcionam bem com ele
2. Padrões comuns de uso
3. Otimizações e boas práticas
4. Próximos passos lógicos

Forneça sugestões em linguagem simples e prática, com exemplos quando possível.
Se apropriado, inclua código ou blocos em formato JSON.`

    const prompt = currentBlock 
      ? `O usuário está usando o bloco: ${currentBlock}\n\nQuais blocos você sugeriria para complementá-lo?`
      : `O usuário selecionou o componente: ${selectedComponent}\n\nQuais blocos deveriam ser usados para controlar este componente?`

    const aiModel = getAIModel(provider, apiKey, model, baseUrl)
    
    const result = await streamText({
      model: aiModel,
      system: systemPrompt,
      prompt,
      temperature: 0.7,
      maxTokens: 1000
    })

    return result.toAIStream()
  } catch (error) {
    console.error('Code suggestions error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Falha ao gerar sugestões' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
