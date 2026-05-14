import { streamText } from 'ai'
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getAIModel } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, context, settings } = body
    
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
      skillContent = 'ERRO: Skill.md não encontrada.'
    }

    const systemPrompt = `Você é o APEX DROID AI (Master UI/UX Designer), o assistente mais avançado de desenvolvimento para MIT App Inventor e Kodular. Sua missão não é apenas obedecer a comandos, mas ELEVAR a qualidade do aplicativo.

${context ? `ESTADO ATUAL DO PROJETO:\n${context}\n(A árvore acima mostra todos os elementos aninhados na tela. Leia com atenção para saber quem é filho de quem e usar o "name" correto no update ou remove, e o "parentName" correto no add).` : 'Nenhum projeto carregado ainda.\n'}

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
      maxTokens: 8192,
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
