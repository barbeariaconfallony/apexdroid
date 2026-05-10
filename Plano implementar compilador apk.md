# Plano de Implementação: Compilador Real de APK (GitHub Actions + Docker)

Este documento detalha o roteiro técnico passo a passo para transformar a APEX DROID IDE em uma plataforma de compilação real e 100% gratuita, sem a necessidade de servidores pagos (como Railway ou Render). Utilizaremos a infraestrutura do GitHub Actions associada a containers Docker contendo o MIT App Inventor Build Server.

---

## Fase 1: Arquitetura de Empacotamento (Formato AIA)
Atualmente a IDE salva os arquivos `.scm` (Tela) e `.bky` (Blocos) isoladamente. Para o motor de compilação do MIT aceitar o projeto, precisamos organizá-lo no formato de um projeto válido do App Inventor (`.aia`, que é basicamente um arquivo `.zip`).

1. **Geração do `project.properties`**:
   - Criar uma rotina no frontend ou backend (`api/build`) que gere automaticamente o arquivo `youngandroidproject/project.properties`.
   - Este arquivo deve conter os metadados como Nome do Pacote (ex: `com.apexdroid.app`), Ícone, Nome do App, Versão e Cores principais.
2. **Estruturação de Pastas**:
   - Organizar a estrutura antes de enviar para o GitHub:
     ```text
     /src
       /youngandroidproject
         project.properties
       /appinventor/ai_username/NomeDoProjeto
         Screen1.scm
         Screen1.bky
       /assets
         icone.png
         imagem.jpg
     ```
3. **Empacotamento Automático**:
   - Desenvolver um script ou usar uma biblioteca Node.js (ex: `jszip`) no momento em que o usuário clica em "Build APK" para gerar o arquivo `projeto.aia` em memória.

---

## Fase 2: O Motor de Build (GitHub Actions)
Criar a esteira de CI/CD que fará o trabalho pesado utilizando os computadores virtuais gratuitos do GitHub.

1. **Injeção do Workflow (`build-real.yml`)**:
   - A IDE deverá injetar na raiz do repositório do usuário o arquivo `.github/workflows/build-apk.yml`.
2. **Composição do Workflow (Pipeline)**:
   - **Gatilho (Trigger):** `workflow_dispatch` (permite que a API da APEX DROID inicie o build remotamente).
   - **Ambiente:** Ubuntu Latest.
   - **Step 1: Setup Java/Docker**: Garantir que o ambiente possua os requisitos necessários.
   - **Step 2: Start Build Server**: Baixar uma imagem Docker open-source da comunidade contendo o servidor de build do MIT (ex: `docker run -d -p 9990:9990 devyanshm/appinventor-buildserver` ou clonar o repositório `mit-cml/appinventor-sources` e compilar via Apache Ant).
   - **Step 3: Compilação via API Local**: O próprio Github Action rodará um script Python ou `curl` enviando o arquivo `projeto.aia` gerado na Fase 1 para `http://localhost:9990/build/android`.
   - **Step 4: Upload do Artefato**: Capturar o arquivo `.apk` retornado pelo servidor local do Docker e usar a action `actions/upload-artifact@v4` para disponibilizá-lo para download seguro no GitHub.

---

## Fase 3: Segurança e Assinatura (Keystore)
Um arquivo APK só pode ser instalado em celulares Android se possuir uma assinatura criptográfica.

1. **Geração Automática de Keystore**:
   - Durante a Fase 2 (dentro do GitHub Actions), rodar o comando Java `keytool -genkey` para criar uma `android.keystore` efêmera (caso seja modo Debug) ou usar uma Keystore persistente do projeto (se for modo Release) como padrão usar sempre a do modo release.
2. **Integração no Build Server**:
   - Instruir o comando de build a utilizar essa Keystore recém gerada para assinar o `.apk`.

---

## Fase 4: Integração Backend (O Elo de Comunicação)
O Backend Next.js precisará se comunicar com o GitHub para orquestrar o processo.

1. **Endpoint `POST /api/build/real`**:
   - Receberá o `.aia` ou acionará a criação dele.
   - Fazer uma requisição autenticada (usando o `ghToken` do usuário) para a API do GitHub (`POST /repos/{owner}/{repo}/actions/workflows/build-apk.yml/dispatches`) acionando a pipeline da Fase 2.
2. **Endpoint `GET /api/build/status`**:
   - Fazer "Polling" (consultas periódicas) na API do GitHub Actions para descobrir o status atual do Workflow (Enfileirado, Processando, Sucesso, Falha).
   - Capturar o ID do Artefato quando o status for sucesso.

---

## Fase 5: Monitoramento Visual (A Experiência do Usuário)
Refatoração do componente visual `build-modal.tsx`.

1. **Feedback em Tempo Real**:
   - Exibir na tela do usuário a progressão real da esteira baseada nas respostas da Fase 4 com barra de progresso de 0 a 100%.
2. **Logs Transparentes**:
   - Obter os logs do console do GitHub Actions e transmitir para a tela de log preta do modal, para que o usuário sinta que o servidor está compilando e exibir também os erros claros do projeto durante a compilação no log se houver, mas não mostrar informações do github no log para o usuário por segurança.
3. **Entrega Final**:
   - Ao final, disponibilizar o botão de "Download". Esse botão consumirá a API de download de artefatos do GitHub (usando o token) gerando um link seguro e direto para o arquivo final (`app-release.apk`).

---

**Resumo da Arquitetura Futura:**
`[ IDE visual (Web) ]` -> Emite `[ .AIA ]` -> Manda para API do `[ GitHub Actions ]` -> Github sobe o `[ Docker (MIT Build Server) ]` internamente -> Github compila e assina o `[ .APK ]` -> Retorna link do Artefato para a `[ IDE Visual ]`.
