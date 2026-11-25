interface SkeletonProps {
  height?: number
  width?: number | string
  circle?: boolean
}

export function Skeleton({ height = 14, width = '100%', circle = false }: SkeletonProps) {
  return (
    <div
      className={circle ? 'skeleton circle' : 'skeleton'}
      style={{ height, width: circle ? height : width }}
      aria-hidden="true"
    />
  )
}

export function SkeletonLines({ lines = 3, height = 54 }: { lines?: number; height?: number }) {
  return (
    <div className="skel-lines" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </div>
  )
}
