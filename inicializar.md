# 🚀 APEX DROID IDE - Inicialização

## Pré-requisitos

- Node.js instalado (versão 18 ou superior)
- npm (gerenciador de pacotes padrão)

## 1. Instalar dependências

Execute este comando apenas na primeira vez ou quando adicionar novos pacotes:

```bash
npm install
```

## 2. Iniciar o servidor de desenvolvimento

Para iniciar o servidor Next.js em modo de desenvolvimento com hot reload:

```bash
npm run dev
```

O servidor será iniciado em: **http://localhost:3000**

## 3. Comandos adicionais

**Build para produção:**
```bash
npm run build
```

**Iniciar servidor de produção (após build):**
```bash
npm start
```

**Executar linter:**
```bash
npm run lint
```

## Solução de problemas

### Porta 3000 já está em uso

Se você receber um erro indicando que a porta 3000 já está em uso, existem várias causas possíveis:

**Windows - Verificar processos na porta 3000:**
```bash
netstat -ano | findstr "3000" | findstr "LISTENING"
```

**Windows - Matar processo na porta 3000:**
```bash
taskkill /PID <PID_DO_PROCESSO> /F
```

**Windows - Matar todos os processos Node:**
```bash
taskkill /F /IM node.exe
```

**macOS/Linux - Matar processo na porta 3000:**
```bash
lsof -ti:3000 | xargs kill -9
```

Depois, execute novamente:
```bash
npm run dev
```

### Erro de módulos não encontrados

Se receber erros sobre módulos não encontrados, reinstale as dependências:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Hot reload não está funcionando

Limpe o cache do Next.js e reinicie:

```bash
rm -rf .next
npm run dev
```
