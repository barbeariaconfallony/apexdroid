import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    
    if (!rawBody) {
      console.error('Modify code error: Empty request body')
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      )
    }

    let body
    try {
      body = JSON.parse(rawBody)
    } catch (e) {
      console.error('Modify code error: Invalid JSON in request body', rawBody)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { code, instruction, settings } = body
    
    // Extrair configuracoes do usuario
    const provider = settings?.provider || 'groq'
    const apiKey = settings?.apiKey || ''
    const model = settings?.model || 'llama-3.3-70b-versatile'
    const baseUrl = settings?.baseUrl

    if (!code || !instruction) {
      return NextResponse.json(
        { error: 'Code and instruction are required' },
        { status: 400 }
      )
    }

    // Detectar formato do código (JSON vs XML/BKY)
    const isJson = code.trim().startsWith('{') || code.trim().startsWith('[')

    const systemPrompt = isJson 
      ? `Você é um especialista em arquivos SCM do Kodular/MIT App Inventor. 
Arquivos SCM são representações JSON de telas e componentes.

Sua tarefa é modificar o JSON fornecido seguindo as instruções do usuário.
Regras:
1. Retorne APENAS o JSON modificado.
2. Não inclua blocos de código markdown (\`\`\`json ... \`\`\`).
3. Não inclua nenhuma explicação antes ou depois do JSON.
4. Mantenha a estrutura válida do SCM.
5. Se a instrução pedir para mudar cores, use o formato &HAARRGGBB (ex: &HFFFF0000 para vermelho).
6. Se a instrução pedir para mudar dimensões, use -1 para Automático e -2 para Fill Parent.
7. Garanta que o JSON resultante seja válido e possa ser parseado.`
      : `Você é um especialista em arquivos BKY (Blockly XML) do Kodular/MIT App Inventor.
Arquivos BKY são representações XML da lógica de blocos.

Sua tarefa é modificar o XML fornecido seguindo as instruções do usuário.
Regras:
1. Retorne APENAS o XML modificado.
2. Não inclua blocos de código markdown (\`\`\`xml ... \`\`\`).
3. Não inclua nenhuma explicação antes ou depois do XML.
4. Mantenha a estrutura válida do BKY (Blockly).
5. Garanta que o XML resultante seja válido e bem formatado.`

    const prompt = `${isJson ? 'JSON' : 'XML'} ATUAL:
${code}

INSTRUÇÃO:
${instruction}`

    const aiModel = getAIModel({ provider, apiKey, model, baseUrl })
    
    const { text } = await generateText({
      model: aiModel,
      system: systemPrompt,
      prompt,
      temperature: 0.2,
    })

    // Extração robusta de código do retorno da IA
    let modifiedCode = text.trim()
    
    // 1. Remover blocos de raciocínio (comum em modelos como DeepSeek R1)
    modifiedCode = modifiedCode.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

    // 2. Tentar extrair de blocos markdown
    const codeMatch = modifiedCode.match(/```(?:json|xml|html|plain)?\s*([\s\S]*?)\s*```/)
    if (codeMatch) {
      modifiedCode = codeMatch[1].trim()
    } else {
      // 3. Heurística de extração baseada no formato esperado
      if (isJson) {
        const firstBrace = modifiedCode.indexOf('{')
        const lastBrace = modifiedCode.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          modifiedCode = modifiedCode.substring(firstBrace, lastBrace + 1)
        }
      } else {
        const firstTag = modifiedCode.indexOf('<')
        const lastTag = modifiedCode.lastIndexOf('>')
        if (firstTag !== -1 && lastTag !== -1 && lastTag > firstTag) {
          modifiedCode = modifiedCode.substring(firstTag, lastTag + 1)
        }
      }
    }

    // Validar o resultado
    if (isJson) {
      try {
        JSON.parse(modifiedCode)
      } catch (e) {
        console.error('AI generated invalid JSON:', modifiedCode)
        return NextResponse.json(
          { error: 'A IA gerou um JSON inválido. Tente novamente com uma instrução mais clara ou outro modelo.' },
          { status: 500 }
        )
      }
    } else {
      // Validação básica de XML (pelo menos deve começar com < e terminar com >)
      if (!modifiedCode.startsWith('<') || !modifiedCode.endsWith('>')) {
        console.error('AI generated invalid XML/BKY:', modifiedCode)
        return NextResponse.json(
          { error: 'A IA gerou um XML inválido para os blocos. Tente novamente.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      modifiedCode,
      format: isJson ? 'json' : 'xml'
    })
  } catch (error) {
    console.error('Modify code error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to modify code' 
      },
      { status: 500 }
    )
  }
}

