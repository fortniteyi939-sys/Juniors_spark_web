import { useCallback, useEffect, useState } from 'react'

export interface AsyncState<T> {
  status: 'loading' | 'ready' | 'error'
  /** Último dato válido; se conserva mientras se recarga para evitar parpadeos. */
  data?: T
  message?: string
}

/** Carga datos asíncronos con estados loading / ready / error y cancelación al desmontar. */
export function useAsyncData<T>(
  load: () => Promise<T>,
  deps: readonly unknown[],
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ status: 'loading', data: prev.data }))
    load().then(
      (data) => {
        if (!cancelled) setState({ status: 'ready', data })
      },
      (error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Error desconocido'
        setState((prev) => ({ status: 'error', message, data: prev.data }))
      },
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, reload }
}
