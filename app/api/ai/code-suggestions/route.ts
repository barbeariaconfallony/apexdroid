import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentBlock, selectedComponent, projectContext } = body

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

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      system: systemPrompt,
      prompt,
      temperature: 0.7,
      maxTokens: 800
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
