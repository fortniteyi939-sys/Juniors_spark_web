interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="empty err" role="alert">
      <strong>No se pudieron cargar los datos</strong>
      {message ? <p>{message}</p> : null}
      {onRetry ? (
        <button type="button" className="btn g sm" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  )
}
