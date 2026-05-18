"use client"

import { useState } from "react"
import {
  Heart,
  MessageSquare,
  Share2,
  TrendingUp,
  Clock,
  Hash,
  MessageCircle,
  Image as ImageIcon,
  Send,
  MoreHorizontal,
  Plus,
  X,
  ArrowBigUp,
  ArrowBigDown,
  Search
} from "lucide-react"
import { mockPosts, trendingTags, activeMembers, Post, Comment } from "@/lib/community"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function CommunityPostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const [liked, setLiked] = useState(post.isLikedByMe || false)
  const [likes, setLikes] = useState(post.likes)

  const handleLike = () => {
    if (liked) {
      setLikes(l => l - 1)
      setLiked(false)
    } else {
      setLikes(l => l + 1)
      setLiked(true)
    }
  }

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden bg-gradient-to-br from-primary/[0.08] to-transparent backdrop-blur-md border border-primary/20 rounded-2xl p-5 transition-all hover:border-primary/40 hover:bg-black/20 group cursor-pointer"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
            <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">{post.author.name}</h4>
              {post.author.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">
                  {post.author.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{post.author.handle} • {new Date(post.createdAt).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-3 space-y-2">
        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {post.content}
        </p>
      </div>

      {/* Image Attachment */}
      {post.imageUrl && (
        <div className="mb-4 rounded-lg overflow-hidden border border-border aspect-video bg-muted relative">
          <img src={post.imageUrl} alt="Anexo do post" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-medium border border-border/50">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer / Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-border/50">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-primary",
            liked ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Heart className={cn("w-4 h-4 transition-all", liked && "fill-current scale-110")} />
          <span>{likes}</span>
        </button>

        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          <MessageSquare className="w-4 h-4" />
          <span>{post.comments.length}</span>
        </button>

        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground ml-auto">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function PostDetailsModal({ post, isOpen, onClose }: { post: Post | null; isOpen: boolean; onClose: () => void }) {
  const [commentText, setCommentText] = useState("")
  const [localComments, setLocalComments] = useState<Comment[]>([])

  // Reset local comments when post changes
  useState(() => {
    if (post) setLocalComments(post.comments)
  })

  if (!isOpen || !post) return null

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    const newComment: Comment = {
      id: `comment-new-${Date.now()}`,
      author: {
        name: "Você (Simulação)",
        avatar: "https://i.pravatar.cc/150?u=you",
        handle: "@voce"
      },
      content: commentText,
      createdAt: new Date().toISOString(),
      likes: 0
    }

    setLocalComments([newComment, ...localComments])
    setCommentText("")
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-card border border-border w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden">
              <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">{post.author.name}</h4>
              <p className="text-[10px] text-muted-foreground">{post.author.handle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">{post.title}</h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
            {post.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-border bg-muted">
                <img src={post.imageUrl} alt="Conteúdo" className="w-full h-auto max-h-[500px] object-contain mx-auto" />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comentários ({localComments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-secondary shrink-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                EU
              </div>
              <div className="flex-1 flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Adicione um comentário..."
                  className="bg-secondary/30 border-border h-9 text-sm"
                />
                <Button type="submit" size="sm" className="h-9 px-4">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
              {localComments.length > 0 ? (
                localComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden shrink-0">
                      <img src={comment.author.avatar} alt={comment.author.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{comment.author.name}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <button className="hover:text-primary transition-colors">
                            <ArrowBigUp className="w-4 h-4" />
                          </button>
                          <span className="text-[10px] font-bold">{comment.likes}</span>
                          <button className="hover:text-destructive transition-colors">
                            <ArrowBigDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-muted-foreground italic">Nenhum comentário ainda. Seja o primeiro!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CommunityTab() {
  const [activeFilter, setActiveFilter] = useState("recent")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [newPostText, setNewPostText] = useState("")

  const filteredPosts = mockPosts.filter(post => {
    // Filtro por busca de texto
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !post.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Primeiro filtro por Tag (Tópicos Populares)
    if (selectedTag && !post.tags.includes(selectedTag)) return false

    // Depois filtro por Categoria (Recentes, Em Alta, etc)
    // Para mock, "recent" mostra todos, "my-posts" poderia filtrar pelo handle do user logado
    if (activeFilter === "my-posts") return post.author.handle === "@brunomoreira"

    return true
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">

      {/* Left Sidebar - Navigation & Tags */}
      <div className="hidden md:block md:col-span-3 space-y-6 sticky top-16 self-start">
        <div className="bg-card/30 backdrop-blur-sm border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Feeds</h3>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveFilter("recent")}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                activeFilter === "recent" ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-secondary/50"
              )}
            >
              <Clock className="w-4 h-4" />
              Recentes
            </button>
            <button
              onClick={() => setActiveFilter("trending")}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                activeFilter === "trending" ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-secondary/50"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Em Alta
            </button>
            <button
              onClick={() => setActiveFilter("my-posts")}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                activeFilter === "my-posts" ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-secondary/50"
              )}
            >
              <MessageCircle className="w-4 h-4" />
              Minhas Discussões
            </button>
          </nav>
        </div>

        <div className="bg-card/30 backdrop-blur-sm border border-border rounded-xl p-4">
          <div className="space-y-2">
            {trendingTags.map(tag => (
              <button
                key={tag.name}
                onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
                className={cn(
                  "w-full flex items-center justify-between group px-2 py-1.5 rounded-lg transition-colors",
                  selectedTag === tag.name ? "bg-primary/10 text-primary" : "hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-1.5 text-sm transition-colors">
                  <Hash className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    selectedTag === tag.name ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
                  )} />
                  <span className={cn(selectedTag === tag.name ? "font-semibold" : "text-foreground")}>
                    {tag.name}
                  </span>
                </div>
                <span className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-colors",
                  selectedTag === tag.name ? "bg-primary/20 text-primary" : "text-muted-foreground bg-secondary"
                )}>
                  {tag.count}
                </span>
              </button>
            ))}
            {selectedTag && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTag(null)}
                className="w-full text-[10px] h-7 text-muted-foreground hover:text-primary"
              >
                Limpar Filtro
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Feed Column */}
      <div className="col-span-1 md:col-span-6 space-y-4">
        {/* Search Bar */}
        <div className="sticky top-16 z-20 pb-2 bg-background/50 backdrop-blur-md -mx-1 px-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na comunidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-card/50 backdrop-blur-md border-border/50 rounded-xl text-sm focus-visible:ring-primary/30"
            />
          </div>
        </div>

        {/* Create Post Input (Mock) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/[0.08] to-transparent backdrop-blur-md border border-primary/20 rounded-2xl p-5 shadow-sm">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary shrink-0 overflow-hidden border border-border/50 flex items-center justify-center">
              {/* Fallback avatar */}
              <div className="text-xs font-bold text-muted-foreground">EU</div>
            </div>
            <div className="flex-1 space-y-3">
              <Input
                placeholder="O que você está construindo hoje?"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="bg-secondary/50 border-transparent hover:border-border focus-visible:ring-1 text-sm h-10 cursor-text"
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                    <ImageIcon className="w-4 h-4 mr-1.5" />
                    <span className="text-xs">Mídia</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                    <Hash className="w-4 h-4 mr-1.5" />
                    <span className="text-xs">Tópico</span>
                  </Button>
                </div>
                <Button
                  size="sm"
                  className="h-8 px-4 text-xs font-semibold rounded-full"
                  onClick={() => {
                    if (newPostText.trim()) {
                      setNewPostText("")
                      // Aqui poderíamos adicionar o post à lista mock, mas por enquanto o reset já dá o feedback visual
                    }
                  }}
                >
                  Postar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed Listing */}
        <div className="space-y-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <CommunityPostCard
                key={post.id}
                post={post}
                onClick={() => setSelectedPost(post)}
              />
            ))
          ) : (
            <div className="bg-card/30 border border-dashed border-border rounded-xl p-12 text-center">
              <Hash className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-foreground">Nenhum post encontrado</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery
                  ? `Nenhum resultado para "${searchQuery}"`
                  : `Não existem postagens com a tag #${selectedTag} no momento.`
                }
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSelectedTag(null); setSearchQuery("") }}
                className="mt-4 text-xs h-8"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>

        <PostDetailsModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      </div>

      {/* Right Sidebar - Info & Members */}
      <div className="hidden md:block md:col-span-3 space-y-6 sticky top-16 self-start">
        <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-16 h-16" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">APEX Showcase</h3>
          <p className="text-xs text-muted-foreground mb-4">Compartilhe as interfaces incríveis que você criou com SCM.</p>
          <Button size="sm" variant="outline" className="w-full text-xs h-8 border-primary/30 hover:bg-primary/10">
            Ver Destaques
          </Button>
        </div>

        <div className="bg-card/30 backdrop-blur-sm border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Membros Ativos</h3>
          <div className="space-y-3">
            {activeMembers.map(member => (
              <div key={member.handle} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden shrink-0">
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{member.handle}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
