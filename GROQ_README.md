# APEX DROID IA com Groq

## ⚡ Comece Agora

### 1. Obtenha uma Chave Groq (Grátis)
```bash
# Visite
https://console.groq.com/keys

# Crie conta → Crie chave → Copie: gsk_XXXX
```

### 2. Configure a Chave
```bash
# No Vercel Settings ou .env.local
GROQ_API_KEY=gsk_seu_token_aqui
```

### 3. Reinicie o Servidor
```bash
npm run dev
```

### 4. Use a IA no IDE
- Abra http://localhost:3000/ide
- Chat APEX DROID IA está no painel esquerdo
- Tudo funcionando? ✅

## 📊 O Que Você Tem

### Chat Inteligente
- Respostas em **50-200ms** (ultrarrápido)
- Suporte completo a português
- Contexto automático do projeto

### Gerador de Componentes
- Crie componentes descrevendo em português
- JSON estruturado pronto para usar
- Adicione com um clique

### Debug Assistant
- Analisa erros com profundidade
- Sugere correções acionáveis
- Especifico para programação mobile

### Code Suggestions
- Painel automático de sugestões
- Padrões comuns recomendados
- Otimizações em tempo real

## 💰 Valores

| Plano | Requisições/Dia | Preço |
|-------|-----------------|-------|
| Gratuito | 14,400 | Grátis |
| Pago | Ilimitado | $0.30/M tokens |

**Para 99% dos casos de desenvolvimento, o plano gratuito é suficiente!**

## 📚 Documentação

1. **GROQ_SETUP.md** - Configuração técnica detalhada
2. **AI_GUIDE.md** - Como usar cada funcionalidade
3. **GROQ_INTEGRATION.md** - Status da integração

## 🚀 Comandos Úteis

```bash
# Verificar se Groq está funcionando
curl https://api.groq.com/health

# Ver consumo de requisições
# Visite: https://console.groq.com/usage

# Testar API diretamente
curl -H "Authorization: Bearer $GROQ_API_KEY" \
  https://api.groq.com/v1/models
```

## ❓ FAQ Rápido

**P: Preciso pagar?**  
R: Não! Plano gratuito é suficiente para desenvolvimento.

**P: Posso usar em produção?**  
R: Sim! Mas considere upgrade para melhor performance.

**P: Quanto tempo as respostas levam?**  
R: 50-200ms (ChatGPT leva 800-1500ms).

**P: Meus dados são privados?**  
R: Sim. Groq não armazena conversas por padrão.

**P: Qual é o melhor modelo?**  
R: Llama 3.3 para programação, DeepSeek R1 para debug.

## 🐛 Problemas?

### "GROQ_API_KEY is not set"
```bash
echo $GROQ_API_KEY  # Deve mostrar gsk_...
export GROQ_API_KEY=gsk_seu_token  # Configure se vazio
```

### "Rate limit exceeded"
Você usou 14,400 requisições. Espere até amanhã.

### Respostas lentas
- Verifique internet
- Status: https://status.groq.com
- Tente reformular pergunta

### Sem respostas
- Reinicie servidor (`npm run dev`)
- Verifique chave API
- Veja logs do terminal

## 📖 Exemplos de Uso

### Chat
```
"Como criar um login com email?"
"Explique o componente TextBox"
"Qual o padrão para validar telefone?"
```

### Gerador
```
"Um campo email com validação e ícone"
"Um botão azul com sombra e hover"
"Uma lista de produtos com preço"
```

### Debug
```
[Cole mensagem de erro]
"Meu app congela ao salvar dados"
"NullPointerException na linha 45"
```

## 🎯 Próximos Passos

1. ✅ Configure GROQ_API_KEY
2. ✅ Reinicie servidor
3. ✅ Teste chat APEX DROID
4. ✅ Explore component generator
5. ✅ Use debug assistant para erros
6. ✅ Sugira melhorias!

## 📞 Suporte

- **Docs Groq**: https://console.groq.com/docs
- **Status**: https://status.groq.com
- **Console**: https://console.groq.com
- **Issues**: Abra no repositório

## 📊 Comparação Rápida

```
Groq vs OpenAI:
- Llama 3.3 é 67x mais barato que GPT-4
- 3x mais rápido (latência)
- Ideal para produção mobile
- Melhor suporte a código
```

---

**Pronto para desenvolver com IA ultrarrápida! 🚀**

Qualquer dúvida, consulte os arquivos de documentação.
