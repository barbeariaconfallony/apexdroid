import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { prompt, screenName, existingComponents, settings } = await request.json()

    const provider = settings?.provider || 'groq'
    const apiKey = settings?.apiKey || ''
    const model = settings?.model || 'llama-3.3-70b-versatile'
    const baseUrl = settings?.baseUrl

    const systemPrompt = `Você é um especialista em lógica de programação para Kodular/MIT App Inventor e design de fluxogramas.
Sua tarefa é converter uma descrição de comportamento em um JSON estruturado de nós e conexões para um editor de fluxograma.

ESTRUTURA DO JSON ESPERADO:
{
  "nodes": [
    {
      "id": "string único",
      "type": "start" | "process" | "decision" | "logic" | "database" | "action",
      "label": "Título do nó",
      "x": número,
      "y": número,
      "width": 200,
      "height": 80,
      "metadata": {
        "componentName": "Nome do componente (se aplicável)",
        "componentType": "Tipo do componente (Button, Label, etc)",
        "functions": [
          {
            "id": "string",
            "type": "event" | "method" | "property_set" | "property_get",
            "name": "Nome técnico (Click, Text, etc)",
            "label": "Nome legível",
            "value": qualquer,
            "inputType": "text" | "number" | "boolean" | "color" | "choice"
          }
        ]
      }
    }
  ],
  "edges": [
    { "id": "string", "source": "id_origem", "target": "id_destino", "label": "Sim" | "Não" | undefined }
  ]
}

COMPONENTES DISPONÍVEIS NA TELA:
${JSON.stringify(existingComponents, null, 2)}

REGRAS:
1. Use APENAS os componentes listados acima.
2. Para eventos, use o tipo "start" ou "process" e adicione a função de evento no metadata.
3. Organize os nós visualmente (distribua x e y com espaçamento de ~150px-200px).
4. Para condicionais (Se/If), use o tipo "decision" e crie duas conexões de saída: uma com label "Sim" e outra "Não".
5. Retorne APENAS o JSON puro, sem blocos de código markdown.`

    const aiModel = getAIModel({ provider, apiKey, model, baseUrl })
    
    const { text } = await generateText({
      model: aiModel,
      system: systemPrompt,
      prompt: `Descrição do fluxo: ${prompt}`,
      temperature: 0.3,
    })

    let jsonStr = text.trim()
    jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    
    // Extrair JSON se estiver em blocos markdown
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    try {
      const data = JSON.parse(jsonStr)
      return NextResponse.json(data)
    } catch (e) {
      console.error('Failed to parse AI JSON:', jsonStr)
      return NextResponse.json({ error: 'Falha ao processar resposta da IA. Tente novamente.' }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Generate flow error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
