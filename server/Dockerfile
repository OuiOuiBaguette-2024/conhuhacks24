FROM python:3.12-slim
LABEL maintainer="oui oui baguette"
LABEL org.opencontainers.image.description "FastAPI backend for Volt"

WORKDIR /app
COPY . .
RUN pip install --no-cache-dir --upgrade -r requirements.txt
EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]