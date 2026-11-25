# apps/web - Centro de control (React 19 + TypeScript + Vite)

Portado desde el demo HTML original (`public/demo/centro-de-control.html`, se conserva sin cambios y
se abre con doble clic, sin instalar nada). Todos los datos son **DEMO** sintéticos.

## Ejecutar

```bash
cd apps/web
npm install
npm run dev        # http://localhost:5173  (el demo original: /demo/centro-de-control.html)
npm run typecheck
npm test
npm run build
```

## Módulos (según la especificación y el manual)

| Menú | Spec | Qué muestra |
|---|---|---|
| Resumen | 4.1, 4.11, 4.12 | KPI con valor, variación, fuente y fecha; filtros (periodo, rol, curso, cohorte, programa); red neuronal; finalización; tendencia; dominio de habilidades; mapa de progreso (solo agregados); recomendaciones; actividad |
| Rutas de aprendizaje | 4.2 | Catálogo con estado y versión, secuencia con prerrequisitos y criterios de logro, historial de cambios |
| Cursos | 4.3 | Búsqueda y filtros, paginación, unidades/lecciones/recursos, versionado y estado de publicación |
| Evaluaciones | 4.6 | Tipos, ponderación, intentos; **nota oficial separada de la estimación IA** |
| Certificados | 4.7 | Folio, estados, plantilla y **verificación pública** con datos mínimos |
| Analítica | 4.4 | Indicadores por curso, definiciones, exportación CSV (XLSX/PDF pendientes del backend) |
| IA Tutor | 4.5 | Motivo, competencia, evidencia, dificultad y objetivo; aceptar/descartar/útil/completar; tasa de aceptación y utilidad |
| Dominio de habilidades | 4.9 | Heatmap, catálogo jerárquico, evidencias con nivel IA vs nivel validado por docente |
| Red neuronal | 4.10, 10.4 | Visualizador demo rotulado y tabla de estados reales |
| Comunidad | 4.8 | Espacios por curso, anuncios/debates, moderación, silenciar |
| Administración | 3, 4.13, 17.1 | Roles, matriz de permisos, usuarios y parámetros (lo no definido figura como pendiente) |
| Auditoría | 11.1 | Eventos por categoría y exportación CSV |

Todos los datos son DEMO (`services/demo/`); los titulares aparecen como seudónimos. El KPI "Calidad del
modelo" muestra N/D porque no existe un modelo validado (la especificación prohíbe publicar cifras sin medición).
Los filtros del Resumen se conservan al cambiar de módulo.

## Conectar el backend

Cada función de `src/services/*.ts` (incluido `moduleService.ts`) indica el endpoint que la reemplaza
(`GET /api/v1/dashboard/summary`, `/analytics/progress`, `/analytics/skill-mastery`,
`/recommendations`, `POST /recommendations/{id}/feedback`). La UI no cambia: solo el cuerpo del servicio.
La topología de la red (`modules/neural-visualizer/neuralTopology.ts`) vendrá de `GET /api/v1/ml/models`.

## Cambios respecto al demo original

- Pulsos de la red rotulados como simulación (la especificación prohíbe sugerir actividad real sin eventos).
- Estados de carga, vacío y error; salto al contenido; `aria-pressed`; leyendas con porcentajes y tooltips.
- Animación detenida si el usuario prefiere movimiento reducido; sin parpadeo de nodos cuando está en pausa.
- Datos DEMO deterministas por filtro (antes cambiaban con `Math.random()` en cada render).
- Exportación CSV con celdas entrecomilladas (en `es-PE` los miles llevan coma y rompían el CSV) y BOM para Excel.
- Pendiente: navegación compacta en móvil (hoy la barra lateral se oculta bajo 800 px, igual que el demo).
