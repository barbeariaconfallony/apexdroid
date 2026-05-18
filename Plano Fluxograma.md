# Plano de Correção e Unificação: BKY ↔ Fluxograma ↔ Kodular

Este plano detalha as etapas necessárias para resolver a quebra de compatibilidade entre o Editor de Blocos (Blockly), o Editor de Fluxograma (Canvas) e o formato nativo do Kodular (`.bky` em XML).

---

## 🛑 O Problema Atual

1. **Formato Incorreto no Editor de Blocos:** O novo Blockly (v12) está configurado por padrão para salvar em formato **JSON**. Quando você edita na aba de Blocos e salva, o arquivo `.bky` é sobrescrito com JSON, o que quebra totalmente o arquivo para o Kodular (que exige XML rigoroso).
2. **Blocos "Burros" (Falta de Mutadores):** Os blocos criados na nossa IDE (`component_event`, `component_method`, etc) foram definidos estaticamente. Quando o Fluxograma gera o XML e injeta tags `<mutation>` e `<value name="ARG0">`, o Blockly tenta ler isso, mas a nossa definição de bloco não sabe o que é uma `mutation` nem tem os "encaixes" (inputs) chamados `ARG0` criados nativamente. Daí o erro: `Ignoring non-existent input ARG0` e `Ignoring non-existent field COMPONENT_SELECTOR`.
3. **Geração Incompleta no Fluxograma:** A lógica atual em `flow-to-bky.ts` gera um XML "parecido" com o Kodular, mas não idêntico, faltando atributos essenciais como `is_generic="false"` nas mutations.

---

## 🛠️ Plano de Ação (Resolução Definitiva)

### Etapa 1: Forçar Salvamento Nativo (XML) na Aba de Blocos
*Objetivo: Parar de poluir os arquivos `.bky` com JSON e voltar ao padrão App Inventor.*
- Editar `components/ide/bky-workspace.tsx`.
- Modificar a função `saveBlocksToScreen` para ignorar `Blockly.serialization.workspaces.save(ws)` (JSON).
- Implementar o método legado: `Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(ws))`.
- Garantir que o prefixo `<xml xmlns="http://www.w3.org/1999/xhtml">` seja sempre incluído corretamente.

### Etapa 2: Implementar "Mutations" Dinâmicas nos Blocos da IDE
*Objetivo: Ensinar o Blockly da nossa IDE a entender o XML do Kodular sem acusar erros no console.*
- Editar `lib/blocks-utils.ts`.
- Para os blocos `component_event`, `component_method`, `component_get` e `component_set`:
  - Adicionar as funções obrigatórias `mutationToDom` e `domToMutation`.
  - No `domToMutation`, fazer com que o bloco leia os atributos (`component_type`, `instance_name`, `event_name` ou `method_name`) direto da tag XML.
  - Para `component_method`, se houver argumentos necessários (analisando o XML), o bloco deve dinamicamente invocar `this.appendValueInput('ARG0')`, `this.appendValueInput('ARG1')`, etc., para criar as portas de encaixe no momento em que o arquivo BKY é carregado.

### Etapa 3: Alinhamento Perfeito do Gerador do Fluxograma
*Objetivo: O arquivo salvo pela aba Fluxograma deve ser 100% igual à stack nativa que você forneceu do BarbeariaConfallony.*
- Editar `lib/flow-to-bky.ts`.
- Injetar IDs aleatórios seguros (`id="n`tGh...`) para os blocos usando um gerador de UUID do Blockly.
- Garantir que a `<mutation>` sempre tenha `is_generic="false"`.
- Assegurar que os nós de Action no fluxograma repassem corretamente as entradas (`ARG0`, `ARG1`) para dentro da tag `<value name="ARGX">`.
- Usar sempre a estrutura: 
  `<field name="COMPONENT_SELECTOR">NomeDoComponente</field>` e não apenas `COMPONENT`.

### Etapa 4: Reparar o Leitor (BKY ↔ Flow)
*Objetivo: Garantir que quando você abrir a tela, o Fluxograma consiga ler as Mutations geradas pelo Kodular.*
- Editar `lib/bky-to-flow.ts`.
- Ajustar o parser de XML (`DOMParser`) para extrair os dados diretamente do `<mutation instance_name="...">` ao invés de buscar apenas pelos `<field>`, garantindo que o nome do componente nunca se perca ao desenhar o nó na tela.

---

**Resumo da Execução:**
Se seguirmos estas 4 etapas, a ponte entre o *Kodular*, a *Aba Blocos* e a *Aba Fluxograma* será definitiva. O arquivo `.bky` transitará entre os 3 ambientes sem corrupções, suportando argumentos completos e estrutura impecável de XML.
