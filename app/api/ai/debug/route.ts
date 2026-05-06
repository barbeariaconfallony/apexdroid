import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { NextRequest, NextResponse } from 'next/server'

// Inicializa o cliente Groq
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// Modelo especializado em raciocinio e debugging
const GROQ_MODEL = 'deepseek-r1-distill-llama-70b'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { error, context, componentName } = body

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

    const { text } = await generateText({
      model: groq(GROQ_MODEL),
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
