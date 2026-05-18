"use client"

import { useEffect, useState, useCallback, createContext, useContext } from "react"
import { cn } from "@/lib/utils"
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info, 
  Loader2,
  X 
} from "lucide-react"

// Toast types
type ToastType = "success" | "error" | "warning" | "info" | "loading"

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastMessage {
  id: number
  message: string
  type: ToastType
  description?: string
  action?: ToastAction
  duration?: number
  progress?: boolean
}

// Icons for each toast type
const ToastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  loading: Loader2,
}

// Colors for each toast type
const toastStyles = {
  success: "border-success/30 bg-success/10",
  error: "border-destructive/30 bg-destructive/10",
  warning: "border-warning/30 bg-warning/10",
  info: "border-info/30 bg-info/10",
  loading: "border-primary/30 bg-primary/10",
}

const toastIconStyles = {
  success: "text-success",
  error: "text-destructive",
  warning: "text-warning",
  info: "text-info",
  loading: "text-primary animate-spin",
}

interface ToastProps {
  toast: ToastMessage
  onClose: () => void
}

function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(100)
  
  const duration = toast.duration || (toast.type === "loading" ? 0 : 4000)
  const Icon = ToastIcons[toast.type]

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true))

    if (duration > 0) {
      // Progress bar animation
      if (toast.progress !== false) {
        const interval = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev - (100 / (duration / 50))
            return newProgress < 0 ? 0 : newProgress
          })
        }, 50)
        
        // Auto close
        const timer = setTimeout(() => {
          setIsVisible(false)
          setTimeout(onClose, 200)
        }, duration)

        return () => {
          clearTimeout(timer)
          clearInterval(interval)
        }
      } else {
        const timer = setTimeout(() => {
          setIsVisible(false)
          setTimeout(onClose, 200)
        }, duration)
        return () => clearTimeout(timer)
      }
    }
  }, [duration, onClose, toast.progress])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 200)
  }

  return (
    <div 
      className={cn(
        "relative flex items-start gap-3 w-[360px] p-4 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-200",
        toastStyles[toast.type],
        isVisible 
          ? "opacity-100 translate-x-0" 
          : "opacity-0 translate-x-4"
      )}
    >
      {/* Icon */}
      <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", toastIconStyles[toast.type])} />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{toast.message}</p>
        {toast.description && (
          <p className="text-xs text-muted-foreground mt-1">{toast.description}</p>
        )}
        {toast.action && (
          <button 
            onClick={toast.action.onClick}
            className="text-xs font-medium text-primary hover:text-primary-hover mt-2 transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      {toast.type !== "loading" && (
        <button 
          onClick={handleClose}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Progress bar */}
      {duration > 0 && toast.progress !== false && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-border/30 rounded-b-lg overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-50 ease-linear",
              toast.type === "success" && "bg-success",
              toast.type === "error" && "bg-destructive",
              toast.type === "warning" && "bg-warning",
              toast.type === "info" && "bg-info",
              toast.type === "loading" && "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

// Toast Context for global access
interface ToastContextType {
  showToast: (message: string, type?: ToastType, options?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) => number
  updateToast: (id: number, updates: Partial<Omit<ToastMessage, 'id'>>) => void
  dismissToast: (id: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Return fallback that uses global toast
    return {
      showToast: (message: string, type: ToastType = "info", options?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) => 
        showToast(message, type, options),
      updateToast: (id: number, updates: Partial<Omit<ToastMessage, 'id'>>) => 
        updateToast(id, updates),
      dismissToast: (id: number) => dismissToast(id),
    }
  }
  return context
}

// Global toast state
let toastId = 0
let setToastsGlobal: React.Dispatch<React.SetStateAction<ToastMessage[]>> | null = null

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  
  useEffect(() => {
    setToastsGlobal = setToasts
    return () => { setToastsGlobal = null }
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const contextValue: ToastContextType = {
    showToast: (message, type = "info", options) => {
      const id = ++toastId
      setToasts(prev => [...prev.slice(-4), { id, message, type, ...options }])
      return id
    },
    updateToast: (id, updates) => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    },
    dismissToast: (id) => removeToast(id),
  }

  return (
    <ToastContext.Provider value={contextValue}>
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Global functions for backward compatibility
export const showToast = (
  message: string, 
  type: ToastType = "info",
  options?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>
): number => {
  if (setToastsGlobal) {
    const id = ++toastId
    setToastsGlobal(prev => [...prev.slice(-4), { id, message, type, ...options }])
    return id
  }
  return -1
}

export const updateToast = (id: number, updates: Partial<Omit<ToastMessage, 'id'>>) => {
  if (setToastsGlobal) {
    setToastsGlobal(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }
}

export const dismissToast = (id: number) => {
  if (setToastsGlobal) {
    setToastsGlobal(prev => prev.filter(t => t.id !== id))
  }
}

// Convenience functions
export const toast = {
  success: (message: string, options?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) => 
    showToast(message, "success", options),
  error: (message: string, options?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) => 
    showToast(message, "error", options),
  warning: (message: string, options?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) => 
    showToast(message, "warning", options),
  info: (message: string, options?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) => 
    showToast(message, "info", options),
  loading: (message: string, options?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) => 
    showToast(message, "loading", { ...options, duration: 0 }),
  promise: async <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ): Promise<T> => {
    const id = showToast(messages.loading, "loading", { duration: 0 })
    try {
      const result = await promise
      updateToast(id, { message: messages.success, type: "success", duration: 3000 })
      return result
    } catch (error) {
      updateToast(id, { message: messages.error, type: "error", duration: 4000 })
      throw error
    }
  }
}
