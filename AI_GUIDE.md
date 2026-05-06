# Guia de Uso - Funcionalidades de IA do APEX DROID

## Configuração Inicial

### Pré-requisitos
- Chave de API da OpenAI (`OPENAI_API_KEY`)
- Conexão com internet estável

### Setup
1. Adicione a variável de ambiente:
   ```bash
   OPENAI_API_KEY=sk-...
   ```

2. Reinicie o servidor de desenvolvimento

---

## 1. Chat APEX DROID IA

### Localização
Painel esquerdo da IDE, identificado com ícone ⚡ "APEX DROID AI"

### Como Usar
1. Clique no painel para expandir (se colapsado)
2. Digite sua solicitação em português natural
3. Pressione **Enter** ou clique no botão de envio
4. Receba a resposta em tempo real com streaming

### Exemplos de Solicitações
```
"Como criar um formulário de login?"
"Explique o uso do componente TinyDB"
"Qual é a melhor prática para validar email?"
"Como implementar autenticação?"
"Sugira uma estrutura para um app de lista de tarefas"
```

### Dicas
- Seja específico sobre o que quer fazer
- Mencione componentes ou tecnologias específicas
- Peça exemplos para respostas mais claras
- Use para aprender boas práticas

---

## 2. Gerador de Componentes IA

### Localização
Menu "Mais" (⋮) → "Gerar Componente IA"

### Como Usar
1. Clique em "Gerar Componente IA"
2. Descreva o componente desejado em detalhe
3. Clique "Gerar Componente"
4. Analise a sugestão gerada
5. Clique "Adicionar ao Projeto" para incluir

### Exemplos de Descrições
```
"Um campo de entrada para email com validação"
"Um botão com ícone de busca e cor azul"
"Uma lista de produtos com nome, preço e imagem"
"Um formulário para cadastro de usuário"
"Um painel de configurações com switches"
```

### Resultado
A IA retorna:
- **Tipo**: Tipo de componente (Button, TextInput, etc)
- **Nome**: Nome único sugerido
- **Propriedades**: Configurações recomendadas
- **Descrição**: O que foi criado

### Limitações
- Gera apenas 1 componente por vez
- Para estruturas complexas, gere e combine múltiplos
- Revise as propriedades após adicionar

---

## 3. Debug Assistant

### Localização
Menu "Mais" (⋮) → "Debug Assistant"

### Como Usar
1. Clique em "Debug Assistant"
2. Cole a mensagem de erro recebida
3. (Opcional) Indique qual componente está afetado
4. Clique "Analisar Erro"
5. Receba análise detalhada com soluções
6. Copie a análise se necessário

### Tipos de Erros Suportados
```
NullPointerException
ClassNotFoundException
MethodInvocationException
AsyncTaskException
FileNotFoundException
Erros de permissão
Erros de conexão
```

### O que a Análise Inclui
1. O que provavelmente causou o erro
2. Como identificar a raiz do problema
3. Passos específicos para corrigir
4. Como evitar no futuro

### Exemplo
**Erro:**
```
RuntimeException: Unable to instantiate activity
Component not initialized
```

**Análise retornada:**
- Causa provável: Componente chamado antes de ser inicializado
- Solução: Adicione verificação de null antes de usar
- Prevenção: Use inicialização em onCreate()

---

## 4. Painel de Sugestões de Código

### Localização
Painel flutuante no canto inferior direito

### Como Funciona (Automático)
1. Selecione um componente no preview
2. O painel se abre automaticamente
3. Receberá sugestões de blocos para usar com esse componente
4. Clique para expandir/colapsar o painel

### Sugestões Fornecidas
- Blocos que funcionam bem com o componente
- Padrões comuns de implementação
- Otimizações recomendadas
- Próximos passos lógicos

### Exemplo
**Componente Selecionado:** Button
**Sugestões:**
- Usar bloco "when Button.Click"
- Adicionar animação com "animate"
- Validar estado antes de executar ação
- Implementar feedback visual

---

## Dicas e Boas Práticas

### Para Melhores Resultados

1. **Seja Descritivo**
   - ❌ "Criar campo"
   - ✅ "Criar campo de email com validação e ícone"

2. **Inclua Contexto**
   - ❌ "Como fazer requisição?"
   - ✅ "Como fazer requisição HTTP POST para enviar dados?"

3. **Use Exemplos**
   - Mencione o que já tentou
   - Descreva o comportamento esperado vs atual

4. **Revise Sugestões**
   - A IA pode não entender 100% do contexto
   - Sempre valide componentes antes de usar
   - Teste em emulador antes de publicar

### Limitações Conhecidas

1. **Contexto Limitado**: A IA vê apenas o projeto atual
2. **Componentes Específicos**: Sugestões baseadas em padrões gerais
3. **Erros Complexos**: Alguns erros precisam debugging manual
4. **Performance**: Requisições lentas em conexões ruins

---

## Troubleshooting

### "Erro na API"
- Verifique conexão com internet
- Confirme que OPENAI_API_KEY está configurada
- Tente novamente em alguns segundos

### "Sem resposta do servidor"
- Reinicie o servidor de desenvolvimento
- Verifique logs para mais detalhes
- Contate suporte se persistir

### "Sugestões não relevantes"
- Seja mais específico na descrição
- Inclua mais contexto sobre o projeto
- Tente reformular a solicitação

### "Componente não adicionado"
- Verifique se há um projeto carregado
- Confirme se as propriedades são válidas
- Tente gerar novamente

---

## Casos de Uso Avançados

### 1. Aprender Padrões
```
Chat: "Mostre um padrão de MVC para um app de TODO"
Resultado: Explicação detalhada com exemplo de código
```

### 2. Revisar Lógica
```
Chat: "Esta é minha lógica de validação de email. Está correta?"
[Cole código]
Resultado: Feedback sobre a implementação
```

### 3. Otimizar Performance
```
Chat: "Como otimizar um app com muitos componentes?"
Resultado: Dicas de performance específicas
```

### 4. Debug em Equipe
```
Debug: Cole erro + contexto detalhado
Resultado: Análise para compartilhar com o time
```

---

## Privacidade e Segurança

### Dados Enviados para IA
- Conteúdo do chat
- Contexto do projeto (nomes de componentes)
- Mensagens de erro

### Dados NÃO Enviados
- Código visual completo
- Credenciais ou senhas
- Dados de usuário do aplicativo

### Disclaimer
- Respostas podem conter erros
- Sempre valide sugestões
- Use para aprendizado, não como verdade absoluta
- OpenAI pode coletar dados conforme política deles

---

## Integração com Fluxos de Trabalho

### Desenvolvimento Rápido
1. Chat: Entenda os requisitos
2. Component Generator: Crie interface
3. Code Suggestions: Implemente lógica
4. Debug Assistant: Corrija erros

### Aprendizado
1. Chat: Faça perguntas de conceito
2. Code Suggestions: Veja padrões recomendados
3. Debug: Entenda erros comuns
4. Pratique implementação

### Code Review
1. Chat: Solicite revisão de lógica
2. Debug: Analise erros encontrados
3. Suggestions: Veja otimizações
4. Implemente melhorias

---

## Suporte e Feedback

### Reportar Problemas
1. Anote o erro exato
2. Descreva o que estava fazendo
3. Compartilhe contexto do projeto
4. Contacte time de desenvolvimento

### Solicitar Features
- Sugestões de novos prompts
- Melhorias nas análises
- Novos tipos de assistência
- Integrações com outras ferramentas

---

## Conclusão

As funcionalidades de IA do APEX DROID são ferramentas poderosas para:
- Acelerar desenvolvimento
- Aprender boas práticas
- Debugar problemas
- Melhorar qualidade de código

Explore, experimente e adapte ao seu fluxo de trabalho!
