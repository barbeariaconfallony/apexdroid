import { useState, useCallback } from 'react'
import type { ChatMessage } from '@/lib/ide-types'

interface UseAIChatOptions {
  onMessageReceived?: (message: ChatMessage) => void
  onError?: (error: Error) => void
}

export function useAIChat(options?: UseAIChatOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const sendMessage = useCallback(
    async (
      messages: ChatMessage[],
      context?: string
    ): Promise<string> => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            context
          })
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('0:')) {
              const jsonStr = line.slice(2)
              try {
                const data = JSON.parse(jsonStr)
                if (data.type === 'text') {
                  fullText += data.value
                }
              } catch (e) {
                // Ignorar erros de parse
              }
            }
          }
        }

        return fullText
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        options?.onError?.(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [options]
  )

  const generateComponent = useCallback(
    async (description: string, projectContext?: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/ai/generate-component', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            projectContext
          })
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }

        return data.component
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        options?.onError?.(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [options]
  )

  const debugError = useCallback(
    async (errorMessage: string, componentName?: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/ai/debug', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: errorMessage,
            componentName,
            context: 'MIT App Inventor/Kodular'
          })
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }

        return data.analysis
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        options?.onError?.(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [options]
  )

  return {
    isLoading,
    error,
    sendMessage,
    generateComponent,
    debugError,
    clearError: () => setError(null)
  }
}
