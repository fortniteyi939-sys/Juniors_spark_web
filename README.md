# EduMaster.ai

Plataforma empresarial de aprendizaje inteligente. Estructura base del monorepo (especificación v1.0, sección 15).

- `apps/web`: React 19 + TypeScript + Vite. Incluye el Centro de control (demo portado); ver `apps/web/README.md`
- `apps/api`: Python 3.12+ + FastAPI + Pydantic
- `apps/ml`: PyTorch + MLflow + DVC
- `infra`: Docker, compose, Terraform (opcional), monitoreo
- `docs`: arquitectura, API, diccionario de datos, model cards, runbooks

Reglas clave: TypeScript estricto, routers delgados, migraciones versionadas, y nunca guardar datasets, secretos o modelos grandes en Git (usar DVC y almacenamiento de objetos).
