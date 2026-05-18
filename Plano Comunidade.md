# Plano de Implementação: Aba Comunidade (APEX DROID)

## 1. Visão Geral e Objetivo
A aba **Comunidade** será o hub central para os desenvolvedores do APEX DROID. O objetivo é criar um espaço moderno e minimalista onde os usuários possam compartilhar conhecimento, discutir soluções de design, pedir ajuda em lógicas de blocos e divulgar seus projetos criados no ecossistema APEX. 

Durante esta fase, a interface funcionará de forma totalmente visual (Frontend), utilizando dados fictícios (Mock Data) robustos e interações locais baseadas em `React State`, permitindo que toda a UI/UX seja finalizada antes da implementação do Backend.

---

## 2. Arquitetura de UI/UX e Estilo Visual
A aba seguirá o design system "Premium" estabelecido pela plataforma (vibrante, backgrounds escuros com sutis gradientes, efeito _glassmorphism_ e animações fluidas).

*   **Paleta de Cores:** Fundo `bg-dot-premium` escuro, cards com efeito vidro (`backdrop-blur` / `bg-card/50`), bordas acentuadas no `hover` (`border-primary/50`).
*   **Tipografia:** Moderna (Inter/Outfit), priorizando legibilidade nas discussões.
*   **Micro-interações:** Efeitos de hover suaves nas postagens, botões de curtir (animando o ícone do coração), transição ao abrir seção de comentários, e *shimmer* ao carregar o feed.

---

## 3. Estrutura de Layout (Grid)
O layout adotará um padrão profissional assimétrico (geralmente 3 colunas em telas grandes), otimizado para foco no conteúdo:

1.  **Menu Lateral Esquerdo (Navegação Rápida):**
    *   Filtros de Feed: "Recentes", "Mais Votados", "Meus Posts".
    *   Categorias/Tópicos: #UX/UI, #Blocos, #Dúvidas, #Showcase, #Atualizações.
2.  **Coluna Central (Feed Principal):**
    *   Criador de Postagem: Caixa rápida "O que você está construindo hoje?" (que expande num modal ou editor rico ao clicar).
    *   Feed de Cards: A lista contínua de postagens da comunidade.
3.  **Coluna Direita (Destaques e Perfil):**
    *   Mini-perfil do usuário logado (foto, nível/badges, stats de posts).
    *   Projetos em Destaque da Semana (Top Showcase).
    *   Membros mais ativos.

---

## 4. Componentes Chave

### 4.1 Card de Postagem (`CommunityPostCard`)
*   **Header:** Avatar do autor, nome de usuário, tempo de postagem (ex: "há 2h") e badge do autor (ex: "PRO", "Moderador").
*   **Corpo:** Título forte, preview de texto com limite de linhas (line-clamp). Se tiver anexo (imagem de projeto/UI ou trecho de blocos SCM), exibir um thumbnail com bordas arredondadas.
*   **Rodapé (Interações):** 
    *   Botão Upvote / Coração (Contador).
    *   Botão Comentários (Contador).
    *   Botão Compartilhar.
    *   Tags utilizadas (ex: `UI Design`, `Ajuda`).

### 4.2 Modal/Visualização de Detalhes (`PostDetailsModal`)
Ao clicar no post, ele abre (seja um modal centralizado enorme com fundo em blur, ou uma navegação lateral deslizante).
*   Conteúdo completo formatado.
*   Lista hierárquica de comentários (com respostas aninhadas).
*   Input inferior para adicionar novo comentário fictício.

### 4.3 Editor de Nova Postagem (`CreatePostComponent`)
*   Campo para título.
*   Textarea rica (ou Markdown simples) para descrição do que o desenvolvedor deseja mostrar/perguntar.
*   Botões para anexar imagem (simulação de upload) e taggear tópicos.

---

## 5. Estrutura de Dados Fictícios (Mock Data)
Para simular o backend e deixar a tela viva, usaremos um arquivo `lib/mock-community.ts` com a seguinte interface:

```typescript
export interface Comment {
  id: string;
  author: { name: string; avatar: string; handle: string };
  content: string;
  createdAt: string;
  likes: number;
}

export interface Post {
  id: string;
  author: { name: string; avatar: string; handle: string; badge?: string };
  title: string;
  content: string;
  imageUrl?: string; // Para showcases ou dúvidas visuais
  tags: string[];
  likes: number;
  comments: Comment[];
  createdAt: string;
  isLikedByMe?: boolean;
}
```

**Exemplos de Conteúdo Fictício a serem gerados:**
1.  **Post de Showcase:** Um usuário mostrando uma tela de Login ultra moderna com fundo em video feita inteiramente com SCM Apex.
2.  **Post de Dúvida:** Um dev perguntando como integrar animações Lottie no carregamento via blocos, contendo print da aba de blocos.
3.  **Post de Atualização/Anúncio:** Perfil oficial do Apex Droid anunciando a chegada da conversão BKY -> Flowchart.

---

## 6. Fases de Implementação (Roadmap Frontend)

*   **Fase 1: Infraestrutura Mock** **[OK]** ✅
    *   Criar arquivos com o modelo de dados e preencher uns 5 ou 6 posts interativos com imagens via URLs públicas (Unsplash ou placeholders estéticos).
*   **Fase 2: Estrutura Geral e Layout da Página** **[OK]** ✅
    *   Na página principal `ProjectsPage`, montar o condicional para exibir a aba "Comunidade" (quando `activeTab === 'community'`).
    *   Criar o grid de 3 colunas utilizando classes do Tailwind (Responsividade).
*   **Fase 3: Construção dos Componentes** **[OK]** ✅
    *   Implementar a Barra Lateral de categorias.
    *   Implementar o Card do Post no Feed.
*   **Fase 4: Interatividade Local** **[OK]** ✅
    *   Utilizar `useState` para as ações: Dar Like (muda a cor do ícone e aumenta o +1), adicionar um Comentário ao array do post clicado.
    *   Fazer o sistema de filtro funcionar (ex: clica em "Blocos", a lista filtra).
*   **Fase 5: Detalhes do Post e Comentários** **[OK]** ✅
    *   Implementar modal de detalhes que abre ao clicar no post.
    *   Sistema de listagem e adição de comentários (simulado).
*   **Fase 6: Polimento e Micro-animações** **[OK]** ✅
    *   Ajustar a suavidade de transições do Framer Motion ou animações padrão do Tailwind.
    *   Verificar o contraste de cores com nosso modo Escuro Premium.
