"use client"

import React from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[v0] ErrorBoundary caught:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback 
          error={this.state.error} 
          onReset={this.handleReset} 
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
interface ErrorFallbackProps {
  error: Error | null
  onReset?: () => void
  title?: string
  description?: string
}

export function ErrorFallback({ 
  error, 
  onReset,
  title = "Algo deu errado",
  description = "Ocorreu um erro inesperado. Tente novamente."
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      
      {error && process.env.NODE_ENV === "development" && (
        <div className="w-full max-w-md mb-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
          <p className="text-xs font-mono text-destructive text-left break-all">
            {error.message}
          </p>
        </div>
      )}
      
      <div className="flex gap-2">
        {onReset && (
          <Button variant="default" size="sm" onClick={onReset} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.href = "/"}
          className="gap-2"
        >
          <Home className="w-4 h-4" />
          Voltar ao inicio
        </Button>
      </div>
    </div>
  )
}

// Inline error for smaller areas
interface InlineErrorProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div className={`flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg ${className}`}>
      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
      <p className="text-xs text-destructive flex-1">{message}</p>
      {onRetry && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRetry}
          className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  )
}
