import { generateObject } from 'ai'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-service'

// Schema for component generation
const ComponentSchema = z.object({
  type: z.string().describe('O tipo de componente (ex: Button, TextInput, ListView)'),
  name: z.string().describe('Nome único do componente'),
  properties: z.record(z.any()).describe('Propriedades do componente'),
  children: z.array(z.any()).optional().describe('Componentes filhos, se aplicável'),
  description: z.string().describe('Descrição do que foi criado')
})

type GeneratedComponent = z.infer<typeof ComponentSchema>

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, projectContext, settings } = body
    
    // Extrair configuracoes do usuario
    const provider = settings?.provider || 'groq'
    const apiKey = settings?.apiKey || ''
    const model = settings?.model || 'llama-3.3-70b-versatile'
    const baseUrl = settings?.baseUrl

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    const prompt = `Você é um especialista em desenvolvimento de aplicativos móveis com MIT App Inventor/Kodular.
    
Gere um componente baseado no seguinte pedido:
"${description}"

${projectContext ? `\nContexto do projeto:
${projectContext}` : ''}

Retorne um JSON bem estruturado com:
1. type: tipo de componente (Button, TextInput, Label, HorizontalArrangement, VerticalArrangement, ListView, ImageSprite, etc)
2. name: um nome único e descritivo em camelCase
3. properties: um objeto com as propriedades relevantes do componente
4. children: array opcional de componentes filhos (para containers)
5. description: breve explicação do componente gerado

Exemplos de componentes válidos: Button, TextInput, Label, HorizontalArrangement, VerticalArrangement, ListView, Canvas, ImageSprite, Clock, TinyDB, etc`

    const aiModel = getAIModel({ provider, apiKey, model, baseUrl })
    
    const { object } = await generateObject({
      model: aiModel,
      schema: ComponentSchema,
      prompt,
      temperature: 0.5,
    })

    return NextResponse.json({
      success: true,
      component: object as GeneratedComponent
    })
  } catch (error) {
    console.error('Component generation error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate component' 
      },
      { status: 500 }
    )
  }
}
