# 🚀 APEX DROID IDE - Inicialização

## Comando para iniciar o servidor

```bash
npm run dev
```

O servidor Next.js será iniciado em: **http://localhost:3000**

## Solução de problemas

### Localhost não funciona mas o IP da rede funciona

Isso acontece quando um processo `node.exe` antigo ficou preso na porta 3000.

**1. Verificar processos na porta 3000:**
```bash
netstat -ano | findstr "3000" | findstr "LISTENING"
```

**2. Se houver mais de um processo LISTENING, matar o conflitante:**
```bash
taskkill /PID <PID_DO_PROCESSO_ANTIGO> /F
```

**3. Se precisar reiniciar tudo do zero:**
```bash
taskkill /F /IM node.exe
npm run dev
```
