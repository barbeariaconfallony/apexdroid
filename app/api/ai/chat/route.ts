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
        apiKey: 'ollama', // Ollama nao precisa de chave
        baseURL: baseUrl || 'http://localhost:11434/v1',
      })
      return ollama(model || 'llama3.2')
    
    default:
      // Fallback para Groq
      const defaultGroq = createGroq({
        apiKey: apiKey || process.env.GROQ_API_KEY,
      })
      return defaultGroq(model || 'llama-3.3-70b-versatile')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, context, settings } = body
    
    // Extrair configuracoes do usuario ou usar defaults
    const provider = settings?.provider || 'groq'
    const apiKey = settings?.apiKey || ''
    const model = settings?.model || 'llama-3.3-70b-versatile'
    const baseUrl = settings?.baseUrl

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // System prompt for APEX DROID AI
    const systemPrompt = `Voce e o APEX DROID AI, um assistente inteligente especializado em desenvolvimento de aplicativos moveis no estilo MIT App Inventor/Kodular.

SUAS RESPONSABILIDADES:
1. Gerar componentes de interface (Button, TextBox, Label, Image, ListView, etc)
2. Criar logica de blocos visuais para comportamentos
3. Sugerir estrutura e arquitetura para aplicativos
4. Analisar e corrigir erros de projeto
5. Explicar conceitos de programacao visual

${context ? `CONTEXTO DO PROJETO ATUAL:
${context}` : ''}

FORMATO DE RESPOSTA PARA COMPONENTES:
Quando o usuario pedir para criar um componente, responda com JSON:
\`\`\`json
{
  "action": "create_component",
  "componentType": "Button|TextBox|Label|Image|ListView|etc",
  "properties": {
    "$Name": "NomeDoComponente",
    "Text": "Texto",
    "BackgroundColor": "#RRGGBB",
    "Width": "Fill parent|Automatic|numero",
    "Height": "Automatic|numero"
  }
}
\`\`\`

DIRETRIZES:
- Responda sempre em portugues brasileiro
- Seja conciso, pratico e direto ao ponto
- Use exemplos de codigo quando apropriado
- Sugira boas praticas de desenvolvimento mobile
- Para blocos, descreva a logica passo a passo`

    // Criar modelo baseado nas configuracoes
    const aiModel = getAIModel(provider, apiKey, model, baseUrl)

    const result = await streamText({
      model: aiModel,
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
      maxTokens: 2048,
    })

    return result.toAIStream()
  } catch (error) {
    console.error('AI Chat error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process chat message' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
