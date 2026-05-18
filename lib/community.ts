export interface Comment {
  id: string;
  author: { 
    name: string; 
    avatar: string; 
    handle: string 
  };
  content: string;
  createdAt: string;
  likes: number;
}

export interface Post {
  id: string;
  author: { 
    name: string; 
    avatar: string; 
    handle: string; 
    badge?: string 
  };
  title: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  createdAt: string;
  isLikedByMe?: boolean;
}

export const mockPosts: Post[] = [
  {
    id: "post-1",
    author: {
      name: "Bruno Moreira",
      avatar: "https://i.pravatar.cc/150?u=bruno",
      handle: "@brunomoreira",
      badge: "Criador"
    },
    title: "Nova atualização! Sincronização BKY -> Flowchart",
    content: "Fala pessoal! Acabamos de liberar a nova versão do APEX DROID com sincronização bidirecional completa entre os blocos (BKY) e o Flowchart. O que acharam dessa novidade? Ainda estamos polindo alguns cantos, mas a produtividade deve aumentar bastante!",
    tags: ["Atualizações", "Blocos"],
    likes: 124,
    createdAt: "2026-05-14T10:30:00Z",
    comments: [
      {
        id: "comment-1",
        author: {
          name: "Carlos Dev",
          avatar: "https://i.pravatar.cc/150?u=carlos",
          handle: "@carlosdev"
        },
        content: "Sensacional! Isso vai poupar muitas horas de refatoração.",
        createdAt: "2026-05-14T11:05:00Z",
        likes: 12
      }
    ]
  },
  {
    id: "post-2",
    author: {
      name: "Ana Silva",
      avatar: "https://i.pravatar.cc/150?u=ana",
      handle: "@anasilva",
      badge: "PRO"
    },
    title: "Showcase: Tela de Login em Glassmorphism",
    content: "Queria compartilhar a tela de login que fiz ontem à noite usando 100% componentes nativos do SCM através do APEX DROID. O efeito de vidro ficou incrivelmente leve no celular!",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
    tags: ["Showcase", "UX/UI"],
    likes: 89,
    createdAt: "2026-05-13T18:20:00Z",
    comments: []
  },
  {
    id: "post-3",
    author: {
      name: "Lucas Fernandes",
      avatar: "https://i.pravatar.cc/150?u=lucas",
      handle: "@lucasfer"
    },
    title: "Dúvida com Loops e Arrays no Editor de Blocos",
    content: "Alguém pode me ajudar? Estou tentando iterar sobre uma lista de usuários para gerar cards dinâmicos na tela, mas o bloco 'For Each' parece estar rodando de forma assíncrona. Como garantir que os dados renderizem antes da próxima tela carregar?",
    tags: ["Dúvidas", "Blocos"],
    likes: 15,
    createdAt: "2026-05-12T09:15:00Z",
    comments: [
      {
        id: "comment-2",
        author: {
          name: "Julia Tech",
          avatar: "https://i.pravatar.cc/150?u=julia",
          handle: "@juliatech",
          badge: "Ajudante"
        },
        content: "Usa o bloco de procedimento com retorno para esperar o processamento interno, ou atrela a geração ao evento 'On Element Rendered' ao invés de colocar tudo no Initialize da tela.",
        createdAt: "2026-05-12T10:00:00Z",
        likes: 8
      }
    ]
  },
  {
    id: "post-4",
    author: {
      name: "Pedro Alves",
      avatar: "https://i.pravatar.cc/150?u=pedro",
      handle: "@pedroalves"
    },
    title: "Quais paletas de cores vocês mais usam para Dark Mode?",
    content: "Estou construindo um app de finanças e queria fugir do clássico preto/cinza. Alguém tem dicas de paletas de cores escuras que dão uma sensação mais 'premium'?",
    tags: ["UX/UI"],
    likes: 42,
    createdAt: "2026-05-11T14:40:00Z",
    comments: []
  },
  {
    id: "post-5",
    author: {
      name: "Marta Rocha",
      avatar: "https://i.pravatar.cc/150?u=marta",
      handle: "@martarocha",
      badge: "PRO"
    },
    title: "Integração via API REST em 5 passos",
    content: "Fiz um mini-tutorial de como estou integrando a API RESTful de pagamentos usando os blocos de Web request do APEX. Segue a estrutura da lógica de blocos que montei. Se precisarem do AIA base, me avisem nos comentários!",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop",
    tags: ["Tutoriais", "Dicas", "Blocos"],
    likes: 215,
    createdAt: "2026-05-10T16:00:00Z",
    comments: []
  }
];

export const trendingTags = [
  { name: "UX/UI", count: 124 },
  { name: "Blocos", count: 98 },
  { name: "Dúvidas", count: 85 },
  { name: "Showcase", count: 64 },
  { name: "Atualizações", count: 32 }
];

export const activeMembers = [
  { name: "Ana Silva", avatar: "https://i.pravatar.cc/150?u=ana", handle: "@anasilva" },
  { name: "Marta Rocha", avatar: "https://i.pravatar.cc/150?u=marta", handle: "@martarocha" },
  { name: "Julia Tech", avatar: "https://i.pravatar.cc/150?u=julia", handle: "@juliatech" }
];
