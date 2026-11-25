import type { ReactNode } from 'react'
import type { AsyncState } from '@/hooks/useAsyncData'
import { ErrorState } from './ErrorState'
import { SkeletonLines } from './Skeleton'

interface AsyncViewProps<T> {
  state: AsyncState<T>
  onRetry?: () => void
  skeleton?: ReactNode
  children: (data: T) => ReactNode
}

/** Muestra carga, error o el contenido; conserva el último dato mientras se recarga. */
export function AsyncView<T>({ state, onRetry, skeleton, children }: AsyncViewProps<T>) {
  if (state.data !== undefined) return <>{children(state.data)}</>
  if (state.status === 'error') return <ErrorState message={state.message} onRetry={onRetry} />
  return <>{skeleton ?? <SkeletonLines />}</>
}
