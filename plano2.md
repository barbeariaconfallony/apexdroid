# Plano de Implementação: Sincronização SCM/BKY e Otimização de Performance

Este plano foca em transformar o editor de blocos em uma ferramenta leve, profissional e totalmente sincronizada com a estrutura de componentes do projeto (arquivos .scm e .bky).

---

## 1. Sincronização Inteligente SCM -> Blockly
O objetivo é que o editor de blocos "conheça" os componentes que você adicionou na tela.

- [ ] **Mapeamento de Componentes Ativos**:
    - Criar um hook que monitora o `currentProject` e extrai todos os nomes e tipos de componentes.
- [ ] **Geração Dinâmica de Toolbox**:
    - Substituir o XML estático por um gerador dinâmico que cria gavetas (drawers) para cada componente (ex: Gaveta "Botão1" contendo eventos `Click`, `LongClick` e setters de propriedades).
- [ ] **Blocos Customizados Kodular**:
    - Definir as definições de blocos (JSON) para os eventos e métodos padrão do Kodular/App Inventor para garantir compatibilidade com arquivos .bky reais.

## 2. Persistência de Lógica (.bky)
Garantir que os blocos sejam salvos e carregados do GitHub corretamente.

- [ ] **Conversor Blockly XML <-> BKY**:
    - Implementar a lógica de leitura do XML vindo do arquivo `.bky` e injeção no workspace.
    - Implementar o "Auto-Save" com *debounce* (esperar 2 segundos após a última alteração) para exportar o XML e atualizar o `IDEStore`.

## 3. Otimização de Performance (Editor Ultra-Light)
Resolver os travamentos e tornar o editor extremamente fluido.

- [ ] **Migração para Biblioteca Nativa**:
    - Substituir o carregamento via CDN (Script Tag) pelo pacote NPM `@blockly/core` para evitar re-downloads e instabilidades.
- [ ] **Renderizador "Fast Mode"**:
    - Desabilitar sombras complexas, animações de conexão e efeitos de gradiente nos blocos.
    - Utilizar o `SimpleRenderer` do Blockly se disponível para reduzir o uso de CPU/GPU.
- [ ] **Gerenciamento de Memória**:
    - Implementar o descarte correto (`workspace.dispose()`) ao alternar entre as abas Design e Blocos para evitar vazamentos de memória.
- [ ] **Unificação de UI**:
    - Substituir o mockup simplificado do `BlocksEditor.tsx` pela instância real do `BkyWorkspace.tsx`, garantindo uma única interface de alta performance.

---

## Próximos Passos Sugeridos:
1. Instalar dependências do Blockly via NPM.
2. Criar a função `generateDynamicToolbox` em `lib/blocks-utils.ts`.
3. Atualizar o `BkyWorkspace.tsx` para usar o gerador dinâmico.
