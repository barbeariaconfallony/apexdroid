import { Zap, Github, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="relative py-16 px-6 border-t border-border/50">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <Image src="/APEX_LOGO.png" alt="APEX DROID" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-bold text-foreground">APEX DROID</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link 
              href="/ide" 
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              IDE
              <ExternalLink className="w-3 h-3" />
            </Link>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground">
            2026 APEX DROID AI. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
