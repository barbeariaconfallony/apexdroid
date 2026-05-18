import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { nodes, edges, settings } = await request.json()

    if (!nodes || nodes.length === 0) {
      return NextResponse.json({ error: 'Nenhum nó fornecido para análise' }, { status: 400 })
    }

    const provider = settings?.provider || 'groq'
    const apiKey = settings?.apiKey || ''
    const model = settings?.model || 'llama-3.3-70b-versatile'
    const baseUrl = settings?.baseUrl

    const systemPrompt = `Você é um desenvolvedor sênior especialista em lógica de programação (Blockly/Kodular) e fluxogramas.
Sua tarefa é analisar o fluxograma fornecido (representado por nós e arestas) e fornecer um feedback construtivo.

DADOS DO FLUXOGRAMA:
Nós: ${JSON.stringify(nodes, null, 2)}
Conexões: ${JSON.stringify(edges, null, 2)}

O QUE VOCÊ DEVE PROCURAR:
1. Loops infinitos ou dependências circulares.
2. Nós isolados (sem conexões de entrada ou saída, a menos que sejam eventos de início).
3. Condicionais (If/Else) mal formatadas ou sem caminho definido (Sim/Não).
4. Possíveis melhorias na lógica ou avisos sobre vazamentos de memória/estado.
5. Se tudo estiver perfeito, elogie o fluxo.

FORMATO DE RESPOSTA:
Forneça a resposta em texto claro, usando markdown para destacar pontos importantes.
Seja direto, profissional e conciso. Não inclua blocos de código enormes na resposta. Se houver erros, liste-os claramente em tópicos.`

    const aiModel = getAIModel({ provider, apiKey, model, baseUrl })
    
    const { text } = await generateText({
      model: aiModel,
      system: systemPrompt,
      prompt: `Analise este fluxograma e me diga se há algum problema ou como posso melhorá-lo.`,
      temperature: 0.3,
    })

    let analysisText = text.trim()
    analysisText = analysisText.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

    return NextResponse.json({ analysis: analysisText })

  } catch (error: any) {
    console.error('Analyze flow error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
