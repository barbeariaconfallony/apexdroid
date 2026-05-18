# Prompt de Criação: Editor Monaco com Sincronização Automática via GitHub

Este documento descreve as instruções e requisitos utilizados para criar o editor de código profissional integrado ao APEX DROID IDE.

## Prompt de Contexto

"Crie um editor de código profissional utilizando **Monaco Editor** (através da biblioteca `@monaco-editor/react`) para o APEX DROID IDE. O editor deve ser otimizado para manipular arquivos `.scm` (formato JSON) do Kodular/App Inventor, com as seguintes características e funcionalidades:"

### 1. Interface e Estética (Premium Dark Mode)
- **Tema Customizado**: Implemente um tema chamado "apex-dark" com fundo `#0a0a0a` e realce de sintaxe específico para JSON (chaves em azul claro, valores em verde claro, números em âmbar).
- **Layout Responsivo**: O editor deve ocupar todo o espaço disponível, com suporte a modo tela cheia (fullscreen).
- **Barra de Ferramentas (Toolbar)**: Design limpo com ícones da `lucide-react`, tooltips informativos e agrupamento lógico de ferramentas.
- **Barra de Status**: Informações sobre linguagem, encoding, status de sincronização e contador de erros.

### 2. Funcionalidades de Edição de Código
- **Validação Real-time**: Valide o JSON conforme o usuário digita. Se houver erro, exiba marcadores vermelhos (`setModelMarkers`) diretamente no Monaco e um painel de erros clicável na parte inferior.
- **Navegação de Erros**: Ao clicar em um erro no painel inferior, o cursor do editor deve pular automaticamente para a linha e coluna exata do problema.
- **Formatação Automática**: Atalho `Alt+Shift+F` para formatar o JSON utilizando as regras de indentação do editor.
- **Operações de Clipboard**: Botões dedicados e atalhos de teclado para Recortar, Copiar e Colar.
- **Busca e Substituição**: Integração com as ações nativas do Monaco (`actions.find` e `startFindReplaceAction`) via atalhos `Ctrl+F` e `Ctrl+H`.
- **Histórico**: Suporte completo a Desfazer (`Ctrl+Z`) e Refazer (`Ctrl+Y`).

### 3. Inteligência Artificial Integrada
- **Modificar com IA**: Um botão de faísca (`Sparkles`) que abre um modal. O usuário descreve uma alteração (ex: "mude a cor de fundo de todos os botões para vermelho") e o código é enviado para uma API (`/api/ai/modify-code`) que retorna o JSON modificado para o editor.

### 4. Sincronização Automática com GitHub (Core Logic)
- **Serviço de Sync**: Implemente uma integração que detecta alterações e permite salvar diretamente no repositório GitHub do usuário.
- **API Git Data**: A sincronização deve usar as APIs de baixo nível do GitHub para garantir performance:
    1. Obter o SHA do commit mais recente da branch principal (`main` ou `master`).
    2. Criar `Blobs` para o conteúdo dos arquivos.
    3. Criar uma nova `Tree` referenciando os blobs e a base_tree anterior.
    4. Criar um `Commit` com a nova árvore e o commit anterior como parent.
    5. Atualizar a `Ref` (Push) para a branch ativa.
- **Feedback Visual**: O botão de salvar deve indicar o estado de "Salvando..." e exibir notificações (toasts) de sucesso ou erro.

### 5. Ferramentas de Arquivo e Configurações
- **Download Local**: Função para baixar o código atual como um arquivo `.scm`.
- **Configurações do Editor**: Menu dropdown para alternar Quebra de Linha (Word Wrap), exibir/ocultar Minimapa e ajustar o tamanho da fonte dinamicamente.
- **Restauração**: Botão para descartar alterações e voltar à versão original do último salvamento.

---

## Estrutura de Arquivos Referente
- **Componente**: `components/ide/code-editor.tsx` (Interface e Lógica do Editor)
- **API de Sync**: `app/api/github/sync/route.ts` (Comunicação com API do GitHub)
- **Store**: `lib/ide-store.ts` (Estado global do projeto e tokens)
- **Serviço**: `lib/sync/sync-service.ts` (Orquestração do auto-save)

crie um botão "Código" para ficar no lado direito do botão Blocos no header do ide e dentro do badge para abrir o editor