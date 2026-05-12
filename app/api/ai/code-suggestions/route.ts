import { streamText } from 'ai'
import { NextRequest } from 'next/server'
import { getAIModel } from '@/lib/ai-service'

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

    const aiModel = getAIModel({ provider, apiKey, model, baseUrl })
    
    const result = await streamText({
      model: aiModel,
      system: systemPrompt,
      prompt,
      temperature: 0.7,
      maxTokens: 4096
    })

    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error('Code suggestions error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    })
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Falha ao gerar sugestões',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
