import { useState, useCallback } from 'react'
import type { ChatMessage } from '@/lib/ide-types'
import { useIDEStore } from '@/lib/ide-store'

interface UseAIChatOptions {
  onMessageReceived?: (message: ChatMessage) => void
  onError?: (error: Error) => void
}

export function useAIChat(options?: UseAIChatOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { aiSettings } = useIDEStore()

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
            context,
            settings: aiSettings
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
          fullText += chunk
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
            projectContext,
            settings: aiSettings
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
            context: 'MIT App Inventor/Kodular',
            settings: aiSettings
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

  const explainBlocks = useCallback(
    async (componentName: string, blocksJson: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/ai/explain-blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            componentName,
            blocks: blocksJson,
            settings: aiSettings
          })
        })

        if (!response.ok) throw new Error(`API error: ${response.status}`)
        const data = await response.json()
        return data.explanation
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        options?.onError?.(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [aiSettings, options]
  )

  const generateScreen = useCallback(
    async (description: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/ai/generate-screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            settings: aiSettings
          })
        })

        if (!response.ok) throw new Error(`API error: ${response.status}`)
        const data = await response.json()
        return data.screen
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        options?.onError?.(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [aiSettings, options]
  )

  return {
    isLoading,
    error,
    sendMessage,
    generateComponent,
    generateScreen,
    debugError,
    explainBlocks,
    clearError: () => setError(null)
  }
}
