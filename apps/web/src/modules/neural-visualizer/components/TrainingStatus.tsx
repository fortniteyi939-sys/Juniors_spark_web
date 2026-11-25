import { MAX_EPOCH, MODEL_META } from '../neuralTopology'

interface TrainingStatusProps {
  epoch: number
  /** Pérdida actual; null cuando no hay entrenamiento en curso. */
  loss: number | null
}

/** Panel de estado: modelo, versión, dataset, época y loss (spec 4.10). */
export function TrainingStatus({ epoch, loss }: TrainingStatusProps) {
  return (
    <div className="st">
      <div>
        Modelo<b>{MODEL_META.name}</b>
      </div>
      <div>
        Versión<b>{MODEL_META.version}</b>
      </div>
      <div>
        Dataset<b>{MODEL_META.dataset}</b>
      </div>
      <div>
        Época
        <b>
          {epoch} / {MAX_EPOCH}
        </b>
      </div>
      <div>
        Loss<b>{loss === null ? '—' : loss.toFixed(3)}</b>
      </div>
    </div>
  )
}
