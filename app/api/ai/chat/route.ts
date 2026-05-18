import { streamText } from 'ai'
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getAIModel } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, context, settings, screenFiles, currentBky } = body
    
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

    let skillContent = ''
    try {
      const skillPath = path.join(process.cwd(), 'app', 'api', 'ai', 'chat', 'Skill.md')
      skillContent = fs.readFileSync(skillPath, 'utf8')
    } catch (e) {
      console.error('Falha ao carregar Skill.md', e)
      skillContent = 'ERRO: Skill.md nao encontrada.'
    }

    // Construir contexto completo do projeto
    let fullContext = ''
    
    if (context) {
      fullContext += `## ESTADO ATUAL DO PROJETO\n\n${context}\n\n`
    } else {
      fullContext += '## ESTADO ATUAL DO PROJETO\n\nNenhum projeto carregado ainda.\n\n'
    }
    
    // Adicionar lista de telas disponiveis
    if (screenFiles && Array.isArray(screenFiles) && screenFiles.length > 0) {
      fullContext += `## TELAS DISPONIVEIS NO PROJETO\n\n`
      screenFiles.forEach((sf: any) => {
        fullContext += `- ${sf.name}\n`
      })
      fullContext += `\n`
    }
    
    // Adicionar BKY atual se disponivel
    if (currentBky) {
      fullContext += `## LOGICA ATUAL DA TELA (BKY XML)\n\n\`\`\`xml\n${currentBky}\n\`\`\`\n\n`
    }
    
    fullContext += `(A arvore de componentes mostra todos os elementos aninhados na tela. Leia com atencao para saber quem e filho de quem e usar o "name" correto no update ou remove, e o "parentName" correto no add).\n`

    const systemPrompt = `Voce e o APEX DROID AI, o assistente mais avancado de desenvolvimento para MIT App Inventor e Kodular. Sua missao e EXECUTAR exatamente o que o usuario pedir, sem adicionar elementos ou estilos extras nao solicitados.

${fullContext}

${skillContent}`

    const aiModel = getAIModel({ provider, apiKey, model, baseUrl })

    const result = await streamText({
      model: aiModel,
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
      maxTokens: 16384,
    })

    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error('AI Chat error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process chat message' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
