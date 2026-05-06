import { streamText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'

// Funcao para criar o modelo baseado no provider
function getAIModel(provider: string, apiKey: string, model: string, baseUrl?: string) {
  switch (provider) {
    case 'groq':
      const groq = createGroq({
        apiKey: apiKey || process.env.GROQ_API_KEY,
      })
      return groq(model || 'llama-3.3-70b-versatile')
    
    case 'openai':
      const openai = createOpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY,
        baseURL: baseUrl || 'https://api.openai.com/v1',
      })
      return openai(model || 'gpt-4-turbo')
    
    case 'ollama':
      const ollama = createOpenAI({
        apiKey: 'ollama', // Ollama nao precisa de chave
        baseURL: baseUrl || 'http://localhost:11434/v1',
      })
      return ollama(model || 'llama3.2')
    
    default:
      // Fallback para Groq
      const defaultGroq = createGroq({
        apiKey: apiKey || process.env.GROQ_API_KEY,
      })
      return defaultGroq(model || 'llama-3.3-70b-versatile')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, context, settings } = body
    
    // Extrair configuracoes do usuario ou usar defaults
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

    // System prompt for APEX DROID AI
    const systemPrompt = `Voce e o APEX DROID AI, assistente especializado em desenvolvimento de aplicativos moveis no estilo MIT App Inventor/Kodular.

${context ? `ESTADO ATUAL DO PROJETO:
${context}
` : 'Nenhum projeto carregado ainda.\n'}
VOCE PODE EXECUTAR ACOES DIRETAS NO PROJETO. Quando o usuario pedir para modificar o projeto, responda OBRIGATORIAMENTE com um bloco de acoes JSON apos sua explicacao em texto.

ACOES DISPONIVEIS:

1. Adicionar componente:
\`\`\`actions
[
  {
    "action": "add_component",
    "parentName": "Screen1",
    "type": "Button",
    "properties": { "$Name": "Button1", "Text": "Clique aqui", "BackgroundColor": "#2196F3", "TextColor": "#FFFFFF", "Width": "Fill parent" }
  }
]
\`\`\`

2. Atualizar propriedades de componente existente:
\`\`\`actions
[
  {
    "action": "update_component",
    "name": "Button1",
    "properties": { "Text": "Novo Texto", "BackgroundColor": "#FF5722" }
  }
]
\`\`\`

3. Remover componente:
\`\`\`actions
[
  {
    "action": "remove_component",
    "name": "Button1"
  }
]
\`\`\`

4. Multiplas acoes ao mesmo tempo:
\`\`\`actions
[
  { "action": "add_component", "parentName": "Screen1", "type": "Label", "properties": { "$Name": "TitleLabel", "Text": "Titulo", "FontSize": "20", "Width": "Fill parent" } },
  { "action": "add_component", "parentName": "Screen1", "type": "Button", "properties": { "$Name": "ActionButton", "Text": "Acao", "Width": "Fill parent" } }
]
\`\`\`

TIPOS DE COMPONENTES VALIDOS: Button, Label, TextBox, Image, ListView, CheckBox, Switch, Slider, ProgressBar, Spinner, DatePicker, TimePicker, WebViewer, VideoPlayer, HorizontalArrangement, VerticalArrangement, TableArrangement, CardView, FAB, Snackbar, TextInput, RadioButton

PROPRIEDADES COMUNS:
- Width: "Fill parent", "Automatic", numero em pixels
- Height: "Fill parent", "Automatic", numero em pixels  
- BackgroundColor: codigo hex (#RRGGBB) ou "-1" para transparente
- TextColor: codigo hex (#RRGGBB)
- FontSize: numero (ex: "14", "18", "24")
- Text: texto do componente
- Visible: "True" ou "False"
- AlignHorizontal: "1" (esquerda), "2" (centro), "3" (direita)
- AlignVertical: "1" (topo), "2" (centro), "3" (baixo)

REGRAS IMPORTANTES:
- Se nao ha projeto carregado, nao envie bloco actions, apenas explique
- O parentName padrao para a tela raiz e "Screen1" (ou o nome da tela atual)
- Sempre crie nomes unicos e descritivos para os componentes ($Name)
- Responda SEMPRE em portugues brasileiro
- Seja direto: primeiro explique o que vai fazer, depois envie o bloco actions`

    // Criar modelo baseado nas configuracoes
    const aiModel = getAIModel(provider, apiKey, model, baseUrl)

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
      maxTokens: 2048,
    })

    return result.toDataStreamResponse()
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
