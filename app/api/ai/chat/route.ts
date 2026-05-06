import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, context } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // System prompt for APEX DROID AI
    const systemPrompt = `Você é o APEX DROID AI, um assistente inteligente para desenvolvimento de aplicativos móveis.
    
Sua responsabilidade é ajudar o usuário a:
1. Gerar componentes de interface (botões, inputs, listas, etc)
2. Sugerir estrutura e lógica para aplicativos
3. Fornecer código e configurações
4. Analisar e corrigir erros

${context ? `\nContexto do projeto atual:
${context}` : ''}

Quando o usuário pedir para criar um componente, responda com um JSON estruturado como:
\`\`\`json
{
  "action": "create_component",
  "componentType": "Button|TextInput|Label|etc",
  "properties": {
    "property": "value"
  }
}
\`\`\`

Quando o usuário pedir sugestões de código, responda com a sugestão formatada claramente.

Sempre seja conciso, prático e direto ao ponto.`

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
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
