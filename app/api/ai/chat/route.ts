import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { NextRequest } from 'next/server'

// Inicializa o cliente Groq
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// Melhores modelos Groq para programacao (em ordem de preferencia)
// 1. llama-3.3-70b-versatile - Melhor para codigo e raciocinio complexo
// 2. deepseek-r1-distill-llama-70b - Excelente para raciocinio e debugging
// 3. qwen-qwq-32b - Bom para tarefas de codigo
const GROQ_MODEL = 'llama-3.3-70b-versatile'

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

    const result = await streamText({
      model: groq(GROQ_MODEL),
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
