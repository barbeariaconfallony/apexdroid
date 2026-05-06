# Configuração Groq - APEX DROID IA

## Visão Geral

O APEX DROID IDE agora utiliza a **Groq** como provider principal de IA para suas funcionalidades de chat e geração de componentes. Groq oferece:

- **3x mais rápido** que OpenAI (latência de 50-100ms)
- **10x mais barato** em custo por token
- **Melhor performance** em tarefas de programação
- **Modelos especializados** para cada tipo de tarefa

## Modelos Utilizados

### 1. **llama-3.3-70b-versatile**
**Uso**: Chat principal e sugestões de código
- Excelente para conversas naturais
- Forte em geração de código
- Rápido e preciso para programação mobile
- Temperatura: 0.7

**Exemplo de uso**:
```
- "Como crio um botão que muda de cor ao clicar?"
- "Gere um componente de formulário de cadastro"
- "Sugira um padrão para validar emails"
```

### 2. **deepseek-r1-distill-llama-70b**
**Uso**: Debug Assistant (análise de erros)
- Especializado em raciocínio lógico
- Excelente para identificar bugs
- Fornece explicações detalhadas
- Temperatura: 0.6

**Exemplo de uso**:
```
- "Meu aplicativo congela ao salvar dados, por quê?"
- "Como debugar problemas de carregamento de imagens?"
```

### 3. **qwen-qwq-32b**
**Alternativa** para tasks de código simples
- Mais rápido que DeepSeek
- Bom custo-benefício
- Pode ser usado em sugestões futuras

## Configuração

### Pré-requisitos
1. Ter uma chave Groq válida
2. Node.js 18+ instalado
3. pnpm ou npm instalado

### 1. Obter Chave de API

```bash
# Visite o console do Groq
https://console.groq.com/keys

# Crie uma nova chave de API (grátis)
# Copie a chave
```

### 2. Configurar Variável de Ambiente

**Opção A: Arquivo .env.local**
```bash
GROQ_API_KEY=gsk_seu_token_aqui
```

**Opção B: Environment variables do Vercel**
```bash
# No painel do Vercel
Settings → Environment Variables
Key: GROQ_API_KEY
Value: gsk_seu_token_aqui
```

### 3. Validar Configuração

```bash
# Testar a conexão
npm run dev

# No IDE, tente usar o chat APEX DROID IA
# Se funcionar, a configuração está OK
```

## API Routes Configuradas

### POST `/api/ai/chat`
Chat interativo com streaming

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Crie um botão" }
  ],
  "context": "Projeto: MyApp. Componentes: Button, Label"
}
```

**Response**: Stream de texto (SSE)

### POST `/api/ai/generate-component`
Gera componentes estruturados

**Request:**
```json
{
  "description": "Um botão azul com texto 'Clique aqui'",
  "projectContext": "Projeto atual..."
}
```

**Response:**
```json
{
  "component": {
    "$Name": "CustomButton",
    "Text": "Clique aqui",
    "BackgroundColor": "#0066FF",
    "Width": "Automatic"
  }
}
```

### POST `/api/ai/debug`
Análise de erros

**Request:**
```json
{
  "error": "NullPointerException quando clico no botão",
  "componentName": "Button1"
}
```

**Response:**
```json
{
  "analysis": "O erro ocorre porque... Solução: ..."
}
```

### POST `/api/ai/code-suggestions`
Sugestões contextuais

**Request:**
```json
{
  "selectedComponent": "Button1",
  "projectContext": "..."
}
```

**Response**: Stream de sugestões

## Performance e Limites

### Quotas Gratuitas do Groq
- **Limite**: 14,400 requisições por dia
- **Custo**: Grátis até os limites
- **Upgrade**: Planos pagos disponíveis para uso em produção

### Tempos de Resposta
- Chat: 50-200ms por token
- Generate Component: 200-500ms
- Debug: 300-800ms (mais análise)
- Sugestões: 100-300ms

### Dicas de Otimização
1. Use `temperature` baixa (0.5-0.6) para tarefas determinísticas
2. Use `temperature` alta (0.7-0.9) para criatividade
3. Limite `maxTokens` para respostas mais rápidas
4. Reuse mensagens do chat para contexto melhor

## Troubleshooting

### Erro: "GROQ_API_KEY is not set"
```bash
# Verifique se a variável está configurada
echo $GROQ_API_KEY

# Configure se necessário
export GROQ_API_KEY=gsk_seu_token
```

### Erro: "Rate limit exceeded"
- Groq tem limite de 14,400 requisições/dia
- Implemente cache de respostas
- Use batching para múltiplas requisições

### Respostas muito lentas
- Verifique sua conexão de internet
- Reduza `maxTokens`
- Tente um modelo mais rápido (llama em vez de deepseek)

### Respostas de baixa qualidade
- Melhore o `systemPrompt` com mais contexto
- Aumente a `temperature` para mais variedade
- Forneça exemplos de saída esperada

## Comparação com Outras Opções

| Aspecto | Groq | OpenAI | Anthropic |
|---------|------|--------|-----------|
| Latência | 50-100ms | 500-1000ms | 400-800ms |
| Custo/1K tokens | $0.05 | $0.03 | $0.03 |
| Programação | Excelente | Bom | Bom |
| Raciocínio | Muito bom | Excelente | Excelente |
| Disponibilidade | 99.9% | 99.5% | 99.5% |

## Próximos Passos

1. Testar todas as funcionalidades de IA
2. Coletar feedback dos usuários
3. Otimizar prompts baseado em uso real
4. Implementar cache de respostas
5. Monitorar quotas de uso

## Recursos Úteis

- **Console Groq**: https://console.groq.com
- **Documentação Groq**: https://console.groq.com/docs
- **AI SDK Groq**: https://sdk.vercel.ai/docs/reference/ai-sdk-groq
- **Modelos Disponíveis**: https://console.groq.com/docs/models

## Suporte

Para dúvidas ou problemas:
1. Verifique este guia
2. Consulte a documentação oficial do Groq
3. Abra uma issue no repositório
4. Entre em contato com o suporte
