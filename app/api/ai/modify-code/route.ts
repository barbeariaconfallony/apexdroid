import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getAIModel } from '@/lib/ai-service'

export async function POST(req: NextRequest) {
  try {
    const { code, instruction, settings } = await req.json()

    if (!code || !instruction) {
      return NextResponse.json(
        { error: 'Codigo e instrucao sao obrigatorios' },
        { status: 400 }
      )
    }

    const model = getAIModel(settings)

    const systemPrompt = `Voce e um especialista em desenvolvimento de aplicativos MIT App Inventor/Kodular.
Sua tarefa e modificar o codigo JSON/SCM de um componente de tela conforme a instrucao do usuario.

REGRAS IMPORTANTES:
1. Retorne APENAS o JSON modificado, sem explicacoes ou markdown
2. Mantenha a estrutura valida do JSON
3. Preserve todos os campos existentes que nao foram pedidos para modificar
4. Use nomes de propriedades corretos do App Inventor/Kodular
5. Se adicionar novos componentes, use $Name unico e incremental
6. Mantenha a hierarquia de $Components correta

Tipos de componentes disponiveis:
- HorizontalArrangement, VerticalArrangement, TableArrangement
- Button, Label, TextBox, PasswordTextBox
- Image, ListView, Spinner, CheckBox, Switch
- Canvas, WebViewer, VideoPlayer
- Notifier, TinyDB, Clock, etc.

Propriedades comuns:
- $Name, $Type, $Version
- Text, FontSize, FontBold, TextColor, BackgroundColor
- Width, Height (numeros ou -1 para parent, -2 para automatic)
- Visible, Enabled
- AlignHorizontal, AlignVertical (1=left/top, 2=center, 3=right/bottom)`

    const userPrompt = `CODIGO ATUAL:
\`\`\`json
${code}
\`\`\`

INSTRUCAO DO USUARIO:
${instruction}

Retorne o JSON modificado:`

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 8000,
      temperature: 0.3
    })

    // Limpar resposta - remover markdown se houver
    let cleanedCode = text.trim()
    if (cleanedCode.startsWith('```')) {
      cleanedCode = cleanedCode.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    // Validar JSON
    try {
      JSON.parse(cleanedCode)
    } catch {
      return NextResponse.json(
        { error: 'A IA gerou um JSON invalido. Tente novamente com instrucoes mais claras.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ modifiedCode: cleanedCode })
  } catch (error) {
    console.error('Erro ao modificar codigo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
