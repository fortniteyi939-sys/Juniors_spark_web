FROM python:3.12-slim
# Versión a fijar al iniciar el repositorio (spec sección 19).
RUN pip install --no-cache-dir mlflow psycopg2-binary boto3
EXPOSE 5000
