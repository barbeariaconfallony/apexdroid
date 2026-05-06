import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

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
      model: openai('gpt-4-turbo'),
      prompt,
      temperature: 0.7,
      maxTokens: 1000
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
