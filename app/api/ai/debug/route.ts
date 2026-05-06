import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

// Funcao para criar o modelo baseado no provider
function getAIModel(provider: string, apiKey: string, model: string, baseUrl?: string) {
  switch (provider) {
    case 'groq':
      const groq = createGroq({
        apiKey: apiKey || process.env.GROQ_API_KEY,
      })
      // Para debug, preferir modelo com bom raciocinio
      return groq(model || 'deepseek-r1-distill-llama-70b')
    
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
      return defaultGroq(model || 'deepseek-r1-distill-llama-70b')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { error, context, componentName, settings } = body
    
    // Extrair configuracoes do usuario
    const provider = settings?.provider || 'groq'
    const apiKey = settings?.apiKey || ''
    const model = settings?.model || 'deepseek-r1-distill-llama-70b'
    const baseUrl = settings?.baseUrl

    if (!error) {
      return NextResponse.json(
        { error: 'Error message is required' },
        { status: 400 }
      )
    }

    const prompt = `Você é um especialista em debugação de aplicativos móveis MIT App Inventor/Kodular.

Um usuário encontrou o seguinte erro:
"${error}"

${componentName ? `Componente envolvido: ${componentName}` : ''}
${context ? `\nContexto adicional:
${context}` : ''}

Forneça uma análise clara e acionável:
1. O que provavelmente causou o erro
2. Como identificar a raiz do problema
3. Passos específicos para corrigir
4. Como evitar no futuro

Seja conciso e prático.`

    const aiModel = getAIModel(provider, apiKey, model, baseUrl)
    
    const { text } = await generateText({
      model: aiModel,
      prompt,
      temperature: 0.6,
      maxTokens: 1500
    })

    return NextResponse.json({
      success: true,
      analysis: text,
      error: error
    })
  } catch (error) {
    console.error('Debug analysis error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to analyze error' 
      },
      { status: 500 }
    )
  }
}
